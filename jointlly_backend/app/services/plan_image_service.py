"""
2D plan image generation using OpenAI GPT (prompt) + DALL·E 3 (image).

Flow: FAR params -> GPT builds a short DALL·E prompt -> DALL·E 3 generates image -> return URL.
Result is indicative only, not a sanctioned plan.
"""
from typing import Optional

from app.config import settings
from app.schemas.far import PlanImageRequest


def is_configured() -> bool:
    """Return True if OpenAI API key is set."""
    return bool(settings.openai_api_key)


def generate_plan_image(request: PlanImageRequest) -> Optional[str]:
    """
    Generate an indicative 2D plan image from FAR parameters.
    Returns the image URL, or None if not configured or on failure.
    """
    if not settings.openai_api_key:
        return None

    try:
        from openai import OpenAI
    except ImportError:
        return None

    client = OpenAI(api_key=settings.openai_api_key)

    # Build user message from FAR params
    parts = [
        f"Plot area: {request.plot_area_sqft:.0f} sq ft.",
        f"Effective FAR: {request.effective_far:.2f}.",
        f"Total buildable area: {request.total_buildable_area_sqft:.0f} sq ft.",
        f"Use type: {request.use_type}.",
    ]
    if request.floors_allowed:
        parts.append(f"Typical floors: {request.floors_allowed}.")
    if request.setbacks:
        s = request.setbacks
        parts.append(
            f"Setbacks: front {s.front_setback_m}m, rear {s.rear_setback_m}m, sides {s.side_setback_m}m. Coverage ~{s.coverage_percent}%."
        )
    if request.layout_preference:
        parts.append(f"Layout preference: {request.layout_preference}.")
    user_message = " ".join(parts)

    system_prompt = (
        "You output a single, short prompt (1-2 sentences) for DALL·E 3 to draw a 2D top-down "
        "schematic floor plan. Describe the plot boundary, building footprint, setbacks, and "
        "approximate room layout. No code, no explanation, only the prompt. Style: clean "
        "architectural schematic, bird's eye view, simple lines."
    )

    try:
        # Step 1: GPT to generate DALL·E prompt
        chat = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            max_tokens=150,
        )
        dalle_prompt = (chat.choices[0].message.content or "").strip()
        if not dalle_prompt:
            return None

        # Step 2: DALL·E 3 to generate image
        image_resp = client.images.generate(
            model="dall-e-3",
            prompt=dalle_prompt,
            size="1024x1024",
            quality="standard",
            response_format="url",
            n=1,
        )
        if not image_resp.data or not image_resp.data[0].url:
            return None
        return image_resp.data[0].url
    except Exception:
        return None
