from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from app.db.database import get_session
import structlog

logger = structlog.get_logger()
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
):
    token = credentials.credentials
    if not token:
        logger.warning("auth_failed_missing_token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authentication token"
        )
        
    from app.core.security import verify_token
    from app.models.user import User
    from app.core.exceptions import AuraException
    
    user_id = verify_token(token, token_type="access")
    user = session.get(User, user_id)
    if not user:
        raise AuraException("User not found", status.HTTP_404_NOT_FOUND)
        
    return user
