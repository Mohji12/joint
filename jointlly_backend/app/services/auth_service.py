"""
Authentication service
"""
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.user import User
from app.models.login_event import LoginEvent
from app.utils.constants import Role
from app.utils.password import verify_password, get_password_hash
from app.utils.jwt import create_access_token, create_refresh_token
from app.exceptions import UnauthorizedError, ConflictError, NotFoundError
from datetime import timedelta


class AuthService:
    """Service for authentication operations"""
    
    @staticmethod
    async def register_user(
        db: AsyncSession,
        email: str,
        password: str,
        name: str,
        phone: str,
        role: Role
    ) -> User:
        """
        Register a new user
        """
        # Check if user already exists
        result = await db.execute(select(User).where(User.email == email))
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise ConflictError(f"User with email {email} already exists")
        
        # Create new user
        hashed_password = get_password_hash(password)
        user = User(
            email=email,
            name=name,
            hashed_password=hashed_password,
            role=role,
            phone=phone,
            # New users must verify email OTP before login.
            is_active="false",
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        return user
    
    @staticmethod
    def _account_type_to_role(account_type: str) -> Optional[Role]:
        normalized = (account_type or "").strip().lower()
        if normalized in {"builder", "professional", "construction-company"}:
            return Role.PROFESSIONAL
        if normalized in {"landowner", "property-owner"}:
            return Role.LANDOWNER
        return None

    @staticmethod
    def _account_type_mismatch_message(actual_role: Role) -> str:
        if actual_role == Role.LANDOWNER:
            return (
                "This account is registered as a Landowner. "
                "Select Landowner in Account type to log in."
            )
        if actual_role == Role.PROFESSIONAL:
            return (
                "This account is registered as a Construction Company. "
                "Select Construction Company in Account type to log in."
            )
        if actual_role == Role.ADMIN:
            return "This is an admin account. Please contact support if you need admin access."
        return "Account type does not match this login."

    @staticmethod
    async def authenticate_user(
        db: AsyncSession,
        email: str,
        password: str,
        account_type: Optional[str] = None,
    ) -> User:
        """
        Authenticate user and return user object.
        When account_type is provided, the user's stored role must match
        (builder → PROFESSIONAL, landowner → LANDOWNER). Admin accounts bypass this check.
        """
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        
        if not user:
            raise UnauthorizedError("Invalid email or password")
        
        if not verify_password(password, user.hashed_password):
            raise UnauthorizedError("Invalid email or password")
        
        if user.is_active != "true":
            raise UnauthorizedError("Please verify your email OTP before logging in")

        if account_type:
            expected_role = AuthService._account_type_to_role(account_type)
            if expected_role is not None and user.role != Role.ADMIN and user.role != expected_role:
                raise UnauthorizedError(AuthService._account_type_mismatch_message(user.role))

        db.add(
            LoginEvent(
                user_id=str(user.id),
                email=user.email,
            )
        )
        await db.commit()

        return user
    
    @staticmethod
    def create_tokens(user: User) -> dict:
        """
        Create access and refresh tokens for user
        """
        token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role.value if hasattr(user.role, 'value') else str(user.role)
        }
        
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        # Import here to avoid circular dependency
        from app.schemas.auth import UserResponse
        
        # Create UserResponse object to ensure proper serialization
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            name=user.name,
            role=user.role,
            is_active=user.is_active == "true",
            created_at=user.created_at,
            avatar_url=getattr(user, "avatar_url", None),
            phone=getattr(user, "phone", None),
        )
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": user_response
        }
    
    @staticmethod
    async def update_user_profile(
        db: AsyncSession,
        user_id: UUID,
        *,
        avatar_url: Optional[str] = None,
        name: Optional[str] = None,
        phone: Optional[str] = None,
    ) -> User:
        """Update user profile (avatar_url, name, phone)."""
        user = await AuthService.get_user_by_id(db, user_id)
        if avatar_url is not None:
            user.avatar_url = avatar_url
        if name is not None:
            user.name = name
        if phone is not None:
            user.phone = phone
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def get_user_by_id(
        db: AsyncSession,
        user_id: UUID
    ) -> User:
        """
        Get user by ID
        """
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        if not user:
            raise NotFoundError("User", str(user_id))
        
        return user
