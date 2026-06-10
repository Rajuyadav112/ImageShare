from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlmodel import Session
from app.db.database import get_session
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, RefreshTokenRequest, GoogleSyncRequest
from app.services.auth_service import AuthService
from app.api.dependencies import get_current_user
from app.models.user import User
from app.services.email_service import EmailService
from app.core.security import create_access_token, create_refresh_token

router = APIRouter(tags=["Authentication"])
email_service = EmailService()

def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    return AuthService(session=session)

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(
    user_in: UserCreate, 
    background_tasks: BackgroundTasks,
    auth_service: AuthService = Depends(get_auth_service)
):
    user = auth_service.create_user(user_in)
    background_tasks.add_task(email_service.send_welcome_email, user.email, user.name or user.email)
    return user

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.authenticate_user(user_in)

@router.post("/google-sync", response_model=Token)
def google_sync(
    sync_in: GoogleSyncRequest,
    background_tasks: BackgroundTasks,
    auth_service: AuthService = Depends(get_auth_service)
):
    user, is_new = auth_service.google_sync_user(
        email=sync_in.email,
        name=sync_in.name or sync_in.email,
        external_id=sync_in.id
    )
    if is_new:
        background_tasks.add_task(email_service.send_welcome_email, user.email, user.name or user.email)
        
    return Token(
        access_token=create_access_token(subject=user.id),
        refresh_token=create_refresh_token(subject=user.id)
    )

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_request: RefreshTokenRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.refresh_token(refresh_request.refresh_token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

