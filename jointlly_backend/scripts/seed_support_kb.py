"""
Seed initial Support KB content into support_articles/support_flows.

Usage:
  # From jointlly_backend, venv activated, DATABASE_URL set
  python scripts/seed_support_kb.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path
from typing import Any, Dict, List

from sqlalchemy import select

_BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(_BACKEND_ROOT))

from app.database import AsyncSessionLocal, close_db
from app.models.support import SupportArticle, SupportFlow


ROOT = Path(__file__).resolve().parents[2]  # repo root


def _read_file(rel_path: str) -> str:
    p = ROOT / rel_path
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


ARTICLES: List[Dict[str, Any]] = [
    # General
    {
        "slug": "publish-card-marketplace",
        "title": "How to publish your card in Marketplace",
        "audience": "all",
        "category": "marketplace_publish",
        "keywords": ["publish", "marketplace", "card", "listing", "post listing", "options", "form"],
        "content_md": "Your marketplace card is created when you submit the relevant form.\n\nLandowner path: /landowner/options\nBuilder path: /builder/options\n\nAfter submission, your card becomes visible in marketplace.",
    },
    {
        "slug": "auth-troubleshooting",
        "title": "Login and OTP troubleshooting",
        "audience": "all",
        "category": "login_issue",
        "keywords": ["login", "otp", "verify", "verification", "expired token", "401", "unauthorized"],
        "content_md": _read_file("jointlly_backend/AUTHENTICATION_SETUP.md") or "Use login screen, request OTP again, and retry.",
    },
    {
        "slug": "frontend-backend-connection",
        "title": "Frontend to backend connection setup",
        "audience": "all",
        "category": "general",
        "keywords": ["network error", "api", "backend", "port 8001", "proxy", "cors"],
        "content_md": _read_file("CONNECT.md") or "Ensure frontend API base URL points to backend and backend is running.",
    },
    {
        "slug": "payment-help-general",
        "title": "Payment success but feature still locked",
        "audience": "all",
        "category": "payment_issue",
        "keywords": ["payment", "paid", "unlock", "failed", "refund", "razorpay"],
        "content_md": "If payment is successful but access is locked: refresh page, re-login once, and check transactions. If issue remains, create support ticket with payment id/order id.",
    },
    # FAQ/Common QA (DB-driven quick replies)
    {
        "slug": "faq-publish-card",
        "title": "FAQ: How do I publish my card?",
        "audience": "all",
        "category": "faq",
        "keywords": ["how to publish", "publish card", "publish my card", "how do i publish", "marketplace card"],
        "content_md": "To publish your card, open Options, choose your request/service type, complete required fields, and submit.",
    },
    {
        "slug": "faq-edit-profile",
        "title": "FAQ: How do I edit my profile?",
        "audience": "all",
        "category": "faq",
        "keywords": ["edit profile", "update profile", "change profile", "profile update"],
        "content_md": "Go to your dashboard profile/options section, update your details, and save. If data does not refresh, logout and login again once.",
    },
    {
        "slug": "faq-track-matches",
        "title": "FAQ: Where can I track my matches?",
        "audience": "all",
        "category": "faq",
        "keywords": ["where are my matches", "view matches", "track matches", "matches status"],
        "content_md": "Track matches from your dashboard matching section. Open a match to see current status and next actions.",
    },
    {
        "slug": "faq-payment-not-reflecting",
        "title": "FAQ: Payment not reflecting",
        "audience": "all",
        "category": "faq",
        "keywords": ["payment failed", "payment not reflecting", "paid but not unlocked", "refund", "payment issue"],
        "content_md": "If payment succeeded but feature is locked, refresh and re-login once, then check transactions. If unresolved, create a support ticket with order/payment id.",
    },
    {
        "slug": "faq-login-otp-help",
        "title": "FAQ: Login/OTP help",
        "audience": "all",
        "category": "faq",
        "keywords": ["login issue", "can't login", "cannot login", "otp not received", "verification issue", "reset password"],
        "content_md": "Retry login and OTP verification. If OTP/token expired, request a fresh login. If issue persists, create a support ticket.",
    },
    {
        "slug": "faq-contact-support",
        "title": "FAQ: How do I contact support?",
        "audience": "all",
        "category": "faq",
        "keywords": ["how to contact support", "contact support", "raise ticket", "create ticket"],
        "content_md": "Use 'Create a support ticket' in chat. Add clear issue details and include payment/order ids for payment-related issues.",
    },
    {
        "slug": "faq-required-documents",
        "title": "FAQ: What documents are needed?",
        "audience": "all",
        "category": "faq",
        "keywords": ["what documents needed", "required documents", "documents required", "what to upload"],
        "content_md": "Keep role-specific details ready: profile/contact info, project/service details, and any requested supporting files.",
    },
    {
        "slug": "faq-what-is-jointlly",
        "title": "FAQ: What is Jointlly?",
        "audience": "all",
        "category": "faq",
        "keywords": ["how jointlly works", "what is jointlly", "about jointlly", "platform flow"],
        "content_md": "Jointlly connects landowners and builders through structured forms, marketplace visibility, and matching workflows.",
    },
    # Landowner
    {
        "slug": "how-jointlly-works-landowner",
        "title": "How Jointlly works for Landowners",
        "audience": "landowner",
        "category": "how_it_works",
        "keywords": ["how it works", "landowner", "dashboard", "options", "publish", "marketplace", "matches"],
        "content_md": "Landowners create project requests and receive builder matches.\n\nSteps:\n1) Login\n2) Open Landowner Options\n3) Select request type and submit form\n4) Track responses/matches in dashboard",
    },
    {
        "slug": "landowner-contract-construction-form",
        "title": "Landowner contract construction form help",
        "audience": "landowner",
        "category": "form_fill",
        "keywords": ["contract construction", "form", "landowner form", "google maps location"],
        "content_md": "In contract construction form, fill location, project details, and submit. Keep Google Maps pin accurate, because builders use it for relevance and outreach.",
    },
    {
        "slug": "landowner-joint-venture-form",
        "title": "Landowner joint venture form help",
        "audience": "landowner",
        "category": "form_fill",
        "keywords": ["joint venture", "jv", "landowner form", "marketplace request"],
        "content_md": "Joint venture form should include property context, project intent, and expected collaboration terms. Complete all required fields before submit.",
    },
    {
        "slug": "landowner-marketplace-and-matches",
        "title": "Landowner marketplace and matches guide",
        "audience": "landowner",
        "category": "matches",
        "keywords": ["matches", "builder matching", "marketplace", "connections"],
        "content_md": "Once your request is submitted, it appears in marketplace and matching. Track match progress and respond quickly to improve closure.",
    },
    # Builder / Professional
    {
        "slug": "how-jointlly-works-builder",
        "title": "How Jointlly works for Builders",
        "audience": "builder",
        "category": "how_it_works",
        "keywords": ["how it works", "builder", "professional", "dashboard", "options", "marketplace", "matches"],
        "content_md": "Builders create their service profile and portfolio, then receive landowner opportunities.\n\nSteps:\n1) Login\n2) Open Builder Options\n3) Submit profile/service form\n4) Review and act on matches",
    },
    {
        "slug": "builder-reconstruction-form",
        "title": "Builder reconstruction form help",
        "audience": "builder",
        "category": "form_fill",
        "keywords": ["builder reconstruction", "reconstruction form", "service area", "licenses"],
        "content_md": "In reconstruction flow, provide service areas, capabilities, and credentials clearly. Better profile clarity improves match confidence.",
    },
    {
        "slug": "builder-portfolio-best-practices",
        "title": "Builder portfolio best practices",
        "audience": "builder",
        "category": "form_fill",
        "keywords": ["portfolio", "builder portfolio", "images", "project showcase"],
        "content_md": "Upload recent project media with concise project details. Strong portfolio quality improves credibility and conversion.",
    },
    {
        "slug": "builder-matches-and-unlock",
        "title": "Builder match selection and unlock flow",
        "audience": "builder",
        "category": "matches",
        "keywords": ["builder matches", "unlock", "selection", "payment unlock"],
        "content_md": "Match states progress as interest and unlock steps complete. If an unlock payment succeeds but status does not update, raise a support ticket.",
    },
    # Admin
    {
        "slug": "admin-user-360-guide",
        "title": "Admin User 360 guide",
        "audience": "admin",
        "category": "how_it_works",
        "keywords": ["admin", "user 360", "admin users", "operations"],
        "content_md": "User 360 consolidates user profile, submissions, matches, payments, and tickets in one page for admin triage and oversight.",
    },
    {
        "slug": "admin-support-tickets-guide",
        "title": "Admin support ticket operations",
        "audience": "admin",
        "category": "general",
        "keywords": ["admin support tickets", "triage", "resolved", "admin notes"],
        "content_md": "Use support tickets admin page to filter by status/user/search, open a ticket, mark triage/resolved, and save internal notes.",
    },
    {
        "slug": "admin-payment-cases-guide",
        "title": "Admin payments cases operations",
        "audience": "admin",
        "category": "payment_issue",
        "keywords": ["admin payments", "resolution", "investigating", "resolved", "refund case"],
        "content_md": "Use payments cases page to update admin resolution state (OPEN, INVESTIGATING, RESOLVED) and internal notes for each transaction case.",
    },
]


FLOWS: List[Dict[str, Any]] = [
    {
        "name": "Publish my card",
        "audience": "all",
        "trigger_keywords": ["publish", "marketplace", "card", "listing"],
        "nodes_json": {
            "start": {
                "prompt": "What do you want to publish?",
                "options": [
                    {"id": "landowner", "label": "Landowner request card", "action": {"type": "navigate", "to": "/landowner/options"}},
                    {"id": "builder", "label": "Builder profile card", "action": {"type": "navigate", "to": "/builder/options"}},
                    {"id": "ticket", "label": "Still stuck (create ticket)", "action": {"type": "create_ticket"}},
                ],
            }
        },
    },
    {
        "name": "Landowner getting started",
        "audience": "landowner",
        "trigger_keywords": ["landowner", "start", "begin", "how do i post", "request card"],
        "nodes_json": {
            "start": {
                "prompt": "Landowner setup: what do you want to do?",
                "options": [
                    {"id": "publish", "label": "Publish my request", "action": {"type": "navigate", "to": "/landowner/options"}},
                    {"id": "market", "label": "Understand marketplace flow", "action": {"type": "ask", "text": "How does landowner marketplace and matching work?"}},
                    {"id": "ticket", "label": "I need help from support", "action": {"type": "create_ticket"}},
                ],
            }
        },
    },
    {
        "name": "Builder getting started",
        "audience": "builder",
        "trigger_keywords": ["builder", "professional", "start", "begin", "publish profile"],
        "nodes_json": {
            "start": {
                "prompt": "Builder setup: choose an action",
                "options": [
                    {"id": "publish", "label": "Publish builder profile", "action": {"type": "navigate", "to": "/builder/options"}},
                    {"id": "portfolio", "label": "Improve portfolio quality", "action": {"type": "ask", "text": "How can I improve my builder portfolio?"}},
                    {"id": "ticket", "label": "Create support ticket", "action": {"type": "create_ticket"}},
                ],
            }
        },
    },
    {
        "name": "Login and OTP help",
        "audience": "all",
        "trigger_keywords": ["login", "otp", "verify", "verification", "token", "expired"],
        "nodes_json": {
            "start": {
                "prompt": "Try these first: re-check OTP, retry login, and refresh session. If still blocked, create ticket.",
                "options": [
                    {"id": "retry", "label": "I will retry login", "action": {"type": "ask", "text": "Show login troubleshooting steps"}},
                    {"id": "ticket", "label": "Still blocked, create ticket", "action": {"type": "create_ticket"}},
                ],
            }
        },
    },
    {
        "name": "Payment issue resolver",
        "audience": "all",
        "trigger_keywords": ["payment", "failed payment", "unlock not working", "refund", "razorpay"],
        "nodes_json": {
            "start": {
                "prompt": "Payment issue support: what do you need?",
                "options": [
                    {"id": "steps", "label": "Show payment troubleshooting steps", "action": {"type": "ask", "text": "Payment succeeded but feature is not unlocked"}},
                    {"id": "ticket", "label": "Open payment support ticket", "action": {"type": "create_ticket"}},
                ],
            }
        },
    },
    {
        "name": "Admin operations quick help",
        "audience": "admin",
        "trigger_keywords": ["admin", "user 360", "support tickets", "payments cases", "operations"],
        "nodes_json": {
            "start": {
                "prompt": "Admin quick navigation:",
                "options": [
                    {"id": "users", "label": "Open Admin Users", "action": {"type": "navigate", "to": "/admin/users"}},
                    {"id": "tickets", "label": "Open Support Tickets", "action": {"type": "navigate", "to": "/admin/support-tickets"}},
                    {"id": "payments", "label": "Open Payments Cases", "action": {"type": "navigate", "to": "/admin/payments-cases"}},
                ],
            }
        },
    },
]


async def _upsert_article(db, data: Dict[str, Any]) -> None:
    existing = (await db.execute(select(SupportArticle).where(SupportArticle.slug == data["slug"]))).scalar_one_or_none()
    if existing:
        existing.title = data["title"]
        existing.audience = data["audience"]
        existing.category = data["category"]
        existing.keywords = data.get("keywords") or []
        existing.content_md = data.get("content_md") or ""
        existing.active = True
    else:
        db.add(
            SupportArticle(
                title=data["title"],
                slug=data["slug"],
                audience=data["audience"],
                category=data["category"],
                keywords=data.get("keywords") or [],
                content_md=data.get("content_md") or "",
                steps_json=data.get("steps_json"),
                active=True,
            )
        )


async def _upsert_flow(db, data: Dict[str, Any]) -> None:
    existing = (await db.execute(select(SupportFlow).where(SupportFlow.name == data["name"]))).scalar_one_or_none()
    if existing:
        existing.audience = data["audience"]
        existing.trigger_keywords = data.get("trigger_keywords") or []
        existing.nodes_json = data.get("nodes_json") or {}
        existing.active = True
    else:
        db.add(
            SupportFlow(
                name=data["name"],
                audience=data["audience"],
                trigger_keywords=data.get("trigger_keywords") or [],
                nodes_json=data.get("nodes_json") or {},
                active=True,
            )
        )


async def main() -> None:
    if AsyncSessionLocal is None:
        raise RuntimeError("Database is not configured. Set DATABASE_URL in environment.")
    async with AsyncSessionLocal() as db:
        for a in ARTICLES:
            await _upsert_article(db, a)
        for f in FLOWS:
            await _upsert_flow(db, f)
        await db.commit()
    await close_db()
    print("Seeded support KB.")


if __name__ == "__main__":
    asyncio.run(main())

