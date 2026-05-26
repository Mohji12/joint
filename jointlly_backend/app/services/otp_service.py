"""
OTP generation and verification helpers for email-based verification.
"""

from __future__ import annotations

from datetime import datetime, timedelta
import hashlib
import secrets
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select
from sqlalchemy.exc import ProgrammingError

from app.config import settings
from app.models.email_otp import EmailOTP


OTP_LENGTH = 6
OTP_TTL_MINUTES = 10
OTP_PURPOSE_EMAIL_VERIFY = "email_verify"
OTP_PURPOSE_PASSWORD_RESET = "password_reset"
MAX_ATTEMPTS = 5


def _normalize_id(value: str) -> str:
    return (value or "").replace("-", "").strip().lower()


def _hash_otp(*, email: str, otp: str, purpose: str) -> str:
    # Salt with jwt_secret_key so hashes cannot be rainbow-tabled across environments.
    salt = (settings.jwt_secret_key or "dev-salt").encode("utf-8")
    payload = f"{purpose}:{email.lower()}:{otp}".encode("utf-8")
    return hashlib.sha256(salt + b"|" + payload).hexdigest()


def generate_numeric_otp(length: int = OTP_LENGTH) -> str:
    # Cryptographically secure random digits.
    # Ensure leading zeros are preserved by string formatting.
    max_value = 10**length
    n = secrets.randbelow(max_value)
    return f"{n:0{length}d}"


async def issue_email_verification_otp(db: AsyncSession, *, user_id: str, email: str) -> str:
    """
    Create a new OTP for email verification and store its hash.
    Returns the raw OTP (caller must deliver via email and never store it).
    """
    otp = generate_numeric_otp()
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=OTP_TTL_MINUTES)
    otp_hash = _hash_otp(email=email, otp=otp, purpose=OTP_PURPOSE_EMAIL_VERIFY)

    # Invalidate previous OTPs for same email+purpose.
    try:
        await db.execute(
            delete(EmailOTP).where(
                EmailOTP.email == email,
                EmailOTP.purpose == OTP_PURPOSE_EMAIL_VERIFY,
            )
        )
    except ProgrammingError as e:
        # Most common cause: migrations not applied (email_otps table missing).
        raise RuntimeError(
            "OTP verification is not initialized. Run 'alembic upgrade head' to create the email_otps table."
        ) from e

    record = EmailOTP(
        user_id=_normalize_id(user_id),
        email=email,
        purpose=OTP_PURPOSE_EMAIL_VERIFY,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts="0",
    )
    db.add(record)
    await db.commit()
    return otp


async def verify_email_otp(db: AsyncSession, *, email: str, otp: str) -> Optional[str]:
    """
    Verify OTP for email. Returns user_id if valid, else None.
    """
    try:
        result = await db.execute(
            select(EmailOTP).where(
                EmailOTP.email == email,
                EmailOTP.purpose == OTP_PURPOSE_EMAIL_VERIFY,
            )
        )
    except ProgrammingError:
        return None
    record = result.scalar_one_or_none()
    if not record:
        return None

    if record.expires_at < datetime.utcnow():
        await db.execute(delete(EmailOTP).where(EmailOTP.id == record.id))
        await db.commit()
        return None

    try:
        attempts = int(record.attempts or "0")
    except ValueError:
        attempts = 0

    if attempts >= MAX_ATTEMPTS:
        await db.execute(delete(EmailOTP).where(EmailOTP.id == record.id))
        await db.commit()
        return None

    expected = record.otp_hash
    actual = _hash_otp(email=email, otp=otp, purpose=OTP_PURPOSE_EMAIL_VERIFY)
    if secrets.compare_digest(expected, actual):
        await db.execute(delete(EmailOTP).where(EmailOTP.id == record.id))
        await db.commit()
        return _normalize_id(record.user_id)

    record.attempts = str(attempts + 1)
    await db.commit()
    return None


async def issue_password_reset_otp(db: AsyncSession, *, user_id: str, email: str) -> str:
    """
    Create a new OTP for password reset and store its hash.
    Returns the raw OTP for email delivery.
    """
    otp = generate_numeric_otp()
    now = datetime.utcnow()
    expires_at = now + timedelta(minutes=OTP_TTL_MINUTES)
    otp_hash = _hash_otp(email=email, otp=otp, purpose=OTP_PURPOSE_PASSWORD_RESET)

    try:
        await db.execute(
            delete(EmailOTP).where(
                EmailOTP.email == email,
                EmailOTP.purpose == OTP_PURPOSE_PASSWORD_RESET,
            )
        )
    except ProgrammingError as e:
        raise RuntimeError(
            "Password reset OTP is not initialized. Run 'alembic upgrade head' to create the email_otps table."
        ) from e

    record = EmailOTP(
        user_id=_normalize_id(user_id),
        email=email,
        purpose=OTP_PURPOSE_PASSWORD_RESET,
        otp_hash=otp_hash,
        expires_at=expires_at,
        attempts="0",
    )
    db.add(record)
    await db.commit()
    return otp


async def verify_password_reset_otp(db: AsyncSession, *, email: str, otp: str) -> Optional[str]:
    """
    Verify password reset OTP. Returns user_id if valid, else None.
    """
    try:
        result = await db.execute(
            select(EmailOTP).where(
                EmailOTP.email == email,
                EmailOTP.purpose == OTP_PURPOSE_PASSWORD_RESET,
            )
        )
    except ProgrammingError:
        return None
    record = result.scalar_one_or_none()
    if not record:
        return None

    if record.expires_at < datetime.utcnow():
        await db.execute(delete(EmailOTP).where(EmailOTP.id == record.id))
        await db.commit()
        return None

    try:
        attempts = int(record.attempts or "0")
    except ValueError:
        attempts = 0

    if attempts >= MAX_ATTEMPTS:
        await db.execute(delete(EmailOTP).where(EmailOTP.id == record.id))
        await db.commit()
        return None

    expected = record.otp_hash
    actual = _hash_otp(email=email, otp=otp, purpose=OTP_PURPOSE_PASSWORD_RESET)
    if secrets.compare_digest(expected, actual):
        await db.execute(delete(EmailOTP).where(EmailOTP.id == record.id))
        await db.commit()
        return _normalize_id(record.user_id)

    record.attempts = str(attempts + 1)
    await db.commit()
    return None

