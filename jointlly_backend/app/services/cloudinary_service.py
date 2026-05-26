"""
Cloudinary upload service for images and files.
Server-side upload: client sends file to backend, backend uploads to Cloudinary and returns public URL.
"""
import uuid
from io import BytesIO
from typing import Optional

from app.config import settings


def upload_file(
    file_content: bytes,
    content_type: str = "image/jpeg",
    folder: str = "uploads",
) -> Optional[str]:
    """
    Upload file content to Cloudinary and return the secure public URL.
    Returns None if Cloudinary is not configured or upload fails.
    """
    if not all([
        settings.cloudinary_cloud_name,
        settings.cloudinary_api_key,
        settings.cloudinary_api_secret,
    ]):
        return None

    try:
        import cloudinary
        import cloudinary.uploader
    except ImportError:
        return None

    cloudinary.config(
        cloud_name=settings.cloudinary_cloud_name,
        api_key=settings.cloudinary_api_key,
        api_secret=settings.cloudinary_api_secret,
        secure=True,
    )

    unique_id = uuid.uuid4().hex

    try:
        result = cloudinary.uploader.upload(
            BytesIO(file_content),
            folder=folder,
            public_id=unique_id,
            overwrite=True,
            resource_type="auto",
        )
        return result.get("secure_url")
    except Exception:
        return None


def is_configured() -> bool:
    """Return True if Cloudinary credentials are set."""
    return bool(
        settings.cloudinary_cloud_name
        and settings.cloudinary_api_key
        and settings.cloudinary_api_secret
    )
