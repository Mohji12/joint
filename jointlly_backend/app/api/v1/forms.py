"""
Forms router: marketplace form submissions (builder & landowner).
Accepts form data and stores in form_submissions with S3 image URLs in payload.
"""
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_optional_user, require_professional
from app.exceptions import ForbiddenError, NotFoundError
from app.models.form_submission import FormSubmission
from app.models.user import User
from app.schemas.forms import (
    BuilderJointVentureSubmit,
    BuilderContractConstructionSubmit,
    BuilderInteriorSubmit,
    BuilderReconstructionSubmit,
    LandownerJointVentureSubmit,
    LandownerContractConstructionSubmit,
    LandownerInteriorSubmit,
    LandownerReconstructionSubmit,
    FormSubmissionResponse,
    FormSubmissionDetailResponse,
    BuilderPortfolioLatestResponse,
    BuilderFormPayloadUpdate,
)
from app.services.form_service import create_form_submission

router = APIRouter(prefix="/forms", tags=["Forms"])


def _payload_from_builder_jv(body: BuilderJointVentureSubmit) -> Dict[str, Any]:
    data = body.model_dump()
    data["type"] = "joint-venture"
    return data


def _payload_from_builder_contract(body: BuilderContractConstructionSubmit) -> Dict[str, Any]:
    data = body.model_dump()
    data["type"] = "contract-construction"
    return data


def _payload_from_landowner_jv(body: LandownerJointVentureSubmit) -> Dict[str, Any]:
    data = body.model_dump(exclude_none=False)
    data["type"] = "joint-venture"
    return data


def _payload_from_landowner_contract(body: LandownerContractConstructionSubmit) -> Dict[str, Any]:
    data = body.model_dump(exclude_none=False)
    data["type"] = "contract-construction"
    return data


@router.post("/builder/joint-venture", response_model=FormSubmissionResponse)
async def submit_builder_joint_venture(
    body: BuilderJointVentureSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit builder JV/JD form. Upload images to S3 first and pass public_urls in recent_projects[].image_urls."""
    payload = _payload_from_builder_jv(body)
    submission = await create_form_submission(
        db, form_type="joint-venture", side="builder", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="joint-venture",
        side="builder",
    )


@router.post("/builder/contract-construction", response_model=FormSubmissionResponse)
async def submit_builder_contract_construction(
    body: BuilderContractConstructionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit builder contract construction form. Upload images to S3 first and pass URLs in project_image_urls."""
    payload = _payload_from_builder_contract(body)
    submission = await create_form_submission(
        db, form_type="contract-construction", side="builder", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="contract-construction",
        side="builder",
    )


@router.get(
    "/builder/contract-construction/latest",
    response_model=Optional[FormSubmissionDetailResponse],
)
async def get_latest_builder_contract_construction(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_professional),
):
    """Get latest contract-construction form submission for current builder."""
    result = await db.execute(
        select(FormSubmission)
        .where(
            FormSubmission.side == "builder",
            FormSubmission.form_type == "contract-construction",
            FormSubmission.user_id == current_user.id.hex,
        )
        .order_by(FormSubmission.created_at.desc())
        .limit(1)
    )
    submission = result.scalar_one_or_none()
    if not submission:
        return None
    return FormSubmissionDetailResponse(
        id=str(submission.id),
        form_type=submission.form_type,
        side=submission.side,
        payload=submission.payload or {},
        created_at=submission.created_at,
    )


def _submission_to_detail(submission: FormSubmission) -> FormSubmissionDetailResponse:
    return FormSubmissionDetailResponse(
        id=str(submission.id),
        form_type=submission.form_type,
        side=submission.side,
        payload=submission.payload or {},
        created_at=submission.created_at,
    )


@router.get(
    "/builder/portfolio/latest",
    response_model=BuilderPortfolioLatestResponse,
)
async def get_latest_builder_portfolio(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_professional),
):
    """Latest submission per builder form type (contract, JV/JD, interior, renovation/repaint)."""
    result = await db.execute(
        select(FormSubmission)
        .where(
            FormSubmission.side == "builder",
            FormSubmission.user_id == current_user.id.hex,
            FormSubmission.form_type.in_(
                [
                    "contract-construction",
                    "joint-venture",
                    "interior",
                    "reconstruction",
                ]
            ),
        )
        .order_by(FormSubmission.created_at.desc())
    )
    rows = list(result.scalars().all())
    latest_by_type: Dict[str, FormSubmission] = {}
    for row in rows:
        if row.form_type not in latest_by_type:
            latest_by_type[row.form_type] = row

    return BuilderPortfolioLatestResponse(
        contract_construction=_submission_to_detail(latest_by_type["contract-construction"])
        if latest_by_type.get("contract-construction")
        else None,
        joint_venture=_submission_to_detail(latest_by_type["joint-venture"])
        if latest_by_type.get("joint-venture")
        else None,
        interior=_submission_to_detail(latest_by_type["interior"])
        if latest_by_type.get("interior")
        else None,
        renovation_repaint=_submission_to_detail(latest_by_type["reconstruction"])
        if latest_by_type.get("reconstruction")
        else None,
    )


@router.patch(
    "/builder/submissions/{submission_id}",
    response_model=FormSubmissionDetailResponse,
)
async def patch_builder_form_submission(
    submission_id: str,
    body: BuilderFormPayloadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_professional),
):
    """Update payload for a builder form submission (must belong to current user)."""
    result = await db.execute(select(FormSubmission).where(FormSubmission.id == submission_id))
    submission = result.scalar_one_or_none()
    if submission is None:
        raise NotFoundError("Form submission", submission_id)
    if submission.side != "builder" or submission.user_id != current_user.id.hex:
        raise ForbiddenError("You cannot update this submission")
    submission.payload = body.payload
    await db.commit()
    await db.refresh(submission)
    return _submission_to_detail(submission)


@router.post("/landowner/joint-venture", response_model=FormSubmissionResponse)
async def submit_landowner_joint_venture(
    body: LandownerJointVentureSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit landowner JV/JD form."""
    payload = _payload_from_landowner_jv(body)
    submission = await create_form_submission(
        db, form_type="joint-venture", side="landowner", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="joint-venture",
        side="landowner",
    )


@router.post("/landowner/contract-construction", response_model=FormSubmissionResponse)
async def submit_landowner_contract_construction(
    body: LandownerContractConstructionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit landowner contract construction form."""
    payload = _payload_from_landowner_contract(body)
    submission = await create_form_submission(
        db, form_type="contract-construction", side="landowner", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="contract-construction",
        side="landowner",
    )


def _payload_from_landowner_interior(body: LandownerInteriorSubmit) -> Dict[str, Any]:
    data = body.model_dump(exclude_none=True)
    data["type"] = "interior"
    return data


def _payload_from_landowner_reconstruction(body: LandownerReconstructionSubmit) -> Dict[str, Any]:
    data = body.model_dump(exclude_none=True)
    data["type"] = "reconstruction"
    return data


def _payload_from_builder_interior(body: BuilderInteriorSubmit) -> Dict[str, Any]:
    data = body.model_dump(exclude_none=True)
    data["type"] = "interior"
    return data


def _payload_from_builder_reconstruction(body: BuilderReconstructionSubmit) -> Dict[str, Any]:
    data = body.model_dump(exclude_none=True)
    data["type"] = "reconstruction"
    return data


@router.post("/landowner/interior", response_model=FormSubmissionResponse)
async def submit_landowner_interior(
    body: LandownerInteriorSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit landowner interior form."""
    payload = _payload_from_landowner_interior(body)
    submission = await create_form_submission(
        db, form_type="interior", side="landowner", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="interior",
        side="landowner",
    )


@router.post("/landowner/reconstruction", response_model=FormSubmissionResponse)
async def submit_landowner_reconstruction(
    body: LandownerReconstructionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit landowner reconstruction form."""
    payload = _payload_from_landowner_reconstruction(body)
    submission = await create_form_submission(
        db, form_type="reconstruction", side="landowner", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="reconstruction",
        side="landowner",
    )


@router.post("/builder/interior", response_model=FormSubmissionResponse)
async def submit_builder_interior(
    body: BuilderInteriorSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit builder interior form."""
    payload = _payload_from_builder_interior(body)
    submission = await create_form_submission(
        db, form_type="interior", side="builder", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="interior",
        side="builder",
    )


@router.post("/builder/reconstruction", response_model=FormSubmissionResponse)
async def submit_builder_reconstruction(
    body: BuilderReconstructionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Submit builder reconstruction form."""
    payload = _payload_from_builder_reconstruction(body)
    submission = await create_form_submission(
        db, form_type="reconstruction", side="builder", payload=payload, user_id=current_user.id if current_user else None
    )
    return FormSubmissionResponse(
        id=str(submission.id),
        form_type="reconstruction",
        side="builder",
    )
