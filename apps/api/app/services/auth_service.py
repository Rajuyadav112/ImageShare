from sqlmodel import Session, select
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token, create_refresh_token
from app.core.exceptions import AuraException
from fastapi import status

class AuthService:
    def __init__(self, session: Session):
        self.session = session

    def create_user(self, user_in: UserCreate) -> User:
        user = self.session.exec(select(User).where(User.email == user_in.email)).first()
        if user:
            raise AuraException("User with this email already exists.", status.HTTP_400_BAD_REQUEST)
        
        db_user = User(
            email=user_in.email,
            name=user_in.name,
            hashed_password=get_password_hash(user_in.password)
        )
        self.session.add(db_user)
        self.session.commit()
        self.session.refresh(db_user)
        return db_user

    def authenticate_user(self, user_in: UserLogin) -> Token:
        user = self.session.exec(select(User).where(User.email == user_in.email)).first()
        if not user or not verify_password(user_in.password, user.hashed_password):
            raise AuraException("Incorrect email or password", status.HTTP_401_UNAUTHORIZED)
        
        return Token(
            access_token=create_access_token(subject=user.id),
            refresh_token=create_refresh_token(subject=user.id)
        )
        
    def refresh_token(self, refresh_token: str) -> Token:
        from app.core.security import verify_token
        user_id = verify_token(refresh_token, token_type="refresh")
        user = self.session.get(User, user_id)
        if not user:
            raise AuraException("User not found", status.HTTP_404_NOT_FOUND)
            
        return Token(
            access_token=create_access_token(subject=user.id),
            refresh_token=create_refresh_token(subject=user.id)
        )
