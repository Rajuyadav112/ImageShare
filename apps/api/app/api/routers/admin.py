from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from app.db.database import get_session
from app.api.dependencies import get_current_superadmin
from app.models.user import User
from app.models.image import Image
from app.schemas.user import UserResponse
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/admin", tags=["Superadmin Dashboard"])

class SystemStatsResponse(BaseModel):
    total_users: int
    total_images: int
    total_storage_bytes: int

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

class UserTierUpdateRequest(BaseModel):
    tier: str

@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    session: Session = Depends(get_session),
    current_admin = Depends(get_current_superadmin)
):
    """
    Get all users registered in the system (Admin only)
    """
    users = session.exec(select(User)).all()
    return users

@router.put("/users/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    payload: UserStatusUpdateRequest,
    session: Session = Depends(get_session),
    current_admin = Depends(get_current_superadmin)
):
    """
    Ban (deactivate) or activate a user account
    """
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Protect owner from being deactivated
    if user.email == "rajuyadav84211@gmail.com" and not payload.is_active:
        raise HTTPException(status_code=400, detail="Cannot deactivate the system owner account")
        
    user.is_active = payload.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.put("/users/{user_id}/tier", response_model=UserResponse)
def update_user_tier(
    user_id: str,
    payload: UserTierUpdateRequest,
    session: Session = Depends(get_session),
    current_admin = Depends(get_current_superadmin)
):
    """
    Modify a user's subscription tier (FREE vs PRO)
    """
    tier_upper = payload.tier.upper()
    if tier_upper not in ["FREE", "PRO"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Allowed values: FREE, PRO")
        
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.tier = tier_upper
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@router.get("/stats", response_model=SystemStatsResponse)
def get_system_stats(
    session: Session = Depends(get_session),
    current_admin = Depends(get_current_superadmin)
):
    """
    Fetch global platform statistics
    """
    # Total Users
    total_users = session.exec(select(func.count(User.id))).one()
    
    # Total Images
    total_images = session.exec(select(func.count(Image.id))).one()
    
    # Total Storage Bytes
    sum_size = session.exec(select(func.sum(Image.size))).one()
    total_storage_bytes = sum_size if sum_size is not None else 0
    
    return SystemStatsResponse(
        total_users=total_users,
        total_images=total_images,
        total_storage_bytes=total_storage_bytes
    )
