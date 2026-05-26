"""
Admin API schemas for listing users, landowners, professionals, and form submissions.
"""
from datetime import datetime
from typing import Optional, List, Any, Dict, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, field_validator
from app.utils.constants import Role, BuilderApprovalStatus
from app.utils.constants import MatchStatus
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


class UserListResponse(BaseModel):
    """User list item for admin (no sensitive fields)."""
    id: UUID
    email: str
    name: str
    role: Role
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    @field_validator("is_active", mode="before")
    @classmethod
    def coerce_is_active(cls, v):
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() == "true"
        return False

    model_config = ConfigDict(from_attributes=True, strict=True)


class UserSummary(BaseModel):
    """Minimal user info for embedding in landowner/professional list."""
    id: UUID
    email: str
    name: str
    role: Role

    model_config = ConfigDict(from_attributes=True, strict=True)


class LandownerListResponse(BaseModel):
    """Landowner profile with user info and counts."""
    id: UUID
    user_id: UUID
    name: str
    phone: Optional[str]
    city: Optional[str]
    created_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    property_count: int = 0
    project_count: int = 0

    model_config = ConfigDict(from_attributes=True, strict=True)


class ProjectWithJVResponse(ProjectResponse):
    """Project with optional JV preferences for admin detail."""
    jv_preferences: Optional[JVPreferencesResponse] = None

    model_config = ConfigDict(from_attributes=True, strict=True)


class LandownerDetailResponse(BaseModel):
    """Full landowner detail: profile, user, properties, projects."""
    profile: LandownerProfileResponse
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    properties: List[PropertyResponse] = []
    projects: List[ProjectWithJVResponse] = []

    model_config = ConfigDict(from_attributes=True, strict=True)


class ProfessionalListResponse(BaseModel):
    """Professional profile with user info and capability summary."""
    id: UUID
    user_id: UUID
    company_name: str
    phone: Optional[str]
    city: Optional[str]
    experience_years: Optional[int]
    rera_experience: bool
    created_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    capability_types: List[str] = []
    approval_status: BuilderApprovalStatus = BuilderApprovalStatus.PENDING
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    has_builder_submission: bool = False

    model_config = ConfigDict(from_attributes=True, strict=True)


class ProfessionalDetailResponse(BaseModel):
    """Full professional detail: profile, user, capabilities, licenses, portfolio, pricing."""
    profile: ProfessionalProfileResponse
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    capabilities: List[CapabilityResponse] = []
    licenses: List[LicenseResponse] = []
    portfolio: List[PortfolioResponse] = []
    pricing_tiers: List[PricingTierResponse] = []
    location_preferences: Optional[List[str]] = None
    approval_status: BuilderApprovalStatus = BuilderApprovalStatus.PENDING
    approval_note: Optional[str] = None
    approved_by_admin_user_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    has_builder_submission: bool = False

    model_config = ConfigDict(from_attributes=True, strict=True)


class FormSubmissionListResponse(BaseModel):
    """Form submission list item for admin."""
    id: str
    user_id: Optional[str]
    form_type: str
    side: str
    created_at: datetime
    payload: Optional[dict] = None
    user_email: Optional[str] = None

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminStatsResponse(BaseModel):
    """Dashboard stats for admin."""
    total_users: int
    users_landowner: int
    users_professional: int
    total_landowners: int
    total_professionals: int
    total_projects: int
    projects_draft: int
    projects_published: int
    total_form_submissions: int

    model_config = ConfigDict(strict=True)


class AdminConnectionResponse(BaseModel):
    """Connection records between landowner project and builder."""
    match_id: UUID
    status: MatchStatus
    selection_side: Optional[str] = None
    landowner_id: Optional[UUID] = None
    landowner_name: Optional[str] = None
    landowner_email: Optional[str] = None
    landowner_phone: Optional[str] = None
    professional_id: Optional[UUID] = None
    builder_company_name: Optional[str] = None
    builder_email: Optional[str] = None
    builder_phone: Optional[str] = None
    project_id: UUID
    property_id: Optional[UUID] = None
    project_type: Optional[str] = None
    project_city: Optional[str] = None
    payment_status: Optional[str] = None
    payment_transaction_id: Optional[UUID] = None
    payment_order_id: Optional[str] = None
    payment_id: Optional[str] = None
    mutual_interest_at: Optional[datetime] = None
    gatekeeper_unlocked_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("status", mode="before")
    @classmethod
    def coerce_status(cls, v):
        if isinstance(v, MatchStatus):
            return v
        raw = (str(v or "")).strip().upper()
        if not raw:
            return MatchStatus.PENDING
        try:
            return MatchStatus(raw)
        except ValueError:
            return MatchStatus.PENDING

    model_config = ConfigDict(strict=True)


class AdminMatchSummary(BaseModel):
    """Minimal match timeline row for User 360."""
    id: UUID
    project_id: UUID
    professional_id: UUID
    status: MatchStatus
    match_score: float
    created_at: datetime
    updated_at: datetime
    mutual_interest_at: Optional[datetime] = None
    gatekeeper_unlocked_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminTransactionSummary(BaseModel):
    """Minimal transaction row for User 360."""
    id: UUID
    user_id: UUID
    project_id: Optional[UUID] = None
    match_id: Optional[UUID] = None
    transaction_type: Any
    amount: float
    currency: str
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    status: Any
    admin_resolution_status: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminTransactionListItem(AdminTransactionSummary):
    """Transaction row for admin payments view."""
    pass


class AdminTransactionUpdateRequest(BaseModel):
    admin_resolution_status: Optional[Literal["OPEN", "INVESTIGATING", "RESOLVED"]] = None
    admin_notes: Optional[str] = None

    model_config = ConfigDict(strict=True)


class AdminSupportTicketSummary(BaseModel):
    """Support ticket row for User 360."""
    id: str
    user_id: Optional[str] = None
    role: Optional[str] = None
    route: Optional[str] = None
    subject: str
    description: str
    status: str
    metadata_json: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminLoginEventResponse(BaseModel):
    """Recent user login event for admin observability."""
    id: str
    user_id: str
    email: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminUser360Response(BaseModel):
    """End-to-end snapshot for a single user."""
    user: UserListResponse
    last_login_at: Optional[datetime] = None
    login_events: List[AdminLoginEventResponse] = []
    landowner_profile: Optional[LandownerProfileResponse] = None
    landowner_properties: List[PropertyResponse] = []
    landowner_projects: List[ProjectWithJVResponse] = []
    professional_profile: Optional[ProfessionalProfileResponse] = None
    professional_capabilities: List[CapabilityResponse] = []
    professional_licenses: List[LicenseResponse] = []
    professional_portfolio: List[PortfolioResponse] = []
    professional_pricing_tiers: List[PricingTierResponse] = []
    professional_location_preferences: Optional[List[str]] = None
    form_submissions: List[FormSubmissionListResponse] = []
    matches: List[AdminMatchSummary] = []
    transactions: List[AdminTransactionSummary] = []
    support_tickets: List[AdminSupportTicketSummary] = []

    model_config = ConfigDict(strict=True)


class AdminSupportTicketListItem(BaseModel):
    id: str
    user_id: Optional[str] = None
    role: Optional[str] = None
    route: Optional[str] = None
    subject: str
    status: str
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminSupportTicketDetail(AdminSupportTicketSummary):
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminSupportTicketUpdateRequest(BaseModel):
    status: Optional[Literal["open", "triage", "resolved", "closed"]] = None
    assigned_to: Optional[str] = None
    admin_notes: Optional[str] = None

    model_config = ConfigDict(strict=True)


class AdminAuditLogResponse(BaseModel):
    id: str
    admin_user_id: str
    action: str
    entity_type: str
    entity_id: str
    before_json: Optional[Dict[str, Any]] = None
    after_json: Optional[Dict[str, Any]] = None
    notes: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True, strict=True)


class AdminProfessionalApprovalRequest(BaseModel):
    status: Literal["APPROVED", "REJECTED"]
    note: Optional[str] = None

    model_config = ConfigDict(strict=True)


class AdminProfessionalApprovalResponse(BaseModel):
    professional_id: UUID
    approval_status: BuilderApprovalStatus
    approval_note: Optional[str] = None
    approved_by_admin_user_id: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    has_builder_submission: bool

    model_config = ConfigDict(strict=True)


class AdminBuilderExportRecordResponse(BaseModel):
    id: str
    scope: Literal["single", "bulk"]
    builder_id: Optional[str] = None
    generated_by: str
    file_name: str
    row_count: int
    created_at: datetime

    model_config = ConfigDict(strict=True)


class AdminChangePasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

    model_config = ConfigDict(strict=True)


class AdminProfessionalProfileUpdate(BaseModel):
    company_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0, le=100)

    model_config = ConfigDict(strict=True)


class AdminBuilderFormPayloadUpdate(BaseModel):
    payload: Dict[str, Any]

    model_config = ConfigDict(strict=True)


class AdminFormPayloadUpdate(BaseModel):
    """Replace any form submission JSON payload (builder or landowner)."""

    payload: Dict[str, Any]

    model_config = ConfigDict(strict=True)
