"""
Schemas for marketplace form submissions (builder & landowner).
Payloads are stored as JSON to match frontend form structure.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ----- Builder Joint Venture -----
class RecentProjectItem(BaseModel):
    name_location: Optional[str] = None
    built_up_sft: Optional[str] = None
    type: Optional[str] = None
    duration_months: Optional[str] = None
    image_urls: Optional[List[str]] = Field(default_factory=list)  # S3 public URLs or keys
    video_url: Optional[str] = None


class BuilderJointVentureSubmit(BaseModel):
    company_name: str = Field(..., min_length=1)
    years_experience: str = Field(..., min_length=1)
    entity_type: Optional[str] = None
    builder_license: Optional[str] = None
    rera_registration: Optional[str] = None
    gst_number: Optional[str] = None
    address: str = Field(..., min_length=1)
    project_caps: List[str] = Field(default_factory=list)
    preferred_locations: Optional[str] = None
    projects_completed: Optional[str] = None
    rera_yes_no: Optional[str] = None
    rera_projects: Optional[str] = None
    project_scale: Optional[str] = None
    team_size: Optional[str] = None
    jv_arrangements: List[str] = Field(default_factory=list)
    location1: Optional[str] = None
    radius1: Optional[str] = None
    location2: Optional[str] = None
    radius2: Optional[str] = None
    location3: Optional[str] = None
    radius3: Optional[str] = None
    recent_projects: List[RecentProjectItem] = Field(default_factory=list)
    pricing: Optional[Dict[str, Any]] = None


# ----- Builder Contract Construction -----
class RecentProjectItemContract(BaseModel):
    name_location: Optional[str] = None
    built_up_sft: Optional[str] = None
    type: Optional[str] = None
    duration_months: Optional[str] = None
    image_urls: Optional[List[str]] = Field(default_factory=list)
    video_url: Optional[str] = None


class BuilderContractConstructionSubmit(BaseModel):
    company_name: str = Field(..., min_length=1)
    years_experience: str = Field(..., min_length=1)
    license_rera: Optional[str] = None
    address: str = Field(..., min_length=1)
    project_types: List[str] = Field(default_factory=list)
    preferred_location: Optional[str] = None
    projects_completed: Optional[str] = None
    project_details: Optional[str] = None
    team_type: Optional[str] = None
    subcontractor_scopes: List[str] = Field(default_factory=list)
    subcontractor_other: Optional[str] = None
    typical_size: Optional[str] = None
    typical_size_other: Optional[str] = None
    pricing: Optional[Dict[str, Any]] = None
    project_image_urls: List[str] = Field(default_factory=list)  # S3 URLs (legacy)
    recent_projects: Optional[List[RecentProjectItemContract]] = None


# ----- Landowner Joint Venture -----
class LandownerJointVentureSubmit(BaseModel):
    property_location: Optional[Dict[str, Any]] = None
    property_details: Optional[Dict[str, Any]] = None
    verification: Optional[Dict[str, Any]] = None
    jv_preferences: Optional[Dict[str, Any]] = None
    upsell: Optional[Dict[str, Any]] = None
    feasibility: Optional[Dict[str, Any]] = None
    point_of_contact: Optional[Dict[str, Any]] = None
    contract_preferences: Optional[Dict[str, Any]] = None


# ----- Landowner Contract Construction -----
class LandownerContractConstructionSubmit(BaseModel):
    landowner_name: str = Field(..., min_length=1)
    property_location: Optional[Dict[str, Any]] = None
    property_details: Optional[Dict[str, Any]] = None
    far: Optional[str] = None
    pid_validation: Optional[Dict[str, Any]] = None
    project_intent: Optional[Dict[str, Any]] = None
    point_of_contact: Optional[Dict[str, Any]] = None
    contract_preferences: Optional[Dict[str, Any]] = None


# ----- Landowner Interior / Reconstruction (flexible payload) -----
class LandownerInteriorSubmit(BaseModel):
    """Landowner interior form - payload stored as-is."""
    property_location: Optional[Dict[str, Any]] = None
    property_details: Optional[Dict[str, Any]] = None
    project_scope: Optional[Dict[str, Any]] = None
    timeline: Optional[str] = None
    building_type: Optional[str] = None
    location: Optional[Dict[str, Any]] = None
    interior_preferences: Optional[Dict[str, Any]] = None
    point_of_contact: Optional[Dict[str, Any]] = None
    contract_preferences: Optional[Dict[str, Any]] = None


class LandownerReconstructionSubmit(BaseModel):
    """Landowner reconstruction form - payload stored as-is."""
    property_type: Optional[Dict[str, Any]] = None
    location: Optional[Dict[str, Any]] = None
    scope_of_work: Optional[Dict[str, Any]] = None
    timeline: Optional[str] = None
    contract_preferences: Optional[Dict[str, Any]] = None


# ----- Builder Interior / Reconstruction (flexible payload) -----
class BuilderInteriorSubmit(BaseModel):
    """Builder interior form - payload stored as-is."""
    company_name: Optional[str] = None
    years_experience: Optional[str] = None
    address: Optional[str] = None
    project_types: Optional[List[str]] = Field(default_factory=list)
    location: Optional[Dict[str, Any]] = None
    project_scope: Optional[Dict[str, Any]] = None
    recent_projects: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    pricing: Optional[Dict[str, Any]] = None


class BuilderReconstructionSubmit(BaseModel):
    """Builder reconstruction form - payload stored as-is."""
    company_name: Optional[str] = None
    years_experience: Optional[str] = None
    address: Optional[str] = None
    project_caps: Optional[List[str]] = Field(default_factory=list)
    location: Optional[Dict[str, Any]] = None
    scope_of_work: Optional[Dict[str, Any]] = None
    work_types: Optional[List[str]] = Field(default_factory=list)
    pricing: Optional[Dict[str, Any]] = None
    projects_completed: Optional[str] = None
    recent_projects: Optional[List[Dict[str, Any]]] = None  # [{ name_location, built_up_sft, type, duration_months, image_urls, video_url }, ...]


# ----- Generic form submission response -----
class FormSubmissionResponse(BaseModel):
    id: str
    form_type: str
    side: str
    message: str = "Form submitted successfully."


class FormSubmissionDetailResponse(BaseModel):
    id: str
    form_type: str
    side: str
    payload: Dict[str, Any]
    created_at: datetime


class BuilderPortfolioLatestResponse(BaseModel):
    """Latest builder form submission per marketplace profile type (one round-trip for portfolio UI)."""

    contract_construction: Optional[FormSubmissionDetailResponse] = None
    joint_venture: Optional[FormSubmissionDetailResponse] = None
    interior: Optional[FormSubmissionDetailResponse] = None
    renovation_repaint: Optional[FormSubmissionDetailResponse] = None


class BuilderFormPayloadUpdate(BaseModel):
    """Replace stored JSON payload for a builder-owned form submission (portfolio edit)."""

    payload: Dict[str, Any]
