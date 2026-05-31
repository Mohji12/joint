"""
Matching service with scoring algorithm
"""
import math
import logging
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.exc import ProgrammingError
from app.models.matching import Match, MatchScore
from app.models.landowner import Project, LandownerProfile
from app.models.professional import ProfessionalProfile, Capability, PricingTier
from app.models.landowner import Property
from app.models.verification import PIDVerification
from app.models.payment import Transaction
from app.utils.constants import (
    MatchStatus,
    MATCH_WEIGHTS,
    TRUST_WEIGHTS,
    ProjectType,
    ProjectIntent,
    CapabilityType,
    VerificationStatus,
    ProjectScaleTier,
    RERA_THRESHOLD_SQFT,
    JVPostConstructionExpectation,
    PricingTierType,
    TransactionStatus,
)
from app.services.far_service import FARService
from app.models.professional import (
    LocationPreference,
    ProfessionalPricing,
    PricingTier,
    ProjectSizeCategory as ProjectSizeCategoryModel,
    JVJDPreferences,
)
from app.models.landowner import JVPreferences
from app.config import settings
from app.exceptions import NotFoundError, ValidationError
from app.services.email_service import send_marketplace_connection_email
from app.utils.pricing import pick_builder_connect_fee

logger = logging.getLogger("jointlly.matching")


def _phone_from_profile_or_user(profile, user) -> Optional[str]:
    """Prefer profile.phone; many users only have phone on User after registration."""
    for src in (profile, user):
        if src is None:
            continue
        raw = getattr(src, "phone", None)
        if raw is None:
            continue
        s = str(raw).strip()
        if s:
            return s
    return None


def _mask_email(addr: Optional[str]) -> str:
    if not addr or "@" not in addr:
        return addr or "(none)"
    local, _, domain = addr.partition("@")
    if len(local) <= 1:
        return f"***@{domain}"
    return f"{local[0]}***@{domain}"


# Map project intent + type to asset class (for Tier 1). Finer project.asset_class overrides.
def _landowner_asset_class(project: Project) -> Optional[str]:
    """Derive landowner asset class for Tier 1 match. Returns RESIDENTIAL, COMMERCIAL, or INDUSTRIAL."""
    if project.asset_class:
        ac = project.asset_class.upper()
        if "RESIDENTIAL" in ac:
            return "RESIDENTIAL"
        if "COMMERCIAL" in ac:
            return "COMMERCIAL"
        if "INDUSTRIAL" in ac:
            return "INDUSTRIAL"
    if project.intent:
        return project.intent.value
    return None


def _tier1_pass(
    project: Project,
    property_obj: Property,
    professional: ProfessionalProfile,
    total_bua_sqft: float,
    builder_hubs: List,
    builder_asset_intents: Optional[set],
) -> bool:
    """
    Tier 1 hard filters: service (caller already filtered by capability), asset class,
    geospatial (Haversine if coords else city fallback), RERA when BUA > 5400.
    Returns False on first failure.
    """
    # 2.2 Asset class: landowner asset class must be in builder's served intents
    landowner_ac = _landowner_asset_class(project)
    if landowner_ac:
        # builder_asset_intents: set of intent values e.g. {"RESIDENTIAL", "COMMERCIAL"}
        if builder_asset_intents:
            if landowner_ac not in builder_asset_intents:
                return False
        # else: no builder intents stored -> pass (builder serves all)

    # 2.3 Geospatial: property must be within builder's service area
    prop_lat, prop_lon = getattr(property_obj, "latitude", None), getattr(property_obj, "longitude", None)
    property_city = (property_obj.city or "").strip().lower()

    if prop_lat is not None and prop_lon is not None and builder_hubs:
        # Option A: Haversine with hub coords
        for hub in builder_hubs:
            hub_lat = getattr(hub, "latitude", None)
            hub_lon = getattr(hub, "longitude", None)
            radius_km = getattr(hub, "radius_km", None) or 50.0
            if hub_lat is not None and hub_lon is not None:
                dist_km = MatchingService.haversine_distance(prop_lat, prop_lon, hub_lat, hub_lon)
                if dist_km <= radius_km:
                    break
        else:
            # No hub within radius
            return False
    elif builder_hubs or professional.location_preferences:
        # Option B: city/area fallback
        city_ok = False
        if property_city:
            for hub in builder_hubs:
                loc_name = (getattr(hub, "location_name", None) or "").strip().lower()
                if property_city in loc_name or loc_name in property_city:
                    city_ok = True
                    break
            if not city_ok and professional.location_preferences:
                for pref in professional.location_preferences or []:
                    if property_city in (pref or "").lower() or (pref or "").lower() in property_city:
                        city_ok = True
                        break
        if not city_ok and (builder_hubs or professional.location_preferences):
            return False
    # If builder has no location prefs at all, pass (no constraint)

    # 2.4 RERA: when BUA > 5400, require builder to have RERA experience
    if total_bua_sqft > RERA_THRESHOLD_SQFT:
        if not professional.rera_experience:
            return False

    return True


# Default road width (ft) when property has none, for FAR calculation
DEFAULT_ROAD_WIDTH_FT = 40.0


def _compute_bua_and_tier(property_obj: Property, project: Project) -> Tuple[float, ProjectScaleTier]:
    """
    Compute total buildable area (BUA) and project scale tier once per project.
    Used for RERA filter, Tier 2 scale scoring, and pricing estimation.
    """
    plot_area = property_obj.plot_area_sqft or 0.0
    road_width = property_obj.road_width_ft or DEFAULT_ROAD_WIDTH_FT
    if plot_area <= 0:
        return 0.0, ProjectScaleTier.SMALL_SCALE
    use_type = (project.intent.value if project.intent else "RESIDENTIAL")
    far_result = FARService.calculate_far(
        plot_area_sqft=plot_area,
        road_width_ft=road_width,
        use_type=use_type,
    )
    total_bua = far_result.total_buildable_area_sqft or 0.0
    # Project scale tier from BUA (for Tier 2 and reporting)
    if total_bua < 2500:
        tier = ProjectScaleTier.SMALL_SCALE
    elif total_bua < 10000:
        tier = ProjectScaleTier.MEDIUM_SCALE
    else:
        tier = ProjectScaleTier.LARGE_SCALE
    return total_bua, tier


class MatchingService:
    """Service for matching projects with professionals"""
    
    @staticmethod
    def get_builder_connect_fee_from_match(match: Match) -> float:
        """
        Compute builder connect fee from match score using configured pricing tiers.
        """
        score = float(getattr(match, "match_score", 0.0) or 0.0)
        return pick_builder_connect_fee(score)

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        Calculate distance between two coordinates using Haversine formula
        Returns distance in kilometers
        """
        R = 6371  # Earth radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
            math.sin(dlon / 2) ** 2
        )
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    @staticmethod
    def calculate_project_type_score(
        project_type: ProjectType,
        capabilities: List[Capability]
    ) -> float:
        """Calculate project type match score (20% weight)"""
        capability_type_map = {
            ProjectType.CONTRACT_CONSTRUCTION: CapabilityType.CONSTRUCTION,
            ProjectType.INTERIOR: CapabilityType.INTERIOR,
            ProjectType.RECONSTRUCTION: CapabilityType.RECONSTRUCTION,
            ProjectType.JV_JD: CapabilityType.JV_JD,
        }
        
        required_capability = capability_type_map.get(project_type)
        if not required_capability:
            return 0.0
        
        for capability in capabilities:
            if capability.capability_type == required_capability:
                return 1.0
        
        return 0.0
    
    @staticmethod
    def calculate_location_score(
        property_city: str,
        location_preferences: Optional[List[str]]
    ) -> float:
        """Calculate location match score (25% weight)"""
        if not location_preferences:
            return 0.5  # Neutral score if no preferences
        
        property_city_lower = property_city.lower()
        for pref in location_preferences:
            if property_city_lower in pref.lower() or pref.lower() in property_city_lower:
                return 1.0
        
        return 0.3  # Partial match
    
    @staticmethod
    def calculate_project_size_score(
        project_area_sqft: float,
        pricing_tiers: List[PricingTier],
        capability_type: CapabilityType
    ) -> float:
        """Calculate project size compatibility score (15% weight)"""
        if not pricing_tiers:
            return 0.5
        
        # Find matching pricing tier
        for tier in pricing_tiers:
            if tier.capability_type != capability_type:
                continue
            
            min_area = tier.min_area_sqft or 0
            max_area = tier.max_area_sqft or float('inf')
            
            if min_area <= project_area_sqft <= max_area:
                return 1.0
        
        return 0.5  # Neutral if no exact match
    
    @staticmethod
    def calculate_pricing_score(
        project_area_sqft: float,
        pricing_tiers: List[PricingTier],
        capability_type: CapabilityType
    ) -> float:
        """Calculate pricing match score (15% weight)"""
        if not pricing_tiers:
            return 0.5
        
        # Find applicable pricing tier
        applicable_tiers = [
            t for t in pricing_tiers
            if t.capability_type == capability_type and
            (t.min_area_sqft is None or project_area_sqft >= t.min_area_sqft) and
            (t.max_area_sqft is None or project_area_sqft <= t.max_area_sqft)
        ]
        
        if applicable_tiers:
            # Score based on competitive pricing (lower is better, normalized)
            avg_price = sum(t.price_per_sqft for t in applicable_tiers) / len(applicable_tiers)
            # Normalize: assume ₹1000-5000 per sqft range
            normalized = max(0, min(1, 1 - (avg_price - 1000) / 4000))
            return normalized
        
        return 0.5
    
    @staticmethod
    def calculate_capability_score(
        capabilities: List[Capability],
        project_type: ProjectType
    ) -> float:
        """Calculate capability match score (15% weight)"""
        if not capabilities:
            return 0.0
        
        capability_type_map = {
            ProjectType.CONTRACT_CONSTRUCTION: CapabilityType.CONSTRUCTION,
            ProjectType.INTERIOR: CapabilityType.INTERIOR,
            ProjectType.RECONSTRUCTION: CapabilityType.RECONSTRUCTION,
            ProjectType.JV_JD: CapabilityType.JV_JD,
        }
        
        required = capability_type_map.get(project_type)
        if not required:
            return 0.0
        
        # Check if required capability exists
        for cap in capabilities:
            if cap.capability_type == required:
                return 1.0
        
        return 0.0
    
    @staticmethod
    def calculate_verification_score(
        property_obj: Property,
        pid_verifications: List[PIDVerification]
    ) -> float:
        """Calculate verification level score (10% weight)"""
        score = 0.0
        
        # PID verification
        verified_pid = any(
            v.verification_status == VerificationStatus.VERIFIED
            for v in pid_verifications
        )
        if verified_pid:
            score += 0.5
        
        # Basic property info
        if property_obj.pid_number:
            score += 0.2
        if property_obj.tax_paid:
            score += 0.2
        if property_obj.e_khatha_status:
            score += 0.1
        
        return min(1.0, score)

    @staticmethod
    def calculate_proximity_score(
        property_obj: Property,
        professional: ProfessionalProfile,
        builder_hubs: List,
    ) -> float:
        """Proximity component for trust formula (0-1). Coords: 1/(1+dist_km); else city match."""
        prop_lat = getattr(property_obj, "latitude", None)
        prop_lon = getattr(property_obj, "longitude", None)
        if prop_lat is not None and prop_lon is not None and builder_hubs:
            min_dist = float("inf")
            for hub in builder_hubs:
                hub_lat = getattr(hub, "latitude", None)
                hub_lon = getattr(hub, "longitude", None)
                if hub_lat is not None and hub_lon is not None:
                    d = MatchingService.haversine_distance(prop_lat, prop_lon, hub_lat, hub_lon)
                    min_dist = min(min_dist, d)
            if min_dist != float("inf"):
                return min(1.0, 1.0 / (1.0 + min_dist))
        return MatchingService.calculate_location_score(
            property_obj.city or "",
            professional.location_preferences,
        )

    @staticmethod
    def calculate_response_speed_score() -> float:
        """Placeholder for response speed (0-1). Later: time to first response / accept rate."""
        return 0.5

    # --- Tier 2 scoring (ranking) ---
    @staticmethod
    def calculate_tier2_scale_score(
        total_bua_sqft: float,
        pricing_tiers: List[PricingTier],
        project_size_categories: List,
        capability_type: CapabilityType,
    ) -> float:
        """Score how well BUA fits builder's capacity (PricingTier / ProjectSizeCategory)."""
        if total_bua_sqft <= 0:
            return 0.5
        for tier in pricing_tiers:
            if tier.capability_type != capability_type:
                continue
            min_a = tier.min_area_sqft or 0
            max_a = tier.max_area_sqft or float("inf")
            if min_a <= total_bua_sqft <= max_a:
                return 1.0
        # Check ProjectSizeCategory bands (e.g. UP_TO_5000 -> 0-5000)
        for psc in project_size_categories:
            if psc.capability_type != capability_type:
                continue
            cat = getattr(psc, "size_category", None)
            if not cat:
                continue
            if cat.value == "UP_TO_5000" and total_bua_sqft <= 5000:
                return 0.9
            if cat.value == "5000_25000" and 5000 <= total_bua_sqft <= 25000:
                return 0.9
            if cat.value == "25000_100000" and 25000 <= total_bua_sqft <= 100000:
                return 0.9
            if cat.value == "100000_PLUS" and total_bua_sqft >= 100000:
                return 0.9
        return 0.5

    @staticmethod
    def calculate_tier2_budget_score(
        project_budget_tier: Optional[str],
        professional_pricing: List,
    ) -> float:
        """Score budget tier alignment (Basic/Standard/Luxury)."""
        if not project_budget_tier:
            return 0.5
        proj = project_budget_tier.upper().replace(" ", "_")
        if proj == "BASIC_REGULAR":
            proj = "BASIC"
        for pp in professional_pricing or []:
            tier = getattr(pp, "pricing_tier", None)
            if not tier:
                continue
            tval = tier.value if hasattr(tier, "value") else str(tier)
            tval = tval.replace("BASIC_REGULAR", "BASIC")
            if proj in tval or tval in proj:
                return 1.0
        return 0.5

    @staticmethod
    def calculate_tier2_jv_score(
        project_jv_expectation: Optional[str],
        builder_preferred_jv_models: Optional[List],
    ) -> float:
        """Score JV model alignment (only meaningful for JV_JD)."""
        if not project_jv_expectation:
            return 0.5
        pref = (project_jv_expectation.value if hasattr(project_jv_expectation, "value") else str(project_jv_expectation))
        preferred = builder_preferred_jv_models or []
        for p in preferred:
            pval = p.value if hasattr(p, "value") else str(p)
            if pref == pval or pref in pval or pval in pref:
                return 1.0
        return 0.3

    @staticmethod
    def calculate_tier2_timeline_score(project_timeline: Optional[str], builder_bandwidth: Optional[str]) -> float:
        """Score timeline vs builder bandwidth (Immediate / 1-3 months / Booked)."""
        if not project_timeline and not builder_bandwidth:
            return 0.5
        if not builder_bandwidth:
            return 0.5
        pt = (project_timeline or "").lower()
        bw = (builder_bandwidth or "").lower()
        if "immediate" in pt and "immediate" in bw:
            return 1.0
        if "3 month" in pt or "1-3" in pt:
            if "1-3" in bw or "3 month" in bw or "immediate" in bw:
                return 0.9
        if "booked" in bw and ("3 month" in pt or "6 month" in pt):
            return 0.4
        return 0.5
    
    @staticmethod
    async def calculate_match_score(
        db: AsyncSession,
        project: Project,
        professional: ProfessionalProfile
    ) -> dict:
        """Calculate comprehensive match score"""
        # Get project property
        property_obj = project.property
        
        # Get professional capabilities
        capabilities_result = await db.execute(
            select(Capability).where(Capability.professional_id == professional.id)
        )
        capabilities = list(capabilities_result.scalars().all())
        
        # Get pricing tiers
        pricing_result = await db.execute(
            select(PricingTier).where(PricingTier.professional_id == professional.id)
        )
        pricing_tiers = list(pricing_result.scalars().all())
        
        # Get PID verifications
        pid_result = await db.execute(
            select(PIDVerification).where(PIDVerification.property_id == property_obj.id)
        )
        pid_verifications = list(pid_result.scalars().all())
        
        # Map project type to capability type
        capability_type_map = {
            ProjectType.CONTRACT_CONSTRUCTION: CapabilityType.CONSTRUCTION,
            ProjectType.INTERIOR: CapabilityType.INTERIOR,
            ProjectType.RECONSTRUCTION: CapabilityType.RECONSTRUCTION,
            ProjectType.JV_JD: CapabilityType.JV_JD,
        }
        capability_type = capability_type_map.get(project.project_type, CapabilityType.CONSTRUCTION)
        
        # BUA and project area (use BUA for scale when available)
        total_bua_sqft, _ = _compute_bua_and_tier(property_obj, project)
        project_area = total_bua_sqft if total_bua_sqft > 0 else property_obj.plot_area_sqft

        # Load Tier 2 data: project size categories, professional pricing, JV prefs
        # Some deployments may not have all optional matching tables migrated yet.
        # Fallback to empty/default values so matching remains functional.
        try:
            psc_result = await db.execute(
                select(ProjectSizeCategoryModel).where(
                    ProjectSizeCategoryModel.professional_id == professional.id
                )
            )
            project_size_categories = list(psc_result.scalars().all())
        except ProgrammingError:
            project_size_categories = []

        try:
            pro_pricing_result = await db.execute(
                select(ProfessionalPricing).where(ProfessionalPricing.professional_id == professional.id)
            )
            professional_pricing = list(pro_pricing_result.scalars().all())
        except ProgrammingError:
            professional_pricing = []

        try:
            jv_prefs_result = await db.execute(
                select(JVPreferences).where(JVPreferences.project_id == project.id)
            )
            project_jv_prefs = jv_prefs_result.scalar_one_or_none()
        except ProgrammingError:
            project_jv_prefs = None

        try:
            jv_jd_result = await db.execute(
                select(JVJDPreferences).where(JVJDPreferences.professional_id == professional.id)
            )
            builder_jv_prefs = jv_jd_result.scalar_one_or_none()
        except ProgrammingError:
            builder_jv_prefs = None

        try:
            hubs_result = await db.execute(
                select(LocationPreference).where(LocationPreference.professional_id == professional.id)
            )
            builder_hubs = list(hubs_result.scalars().all())
        except ProgrammingError:
            builder_hubs = []
        
        # Tier 2 scores
        tier2_scale = MatchingService.calculate_tier2_scale_score(
            total_bua_sqft, pricing_tiers, project_size_categories, capability_type
        )
        tier2_budget = MatchingService.calculate_tier2_budget_score(
            project.budget_tier, professional_pricing
        )
        project_jv_expectation = project_jv_prefs.post_construction_expectation if project_jv_prefs else None
        builder_jv_models = builder_jv_prefs.preferred_jv_models if builder_jv_prefs else None
        tier2_jv = (
            MatchingService.calculate_tier2_jv_score(project_jv_expectation, builder_jv_models)
            if project.project_type == ProjectType.JV_JD
            else 0.5
        )
        tier2_timeline = MatchingService.calculate_tier2_timeline_score(
            project.timeline, professional.current_bandwidth
        )
        tier2_fit_score = (tier2_scale + tier2_budget + tier2_jv + tier2_timeline) / 4.0
        
        # Calculate individual scores
        project_type_score = MatchingService.calculate_project_type_score(
            project.project_type,
            capabilities
        )
        
        location_score = MatchingService.calculate_location_score(
            property_obj.city,
            professional.location_preferences
        )
        
        project_size_score = MatchingService.calculate_project_size_score(
            project_area,
            pricing_tiers,
            capability_type
        )
        # Use Tier 2 scale score to boost when BUA fits builder capacity
        project_size_score = max(project_size_score, tier2_scale * 0.7 + 0.3 * project_size_score)
        
        pricing_score = MatchingService.calculate_pricing_score(
            project_area,
            pricing_tiers,
            capability_type
        )
        
        capability_score = MatchingService.calculate_capability_score(
            capabilities,
            project.project_type
        )
        
        verification_score = MatchingService.calculate_verification_score(
            property_obj,
            pid_verifications
        )
        proximity_score = MatchingService.calculate_proximity_score(
            property_obj, professional, builder_hubs
        )
        response_speed_score = MatchingService.calculate_response_speed_score()
        trust_S = (
            verification_score * TRUST_WEIGHTS["verification"] +
            proximity_score * TRUST_WEIGHTS["proximity"] +
            response_speed_score * TRUST_WEIGHTS["response_speed"]
        )
        
        # Combine base weighted score with Tier 2 fit (scale, budget, JV, timeline)
        base_score = (
            project_type_score * MATCH_WEIGHTS["project_type"] +
            location_score * MATCH_WEIGHTS["location"] +
            project_size_score * MATCH_WEIGHTS["project_size"] +
            pricing_score * MATCH_WEIGHTS["pricing"] +
            capability_score * MATCH_WEIGHTS["capability"] +
            verification_score * MATCH_WEIGHTS["verification"]
        )
        # Tier 2 contributes 25%; trust S contributes 30% to final
        technical_score = base_score * 0.75 + tier2_fit_score * 0.25
        total_score = technical_score * 0.7 + trust_S * 0.3

        # Pricing estimation: totalBUA * builder avg price_per_sqft (for API/min-ticket)
        builder_avg_price = None
        for t in pricing_tiers:
            if t.capability_type == capability_type and t.price_per_sqft:
                builder_avg_price = (builder_avg_price or 0) + t.price_per_sqft
        n_tiers = sum(1 for t in pricing_tiers if t.capability_type == capability_type and t.price_per_sqft)
        if n_tiers:
            builder_avg_price = (builder_avg_price or 0) / n_tiers
        estimated_cost = (total_bua_sqft * builder_avg_price) if (total_bua_sqft and builder_avg_price) else None
        
        return {
            "project_type_score": project_type_score,
            "location_score": location_score,
            "project_size_score": project_size_score,
            "pricing_score": pricing_score,
            "capability_score": capability_score,
            "verification_score": verification_score,
            "proximity_score": proximity_score,
            "response_speed_score": response_speed_score,
            "tier2_scale_score": tier2_scale,
            "tier2_budget_score": tier2_budget,
            "tier2_jv_score": tier2_jv,
            "tier2_timeline_score": tier2_timeline,
            "tier2_fit_score": tier2_fit_score,
            "total_score": total_score,
            "estimated_cost": estimated_cost,
        }
    
    @staticmethod
    async def create_match(
        db: AsyncSession,
        project_id: UUID,
        professional_id: UUID,
        score_data: Optional[dict] = None,
    ) -> Match:
        """Create match between project and professional. If score_data provided, use it (for top-5 flow)."""
        # Get project and professional
        project_result = await db.execute(
            select(Project)
            .options(selectinload(Project.property))
            .where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        if not project:
            raise NotFoundError("Project", str(project_id))
        
        professional_result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        professional = professional_result.scalar_one_or_none()
        if not professional:
            raise NotFoundError("ProfessionalProfile", str(professional_id))
        
        if score_data is None:
            score_data = await MatchingService.calculate_match_score(db, project, professional)
        
        # Create match (with optional estimated_cost for transparency)
        match = Match(
            project_id=project_id,
            professional_id=professional_id,
            match_score=score_data["total_score"],
            estimated_cost=score_data.get("estimated_cost"),
            status=MatchStatus.PENDING
        )
        
        db.add(match)
        await db.commit()
        await db.refresh(match)
        
        # Create match score details (including trust components)
        match_score = MatchScore(
            match_id=match.id,
            project_type_score=score_data["project_type_score"],
            location_score=score_data["location_score"],
            project_size_score=score_data["project_size_score"],
            pricing_score=score_data["pricing_score"],
            capability_score=score_data["capability_score"],
            verification_score=score_data["verification_score"],
            proximity_score=score_data.get("proximity_score"),
            response_speed_score=score_data.get("response_speed_score"),
            total_score=score_data["total_score"]
        )
        
        db.add(match_score)
        await db.commit()
        
        return match
    
    @staticmethod
    async def match_project_to_professionals(
        db: AsyncSession,
        project_id: UUID
    ) -> List[Match]:
        """Match a project to all suitable professionals (Tier 1 filter, Tier 2 + trust score, top 5)."""
        # Get project and property (eager-load property to avoid async lazy-load)
        project_result = await db.execute(
            select(Project)
            .options(selectinload(Project.property))
            .where(Project.id == project_id)
        )
        project = project_result.scalar_one_or_none()
        if not project:
            raise NotFoundError("Project", str(project_id))
        property_obj = project.property
        if not property_obj:
            raise NotFoundError("Property", "for project")

        # Compute FAR/BUA once per project and project scale tier (used in Tier 1 RERA, Tier 2, pricing)
        total_bua_sqft, project_scale_tier = _compute_bua_and_tier(property_obj, project)

        # Get all professionals with matching capabilities (service category = Tier 1)
        capability_type_map = {
            ProjectType.CONTRACT_CONSTRUCTION: CapabilityType.CONSTRUCTION,
            ProjectType.INTERIOR: CapabilityType.INTERIOR,
            ProjectType.RECONSTRUCTION: CapabilityType.RECONSTRUCTION,
            ProjectType.JV_JD: CapabilityType.JV_JD,
        }
        required_capability = capability_type_map.get(project.project_type)
        
        if required_capability:
            professionals_result = await db.execute(
                select(ProfessionalProfile)
                .join(Capability)
                .where(Capability.capability_type == required_capability)
            )
        else:
            professionals_result = await db.execute(select(ProfessionalProfile))
        
        professionals = list(professionals_result.scalars().all())
        if not professionals:
            return []

        # Load Tier 1 data: location hubs and asset intents per professional
        pro_ids = [p.id for p in professionals]
        hubs_result = await db.execute(
            select(LocationPreference).where(LocationPreference.professional_id.in_(pro_ids))
        )
        all_hubs = list(hubs_result.scalars().all())
        hubs_by_pro: dict = {}
        for hub in all_hubs:
            hubs_by_pro.setdefault(hub.professional_id, []).append(hub)
        pricing_result = await db.execute(
            select(ProfessionalPricing).where(
                ProfessionalPricing.professional_id.in_(pro_ids),
                ProfessionalPricing.project_type.isnot(None),
            )
        )
        intents_by_pro: dict = {}
        for row in pricing_result.scalars().all():
            intent_val = row.project_type.value if hasattr(row.project_type, "value") else str(row.project_type)
            intents_by_pro.setdefault(row.professional_id, set()).add(intent_val)

        # Tier 1 hard filters: keep only builders who pass
        passed = []
        for professional in professionals:
            if not _tier1_pass(
                project,
                property_obj,
                professional,
                total_bua_sqft,
                hubs_by_pro.get(professional.id, []),
                intents_by_pro.get(professional.id),
            ):
                continue
            passed.append(professional)
        professionals = passed

        # Score each passed professional, sort by total_score desc, take exactly top 5, then create Match records
        scored: List[Tuple[ProfessionalProfile, dict]] = []
        for professional in professionals:
            existing_result = await db.execute(
                select(Match).where(
                    and_(
                        Match.project_id == project_id,
                        Match.professional_id == professional.id
                    )
                )
            )
            if existing_result.scalar_one_or_none():
                continue
            score_data = await MatchingService.calculate_match_score(db, project, professional)
            # Optional: exclude if estimated_cost below builder min_ticket (no min_ticket field yet; deprioritize by leaving in list)
            scored.append((professional, score_data))
        scored.sort(key=lambda x: x[1]["total_score"], reverse=True)
        top5 = scored[:5]

        matches = []
        for professional, score_data in top5:
            match = await MatchingService.create_match(
                db, project_id, professional.id, score_data=score_data
            )
            matches.append(match)
        return matches
    
    @staticmethod
    async def get_project_matches(
        db: AsyncSession,
        project_id: UUID,
        limit: int = 5
    ) -> List[Match]:
        """Get matches for a project, sorted by score (default 5 per algorithm spec)."""
        result = await db.execute(
            select(Match)
            .where(Match.project_id == project_id)
            .options(
                selectinload(Match.match_score_details),
                selectinload(Match.professional).selectinload(ProfessionalProfile.capabilities),
                selectinload(Match.professional).selectinload(ProfessionalProfile.pricing_tiers),
            )
            .order_by(Match.match_score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def get_professional_matches(
        db: AsyncSession,
        professional_id: UUID,
        limit: int = 10
    ) -> List[Match]:
        """Get matches for a professional, sorted by score"""
        result = await db.execute(
            select(Match)
            .where(Match.professional_id == professional_id)
            .options(
                selectinload(Match.match_score_details),
                selectinload(Match.project).selectinload(Project.property),
            )
            .order_by(Match.match_score.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def ensure_match_for_professional(
        db: AsyncSession,
        project_id: UUID,
        professional_id: UUID,
    ) -> Match:
        """Return existing match or create one so builder can accept marketplace projects."""
        existing_result = await db.execute(
            select(Match).where(
                and_(
                    Match.project_id == project_id,
                    Match.professional_id == professional_id,
                )
            )
        )
        existing = existing_result.scalar_one_or_none()
        if existing:
            return existing
        return await MatchingService.create_match(db, project_id, professional_id)

    @staticmethod
    async def get_match_by_id(db: AsyncSession, match_id: UUID) -> Match:
        """Get a match by id with project (property, landowner) and professional loaded for ownership checks."""
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(Match)
            .where(Match.id == match_id)
            .options(
                selectinload(Match.project).selectinload(Project.property).selectinload(Property.landowner),
                selectinload(Match.professional).selectinload(ProfessionalProfile.user),
                selectinload(Match.professional).selectinload(ProfessionalProfile.capabilities),
                selectinload(Match.professional).selectinload(ProfessionalProfile.pricing_tiers),
                selectinload(Match.project).selectinload(Project.property).selectinload(Property.landowner).selectinload(LandownerProfile.user),
                selectinload(Match.match_score_details),
            )
        )
        match = result.scalar_one_or_none()
        if not match:
            raise NotFoundError("Match", str(match_id))
        return match

    @staticmethod
    async def _dispatch_marketplace_connection_emails(
        *,
        match: Match,
        selector_side: str,
        payment_reference: Optional[str] = None,
    ) -> bool:
        """Send contact-sharing emails to both sides; best-effort and non-blocking errors."""
        try:
            project = match.project
            prop = project.property if project else None
            landowner = prop.landowner if prop else None
            professional = match.professional
            landowner_user = getattr(landowner, "user", None)
            professional_user = getattr(professional, "user", None)

            landowner_email = getattr(landowner_user, "email", None)
            builder_email = getattr(professional_user, "email", None)
            if not landowner_email and not builder_email:
                logger.warning(
                    "Marketplace email dispatch skipped for match_id=%s: no recipient emails found",
                    getattr(match, "id", None),
                )
                return False

            logger.info(
                "Marketplace email dispatch match_id=%s selector_side=%s builder=%s landowner=%s",
                getattr(match, "id", None),
                selector_side,
                _mask_email(builder_email),
                _mask_email(landowner_email),
            )
            if settings.debug:
                logger.info(
                    "Marketplace email recipients (debug): builder=%r landowner=%r",
                    builder_email,
                    landowner_email,
                )

            selector_name = (
                (landowner.name if selector_side == "landowner" and landowner else None)
                or (professional.company_name if selector_side == "builder" and professional else None)
                or "Jointlly user"
            )
            selector_email = (landowner_email if selector_side == "landowner" else builder_email)
            if selector_side == "landowner":
                selector_phone = _phone_from_profile_or_user(landowner, landowner_user)
            else:
                selector_phone = _phone_from_profile_or_user(professional, professional_user)

            landowner_phone = _phone_from_profile_or_user(landowner, landowner_user)
            builder_phone = _phone_from_profile_or_user(professional, professional_user)

            project_type = (
                project.project_type.value if hasattr(project.project_type, "value") else str(project.project_type)
            ) if project else None
            project_city = prop.city if prop else None
        except Exception:
            logger.exception(
                "Marketplace connection email pre-processing failed for match_id=%s",
                getattr(match, "id", None),
            )
            return False

        sent_any = False

        if builder_email:
            try:
                builder_ok = await send_marketplace_connection_email(
                    to_email=builder_email,
                    recipient_name=professional.company_name if professional else None,
                    recipient_role="builder",
                    selector_side=selector_side,
                    selector_name=selector_name,
                    selector_email=selector_email,
                    selector_phone=selector_phone,
                    other_party_name=landowner.name if landowner else "Landowner",
                    other_party_email=landowner_email,
                    other_party_phone=landowner_phone,
                    project_type=project_type,
                    project_city=project_city,
                    payment_reference=payment_reference,
                )
                logger.info(
                    "Marketplace email to builder match_id=%s to=%s smtp_ok=%s",
                    getattr(match, "id", None),
                    _mask_email(builder_email),
                    builder_ok,
                )
                if builder_ok:
                    sent_any = True
            except Exception:
                logger.exception(
                    "Failed sending marketplace email to builder for match_id=%s to=%s",
                    getattr(match, "id", None),
                    builder_email,
                )
        else:
            logger.warning(
                "Marketplace email dispatch skipped for match_id=%s: builder email missing",
                getattr(match, "id", None),
            )

        if landowner_email:
            try:
                landowner_ok = await send_marketplace_connection_email(
                    to_email=landowner_email,
                    recipient_name=landowner.name if landowner else None,
                    recipient_role="landowner",
                    selector_side=selector_side,
                    selector_name=selector_name,
                    selector_email=selector_email,
                    selector_phone=selector_phone,
                    other_party_name=professional.company_name if professional else "Builder",
                    other_party_email=builder_email,
                    other_party_phone=builder_phone,
                    project_type=project_type,
                    project_city=project_city,
                    payment_reference=payment_reference,
                )
                logger.info(
                    "Marketplace email to landowner match_id=%s to=%s smtp_ok=%s",
                    getattr(match, "id", None),
                    _mask_email(landowner_email),
                    landowner_ok,
                )
                if landowner_ok:
                    sent_any = True
            except Exception:
                logger.exception(
                    "Failed sending marketplace email to landowner for match_id=%s to=%s",
                    getattr(match, "id", None),
                    landowner_email,
                )
        else:
            logger.warning(
                "Marketplace email dispatch skipped for match_id=%s: landowner email missing",
                getattr(match, "id", None),
            )

        if sent_any:
            logger.info(
                "Marketplace connection email dispatch completed for match_id=%s (builder_email=%s, landowner_email_present=%s)",
                getattr(match, "id", None),
                bool(builder_email),
                bool(landowner_email),
            )
        else:
            logger.error(
                "Marketplace connection email dispatch failed for all recipients for match_id=%s",
                getattr(match, "id", None),
            )
        return sent_any

    @staticmethod
    async def landowner_express_interest(db: AsyncSession, match_id: UUID) -> tuple[Match, bool]:
        """Landowner selects builder; first confirmation sends contact-sharing emails (idempotent)."""
        match = await MatchingService.get_match_by_id(db, match_id)
        # Already confirmed — UI shows "Selected"; do not resend emails or rewrite status.
        if match.express_interest_landowner:
            return match, False

        now = datetime.utcnow()
        match.express_interest_landowner = True

        if match.express_interest_builder:
            if not match.mutual_interest_at:
                match.mutual_interest_at = now
            match.status = MatchStatus.CONNECTED
        else:
            match.status = MatchStatus.LANDOWNER_SELECTED

        await db.commit()
        await db.refresh(match)

        # Reload with all required relationships to avoid async lazy-load (MissingGreenlet)
        # inside email dispatch.
        match = await MatchingService.get_match_by_id(db, match_id)
        email_sent = await MatchingService._dispatch_marketplace_connection_emails(
            match=match,
            selector_side="landowner",
        )
        return match, email_sent

    @staticmethod
    async def landowner_clear_selection(db: AsyncSession, match_id: UUID) -> Match:
        """
        Withdraw landowner marketplace selection (testing / changed mind).
        Resets express_interest_landowner and status so Select + confirmation + email can run again.
        """
        match = await MatchingService.get_match_by_id(db, match_id)
        if match.status in (MatchStatus.REJECTED, MatchStatus.ACCEPTED):
            raise ValidationError("Cannot clear selection for a rejected or accepted match.")

        if not match.express_interest_landowner:
            return match

        match.express_interest_landowner = False

        if match.express_interest_builder:
            if match.status == MatchStatus.CONNECTED:
                match.mutual_interest_at = None
            match.status = MatchStatus.BUILDER_SELECTED_PAID
        else:
            match.status = MatchStatus.PENDING

        await db.commit()
        await db.refresh(match)
        return match

    @staticmethod
    async def builder_express_interest_after_payment(
        db: AsyncSession,
        match_id: UUID,
        transaction_id: UUID,
    ) -> tuple[Match, bool]:
        """Builder select flow completion; requires successful payment transaction."""
        tx_result = await db.execute(select(Transaction).where(Transaction.id == transaction_id))
        transaction = tx_result.scalar_one_or_none()
        if not transaction:
            raise NotFoundError("Transaction", str(transaction_id))
        if transaction.status != TransactionStatus.SUCCESS:
            raise ValidationError("Builder selection can be confirmed only after successful payment")

        match = await MatchingService.get_match_by_id(db, match_id)
        if transaction.match_id and transaction.match_id != match.id:
            raise NotFoundError("Match", str(match_id))

        now = datetime.utcnow()
        changed = False
        if not match.express_interest_builder:
            match.express_interest_builder = True
            changed = True
        if not match.gatekeeper_unlocked_at:
            match.gatekeeper_unlocked_at = now
            changed = True

        if match.express_interest_landowner:
            if not match.mutual_interest_at:
                match.mutual_interest_at = now
            match.status = MatchStatus.CONNECTED
            changed = True
        else:
            match.status = MatchStatus.BUILDER_SELECTED_PAID
            changed = True

        if transaction.match_id != match.id:
            transaction.match_id = match.id
            changed = True

        if changed:
            await db.commit()
            await db.refresh(match)

        # Reload with all required relationships to avoid async lazy-load (MissingGreenlet)
        # inside email dispatch.
        match = await MatchingService.get_match_by_id(db, match_id)
        email_sent = await MatchingService._dispatch_marketplace_connection_emails(
            match=match,
            selector_side="builder",
            payment_reference=transaction.razorpay_payment_id or transaction.razorpay_order_id or str(transaction.id),
        )
        return match, email_sent

    @staticmethod
    async def builder_express_interest_direct(
        db: AsyncSession,
        match_id: UUID,
    ) -> tuple[Match, bool]:
        """
        No-payment builder connect flow (dev/local or when explicitly allowed).
        Marks both sides interested, connects match, and dispatches contact-sharing emails.
        """
        match = await MatchingService.get_match_by_id(db, match_id)
        if match.express_interest_builder and match.status == MatchStatus.CONNECTED:
            return match, False

        now = datetime.utcnow()
        changed = False

        if not match.express_interest_builder:
            match.express_interest_builder = True
            changed = True
        if not match.express_interest_landowner:
            match.express_interest_landowner = True
            changed = True
        if not match.gatekeeper_unlocked_at:
            match.gatekeeper_unlocked_at = now
            changed = True
        if not match.mutual_interest_at:
            match.mutual_interest_at = now
            changed = True
        if match.status != MatchStatus.CONNECTED:
            match.status = MatchStatus.CONNECTED
            changed = True

        if changed:
            await db.commit()
            await db.refresh(match)

        # Reload with all required relationships to avoid async lazy-load (MissingGreenlet)
        # inside email dispatch.
        match = await MatchingService.get_match_by_id(db, match_id)
        email_sent = await MatchingService._dispatch_marketplace_connection_emails(
            match=match,
            selector_side="builder",
            payment_reference="DIRECT_CONNECT",
        )
        return match, email_sent
    
    @staticmethod
    async def accept_match(
        db: AsyncSession,
        match_id: UUID
    ) -> Match:
        """Accept a match"""
        result = await db.execute(select(Match).where(Match.id == match_id))
        match = result.scalar_one_or_none()
        
        if not match:
            raise NotFoundError("Match", str(match_id))
        
        match.status = MatchStatus.ACCEPTED
        await db.commit()
        await db.refresh(match)
        
        return match
    
    @staticmethod
    async def reject_match(
        db: AsyncSession,
        match_id: UUID
    ) -> Match:
        """Reject a match"""
        result = await db.execute(select(Match).where(Match.id == match_id))
        match = result.scalar_one_or_none()
        
        if not match:
            raise NotFoundError("Match", str(match_id))
        
        match.status = MatchStatus.REJECTED
        await db.commit()
        await db.refresh(match)
        
        return match
