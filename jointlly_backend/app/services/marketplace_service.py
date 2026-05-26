"""
Marketplace service for public builder and project cards.
"""
import json
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func, String
from sqlalchemy.orm import selectinload

from app.models.professional import ProfessionalProfile, Capability, Portfolio, PricingTier
from app.models.landowner import Project, Property
from app.models.verification import PIDVerification
from app.models.form_submission import FormSubmission
from app.schemas.professional import (
    BuilderMarketplaceCard,
    BuilderMarketplacePortfolioItem,
    BuilderMarketplacePortfolioPreview,
)
from app.schemas.landowner import ProjectMarketplaceCard
from app.schemas.forms import BuilderPortfolioLatestResponse, FormSubmissionDetailResponse
from app.services.far_service import FARService
from app.utils.constants import (
    CapabilityType,
    ProjectType,
    ProjectIntent,
    ProjectStatus,
    ProjectScaleTier,
    VerificationStatus,
)

# Builder marketplace capability filter: SQL + form submissions (Capability row is sometimes missing).
_CAPABILITY_TO_BUILDER_FORM_TYPE: Dict[CapabilityType, str] = {
    CapabilityType.CONSTRUCTION: "contract-construction",
    CapabilityType.JV_JD: "joint-venture",
    CapabilityType.INTERIOR: "interior",
    CapabilityType.RECONSTRUCTION: "reconstruction",
}


class MarketplaceService:
    """Service for marketplace (builder + project listings)."""

    _DEBUG_LOG = Path(__file__).resolve().parents[3] / "debug-501180.log"

    @staticmethod
    def _agent_debug(hypothesis_id: str, location: str, message: str, data: dict) -> None:
        # #region agent log
        try:
            line = {
                "sessionId": "501180",
                "hypothesisId": hypothesis_id,
                "location": location,
                "message": message,
                "data": data,
                "timestamp": int(time.time() * 1000),
                "runId": "post-fix-backend-cap",
            }
            with open(MarketplaceService._DEBUG_LOG, "a", encoding="utf-8") as f:
                f.write(json.dumps(line, default=str) + "\n")
        except OSError:
            pass
        # #endregion

    # ---------- Builder marketplace ----------

    @staticmethod
    def _normalize_location_preferences(raw: Any) -> List[str]:
        if raw is None:
            return []
        if isinstance(raw, list):
            return [str(x).strip() for x in raw if x is not None and str(x).strip()]
        if isinstance(raw, str) and raw.strip():
            return [raw.strip()]
        return []

    @staticmethod
    def _public_marketplace_payload(payload: Any) -> Dict[str, Any]:
        """Remove contact / address fields from builder form JSON for landowner marketplace view."""
        if not isinstance(payload, dict):
            return {}
        omit_exact = {
            "phone",
            "mobile",
            "email",
            "emails",
            "contact_email",
            "contact_phone",
            "alternate_phone",
            "whatsapp",
            "fax",
            "office_phone",
            "personal_email",
            "company_email",
            "address",
            "office_address",
            "google_maps_location",
            "point_of_contact",
            "poc",
            "emergency_contact",
        }
        out: Dict[str, Any] = {}
        for key, val in payload.items():
            if not isinstance(key, str):
                continue
            lk = key.lower()
            if lk in omit_exact:
                continue
            if "phone" in lk or lk.endswith("_email") or "whatsapp" in lk:
                continue
            if isinstance(val, dict):
                out[key] = MarketplaceService._public_marketplace_payload(val)
            elif isinstance(val, list):
                out[key] = [
                    MarketplaceService._public_marketplace_payload(i) if isinstance(i, dict) else i
                    for i in val
                ]
            else:
                out[key] = val
        return out

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
    def _submission_to_marketplace_detail(submission: FormSubmission) -> FormSubmissionDetailResponse:
        raw = submission.payload or {}
        safe = (
            MarketplaceService._public_marketplace_payload(raw)
            if isinstance(raw, dict)
            else {}
        )
        return FormSubmissionDetailResponse(
            id=str(submission.id),
            form_type=submission.form_type,
            side=submission.side,
            payload=safe,
            created_at=submission.created_at,
        )

    @staticmethod
    async def get_builder_portfolio(
        db: AsyncSession,
        *,
        professional_id: UUID,
    ) -> BuilderPortfolioLatestResponse:
        """Return latest submission per builder form type for a marketplace profile."""
        profile_result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        profile = profile_result.scalar_one_or_none()
        if profile is None:
            return BuilderPortfolioLatestResponse()

        user_hex = profile.user_id.hex
        fs_result = await db.execute(
            select(FormSubmission)
            .where(
                FormSubmission.side == "builder",
                FormSubmission.user_id == user_hex,
                FormSubmission.form_type.in_(
                    [
                        "contract-construction",
                        "joint-venture",
                        "interior",
                        "reconstruction",
                    ]
                ),
            )
            .order_by(FormSubmission.created_at.desc())
        )
        rows = list(fs_result.scalars().all())
        latest_by_type = {}
        for row in rows:
            if row.form_type not in latest_by_type:
                latest_by_type[row.form_type] = row

        return BuilderPortfolioLatestResponse(
            contract_construction=MarketplaceService._submission_to_marketplace_detail(
                latest_by_type["contract-construction"]
            )
            if latest_by_type.get("contract-construction")
            else None,
            joint_venture=MarketplaceService._submission_to_marketplace_detail(
                latest_by_type["joint-venture"]
            )
            if latest_by_type.get("joint-venture")
            else None,
            interior=MarketplaceService._submission_to_marketplace_detail(latest_by_type["interior"])
            if latest_by_type.get("interior")
            else None,
            renovation_repaint=MarketplaceService._submission_to_marketplace_detail(
                latest_by_type["reconstruction"]
            )
            if latest_by_type.get("reconstruction")
            else None,
        )

    @staticmethod
    def _split_csv_or_list(val: Any) -> List[str]:
        if val is None:
            return []
        if isinstance(val, list):
            return [str(x).strip() for x in val if x is not None and str(x).strip()]
        if isinstance(val, str) and val.strip():
            return [p.strip() for p in val.split(",") if p.strip()]
        return []

    @staticmethod
    def _dedupe_locations_preserve_order(items: List[str]) -> List[str]:
        seen: set = set()
        out: List[str] = []
        for x in items:
            k = x.lower()
            if k not in seen:
                seen.add(k)
                out.append(x)
        return out

    @staticmethod
    def _construction_project_types_from_payload(raw: Dict[str, Any]) -> List[str]:
        pt = raw.get("project_types")
        if isinstance(pt, list):
            return [str(x).strip() for x in pt if str(x).strip()]
        return []

    @staticmethod
    def _featured_project_name(
        recent_portfolio_items: List[Portfolio],
        raw_contract: Dict[str, Any],
    ) -> Optional[str]:
        if recent_portfolio_items:
            name = (recent_portfolio_items[0].project_name or "").strip()
            if name:
                return name
        rp = raw_contract.get("recent_projects")
        if isinstance(rp, list) and rp and isinstance(rp[0], dict):
            row = rp[0]
            for key in ("name_location", "location", "name"):
                v = row.get(key)
                if isinstance(v, str) and v.strip():
                    return v.strip()
        return None

    @staticmethod
    def _builder_form_types_for_capabilities(caps: List[CapabilityType]) -> List[str]:
        out: List[str] = []
        for c in caps:
            ft = _CAPABILITY_TO_BUILDER_FORM_TYPE.get(c)
            if ft and ft not in out:
                out.append(ft)
        return out

    @staticmethod
    def _prof_user_id_hex_sql(user_id_column: Any) -> Any:
        return func.lower(
            func.replace(func.cast(user_id_column, String(64)), "-", "")
        )

    @staticmethod
    def _forms_back_capability(
        cap_filter: List[CapabilityType],
        contract_sub: Optional[FormSubmission],
        jv_sub: Optional[FormSubmission],
        int_sub: Optional[FormSubmission],
        rec_sub: Optional[FormSubmission],
    ) -> bool:
        """True if latest builder form submissions include a type matching cap_filter."""
        want = set(cap_filter)
        if CapabilityType.CONSTRUCTION in want and contract_sub is not None:
            return True
        if CapabilityType.JV_JD in want and jv_sub is not None:
            return True
        if CapabilityType.INTERIOR in want and int_sub is not None:
            return True
        if CapabilityType.RECONSTRUCTION in want and rec_sub is not None:
            return True
        return False

    @staticmethod
    def _preview_contract(
        raw: Dict[str, Any],
        submission: Optional[FormSubmission],
        profile: ProfessionalProfile,
        fallback_locations: List[str],
    ) -> Optional[BuilderMarketplacePortfolioPreview]:
        if submission is None:
            return None
        ye_raw = raw.get("years_experience")
        ys = str(ye_raw).strip() if ye_raw is not None and str(ye_raw).strip() else ""
        if not ys and profile.experience_years is not None:
            ys = str(profile.experience_years)
        pl = str(raw.get("preferred_location") or "").strip()
        if not pl and fallback_locations:
            pl = ", ".join(fallback_locations[:10])
        co = str(raw.get("company_name") or profile.company_name or "").strip() or None
        pc = str(raw.get("projects_completed") or "").strip() or None
        return BuilderMarketplacePortfolioPreview(
            has_data=True,
            updated_at=submission.created_at,
            company_name=co,
            years_experience=ys or None,
            projects_completed=pc,
            location_summary=pl or None,
        )

    @staticmethod
    def _preview_jv(
        raw: Dict[str, Any],
        submission: Optional[FormSubmission],
        profile: ProfessionalProfile,
        fallback_locations: List[str],
    ) -> Optional[BuilderMarketplacePortfolioPreview]:
        if submission is None:
            return None
        locations = ""
        ls = raw.get("locations_served")
        if isinstance(ls, list):
            locations = ", ".join(
                str(x).strip() for x in ls if x is not None and str(x).strip()
            )
        elif isinstance(ls, str) and ls.strip():
            locations = ls.strip()
        plf = str(raw.get("preferred_locations") or "").strip()
        if locations and plf:
            loc_sum = f"{locations}; {plf}"
        elif locations:
            loc_sum = locations
        elif plf:
            loc_sum = plf
        elif fallback_locations:
            loc_sum = ", ".join(fallback_locations[:10])
        else:
            loc_sum = ""
        ye_raw = raw.get("years_experience")
        ys = str(ye_raw).strip() if ye_raw is not None and str(ye_raw).strip() else ""
        if not ys and profile.experience_years is not None:
            ys = str(profile.experience_years)
        co = str(raw.get("company_name") or profile.company_name or "").strip() or None
        pc = str(raw.get("projects_completed") or "").strip() or None
        return BuilderMarketplacePortfolioPreview(
            has_data=True,
            updated_at=submission.created_at,
            company_name=co,
            years_experience=ys or None,
            projects_completed=pc,
            location_summary=loc_sum or None,
        )

    @staticmethod
    def _preview_interior_like(
        raw: Dict[str, Any],
        submission: Optional[FormSubmission],
        profile: ProfessionalProfile,
        fallback_locations: List[str],
    ) -> Optional[BuilderMarketplacePortfolioPreview]:
        """Interior and renovation/repaint forms share location shape (areas + optional maps link)."""
        if submission is None:
            return None
        loc_d = raw.get("location")
        gm = ""
        if isinstance(loc_d, dict):
            gm = str(loc_d.get("googleMapsAddress") or "").strip()
        prefs = raw.get("preferredLocations") or raw.get("preferred_locations")
        pl = ""
        if isinstance(prefs, list):
            pl = ", ".join(
                str(x).strip() for x in prefs if x is not None and str(x).strip()
            )
        elif isinstance(prefs, str) and prefs.strip():
            pl = prefs.strip()
        if pl and gm:
            loc_sum = f"{pl}; {gm}"
        elif pl:
            loc_sum = pl
        elif gm:
            loc_sum = gm
        elif fallback_locations:
            loc_sum = ", ".join(fallback_locations[:10])
        else:
            loc_sum = ""
        ye_raw = raw.get("years_experience")
        ys = str(ye_raw).strip() if ye_raw is not None and str(ye_raw).strip() else ""
        if not ys and profile.experience_years is not None:
            ys = str(profile.experience_years)
        co = str(raw.get("company_name") or profile.company_name or "").strip() or None
        pc = str(raw.get("projects_completed") or "").strip() or None
        return BuilderMarketplacePortfolioPreview(
            has_data=True,
            updated_at=submission.created_at,
            company_name=co,
            years_experience=ys or None,
            projects_completed=pc,
            location_summary=loc_sum or None,
        )

    @staticmethod
    async def _build_marketplace_cards(
        db: AsyncSession,
        profiles: List[ProfessionalProfile],
        *,
        cap_filter: Optional[List[CapabilityType]] = None,
        intent: Optional[ProjectIntent] = None,
        apply_post_filters: bool = True,
    ) -> List[BuilderMarketplaceCard]:
        """Assemble marketplace cards for the given profiles (shared by list + by-id fetch)."""
        if not profiles:
            return []

        profile_ids = [p.id for p in profiles]
        user_hex_ids = {p.user_id.hex for p in profiles}

        cap_result = await db.execute(
            select(Capability).where(Capability.professional_id.in_(profile_ids))
        )
        all_caps: List[Capability] = list(cap_result.scalars().all())

        caps_by_prof: Dict[Any, List[Capability]] = {}
        for cap in all_caps:
            caps_by_prof.setdefault(cap.professional_id, []).append(cap)

        pt_result = await db.execute(
            select(PricingTier).where(PricingTier.professional_id.in_(profile_ids))
        )
        all_pricing_tiers: List[PricingTier] = list(pt_result.scalars().all())

        tiers_by_prof: Dict[Any, List[PricingTier]] = {}
        for t in all_pricing_tiers:
            tiers_by_prof.setdefault(t.professional_id, []).append(t)

        port_result = await db.execute(
            select(Portfolio).where(Portfolio.professional_id.in_(profile_ids))
        )
        all_portfolio: List[Portfolio] = list(port_result.scalars().all())

        portfolio_by_prof: Dict[Any, List[Portfolio]] = {}
        for p in all_portfolio:
            portfolio_by_prof.setdefault(p.professional_id, []).append(p)

        uid_list = list(user_hex_ids)
        fs_result = await db.execute(
            select(FormSubmission).where(
                FormSubmission.side == "builder",
                FormSubmission.form_type == "contract-construction",
                FormSubmission.user_id.in_(uid_list),
            )
        )
        submissions_by_user: Dict[str, FormSubmission] = {}
        for sub in fs_result.scalars().all():
            existing = submissions_by_user.get(sub.user_id)
            if existing is None or sub.created_at > existing.created_at:
                submissions_by_user[sub.user_id] = sub

        fs_jv_result = await db.execute(
            select(FormSubmission).where(
                FormSubmission.side == "builder",
                FormSubmission.form_type == "joint-venture",
                FormSubmission.user_id.in_(uid_list),
            )
        )
        jv_submissions_by_user: Dict[str, FormSubmission] = {}
        for sub in fs_jv_result.scalars().all():
            existing = jv_submissions_by_user.get(sub.user_id)
            if existing is None or sub.created_at > existing.created_at:
                jv_submissions_by_user[sub.user_id] = sub

        fs_int_result = await db.execute(
            select(FormSubmission).where(
                FormSubmission.side == "builder",
                FormSubmission.form_type == "interior",
                FormSubmission.user_id.in_(uid_list),
            )
        )
        interior_by_user: Dict[str, FormSubmission] = {}
        for sub in fs_int_result.scalars().all():
            existing = interior_by_user.get(sub.user_id)
            if existing is None or sub.created_at > existing.created_at:
                interior_by_user[sub.user_id] = sub

        fs_rec_result = await db.execute(
            select(FormSubmission).where(
                FormSubmission.side == "builder",
                FormSubmission.form_type == "reconstruction",
                FormSubmission.user_id.in_(uid_list),
            )
        )
        recon_by_user: Dict[str, FormSubmission] = {}
        for sub in fs_rec_result.scalars().all():
            existing = recon_by_user.get(sub.user_id)
            if existing is None or sub.created_at > existing.created_at:
                recon_by_user[sub.user_id] = sub

        filtered_profiles: List[ProfessionalProfile] = []
        if apply_post_filters:
            for profile in profiles:
                caps = caps_by_prof.get(profile.id, [])
                if cap_filter:
                    cap_set = {c.capability_type for c in caps}
                    if not cap_set.intersection(set(cap_filter)):
                        uh = profile.user_id.hex
                        if not MarketplaceService._forms_back_capability(
                            cap_filter,
                            submissions_by_user.get(uh),
                            jv_submissions_by_user.get(uh),
                            interior_by_user.get(uh),
                            recon_by_user.get(uh),
                        ):
                            continue

                if intent:
                    tiers = tiers_by_prof.get(profile.id, [])
                    intents_for_prof = {
                        (t.capability_type, getattr(t, "tier_name", None)) for t in tiers
                    }
                    if not tiers:
                        pass
                    else:
                        if not intents_for_prof:
                            continue

                filtered_profiles.append(profile)
        else:
            filtered_profiles = profiles

        cards: List[BuilderMarketplaceCard] = []
        for profile in filtered_profiles:
            caps = caps_by_prof.get(profile.id, [])
            capability_types = sorted({c.capability_type for c in caps})

            tiers = tiers_by_prof.get(profile.id, [])
            prices = [t.price_per_sqft for t in tiers if t.price_per_sqft is not None]
            min_price = min(prices) if prices else None
            max_price = max(prices) if prices else None

            portfolio_items = portfolio_by_prof.get(profile.id, [])
            portfolio_items.sort(
                key=lambda p: (p.completion_date or p.created_at), reverse=True
            )
            recent_portfolio_items = portfolio_items[:2]

            recent_portfolio = [
                BuilderMarketplacePortfolioItem(
                    project_name=item.project_name,
                    project_type=item.project_type,
                    location=item.location,
                    area_sqft=item.area_sqft,
                    completion_date=item.completion_date,
                    images=item.images,
                )
                for item in recent_portfolio_items
            ]

            user_hex = profile.user_id.hex
            submission = submissions_by_user.get(user_hex)
            raw_contract_payload: Dict[str, Any] = (
                submission.payload if submission is not None and isinstance(submission.payload, dict) else {}
            )
            contract_form_payload = (
                MarketplaceService._public_marketplace_payload(raw_contract_payload)
                if raw_contract_payload
                else None
            )

            jv_sub = jv_submissions_by_user.get(user_hex)
            jv_raw: Dict[str, Any] = (
                jv_sub.payload if jv_sub is not None and isinstance(jv_sub.payload, dict) else {}
            )
            int_sub = interior_by_user.get(user_hex)
            int_raw: Dict[str, Any] = (
                int_sub.payload if int_sub is not None and isinstance(int_sub.payload, dict) else {}
            )
            rec_sub = recon_by_user.get(user_hex)
            rec_raw: Dict[str, Any] = (
                rec_sub.payload if rec_sub is not None and isinstance(rec_sub.payload, dict) else {}
            )

            loc_accum: List[str] = []
            loc_accum.extend(MarketplaceService._normalize_location_preferences(profile.location_preferences))
            loc_accum.extend(MarketplaceService._split_csv_or_list(raw_contract_payload.get("preferred_location")))
            loc_accum.extend(MarketplaceService._split_csv_or_list(jv_raw.get("preferred_locations")))
            loc_accum.extend(
                MarketplaceService._normalize_location_preferences(int_raw.get("preferredLocations"))
            )
            loc_accum.extend(
                MarketplaceService._normalize_location_preferences(int_raw.get("preferred_locations"))
            )
            for k in ("location1", "location2", "location3"):
                loc_accum.extend(MarketplaceService._split_csv_or_list(jv_raw.get(k)))
            location_preferences = MarketplaceService._dedupe_locations_preserve_order(loc_accum)

            company_name = (profile.company_name or "").strip()
            if not company_name:
                for blob in (raw_contract_payload, jv_raw, int_raw, rec_raw):
                    v = blob.get("company_name")
                    if isinstance(v, str) and v.strip():
                        company_name = v.strip()
                        break
            if not company_name:
                company_name = "Professional"

            city_out = (profile.city or "").strip() or None
            if not city_out and location_preferences:
                city_out = location_preferences[0][:120]

            construction_project_types = MarketplaceService._construction_project_types_from_payload(
                raw_contract_payload
            )
            if not construction_project_types:
                for blob in (int_raw, jv_raw, rec_raw):
                    pt_alt = blob.get("project_types")
                    if isinstance(pt_alt, list):
                        construction_project_types = [
                            str(x).strip() for x in pt_alt if str(x).strip()
                        ]
                        if construction_project_types:
                            break
            featured_project_name = MarketplaceService._featured_project_name(
                recent_portfolio_items, raw_contract_payload
            )
            if not featured_project_name:
                rp_int = int_raw.get("recentProjects") or int_raw.get("recent_projects")
                if isinstance(rp_int, list) and rp_int and isinstance(rp_int[0], dict):
                    row0 = rp_int[0]
                    for key in ("location", "name_location", "type"):
                        v = row0.get(key)
                        if isinstance(v, str) and v.strip():
                            featured_project_name = v.strip()
                            break

            contract_portfolio_preview = MarketplaceService._preview_contract(
                raw_contract_payload, submission, profile, location_preferences
            )
            jv_portfolio_preview = MarketplaceService._preview_jv(
                jv_raw, jv_sub, profile, location_preferences
            )
            interior_portfolio_preview = MarketplaceService._preview_interior_like(
                int_raw, int_sub, profile, location_preferences
            )
            renovation_portfolio_preview = MarketplaceService._preview_interior_like(
                rec_raw, rec_sub, profile, location_preferences
            )

            card = BuilderMarketplaceCard(
                id=profile.id,
                company_name=company_name,
                city=city_out,
                location_preferences=location_preferences,
                experience_years=profile.experience_years,
                rera_experience=profile.rera_experience,
                credibility_score=profile.credibility_score,
                team_size_category=profile.team_size_category,
                wallet_size=profile.wallet_size,
                capability_types=capability_types,
                min_price_per_sqft=min_price,
                max_price_per_sqft=max_price,
                recent_portfolio=recent_portfolio,
                contract_form_payload=contract_form_payload,
                construction_project_types=construction_project_types,
                featured_project_name=featured_project_name,
                contract_portfolio_preview=contract_portfolio_preview,
                jv_portfolio_preview=jv_portfolio_preview,
                interior_portfolio_preview=interior_portfolio_preview,
                renovation_portfolio_preview=renovation_portfolio_preview,
            )
            cards.append(card)

        MarketplaceService._agent_debug(
            "H-backend-cap-pagination",
            "marketplace_service.py:_build_marketplace_cards:return",
            "cards built",
            {
                "filtered_profiles_count": len(filtered_profiles),
                "cards_count": len(cards),
            },
        )
        return cards

    @staticmethod
    async def list_builders_by_ids(
        db: AsyncSession,
        professional_ids: Sequence[UUID],
    ) -> List[BuilderMarketplaceCard]:
        """Fetch marketplace cards for specific professionals (e.g. matched builders missing from paged list)."""
        ids = list(dict.fromkeys(professional_ids))[:40]
        if not ids:
            return []
        result = await db.execute(select(ProfessionalProfile).where(ProfessionalProfile.id.in_(ids)))
        profiles = list(result.scalars().all())
        return await MarketplaceService._build_marketplace_cards(
            db, profiles, cap_filter=None, intent=None, apply_post_filters=False
        )

    @staticmethod
    async def list_builders(
        db: AsyncSession,
        *,
        city: Optional[str] = None,
        capability_types_filter: Optional[Sequence[CapabilityType]] = None,
        intent: Optional[ProjectIntent] = None,
        pricing_tier: Optional[str] = None,
        rera_only: bool = False,
        page: int = 1,
        page_size: int = 20,
    ) -> List[BuilderMarketplaceCard]:
        """
        List builders for marketplace cards with basic filtering and pagination.
        """
        cap_filter = (
            list(capability_types_filter)
            if capability_types_filter
            else None
        )
        query = select(ProfessionalProfile)

        conditions = []
        if city:
            conditions.append(ProfessionalProfile.city.ilike(f"%{city}%"))
        if rera_only:
            conditions.append(ProfessionalProfile.rera_experience.is_(True))
        # Apply capability filter in SQL before pagination. Filtering only after LIMIT
        # could return zero cards while many builders match (first page lacked that capability).
        if cap_filter:
            cap_ids_subq = select(Capability.professional_id).where(
                Capability.capability_type.in_(cap_filter)
            ).distinct()
            form_types = MarketplaceService._builder_form_types_for_capabilities(cap_filter)
            match_professional = ProfessionalProfile.id.in_(cap_ids_subq)
            if form_types:
                fs_user_ids = (
                    select(FormSubmission.user_id)
                    .where(
                        FormSubmission.side == "builder",
                        FormSubmission.form_type.in_(form_types),
                        FormSubmission.user_id.isnot(None),
                    )
                    .distinct()
                )
                prof_via_forms = ProfessionalProfile.id.in_(
                    select(ProfessionalProfile.id).where(
                        MarketplaceService._prof_user_id_hex_sql(
                            ProfessionalProfile.user_id
                        ).in_(fs_user_ids)
                    )
                )
                conditions.append(or_(match_professional, prof_via_forms))
            else:
                conditions.append(match_professional)

        if conditions:
            query = query.where(and_(*conditions))

        # Naive pagination with offset/limit
        offset = max(page - 1, 0) * page_size
        query = query.offset(offset).limit(page_size)

        result = await db.execute(query)
        profiles: List[ProfessionalProfile] = list(result.scalars().all())
        # #region agent log
        MarketplaceService._agent_debug(
            "H-backend-cap-pagination",
            "marketplace_service.py:list_builders:after_page_query",
            "profiles fetched (capability applied pre-limit)",
            {
                "city": city,
                "capability_types_filter": [str(x) for x in cap_filter] if cap_filter else None,
                "page": page,
                "page_size": page_size,
                "profile_count": len(profiles),
            },
        )
        # #endregion

        if not profiles:
            # #region agent log
            MarketplaceService._agent_debug(
                "H-backend-empty-page",
                "marketplace_service.py:list_builders:empty_profiles",
                "no profiles for query (early return)",
                {
                    "city": city,
                    "capability_types_filter": [str(x) for x in cap_filter] if cap_filter else None,
                    "page": page,
                    "page_size": page_size,
                },
            )
            # #endregion
            return []

        return await MarketplaceService._build_marketplace_cards(
            db,
            profiles,
            cap_filter=cap_filter,
            intent=intent,
            apply_post_filters=True,
        )

    # ---------- Project marketplace ----------

    @staticmethod
    async def list_projects(
        db: AsyncSession,
        *,
        city: Optional[str] = None,
        project_type: Optional[ProjectType] = None,
        intent: Optional[ProjectIntent] = None,
        asset_class: Optional[str] = None,
        budget_tier: Optional[str] = None,
        min_bua: Optional[float] = None,
        max_bua: Optional[float] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> List[ProjectMarketplaceCard]:
        """
        List landowner projects for marketplace cards with basic filtering and pagination.
        Only published projects are shown in marketplace.
        This ensures unpaid or incomplete landowner projects never appear publicly.
        """
        query = (
            select(Project)
            .options(selectinload(Project.property).selectinload(Property.landowner))
            .join(Property)
            .where(Project.status == ProjectStatus.PUBLISHED)
        )

        conditions = []
        if city:
            conditions.append(Property.city.ilike(f"%{city}%"))
        if project_type:
            conditions.append(Project.project_type == project_type)
        if intent:
            conditions.append(Project.intent == intent)
        if asset_class:
            conditions.append(Project.asset_class == asset_class)
        if budget_tier:
            conditions.append(Project.budget_tier == budget_tier)

        if conditions:
            query = query.where(and_(*conditions))

        offset = max(page - 1, 0) * page_size
        query = query.offset(offset).limit(page_size)

        result = await db.execute(query)
        projects: List[Project] = list(result.scalars().unique().all())

        if not projects:
            return []

        # Latest landowner form submissions by (user_id, form_type) to enrich cards.
        landowner_user_hex_ids = {
            project.property.landowner.user_id.hex
            for project in projects
            if project.property and project.property.landowner and project.property.landowner.user_id
        }
        submissions_by_user_and_type = {}
        if landowner_user_hex_ids:
            fs_result = await db.execute(
                select(FormSubmission).where(
                    FormSubmission.side == "landowner",
                    FormSubmission.user_id.in_(list(landowner_user_hex_ids)),
                    FormSubmission.form_type.in_(
                        ["joint-venture", "contract-construction", "interior", "reconstruction"]
                    ),
                )
            )
            all_submissions = list(fs_result.scalars().all())
            for sub in all_submissions:
                key = (sub.user_id, sub.form_type)
                existing = submissions_by_user_and_type.get(key)
                if existing is None or sub.created_at > existing.created_at:
                    submissions_by_user_and_type[key] = sub

        # Preload PID verifications for properties (skip if table missing or query fails)
        property_ids = {p.property_id for p in projects}
        pids_by_property: dict = {}
        try:
            pid_result = await db.execute(
                select(PIDVerification).where(PIDVerification.property_id.in_(property_ids))
            )
            all_pids: List[PIDVerification] = list(pid_result.scalars().all())
            for pv in all_pids:
                pids_by_property.setdefault(pv.property_id, []).append(pv)
        except Exception:
            pass

        cards: List[ProjectMarketplaceCard] = []
        for project in projects:
            prop: Optional[Property] = project.property
            if prop is None:
                continue

            form_type_for_project = {
                ProjectType.JV_JD: "joint-venture",
                ProjectType.CONTRACT_CONSTRUCTION: "contract-construction",
                ProjectType.INTERIOR: "interior",
                ProjectType.RECONSTRUCTION: "reconstruction",
            }.get(project.project_type)
            landowner_form_payload = None
            if form_type_for_project and prop.landowner and prop.landowner.user_id:
                user_hex = prop.landowner.user_id.hex
                sub = submissions_by_user_and_type.get((user_hex, form_type_for_project))
                if sub is not None:
                    landowner_form_payload = sub.payload

            plot_area = prop.plot_area_sqft
            road_width = prop.road_width_ft or 40.0

            total_bua = None
            scale_tier: Optional[ProjectScaleTier] = None
            if plot_area and road_width:
                raw_intent = project.intent
                if hasattr(raw_intent, "value"):
                    use_type = getattr(raw_intent, "value", "RESIDENTIAL") or "RESIDENTIAL"
                else:
                    use_type = (raw_intent if isinstance(raw_intent, str) else None) or "RESIDENTIAL"
                far_result = FARService.calculate_far(
                    plot_area_sqft=plot_area,
                    road_width_ft=road_width,
                    use_type=use_type,
                )
                total_bua = far_result.total_buildable_area_sqft
                if total_bua is not None:
                    if total_bua < 2500:
                        scale_tier = ProjectScaleTier.SMALL_SCALE
                    elif total_bua < 10000:
                        scale_tier = ProjectScaleTier.MEDIUM_SCALE
                    else:
                        scale_tier = ProjectScaleTier.LARGE_SCALE

            # BUA-based filters applied after computation
            if min_bua is not None and (total_bua is None or total_bua < min_bua):
                continue
            if max_bua is not None and (total_bua is None or total_bua > max_bua):
                continue

            pid_list = pids_by_property.get(prop.id, [])
            has_pid_verification = any(
                pv.verification_status == VerificationStatus.VERIFIED
                for pv in pid_list
            )

            card = ProjectMarketplaceCard(
                project_id=project.id,
                property_id=project.property_id,
                city=prop.city,
                ward=prop.ward,
                landmark=prop.landmark,
                project_type=project.project_type,
                intent=project.intent,
                asset_class=project.asset_class,
                budget_tier=project.budget_tier,
                timeline=project.timeline,
                scope=project.scope,
                status=project.status,
                total_buildable_area_sqft=total_bua,
                project_scale_tier=scale_tier,
                plot_area_sqft=plot_area,
                road_width_ft=prop.road_width_ft,
                tax_paid=prop.tax_paid,
                e_khatha_status=prop.e_khatha_status,
                has_pid_verification=has_pid_verification,
                landowner_form_payload=landowner_form_payload,
            )
            cards.append(card)

        return cards

