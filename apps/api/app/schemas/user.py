from pydantic import BaseModel, EmailStr
from typing import Optional

# Request schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    phone: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Response schemas
class UserResponse(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    phone: Optional[str] = None
    tier: str
    storage_used: int
    is_active: bool
    is_superadmin: bool

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class GoogleSyncRequest(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    id: str

