"""
Application configuration using Pydantic Settings.
Secrets must be provided via jointlly_backend/.env (see .env.example).
"""
from pathlib import Path
from typing import Optional
from pydantic import Field, field_validator, model_validator, EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env from backend root (jointlly_backend/.env) so it works regardless of cwd
_BACKEND_ROOT = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_ROOT / ".env"

# Non-secret defaults only
_DEFAULT_JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 hours
_DEFAULT_JWT_REFRESH_TOKEN_EXPIRE_DAYS = 30
_DEFAULT_SMTP_HOST = "smtp.zeptomail.in"
_DEFAULT_SMTP_PORT = 587
_DEFAULT_SMTP_USERNAME = "emailapikey"
_DEFAULT_SMTP_FROM_EMAIL = "no-reply@jointlly.com"


class Settings(BaseSettings):
    """Application settings loaded from environment / .env."""

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE if _ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
    )

    database_url: Optional[str] = Field(
        default=None,
        description="Database URL (MySQL with aiomysql or PostgreSQL with asyncpg driver)",
    )

    jwt_secret_key: Optional[str] = Field(
        default=None,
        min_length=32,
        description="Secret key for JWT token signing",
    )
    jwt_algorithm: str = Field(default="HS256", description="JWT algorithm")
    jwt_access_token_expire_minutes: int = Field(
        default=_DEFAULT_JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        description="Access token expiration in minutes (minimum 480 enforced)",
    )
    jwt_refresh_token_expire_days: int = Field(
        default=_DEFAULT_JWT_REFRESH_TOKEN_EXPIRE_DAYS,
        description="Refresh token expiration in days",
    )

    razorpay_key_id: Optional[str] = Field(default=None, description="Razorpay Key ID")
    razorpay_key_secret: Optional[str] = Field(default=None, description="Razorpay Key Secret")

    aws_s3_bucket: Optional[str] = Field(default=None, description="S3 bucket name for uploads")
    aws_region: Optional[str] = Field(default=None, description="AWS region (e.g. ap-south-1)")
    aws_access_key_id: Optional[str] = Field(default=None, description="AWS access key for S3")
    aws_secret_access_key: Optional[str] = Field(default=None, description="AWS secret key for S3")

    cloudinary_cloud_name: Optional[str] = Field(default=None, description="Cloudinary cloud name")
    cloudinary_api_key: Optional[str] = Field(default=None, description="Cloudinary API key")
    cloudinary_api_secret: Optional[str] = Field(default=None, description="Cloudinary API secret")

    openai_api_key: Optional[str] = Field(default=None, description="OpenAI API key for plan image generation")

    smtp_host: Optional[str] = Field(default=_DEFAULT_SMTP_HOST, description="SMTP server host")
    smtp_port: int = Field(default=_DEFAULT_SMTP_PORT, description="SMTP server port")
    smtp_username: Optional[str] = Field(default=_DEFAULT_SMTP_USERNAME, description="SMTP username or API key")
    smtp_password: Optional[str] = Field(default=None, description="SMTP password or secret")
    smtp_from_email: Optional[EmailStr] = Field(
        default=_DEFAULT_SMTP_FROM_EMAIL,
        description="Default From email for transactional emails",
    )
    smtp_reply_to: Optional[EmailStr] = Field(
        default=None,
        description="Optional Reply-To (e.g. support@)",
    )

    frontend_base_url: str = Field(
        default="http://localhost:5173",
        description="Base URL of the frontend used for building email links",
    )
    email_logo_url: Optional[str] = Field(
        default=None,
        description="Full HTTPS URL to logo image for transactional emails",
    )

    app_name: str = Field(default="Jointly Real Estate Platform")
    app_version: str = Field(default="1.0.0")
    debug: bool = Field(default=False, description="Debug mode")
    environment: str = Field(default="production", description="Environment")

    cors_origins: Optional[str] = Field(default=None, description="Ignored - CORS handled in main.py")

    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def ignore_cors_origins(cls, v):
        return None

    @model_validator(mode="after")
    def _enforce_jwt_min_lifetime(self) -> "Settings":
        if self.jwt_access_token_expire_minutes < _DEFAULT_JWT_ACCESS_TOKEN_EXPIRE_MINUTES:
            self.jwt_access_token_expire_minutes = _DEFAULT_JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        return self

    @property
    def database_url_sync(self) -> Optional[str]:
        url = self.database_url
        if not url:
            return None
        if "+aiomysql" in url:
            url = url.replace("+aiomysql", "+pymysql")
        elif "+asyncpg" in url:
            url = url.replace("+asyncpg", "+psycopg2")
        return url


settings = Settings()
