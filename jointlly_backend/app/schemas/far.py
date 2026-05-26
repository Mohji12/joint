"""
FAR (Floor Area Ratio) calculation schemas.

These are intentionally generic so the same endpoint can be used
across different forms (contract construction, JV/JD, etc.).
"""
from typing import Optional, Literal
from pydantic import BaseModel, Field, ConfigDict


class FARRuleInput(BaseModel):
    """
    Input required to calculate FAR and total buildable area.

    Notes:
    - If `plot_area_sqft` is not provided, it will be derived from
      `plot_length_ft * plot_width_ft` when both are present.
    - Zone and use_type are kept as simple strings/enums so the caller
      can map UI labels to these values.
    """

    plot_length_ft: Optional[float] = Field(
        default=None,
        gt=0,
        description="Plot length in feet (optional if plot_area_sqft is provided).",
    )
    plot_width_ft: Optional[float] = Field(
        default=None,
        gt=0,
        description="Plot width in feet (optional if plot_area_sqft is provided).",
    )
    plot_area_sqft: Optional[float] = Field(
        default=None,
        gt=0,
        description="Total plot area in square feet. If omitted, derived from length * width.",
    )
    road_width_ft: float = Field(
        ...,
        gt=0,
        description="Width of abutting road in feet.",
    )

    zone: Optional[
        Literal[
            "EAST_BBMP",
            "WEST_BBMP",
            "NORTH_BBMP",
            "SOUTH_BBMP",
            "BDA_RR",
            "HIGH_DENSITY_RESIDENTIAL",
            "COMMERCIAL_RESIDENTIAL",
            "KIADB_INDUSTRIAL",
        ]
    ] = Field(
        default=None,
        description="Zoning classification; used for minor adjustments and notes.",
    )

    use_type: Literal["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"] = Field(
        ...,
        description="Primary use type of proposed development.",
    )

    premium_far_opt_in: bool = Field(
        default=False,
        description="Whether premium FAR (paid additional FAR) is opted in.",
    )
    premium_far_band: Optional[
        Literal["LOW", "MEDIUM", "HIGH"]
    ] = Field(
        default=None,
        description="Optional premium FAR band; LOW/MEDIUM/HIGH maps to 0.2–0.6 additional FAR.",
    )

    rules_year: int = Field(
        default=2026,
        description="Regulation year/version used to interpret FAR rules.",
    )

    model_config = ConfigDict(strict=True)


class FARSetbackResult(BaseModel):
    """Recommended setbacks and site coverage, derived from plot size."""

    front_setback_m: float
    rear_setback_m: float
    side_setback_m: float
    coverage_percent: float
    plot_category: str

    model_config = ConfigDict(strict=True)


class FARResult(BaseModel):
    """
    Result of a FAR calculation for a given plot.

    This is designed for both backend storage and frontend display.
    """

    base_far: float
    premium_far_increment: float
    effective_far: float
    min_far_allowed: float
    max_far_allowed: float

    plot_area_sqft: float
    road_width_ft: float

    total_buildable_area_sqft: float
    floors_allowed: Optional[str] = None

    use_type: str
    zone: Optional[str] = None
    premium_far_opt_in: bool

    setbacks: Optional[FARSetbackResult] = None
    rules_version: str = Field(
        default="BLR_2026_v1",
        description="Internal version tag for FAR rules so we can evolve them safely.",
    )
    notes: Optional[str] = None

    model_config = ConfigDict(strict=True)


class PlanImageSetbacks(BaseModel):
    """Setbacks (metres) and coverage for plan image prompt."""

    front_setback_m: float
    rear_setback_m: float
    side_setback_m: float
    coverage_percent: float

    model_config = ConfigDict(strict=True)


class PlanImageRequest(BaseModel):
    """Input for generating an indicative 2D plan image from FAR result."""

    plot_area_sqft: float = Field(..., gt=0, description="Plot area in square feet.")
    effective_far: float = Field(..., ge=0, description="Effective FAR.")
    total_buildable_area_sqft: float = Field(
        ...,
        ge=0,
        description="Total buildable area in square feet.",
    )
    floors_allowed: Optional[str] = Field(
        default=None,
        description="Indicative floor count (e.g. G+3, G+4).",
    )
    use_type: Literal["RESIDENTIAL", "COMMERCIAL", "INDUSTRIAL"] = Field(
        ...,
        description="Primary use type.",
    )
    setbacks: Optional[PlanImageSetbacks] = Field(
        default=None,
        description="Setbacks and coverage for the prompt.",
    )
    layout_preference: Optional[str] = Field(
        default=None,
        max_length=500,
        description="Optional short preference (e.g. 3BHK, 2BHK with study).",
    )

    model_config = ConfigDict(strict=True)


class PlanImageResponse(BaseModel):
    """Response containing the generated plan image URL."""

    image_url: str = Field(..., description="URL of the generated 2D plan image (may expire).")

    model_config = ConfigDict(strict=True)

