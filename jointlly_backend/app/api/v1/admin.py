"""
Admin API router. All endpoints require ADMIN role.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.schemas.admin import (
    UserListResponse,
    LandownerListResponse,
    LandownerDetailResponse,
    ProjectWithJVResponse,
    ProfessionalListResponse,
    ProfessionalDetailResponse,
    FormSubmissionListResponse,
    AdminStatsResponse,
    AdminConnectionResponse,
    AdminUser360Response,
    AdminMatchSummary,
    AdminTransactionSummary,
    AdminSupportTicketSummary,
    AdminLoginEventResponse,
    AdminSupportTicketListItem,
    AdminSupportTicketDetail,
    AdminSupportTicketUpdateRequest,
    AdminTransactionListItem,
    AdminTransactionUpdateRequest,
    AdminProfessionalApprovalRequest,
    AdminProfessionalApprovalResponse,
    AdminBuilderExportRecordResponse,
    AdminChangePasswordRequest,
    AdminProfessionalProfileUpdate,
    AdminBuilderFormPayloadUpdate,
    AdminFormPayloadUpdate,
)
from app.schemas.auth import MessageResponse
from app.schemas.forms import BuilderPortfolioLatestResponse, FormSubmissionDetailResponse
from app.schemas.landowner import (
    LandownerProfileResponse,
    PropertyResponse,
    ProjectResponse,
    JVPreferencesResponse,
)
from app.schemas.professional import (
    ProfessionalProfileResponse,
    CapabilityResponse,
    LicenseResponse,
    PortfolioResponse,
    PricingTierResponse,
)
from app.services.admin_service import AdminService
from app.services.admin_export_service import AdminExportService

router = APIRouter(prefix="/admin", tags=["Admin"])


def _project_with_jv(proj) -> ProjectWithJVResponse:
    """Build ProjectWithJVResponse from ORM Project with jv_preferences loaded."""
    data = ProjectResponse.model_validate(proj).model_dump()
    data["jv_preferences"] = (
        JVPreferencesResponse.model_validate(proj.jv_preferences)
        if proj.jv_preferences
        else None
    )
    return ProjectWithJVResponse(**data)


@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard stats: users, landowners, professionals, projects, form submissions."""
    stats = await AdminService.get_admin_stats(db)
    return AdminStatsResponse(**stats)


@router.get("/users", response_model=List[UserListResponse])
async def list_users(
    role: Optional[str] = Query(None, description="Filter by role: LANDOWNER or PROFESSIONAL"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List all users. Optional role filter."""
    from app.utils.constants import Role
    role_enum = None
    if role:
        if role not in (Role.LANDOWNER.value, Role.PROFESSIONAL.value):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="role must be LANDOWNER or PROFESSIONAL",
            )
        role_enum = Role(role)
    users = await AdminService.list_users(db, role=role_enum, skip=skip, limit=limit)
    return [UserListResponse.model_validate(u) for u in users]


@router.get("/users/{user_id}/360", response_model=AdminUser360Response)
async def get_user_360(
    user_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """User 360: end-to-end snapshot for a single user."""
    detail = await AdminService.get_user_360(db, user_id)
    # Reuse existing response types where possible
    landowner_projects = [_project_with_jv(p) for p in (detail.get("landowner_projects") or [])]
    return AdminUser360Response(
        user=UserListResponse.model_validate(detail["user"]),
        last_login_at=detail.get("last_login_at"),
        login_events=[AdminLoginEventResponse.model_validate(x) for x in (detail.get("login_events") or [])],
        landowner_profile=LandownerProfileResponse.model_validate(detail["landowner_profile"])
        if detail.get("landowner_profile")
        else None,
        landowner_properties=[PropertyResponse.model_validate(p) for p in (detail.get("landowner_properties") or [])],
        landowner_projects=landowner_projects,
        professional_profile=ProfessionalProfileResponse.model_validate(detail["professional_profile"])
        if detail.get("professional_profile")
        else None,
        professional_capabilities=[CapabilityResponse.model_validate(c) for c in (detail.get("professional_capabilities") or [])],
        professional_licenses=[LicenseResponse.model_validate(l) for l in (detail.get("professional_licenses") or [])],
        professional_portfolio=[PortfolioResponse.model_validate(p) for p in (detail.get("professional_portfolio") or [])],
        professional_pricing_tiers=[PricingTierResponse.model_validate(pt) for pt in (detail.get("professional_pricing_tiers") or [])],
        professional_location_preferences=detail.get("professional_location_preferences"),
        form_submissions=[FormSubmissionListResponse.model_validate(x) for x in (detail.get("form_submissions") or [])],
        matches=[AdminMatchSummary.model_validate(m) for m in (detail.get("matches") or [])],
        transactions=[AdminTransactionSummary.model_validate(t) for t in (detail.get("transactions") or [])],
        support_tickets=[AdminSupportTicketSummary.model_validate(s) for s in (detail.get("support_tickets") or [])],
    )


@router.get("/landowners", response_model=List[LandownerListResponse])
async def list_landowners(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List landowner profiles with user info and property/project counts."""
    items = await AdminService.list_landowners(db, skip=skip, limit=limit)
    return [LandownerListResponse.model_validate(x) for x in items]


@router.get("/landowners/{landowner_id}", response_model=LandownerDetailResponse)
async def get_landowner_detail(
    landowner_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Single landowner: profile, user, properties, projects (with JV preferences)."""
    detail = await AdminService.get_landowner_detail(db, landowner_id)
    projects = [_project_with_jv(p) for p in detail["projects"]]
    return LandownerDetailResponse(
        profile=LandownerProfileResponse.model_validate(detail["profile"]),
        user_email=detail["user_email"],
        user_name=detail["user_name"],
        properties=[PropertyResponse.model_validate(prop) for prop in detail["properties"]],
        projects=projects,
    )


@router.get("/professionals", response_model=List[ProfessionalListResponse])
async def list_professionals(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List professional profiles with user info and capability summary."""
    items = await AdminService.list_professionals(db, skip=skip, limit=limit)
    return [ProfessionalListResponse.model_validate(x) for x in items]


@router.get("/professionals/export")
async def download_bulk_professional_export(
    skip: int = Query(0, ge=0),
    limit: int = Query(500, ge=1, le=2000),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    file_path, _record = await AdminExportService.generate_bulk_builder_export(
        db,
        generated_by=current_user.id,
        skip=skip,
        limit=limit,
    )
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=file_path.name,
    )


@router.get("/professionals/exports", response_model=List[AdminBuilderExportRecordResponse])
async def list_professional_exports(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    rows = await AdminExportService.list_exports(db, skip=skip, limit=limit)
    return [
        AdminBuilderExportRecordResponse(
            id=row.id,
            scope=row.scope,
            builder_id=row.builder_id,
            generated_by=row.generated_by,
            file_name=row.file_url_or_path,
            row_count=row.row_count,
            created_at=row.created_at,
        )
        for row in rows
    ]


@router.get("/professionals/exports/{export_id}/download")
async def download_saved_professional_export(
    export_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    file_path, record = await AdminExportService.get_export_file(db, export_id)
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=record.file_url_or_path,
    )


@router.get("/professionals/{professional_id}/export")
async def download_single_professional_export(
    professional_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    file_path, _record = await AdminExportService.generate_single_builder_export(
        db,
        professional_id=professional_id,
        generated_by=current_user.id,
    )
    return FileResponse(
        path=file_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename=file_path.name,
    )


@router.get("/professionals/{professional_id}", response_model=ProfessionalDetailResponse)
async def get_professional_detail(
    professional_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Single professional: profile, user, capabilities, licenses, portfolio, pricing."""
    detail = await AdminService.get_professional_detail(db, professional_id)
    return ProfessionalDetailResponse(
        profile=ProfessionalProfileResponse.model_validate(detail["profile"]),
        user_email=detail["user_email"],
        user_name=detail["user_name"],
        capabilities=[CapabilityResponse.model_validate(c) for c in detail["capabilities"]],
        licenses=[LicenseResponse.model_validate(l) for l in detail["licenses"]],
        portfolio=[PortfolioResponse.model_validate(p) for p in detail["portfolio"]],
        pricing_tiers=[PricingTierResponse.model_validate(pt) for pt in detail["pricing_tiers"]],
        location_preferences=detail["location_preferences"],
        approval_status=detail["approval_status"],
        approval_note=detail["approval_note"],
        approved_by_admin_user_id=detail["approved_by_admin_user_id"],
        approved_at=detail["approved_at"],
        rejected_at=detail["rejected_at"],
        has_builder_submission=detail["has_builder_submission"],
    )


@router.patch("/professionals/{professional_id}/approval", response_model=AdminProfessionalApprovalResponse)
async def patch_professional_approval(
    professional_id: UUID,
    body: AdminProfessionalApprovalRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Approve/reject a builder profile after at least one builder form submission."""
    updated = await AdminService.update_professional_approval(
        db,
        admin_user_id=current_user.id,
        professional_id=professional_id,
        status_value=body.status,
        note=body.note,
    )
    return AdminProfessionalApprovalResponse(**updated)


@router.get("/form-submissions", response_model=List[FormSubmissionListResponse])
async def list_form_submissions(
    side: Optional[str] = Query(None, description="Filter: builder or landowner"),
    form_type: Optional[str] = Query(None, description="Filter by form type"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List form submissions with optional filters. Payload included for requirements data."""
    items = await AdminService.list_form_submissions(
        db, side=side, form_type=form_type, skip=skip, limit=limit
    )
    return [FormSubmissionListResponse.model_validate(x) for x in items]


@router.patch("/form-submissions/{submission_id}", response_model=FormSubmissionDetailResponse)
async def patch_form_submission(
    submission_id: str,
    body: AdminFormPayloadUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Replace form submission JSON payload (builder or landowner)."""
    submission = await AdminService.update_form_submission(
        db,
        admin_user_id=current_user.id,
        submission_id=submission_id,
        payload=body.payload,
    )
    return FormSubmissionDetailResponse(
        id=str(submission.id),
        form_type=submission.form_type,
        side=submission.side,
        payload=submission.payload or {},
        created_at=submission.created_at,
    )


@router.delete("/form-submissions/{submission_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_form_submission(
    submission_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Permanently delete a form submission."""
    await AdminService.delete_form_submission(
        db,
        admin_user_id=current_user.id,
        submission_id=submission_id,
    )


@router.get("/connections", response_model=List[AdminConnectionResponse])
async def list_connections(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """List marketplace connection records with contact/payment context."""
    items = await AdminService.list_connections(db, skip=skip, limit=limit)
    return [AdminConnectionResponse.model_validate(x) for x in items]


@router.get("/support/tickets", response_model=List[AdminSupportTicketListItem])
async def list_support_tickets(
    status: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None, description="Filter by user_id (hex or UUID string stored in tickets)"),
    q: Optional[str] = Query(None, description="Search in subject/description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    tickets = await AdminService.list_support_tickets(db, status=status, user_id=user_id, q=q, skip=skip, limit=limit)
    return [AdminSupportTicketListItem.model_validate(t) for t in tickets]


@router.get("/support/tickets/{ticket_id}", response_model=AdminSupportTicketDetail)
async def get_support_ticket(
    ticket_id: str,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    ticket = await AdminService.get_support_ticket(db, ticket_id)
    return AdminSupportTicketDetail.model_validate(ticket)


@router.patch("/support/tickets/{ticket_id}", response_model=AdminSupportTicketDetail)
async def patch_support_ticket(
    ticket_id: str,
    body: AdminSupportTicketUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    updated = await AdminService.update_support_ticket(
        db,
        admin_user_id=current_user.id,
        ticket_id=ticket_id,
        patch=body.model_dump(exclude_unset=True),
    )
    return AdminSupportTicketDetail.model_validate(updated)


@router.get("/payments/transactions", response_model=List[AdminTransactionListItem])
async def list_admin_transactions(
    user_id: Optional[UUID] = Query(None),
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None, description="TransactionType enum value"),
    q: Optional[str] = Query(None, description="Search order_id/payment_id"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    txs = await AdminService.list_transactions(
        db,
        user_id=user_id,
        status=status,
        tx_type=type,
        q=q,
        skip=skip,
        limit=limit,
    )
    return [AdminTransactionListItem.model_validate(t) for t in txs]


@router.patch("/payments/transactions/{transaction_id}", response_model=AdminTransactionListItem)
async def patch_admin_transaction(
    transaction_id: UUID,
    body: AdminTransactionUpdateRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    updated = await AdminService.update_transaction_resolution(
        db,
        admin_user_id=current_user.id,
        transaction_id=transaction_id,
        patch=body.model_dump(exclude_unset=True),
    )
    return AdminTransactionListItem.model_validate(updated)


@router.patch("/me/password", response_model=MessageResponse)
async def change_admin_password(
    body: AdminChangePasswordRequest,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Change the logged-in admin's password (no current-password or OTP required)."""
    await AdminService.change_admin_password(
        db,
        admin_user_id=current_user.id,
        new_password=body.new_password,
    )
    return MessageResponse(message="Password updated successfully.")


@router.get(
    "/professionals/{professional_id}/builder-portfolio",
    response_model=BuilderPortfolioLatestResponse,
)
async def get_admin_builder_portfolio(
    professional_id: UUID,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Latest builder form submission per type for admin editing."""
    return await AdminService.get_builder_portfolio_for_professional(db, professional_id)


@router.patch(
    "/professionals/{professional_id}/profile",
    response_model=ProfessionalProfileResponse,
)
async def patch_admin_professional_profile(
    professional_id: UUID,
    body: AdminProfessionalProfileUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Update core builder profile fields (company, phone, city, experience)."""
    profile = await AdminService.update_professional_profile_admin(
        db,
        admin_user_id=current_user.id,
        professional_id=professional_id,
        patch=body.model_dump(exclude_unset=True),
    )
    return ProfessionalProfileResponse.model_validate(profile)


@router.patch(
    "/professionals/{professional_id}/form-submissions/{submission_id}",
    response_model=FormSubmissionDetailResponse,
)
async def patch_admin_builder_form_submission(
    professional_id: UUID,
    submission_id: str,
    body: AdminBuilderFormPayloadUpdate,
    current_user: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    """Replace builder form submission JSON (portfolio, projects, media URLs)."""
    submission = await AdminService.update_builder_form_submission_for_professional(
        db,
        admin_user_id=current_user.id,
        professional_id=professional_id,
        submission_id=submission_id,
        payload=body.payload,
    )
    return FormSubmissionDetailResponse(
        id=str(submission.id),
        form_type=submission.form_type,
        side=submission.side,
        payload=submission.payload or {},
        created_at=submission.created_at,
    )
