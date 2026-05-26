"""
Admin service: list users, landowners, professionals, form submissions; dashboard stats.
All functions are for admin-only use (caller must enforce require_admin).
"""
from datetime import datetime
from enum import Enum
from uuid import UUID
from typing import List, Optional, Dict, Any
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.user import User
from app.models.landowner import LandownerProfile, Property, Project, JVPreferences
from app.models.professional import (
    ProfessionalProfile,
    Capability,
    License,
    Portfolio,
    PricingTier,
)
from app.models.form_submission import FormSubmission
from app.models.matching import Match
from app.models.payment import Transaction
from app.models.support import SupportTicket
from app.models.admin_audit_log import AdminAuditLog
from app.models.login_event import LoginEvent
from app.utils.constants import Role, ProjectStatus, TransactionType
from app.utils.constants import BuilderApprovalStatus
from app.exceptions import NotFoundError, ValidationError
from app.utils.password import get_password_hash
from app.schemas.forms import BuilderPortfolioLatestResponse, FormSubmissionDetailResponse


class AdminService:
    @staticmethod
    def _json_safe_snapshot(value: Any) -> Any:
        """Convert ORM/enum/datetime values into JSON-serializable audit payloads."""
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, UUID):
            return str(value)
        if isinstance(value, Enum):
            return value.value
        if isinstance(value, dict):
            return {str(k): AdminService._json_safe_snapshot(v) for k, v in value.items()}
        if isinstance(value, (list, tuple, set)):
            return [AdminService._json_safe_snapshot(v) for v in value]
        return value

    @staticmethod
    def _normalize_user_id(value: Any) -> str:
        if isinstance(value, UUID):
            return str(value)
        return str(value or "").strip()

    @staticmethod
    async def _last_login_map_for_users(
        db: AsyncSession,
        user_ids: List[UUID],
    ) -> Dict[str, Any]:
        if not user_ids:
            return {}

        keys = {str(uid) for uid in user_ids}
        result = await db.execute(
            select(LoginEvent.user_id, func.max(LoginEvent.created_at))
            .where(LoginEvent.user_id.in_(keys))
            .group_by(LoginEvent.user_id)
        )
        return {str(row[0]): row[1] for row in result.all()}

    @staticmethod
    async def _has_any_builder_form(db: AsyncSession, user_id_hex: str) -> bool:
        result = await db.execute(
            select(FormSubmission.id)
            .where(
                FormSubmission.side == "builder",
                FormSubmission.user_id == user_id_hex,
                FormSubmission.form_type.in_(
                    ["contract-construction", "joint-venture", "interior", "reconstruction"]
                ),
            )
            .limit(1)
        )
        return result.scalar_one_or_none() is not None

    """Admin-only read operations."""

    @staticmethod
    async def list_users(
        db: AsyncSession,
        role: Optional[Role] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[dict]:
        """List users with optional role filter. Never returns hashed_password."""
        query = select(User).order_by(User.created_at.desc()).offset(skip).limit(limit)
        if role is not None:
            query = query.where(User.role == role)
        result = await db.execute(query)
        users = list(result.scalars().all())
        last_login_map = await AdminService._last_login_map_for_users(db, [u.id for u in users])
        out = []
        for user in users:
            out.append(
                {
                    "id": user.id,
                    "email": user.email,
                    "name": user.name,
                    "role": user.role,
                    "is_active": user.is_active,
                    "created_at": user.created_at,
                    "last_login_at": last_login_map.get(str(user.id)),
                }
            )
        return out

    @staticmethod
    async def list_landowners(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ) -> List[dict]:
        """List landowner profiles with user info and property/project counts."""
        result = await db.execute(
            select(LandownerProfile)
            .options(selectinload(LandownerProfile.user))
            .order_by(LandownerProfile.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        profiles = list(result.scalars().unique().all())
        if not profiles:
            return []

        landowner_ids = [p.id for p in profiles]
        # Property counts per landowner
        prop_count = await db.execute(
            select(Property.landowner_id, func.count(Property.id).label("cnt"))
            .where(Property.landowner_id.in_(landowner_ids))
            .group_by(Property.landowner_id)
        )
        prop_map = {row[0]: row[1] for row in prop_count.all()}
        # Project counts per landowner (via properties)
        proj_count = await db.execute(
            select(Property.landowner_id, func.count(Project.id).label("cnt"))
            .join(Project, Project.property_id == Property.id)
            .where(Property.landowner_id.in_(landowner_ids))
            .group_by(Property.landowner_id)
        )
        proj_map = {row[0]: row[1] for row in proj_count.all()}

        out = []
        for p in profiles:
            user = p.user
            out.append({
                "id": p.id,
                "user_id": p.user_id,
                "name": p.name,
                "phone": p.phone,
                "city": p.city,
                "created_at": p.created_at,
                "user_email": user.email if user else None,
                "user_name": user.name if user else None,
                "property_count": prop_map.get(p.id, 0),
                "project_count": proj_map.get(p.id, 0),
            })
        return out

    @staticmethod
    async def get_landowner_detail(db: AsyncSession, landowner_id: UUID) -> dict:
        """Single landowner with profile, user, properties, projects (with JV preferences)."""
        result = await db.execute(
            select(LandownerProfile)
            .options(
                selectinload(LandownerProfile.user),
                selectinload(LandownerProfile.properties).selectinload(Property.projects).selectinload(Project.jv_preferences),
            )
            .where(LandownerProfile.id == landowner_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("LandownerProfile", str(landowner_id))

        user = profile.user
        projects_list = []
        for prop in profile.properties:
            for proj in prop.projects:
                projects_list.append(proj)

        return {
            "profile": profile,
            "user_email": user.email if user else None,
            "user_name": user.name if user else None,
            "properties": list(profile.properties),
            "projects": projects_list,
        }

    @staticmethod
    async def list_professionals(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ) -> List[dict]:
        """List professional profiles with user info and capability types."""
        result = await db.execute(
            select(ProfessionalProfile)
            .options(
                selectinload(ProfessionalProfile.user),
                selectinload(ProfessionalProfile.capabilities),
            )
            .order_by(ProfessionalProfile.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        profiles = list(result.scalars().unique().all())
        out = []
        for p in profiles:
            caps = [c.capability_type.value if hasattr(c.capability_type, "value") else str(c.capability_type) for c in (p.capabilities or [])]
            user = p.user
            out.append({
                "id": p.id,
                "user_id": p.user_id,
                "company_name": p.company_name,
                "phone": p.phone,
                "city": p.city,
                "experience_years": p.experience_years,
                "rera_experience": p.rera_experience,
                "created_at": p.created_at,
                "user_email": user.email if user else None,
                "user_name": user.name if user else None,
                "capability_types": caps,
                "approval_status": p.approval_status,
                "approved_at": p.approved_at,
                "rejected_at": p.rejected_at,
                "has_builder_submission": await AdminService._has_any_builder_form(db, p.user_id.hex),
            })
        return out

    @staticmethod
    async def get_professional_detail(db: AsyncSession, professional_id: UUID) -> dict:
        """Single professional with profile, user, capabilities, licenses, portfolio, pricing."""
        result = await db.execute(
            select(ProfessionalProfile)
            .options(
                selectinload(ProfessionalProfile.user),
                selectinload(ProfessionalProfile.capabilities),
                selectinload(ProfessionalProfile.licenses),
                selectinload(ProfessionalProfile.portfolio),
                selectinload(ProfessionalProfile.pricing_tiers),
            )
            .where(ProfessionalProfile.id == professional_id)
        )
        profile = result.scalar_one_or_none()
        if not profile:
            raise NotFoundError("ProfessionalProfile", str(professional_id))

        user = profile.user
        return {
            "profile": profile,
            "user_email": user.email if user else None,
            "user_name": user.name if user else None,
            "capabilities": list(profile.capabilities or []),
            "licenses": list(profile.licenses or []),
            "portfolio": list(profile.portfolio or []),
            "pricing_tiers": list(profile.pricing_tiers or []),
            "location_preferences": profile.location_preferences,
            "approval_status": profile.approval_status,
            "approval_note": getattr(profile, "approval_note", None),
            "approved_by_admin_user_id": getattr(profile, "approved_by_admin_user_id", None),
            "approved_at": getattr(profile, "approved_at", None),
            "rejected_at": getattr(profile, "rejected_at", None),
            "has_builder_submission": await AdminService._has_any_builder_form(db, profile.user_id.hex),
        }

    @staticmethod
    async def update_professional_approval(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        professional_id: UUID,
        status_value: str,
        note: Optional[str] = None,
    ) -> dict:
        result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            raise NotFoundError("ProfessionalProfile", str(professional_id))

        has_builder_submission = await AdminService._has_any_builder_form(db, profile.user_id.hex)
        if not has_builder_submission:
            raise ValidationError(
                "Builder approval requires at least one submitted builder form."
            )

        before = AdminService._json_safe_snapshot({
            "approval_status": getattr(profile, "approval_status", None),
            "approval_note": getattr(profile, "approval_note", None),
            "approved_by_admin_user_id": getattr(profile, "approved_by_admin_user_id", None),
            "approved_at": getattr(profile, "approved_at", None),
            "rejected_at": getattr(profile, "rejected_at", None),
        })

        now = datetime.utcnow()
        next_status = BuilderApprovalStatus(status_value)
        profile.approval_status = next_status
        profile.approval_note = note
        profile.approved_by_admin_user_id = admin_user_id.hex
        if next_status == BuilderApprovalStatus.APPROVED:
            profile.approved_at = now
            profile.rejected_at = None
        elif next_status == BuilderApprovalStatus.REJECTED:
            profile.rejected_at = now
            profile.approved_at = None

        after = AdminService._json_safe_snapshot({
            "approval_status": getattr(profile, "approval_status", None),
            "approval_note": getattr(profile, "approval_note", None),
            "approved_by_admin_user_id": getattr(profile, "approved_by_admin_user_id", None),
            "approved_at": getattr(profile, "approved_at", None),
            "rejected_at": getattr(profile, "rejected_at", None),
        })
        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="professional.approval.update",
                entity_type="professional_profile",
                entity_id=str(profile.id),
                before_json=before,
                after_json=after,
                notes=note,
            )
        )
        await db.commit()
        await db.refresh(profile)
        return {
            "professional_id": profile.id,
            "approval_status": profile.approval_status,
            "approval_note": profile.approval_note,
            "approved_by_admin_user_id": profile.approved_by_admin_user_id,
            "approved_at": profile.approved_at,
            "rejected_at": profile.rejected_at,
            "has_builder_submission": True,
        }

    @staticmethod
    async def list_form_submissions(
        db: AsyncSession,
        side: Optional[str] = None,
        form_type: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[dict]:
        """List form submissions with optional filters.

        Note: form_submissions.user_id is stored as hex/string while users.id is UUID.
        Avoid joining these columns directly (can fail on MySQL collation/type mismatch).
        """
        query = (
            select(FormSubmission)
            .order_by(FormSubmission.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        if side:
            query = query.where(FormSubmission.side == side)
        if form_type:
            query = query.where(FormSubmission.form_type == form_type)
        result = await db.execute(query)
        rows = result.scalars().all()
        out = []
        for sub in rows:
            out.append({
                "id": sub.id,
                "user_id": sub.user_id,
                "form_type": sub.form_type,
                "side": sub.side,
                "created_at": sub.created_at,
                "payload": sub.payload,
                "user_email": None,
            })
        return out

    @staticmethod
    async def get_admin_stats(db: AsyncSession) -> dict:
        """Dashboard stats: users by role, landowners, professionals, projects, form submissions."""
        # User counts by role
        user_totals = await db.execute(
            select(User.role, func.count(User.id)).group_by(User.role)
        )
        role_counts = {row[0]: row[1] for row in user_totals.all()}
        total_users = sum(role_counts.values())
        users_landowner = role_counts.get(Role.LANDOWNER, 0)
        users_professional = role_counts.get(Role.PROFESSIONAL, 0)

        # Profile counts
        landowner_count = await db.execute(select(func.count(LandownerProfile.id)))
        total_landowners = landowner_count.scalar() or 0
        prof_count = await db.execute(select(func.count(ProfessionalProfile.id)))
        total_professionals = prof_count.scalar() or 0

        # Project counts by status
        project_status = await db.execute(
            select(Project.status, func.count(Project.id)).group_by(Project.status)
        )
        status_counts = {row[0]: row[1] for row in project_status.all()}
        total_projects = sum(status_counts.values())
        projects_draft = status_counts.get(ProjectStatus.DRAFT, 0)
        projects_published = status_counts.get(ProjectStatus.PUBLISHED, 0)

        # Form submissions
        form_count = await db.execute(select(func.count(FormSubmission.id)))
        total_form_submissions = form_count.scalar() or 0

        return {
            "total_users": total_users,
            "users_landowner": users_landowner,
            "users_professional": users_professional,
            "total_landowners": total_landowners,
            "total_professionals": total_professionals,
            "total_projects": total_projects,
            "projects_draft": projects_draft,
            "projects_published": projects_published,
            "total_form_submissions": total_form_submissions,
        }

    @staticmethod
    async def list_connections(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 100,
    ) -> List[dict]:
        """List match connection events with actor/contact/payment metadata."""
        result = await db.execute(
            select(Match)
            .options(
                selectinload(Match.project).selectinload(Project.property).selectinload(Property.landowner).selectinload(LandownerProfile.user),
                selectinload(Match.professional).selectinload(ProfessionalProfile.user),
            )
            .order_by(Match.updated_at.desc())
            .offset(skip)
            .limit(limit)
        )
        matches = list(result.scalars().unique().all())
        if not matches:
            return []

        match_ids = [m.id for m in matches]
        tx_result = await db.execute(
            select(Transaction)
            .where(
                Transaction.match_id.in_(match_ids),
                Transaction.transaction_type == TransactionType.BUILDER_MATCH_SELECTION,
            )
            .order_by(Transaction.created_at.desc())
        )
        tx_rows = list(tx_result.scalars().all())
        tx_by_match = {}
        for tx in tx_rows:
            if tx.match_id not in tx_by_match:
                tx_by_match[tx.match_id] = tx

        out = []
        for m in matches:
            project = m.project
            prop = project.property if project else None
            landowner = prop.landowner if prop else None
            landowner_user = getattr(landowner, "user", None)
            professional = m.professional
            professional_user = getattr(professional, "user", None)
            tx = tx_by_match.get(m.id)

            match_status = m.status.value if hasattr(m.status, "value") else str(m.status)

            selection_side = None
            if match_status == "LANDOWNER_SELECTED":
                selection_side = "landowner"
            elif match_status == "BUILDER_SELECTED_PAID":
                selection_side = "builder"
            elif match_status == "CONNECTED":
                if m.express_interest_landowner and m.express_interest_builder:
                    selection_side = "both"
                elif m.express_interest_landowner:
                    selection_side = "landowner"
                elif m.express_interest_builder:
                    selection_side = "builder"

            out.append(
                {
                    "match_id": m.id,
                    "status": m.status,
                    "selection_side": selection_side,
                    "landowner_id": landowner.id if landowner else None,
                    "landowner_name": landowner.name if landowner else None,
                    "landowner_email": landowner_user.email if landowner_user else None,
                    "landowner_phone": landowner.phone if landowner else None,
                    "professional_id": professional.id if professional else None,
                    "builder_company_name": professional.company_name if professional else None,
                    "builder_email": professional_user.email if professional_user else None,
                    "builder_phone": professional.phone if professional else None,
                    "project_id": project.id if project else None,
                    "property_id": prop.id if prop else None,
                    "project_type": (
                        project.project_type.value if project and hasattr(project.project_type, "value") else str(project.project_type) if project else None
                    ),
                    "project_city": prop.city if prop else None,
                    "payment_status": (
                        tx.status.value if tx and hasattr(tx.status, "value") else str(tx.status) if tx else None
                    ),
                    "payment_transaction_id": tx.id if tx else None,
                    "payment_order_id": tx.razorpay_order_id if tx else None,
                    "payment_id": tx.razorpay_payment_id if tx else None,
                    "mutual_interest_at": m.mutual_interest_at,
                    "gatekeeper_unlocked_at": m.gatekeeper_unlocked_at,
                    "created_at": m.created_at,
                    "updated_at": m.updated_at,
                }
            )
        return out

    @staticmethod
    async def get_user_360(db: AsyncSession, user_id: UUID) -> dict:
        """
        End-to-end user snapshot for admin console.
        Returns user core + related profiles/entities when present.
        """
        user_result = await db.execute(select(User).where(User.id == user_id))
        user = user_result.scalar_one_or_none()
        if user is None:
            raise NotFoundError("User", str(user_id))

        # Landowner side
        landowner_profile = (
            await db.execute(
                select(LandownerProfile)
                .options(
                    selectinload(LandownerProfile.properties)
                    .selectinload(Property.projects)
                    .selectinload(Project.jv_preferences)
                )
                .where(LandownerProfile.user_id == user_id)
            )
        ).scalar_one_or_none()

        landowner_properties: List[Property] = []
        landowner_projects: List[Project] = []
        if landowner_profile:
            landowner_properties = list(landowner_profile.properties or [])
            for prop in landowner_properties:
                for proj in (prop.projects or []):
                    landowner_projects.append(proj)

        # Professional side
        professional_profile = (
            await db.execute(
                select(ProfessionalProfile)
                .options(
                    selectinload(ProfessionalProfile.capabilities),
                    selectinload(ProfessionalProfile.licenses),
                    selectinload(ProfessionalProfile.portfolio),
                    selectinload(ProfessionalProfile.pricing_tiers),
                )
                .where(ProfessionalProfile.user_id == user_id)
            )
        ).scalar_one_or_none()

        # Form submissions store user_id as hex string
        user_hex = user_id.hex
        forms_result = await db.execute(
            select(FormSubmission)
            .where(FormSubmission.user_id == user_hex)
            .order_by(FormSubmission.created_at.desc())
        )
        form_rows = forms_result.all()
        form_out = []
        for row in form_rows:
            sub = row[0]
            form_out.append(
                {
                    "id": sub.id,
                    "user_id": sub.user_id,
                    "form_type": sub.form_type,
                    "side": sub.side,
                    "created_at": sub.created_at,
                    "payload": sub.payload,
                    # User 360 targets a single user; use current user's email
                    # instead of joining FormSubmission.user_id (String) to User.id (UUID).
                    "user_email": user.email,
                }
            )

        # Matches: via landowner projects (project_id) and via professional profile (professional_id)
        match_query = select(Match).order_by(Match.updated_at.desc())
        filters = []
        if landowner_projects:
            filters.append(Match.project_id.in_([p.id for p in landowner_projects]))
        if professional_profile:
            filters.append(Match.professional_id == professional_profile.id)
        matches: List[Match] = []
        if filters:
            from sqlalchemy import or_

            result = await db.execute(match_query.where(or_(*filters)))
            matches = list(result.scalars().all())

        # Transactions (payments): always by user_id
        tx_result = await db.execute(
            select(Transaction).where(Transaction.user_id == user_id).order_by(Transaction.created_at.desc())
        )
        transactions = list(tx_result.scalars().all())

        # Support tickets: stored by hex user id in our implementation
        tickets_result = await db.execute(
            select(SupportTicket).where(SupportTicket.user_id == user_hex).order_by(SupportTicket.created_at.desc())
        )
        tickets = list(tickets_result.scalars().all())

        login_rows_result = await db.execute(
            select(LoginEvent)
            .where(LoginEvent.user_id == str(user.id))
            .order_by(LoginEvent.created_at.desc())
            .limit(20)
        )
        login_rows = list(login_rows_result.scalars().all())
        last_login_at = login_rows[0].created_at if login_rows else None

        return {
            "user": user,
            "last_login_at": last_login_at,
            "login_events": login_rows,
            "landowner_profile": landowner_profile,
            "landowner_properties": landowner_properties,
            "landowner_projects": landowner_projects,
            "professional_profile": professional_profile,
            "professional_capabilities": list(professional_profile.capabilities or []) if professional_profile else [],
            "professional_licenses": list(professional_profile.licenses or []) if professional_profile else [],
            "professional_portfolio": list(professional_profile.portfolio or []) if professional_profile else [],
            "professional_pricing_tiers": list(professional_profile.pricing_tiers or []) if professional_profile else [],
            "professional_location_preferences": professional_profile.location_preferences if professional_profile else None,
            "form_submissions": form_out,
            "matches": matches,
            "transactions": transactions,
            "support_tickets": tickets,
        }

    @staticmethod
    async def list_support_tickets(
        db: AsyncSession,
        *,
        status: Optional[str] = None,
        user_id: Optional[str] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[SupportTicket]:
        query = select(SupportTicket).order_by(SupportTicket.created_at.desc()).offset(skip).limit(limit)
        if status:
            query = query.where(SupportTicket.status == status)
        if user_id:
            query = query.where(SupportTicket.user_id == user_id)
        if q:
            like = f"%{q}%"
            query = query.where(
                (SupportTicket.subject.like(like)) | (SupportTicket.description.like(like))
            )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_support_ticket(db: AsyncSession, ticket_id: str) -> SupportTicket:
        result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id))
        ticket = result.scalar_one_or_none()
        if ticket is None:
            raise NotFoundError("SupportTicket", ticket_id)
        return ticket

    @staticmethod
    async def update_support_ticket(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        ticket_id: str,
        patch: Dict[str, Any],
    ) -> SupportTicket:
        ticket = await AdminService.get_support_ticket(db, ticket_id)
        before = {
            "status": ticket.status,
            "assigned_to": getattr(ticket, "assigned_to", None),
            "admin_notes": getattr(ticket, "admin_notes", None),
        }

        if "status" in patch and patch["status"] is not None:
            ticket.status = str(patch["status"])
        if "assigned_to" in patch:
            ticket.assigned_to = patch["assigned_to"]
        if "admin_notes" in patch:
            ticket.admin_notes = patch["admin_notes"]

        after = {
            "status": ticket.status,
            "assigned_to": getattr(ticket, "assigned_to", None),
            "admin_notes": getattr(ticket, "admin_notes", None),
        }

        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="support_ticket.update",
                entity_type="support_ticket",
                entity_id=str(ticket.id),
                before_json=before,
                after_json=after,
            )
        )
        await db.commit()
        await db.refresh(ticket)
        return ticket

    @staticmethod
    async def list_transactions(
        db: AsyncSession,
        *,
        user_id: Optional[UUID] = None,
        status: Optional[str] = None,
        tx_type: Optional[str] = None,
        q: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Transaction]:
        query = select(Transaction).order_by(Transaction.created_at.desc()).offset(skip).limit(limit)
        if user_id is not None:
            query = query.where(Transaction.user_id == user_id)
        if status:
            query = query.where(Transaction.status == status)
        if tx_type:
            query = query.where(Transaction.transaction_type == tx_type)
        if q:
            like = f"%{q}%"
            query = query.where(
                (Transaction.razorpay_order_id.like(like))
                | (Transaction.razorpay_payment_id.like(like))
            )
        result = await db.execute(query)
        return list(result.scalars().all())

    @staticmethod
    async def get_transaction(db: AsyncSession, transaction_id: UUID) -> Transaction:
        result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
        tx = result.scalar_one_or_none()
        if tx is None:
            raise NotFoundError("Transaction", str(transaction_id))
        return tx

    @staticmethod
    async def update_transaction_resolution(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        transaction_id: UUID,
        patch: Dict[str, Any],
    ) -> Transaction:
        tx = await AdminService.get_transaction(db, transaction_id)
        before = {
            "admin_resolution_status": getattr(tx, "admin_resolution_status", None),
            "admin_notes": getattr(tx, "admin_notes", None),
        }

        if "admin_resolution_status" in patch:
            tx.admin_resolution_status = patch["admin_resolution_status"]
        if "admin_notes" in patch:
            tx.admin_notes = patch["admin_notes"]

        after = {
            "admin_resolution_status": getattr(tx, "admin_resolution_status", None),
            "admin_notes": getattr(tx, "admin_notes", None),
        }

        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="transaction.update_resolution",
                entity_type="transaction",
                entity_id=str(tx.id),
                before_json=before,
                after_json=after,
            )
        )
        await db.commit()
        await db.refresh(tx)
        return tx

    @staticmethod
    async def change_admin_password(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        new_password: str,
    ) -> None:
        """Update password for the logged-in admin (no current-password check)."""
        result = await db.execute(select(User).where(User.id == admin_user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise NotFoundError("User", str(admin_user_id))
        if user.role != Role.ADMIN:
            raise ValidationError("Only admin accounts can change password here.")

        user.hashed_password = get_password_hash(new_password)
        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="admin.password.change",
                entity_type="user",
                entity_id=str(user.id),
                before_json=None,
                after_json={"password_changed": True},
                notes="Admin changed their password from the admin dashboard.",
            )
        )
        await db.commit()

    BUILDER_FORM_TYPES = (
        "contract-construction",
        "joint-venture",
        "interior",
        "reconstruction",
    )

    @staticmethod
    def _submission_to_detail(submission: FormSubmission) -> FormSubmissionDetailResponse:
        return FormSubmissionDetailResponse(
            id=str(submission.id),
            form_type=submission.form_type,
            side=submission.side,
            payload=submission.payload or {},
            created_at=submission.created_at,
        )

    @staticmethod
    async def _get_professional_profile(db: AsyncSession, professional_id: UUID) -> ProfessionalProfile:
        result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        profile = result.scalar_one_or_none()
        if profile is None:
            raise NotFoundError("ProfessionalProfile", str(professional_id))
        return profile

    @staticmethod
    async def get_builder_portfolio_for_professional(
        db: AsyncSession,
        professional_id: UUID,
    ) -> BuilderPortfolioLatestResponse:
        profile = await AdminService._get_professional_profile(db, professional_id)
        result = await db.execute(
            select(FormSubmission)
            .where(
                FormSubmission.side == "builder",
                FormSubmission.user_id == profile.user_id.hex,
                FormSubmission.form_type.in_(AdminService.BUILDER_FORM_TYPES),
            )
            .order_by(FormSubmission.created_at.desc())
        )
        latest_by_type: Dict[str, FormSubmission] = {}
        for row in result.scalars().all():
            if row.form_type not in latest_by_type:
                latest_by_type[row.form_type] = row

        return BuilderPortfolioLatestResponse(
            contract_construction=AdminService._submission_to_detail(latest_by_type["contract-construction"])
            if latest_by_type.get("contract-construction")
            else None,
            joint_venture=AdminService._submission_to_detail(latest_by_type["joint-venture"])
            if latest_by_type.get("joint-venture")
            else None,
            interior=AdminService._submission_to_detail(latest_by_type["interior"])
            if latest_by_type.get("interior")
            else None,
            renovation_repaint=AdminService._submission_to_detail(latest_by_type["reconstruction"])
            if latest_by_type.get("reconstruction")
            else None,
        )

    @staticmethod
    async def update_form_submission(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        submission_id: str,
        payload: Dict[str, Any],
    ) -> FormSubmission:
        result = await db.execute(
            select(FormSubmission).where(FormSubmission.id == submission_id)
        )
        submission = result.scalar_one_or_none()
        if submission is None:
            raise NotFoundError("FormSubmission", submission_id)

        before = AdminService._json_safe_snapshot(submission.payload)
        submission.payload = payload
        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="form_submission.update",
                entity_type="form_submission",
                entity_id=str(submission.id),
                before_json=before,
                after_json=AdminService._json_safe_snapshot(payload),
                notes=f"Admin updated {submission.side} {submission.form_type} form payload",
            )
        )
        await db.commit()
        await db.refresh(submission)
        return submission

    @staticmethod
    async def delete_form_submission(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        submission_id: str,
    ) -> None:
        result = await db.execute(
            select(FormSubmission).where(FormSubmission.id == submission_id)
        )
        submission = result.scalar_one_or_none()
        if submission is None:
            raise NotFoundError("FormSubmission", submission_id)

        before = AdminService._json_safe_snapshot(submission.payload)
        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="form_submission.delete",
                entity_type="form_submission",
                entity_id=str(submission.id),
                before_json=before,
                after_json=None,
                notes=f"Admin deleted {submission.side} {submission.form_type} form submission",
            )
        )
        await db.execute(delete(FormSubmission).where(FormSubmission.id == submission_id))
        await db.commit()

    @staticmethod
    async def update_builder_form_submission_for_professional(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        professional_id: UUID,
        submission_id: str,
        payload: Dict[str, Any],
    ) -> FormSubmission:
        profile = await AdminService._get_professional_profile(db, professional_id)
        result = await db.execute(
            select(FormSubmission).where(FormSubmission.id == submission_id)
        )
        submission = result.scalar_one_or_none()
        if submission is None:
            raise NotFoundError("FormSubmission", submission_id)
        if submission.side != "builder" or submission.user_id != profile.user_id.hex:
            raise ValidationError("This form submission does not belong to the selected builder.")

        submission.payload = payload
        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="builder.form_submission.update",
                entity_type="form_submission",
                entity_id=str(submission.id),
                before_json=None,
                after_json={"form_type": submission.form_type, "updated": True},
                notes=f"Admin updated builder form payload for professional {professional_id}",
            )
        )
        await db.commit()
        await db.refresh(submission)
        return submission

    @staticmethod
    async def update_professional_profile_admin(
        db: AsyncSession,
        *,
        admin_user_id: UUID,
        professional_id: UUID,
        patch: Dict[str, Any],
    ) -> ProfessionalProfile:
        profile = await AdminService._get_professional_profile(db, professional_id)
        before = AdminService._json_safe_snapshot({
            "company_name": profile.company_name,
            "phone": profile.phone,
            "city": profile.city,
            "experience_years": profile.experience_years,
        })

        if "company_name" in patch and patch["company_name"] is not None:
            profile.company_name = str(patch["company_name"]).strip()
        if "phone" in patch:
            profile.phone = patch["phone"]
        if "city" in patch:
            profile.city = patch["city"]
        if "experience_years" in patch and patch["experience_years"] is not None:
            profile.experience_years = int(patch["experience_years"])

        after = AdminService._json_safe_snapshot({
            "company_name": profile.company_name,
            "phone": profile.phone,
            "city": profile.city,
            "experience_years": profile.experience_years,
        })
        db.add(
            AdminAuditLog(
                admin_user_id=admin_user_id.hex,
                action="professional.profile.update",
                entity_type="professional_profile",
                entity_id=str(profile.id),
                before_json=before,
                after_json=after,
            )
        )
        await db.commit()
        await db.refresh(profile)
        return profile
