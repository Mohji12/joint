"""
Admin export history model for builder Excel downloads.
"""
from uuid import uuid4
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from app.database import Base


class AdminBuilderExport(Base):
    """Persisted metadata for generated builder export files."""

    __tablename__ = "admin_builder_exports"

    id = Column(
        String(32),
        primary_key=True,
        default=lambda: uuid4().hex,
        index=True,
    )
    scope = Column(String(20), nullable=False, index=True)  # single | bulk
    builder_id = Column(String(36), nullable=True, index=True)
    generated_by = Column(String(32), nullable=False, index=True)
    file_url_or_path = Column(String(500), nullable=False)
    row_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
