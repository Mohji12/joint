"""
Professional service
"""
from uuid import UUID
from typing import List, Optional
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.professional import (
    ProfessionalProfile,
    Capability,
    License,
    Portfolio,
    PricingTier,
    LocationPreference,
    SubcontractorScope,
    ProjectSizeCategory as ProjectSizeCategoryModel,
    ProfessionalPricing,
    JVJDPreferences,
    ReconstructionWorkType as ReconstructionWorkTypeModel
)
from app.utils.constants import (
    CapabilityType, ProjectType, ProjectIntent, TeamStructure,
    TeamSizeCategory, ProjectSizeCategory as ProjectSizeCategoryEnum, WalletSizeRange,
    PricingTierType, JVModelType, ReconstructionWorkType as ReconstructionWorkTypeEnum,
    SubcontractorScopeType, OnboardingStatus, BusinessEntityType
)
from app.exceptions import AppException, NotFoundError, ConflictError, ValidationError
from fastapi import status
from app.services.credibility_service import CredibilityService


class ProfessionalService:
    """Service for professional operations"""
    
    @staticmethod
    async def create_profile(
        db: AsyncSession,
        user_id: UUID,
        company_name: str,
        phone: Optional[str] = None,
        city: Optional[str] = None,
        experience_years: Optional[int] = None,
        rera_experience: bool = False,
        wallet_size: Optional[float] = None,
        preferred_jv_model: Optional[str] = None,
        location_preferences: Optional[List[str]] = None,
        workforce_capacity: Optional[int] = None
    ) -> ProfessionalProfile:
        """Create professional profile"""
        # Check if profile already exists
        result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.user_id == user_id)
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            raise ConflictError("Professional profile already exists")
        
        profile = ProfessionalProfile(
            user_id=user_id,
            company_name=company_name,
            phone=phone,
            city=city,
            experience_years=experience_years,
            rera_experience=rera_experience,
            wallet_size=wallet_size,
            preferred_jv_model=preferred_jv_model,
            location_preferences=location_preferences,
            workforce_capacity=workforce_capacity
        )
        
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        
        return profile
    
    @staticmethod
    async def get_profile(
        db: AsyncSession,
        user_id: UUID
    ) -> ProfessionalProfile:
        """Get professional profile"""
        result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.user_id == user_id)
        )
        profile = result.scalar_one_or_none()
        
        if not profile:
            raise AppException(
                "No professional profile found for this account. Submit a builder profile (contract, JV, interior, or renovation) to continue.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        
        return profile
    
    @staticmethod
    async def update_profile(
        db: AsyncSession,
        user_id: UUID,
        **kwargs
    ) -> ProfessionalProfile:
        """Update professional profile"""
        profile = await ProfessionalService.get_profile(db, user_id)
        
        for key, value in kwargs.items():
            if hasattr(profile, key) and value is not None:
                setattr(profile, key, value)
        
        await db.commit()
        await db.refresh(profile)
        
        return profile
    
    @staticmethod
    async def add_capability(
        db: AsyncSession,
        professional_id: UUID,
        capability_type: CapabilityType,
        description: Optional[str] = None
    ) -> Capability:
        """Add capability"""
        capability = Capability(
            professional_id=professional_id,
            capability_type=capability_type,
            description=description
        )
        
        db.add(capability)
        await db.commit()
        await db.refresh(capability)
        
        return capability
    
    @staticmethod
    async def list_capabilities(
        db: AsyncSession,
        professional_id: UUID
    ) -> List[Capability]:
        """List all capabilities"""
        result = await db.execute(
            select(Capability).where(Capability.professional_id == professional_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def add_license(
        db: AsyncSession,
        professional_id: UUID,
        license_number: str,
        issuing_authority: Optional[str] = None,
        expiry_date: Optional[date] = None,
        document_url: Optional[str] = None
    ) -> License:
        """Add license"""
        license_obj = License(
            professional_id=professional_id,
            license_number=license_number,
            issuing_authority=issuing_authority,
            expiry_date=expiry_date,
            document_url=document_url
        )
        
        db.add(license_obj)
        await db.commit()
        await db.refresh(license_obj)
        
        return license_obj
    
    @staticmethod
    async def list_licenses(
        db: AsyncSession,
        professional_id: UUID
    ) -> List[License]:
        """List all licenses"""
        result = await db.execute(
            select(License).where(License.professional_id == professional_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def add_portfolio_item(
        db: AsyncSession,
        professional_id: UUID,
        project_name: str,
        project_type: Optional[ProjectType] = None,
        location: Optional[str] = None,
        area_sqft: Optional[float] = None,
        completion_date: Optional[date] = None,
        images: Optional[List[str]] = None,
        description: Optional[str] = None
    ) -> Portfolio:
        """Add portfolio item"""
        portfolio = Portfolio(
            professional_id=professional_id,
            project_name=project_name,
            project_type=project_type,
            location=location,
            area_sqft=area_sqft,
            completion_date=completion_date,
            images=images,
            description=description
        )
        
        db.add(portfolio)
        await db.commit()
        await db.refresh(portfolio)
        
        return portfolio
    
    @staticmethod
    async def list_portfolio(
        db: AsyncSession,
        professional_id: UUID
    ) -> List[Portfolio]:
        """List all portfolio items"""
        result = await db.execute(
            select(Portfolio).where(Portfolio.professional_id == professional_id)
        )
        return list(result.scalars().all())
    
    @staticmethod
    async def add_pricing_tier(
        db: AsyncSession,
        professional_id: UUID,
        capability_type: CapabilityType,
        price_per_sqft: float,
        min_area_sqft: Optional[float] = None,
        max_area_sqft: Optional[float] = None,
        tier_name: Optional[str] = None
    ) -> PricingTier:
        """Add pricing tier"""
        pricing_tier = PricingTier(
            professional_id=professional_id,
            capability_type=capability_type,
            price_per_sqft=price_per_sqft,
            min_area_sqft=min_area_sqft,
            max_area_sqft=max_area_sqft,
            tier_name=tier_name
        )
        
        db.add(pricing_tier)
        await db.commit()
        await db.refresh(pricing_tier)
        
        return pricing_tier
    
    @staticmethod
    async def list_pricing_tiers(
        db: AsyncSession,
        professional_id: UUID
    ) -> List[PricingTier]:
        """List all pricing tiers"""
        result = await db.execute(
            select(PricingTier).where(PricingTier.professional_id == professional_id)
        )
        return list(result.scalars().all())
    
    # ==================== Onboarding Methods ====================
    
    @staticmethod
    async def start_onboarding(
        db: AsyncSession,
        user_id: UUID,
        capability_type: CapabilityType
    ) -> ProfessionalProfile:
        """Start onboarding for a capability type"""
        profile = await ProfessionalService.get_profile(db, user_id)
        
        # Add capability if not exists
        capabilities = await ProfessionalService.list_capabilities(db, profile.id)
        has_capability = any(c.capability_type == capability_type for c in capabilities)
        
        if not has_capability:
            await ProfessionalService.add_capability(db, profile.id, capability_type)
        
        # Reset onboarding if needed
        profile.onboarding_status = OnboardingStatus.IN_PROGRESS
        profile.onboarding_step = 1
        
        await db.commit()
        await db.refresh(profile)
        
        return profile
    
    @staticmethod
    async def get_onboarding_status(
        db: AsyncSession,
        user_id: UUID,
        capability_type: CapabilityType
    ) -> dict:
        """Get onboarding status for a capability type"""
        profile = await ProfessionalService.get_profile(db, user_id)
        
        # Determine total steps based on capability type
        total_steps = {
            CapabilityType.CONSTRUCTION: 7,
            CapabilityType.JV_JD: 8,
            CapabilityType.INTERIOR: 5,
            CapabilityType.RECONSTRUCTION: 6,
        }.get(capability_type, 5)
        
        return {
            "capability_type": capability_type.value,
            "current_step": profile.onboarding_step or 1,
            "total_steps": total_steps,
            "onboarding_status": profile.onboarding_status.value,
            "completed_steps": [],
            "missing_fields": []
        }
    
    @staticmethod
    async def complete_onboarding_step(
        db: AsyncSession,
        user_id: UUID,
        capability_type: CapabilityType,
        step_number: int,
        step_data: dict
    ) -> dict:
        """Complete a specific onboarding step"""
        profile = await ProfessionalService.get_profile(db, user_id)
        
        # Process step data based on capability type and step number
        if capability_type == CapabilityType.CONSTRUCTION:
            await ProfessionalService._process_construction_step(
                db, profile.id, step_number, step_data
            )
        elif capability_type == CapabilityType.JV_JD:
            await ProfessionalService._process_jvjd_step(
                db, profile.id, step_number, step_data
            )
        elif capability_type == CapabilityType.INTERIOR:
            await ProfessionalService._process_interior_step(
                db, profile.id, step_number, step_data
            )
        elif capability_type == CapabilityType.RECONSTRUCTION:
            await ProfessionalService._process_reconstruction_step(
                db, profile.id, step_number, step_data
            )
        
        # Update step number
        total_steps = {
            CapabilityType.CONSTRUCTION: 7,
            CapabilityType.JV_JD: 8,
            CapabilityType.INTERIOR: 5,
            CapabilityType.RECONSTRUCTION: 6,
        }.get(capability_type, 5)
        
        if step_number < total_steps:
            profile.onboarding_step = step_number + 1
        else:
            profile.onboarding_step = total_steps
        
        await db.commit()
        await db.refresh(profile)
        
        return {
            "step_number": step_number,
            "next_step": profile.onboarding_step if step_number < total_steps else None,
            "is_complete": step_number >= total_steps,
            "message": "Step completed successfully"
        }
    
    @staticmethod
    async def _process_construction_step(
        db: AsyncSession,
        professional_id: UUID,
        step_number: int,
        step_data: dict
    ):
        """Process Contract Construction onboarding step"""
        from app.models.professional import ProfessionalProfile
        
        profile_result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        profile = profile_result.scalar_one_or_none()
        
        if step_number == 1:
            if "company_name" in step_data:
                profile.company_name = step_data["company_name"]
            if "experience_years" in step_data:
                profile.experience_years = step_data["experience_years"]
            if "office_address" in step_data:
                profile.office_address = step_data["office_address"]
            if "google_maps_location" in step_data:
                profile.google_maps_location = step_data["google_maps_location"]
            if "builder_license" in step_data and step_data["builder_license"]:
                await ProfessionalService.add_license(
                    db, professional_id, step_data["builder_license"],
                    issuing_authority="KPWD or equivalent"
                )
            if "rera_registration" in step_data and step_data["rera_registration"]:
                profile.rera_experience = True
        
        elif step_number == 3:
            location_prefs = step_data.get("location_preferences", [])
            for loc_pref in location_prefs:
                location = LocationPreference(
                    professional_id=professional_id,
                    location_name=loc_pref.get("location_name"),
                    radius_km=loc_pref.get("radius_km"),
                    capability_type=CapabilityType.CONSTRUCTION
                )
                db.add(location)
        
        elif step_number == 4:
            if "total_projects_completed" in step_data:
                profile.total_projects_completed = step_data["total_projects_completed"]
            portfolio_projects = step_data.get("portfolio_projects", [])
            for proj in portfolio_projects[:5]:
                portfolio = Portfolio(
                    professional_id=professional_id,
                    project_name=proj.get("project_name"),
                    location=proj.get("location"),
                    area_sqft=proj.get("area_sqft"),
                    completion_date=proj.get("completion_date"),
                    duration_months=proj.get("duration_months"),
                    images=proj.get("images", [])[:5],
                    description=proj.get("description")
                )
                db.add(portfolio)
        
        elif step_number == 5:
            subcontractor_scopes = step_data.get("subcontractor_scopes", [])
            for scope_type in subcontractor_scopes:
                scope = SubcontractorScope(
                    professional_id=professional_id,
                    scope_type=scope_type,
                    capability_type=CapabilityType.CONSTRUCTION
                )
                db.add(scope)
        
        elif step_number == 6:
            if "typical_project_size" in step_data:
                size_cat = ProjectSizeCategoryModel(
                    professional_id=professional_id,
                    capability_type=CapabilityType.CONSTRUCTION,
                    size_category=step_data["typical_project_size"]
                )
                db.add(size_cat)
        
        elif step_number == 7:
            residential = step_data.get("residential_pricing", {})
            commercial = step_data.get("commercial_pricing", {})
            industrial = step_data.get("industrial_pricing", {})
            
            for project_type, pricing_data in [
                (ProjectIntent.RESIDENTIAL, residential),
                (ProjectIntent.COMMERCIAL, commercial),
                (ProjectIntent.INDUSTRIAL, industrial)
            ]:
                for tier_name, tier_value in [
                    (PricingTierType.BASIC_REGULAR, pricing_data.get("basic_regular")),
                    (PricingTierType.STANDARD, pricing_data.get("standard")),
                    (PricingTierType.LUXURY, pricing_data.get("luxury"))
                ]:
                    if tier_value:
                        pricing = ProfessionalPricing(
                            professional_id=professional_id,
                            capability_type=CapabilityType.CONSTRUCTION,
                            project_type=project_type,
                            pricing_tier=tier_name,
                            price_per_sqft=tier_value
                        )
                        db.add(pricing)
    
    @staticmethod
    async def _process_jvjd_step(
        db: AsyncSession,
        professional_id: UUID,
        step_number: int,
        step_data: dict
    ):
        """Process JV/JD Developer onboarding step"""
        from app.models.professional import ProfessionalProfile
        
        profile_result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        profile = profile_result.scalar_one_or_none()
        
        if step_number == 1:
            if "company_name" in step_data:
                profile.company_name = step_data["company_name"]
            if "experience_years" in step_data:
                profile.experience_years = step_data["experience_years"]
            if "business_entity_type" in step_data:
                profile.business_entity_type = step_data["business_entity_type"]
            if "office_address" in step_data:
                profile.office_address = step_data["office_address"]
            if "google_maps_location" in step_data:
                profile.google_maps_location = step_data["google_maps_location"]
        
        elif step_number == 2:
            if "builder_license" in step_data and step_data["builder_license"]:
                await ProfessionalService.add_license(
                    db, professional_id, step_data["builder_license"]
                )
            if "rera_registration" in step_data and step_data["rera_registration"]:
                profile.rera_experience = True
            if "gst_number" in step_data:
                profile.gst_number = step_data["gst_number"]
        
        elif step_number == 4:
            if "total_projects_completed" in step_data:
                profile.total_projects_completed = step_data["total_projects_completed"]
            recent_projects = step_data.get("recent_projects", [])
            for proj in recent_projects[:3]:
                portfolio = Portfolio(
                    professional_id=professional_id,
                    project_name=proj.get("project_name"),
                    location=proj.get("location"),
                    area_sqft=proj.get("area_sqft"),
                    completion_date=proj.get("completion_date"),
                    duration_months=proj.get("duration_months"),
                    images=proj.get("images", [])[:2],
                    description=proj.get("description")
                )
                db.add(portfolio)
        
        elif step_number == 5:
            subcontractor_scopes = step_data.get("subcontractor_scopes", [])
            for scope_type in subcontractor_scopes:
                scope = SubcontractorScope(
                    professional_id=professional_id,
                    scope_type=scope_type,
                    capability_type=CapabilityType.JV_JD
                )
                db.add(scope)
            if "typical_project_size" in step_data:
                size_cat = ProjectSizeCategoryModel(
                    professional_id=professional_id,
                    capability_type=CapabilityType.JV_JD,
                    size_category=step_data["typical_project_size"]
                )
                db.add(size_cat)
        
        elif step_number == 6:
            if "rera_registered_projects_count" in step_data:
                profile.rera_project_count = step_data["rera_registered_projects_count"]
            if "wallet_size_range" in step_data:
                size_cat = ProjectSizeCategoryModel(
                    professional_id=professional_id,
                    capability_type=CapabilityType.JV_JD,
                    size_category=ProjectSizeCategoryEnum.CUSTOM,
                    wallet_size_range=step_data["wallet_size_range"]
                )
                db.add(size_cat)
        
        elif step_number == 7:
            location_prefs = step_data.get("location_preferences", [])
            for loc_pref in location_prefs:
                location = LocationPreference(
                    professional_id=professional_id,
                    location_name=loc_pref.get("location_name"),
                    radius_km=loc_pref.get("radius_km"),
                    capability_type=CapabilityType.JV_JD
                )
                db.add(location)
            if "team_size_category" in step_data:
                profile.team_size_category = step_data["team_size_category"]
        
        elif step_number == 8:
            preferred_models = step_data.get("preferred_jv_models", [])
            jv_prefs = JVJDPreferences(
                professional_id=professional_id,
                preferred_jv_models=[m.value if hasattr(m, 'value') else str(m) for m in preferred_models],
                rera_registered_projects_count=profile.rera_project_count
            )
            db.add(jv_prefs)
    
    @staticmethod
    async def _process_interior_step(
        db: AsyncSession,
        professional_id: UUID,
        step_number: int,
        step_data: dict
    ):
        """Process Interior Designer onboarding step"""
        from app.models.professional import ProfessionalProfile
        
        profile_result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        profile = profile_result.scalar_one_or_none()
        
        if step_number == 1:
            if "company_name" in step_data:
                profile.company_name = step_data["company_name"]
            if "experience_years" in step_data:
                profile.experience_years = step_data["experience_years"]
            if "office_address" in step_data:
                profile.office_address = step_data["office_address"]
            if "google_maps_location" in step_data:
                profile.google_maps_location = step_data["google_maps_location"]
        
        elif step_number == 3:
            recent_projects = step_data.get("recent_projects", [])
            for proj in recent_projects[:3]:
                portfolio = Portfolio(
                    professional_id=professional_id,
                    project_name=proj.get("project_name"),
                    location=proj.get("location"),
                    area_sqft=proj.get("area_sqft"),
                    completion_date=proj.get("completion_date"),
                    duration_months=proj.get("duration_months"),
                    images=proj.get("images", [])[:2],
                    description=proj.get("description")
                )
                db.add(portfolio)
        
        elif step_number == 4:
            tentative = step_data.get("tentative_pricing", {})
            custom_pricing = {
                "flat_1200_sft": tentative.get("flat_1200_sft"),
                "duplex_1500_sft": tentative.get("duplex_1500_sft"),
                "commercial_1800_sft": tentative.get("commercial_1800_sft"),
                "other": tentative.get("other")
            }
            pricing = ProfessionalPricing(
                professional_id=professional_id,
                capability_type=CapabilityType.INTERIOR,
                custom_pricing=custom_pricing
            )
            db.add(pricing)
        
        elif step_number == 5:
            location_prefs = step_data.get("location_preferences", [])
            for loc_pref in location_prefs:
                location = LocationPreference(
                    professional_id=professional_id,
                    location_name=loc_pref.get("location_name"),
                    radius_km=loc_pref.get("radius_km"),
                    capability_type=CapabilityType.INTERIOR
                )
                db.add(location)
    
    @staticmethod
    async def _process_reconstruction_step(
        db: AsyncSession,
        professional_id: UUID,
        step_number: int,
        step_data: dict
    ):
        """Process Reconstruction onboarding step"""
        from app.models.professional import ProfessionalProfile
        
        profile_result = await db.execute(
            select(ProfessionalProfile).where(ProfessionalProfile.id == professional_id)
        )
        profile = profile_result.scalar_one_or_none()
        
        if step_number == 1:
            if "company_name" in step_data:
                profile.company_name = step_data["company_name"]
            if "experience_years" in step_data:
                profile.experience_years = step_data["experience_years"]
            if "business_entity_type" in step_data:
                profile.business_entity_type = step_data["business_entity_type"]
            if "office_address" in step_data:
                profile.office_address = step_data["office_address"]
            if "google_maps_location" in step_data:
                profile.google_maps_location = step_data["google_maps_location"]
            if "gst_number" in step_data:
                profile.gst_number = step_data["gst_number"]
            if "builder_license" in step_data and step_data["builder_license"]:
                await ProfessionalService.add_license(
                    db, professional_id, step_data["builder_license"]
                )
        
        elif step_number == 2:
            location_prefs = step_data.get("location_preferences", [])
            for loc in location_prefs:
                location_name = loc if isinstance(loc, str) else loc.get("location_name")
                location = LocationPreference(
                    professional_id=professional_id,
                    location_name=location_name,
                    capability_type=CapabilityType.RECONSTRUCTION
                )
                db.add(location)
        
        elif step_number == 3:
            if "total_projects_completed" in step_data:
                profile.total_projects_completed = step_data["total_projects_completed"]
        
        elif step_number == 4:
            subcontractor_scopes = step_data.get("subcontractor_scopes", [])
            for scope_type in subcontractor_scopes:
                scope = SubcontractorScope(
                    professional_id=professional_id,
                    scope_type=scope_type,
                    capability_type=CapabilityType.RECONSTRUCTION
                )
                db.add(scope)
            if "typical_project_size" in step_data:
                size_cat = ProjectSizeCategoryModel(
                    professional_id=professional_id,
                    capability_type=CapabilityType.RECONSTRUCTION,
                    size_category=step_data["typical_project_size"]
                )
                db.add(size_cat)
        
        elif step_number == 5:
            work_types = step_data.get("work_type_preferences", [])
            for work_type in work_types:
                recon_work = ReconstructionWorkTypeModel(
                    professional_id=professional_id,
                    work_type=work_type,
                    custom_description=step_data.get("custom_work_description") if work_type == ReconstructionWorkTypeEnum.CUSTOM else None
                )
                db.add(recon_work)
        
        elif step_number == 6:
            if "tentative_pricing" in step_data:
                pricing = ProfessionalPricing(
                    professional_id=professional_id,
                    capability_type=CapabilityType.RECONSTRUCTION,
                    custom_pricing={"tentative_pricing": step_data["tentative_pricing"]}
                )
                db.add(pricing)
    
    @staticmethod
    async def submit_onboarding(
        db: AsyncSession,
        user_id: UUID,
        capability_type: CapabilityType
    ) -> ProfessionalProfile:
        """Submit and finalize onboarding"""
        profile = await ProfessionalService.get_profile(db, user_id)
        
        # Calculate credibility score
        credibility_score = await CredibilityService.update_credibility_score(
            db, str(profile.id)
        )
        
        # Mark onboarding as completed
        profile.onboarding_status = OnboardingStatus.COMPLETED
        profile.credibility_score = credibility_score
        
        await db.commit()
        await db.refresh(profile)
        
        return profile
