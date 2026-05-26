"""
Matching router
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_authenticated
from app.exceptions import ForbiddenError, NotFoundError
from app.models.user import User
from app.models.matching import Match
from app.schemas.matching import (
    MatchResponse,
    BuilderSelectConfirmRequest,
    BuilderSelectInitiateResponse,
    MatchConnectionEventResponse,
)
from app.services.landowner_service import LandownerService
from app.services.professional_service import ProfessionalService
from app.services.matching_service import MatchingService
from app.services.payment_service import PaymentService
from app.utils.constants import Role, TransactionType

router = APIRouter(prefix="/matching", tags=["Matching"])
payment_service = PaymentService()


async def _ensure_project_owned_by_user(db: AsyncSession, project_id: UUID, user_id: UUID) -> None:
    """Raise ForbiddenError if the project is not owned by the given user (landowner)."""
    try:
        profile = await LandownerService.get_profile(db, user_id)
    except NotFoundError:
        raise ForbiddenError("Landowner profile required to view project matches.")
    try:
        await LandownerService.get_project(db, project_id, profile.id)
    except NotFoundError:
        raise ForbiddenError("Project not found or you do not have access.")


async def _ensure_professional_owned_by_user(db: AsyncSession, professional_id: UUID, user_id: UUID) -> None:
    """Raise ForbiddenError if the professional profile is not owned by the given user."""
    try:
        profile = await ProfessionalService.get_profile(db, user_id)
    except NotFoundError:
        raise ForbiddenError("Professional profile required to view matches.")
    if str(profile.id) != str(professional_id):
        raise ForbiddenError("You can only view matches for your own professional profile.")


def _ensure_user_can_act_on_match(match: Match, user_id: UUID) -> None:
    """Ensure current user is either the landowner of the project or the professional. Match must be loaded with project.property.landowner and professional."""
    landowner = match.project.property.landowner if match.project and match.project.property else None
    if landowner and landowner.user_id == user_id:
        return
    if match.professional and match.professional.user_id == user_id:
        return
    raise ForbiddenError("Only the landowner or the professional for this match can accept or reject it.")


@router.get("/projects/{project_id}/matches", response_model=List[MatchResponse])
async def get_project_matches(
    project_id: UUID,
    limit: int = 5,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Get matched professionals for a project (algorithm returns up to 5 matches). Only the project owner can view."""
    await _ensure_project_owned_by_user(db, project_id, current_user.id)
    matches = await MatchingService.get_project_matches(db, project_id, limit)
    return matches


@router.get("/professionals/{professional_id}/projects", response_model=List[MatchResponse])
async def get_professional_matches(
    professional_id: UUID,
    limit: int = 10,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Get matched projects for a professional. Only the profile owner can view."""
    await _ensure_professional_owned_by_user(db, professional_id, current_user.id)
    matches = await MatchingService.get_professional_matches(db, professional_id, limit)
    return matches


@router.post("/matches/{match_id}/accept", response_model=MatchResponse)
async def accept_match(
    match_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Accept a match. Only the landowner or the professional for this match can accept."""
    match = await MatchingService.get_match_by_id(db, match_id)
    _ensure_user_can_act_on_match(match, current_user.id)
    match = await MatchingService.accept_match(db, match_id)
    return match


@router.post("/matches/{match_id}/reject", response_model=MatchResponse)
async def reject_match(
    match_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db)
):
    """Reject a match. Only the landowner or the professional for this match can reject."""
    match = await MatchingService.get_match_by_id(db, match_id)
    _ensure_user_can_act_on_match(match, current_user.id)
    match = await MatchingService.reject_match(db, match_id)
    return match


@router.post("/matches/{match_id}/landowner-select", response_model=MatchConnectionEventResponse)
async def landowner_select_match(
    match_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db),
):
    """Landowner confirms builder selection; sends contact emails immediately."""
    match = await MatchingService.get_match_by_id(db, match_id)
    _ensure_user_can_act_on_match(match, current_user.id)
    if current_user.role != Role.LANDOWNER:
        raise ForbiddenError("Only landowner can use landowner-select action.")

    updated, email_dispatched = await MatchingService.landowner_express_interest(db, match_id)
    return MatchConnectionEventResponse(
        match=MatchResponse.model_validate(updated),
        selection_side="landowner",
        payment_required=False,
        payment_status=None,
        payment_transaction_id=None,
        email_dispatched=email_dispatched,
    )


@router.post("/matches/{match_id}/landowner-clear-selection", response_model=MatchResponse)
async def landowner_clear_selection(
    match_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db),
):
    """Landowner withdraws builder selection so they can confirm again (e.g. re-test notification email)."""
    match = await MatchingService.get_match_by_id(db, match_id)
    _ensure_user_can_act_on_match(match, current_user.id)
    if current_user.role != Role.LANDOWNER:
        raise ForbiddenError("Only landowner can clear landowner selection.")
    updated = await MatchingService.landowner_clear_selection(db, match_id)
    return MatchResponse.model_validate(updated)


@router.post("/matches/{match_id}/builder-select-initiate", response_model=BuilderSelectInitiateResponse)
async def builder_select_initiate(
    match_id: UUID,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db),
):
    """Builder starts paid selection flow by creating payment order."""
    match = await MatchingService.get_match_by_id(db, match_id)
    _ensure_user_can_act_on_match(match, current_user.id)
    if current_user.role != Role.PROFESSIONAL:
        raise ForbiddenError("Only professionals can initiate builder selection.")

    amount = MatchingService.get_builder_connect_fee_from_match(match)
    order = await payment_service.create_order(
        db=db,
        user_id=current_user.id,
        amount=amount,
        transaction_type=TransactionType.BUILDER_MATCH_SELECTION,
        project_id=match.project_id,
        match_id=match.id,
        currency="INR",
        expected_amount=amount,
    )
    refreshed = await MatchingService.get_match_by_id(db, match_id)
    return BuilderSelectInitiateResponse(
        match=MatchResponse.model_validate(refreshed),
        transaction_id=order["transaction_id"],
        order_id=order["order_id"],
        amount=order["amount"],
        currency=order["currency"],
        razorpay_key_id=order.get("razorpay_key_id"),
    )


@router.post("/matches/{match_id}/builder-select-confirmed", response_model=MatchConnectionEventResponse)
async def builder_select_confirmed(
    match_id: UUID,
    payload: BuilderSelectConfirmRequest,
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db),
):
    """Finalize builder selection after successful payment verification/webhook."""
    match = await MatchingService.get_match_by_id(db, match_id)
    _ensure_user_can_act_on_match(match, current_user.id)
    if current_user.role != Role.PROFESSIONAL:
        raise ForbiddenError("Only professionals can confirm builder selection.")

    updated, email_dispatched = await MatchingService.builder_express_interest_after_payment(
        db,
        match_id,
        payload.transaction_id,
    )
    return MatchConnectionEventResponse(
        match=MatchResponse.model_validate(updated),
        selection_side="builder",
        payment_required=True,
        payment_status="SUCCESS",
        payment_transaction_id=payload.transaction_id,
        email_dispatched=email_dispatched,
    )


