"""
Email OTP model for account verification flows.
Stores only a hash of the OTP (never the raw OTP).
"""

from uuid import uuid4
from datetime import datetime

from sqlalchemy import Column, String, DateTime

from app.database import Base


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(
        String(32),
        primary_key=True,
        default=lambda: uuid4().hex,
        index=True,
    )
    # UUID string (36 chars including dashes)
    user_id = Column(String(36), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    purpose = Column(String(50), nullable=False, index=True)  # e.g. "email_verify"
    otp_hash = Column(String(128), nullable=False)
    expires_at = Column(DateTime, nullable=False, index=True)
    attempts = Column(String(10), nullable=False, default="0")  # keep stringy style consistent
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

