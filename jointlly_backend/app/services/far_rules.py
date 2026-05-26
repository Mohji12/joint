"""
Centralised FAR rule helpers for Bengaluru (2024–2026 era).

These helpers are deliberately approximate and based on:
- Plot size bands (small / medium / large)
- Abutting road width
- Zoning (BBMP / BDA / RR / KIADB)
- Use type (residential / commercial / industrial)
- Optional premium FAR increments

They are intended for planning and comparison, not as a substitute
for official BBMP/BDA sanctioned plans.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Tuple

from app.utils.constants import BENGALURU_FAR_MIN, BENGALURU_FAR_MAX


@dataclass
class InternalFARComputation:
    base_far: float
    max_far_with_premium: float
    premium_far_increment: float
    effective_far: float
    total_buildable_area_sqft: float
    floors_allowed: Optional[str]
    front_setback_m: float
    rear_setback_m: float
    side_setback_m: float
    coverage_percent: float
    plot_category: str
    notes: str


def _classify_plot(plot_area_sqft: float) -> Tuple[str, float]:
    """
    Classify plot size into bands with indicative coverage.

    Rough mapping (aligned with document examples):
    - Small plots (e.g. 30x40, 40x60): ~60–65% coverage
    - Medium plots (e.g. 50x80, ~1,000–4,000 sqm): ~50–55%
    - Large plots (acre-scale / high-density): ~30–40%
    """
    sqm = plot_area_sqft / 10.7639
    if sqm <= 250:  # ~ up to 2,700 sqft
        return "SMALL", 65.0
    if sqm <= 4000:  # ~ up to 43,000 sqft
        return "MEDIUM", 52.5
    return "LARGE", 35.0


def _setbacks_for_plot(plot_area_sqft: float) -> Tuple[float, float, float, float, str]:
    """
    Derive indicative setbacks (metres) and coverage % from plot size.
    Mirrors the small/medium/large description and 15-example table.
    """
    category, coverage = _classify_plot(plot_area_sqft)
    sqm = plot_area_sqft / 10.7639

    if category == "SMALL":
        # 2026 relaxed norms for small plots
        if sqm <= 60:
            return 0.9, 0.7, 0.6, coverage, "SMALL_UP_TO_60_SQM"
        if sqm <= 150:
            return 1.2, 0.9, 0.9, coverage, "SMALL_60_150_SQM"
        return 1.5, 1.2, 1.0, coverage, "SMALL_150_250_SQM"

    if category == "MEDIUM":
        # Typical independent plots like 40x60, 50x80
        return 3.0, 2.0, 2.0, coverage, "MEDIUM_250_4000_SQM"

    # LARGE / high density / acre plots
    return 6.0, 6.0, 6.0, coverage, "LARGE_4000_SQM_PLUS"


def _base_far_for_residential(plot_area_sqft: float, road_width_ft: float) -> Tuple[float, float, str]:
    """
    Approximate base FAR for residential plots using the examples:
    - 30x40 @ 30 ft road: 1.75
    - 30x40 @ 40 ft road: 2.0
    - 40x60 @ 40 ft road: 2.25
    - 40x60 @ 50 ft road: 2.5
    - 50x80 @ 60 ft road: 2.75
    - Large plots @ 100 ft road: 3.25+
    """
    area = plot_area_sqft
    note = "RESIDENTIAL_BASE"

    if road_width_ft < 30:
        base = 1.5
    elif road_width_ft < 40:
        # 30 ft roads: typical 30x40 → 1.75
        base = 1.75
    elif road_width_ft < 50:
        # Distinguish 30x40 vs 40x60-like plots
        if area <= 1500:
            base = 2.0
        elif area <= 3000:
            base = 2.25
        else:
            base = 2.5
    elif road_width_ft < 60:
        base = 2.5
    elif road_width_ft < 100:
        base = 2.75
    else:
        base = 3.25
        note = "RESIDENTIAL_LARGE_PLOT_HIGH_ROAD"

    max_far = min(max(base + 0.6, base), BENGALURU_FAR_MAX)
    return base, max_far, note


def _base_far_for_non_residential(
    plot_area_sqft: float,
    road_width_ft: float,
    use_type: str,
    zone: Optional[str],
) -> Tuple[float, float, str]:
    """
    Commercial / industrial typically allow higher FAR, especially in KIADB zones.
    The document mentions industrial FAR up to 5.2 via KIADB.
    """
    res_base, res_max, note = _base_far_for_residential(plot_area_sqft, road_width_ft)

    if use_type == "COMMERCIAL":
        # Slight uplift vs residential
        base = res_base + 0.25
        max_far = min(res_max + 0.5, 3.75)
        return base, max_far, note + "_COMM"

    if use_type == "INDUSTRIAL":
        # Higher caps in KIADB industrial zones
        if zone == "KIADB_INDUSTRIAL":
            base = max(res_base + 0.5, 2.0)
            max_far = 5.2
            return base, max_far, "INDUSTRIAL_KIADB"
        base = res_base + 0.3
        max_far = min(4.0, 5.2)
        return base, max_far, "INDUSTRIAL_GENERAL"

    # Fallback to residential logic
    return res_base, res_max, note


def _premium_increment(
    base_far: float,
    max_far_with_premium: float,
    road_width_ft: float,
    opt_in: bool,
    band: Optional[str],
) -> float:
    """
    Premium FAR policy (2025):
    - Additional FAR: 0.2–0.6
    - Applied mainly on wider roads; charges ~50% of notional guidance value.
    """
    if not opt_in:
        return 0.0

    # Default mapping by band
    if band == "LOW":
        inc = 0.2
    elif band == "MEDIUM":
        inc = 0.4
    elif band == "HIGH":
        inc = 0.6
    else:
        # Derive from road width if band is not explicitly chosen
        if road_width_ft >= 100:
            inc = 0.6
        elif road_width_ft >= 60:
            inc = 0.5
        elif road_width_ft >= 40:
            inc = 0.4
        else:
            inc = 0.2

    # Cap by max_far_with_premium
    return max(0.0, min(inc, max_far_with_premium - base_far))


def _estimate_floors(effective_far: float, use_type: str) -> str:
    """
    Very approximate mapping from FAR to typical floor-count ranges.
    Based on examples:
    - Small plots: G+3 / G+4 typical
    - Larger plots: G+5+
    """
    if use_type == "INDUSTRIAL":
        # Industrial sheds often have large FAR but few floors.
        return "G+1 / G+2 (industrial shed)"

    if effective_far <= 1.75:
        return "G+2 / G+3"
    if effective_far <= 2.25:
        return "G+3 / G+4"
    if effective_far <= 2.75:
        return "G+4 / G+5"
    return "G+5+ (high-rise; NOC required)"


def calculate_far_internal(
    plot_area_sqft: float,
    road_width_ft: float,
    use_type: str,
    zone: Optional[str],
    premium_far_opt_in: bool,
    premium_far_band: Optional[str],
) -> InternalFARComputation:
    """
    Core FAR calculation, used by the public service function.
    """
    use_type_upper = use_type.upper()
    zone_upper = zone.upper() if zone else None

    if use_type_upper == "RESIDENTIAL":
        base_far, max_far_with_premium, note = _base_far_for_residential(
            plot_area_sqft, road_width_ft
        )
    else:
        base_far, max_far_with_premium, note = _base_far_for_non_residential(
            plot_area_sqft, road_width_ft, use_type_upper, zone_upper
        )

    base_far = max(BENGALURU_FAR_MIN, min(base_far, max_far_with_premium))

    premium_inc = _premium_increment(
        base_far,
        max_far_with_premium,
        road_width_ft,
        premium_far_opt_in,
        band=None if premium_far_band is None else premium_far_band.upper(),
    )
    effective_far = base_far + premium_inc
    effective_far = max(BENGALURU_FAR_MIN, min(effective_far, max_far_with_premium))

    total_buildable_area = plot_area_sqft * effective_far

    front_m, rear_m, side_m, coverage, plot_category = _setbacks_for_plot(
        plot_area_sqft
    )
    floors_allowed = _estimate_floors(effective_far, use_type_upper)

    return InternalFARComputation(
        base_far=base_far,
        max_far_with_premium=max_far_with_premium,
        premium_far_increment=premium_inc,
        effective_far=effective_far,
        total_buildable_area_sqft=total_buildable_area,
        floors_allowed=floors_allowed,
        front_setback_m=front_m,
        rear_setback_m=rear_m,
        side_setback_m=side_m,
        coverage_percent=coverage,
        plot_category=plot_category,
        notes=note,
    )

