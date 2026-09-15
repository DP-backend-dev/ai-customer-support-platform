"""Password hashing, JWTs, and bearer authentication."""

import os
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")

try:
    ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"])
    if ACCESS_TOKEN_EXPIRE_MINUTES <= 0:
        raise ValueError
except (KeyError, ValueError) as exc:
    raise RuntimeError("ACCESS_TOKEN_EXPIRE_MINUTES must be a positive integer") from exc

ALGORITHM = "HS256"
password_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return password_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if len(plain_password.encode("utf-8")) > 72:
        return False
    return password_context.verify(plain_password, hashed_password)


def create_access_token(user: User) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(
        {"sub": str(user.id), "email": user.email, "exp": expires_at},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    invalid_token = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired authentication token",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
        email = payload["email"]
        if not isinstance(email, str):
            raise ValueError("Invalid email claim")
    except (JWTError, KeyError, TypeError, ValueError):
        raise invalid_token from None

    user = db.get(User, user_id)
    if user is None or user.email != email:
        raise invalid_token
    return user
