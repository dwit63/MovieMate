"""
services/auth_service.py — Authentication Service

This file contains the core authentication logic:
1. Password hashing (bcrypt) — scramble passwords before storing
2. Password verification — check if a typed password matches the hash
3. JWT token creation — generate a "wristband" after login
4. JWT token decoding — read the "wristband" to identify the user

HOW JWT WORKS:
1. User logs in with email + password
2. Backend verifies the password
3. Backend creates a JWT token containing the user's ID
4. Frontend stores this token (in localStorage)
5. Frontend sends this token with every request (in the Authorization header)
6. Backend reads the token to know who's making the request
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from config import settings
from database import get_db
from models.user import User

# bcrypt context for password hashing
# "bcrypt" is the hashing algorithm — it's slow on purpose (makes brute-force attacks harder)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme — tells FastAPI to look for a "Bearer token" in the Authorization header
# tokenUrl is the endpoint where tokens are issued (for Swagger UI docs)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    """
    Scramble a plain text password.

    Example:
      "mypassword123" → "$2b$12$LJ3m5R1z...." (unreadable hash)

    The same password always produces a DIFFERENT hash (due to random salt).
    This means even if two users have the same password, their hashes are different.
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a typed password matches a stored hash.

    bcrypt internally extracts the salt from the hash and re-hashes
    the plain password to compare. Returns True if they match.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT token.

    The token contains:
    - Whatever data you pass in (we pass the user's ID as "sub")
    - An expiry time ("exp") — after this time, the token is invalid

    The token is SIGNED with our secret key, so no one can tamper with it.
    If someone changes the data inside, the signature won't match and we'll reject it.
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Read and verify a JWT token.

    Returns the data inside the token if valid.
    Returns None if the token is expired, tampered with, or invalid.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError:
        return None


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency function — extracts the current logged-in user from the JWT token.

    HOW IT'S USED:
    When you add this as a parameter to any endpoint, FastAPI will automatically:
    1. Extract the Bearer token from the request header
    2. Decode it to get the user ID
    3. Look up the user in the database
    4. Pass the user object to your endpoint function

    If the token is invalid or the user doesn't exist, it raises a 401 error.

    Usage in an endpoint:
      @router.get("/me")
      async def get_me(current_user: User = Depends(get_current_user)):
          return current_user
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Decode the token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Get user ID from the token payload
    user_id: str = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    # Look up the user in the database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user