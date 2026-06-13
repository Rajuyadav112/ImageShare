from fastapi import APIRouter, Depends, status, Request
from sqlmodel import Session
from app.db.database import get_session
from app.schemas.image import PresignRequest, PresignResponse, ImageConfirmRequest, ImageResponse
from app.services.storage_service import StorageService
from app.models.image import Image
from app.models.user import User
from app.api.dependencies import get_current_user
from app.core.exceptions import AuraException
import datetime

router = APIRouter(tags=["Images"])

def get_storage_service() -> StorageService:
    return StorageService()

@router.post("/presign", response_model=PresignResponse)
def get_presigned_url(
    payload: PresignRequest, 
    request: Request,
    storage: StorageService = Depends(get_storage_service)
    # TODO: optionally inject current_user to check if is_anonymous
):
    # Pass host from request headers if available to construct local mock URLs
    host = request.headers.get("host", "localhost:8000")
    scheme = request.url.scheme
    base_url = f"{scheme}://{host}"

    # Defaulting to anonymous for now
    data = storage.generate_presigned_upload(
        filename=payload.filename,
        mime_type=payload.mime_type,
        size=payload.size,
        is_anonymous=True,
        base_url=base_url
    )
    return PresignResponse(**data)

@router.post("/confirm", response_model=ImageResponse, status_code=status.HTTP_201_CREATED)
def confirm_upload(
    request: ImageConfirmRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # In a real app, you'd check R2 here using a HEAD request to ensure the file actually exists
    # For now, we trust the client and save metadata
    
    image_url = request.public_url if request.public_url else f"https://i.imageshare.com/{request.image_id}"
    db_image = Image(
        id=request.image_id,
        url=image_url,
        mime_type=request.mime_type or "image/unknown",
        size=request.size or 0,
        user_id=current_user.id,
        delete_token=request.delete_token
    )
    
    session.add(db_image)
    
    # Update user's storage consumption
    current_user.storage_used += db_image.size
    session.add(current_user)
    
    session.commit()
    session.refresh(db_image)
    
    return ImageResponse(
        id=db_image.id,
        url=db_image.url,
        mime_type=db_image.mime_type,
        size=db_image.size,
        created_at=db_image.created_at.isoformat(),
        delete_token=db_image.delete_token
    )

@router.put("/mock-upload/{object_name}")
async def mock_upload(object_name: str, request: Request):
    import os
    # Ensure static uploads directory exists
    os.makedirs("static/uploads", exist_ok=True)
    
    # Read the incoming binary body stream
    content = await request.body()
    
    # Save the file locally on the server disk
    file_path = os.path.join("static/uploads", object_name)
    with open(file_path, "wb") as f:
        f.write(content)
        
    return {"status": "ok", "message": "Mock upload successful"}

@router.get("/me", response_model=list[ImageResponse])
def get_my_images(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    from sqlmodel import select
    # Fetch all images owned by the user
    images = session.exec(select(Image).where(Image.user_id == current_user.id)).all()
    
    return [
        ImageResponse(
            id=img.id,
            url=img.url,
            mime_type=img.mime_type,
            size=img.size,
            created_at=img.created_at.isoformat(),
            delete_token=img.delete_token
        ) for img in images
    ]

@router.delete("/{image_id}")
def delete_image(
    image_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service)
):
    image = session.get(Image, image_id)
    if not image:
        raise AuraException("Image not found", status.HTTP_404_NOT_FOUND)
        
    # Standard user can only delete their own images; superadmin can delete any
    if image.user_id != current_user.id and not current_user.is_superadmin:
        raise AuraException("You do not have permission to delete this image", status.HTTP_403_FORBIDDEN)
        
    # Delete from storage
    object_name = image.url.split("/")[-1]
    storage.delete_image(object_name)
    
    # Subtract storage usage
    owner = current_user
    if image.user_id != current_user.id:
        owner = session.get(User, image.user_id)
        
    if owner:
        owner.storage_used = max(0, owner.storage_used - image.size)
        session.add(owner)
        
    session.delete(image)
    session.commit()
    
    return {"status": "ok", "message": "Image deleted successfully"}

@router.post("/{image_id}/remove-bg", response_model=ImageResponse)
def remove_image_background(
    image_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
    storage: StorageService = Depends(get_storage_service)
):
    import os
    import rembg
    import uuid
    import secrets
    from sqlmodel import select
    from app.core.config import settings
    
    # 1. Fetch image record from DB
    image = session.get(Image, image_id)
    if not image:
        raise AuraException("Image not found", status.HTTP_404_NOT_FOUND)
        
    # 2. Check ownership
    if image.user_id != current_user.id and not current_user.is_superadmin:
        raise AuraException("You do not have permission to modify this image", status.HTTP_403_FORBIDDEN)
        
    # 3. Read raw image bytes
    object_name = image.url.split("/")[-1]
    input_bytes = None
    
    if not storage.r2_configured:
        # Local mock development fallback: read directly from disk
        file_path = os.path.join("static/uploads", object_name)
        if not os.path.exists(file_path):
            raise AuraException("Physical image file not found on server", status.HTTP_404_NOT_FOUND)
        with open(file_path, "rb") as f:
            input_bytes = f.read()
    else:
        # Download from Cloudflare R2
        try:
            response = storage.s3_client.get_object(Bucket=storage.bucket, Key=object_name)
            input_bytes = response["Body"].read()
        except Exception as e:
            # Fallback to requests download if s3 fails
            try:
                import requests
                resp = requests.get(image.url)
                if resp.status_code == 200:
                    input_bytes = resp.content
            except Exception:
                pass
            if not input_bytes:
                raise AuraException(f"Failed to fetch image from storage: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)

    # 4. Remove background using rembg
    try:
        output_bytes = rembg.remove(input_bytes)
    except Exception as e:
        raise AuraException(f"Failed to remove background: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    # 5. Generate new unique ID & filename for the transparent version
    new_id = f"{image_id}_nobg"
    # Make sure it's unique by checking if it exists
    existing = session.get(Image, new_id)
    if existing:
        new_id = f"{image_id}_nobg_{str(uuid.uuid4())[:4]}"
        
    # Split filename and append _nobg, extension is always png for transparent images
    name_parts = object_name.rsplit(".", 1)
    base_name = name_parts[0]
    new_object_name = f"{base_name}_nobg.png"
    
    # 6. Save transparent output
    public_url = None
    delete_token = secrets.token_urlsafe(16)
    
    if not storage.r2_configured:
        # Save locally
        os.makedirs("static/uploads", exist_ok=True)
        new_file_path = os.path.join("static/uploads", new_object_name)
        with open(new_file_path, "wb") as f:
            f.write(output_bytes)
        
        # Derive public URL from the original image URL
        url_base = image.url.rsplit("/", 2)[0]
        public_url = f"{url_base}/uploads/{new_object_name}"
    else:
        # Upload to Cloudflare R2
        try:
            storage.s3_client.put_object(
                Bucket=storage.bucket,
                Key=new_object_name,
                Body=output_bytes,
                ContentType="image/png"
            )
            public_url = f"{settings.R2_PUBLIC_URL_PREFIX}/{new_object_name}"
        except Exception as e:
            raise AuraException(f"Failed to save processed image: {str(e)}", status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    # 7. Register new image in DB
    new_db_image = Image(
        id=new_id,
        url=public_url,
        mime_type="image/png",
        size=len(output_bytes),
        user_id=current_user.id,
        delete_token=delete_token
    )
    
    session.add(new_db_image)
    
    # Update owner's storage quota consumption
    owner = current_user
    if image.user_id != current_user.id:
         owner = session.get(User, image.user_id)
         
    if owner:
         owner.storage_used += new_db_image.size
         session.add(owner)
         
    session.commit()
    session.refresh(new_db_image)
    
    return ImageResponse(
        id=new_db_image.id,
        url=new_db_image.url,
        mime_type=new_db_image.mime_type,
        size=new_db_image.size,
        created_at=new_db_image.created_at.isoformat(),
        delete_token=new_db_image.delete_token
    )
