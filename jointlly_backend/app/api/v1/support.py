"""
Support chatbot API (no LLM).
"""

from __future__ import annotations

from typing import Optional

import time
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_optional_user
from app.exceptions import ForbiddenError, NotFoundError
from app.models.support import SupportTicket
from app.models.user import User
from app.schemas.support import (
    SupportChatRequest,
    SupportChatResponse,
    SupportSuggestionsResponse,
    SupportTicketCreateRequest,
    SupportTicketCreateResponse,
)
from app.services.support_service import SupportService
from app.utils.constants import Role


router = APIRouter(prefix="/support", tags=["Support"])

_RATE_BUCKETS: dict[str, list[float]] = {}
_RATE_WINDOW_SECONDS = 60.0
_RATE_MAX_REQUESTS = 30  # per IP per window


def _rate_limit(request: Request) -> None:
    ip = (request.client.host if request.client else "unknown") or "unknown"
    now = time.time()
    window_start = now - _RATE_WINDOW_SECONDS
    bucket = _RATE_BUCKETS.get(ip, [])
    bucket = [t for t in bucket if t >= window_start]
    if len(bucket) >= _RATE_MAX_REQUESTS:
        raise ForbiddenError("Too many requests. Please try again in a minute.")
    bucket.append(now)
    _RATE_BUCKETS[ip] = bucket


def _redact_text(text: str) -> str:
    # Basic redaction for tokens/passwords in user input.
    t = text or ""
    # Hide bearer tokens
    t = t.replace("Bearer ", "Bearer [REDACTED] ")
    # Cap very long inputs to keep DB safe
    if len(t) > 4000:
        t = t[:4000] + "…"
    return t


@router.post("/chat", response_model=SupportChatResponse)
async def support_chat(
    body: SupportChatRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    _rate_limit(request)
    # For authenticated users, always trust login role over request body.
    role = current_user.role.value if current_user else body.role
    # Normalize role to frontend-friendly values for audience filtering
    role_norm = None
    if role:
        r = str(role).lower()
        if r in ("landowner", Role.LANDOWNER.value.lower()):
            role_norm = "landowner"
        elif r in ("builder", "professional", Role.PROFESSIONAL.value.lower()):
            role_norm = "builder"
        elif r in ("admin", Role.ADMIN.value.lower()):
            role_norm = "admin"
        else:
            role_norm = r

    resp = await SupportService.chat(
        db,
        message=_redact_text(body.message),
        role=role_norm,
        route=body.route,
        context={
            "user_name": (current_user.name if current_user else None) or body.context.get("userName"),
            "user_email": (current_user.email if current_user else None) or body.context.get("userEmail"),
            "role": role_norm,
        },
    )
    return SupportChatResponse(
        message=resp["message"],
        chips=resp.get("chips") or [],
        articles=resp.get("articles") or [],
        flow=resp.get("flow"),
        escalation=resp.get("escalation"),
    )


@router.get("/suggestions", response_model=SupportSuggestionsResponse)
async def support_suggestions(
    request: Request,
    route: Optional[str] = None,
    role: Optional[str] = None,
    current_user: Optional[User] = Depends(get_optional_user),
):
    _rate_limit(request)
    # For authenticated users, always trust login role over query param.
    r = current_user.role.value if current_user else role
    r_norm = None
    if r:
        rl = str(r).lower()
        if rl in ("landowner", Role.LANDOWNER.value.lower()):
            r_norm = "landowner"
        elif rl in ("builder", "professional", Role.PROFESSIONAL.value.lower()):
            r_norm = "builder"
        elif rl in ("admin", Role.ADMIN.value.lower()):
            r_norm = "admin"
        else:
            r_norm = rl

    chips = []
    if r_norm == "builder":
        chips.append({"label": "How do I publish my builder card?", "action": {"type": "ask", "text": "How do I publish my card in marketplace?"}})
        chips.append({"label": "Open builder options", "action": {"type": "navigate", "to": "/builder/options"}})
    elif r_norm == "landowner":
        chips.append({"label": "How do I publish my request card?", "action": {"type": "ask", "text": "How do I publish my request in marketplace?"}})
        chips.append({"label": "Open landowner options", "action": {"type": "navigate", "to": "/landowner/options"}})
    else:
        chips.append({"label": "How Jointlly works", "action": {"type": "ask", "text": "How does Jointlly work?"}})

    if route and "marketplace" in (route.lower()):
        chips.append({"label": "Marketplace help", "action": {"type": "ask", "text": "How does marketplace work?"}})

    chips.append({"label": "Create a support ticket", "action": {"type": "create_ticket"}})
    return SupportSuggestionsResponse(chips=chips)


@router.post("/tickets", response_model=SupportTicketCreateResponse)
async def create_support_ticket(
    body: SupportTicketCreateRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    _rate_limit(request)
    user_id = None
    if current_user is not None:
        # Users.id is UUID in DB; store consistently as hex string
        user_id = getattr(current_user.id, "hex", None) or str(current_user.id)
    ticket = await SupportService.create_ticket(
        db,
        user_id=user_id,
        role=current_user.role.value if current_user else body.role,
        route=body.route,
        subject=_redact_text(body.subject),
        description=_redact_text(body.description),
        metadata=body.metadata,
    )
    return SupportTicketCreateResponse(ticketId=str(ticket.id), status=ticket.status)


@router.get("/tickets/{ticket_id}")
async def get_support_ticket(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
    ticket = result.scalar_one_or_none()
    if ticket is None:
        raise NotFoundError("SupportTicket", ticket_id)

    # If ticket is tied to a user, only that user (or admin) can view.
    if ticket.user_id:
        if current_user is None:
            raise ForbiddenError("Login required to view this ticket")
        if current_user.role == Role.ADMIN:
            return {"ticketId": ticket.id, "status": ticket.status}
        current_hex = getattr(current_user.id, "hex", None) or str(current_user.id)
        if ticket.user_id != current_hex:
            raise ForbiddenError("You cannot view this ticket")
    else:
        # Anonymous tickets: admin only (otherwise unguessable, but still restrict)
        if current_user is None or current_user.role != Role.ADMIN:
            raise ForbiddenError("You cannot view this ticket")

    return {"ticketId": ticket.id, "status": ticket.status}

