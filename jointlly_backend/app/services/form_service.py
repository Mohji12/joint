"""
Service for saving marketplace form submissions.
"""
from typing import Any, Dict, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.form_submission import FormSubmission


def _normalize_uuid(v: Any) -> Optional[str]:
    if v is None:
        return None
    if isinstance(v, UUID):
        return v.hex
    s = str(v)
    # Accept either UUID with hyphens or existing hex id
    if len(s) == 36 and "-" in s:
        return s.replace("-", "")
    return s


async def create_form_submission(
    db: AsyncSession,
    form_type: str,
    side: str,
    payload: Dict[str, Any],
    user_id: Optional[UUID] = None,
) -> FormSubmission:
    """Store a form submission and return it."""
    submission = FormSubmission(
        user_id=_normalize_uuid(user_id),
        form_type=form_type,
        side=side,
        payload=payload,
    )
    db.add(submission)
    await db.flush()
    await db.refresh(submission)
    return submission
