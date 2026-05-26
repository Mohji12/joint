"""
Authentication schemas
"""
from datetime import datetime
from typing import Optional, Union
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator, model_validator
from app.utils.constants import Role


class UserRegister(BaseModel):
    """User registration schema"""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    name: str = Field(..., min_length=1, description="User's full name")
    phone: str = Field(..., min_length=7, max_length=20, description="User mobile number")
    role: Union[Role, str]
    
    @field_validator('role', mode='before')
    @classmethod
    def validate_role(cls, v):
        """Convert string to Role enum"""
        if isinstance(v, str):
            try:
                return Role(v)
            except ValueError:
                raise ValueError(f"Invalid role: {v}. Must be one of: {', '.join([r.value for r in Role])}")
        return v
    
    model_config = ConfigDict(use_enum_values=False)


class UserLogin(BaseModel):
    """User login schema"""
    email: EmailStr
    password: str
    
    model_config = ConfigDict(strict=True)


class UserResponse(BaseModel):
    """User response schema"""
    id: UUID
    email: str
    name: str
    role: Role
    is_active: bool
    created_at: datetime
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

    @field_validator("is_active", mode="before")
    @classmethod
    def coerce_is_active(cls, v):
        """DB stores is_active as string 'true'/'false'; coerce to bool for API."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() == "true"
        return False

    model_config = ConfigDict(
        from_attributes=True,
        strict=True
    )


class UpdateProfileRequest(BaseModel):
    """Update current user profile (avatar, name, phone)"""
    avatar_url: Optional[str] = Field(None, max_length=500)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)


class Token(BaseModel):
    """Token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse
    
    model_config = ConfigDict(strict=True)


class TokenRefresh(BaseModel):
    """Token refresh schema"""
    refresh_token: str
    
    model_config = ConfigDict(strict=True)


class RegisterResponse(BaseModel):
    """Response after registration (email verification required)."""
    message: str
    requires_verification: bool = True


class VerifyEmailRequest(BaseModel):
    """Request body for verifying email via token."""
    token: str


class VerifyEmailResponse(BaseModel):
    """Response for email verification."""
    message: str
    already_verified: bool = False


class VerifyOtpRequest(BaseModel):
    """Request body for verifying email via OTP."""
    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=10)


class VerifyOtpResponse(BaseModel):
    """Response for OTP verification."""
    message: str
    already_verified: bool = False


class ResendOtpRequest(BaseModel):
    """Request body for re-sending email OTP."""
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    """Request body for initiating password reset."""
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Request body for completing password reset."""
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    otp: Optional[str] = Field(default=None, min_length=4, max_length=10)
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

    @model_validator(mode="after")
    def validate_reset_mode(self):
        has_token = bool((self.token or "").strip())
        has_otp_mode = bool((self.email or "").strip()) and bool((self.otp or "").strip())
        if not has_token and not has_otp_mode:
            raise ValueError("Provide either token, or email and otp for password reset.")
        return self


class MessageResponse(BaseModel):
    """Generic message-only response schema."""
    message: str
