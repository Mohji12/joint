"""
Payment models
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, DateTime, ForeignKey,
    Enum as SQLEnum, Text, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
from app.utils.constants import TransactionType, TransactionStatus


class Transaction(Base):
    """Transaction model"""
    
    __tablename__ = "transactions"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    match_id = Column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    transaction_type = Column(
        SQLEnum(TransactionType, name="transaction_type"),
        nullable=False,
        index=True
    )
    amount = Column(Float, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    razorpay_order_id = Column(String(255), nullable=True, unique=True, index=True)
    razorpay_payment_id = Column(String(255), nullable=True, unique=True, index=True)
    razorpay_signature = Column(String(500), nullable=True)
    status = Column(
        SQLEnum(TransactionStatus, name="transaction_status"),
        default=TransactionStatus.PENDING,
        nullable=False,
        index=True
    )
    # Admin-only resolution metadata (does not trigger real refunds in Razorpay).
    admin_resolution_status = Column(String(20), nullable=True, index=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    user = relationship("User", backref="transactions")
    project = relationship("Project", back_populates="transactions")
    match = relationship("Match", back_populates="transactions")
    payments = relationship("Payment", back_populates="transaction", cascade="all, delete-orphan")
    
    def __repr__(self) -> str:
        return f"<Transaction(id={self.id}, user_id={self.user_id}, type={self.transaction_type}, status={self.status})>"


class Payment(Base):
    """Payment model"""
    
    __tablename__ = "payments"
    
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    transaction_id = Column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    payment_method = Column(String(100), nullable=True)
    status = Column(String(50), nullable=True)
    payment_metadata = Column(JSON, nullable=True)  # Additional payment metadata
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    transaction = relationship("Transaction", back_populates="payments")
    
    def __repr__(self) -> str:
        return f"<Payment(id={self.id}, transaction_id={self.transaction_id}, status={self.status})>"
