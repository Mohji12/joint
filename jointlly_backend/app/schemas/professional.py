"""
Professional schemas
"""
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.utils.constants import CapabilityType, ProjectType, TeamSizeCategory


class ProfessionalProfileCreate(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)
    city: Optional[str] = Field(None, max_length=100)
    experience_years: Optional[int] = Field(None, ge=0)
    rera_experience: bool = False
    wallet_size: Optional[float] = Field(None, ge=0)
    preferred_jv_model: Optional[str] = Field(None, max_length=255)
    location_preferences: Optional[List[str]] = None
    workforce_capacity: Optional[int] = Field(None, ge=0)
    
    model_config = ConfigDict(strict=True)


class ProfessionalProfileResponse(BaseModel):
    id: UUID
    user_id: UUID
    company_name: str
    phone: Optional[str]
    city: Optional[str]
    experience_years: Optional[int]
    rera_experience: bool
    wallet_size: Optional[float]
    preferred_jv_model: Optional[str]
    location_preferences: Optional[List[str]]
    workforce_capacity: Optional[int]
    current_bandwidth: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class CapabilityCreate(BaseModel):
    capability_type: CapabilityType
    description: Optional[str] = None
    
    model_config = ConfigDict(strict=True)


class CapabilityResponse(BaseModel):
    id: UUID
    professional_id: UUID
    capability_type: CapabilityType
    description: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class LicenseCreate(BaseModel):
    license_number: str = Field(..., min_length=1, max_length=255)
    issuing_authority: Optional[str] = Field(None, max_length=255)
    expiry_date: Optional[date] = None
    document_url: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(strict=True)


class LicenseResponse(BaseModel):
    id: UUID
    professional_id: UUID
    license_number: str
    issuing_authority: Optional[str]
    expiry_date: Optional[date]
    document_url: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class PortfolioCreate(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=255)
    project_type: Optional[ProjectType] = None
    location: Optional[str] = Field(None, max_length=255)
    area_sqft: Optional[float] = Field(None, gt=0)
    completion_date: Optional[date] = None
    images: Optional[List[str]] = None
    description: Optional[str] = None
    
    model_config = ConfigDict(strict=True)


class PortfolioResponse(BaseModel):
    id: UUID
    professional_id: UUID
    project_name: str
    project_type: Optional[ProjectType]
    location: Optional[str]
    area_sqft: Optional[float]
    completion_date: Optional[date]
    images: Optional[List[str]]
    description: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class PricingTierCreate(BaseModel):
    capability_type: CapabilityType
    price_per_sqft: float = Field(..., gt=0)
    min_area_sqft: Optional[float] = Field(None, gt=0)
    max_area_sqft: Optional[float] = Field(None, gt=0)
    tier_name: Optional[str] = Field(None, max_length=100)
    
    model_config = ConfigDict(strict=True)


class PricingTierResponse(BaseModel):
    id: UUID
    professional_id: UUID
    capability_type: CapabilityType
    min_area_sqft: Optional[float]
    max_area_sqft: Optional[float]
    price_per_sqft: float
    tier_name: Optional[str]
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True, strict=True)


class BuilderMarketplacePortfolioPreview(BaseModel):
    """
    Row data aligned with builder Portfolio type cards (company / experience / projects / location / updated).
    Built server-side from latest form submissions; excludes direct contact fields.
    """

    has_data: bool = False
    updated_at: Optional[datetime] = None
    company_name: Optional[str] = None
    years_experience: Optional[str] = None
    projects_completed: Optional[str] = None
    location_summary: Optional[str] = None

    model_config = ConfigDict(strict=True)


class BuilderMarketplacePortfolioItem(BaseModel):
    """Slim view of a portfolio project for marketplace cards."""
    project_name: str
    project_type: Optional[ProjectType] = None
    location: Optional[str] = None
    area_sqft: Optional[float] = None
    completion_date: Optional[date] = None
    images: Optional[List[str]] = None

    model_config = ConfigDict(from_attributes=True, strict=True)


class BuilderMarketplaceCard(BaseModel):
    """
    Public builder card for the marketplace.
    Intentionally omits any direct contact information (phone, email, full address).
    """

    id: UUID
    company_name: str
    city: Optional[str] = None
    location_preferences: List[str] = Field(
        default_factory=list,
        description="Cities/areas the builder prefers to work in (from profile JSON).",
    )
    experience_years: Optional[int] = None
    rera_experience: bool
    credibility_score: Optional[float] = None
    team_size_category: Optional[TeamSizeCategory] = None
    wallet_size: Optional[float] = None  # High-level wallet size in INR
    capability_types: List[CapabilityType]
    min_price_per_sqft: Optional[float] = None
    max_price_per_sqft: Optional[float] = None
    recent_portfolio: List[BuilderMarketplacePortfolioItem] = []
    # Optional raw snapshot of latest contract-construction form payload (non-contact info),
    # used to render rich marketplace cards for contract construction builders.
    contract_form_payload: Optional[Dict[str, Any]] = None
    # From latest contract-construction form (residential/commercial/industrial focus).
    construction_project_types: List[str] = Field(
        default_factory=list,
        description="Project type labels from builder contract form (e.g. Residential, Commercial).",
    )
    # Showcase name: recent portfolio project or contract form recent work title (no contact data).
    featured_project_name: Optional[str] = Field(
        default=None,
        description="Name/label of a representative project (building or site name if provided).",
    )
    contract_portfolio_preview: Optional[BuilderMarketplacePortfolioPreview] = None
    jv_portfolio_preview: Optional[BuilderMarketplacePortfolioPreview] = None
    interior_portfolio_preview: Optional[BuilderMarketplacePortfolioPreview] = None
    renovation_portfolio_preview: Optional[BuilderMarketplacePortfolioPreview] = None

    model_config = ConfigDict(from_attributes=True, strict=True)
