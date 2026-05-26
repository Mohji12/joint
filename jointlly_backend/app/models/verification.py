"""
Verification models (FAR, Feasibility, PID)
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, Integer, Boolean, DateTime,
    ForeignKey, Enum as SQLEnum, Text, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.constants import VerificationStatus


class FARCalculation(Base):
    """FAR (Floor Area Ratio) calculation model"""
    
    __tablename__ = "far_calculations"
    
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
    road_width_ft = Column(Float, nullable=False)
    zone_type = Column(String(100), nullable=True)
    calculated_far = Column(Float, nullable=False)
    total_buildable_area = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    property = relationship("Property", back_populates="far_calculations")
    
    def __repr__(self) -> str:
        return f"<FARCalculation(id={self.id}, property_id={self.property_id}, far={self.calculated_far})>"


class FeasibilityReport(Base):
    """Feasibility report model"""
    
    __tablename__ = "feasibility_reports"
    
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
    plot_category = Column(String(100), nullable=True)  # e.g., "60-150 sq m"
    front_setback_m = Column(Float, nullable=True)
    rear_setback_m = Column(Float, nullable=True)
    side_setback_m = Column(Float, nullable=True)
    net_buildable_area_sqft = Column(Float, nullable=True)
    allowed_floors = Column(Integer, nullable=True)  # e.g., stilt + 4 = 5 total
    total_built_up_area_sqft = Column(Float, nullable=True)
    saleable_area_sqft = Column(Float, nullable=True)
    number_of_units = Column(Integer, nullable=True)
    is_unlocked = Column(Boolean, default=False, nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    property = relationship("Property", back_populates="feasibility_reports")
    
    def __repr__(self) -> str:
        return f"<FeasibilityReport(id={self.id}, property_id={self.property_id}, is_unlocked={self.is_unlocked})>"


class PIDVerification(Base):
    """PID (Property ID) verification model"""
    
    __tablename__ = "pid_verifications"
    
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
    pid_number = Column(String(100), nullable=False, index=True)
    owner_name = Column(String(255), nullable=True)
    location_details = Column(JSON, nullable=True)  # Ward, Street ID, Plot No.
    tax_history = Column(JSON, nullable=True)  # Dues and receipts
    e_khatha_status = Column(String(100), nullable=True)
    verification_status = Column(
        SQLEnum(VerificationStatus, name="verification_status"),
        default=VerificationStatus.PENDING,
        nullable=False,
        index=True
    )
    verification_fee = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    property = relationship("Property", back_populates="pid_verifications")
    
    def __repr__(self) -> str:
        return f"<PIDVerification(id={self.id}, property_id={self.property_id}, status={self.verification_status})>"
