import boto3
from botocore.exceptions import ClientError
from app.core.config import settings
import uuid
import secrets
from fastapi import status
from app.core.exceptions import AuraException
import structlog

logger = structlog.get_logger()

class StorageService:
    def __init__(self):
        # Configure Boto3 to work with Cloudflare R2
        self.bucket = settings.R2_BUCKET_NAME
        self.allowed_mime_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
        
        # Check if R2 credentials are placeholders or empty
        is_placeholder = (
            settings.R2_ACCOUNT_ID == "your_cloudflare_account_id" or
            settings.R2_ACCESS_KEY_ID == "your_r2_access_key" or
            settings.R2_SECRET_ACCESS_KEY == "your_r2_secret_key" or
            not settings.R2_ACCOUNT_ID or
            not settings.R2_ACCESS_KEY_ID or
            not settings.R2_SECRET_ACCESS_KEY
        )
        
        if is_placeholder:
            logger.warning("r2_credentials_are_placeholders_using_mock_fallback")
            self.r2_configured = False
            self.s3_client = None
        else:
            try:
                self.s3_client = boto3.client(
                    service_name="s3",
                    endpoint_url=f"https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
                    aws_access_key_id=settings.R2_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
                    region_name="auto",
                )
                self.r2_configured = True
            except Exception as e:
                logger.error("r2_init_failed", error=str(e))
                self.r2_configured = False
                self.s3_client = None

    def generate_presigned_upload(self, filename: str, mime_type: str, size: int, is_anonymous: bool = True, base_url: str = "http://localhost:8000") -> dict:
        if mime_type not in self.allowed_mime_types:
            raise AuraException(f"Unsupported file type: {mime_type}", status.HTTP_400_BAD_REQUEST)
            
        max_size = settings.MAX_UPLOAD_SIZE_ANONYMOUS if is_anonymous else settings.MAX_UPLOAD_SIZE_FREE
        if size > max_size:
            raise AuraException(f"File size exceeds limit of {max_size / (1024*1024)}MB", status.HTTP_400_BAD_REQUEST)

        # Generate unique short ID (in a real app, use nanoid)
        image_id = str(uuid.uuid4())[:8] 
        extension = filename.split('.')[-1] if '.' in filename else ''
        object_name = f"{image_id}.{extension}" if extension else image_id
        
        delete_token = secrets.token_urlsafe(16) if is_anonymous else None

        if not self.r2_configured:
            # Fallback mock for local development when R2 is not configured/throws ValueError
            logger.warning("r2_not_configured_using_mock_url")
            return {
                "image_id": image_id,
                "object_name": object_name,
                "upload_url": f"{base_url}/api/v1/images/mock-upload/{object_name}",
                "public_url": f"{base_url}/static/uploads/{object_name}",
                "delete_token": delete_token
            }

        try:
            # Generate the presigned URL for direct upload
            presigned_url = self.s3_client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": self.bucket,
                    "Key": object_name,
                    "ContentType": mime_type,
                },
                ExpiresIn=600 # 10 minutes
            )
        except ClientError as e:
            logger.error("r2_presign_failed", error=str(e))
            raise AuraException("Failed to generate upload URL", status.HTTP_500_INTERNAL_SERVER_ERROR)

        return {
            "image_id": image_id,
            "object_name": object_name,
            "upload_url": presigned_url,
            "public_url": f"{settings.R2_PUBLIC_URL_PREFIX}/{object_name}",
            "delete_token": delete_token
        }

    def delete_image(self, object_name: str) -> bool:
        if not self.r2_configured:
            import os
            try:
                file_path = os.path.join("static/uploads", object_name)
                if os.path.exists(file_path):
                    os.remove(file_path)
                return True
            except Exception as e:
                logger.error("mock_delete_failed", error=str(e))
                return False
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=object_name)
            return True
        except ClientError as e:
            logger.error("r2_delete_failed", error=str(e))
            return False
