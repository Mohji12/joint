"""
Form submission model for marketplace forms (builder & landowner).
Stores raw JSON payload per form type.
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, String, DateTime, JSON
from app.database import Base


class FormSubmission(Base):
    """Stores submitted form data as JSON."""

    __tablename__ = "form_submissions"

    id = Column(
        String(32),
        primary_key=True,
        default=lambda: uuid4().hex,
        index=True,
    )
    user_id = Column(
        String(32),
        nullable=True,
        index=True,
    )
    form_type = Column(String(50), nullable=False, index=True)  # joint-venture | contract-construction
    side = Column(String(20), nullable=False, index=True)  # builder | landowner
    payload = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
