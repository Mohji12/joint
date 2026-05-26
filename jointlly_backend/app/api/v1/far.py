"""
Generic FAR calculation endpoints.

These are used by forms to calculate:
- Base FAR
- Premium FAR increment (if opted in)
- Effective FAR
- Total buildable area
- Indicative floors and setbacks
- Optional: generate indicative 2D plan image (OpenAI GPT + DALL·E)
"""
from fastapi import APIRouter, HTTPException, status

from app.schemas.far import FARRuleInput, FARResult, FARSetbackResult, PlanImageRequest, PlanImageResponse
from app.services.far_service import FARService
from app.services.plan_image_service import generate_plan_image, is_configured as plan_image_configured


router = APIRouter(prefix="/far", tags=["FAR"])


@router.post("/calculate", response_model=FARResult)
async def calculate_far(body: FARRuleInput) -> FARResult:
    """
    Calculate FAR and total buildable area for a given plot.

    This endpoint does not persist anything; it is purely a rule engine
    used by frontend forms. The calling code can choose to embed the
    returned result inside stored form submissions if needed.
    """
    # Derive plot area if not provided explicitly
    plot_area_sqft = body.plot_area_sqft
    if not plot_area_sqft and body.plot_length_ft and body.plot_width_ft:
        plot_area_sqft = body.plot_length_ft * body.plot_width_ft

    if not plot_area_sqft:
        from app.exceptions import ValidationError

        raise ValidationError("plot_area_sqft", "Plot area is required (provide area or length and width).")

    # Delegate to service
    result = FARService.calculate_far(
        plot_area_sqft=plot_area_sqft,
        road_width_ft=body.road_width_ft,
        zone_type=body.zone,
        use_type=body.use_type,
        premium_far_opt_in=body.premium_far_opt_in,
        premium_far_band=body.premium_far_band,
    )
    return result


@router.post("/generate-plan-image", response_model=PlanImageResponse)
async def generate_plan_image_endpoint(body: PlanImageRequest) -> PlanImageResponse:
    """
    Generate an indicative 2D plan image from FAR result using OpenAI GPT + DALL·E 3.
    Result is for visualization only, not a sanctioned plan.
    """
    if not plan_image_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Plan preview is not configured (OpenAI API key not set).",
        )
    image_url = generate_plan_image(body)
    if not image_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to generate plan image. Please try again.",
        )
    return PlanImageResponse(image_url=image_url)

