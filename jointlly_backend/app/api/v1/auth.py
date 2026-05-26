"""
Authentication router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.schemas.auth import (
    UserRegister,
    UserLogin,
    Token,
    TokenRefresh,
    UserResponse,
    UpdateProfileRequest,
    RegisterResponse,
    VerifyEmailRequest,
    VerifyEmailResponse,
    VerifyOtpRequest,
    VerifyOtpResponse,
    ResendOtpRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    MessageResponse,
)
from app.services.auth_service import AuthService
from app.services.email_service import (
    send_password_reset_otp_email,
    send_verification_otp_email,
)
from app.services.otp_service import issue_email_verification_otp, issue_password_reset_otp, verify_password_reset_otp
from app.dependencies import get_current_user
from app.models.user import User
from app.utils.constants import Role
from app.utils.password import get_password_hash

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    """
    Register a new user with required mobile number.
    Email OTP verification is required before login.
    ADMIN role cannot be registered; create admin users via DB/seed only.
    """
    if user_data.role == Role.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin accounts cannot be created via registration.",
        )
    user = await AuthService.register_user(
        db,
        user_data.email,
        user_data.password,
        user_data.name,
        user_data.phone,
        user_data.role
    )

    otp = await issue_email_verification_otp(
        db,
        user_id=str(user.id),
        email=user.email,
    )
    await send_verification_otp_email(user.email, user.name, otp)

    return RegisterResponse(
        message="Registration successful. Please verify the OTP sent to your email to log in.",
        requires_verification=True,
    )


@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),
    password: str = Form(...),
    account_type: str | None = Form(None),
    db: AsyncSession = Depends(get_db)
):
    """Login and get JWT tokens (OAuth2 compatible with form data)."""
    user = await AuthService.authenticate_user(
        db,
        username,  # username field contains the email
        password,
        account_type=account_type,
    )
    tokens = AuthService.create_tokens(user)
    return tokens


@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_data: TokenRefresh,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token"""
    from uuid import UUID
    from app.utils.jwt import decode_token
    from app.exceptions import UnauthorizedError
    
    try:
        payload = decode_token(refresh_data.refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid refresh token")
        
        user_id = payload.get("sub")
        if not user_id:
            raise UnauthorizedError("Invalid refresh token")
        user = await AuthService.get_user_by_id(db, UUID(str(user_id)))
        tokens = AuthService.create_tokens(user)
        return tokens
    except UnauthorizedError:
        raise
    except Exception:
        raise UnauthorizedError("Invalid or expired refresh token")


@router.post("/verify-email", response_model=VerifyEmailResponse)
async def verify_email(
    body: VerifyEmailRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a user's email using a token sent via email.
    """
    from app.utils.jwt import decode_token

    try:
        payload = decode_token(body.token)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    if payload.get("type") != "email_verify":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token type",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token payload",
        )

    user = await AuthService.get_user_by_id(db, user_id)

    if user.is_active == "true":
        return VerifyEmailResponse(
            message="Email already verified.",
            already_verified=True,
        )

    user.is_active = "true"
    await db.commit()
    await db.refresh(user)

    return VerifyEmailResponse(
        message="Email verified successfully.",
        already_verified=False,
    )


@router.post("/verify-otp", response_model=VerifyOtpResponse)
async def verify_otp(
    body: VerifyOtpRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a user's email using an OTP sent via email.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_active == "true":
        return VerifyOtpResponse(message="Email already verified.", already_verified=True)

    from app.services.otp_service import verify_email_otp
    verified_user_id = await verify_email_otp(db, email=body.email, otp=body.otp)

    def _normalize_id(v: str) -> str:
        return (v or "").replace("-", "").strip().lower()

    if not verified_user_id or _normalize_id(str(user.id)) != _normalize_id(str(verified_user_id)):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

    user.is_active = "true"
    await db.commit()
    await db.refresh(user)

    return VerifyOtpResponse(message="Email verified successfully.", already_verified=False)


@router.post("/resend-otp", response_model=MessageResponse)
async def resend_otp(
    body: ResendOtpRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Re-issue a verification OTP for an unverified user.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user:
        # Generic response to avoid account enumeration.
        return MessageResponse(message="If an account exists and is unverified, OTP has been sent.")

    if user.is_active == "true":
        return MessageResponse(message="Email is already verified. Please log in.")

    otp = await issue_email_verification_otp(
        db,
        user_id=str(user.id),
        email=user.email,
    )
    await send_verification_otp_email(user.email, user.name, otp)
    return MessageResponse(message="OTP sent successfully. Please verify your email to continue.")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    body: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Initiate password reset by sending a reset link to the user's email.

    Always returns a generic success message to avoid leaking whether the
    email exists in the system.
    """
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user and user.is_active == "true":
        otp = await issue_password_reset_otp(
            db,
            user_id=str(user.id),
            email=user.email,
        )
        try:
            await send_password_reset_otp_email(user.email, user.name, otp)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to send password reset OTP email: {exc}",
            ) from exc

    return MessageResponse(
        message="If an account with that email exists, a password reset OTP has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    body: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Complete password reset using a token from the password reset email.
    """
    user = None
    # Backward compatibility: support token-based reset links as well.
    if body.token:
        from app.utils.jwt import decode_token

        try:
            payload = decode_token(body.token)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset token",
            )

        if payload.get("type") != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token type",
            )

        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid password reset token payload",
            )
        user = await AuthService.get_user_by_id(db, user_id)
    else:
        verified_user_id = await verify_password_reset_otp(
            db,
            email=str(body.email),
            otp=str(body.otp),
        )
        if not verified_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired password reset OTP",
            )
        user = await AuthService.get_user_by_id(db, verified_user_id)

    # Optionally, ensure only active (verified) users can reset passwords.
    if user.is_active != "true":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is not active.",
        )

    user.hashed_password = get_password_hash(body.new_password)
    await db.commit()

    return MessageResponse(
        message="Password reset successful. You can now log in with your new password."
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user profile (avatar URL, name, phone). Upload avatar to S3 first, then pass the public URL here."""
    updated = await AuthService.update_user_profile(
        db,
        current_user.id,
        avatar_url=body.avatar_url,
        name=body.name,
        phone=body.phone,
    )
    return updated
