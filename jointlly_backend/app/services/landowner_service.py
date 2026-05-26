"""
Landowner service
"""
from uuid import UUID
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.landowner import LandownerProfile, Property, Project, JVPreferences
from app.models.user import User
from app.utils.constants import ProjectType, ProjectStatus, JVPostConstructionExpectation
from app.exceptions import NotFoundError, ConflictError


class LandownerService:
    """Service for landowner operations"""
    
    @staticmethod
    async def create_profile(
        db: AsyncSession,
        user_id: UUID,
        name: str,
        phone: Optional[str] = None,
        city: Optional[str] = None
    ) -> LandownerProfile:
        """Create landowner profile"""
        # Check if profile already exists
        result = await db.execute(
            select(LandownerProfile).where(LandownerProfile.user_id == user_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise ConflictError("Landowner profile already exists")
        
        profile = LandownerProfile(
            user_id=user_id,
            name=name,
            phone=phone,
            city=city
        )
        
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        
        return profile
    
    @staticmethod
    async def get_profile(
        db: AsyncSession,
        user_id: UUID
    ) -> LandownerProfile:
        """Get landowner profile"""
        result = await db.execute(
            select(LandownerProfile).where(LandownerProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            raise NotFoundError("LandownerProfile", str(user_id))
        
        return profile
    
    @staticmethod
    async def update_profile(
        db: AsyncSession,
        user_id: UUID,
        name: Optional[str] = None,
        phone: Optional[str] = None,
        city: Optional[str] = None
    ) -> LandownerProfile:
        """Update landowner profile"""
        profile = await LandownerService.get_profile(db, user_id)
        
        if name is not None:
            profile.name = name
        if phone is not None:
            profile.phone = phone
        if city is not None:
            profile.city = city
        
        await db.commit()
        await db.refresh(profile)
        
        return profile
    
    @staticmethod
    async def create_property(
        db: AsyncSession,
        landowner_id: UUID,
        city: str,
        name: Optional[str] = None,
        ward: Optional[str] = None,
        landmark: Optional[str] = None,
        google_maps_pin: Optional[str] = None,
        width_ft: Optional[float] = None,
        length_ft: Optional[float] = None,
        facing: Optional[str] = None,
        is_corner_plot: bool = False,
        facings: Optional[List[str]] = None,
        road_width_ft: Optional[float] = None,
        khatha_type: Optional[str] = None,
        e_khatha_status: Optional[str] = None,
        tax_paid: bool = False,
        pid_number: Optional[str] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None
    ) -> Property:
        """Create property"""
        property_obj = Property(
            landowner_id=landowner_id,
            name=name,
            city=city,
            ward=ward,
            landmark=landmark,
            google_maps_pin=google_maps_pin,
            width_ft=width_ft,
            length_ft=length_ft,
            facing=facing,
            is_corner_plot=is_corner_plot,
            facings=facings,
            road_width_ft=road_width_ft,
            khatha_type=khatha_type,
            e_khatha_status=e_khatha_status,
            tax_paid=tax_paid,
            pid_number=pid_number,
            latitude=latitude,
            longitude=longitude
        )
        
        db.add(property_obj)
        await db.commit()
        await db.refresh(property_obj)
        
        return property_obj
    
    @staticmethod
    async def get_property(
        db: AsyncSession,
        property_id: UUID,
        landowner_id: Optional[UUID] = None
    ) -> Property:
        """Get property"""
        query = select(Property).where(Property.id == property_id)
        if landowner_id:
            query = query.where(Property.landowner_id == landowner_id)
        
        result = await db.execute(query)
        property_obj = result.scalar_one_or_none()
        
        if not property_obj:
            raise NotFoundError("Property", str(property_id))
        
        return property_obj
    
    @staticmethod
    async def list_properties(
        db: AsyncSession,
        landowner_id: UUID
    ) -> List[Property]:
        """List all properties for a landowner"""
        result = await db.execute(
            select(Property).where(Property.landowner_id == landowner_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def create_project(
        db: AsyncSession,
        property_id: UUID,
        project_type: ProjectType,
        intent: Optional[str] = None,
        timeline: Optional[str] = None,
        scope: Optional[str] = None,
        asset_class: Optional[str] = None,
        budget_tier: Optional[str] = None,
    ) -> Project:
        """Create project"""
        # Validate property exists
        await LandownerService.get_property(db, property_id)

        project = Project(
            property_id=property_id,
            project_type=project_type,
            intent=intent,
            timeline=timeline,
            scope=scope,
            asset_class=asset_class,
            budget_tier=budget_tier,
            status=ProjectStatus.DRAFT
        )
        
        db.add(project)
        await db.commit()
        await db.refresh(project)
        
        return project
    
    @staticmethod
    async def list_projects(
        db: AsyncSession,
        landowner_id: UUID
    ) -> List[Project]:
        """List all projects for a landowner (via their properties)."""
        result = await db.execute(
            select(Project)
            .join(Property, Project.property_id == Property.id)
            .where(Property.landowner_id == landowner_id)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_project(
        db: AsyncSession,
        project_id: UUID,
        landowner_id: Optional[UUID] = None
    ) -> Project:
        """Get project"""
        query = select(Project).where(Project.id == project_id)
        if landowner_id:
            query = query.join(Property).where(Property.landowner_id == landowner_id)
        
        result = await db.execute(query)
        project = result.scalar_one_or_none()
        
        if not project:
            raise NotFoundError("Project", str(project_id))
        
        return project
    
    @staticmethod
    async def publish_project(
        db: AsyncSession,
        project_id: UUID,
        landowner_id: UUID
    ) -> Project:
        """Publish project (triggers matching)"""
        project = await LandownerService.get_project(db, project_id, landowner_id)
        
        project.status = ProjectStatus.PUBLISHED
        await db.commit()
        await db.refresh(project)
        
        # Trigger matching (will be called from router)
        return project
    
    @staticmethod
    async def create_jv_preferences(
        db: AsyncSession,
        project_id: UUID,
        post_construction_expectation: Optional[JVPostConstructionExpectation] = None,
        development_vision: Optional[str] = None
    ) -> JVPreferences:
        """Create or update JV preferences"""
        # Check if preferences exist
        result = await db.execute(
            select(JVPreferences).where(JVPreferences.project_id == project_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            if post_construction_expectation is not None:
                existing.post_construction_expectation = post_construction_expectation
            if development_vision is not None:
                existing.development_vision = development_vision
            await db.commit()
            await db.refresh(existing)
            return existing
        
        preferences = JVPreferences(
            project_id=project_id,
            post_construction_expectation=post_construction_expectation,
            development_vision=development_vision
        )
        
        db.add(preferences)
        await db.commit()
        await db.refresh(preferences)
        
        return preferences
