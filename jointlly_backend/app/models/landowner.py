"""
Landowner models
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime,
    ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.constants import ProjectType, ProjectStatus, ProjectIntent, JVPostConstructionExpectation


class LandownerProfile(Base):
    """Landowner profile model"""
    
    __tablename__ = "landowner_profiles"
    
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
    name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    user = relationship("User", backref="landowner_profile")
    properties = relationship("Property", back_populates="landowner", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<LandownerProfile(id={self.id}, user_id={self.user_id}, name={self.name})>"


class Property(Base):
    """Property model"""
    
    __tablename__ = "properties"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    landowner_id = Column(
        UUID(as_uuid=True),
        ForeignKey("landowner_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    name = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    ward = Column(String(100), nullable=True)
    landmark = Column(String(255), nullable=True)
    google_maps_pin = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    width_ft = Column(Float, nullable=True)
    length_ft = Column(Float, nullable=True)
    facing = Column(String(50), nullable=True)
    is_corner_plot = Column(Boolean, default=False, nullable=False)
    # Stored as JSON array for MySQL/Postgres compatibility (for corner plots)
    facings = Column(JSON, nullable=True)
    road_width_ft = Column(Float, nullable=True)
    khatha_type = Column(String(100), nullable=True)
    e_khatha_status = Column(String(100), nullable=True)
    tax_paid = Column(Boolean, default=False, nullable=False)
    pid_number = Column(String(100), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    landowner = relationship("LandownerProfile", back_populates="properties")
    projects = relationship("Project", back_populates="property", cascade="all, delete-orphan")
    far_calculations = relationship("FARCalculation", back_populates="property", cascade="all, delete-orphan")
    feasibility_reports = relationship("FeasibilityReport", back_populates="property", cascade="all, delete-orphan")
    pid_verifications = relationship("PIDVerification", back_populates="property", cascade="all, delete-orphan")
    
    @property
    def plot_area_sqft(self) -> float:
        """Calculate plot area in square feet"""
        if self.width_ft and self.length_ft:
            return self.width_ft * self.length_ft
        return 0.0
    
    def __repr__(self) -> str:
        return f"<Property(id={self.id}, landowner_id={self.landowner_id}, city={self.city})>"


class Project(Base):
    """Project model"""
    
    __tablename__ = "projects"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    property_id = Column(
        UUID(as_uuid=True),
        ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    project_type = Column(
        SQLEnum(ProjectType, name="project_type"),
        nullable=False,
        index=True
    )
    intent = Column(
        SQLEnum(ProjectIntent, name="project_intent"),
        nullable=True
    )
    asset_class = Column(String(50), nullable=True, index=True)  # e.g. RESIDENTIAL_VILLA, COMMERCIAL_OFFICE
    budget_tier = Column(String(20), nullable=True)  # BASIC, STANDARD, LUXURY
    timeline = Column(String(100), nullable=True)
    scope = Column(Text, nullable=True)
    status = Column(
        SQLEnum(ProjectStatus, name="project_status"),
        default=ProjectStatus.DRAFT,
        nullable=False,
        index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    property = relationship("Property", back_populates="projects")
    jv_preferences = relationship("JVPreferences", back_populates="project", uselist=False, cascade="all, delete-orphan")
    matches = relationship("Match", back_populates="project", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="project")
    
    def __repr__(self) -> str:
        return f"<Project(id={self.id}, property_id={self.property_id}, project_type={self.project_type})>"


class JVPreferences(Base):
    """JV/JD preferences model"""
    
    __tablename__ = "jv_preferences"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    post_construction_expectation = Column(
        SQLEnum(JVPostConstructionExpectation, name="jv_expectation"),
        nullable=True
    )
    development_vision = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="jv_preferences")
    
    def __repr__(self) -> str:
        return f"<JVPreferences(id={self.id}, project_id={self.project_id})>"
