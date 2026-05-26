"""
Matching models
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import (
    Column,
    Float,
    DateTime,
    ForeignKey,
    String,
    Boolean,
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.constants import MatchStatus


class Match(Base):
    """Match model between projects and professionals"""
    
    __tablename__ = "matches"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    professional_id = Column(
        UUID(as_uuid=True),
        ForeignKey("professional_profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    match_score = Column(Float, nullable=False, index=True)
    estimated_cost = Column(Float, nullable=True)  # totalBUA * builder avg price_per_sqft
    status = Column(
        SQLEnum(MatchStatus, name="match_status"),
        default=MatchStatus.PENDING,
        nullable=False,
        index=True
    )
    # Mutual interest flags and timestamps
    express_interest_landowner = Column(Boolean, default=False, nullable=False)
    express_interest_builder = Column(Boolean, default=False, nullable=False)
    mutual_interest_at = Column(DateTime, nullable=True)
    # Gatekeeper unlock and monitoring timestamps
    gatekeeper_unlocked_at = Column(DateTime, nullable=True)
    t7_email_sent_at = Column(DateTime, nullable=True)
    t30_email_sent_at = Column(DateTime, nullable=True)
    # Deal & success fee fields (for Construction/JD)
    deal_value = Column(Float, nullable=True)
    deal_status = Column(String(50), nullable=True)
    success_fee_percent = Column(Float, nullable=True)
    success_fee_amount_total = Column(Float, nullable=True)
    success_fee_amount_builder = Column(Float, nullable=True)
    success_fee_amount_landowner = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    project = relationship("Project", back_populates="matches")
    professional = relationship("ProfessionalProfile", back_populates="matches")
    match_score_details = relationship("MatchScore", back_populates="match", uselist=False, cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="match")
    
    def __repr__(self) -> str:
        return f"<Match(id={self.id}, project_id={self.project_id}, professional_id={self.professional_id}, score={self.match_score})>"


class MatchScore(Base):
    """Detailed match score breakdown"""
    
    __tablename__ = "match_scores"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    match_id = Column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    project_type_score = Column(Float, nullable=True)
    location_score = Column(Float, nullable=True)
    project_size_score = Column(Float, nullable=True)
    pricing_score = Column(Float, nullable=True)
    capability_score = Column(Float, nullable=True)
    verification_score = Column(Float, nullable=True)
    proximity_score = Column(Float, nullable=True)
    response_speed_score = Column(Float, nullable=True)
    total_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    match = relationship("Match", back_populates="match_score_details")
    
    def __repr__(self) -> str:
        return f"<MatchScore(id={self.id}, match_id={self.match_id}, total_score={self.total_score})>"
