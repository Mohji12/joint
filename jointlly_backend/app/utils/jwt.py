"""
JWT token encoding and decoding utilities
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from app.config import settings


# Token lifetimes for email flows
EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS = 24
PASSWORD_RESET_TOKEN_EXPIRE_MINUTES = 60


def _require_jwt_secret() -> str:
    if not settings.jwt_secret_key:
        raise RuntimeError("JWT is not configured (jwt_secret_key not set). Set JWT_SECRET_KEY in environment.")
    return settings.jwt_secret_key


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create JWT access token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    
    encoded_jwt = jwt.encode(
        to_encode,
        _require_jwt_secret(),
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def create_refresh_token(data: Dict[str, Any]) -> str:
    """
    Create JWT refresh token
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.jwt_refresh_token_expire_days)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow(), "type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        _require_jwt_secret(),
        algorithm=settings.jwt_algorithm
    )
    
    return encoded_jwt


def create_verification_token(user_id: str) -> str:
    """
    Create a short-lived token used for email verification.
    """
    data: Dict[str, Any] = {
        "sub": user_id,
        "type": "email_verify",
    }
    expires = timedelta(hours=EMAIL_VERIFICATION_TOKEN_EXPIRE_HOURS)
    return create_access_token(data, expires_delta=expires)


def create_password_reset_token(user_id: str) -> str:
    """
    Create a short-lived token used for password reset.
    """
    data: Dict[str, Any] = {
        "sub": user_id,
        "type": "password_reset",
    }
    expires = timedelta(minutes=PASSWORD_RESET_TOKEN_EXPIRE_MINUTES)
    return create_access_token(data, expires_delta=expires)


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and verify JWT token
    """
    try:
        payload = jwt.decode(
            token,
            _require_jwt_secret(),
            algorithms=[settings.jwt_algorithm],
        )
        return payload
    except JWTError:
        raise ValueError("Invalid token")
