"""
Onboarding schemas for different capability types
"""
from datetime import date
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from app.utils.constants import (
    CapabilityType, ProjectIntent, TeamStructure, TeamSizeCategory,
    ProjectSizeCategory as ProjectSizeCategoryEnum, WalletSizeRange, PricingTierType, JVModelType,
    ReconstructionWorkType, SubcontractorScopeType, BusinessEntityType
)


class LocationPreferenceCreate(BaseModel):
    """Location preference with radius"""
    location_name: str = Field(..., min_length=1, max_length=255)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    radius_km: Optional[float] = Field(None, gt=0)
    capability_type: Optional[CapabilityType] = None
    
    model_config = ConfigDict(strict=True)


class PortfolioProjectCreate(BaseModel):
    """Portfolio project for onboarding"""
    project_name: str = Field(..., min_length=1, max_length=255)
    location: Optional[str] = Field(None, max_length=255)
    area_sqft: Optional[float] = Field(None, gt=0)
    completion_date: Optional[date] = None
    duration_months: Optional[int] = Field(None, ge=0)
    images: Optional[List[str]] = None  # Up to 5 for Contract Construction, 2 for others
    description: Optional[str] = None
    
    model_config = ConfigDict(strict=True)


class ResidentialPricingCreate(BaseModel):
    """Residential pricing tiers"""
    basic_regular: Optional[float] = Field(None, gt=0)
    standard: Optional[float] = Field(None, gt=0)
    luxury: Optional[float] = Field(None, gt=0)
    
    model_config = ConfigDict(strict=True)


class CommercialPricingCreate(BaseModel):
    """Commercial pricing tiers"""
    basic_regular: Optional[float] = Field(None, gt=0)
    standard: Optional[float] = Field(None, gt=0)
    luxury: Optional[float] = Field(None, gt=0)
    
    model_config = ConfigDict(strict=True)


class IndustrialPricingCreate(BaseModel):
    """Industrial pricing tiers"""
    basic_regular: Optional[float] = Field(None, gt=0)
    standard: Optional[float] = Field(None, gt=0)
    
    model_config = ConfigDict(strict=True)


class InteriorPricingCreate(BaseModel):
    """Interior designer pricing for specific project types"""
    flat_1200_sft: Optional[str] = None  # Free text
    duplex_1500_sft: Optional[str] = None  # Free text
    commercial_1800_sft: Optional[str] = None  # Free text
    other: Optional[str] = None  # Free text
    
    model_config = ConfigDict(strict=True)


# Contract Construction Onboarding
class ContractConstructionOnboardingStep1(BaseModel):
    """Step 1: Company Details"""
    company_name: str = Field(..., min_length=1, max_length=255)
    experience_years: int = Field(..., ge=0)
    builder_license: Optional[str] = Field(None, max_length=255)  # KPWD or equivalent
    rera_registration: Optional[str] = Field(None, max_length=255)
    office_address: str = Field(..., min_length=1, max_length=500)
    google_maps_location: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(strict=True)


class ContractConstructionOnboardingStep2(BaseModel):
    """Step 2: Project Types"""
    project_types: List[ProjectIntent] = Field(..., min_length=1)
    
    model_config = ConfigDict(strict=True)


class ContractConstructionOnboardingStep3(BaseModel):
    """Step 3: Location Preferences"""
    location_preferences: List[LocationPreferenceCreate]
    
    model_config = ConfigDict(strict=True)


class ContractConstructionOnboardingStep4(BaseModel):
    """Step 4: Portfolio"""
    total_projects_completed: int = Field(..., ge=0)
    portfolio_projects: List[PortfolioProjectCreate] = Field(..., max_length=5)
    
    model_config = ConfigDict(strict=True)


class ContractConstructionOnboardingStep5(BaseModel):
    """Step 5: Execution Approach"""
    team_structure: TeamStructure
    subcontractor_scopes: List[SubcontractorScopeType]
    
    model_config = ConfigDict(strict=True)


class ContractConstructionOnboardingStep6(BaseModel):
    """Step 6: Project Size"""
    typical_project_size: ProjectSizeCategoryEnum
    
    model_config = ConfigDict(strict=True)


class ContractConstructionOnboardingStep7(BaseModel):
    """Step 7: Pricing"""
    residential_pricing: ResidentialPricingCreate
    commercial_pricing: CommercialPricingCreate
    industrial_pricing: IndustrialPricingCreate
    
    model_config = ConfigDict(strict=True)


# JV/JD Developer Onboarding
class JVJDDeveloperOnboardingStep1(BaseModel):
    """Step 1: Company Details"""
    company_name: str = Field(..., min_length=1, max_length=255)
    experience_years: int = Field(..., ge=0)
    business_entity_type: BusinessEntityType
    office_address: str = Field(..., min_length=1, max_length=500)
    google_maps_location: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(strict=True)


class JVJDDeveloperOnboardingStep2(BaseModel):
    """Step 2: Licenses & Registrations"""
    builder_license: Optional[str] = Field(None, max_length=255)
    rera_registration: Optional[str] = Field(None, max_length=255)
    gst_number: Optional[str] = Field(None, max_length=50)
    
    model_config = ConfigDict(strict=True)


class JVJDDeveloperOnboardingStep3(BaseModel):
    """Step 3: Project Capabilities"""
    project_types: List[ProjectIntent] = Field(..., min_length=1)
    
    model_config = ConfigDict(strict=True)


class JVJDDeveloperOnboardingStep4(BaseModel):
    """Step 4: Experience & Portfolio"""
    total_projects_completed: int = Field(..., ge=0)
    recent_projects: List[PortfolioProjectCreate] = Field(..., max_length=3)
    
    model_config = ConfigDict(strict=True)


class JVJDDeveloperOnboardingStep5(BaseModel):
    """Step 5: Execution Approach"""
    team_structure: TeamStructure
    subcontractor_scopes: List[SubcontractorScopeType]
    typical_project_size: ProjectSizeCategoryEnum
    
    model_config = ConfigDict(strict=True)


class JVJDDeveloperOnboardingStep6(BaseModel):
    """Step 6: RERA Experience & Wallet Size"""
    rera_registered_projects_count: Optional[int] = Field(None, ge=0)
    wallet_size_range: WalletSizeRange
    
    model_config = ConfigDict(strict=True)


class JVJDDeveloperOnboardingStep7(BaseModel):
    """Step 7: Location Preferences"""
    location_preferences: List[LocationPreferenceCreate]
    team_size_category: TeamSizeCategory
    
    model_config = ConfigDict(strict=True)


class JVJDDeveloperOnboardingStep8(BaseModel):
    """Step 8: JV Model Preferences"""
    preferred_jv_models: List[JVModelType] = Field(..., min_length=1)
    
    model_config = ConfigDict(strict=True)


# Interior Designer Onboarding
class InteriorDesignerOnboardingStep1(BaseModel):
    """Step 1: Company Details"""
    company_name: str = Field(..., min_length=1, max_length=255)
    experience_years: int = Field(..., ge=0)
    office_address: str = Field(..., min_length=1, max_length=500)
    google_maps_location: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(strict=True)


class InteriorDesignerOnboardingStep2(BaseModel):
    """Step 2: Project Types"""
    project_types: List[ProjectIntent] = Field(..., min_length=1)
    
    model_config = ConfigDict(strict=True)


class InteriorDesignerOnboardingStep3(BaseModel):
    """Step 3: Recent Projects"""
    recent_projects: List[PortfolioProjectCreate] = Field(..., max_length=3)
    
    model_config = ConfigDict(strict=True)


class InteriorDesignerOnboardingStep4(BaseModel):
    """Step 4: Tentative Pricing"""
    tentative_pricing: InteriorPricingCreate
    
    model_config = ConfigDict(strict=True)


class InteriorDesignerOnboardingStep5(BaseModel):
    """Step 5: Location Preferences"""
    location_preferences: List[LocationPreferenceCreate]
    
    model_config = ConfigDict(strict=True)


# Reconstruction Onboarding
class ReconstructionOnboardingStep1(BaseModel):
    """Step 1: Basic Details & Licenses"""
    company_name: str = Field(..., min_length=1, max_length=255)
    experience_years: int = Field(..., ge=0)
    business_entity_type: BusinessEntityType
    builder_license: Optional[str] = Field(None, max_length=255)
    rera_registration: Optional[str] = Field(None, max_length=255)
    gst_number: Optional[str] = Field(None, max_length=50)
    office_address: str = Field(..., min_length=1, max_length=500)
    google_maps_location: Optional[str] = Field(None, max_length=500)
    
    model_config = ConfigDict(strict=True)


class ReconstructionOnboardingStep2(BaseModel):
    """Step 2: Project Capabilities"""
    project_types: List[ProjectIntent] = Field(..., min_length=1)
    location_preferences: List[str] = Field(..., min_length=1)
    
    model_config = ConfigDict(strict=True)


class ReconstructionOnboardingStep3(BaseModel):
    """Step 3: Experience & Portfolio"""
    total_projects_completed: int = Field(..., ge=0)
    similar_projects_description: Optional[str] = None
    recent_projects_images: List[str] = Field(..., max_length=5)
    
    model_config = ConfigDict(strict=True)


class ReconstructionOnboardingStep4(BaseModel):
    """Step 4: Execution Approach"""
    team_structure: TeamStructure
    subcontractor_scopes: List[SubcontractorScopeType]
    typical_project_size: ProjectSizeCategoryEnum
    
    model_config = ConfigDict(strict=True)


class ReconstructionOnboardingStep5(BaseModel):
    """Step 5: Work Type Preferences"""
    work_type_preferences: List[ReconstructionWorkType] = Field(..., min_length=1)
    custom_work_description: Optional[str] = None
    
    model_config = ConfigDict(strict=True)


class ReconstructionOnboardingStep6(BaseModel):
    """Step 6: Pricing"""
    tentative_pricing: Optional[str] = None  # Free text
    
    model_config = ConfigDict(strict=True)


# Onboarding Status Response
class OnboardingStatusResponse(BaseModel):
    """Onboarding status response"""
    capability_type: CapabilityType
    current_step: int
    total_steps: int
    onboarding_status: str
    completed_steps: List[int]
    missing_fields: List[str]
    
    model_config = ConfigDict(strict=True)


# Onboarding Step Response
class OnboardingStepResponse(BaseModel):
    """Response after submitting a step"""
    step_number: int
    next_step: Optional[int]
    is_complete: bool
    message: str
    
    model_config = ConfigDict(strict=True)
