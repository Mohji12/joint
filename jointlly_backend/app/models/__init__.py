"""
Database models
"""
from app.database import Base

# Import all models to ensure they're registered with Base
from app.models.user import User
from app.models.landowner import LandownerProfile, Property, Project, JVPreferences
from app.models.professional import (
    ProfessionalProfile,
    Capability,
    License,
    Portfolio,
    PricingTier,
    LocationPreference,
    SubcontractorScope,
    ProjectSizeCategory,
    ProfessionalPricing,
    JVJDPreferences,
    ReconstructionWorkType
)
from app.models.verification import FARCalculation, FeasibilityReport, PIDVerification
from app.models.payment import Transaction, Payment
from app.models.matching import Match, MatchScore
from app.models.form_submission import FormSubmission
from app.models.email_otp import EmailOTP
from app.models.support import SupportArticle, SupportFlow, SupportTicket
from app.models.admin_audit_log import AdminAuditLog
from app.models.admin_builder_export import AdminBuilderExport
from app.models.login_event import LoginEvent

__all__ = [
    "Base",
    "User",
    "LandownerProfile",
    "Property",
    "Project",
    "JVPreferences",
    "ProfessionalProfile",
    "Capability",
    "License",
    "Portfolio",
    "PricingTier",
    "LocationPreference",
    "SubcontractorScope",
    "ProjectSizeCategory",
    "ProfessionalPricing",
    "JVJDPreferences",
    "ReconstructionWorkType",
    "FARCalculation",
    "FeasibilityReport",
    "PIDVerification",
    "Transaction",
    "Payment",
    "Match",
    "MatchScore",
    "FormSubmission",
    "EmailOTP",
    "SupportArticle",
    "SupportFlow",
    "SupportTicket",
    "AdminAuditLog",
    "AdminBuilderExport",
    "LoginEvent",
]
