"""
Marketplace router: public builder and project listings (no direct contact details).
"""
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_authenticated, require_landowner_entry_paid
from app.models.user import User
from app.schemas.professional import BuilderMarketplaceCard
from app.schemas.landowner import ProjectMarketplaceCard
from app.schemas.forms import BuilderPortfolioLatestResponse
from app.services.marketplace_service import MarketplaceService
from app.utils.constants import CapabilityType, ProjectType, ProjectIntent


router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/builders", response_model=List[BuilderMarketplaceCard])
async def list_builders_marketplace(
    professional_ids: Optional[List[UUID]] = Query(
        default=None,
        description="Return cards for these professional profile IDs (ignores city/pagination; max 40).",
    ),
    city: Optional[str] = Query(default=None, description="Filter by builder city/area"),
    capability_types: Optional[List[CapabilityType]] = Query(
        default=None,
        description="Match builders with any of these capabilities (repeat param, e.g. ?capability_types=JV_JD&capability_types=INTERIOR)",
    ),
    capability_type: Optional[CapabilityType] = Query(
        default=None, description="Filter by a single builder capability type (ignored if capability_types is set)"
    ),
    intent: Optional[ProjectIntent] = Query(
        default=None, description="Preferred landowner intent (RESIDENTIAL/COMMERCIAL/INDUSTRIAL)"
    ),
    pricing_tier: Optional[str] = Query(
        default=None, description="Pricing tier label (e.g. BASIC, STANDARD, LUXURY)"
    ),
    rera_only: bool = Query(
        default=False, description="Only include builders with RERA experience"
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_landowner_entry_paid),
    db: AsyncSession = Depends(get_db),
):
    """
    Builder marketplace listing.
    Returns public builder cards without direct contact information.
    """
    if professional_ids:
        return await MarketplaceService.list_builders_by_ids(db, professional_ids)

    cap_filter: Optional[List[CapabilityType]] = None
    if capability_types:
        cap_filter = list(capability_types)
    elif capability_type is not None:
        cap_filter = [capability_type]

    return await MarketplaceService.list_builders(
        db,
        city=city,
        capability_types_filter=cap_filter,
        intent=intent,
        pricing_tier=pricing_tier,
        rera_only=rera_only,
        page=page,
        page_size=page_size,
    )


@router.get("/builders/{professional_id}/portfolio", response_model=BuilderPortfolioLatestResponse)
async def get_builder_marketplace_portfolio(
    professional_id: UUID,
    current_user: User = Depends(require_landowner_entry_paid),
    db: AsyncSession = Depends(get_db),
):
    """Full builder portfolio payload (latest submission per builder form type)."""
    _ = current_user
    return await MarketplaceService.get_builder_portfolio(db, professional_id=professional_id)


@router.get("/projects", response_model=List[ProjectMarketplaceCard])
async def list_projects_marketplace(
    city: Optional[str] = Query(default=None, description="Filter by project city"),
    project_type: Optional[ProjectType] = Query(
        default=None, description="Project type (CONTRACT_CONSTRUCTION/JV_JD/INTERIOR/RECONSTRUCTION)"
    ),
    intent: Optional[ProjectIntent] = Query(
        default=None, description="Project intent (RESIDENTIAL/COMMERCIAL/INDUSTRIAL)"
    ),
    asset_class: Optional[str] = Query(default=None, description="Asset class string"),
    budget_tier: Optional[str] = Query(default=None, description="Budget tier string"),
    min_bua: Optional[float] = Query(
        default=None, ge=0, description="Minimum total buildable area (sqft)"
    ),
    max_bua: Optional[float] = Query(
        default=None, ge=0, description="Maximum total buildable area (sqft)"
    ),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(require_authenticated),
    db: AsyncSession = Depends(get_db),
):
    """
    Project marketplace listing.
    Returns public project cards without landowner identity or contact details.
    """
    return await MarketplaceService.list_projects(
        db,
        city=city,
        project_type=project_type,
        intent=intent,
        asset_class=asset_class,
        budget_tier=budget_tier,
        min_bua=min_bua,
        max_bua=max_bua,
        page=page,
        page_size=page_size,
    )

