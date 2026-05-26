"""
Landowner router
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.dependencies import require_landowner, require_landowner_entry_paid
from app.models.user import User
from app.schemas.landowner import (
    LandownerProfileCreate,
    LandownerProfileUpdate,
    LandownerProfileResponse,
    PropertyCreate,
    PropertyResponse,
    ProjectCreate,
    ProjectResponse,
    JVPreferencesCreate,
    JVPreferencesResponse
)
from app.services.landowner_service import LandownerService
from app.exceptions import NotFoundError

router = APIRouter(prefix="/landowners", tags=["Landowners"])


@router.post("/profile", response_model=LandownerProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_profile(
    profile_data: LandownerProfileCreate,
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db)
):
    """Create landowner profile"""
    profile = await LandownerService.create_profile(
        db,
        current_user.id,
        profile_data.name,
        profile_data.phone,
        profile_data.city
    )
    return profile


@router.get("/profile", response_model=LandownerProfileResponse)
async def get_profile(
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db)
):
    """Get landowner profile"""
    profile = await LandownerService.get_profile(db, current_user.id)
    return profile


@router.put("/profile", response_model=LandownerProfileResponse)
async def update_profile(
    profile_data: LandownerProfileUpdate,
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db)
):
    """Update landowner profile"""
    profile = await LandownerService.update_profile(
        db,
        current_user.id,
        name=profile_data.name,
        phone=profile_data.phone,
        city=profile_data.city
    )
    return profile


@router.post("/properties", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreate,
    current_user: User = Depends(require_landowner_entry_paid),
    db: AsyncSession = Depends(get_db)
):
    """Create property"""
    # Get landowner profile
    profile = await LandownerService.get_profile(db, current_user.id)
    
    property_obj = await LandownerService.create_property(
        db,
        profile.id,
        **property_data.model_dump()
    )
    return property_obj


@router.get("/properties", response_model=List[PropertyResponse])
async def list_properties(
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db)
):
    """List all properties"""
    try:
        profile = await LandownerService.get_profile(db, current_user.id)
    except NotFoundError:
        # New landowners may not have created profile yet.
        return []
    properties = await LandownerService.list_properties(db, profile.id)
    return properties


@router.get("/properties/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: UUID,
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db)
):
    """Get property"""
    profile = await LandownerService.get_profile(db, current_user.id)
    property_obj = await LandownerService.get_property(db, property_id, profile.id)
    return property_obj


@router.get("/projects", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db)
):
    """List all projects for the current landowner"""
    try:
        profile = await LandownerService.get_profile(db, current_user.id)
    except NotFoundError:
        # New landowners may not have created profile yet.
        return []
    projects = await LandownerService.list_projects(db, profile.id)
    return projects


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_landowner_entry_paid),
    db: AsyncSession = Depends(get_db)
):
    """Create project"""
    # Verify property ownership
    profile = await LandownerService.get_profile(db, current_user.id)
    await LandownerService.get_property(db, project_data.property_id, profile.id)
    
    project = await LandownerService.create_project(
        db,
        project_data.property_id,
        project_data.project_type,
        project_data.intent,
        project_data.timeline,
        project_data.scope,
        asset_class=project_data.asset_class,
        budget_tier=project_data.budget_tier,
    )
    return project


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db)
):
    """Get project"""
    profile = await LandownerService.get_profile(db, current_user.id)
    project = await LandownerService.get_project(db, project_id, profile.id)
    return project


@router.post("/projects/{project_id}/publish", response_model=ProjectResponse)
async def publish_project(
    project_id: UUID,
    current_user: User = Depends(require_landowner_entry_paid),
    db: AsyncSession = Depends(get_db)
):
    """Publish project (triggers matching)"""
    profile = await LandownerService.get_profile(db, current_user.id)
    project = await LandownerService.publish_project(db, project_id, profile.id)
    
    # Trigger matching
    from app.services.matching_service import MatchingService
    await MatchingService.match_project_to_professionals(db, project_id)
    
    return project


@router.post("/projects/{project_id}/jv-preferences", response_model=JVPreferencesResponse, status_code=status.HTTP_201_CREATED)
async def create_jv_preferences(
    project_id: UUID,
    preferences_data: JVPreferencesCreate,
    current_user: User = Depends(require_landowner_entry_paid),
    db: AsyncSession = Depends(get_db)
):
    """Create or update JV preferences"""
    profile = await LandownerService.get_profile(db, current_user.id)
    # Verify project ownership
    await LandownerService.get_project(db, project_id, profile.id)
    
    preferences = await LandownerService.create_jv_preferences(
        db,
        project_id,
        preferences_data.post_construction_expectation,
        preferences_data.development_vision
    )
    return preferences
