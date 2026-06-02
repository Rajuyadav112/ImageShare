from fastapi import APIRouter, Depends, status
from sqlmodel import Session
from app.db.database import get_session
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token, RefreshTokenRequest
from app.services.auth_service import AuthService
from app.api.dependencies import get_current_user
from app.models.user import User

router = APIRouter(tags=["Authentication"])

def get_auth_service(session: Session = Depends(get_session)) -> AuthService:
    return AuthService(session=session)

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(user_in: UserCreate, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.create_user(user_in)

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.authenticate_user(user_in)

@router.post("/refresh", response_model=Token)
def refresh_token(refresh_request: RefreshTokenRequest, auth_service: AuthService = Depends(get_auth_service)):
    return auth_service.refresh_token(refresh_request.refresh_token)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
