"""
Landowner schemas
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.utils.constants import ProjectType, ProjectStatus, ProjectIntent, JVPostConstructionExpectation, ProjectScaleTier


class LandownerProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, max_length=100)
    
    model_config = ConfigDict(strict=True)


class LandownerProfileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, max_length=100)
    
    model_config = ConfigDict(strict=True)


class LandownerProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    phone: Optional[str]
    city: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class PropertyCreate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., max_length=100)
    ward: Optional[str] = Field(None, max_length=100)
    landmark: Optional[str] = Field(None, max_length=255)
    google_maps_pin: Optional[str] = Field(None, max_length=500)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    width_ft: Optional[float] = Field(None, gt=0)
    length_ft: Optional[float] = Field(None, gt=0)
    facing: Optional[str] = Field(None, max_length=50)
    is_corner_plot: bool = False
    facings: Optional[List[str]] = None
    road_width_ft: Optional[float] = Field(None, gt=0)
    khatha_type: Optional[str] = Field(None, max_length=100)
    e_khatha_status: Optional[str] = Field(None, max_length=100)
    tax_paid: bool = False
    pid_number: Optional[str] = Field(None, max_length=100)
    
    model_config = ConfigDict(strict=True)


class PropertyResponse(BaseModel):
    id: UUID
    landowner_id: UUID
    name: Optional[str]
    city: str
    ward: Optional[str]
    landmark: Optional[str]
    google_maps_pin: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    width_ft: Optional[float]
    length_ft: Optional[float]
    facing: Optional[str]
    is_corner_plot: bool
    facings: Optional[List[str]]
    road_width_ft: Optional[float]
    khatha_type: Optional[str]
    e_khatha_status: Optional[str]
    tax_paid: bool
    pid_number: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class ProjectCreate(BaseModel):
    property_id: UUID
    project_type: ProjectType
    intent: Optional[ProjectIntent] = None
    asset_class: Optional[str] = Field(None, max_length=50)
    budget_tier: Optional[str] = Field(None, max_length=20)
    timeline: Optional[str] = Field(None, max_length=100)
    scope: Optional[str] = None

    model_config = ConfigDict(extra="ignore")  # allow coercion (str→UUID, str→enum) for client payloads


class ProjectResponse(BaseModel):
    id: UUID
    property_id: UUID
    project_type: ProjectType
    intent: Optional[ProjectIntent]
    asset_class: Optional[str]
    budget_tier: Optional[str]
    timeline: Optional[str]
    scope: Optional[str]
    status: ProjectStatus
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class JVPreferencesCreate(BaseModel):
    post_construction_expectation: Optional[JVPostConstructionExpectation] = None
    development_vision: Optional[str] = None
    
    model_config = ConfigDict(strict=True)


class JVPreferencesResponse(BaseModel):
    id: UUID
    project_id: UUID
    post_construction_expectation: Optional[JVPostConstructionExpectation]
    development_vision: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class ProjectMarketplaceCard(BaseModel):
    """
    Public project card for the marketplace.
    Does not expose landowner identity or direct contact details.
    """

    project_id: UUID
    property_id: UUID
    city: str
    ward: Optional[str] = None
    landmark: Optional[str] = None
    project_type: ProjectType
    intent: Optional[ProjectIntent] = None
    asset_class: Optional[str] = None
    budget_tier: Optional[str] = None
    timeline: Optional[str] = None
    scope: Optional[str] = None
    status: ProjectStatus
    total_buildable_area_sqft: Optional[float] = None
    project_scale_tier: Optional[ProjectScaleTier] = None
    plot_area_sqft: Optional[float] = None
    road_width_ft: Optional[float] = None
    tax_paid: bool
    e_khatha_status: Optional[str] = None
    has_pid_verification: bool = False
    # Optional latest submitted landowner form payload for this project type.
    landowner_form_payload: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True, strict=True)
