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
        
        is_admin = True if user_in.email == "rajuyadav84211@gmail.com" else False
        phone_number = "8421125950" if user_in.email == "rajuyadav84211@gmail.com" else user_in.phone
        if not phone_number or not phone_number.strip():
            raise AuraException("Mobile number is required.", status.HTTP_400_BAD_REQUEST)

        db_user = User(
            email=user_in.email,
            name=user_in.name,
            phone=phone_number.strip(),
            hashed_password=get_password_hash(user_in.password),
            is_superadmin=is_admin
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

    def google_sync_user(self, email: str, name: str, external_id: str) -> tuple[User, bool]:
        user = self.session.exec(select(User).where(User.email == email)).first()
        is_new = False
        
        if not user:
            is_new = True
            is_admin = True if email == "rajuyadav84211@gmail.com" else False
            phone_number = "8421125950" if email == "rajuyadav84211@gmail.com" else None
            import uuid
            
            user = User(
                id=external_id,
                email=email,
                name=name,
                phone=phone_number,
                hashed_password=get_password_hash(str(uuid.uuid4())),
                is_superadmin=is_admin,
                is_verified=True
            )
            self.session.add(user)
            self.session.commit()
            self.session.refresh(user)
        else:
            if not user.is_verified:
                user.is_verified = True
                self.session.add(user)
                self.session.commit()
                self.session.refresh(user)
                
        return user, is_new

