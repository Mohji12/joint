"""
Constants and Enums used across the application
"""
from enum import Enum


class Role(str, Enum):
    """User roles"""
    LANDOWNER = "LANDOWNER"
    PROFESSIONAL = "PROFESSIONAL"
    ADMIN = "ADMIN"


class ProjectType(str, Enum):
    """Project types"""
    CONTRACT_CONSTRUCTION = "CONTRACT_CONSTRUCTION"
    JV_JD = "JV_JD"
    INTERIOR = "INTERIOR"
    RECONSTRUCTION = "RECONSTRUCTION"


class ProjectStatus(str, Enum):
    """Project status"""
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    MATCHED = "MATCHED"
    COMPLETED = "COMPLETED"


class ProjectIntent(str, Enum):
    """Project intent categories"""
    RESIDENTIAL = "RESIDENTIAL"
    COMMERCIAL = "COMMERCIAL"
    INDUSTRIAL = "INDUSTRIAL"


class JVPostConstructionExpectation(str, Enum):
    """JV/JD post-construction expectations"""
    BUILT_UP_AREA_SHARING = "BUILT_UP_AREA_SHARING"
    REVENUE_SHARING = "REVENUE_SHARING"


class CapabilityType(str, Enum):
    """Professional capability types"""
    CONSTRUCTION = "CONSTRUCTION"
    INTERIOR = "INTERIOR"
    JV_JD = "JV_JD"
    RECONSTRUCTION = "RECONSTRUCTION"


class MatchStatus(str, Enum):
    """Match status"""
    PENDING = "PENDING"
    LANDOWNER_SELECTED = "LANDOWNER_SELECTED"
    BUILDER_SELECTED_PAID = "BUILDER_SELECTED_PAID"
    CONNECTED = "CONNECTED"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"


class TransactionType(str, Enum):
    """Transaction types"""
    PID_VERIFICATION = "PID_VERIFICATION"
    FEASIBILITY_UNLOCK = "FEASIBILITY_UNLOCK"
    PRIORITY_LISTING = "PRIORITY_LISTING"
    # Gatekeeper / entry fees
    LANDOWNER_ENTRY = "LANDOWNER_ENTRY"
    BUILDER_ENTRY_INTERIORS = "BUILDER_ENTRY_INTERIORS"
    BUILDER_ENTRY_RECONSTRUCTION = "BUILDER_ENTRY_RECONSTRUCTION"
    BUILDER_ENTRY_CONSTRUCTION = "BUILDER_ENTRY_CONSTRUCTION"
    BUILDER_ENTRY_JD = "BUILDER_ENTRY_JD"
    # Success fees on closed Construction / JD deals
    SUCCESS_FEE_BUILDER = "SUCCESS_FEE_BUILDER"
    SUCCESS_FEE_LANDOWNER = "SUCCESS_FEE_LANDOWNER"
    # Builder selects a project and must pay to unlock contact sharing
    BUILDER_MATCH_SELECTION = "BUILDER_MATCH_SELECTION"


class TransactionStatus(str, Enum):
    """Transaction status"""
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


class VerificationStatus(str, Enum):
    """PID verification status"""
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"


class BusinessEntityType(str, Enum):
    """Business entity types"""
    INDIVIDUAL = "INDIVIDUAL"
    PARTNERSHIP = "PARTNERSHIP"
    LLP = "LLP"
    PRIVATE_LIMITED = "PRIVATE_LIMITED"


class TeamStructure(str, Enum):
    """Team structure types"""
    IN_HOUSE = "IN_HOUSE"
    SUBCONTRACTORS = "SUBCONTRACTORS"
    MIXED = "MIXED"


class TeamSizeCategory(str, Enum):
    """Team size categories"""
    SMALL = "SMALL"  # 1-20
    MEDIUM = "MEDIUM"  # 21-50
    LARGE = "LARGE"  # 51-100
    VERY_LARGE = "VERY_LARGE"  # 100+


class ProjectSizeCategory(str, Enum):
    """Project size categories"""
    UP_TO_5000 = "UP_TO_5000"
    FIVE_THOUSAND_TO_25000 = "5000_25000"
    TWENTY_FIVE_THOUSAND_TO_100000 = "25000_100000"
    ONE_HUNDRED_THOUSAND_PLUS = "100000_PLUS"
    CUSTOM = "CUSTOM"


class WalletSizeRange(str, Enum):
    """Wallet size ranges for JV/JD"""
    SMALL_UP_TO_5CR = "SMALL_UP_TO_5CR"
    MEDIUM_5_20CR = "MEDIUM_5_20CR"
    LARGE_20_50CR = "LARGE_20_50CR"
    VERY_LARGE_50CR_PLUS = "VERY_LARGE_50CR_PLUS"


class PricingTierType(str, Enum):
    """Pricing tier types"""
    BASIC_REGULAR = "BASIC_REGULAR"
    STANDARD = "STANDARD"
    LUXURY = "LUXURY"


class JVModelType(str, Enum):
    """JV/JD model types"""
    REVENUE_SHARING = "REVENUE_SHARING"
    BUILT_UP_AREA_SHARING = "BUILT_UP_AREA_SHARING"
    SELL_AND_SHARE = "SELL_AND_SHARE"


class ReconstructionWorkType(str, Enum):
    """Reconstruction work types"""
    MAJOR_RECONSTRUCTION = "MAJOR_RECONSTRUCTION"
    MINOR_REPAIR_MAINTENANCE = "MINOR_REPAIR_MAINTENANCE"
    PAINTING_FINISHING = "PAINTING_FINISHING"
    CUSTOM = "CUSTOM"


class SubcontractorScopeType(str, Enum):
    """Subcontractor scope types"""
    CIVIL_WORKS = "CIVIL_WORKS"
    FLOORING_FINISHING = "FLOORING_FINISHING"
    PAINTING_SURFACE = "PAINTING_SURFACE"
    CARPENTRY_WOODWORK = "CARPENTRY_WOODWORK"
    OTHER = "OTHER"


class OnboardingStatus(str, Enum):
    """Onboarding status"""
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    VERIFIED = "VERIFIED"


class BuilderApprovalStatus(str, Enum):
    """Admin approval status for builder profiles."""
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


# Pricing constants
PID_VERIFICATION_FEE_MIN = 1999
PID_VERIFICATION_FEE_MAX = 2999
FEASIBILITY_UNLOCK_FEE_MIN = 999
FEASIBILITY_UNLOCK_FEE_MAX = 3999

# Matching weights
MATCH_WEIGHTS = {
    "project_type": 0.20,
    "location": 0.25,
    "project_size": 0.15,
    "pricing": 0.15,
    "capability": 0.15,
    "verification": 0.10,
}

# Trust score formula: S = (Verification x 0.4) + (Proximity x 0.3) + (ResponseSpeed x 0.3)
TRUST_WEIGHTS = {
    "verification": 0.4,
    "proximity": 0.3,
    "response_speed": 0.3,
}

# Asset class for Tier 1 matching (landowner_asset_class / builder_asset_portfolio)
class AssetClass(str, Enum):
    """Asset class for project/builder matching"""
    RESIDENTIAL_VILLA = "RESIDENTIAL_VILLA"
    RESIDENTIAL_MULTISTOREY = "RESIDENTIAL_MULTISTOREY"
    COMMERCIAL_OFFICE = "COMMERCIAL_OFFICE"
    COMMERCIAL_RETAIL = "COMMERCIAL_RETAIL"
    INDUSTRIAL_WAREHOUSE = "INDUSTRIAL_WAREHOUSE"
    INDUSTRIAL_FACTORY = "INDUSTRIAL_FACTORY"
    RESIDENTIAL = "RESIDENTIAL"
    COMMERCIAL = "COMMERCIAL"
    INDUSTRIAL = "INDUSTRIAL"


# Budget tier for Tier 2 (Basic / Standard / Luxury)
class BudgetTier(str, Enum):
    """Landowner budget tier"""
    BASIC = "BASIC"
    STANDARD = "STANDARD"
    LUXURY = "LUXURY"


# Project scale tier from BUA (for RERA and Tier 2)
class ProjectScaleTier(str, Enum):
    """Project scale from total buildable area"""
    SMALL_SCALE = "SMALL_SCALE"   # < 2500 sqft
    MEDIUM_SCALE = "MEDIUM_SCALE"  # 2500-10000
    LARGE_SCALE = "LARGE_SCALE"    # 10000+

# BUA above this (sqft) triggers RERA filter in matching
RERA_THRESHOLD_SQFT = 5400

# FAR constants for Bengaluru
BENGALURU_FAR_MIN = 1.5
BENGALURU_FAR_MAX = 3.25
