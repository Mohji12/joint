"""
FastAPI dependencies for authentication and database
"""
from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.models.payment import Transaction
from app.utils.constants import Role, TransactionType, TransactionStatus
from app.utils.jwt import decode_token
from app.exceptions import UnauthorizedError, ForbiddenError

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token
    """
    token = credentials.credentials
    
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise UnauthorizedError("Invalid token")
    except Exception:
        raise UnauthorizedError("Invalid or expired token")
    
    # Get user from database
    result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = result.scalar_one_or_none()
    
    if user is None:
        raise UnauthorizedError("User not found")
    
    return user


def require_role(*allowed_roles: Role):
    """
    Dependency factory for role-based access control
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError(
                f"Access denied. Required roles: {', '.join(r.value for r in allowed_roles)}"
            )
        return current_user
    
    return role_checker


# Common role dependencies
require_landowner = require_role(Role.LANDOWNER)
require_professional = require_role(Role.PROFESSIONAL)
require_admin = require_role(Role.ADMIN)
require_authenticated = get_current_user


async def require_landowner_entry_paid(
    current_user: User = Depends(require_landowner),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Enforce one-time LANDOWNER_ENTRY payment for landowners.
    Non-landowner users are not blocked by this dependency.
    """
    result = await db.execute(
        select(Transaction.id).where(
            Transaction.user_id == current_user.id,
            Transaction.transaction_type == TransactionType.LANDOWNER_ENTRY,
            Transaction.status == TransactionStatus.SUCCESS,
        ).limit(1)
    )
    paid_txn = result.scalar_one_or_none()
    if paid_txn is None:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail="Landowner entry fee payment (₹99) is required to access this resource.",
        )
    return current_user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Return current user if valid token present, else None. Use for form submissions that work with or without auth."""
    if credentials is None:
        return None
    try:
        return await get_current_user(credentials, db)
    except Exception:
        return None
