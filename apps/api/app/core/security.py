from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import jwt, JWTError
from app.core.config import settings
from app.core.exceptions import AuraException
from fastapi import status

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str | int, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def create_refresh_token(subject: str | int) -> str:
    # Refresh tokens last much longer, e.g., 30 days
    expire = datetime.now(timezone.utc) + timedelta(days=30)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_token(token: str, token_type: str = "access") -> str:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != token_type:
            raise AuraException(f"Invalid token type. Expected {token_type}.", status.HTTP_401_UNAUTHORIZED)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise AuraException("Token missing subject payload.", status.HTTP_401_UNAUTHORIZED)
        return user_id
    except JWTError:
        raise AuraException("Could not validate credentials.", status.HTTP_401_UNAUTHORIZED)
