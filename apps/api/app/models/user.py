from __future__ import annotations
from typing import Optional
from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
import uuid

class UserBase(SQLModel):
    email: str = Field(unique=True, index=True)
    name: Optional[str] = None
    phone: Optional[str] = None
    tier: str = "FREE"
    storage_used: int = 0
    is_active: bool = True
    is_verified: bool = False
    is_superadmin: bool = False

class User(UserBase, table=True):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
