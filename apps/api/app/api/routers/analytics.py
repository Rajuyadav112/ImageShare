from fastapi import APIRouter, Depends
from sqlmodel import Session, select, func
from app.db.database import get_session
from app.models.user import User
from app.models.image import Image
from app.api.dependencies import get_current_user
from app.schemas.analytics import AnalyticsResponse

router = APIRouter(tags=["Analytics"])

@router.get("/me", response_model=AnalyticsResponse)
def get_my_analytics(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    # Calculate total images
    total_uploads = session.exec(
        select(func.count(Image.id)).where(Image.user_id == current_user.id)
    ).one_or_none() or 0
    
    # Calculate total bandwidth/storage used (sum of size in bytes)
    total_bytes = session.exec(
        select(func.sum(Image.size)).where(Image.user_id == current_user.id)
    ).one_or_none() or 0
    
    return AnalyticsResponse(
        total_uploads=total_uploads,
        total_bandwidth_bytes=total_bytes,
        ai_quota_used=min(total_uploads, 50), # Mock AI quota matching uploads up to 50
        ai_quota_total=50
    )
