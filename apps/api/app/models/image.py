from __future__ import annotations
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone

class ImageBase(SQLModel):
    user_id: Optional[str] = Field(default=None, foreign_key="user.id")
    url: str
    mime_type: str
    size: int
    is_public: bool = Field(default=True)

class Image(ImageBase, table=True):
    # Using a short nano ID or CUID is preferred, but for scaffolding we use a short string
    id: str = Field(primary_key=True)
    delete_token: Optional[str] = Field(default=None, unique=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
