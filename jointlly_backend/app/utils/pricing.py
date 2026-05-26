"""
Central pricing rules for gatekeeper and success fees.

This module is read-only configuration. All numeric values and splits
live here so that business rules are easy to inspect and adjust.
"""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict, List, Tuple


class PricingCategory(str, Enum):
    """
    High-level pricing categories.

    These are business-facing buckets, not DB models. They are used by the
    pricing service to decide which fees apply for a given flow.
    """

    LANDOWNER_ENTRY = "LANDOWNER_ENTRY"
    INTERIORS = "INTERIORS"
    RECONSTRUCTION = "RECONSTRUCTION"
    CONSTRUCTION = "CONSTRUCTION"
    JOINT_DEVELOPMENT = "JOINT_DEVELOPMENT"


@dataclass(frozen=True)
class GatekeeperFeeRule:
    """
    Gatekeeper (entry) fee configuration for a pricing category.

    Fees can be fixed or specified as a min/max range; tiering logic is
    handled separately by the pricing service based on deal value.
    """

    payer_role: str  # "LANDOWNER" or "PROFESSIONAL"
    min_fee: float
    max_fee: float


@dataclass(frozen=True)
class SuccessFeeRule:
    """
    Success fee configuration for a pricing category.

    Percentages are in real percent units (e.g. 0.5 means 0.5%).
    """

    enabled: bool
    min_percent: float
    max_percent: float
    # Split between builder and landowner, must sum to 1.0
    builder_share: float
    landowner_share: float


#: Gatekeeper fee rules per category (amounts in INR).
GATEKEEPER_RULES: Dict[PricingCategory, GatekeeperFeeRule] = {
    # Landowner pays a nominal entry fee once.
    PricingCategory.LANDOWNER_ENTRY: GatekeeperFeeRule(
        payer_role="LANDOWNER",
        min_fee=99.0,
        max_fee=99.0,
    ),
    # Builder-side categories.
    PricingCategory.INTERIORS: GatekeeperFeeRule(
        payer_role="PROFESSIONAL",
        min_fee=1499.0,
        max_fee=3999.0,
    ),
    PricingCategory.RECONSTRUCTION: GatekeeperFeeRule(
        payer_role="PROFESSIONAL",
        min_fee=1999.0,
        max_fee=3999.0,
    ),
    PricingCategory.CONSTRUCTION: GatekeeperFeeRule(
        payer_role="PROFESSIONAL",
        min_fee=3999.0,
        max_fee=3999.0,
    ),
    PricingCategory.JOINT_DEVELOPMENT: GatekeeperFeeRule(
        payer_role="PROFESSIONAL",
        min_fee=5999.0,
        max_fee=9999.0,
    ),
}


#: Success fee rules for categories where it applies.
SUCCESS_FEE_RULES: Dict[PricingCategory, SuccessFeeRule] = {
    PricingCategory.CONSTRUCTION: SuccessFeeRule(
        enabled=True,
        min_percent=0.5,
        max_percent=0.75,
        builder_share=0.70,
        landowner_share=0.30,
    ),
    PricingCategory.JOINT_DEVELOPMENT: SuccessFeeRule(
        enabled=True,
        min_percent=0.5,
        max_percent=0.75,
        builder_share=0.70,
        landowner_share=0.30,
    ),
}


# ---- Tiering configuration -------------------------------------------------

# Gatekeeper tiers: (upper_bound_inclusive_deal_value, fraction_of_range)
#
# fraction_of_range is between 0 and 1, representing where within [min, max]
# the effective fee should be picked.
#
# Example: range 1,499–3,999 and fraction 0.0 => 1,499
#          range 1,499–3,999 and fraction 0.5 => mid-point
#          range 1,499–3,999 and fraction 1.0 => 3,999
GATEKEEPER_TIERS: List[Tuple[float, float]] = [
    # Small deals: use lower bound.
    (50_00_000.0, 0.0),  # < ₹50L
    # Medium deals: mid-point in the range.
    (2_00_00_000.0, 0.5),  # ₹50L–₹2Cr
    # Large deals: upper bound.
    (float("inf"), 1.0),  # > ₹2Cr
]


# Success fee tiers: (upper_bound_inclusive_deal_value, percent_value)
#
# Percent values are in real percent units (0.5 means 0.5%).
SUCCESS_FEE_TIERS: List[Tuple[float, float]] = [
    (1_00_00_000.0, 0.5),   # < ₹1Cr
    (5_00_00_000.0, 0.6),   # ₹1Cr–₹5Cr
    (float("inf"), 0.75),   # > ₹5Cr
]

# Builder connect (contact unlock) fee by match score percent.
# Rule: <50% => 3999, 50-74% => 2999, >=75% => 1999
BUILDER_CONNECT_FEE_TIERS: List[Tuple[float, float]] = [
    (49.9999, 3999.0),
    (74.9999, 2999.0),
    (100.0, 1999.0),
]


def pick_gatekeeper_fraction(deal_value: float) -> float:
    """
    Pick a fraction in [0, 1] within the min/max gatekeeper range based
    on the deal value and configured tiers.
    """
    for upper, fraction in GATEKEEPER_TIERS:
        if deal_value <= upper:
            return fraction
    # Fallback, should not happen because of inf
    return 1.0


def pick_success_percent(deal_value: float) -> float:
    """
    Pick a concrete success fee percent for a given deal value based on
    SUCCESS_FEE_TIERS.
    """
    for upper, percent in SUCCESS_FEE_TIERS:
        if deal_value <= upper:
            return percent
    # Fallback, should not happen because of inf
    return SUCCESS_FEE_TIERS[-1][1]


def normalize_match_score_percent(score: float) -> float:
    """
    Normalize score into percent range [0, 100].
    Supports both fractional scores (0..1) and direct percent values (0..100).
    """
    raw = float(score or 0.0)
    if raw <= 1.0:
        raw *= 100.0
    return max(0.0, min(100.0, raw))


def pick_builder_connect_fee(match_score: float) -> float:
    """
    Pick builder connect fee based on match score percentage.
    """
    pct = normalize_match_score_percent(match_score)
    for upper, fee in BUILDER_CONNECT_FEE_TIERS:
        if pct <= upper:
            return fee
    return BUILDER_CONNECT_FEE_TIERS[-1][1]

