"""
routers/auth.py — Authentication API Endpoints

This file defines the actual API URLs that the frontend calls:
- POST /api/auth/signup → Create a new account
- POST /api/auth/login  → Log into existing account
- GET  /api/auth/me     → Get current user's info (requires token)
- PUT  /api/auth/profile → Update user profile (requires token)

WHAT IS A ROUTER?
A router groups related endpoints together. All auth-related endpoints
go in this file, all movie endpoints go in movies.py, etc.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, AuthResponse
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

# Create the router — all endpoints in this file will be prefixed with /api/auth
router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create a new user account.

    WHAT HAPPENS:
    1. Frontend sends: {name, email, password}
    2. We check if the email is already taken
    3. We hash the password (NEVER store plain text!)
    4. We save the new user to the database
    5. We create a JWT token
    6. We send back the token + user info

    The frontend will store the token and use it for future requests.
    """

    # Step 1: Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    # Step 2: Hash the password
    hashed_pw = hash_password(user_data.password)

    # Step 3: Create the user in the database
    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_pw,
    )
    db.add(new_user)      # Stage the new user for insertion
    db.commit()           # Actually write to the database
    db.refresh(new_user)  # Reload the user to get the auto-generated ID

    # Step 4: Create JWT token with user's ID
    token = create_access_token(data={"sub": str(new_user.id)})

    # Step 5: Return the token and user info
    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(new_user),
        message="Account created successfully!"
    )


@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """
    Log into an existing account.

    WHAT HAPPENS:
    1. Frontend sends: {email, password}
    2. We find the user by email
    3. We verify the password against the stored hash
    4. We create a JWT token
    5. We send back the token + user info
    """

    # Step 1: Find user by email
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Step 2: Verify password
    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Step 3: Create JWT token
    token = create_access_token(data={"sub": str(user.id)})

    # Step 4: Return token + user info
    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(user),
        message="Logged in successfully!"
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Get the current logged-in user's info.

    HOW IT WORKS:
    - The frontend sends a request with the JWT token in the header
    - get_current_user extracts the user from the token automatically
    - We just return the user object

    This endpoint is called when the app loads to check if the user
    is still logged in (token still valid).
    """
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update user profile.

    Only updates the fields that are provided (not None).
    If password is provided, it's hashed before storing.
    """

    # Update only the fields that were sent
    if update_data.name is not None:
        current_user.name = update_data.name

    if update_data.password is not None:
        current_user.hashed_password = hash_password(update_data.password)

    if update_data.preferred_genres is not None:
        current_user.preferred_genres = update_data.preferred_genres

    if update_data.is_onboarded is not None:
        current_user.is_onboarded = update_data.is_onboarded

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)