from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
import uuid

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None
    tier: str = Field(default="FREE")
    storage_used: int = Field(default=0)
    is_active: bool = Field(default=True)
    is_verified: bool = Field(default=False)

class User(UserBase, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
