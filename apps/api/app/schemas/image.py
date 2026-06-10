from pydantic import BaseModel
from typing import Optional

class PresignRequest(BaseModel):
    filename: str
    mime_type: str
    size: int

class PresignResponse(BaseModel):
    image_id: str
    upload_url: str
    public_url: str
    delete_token: Optional[str] = None

class ImageConfirmRequest(BaseModel):
    image_id: str
    delete_token: Optional[str] = None
    public_url: Optional[str] = None
    size: Optional[int] = 0
    mime_type: Optional[str] = "image/unknown"

class ImageResponse(BaseModel):
    id: str
    url: str
    mime_type: str
    size: int
    created_at: str
    delete_token: Optional[str] = None
