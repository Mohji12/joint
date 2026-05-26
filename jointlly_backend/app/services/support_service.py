"""
Rule-based support chatbot service (no LLM).

This service uses:
- keyword-based intent routing
- DB-backed support_articles/support_flows retrieval
- ticket creation when user is stuck
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple
from uuid import uuid4

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import OperationalError, ProgrammingError

from app.models.support import SupportArticle, SupportFlow, SupportTicket


@dataclass(frozen=True)
class _IntentResult:
    intent: str
    confidence: float
    matched: List[str]


@dataclass(frozen=True)
class _CreatedTicket:
    id: str
    status: str


class SupportService:
    """
    Small, deterministic support engine.
    Designed to work without embeddings/LLMs and remain easy to audit.
    """

    # Basic intent keyword map; expand over time (or move to DB).
    INTENT_KEYWORDS: Dict[str, List[str]] = {
        "how_it_works": ["how it works", "how works", "what is", "explain", "guide", "tutorial"],
        "marketplace_publish": ["publish", "marketplace", "card", "listing", "post", "post listing"],
        "form_fill": ["form", "fill", "submit", "onboarding", "profile", "request"],
        "login_issue": ["login", "sign in", "sign-in", "otp", "verify email", "verification", "token", "expired"],
        "payment_issue": ["payment", "razorpay", "paid", "refund", "failed", "success but", "not unlocked"],
        "upload_issue": ["upload", "image", "pdf", "file", "s3", "cloudinary", "failed to upload"],
        "far_calc": ["far", "fsr", "bbmp", "pid", "feasibility"],
        "matches": ["match", "matches", "opportunities", "connect"],
    }
    GREETING_KEYWORDS = {"hi", "hello", "hey", "hii", "yo", "good morning", "good afternoon", "good evening"}

    @staticmethod
    def _normalize(text: str) -> str:
        return " ".join((text or "").lower().strip().split())

    @classmethod
    def classify_intent(cls, message: str, *, route: Optional[str] = None) -> _IntentResult:
        msg = cls._normalize(message)
        rt = cls._normalize(route or "")

        best_intent = "general"
        best_score = 0.0
        best_matched: List[str] = []

        for intent, keys in cls.INTENT_KEYWORDS.items():
            matched = [k for k in keys if k in msg]
            score = float(len(matched))
            # Small route boosts
            if intent == "marketplace_publish" and ("marketplace" in rt or "options" in rt):
                score += 0.5
            if intent == "form_fill" and ("contract-construction" in rt or "joint-venture" in rt or "interior" in rt):
                score += 0.5
            if score > best_score:
                best_intent = intent
                best_score = score
                best_matched = matched

        confidence = 0.0 if best_score == 0 else min(1.0, 0.35 + 0.2 * best_score)
        return _IntentResult(intent=best_intent, confidence=confidence, matched=best_matched)

    @staticmethod
    async def _load_active_articles(db: AsyncSession, *, audience: Optional[str]) -> List[SupportArticle]:
        aud = (audience or "all").lower()
        # Store audience in DB as lowercase for consistency.
        try:
            result = await db.execute(
                select(SupportArticle).where(
                    SupportArticle.active.is_(True),
                    SupportArticle.audience.in_(["all", aud]),
                )
            )
            return list(result.scalars().all())
        except (ProgrammingError, OperationalError):
            # Tables not migrated yet (or DB is missing them). Fall back gracefully.
            return []

    @staticmethod
    async def _load_active_flows(db: AsyncSession, *, audience: Optional[str]) -> List[SupportFlow]:
        aud = (audience or "all").lower()
        try:
            result = await db.execute(
                select(SupportFlow).where(
                    SupportFlow.active.is_(True),
                    SupportFlow.audience.in_(["all", aud]),
                )
            )
            return list(result.scalars().all())
        except (ProgrammingError, OperationalError):
            # Tables not migrated yet (or DB is missing them). Fall back gracefully.
            return []

    @classmethod
    def _score_article(cls, article: SupportArticle, message: str, intent: str) -> float:
        msg = cls._normalize(message)
        score = 0.0
        # Keyword overlap
        kws = (article.keywords or []) if isinstance(article.keywords, list) else []
        for k in kws:
            k_norm = cls._normalize(str(k))
            if k_norm and k_norm in msg:
                score += 2.0
        # Title match
        if cls._normalize(article.title) and cls._normalize(article.title) in msg:
            score += 3.0
        # Category boost
        if article.category == intent:
            score += 1.5
        return score

    @classmethod
    def pick_articles(
        cls, articles: List[SupportArticle], *, message: str, intent: str, limit: int = 3
    ) -> List[SupportArticle]:
        scored = [(cls._score_article(a, message, intent), a) for a in articles]
        scored.sort(key=lambda x: x[0], reverse=True)
        # If nothing matched, still return the most general onboarding docs if present.
        top = [a for s, a in scored if s > 0][:limit]
        if top:
            return top
        fallback = [a for _, a in scored if a.category in ("general", "how_it_works")][:limit]
        return fallback

    @classmethod
    def pick_flow(
        cls, flows: List[SupportFlow], *, message: str, intent: str
    ) -> Optional[Tuple[SupportFlow, str]]:
        msg = cls._normalize(message)
        best: Optional[SupportFlow] = None
        best_score = 0.0
        for f in flows:
            keys = (f.trigger_keywords or []) if isinstance(f.trigger_keywords, list) else []
            matched = 0
            for k in keys:
                if cls._normalize(str(k)) in msg:
                    matched += 1
            score = float(matched)
            if f.name and cls._normalize(f.name) in msg:
                score += 1.0
            if score > best_score:
                best = f
                best_score = score
        if best is None or best_score <= 0:
            return None
        # Default node
        nodes = best.nodes_json or {}
        start_node = "start" if isinstance(nodes, dict) and "start" in nodes else next(iter(nodes.keys()), "start")
        return best, str(start_node)

    @staticmethod
    def _default_help_message(intent: str, role: Optional[str]) -> str:
        r = (role or "").lower()
        if intent == "marketplace_publish":
            if r in ("builder", "professional"):
                return "To publish your builder card, open Options, select your service type, and complete the form. Once submitted, it appears in the marketplace."
            if r == "landowner":
                return "To publish your request card, open Options, choose the request type, and complete the form. Your card will appear in the marketplace for builders."
            return "To publish your card/listing, go to Options, choose the relevant type, and complete the form."
        if intent == "login_issue":
            return "If you can’t login, first verify your email OTP (if prompted). If the token is expired, logout and login again."
        if intent == "payment_issue":
            return "If payment succeeded but something is still locked, refresh the page and check your Payments/Account. If it still doesn’t unlock, create a ticket with the payment id."
        return "Tell me what you’re trying to do, and I’ll guide you step-by-step."

    @classmethod
    def _pick_common_qa_article(cls, articles: List[SupportArticle], message: str) -> Optional[SupportArticle]:
        msg = cls._normalize(message)
        best: Optional[SupportArticle] = None
        best_score = 0.0
        for a in articles:
            if (a.category or "").lower() not in ("faq", "common_qa"):
                continue
            keys = a.keywords or []
            score = 0.0
            for k in keys:
                k_norm = cls._normalize(str(k))
                if k_norm and k_norm in msg:
                    score += 1.0
            if score > best_score:
                best = a
                best_score = score
        if best is None or best_score <= 0:
            return None
        return best

    @classmethod
    async def chat(
        cls,
        db: AsyncSession,
        *,
        message: str,
        role: Optional[str],
        route: Optional[str],
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        ctx = context or {}
        normalized_msg = cls._normalize(message)
        # Greeting: return short profile summary for logged-in users.
        if normalized_msg in cls.GREETING_KEYWORDS:
            name = str(ctx.get("user_name") or ctx.get("name") or "there")
            email = str(ctx.get("user_email") or ctx.get("email") or "").strip()
            role_label = str(role or ctx.get("role") or "user").lower()
            email_part = f" ({email})" if email else ""
            greet_msg = (
                f"Hi {name}! You are logged in as {role_label}{email_part}. "
                "You can ask me about publishing your card, forms, matches, payments, or account issues."
            )
            chips: List[Dict[str, Any]] = []
            if role_label in ("builder", "professional"):
                chips.append({"label": "Open builder options", "action": {"type": "navigate", "to": "/builder/options"}})
            elif role_label == "landowner":
                chips.append({"label": "Open landowner options", "action": {"type": "navigate", "to": "/landowner/options"}})
            elif role_label == "admin":
                chips.append({"label": "Open Admin Users", "action": {"type": "navigate", "to": "/admin/users"}})
            chips.append({"label": "Create a support ticket", "action": {"type": "create_ticket"}})
            return {
                "message": greet_msg,
                "chips": chips,
                "articles": [],
                "flow": None,
                "escalation": None,
            }

        articles = await cls._load_active_articles(db, audience=role)
        common = cls._pick_common_qa_article(articles, message)
        if common is not None:
            picked_articles = [a for a in cls.pick_articles(articles, message=message, intent="general", limit=4) if a.id != common.id][:3]
            chips: List[Dict[str, Any]] = []
            if (role or "").lower() in ("builder", "professional"):
                chips.append({"label": "Open builder options", "action": {"type": "navigate", "to": "/builder/options"}})
            elif (role or "").lower() == "landowner":
                chips.append({"label": "Open landowner options", "action": {"type": "navigate", "to": "/landowner/options"}})
            elif (role or "").lower() == "admin":
                chips.append({"label": "Open admin users", "action": {"type": "navigate", "to": "/admin/users"}})
            chips.append({"label": "Create a support ticket", "action": {"type": "create_ticket"}})
            return {
                "message": (common.content_md or "").strip(),
                "chips": chips,
                "articles": picked_articles,
                "flow": None,
                "escalation": None,
            }

        intent_res = cls.classify_intent(message, route=route)
        flows = await cls._load_active_flows(db, audience=role)

        picked_articles = cls.pick_articles(articles, message=message, intent=intent_res.intent, limit=3)
        picked_flow = cls.pick_flow(flows, message=message, intent=intent_res.intent)

        chips: List[Dict[str, Any]] = []
        # Common quick actions
        if (role or "").lower() in ("builder", "professional"):
            chips.append({"label": "Open builder options", "action": {"type": "navigate", "to": "/builder/options"}})
        if (role or "").lower() == "landowner":
            chips.append({"label": "Open landowner options", "action": {"type": "navigate", "to": "/landowner/options"}})
        chips.append({"label": "Create a support ticket", "action": {"type": "create_ticket"}})

        resp: Dict[str, Any] = {
            "message": cls._default_help_message(intent_res.intent, role),
            "chips": chips,
            "articles": picked_articles,
            "flow": None,
            "escalation": {"canCreateTicket": True} if intent_res.confidence < 0.4 else None,
        }

        if picked_flow:
            flow, node_id = picked_flow
            node = (flow.nodes_json or {}).get(node_id, {}) if isinstance(flow.nodes_json, dict) else {}
            prompt = str(node.get("prompt") or f"{flow.name}")
            options = node.get("options") or []
            resp["flow"] = {
                "flowId": flow.id,
                "nodeId": node_id,
                "prompt": prompt,
                "options": options,
            }

        return resp

    @staticmethod
    async def create_ticket(
        db: AsyncSession,
        *,
        user_id: Optional[str],
        role: Optional[str],
        route: Optional[str],
        subject: str,
        description: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> _CreatedTicket:
        # Use SQL text insert to stay compatible with old DBs that may not yet
        # have newly added nullable columns (e.g. assigned_to/admin_notes).
        ticket_id = uuid4().hex
        now = datetime.utcnow()
        await db.execute(
            text(
                """
                INSERT INTO support_tickets
                (id, user_id, `role`, route, subject, description, status, metadata_json, created_at, updated_at)
                VALUES
                (:id, :user_id, :role, :route, :subject, :description, :status, :metadata_json, :created_at, :updated_at)
                """
            ),
            {
                "id": ticket_id,
                "user_id": user_id,
                "role": role,
                "route": route,
                "subject": subject,
                "description": description,
                "status": "open",
                "metadata_json": metadata or {},
                "created_at": now,
                "updated_at": now,
            },
        )
        await db.commit()
        return _CreatedTicket(id=ticket_id, status="open")

