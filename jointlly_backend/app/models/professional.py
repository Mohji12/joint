"""
Professional models
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text, Boolean,
    ForeignKey, Enum as SQLEnum, Date, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.constants import (
    CapabilityType, ProjectType, BusinessEntityType, TeamSizeCategory,
    ProjectSizeCategory as ProjectSizeCategoryEnum, WalletSizeRange, PricingTierType, JVModelType,
    ReconstructionWorkType as ReconstructionWorkTypeEnum, SubcontractorScopeType, OnboardingStatus,
    BuilderApprovalStatus,
    ProjectIntent
)


class ProfessionalProfile(Base):
    """Professional profile model"""
    
    __tablename__ = "professional_profiles"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    company_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    experience_years = Column(Integer, nullable=True)
    rera_experience = Column(Boolean, default=False, nullable=False)
    wallet_size = Column(Float, nullable=True)  # In INR
    preferred_jv_model = Column(String(255), nullable=True)
    # Stored as JSON array for MySQL/Postgres compatibility
    location_preferences = Column(JSON, nullable=True)  # Array of cities/areas
    workforce_capacity = Column(Integer, nullable=True)
    # New onboarding fields
    business_entity_type = Column(
        SQLEnum(BusinessEntityType, name="business_entity_type"),
        nullable=True
    )
    office_address = Column(String(500), nullable=True)
    google_maps_location = Column(String(500), nullable=True)
    gst_number = Column(String(50), nullable=True)
    rera_project_count = Column(Integer, nullable=True)
    project_size_range = Column(String(100), nullable=True)
    team_size_category = Column(
        SQLEnum(TeamSizeCategory, name="team_size_category"),
        nullable=True
    )
    total_projects_completed = Column(Integer, nullable=True)
    credibility_score = Column(Float, nullable=True, default=0.0)
    onboarding_status = Column(
        SQLEnum(OnboardingStatus, name="onboarding_status"),
        default=OnboardingStatus.IN_PROGRESS,
        nullable=False,
        index=True
    )
    approval_status = Column(
        SQLEnum(BuilderApprovalStatus, name="builder_approval_status"),
        default=BuilderApprovalStatus.PENDING,
        nullable=False,
        index=True,
    )
    approval_note = Column(Text, nullable=True)
    approved_by_admin_user_id = Column(String(32), nullable=True, index=True)
    approved_at = Column(DateTime, nullable=True)
    rejected_at = Column(DateTime, nullable=True)
    onboarding_step = Column(Integer, nullable=True, default=1)
    current_bandwidth = Column(String(50), nullable=True)  # e.g. Immediate, 1-3 months, Booked
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    user = relationship("User", backref="professional_profile")
    capabilities = relationship("Capability", back_populates="professional", cascade="all, delete-orphan")
    licenses = relationship("License", back_populates="professional", cascade="all, delete-orphan")
    portfolio = relationship("Portfolio", back_populates="professional", cascade="all, delete-orphan")
    pricing_tiers = relationship("PricingTier", back_populates="professional", cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="professional", cascade="all, delete-orphan")
    location_preferences_detail = relationship("LocationPreference", back_populates="professional", cascade="all, delete-orphan")
    subcontractor_scopes = relationship("SubcontractorScope", back_populates="professional", cascade="all, delete-orphan")
    project_size_categories = relationship("ProjectSizeCategory", back_populates="professional", cascade="all, delete-orphan")
    professional_pricing = relationship("ProfessionalPricing", back_populates="professional", cascade="all, delete-orphan")
    jv_jd_preferences = relationship("JVJDPreferences", back_populates="professional", cascade="all, delete-orphan", uselist=False)
    reconstruction_work_types = relationship("ReconstructionWorkType", back_populates="professional", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<ProfessionalProfile(id={self.id}, user_id={self.user_id}, company_name={self.company_name})>"


class Capability(Base):
    """Professional capability model"""
    
    __tablename__ = "capabilities"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    capability_type = Column(
        SQLEnum(CapabilityType, name="capability_type"),
        nullable=False,
        index=True
    )
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="capabilities")
    
    def __repr__(self) -> str:
        return f"<Capability(id={self.id}, professional_id={self.professional_id}, capability_type={self.capability_type})>"


class License(Base):
    """Professional license model"""
    
    __tablename__ = "licenses"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    license_number = Column(String(255), nullable=False)
    issuing_authority = Column(String(255), nullable=True)
    expiry_date = Column(Date, nullable=True)
    document_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="licenses")
    
    def __repr__(self) -> str:
        return f"<License(id={self.id}, professional_id={self.professional_id}, license_number={self.license_number})>"


class Portfolio(Base):
    """Professional portfolio model"""
    
    __tablename__ = "portfolios"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    project_name = Column(String(255), nullable=False)
    project_type = Column(
        SQLEnum(ProjectType, name="portfolio_project_type"),
        nullable=True
    )
    location = Column(String(255), nullable=True)
    area_sqft = Column(Float, nullable=True)
    completion_date = Column(Date, nullable=True)
    duration_months = Column(Integer, nullable=True)  # Duration in months
    # Stored as JSON array for MySQL/Postgres compatibility
    images = Column(JSON, nullable=True)  # Array of image URLs
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="portfolio")
    
    def __repr__(self) -> str:
        return f"<Portfolio(id={self.id}, professional_id={self.professional_id}, project_name={self.project_name})>"


class PricingTier(Base):
    """Professional pricing tier model"""
    
    __tablename__ = "pricing_tiers"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    capability_type = Column(
        SQLEnum(CapabilityType, name="pricing_capability_type"),
        nullable=False,
        index=True
    )
    min_area_sqft = Column(Float, nullable=True)
    max_area_sqft = Column(Float, nullable=True)
    price_per_sqft = Column(Float, nullable=False)
    tier_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="pricing_tiers")
    
    def __repr__(self) -> str:
        return f"<PricingTier(id={self.id}, professional_id={self.professional_id}, capability_type={self.capability_type})>"


class LocationPreference(Base):
    """Location preference with radius model"""
    
    __tablename__ = "location_preferences"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    location_name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    radius_km = Column(Float, nullable=True)
    capability_type = Column(
        SQLEnum(CapabilityType, name="location_capability_type"),
        nullable=True,
        index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="location_preferences_detail")
    
    def __repr__(self) -> str:
        return f"<LocationPreference(id={self.id}, professional_id={self.professional_id}, location={self.location_name})>"


class SubcontractorScope(Base):
    """Subcontractor scope model"""
    
    __tablename__ = "subcontractor_scopes"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    scope_type = Column(
        SQLEnum(SubcontractorScopeType, name="subcontractor_scope_type"),
        nullable=False,
        index=True
    )
    description = Column(Text, nullable=True)  # For "Other" type
    capability_type = Column(
        SQLEnum(CapabilityType, name="scope_capability_type"),
        nullable=True,
        index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="subcontractor_scopes")
    
    def __repr__(self) -> str:
        return f"<SubcontractorScope(id={self.id}, professional_id={self.professional_id}, scope_type={self.scope_type})>"


class ProjectSizeCategory(Base):
    """Project size category model"""
    
    __tablename__ = "project_size_categories"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    capability_type = Column(
        SQLEnum(CapabilityType, name="size_capability_type"),
        nullable=False,
        index=True
    )
    size_category = Column(
        SQLEnum(ProjectSizeCategoryEnum, name="project_size_category"),
        nullable=False
    )
    custom_range = Column(String(255), nullable=True)  # If CUSTOM
    wallet_size_range = Column(
        SQLEnum(WalletSizeRange, name="wallet_size_range"),
        nullable=True
    )  # For JV/JD
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="project_size_categories")
    
    def __repr__(self) -> str:
        return f"<ProjectSizeCategory(id={self.id}, professional_id={self.professional_id}, size_category={self.size_category})>"


class ProfessionalPricing(Base):
    """Enhanced professional pricing model"""
    
    __tablename__ = "professional_pricing"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    capability_type = Column(
        SQLEnum(CapabilityType, name="pricing_capability_type"),
        nullable=False,
        index=True
    )
    project_type = Column(
        SQLEnum(ProjectIntent, name="pricing_project_intent"),
        nullable=True
    )
    pricing_tier = Column(
        SQLEnum(PricingTierType, name="pricing_tier_type"),
        nullable=True
    )
    price_per_sqft = Column(Float, nullable=True)
    custom_pricing = Column(JSON, nullable=True)  # For Interior Designer specific projects
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="professional_pricing")
    
    def __repr__(self) -> str:
        return f"<ProfessionalPricing(id={self.id}, professional_id={self.professional_id}, capability_type={self.capability_type})>"


class JVJDPreferences(Base):
    """JV/JD developer preferences model"""
    
    __tablename__ = "jv_jd_preferences"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    # Stored as JSON array for MySQL/Postgres compatibility
    preferred_jv_models = Column(JSON, nullable=True)  # Array of JVModelType values
    rera_registered_projects_count = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="jv_jd_preferences")
    
    def __repr__(self) -> str:
        return f"<JVJDPreferences(id={self.id}, professional_id={self.professional_id})>"


class ReconstructionWorkType(Base):
    """Reconstruction work type preferences model"""
    
    __tablename__ = "reconstruction_work_types"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    work_type = Column(
        SQLEnum(ReconstructionWorkTypeEnum, name="reconstruction_work_type_enum"),
        nullable=False,
        index=True
    )
    custom_description = Column(Text, nullable=True)  # For CUSTOM type
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    professional = relationship("ProfessionalProfile", back_populates="reconstruction_work_types")
    
    def __repr__(self) -> str:
        return f"<ReconstructionWorkType(id={self.id}, professional_id={self.professional_id}, work_type={self.work_type})>"
