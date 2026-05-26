"""
S3 presigned URL service for client-side uploads.
Uploads are handled directly by the client to S3; backend only issues presigned URLs.
"""
import uuid
from typing import Optional
from app.config import settings


def get_presigned_upload_url(
    filename: str,
    content_type: str = "image/jpeg",
    prefix: str = "uploads",
) -> Optional[dict]:
    """
    Generate a presigned PUT URL for client to upload a file to S3.
    Returns None if S3 is not configured.
    """
    if not all([
        settings.aws_s3_bucket,
        settings.aws_region,
        settings.aws_access_key_id,
        settings.aws_secret_access_key,
    ]):
        return None

    try:
        import boto3
        from botocore.exceptions import ClientError
    except ImportError:
        return None

    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "bin"
    safe_name = f"{uuid.uuid4().hex}.{ext}"
    key = f"{prefix}/{safe_name}"

    s3_client = boto3.client(
        "s3",
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )

    try:
        url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.aws_s3_bucket,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=900,  # 15 minutes
        )
    except ClientError:
        return None

    # Public URL pattern (if bucket is public); otherwise client can use key to fetch via backend later
    public_url = f"https://{settings.aws_s3_bucket}.s3.{settings.aws_region}.amazonaws.com/{key}"
    return {
        "upload_url": url,
        "key": key,
        "public_url": public_url,
    }
