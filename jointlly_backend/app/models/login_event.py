"""
User login event model for admin observability.
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Column, DateTime, String

from app.database import Base


class LoginEvent(Base):
    __tablename__ = "login_events"

    id = Column(String(32), primary_key=True, default=lambda: uuid4().hex, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

