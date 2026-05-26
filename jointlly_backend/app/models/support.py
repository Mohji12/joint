"""
Support / help-center models (no-LLM chatbot backing store).
"""

from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, Column, DateTime, JSON, String, Text

from app.database import Base


class SupportArticle(Base):
    __tablename__ = "support_articles"

    id = Column(String(32), primary_key=True, default=lambda: uuid4().hex, index=True)
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=False, unique=True, index=True)

    # landowner | builder | admin | all
    audience = Column(String(20), nullable=False, index=True, default="all")
    category = Column(String(50), nullable=False, index=True, default="general")

    # List[str] stored as JSON for cross-dialect compatibility
    keywords = Column(JSON, nullable=False, default=list)

    content_md = Column(Text, nullable=False, default="")
    # Optional: list[{"title": str, "body": str, "cta": {...}}]
    steps_json = Column(JSON, nullable=True)

    active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SupportFlow(Base):
    __tablename__ = "support_flows"

    id = Column(String(32), primary_key=True, default=lambda: uuid4().hex, index=True)
    name = Column(String(255), nullable=False, index=True)

    # landowner | builder | admin | all
    audience = Column(String(20), nullable=False, index=True, default="all")
    trigger_keywords = Column(JSON, nullable=False, default=list)  # List[str]

    # Decision tree / flow graph stored as JSON for cross-dialect compatibility
    nodes_json = Column(JSON, nullable=False, default=dict)

    active = Column(Boolean, nullable=False, default=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(String(32), primary_key=True, default=lambda: uuid4().hex, index=True)

    # Keep as string (no FK) to avoid UUID/CHAR mismatches across MySQL/Postgres envs.
    user_id = Column(String(36), nullable=True, index=True)
    role = Column(String(20), nullable=True, index=True)  # LANDOWNER | PROFESSIONAL | ADMIN (or frontend aliases)
    route = Column(String(255), nullable=True, index=True)

    subject = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=False, default="")

    # open | triage | resolved | closed
    status = Column(String(20), nullable=False, index=True, default="open")
    metadata_json = Column(JSON, nullable=True)
    assigned_to = Column(String(36), nullable=True, index=True)
    admin_notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

