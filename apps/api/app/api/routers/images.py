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
    session: Session = Depends(get_session)
):
    # In a real app, you'd check R2 here using a HEAD request to ensure the file actually exists
    # For now, we trust the client and save metadata
    
    # Normally we get the URL and details from a cache populated during the /presign step
    # We will just scaffold the DB insert
    image_url = request.public_url if request.public_url else f"https://i.imageshare.com/{request.image_id}"
    db_image = Image(
        id=request.image_id,
        url=image_url,
        mime_type="image/unknown", # To be fetched from cache/state
        size=0,
        delete_token=request.delete_token
    )
    
    session.add(db_image)
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
def mock_upload(object_name: str):
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
