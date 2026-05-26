"""
FAR (Floor Area Ratio) calculation service.

This module exposes a simple API that is used in two ways:
- Attached to persisted `Property` objects for landowner projects.
- As a reusable rule engine for on-the-fly FAR calculations
  (used by generic FAR endpoints and forms).
"""
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.verification import FARCalculation
from app.models.landowner import Property
from app.utils.constants import BENGALURU_FAR_MIN, BENGALURU_FAR_MAX
from app.schemas.far import FARResult, FARSetbackResult
from app.services.far_rules import calculate_far_internal


class FARService:
    """Service for FAR calculations"""
    
    @staticmethod
    def calculate_far(
        plot_area_sqft: float,
        road_width_ft: float,
        zone_type: Optional[str] = None,
        use_type: str = "RESIDENTIAL",
        premium_far_opt_in: bool = False,
        premium_far_band: Optional[str] = None,
    ) -> FARResult:
        """
        Calculate FAR based on road width, zone, use type and premium FAR rules.

        This uses the helper functions in `far_rules` which encode the
        2024–2026 Bengaluru guidance (including premium FAR and indicative
        floors/coverage) in a maintainable way.

        The previous implementation returned a plain dict; to remain
        backwards compatible for existing call sites that only need
        `calculated_far` and `total_buildable_area_sqft`, those keys are
        preserved in the Pydantic model.
        """
        # Delegate to rule engine
        internal = calculate_far_internal(
            plot_area_sqft=plot_area_sqft,
            road_width_ft=road_width_ft,
            use_type=use_type,
            zone=zone_type,
            premium_far_opt_in=premium_far_opt_in,
            premium_far_band=premium_far_band,
        )

        setbacks = FARSetbackResult(
            front_setback_m=internal.front_setback_m,
            rear_setback_m=internal.rear_setback_m,
            side_setback_m=internal.side_setback_m,
            coverage_percent=internal.coverage_percent,
            plot_category=internal.plot_category,
        )

        effective_far = internal.effective_far

        return FARResult(
            base_far=internal.base_far,
            premium_far_increment=internal.premium_far_increment,
            effective_far=effective_far,
            min_far_allowed=BENGALURU_FAR_MIN,
            max_far_allowed=internal.max_far_with_premium,
            plot_area_sqft=plot_area_sqft,
            road_width_ft=road_width_ft,
            total_buildable_area_sqft=internal.total_buildable_area_sqft,
            floors_allowed=internal.floors_allowed,
            use_type=use_type,
            zone=zone_type,
            premium_far_opt_in=premium_far_opt_in,
            setbacks=setbacks,
            notes=internal.notes,
        )
    
    @staticmethod
    async def create_far_calculation(
        db: AsyncSession,
        property_id: str,
        road_width_ft: float,
        zone_type: Optional[str] = None
    ) -> FARCalculation:
        """
        Create and save FAR calculation
        """
        # Get property
        result = await db.execute(
            select(Property).where(Property.id == property_id)
        )
        property_obj = result.scalar_one_or_none()
        
        if not property_obj:
            from app.exceptions import NotFoundError
            raise NotFoundError("Property", property_id)
        
        # Calculate FAR using residential defaults for property
        plot_area = property_obj.plot_area_sqft
        far_data = FARService.calculate_far(
            plot_area,
            road_width_ft,
            zone_type,
            use_type="RESIDENTIAL",
        )
        
        # Create FAR calculation record
        far_calculation = FARCalculation(
            property_id=property_id,
            road_width_ft=road_width_ft,
            zone_type=zone_type or "Residential",
            calculated_far=far_data.effective_far,
            total_buildable_area=far_data.total_buildable_area_sqft,
        )
        
        db.add(far_calculation)
        await db.commit()
        await db.refresh(far_calculation)
        
        return far_calculation
    
    @staticmethod
    async def get_far_calculation(
        db: AsyncSession,
        property_id: str
    ) -> Optional[FARCalculation]:
        """
        Get latest FAR calculation for a property
        """
        result = await db.execute(
            select(FARCalculation)
            .where(FARCalculation.property_id == property_id)
            .order_by(FARCalculation.created_at.desc())
        )
        return result.scalar_one_or_none()
