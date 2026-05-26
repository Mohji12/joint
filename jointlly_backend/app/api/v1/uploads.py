"""
Uploads router: Cloudinary (primary) and optional S3 presigned URLs for client-side file uploads.
"""
from fastapi import APIRouter, Depends, File, Form, HTTPException, status, UploadFile
from pydantic import BaseModel, Field

from app.dependencies import require_authenticated
from app.models.user import User
from app.services.cloudinary_service import upload_file as cloudinary_upload, is_configured as cloudinary_configured
from app.services.s3_service import get_presigned_upload_url

router = APIRouter(prefix="/uploads", tags=["Uploads"])


class PresignRequest(BaseModel):
    filename: str = Field(..., min_length=1, max_length=255)
    content_type: str = Field(default="image/jpeg", max_length=100)
    prefix: str = Field(default="uploads", max_length=100)


class PresignResponse(BaseModel):
    upload_url: str
    key: str
    public_url: str


class UploadResponse(BaseModel):
    public_url: str


@router.post("/upload", response_model=UploadResponse)
async def upload(
    file: UploadFile = File(...),
    folder: str = Form(default="uploads"),
    current_user: User = Depends(require_authenticated),
):
    """
    Upload a file to Cloudinary. Accepts multipart form with 'file' and optional 'folder'.
    Returns the public URL of the uploaded file.
    """
    if not cloudinary_configured():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary upload is not configured",
        )
    content = await file.read()
    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    content_type = file.content_type or "image/jpeg"
    public_url = cloudinary_upload(file_content=content, content_type=content_type, folder=folder)
    if not public_url:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Upload to Cloudinary failed",
        )
    return UploadResponse(public_url=public_url)


@router.post("/presign", response_model=PresignResponse)
async def get_presign(
    body: PresignRequest,
    current_user: User = Depends(require_authenticated),
):
    """
    Get a presigned URL to upload a file to S3 (used when Cloudinary is not configured).
    Client should PUT the file to upload_url with Content-Type header set to content_type.
    Store public_url or key in your form payload when submitting.
    """
    result = get_presigned_upload_url(
        filename=body.filename,
        content_type=body.content_type,
        prefix=body.prefix,
    )
    if not result:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="S3 upload is not configured",
        )
    return result
