"""
routers/auth.py — Authentication API Endpoints
"""

import json
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from models.rating import Rating
from schemas.user import UserCreate, UserLogin, UserResponse, UserUpdate, AuthResponse
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    hashed_pw = hash_password(user_data.password)

    new_user = User(
        name=user_data.name,
        email=user_data.email,
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id)})

    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(new_user),
        message="Account created successfully!"
    )


@router.post("/login", response_model=AuthResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    token = create_access_token(data={"sub": str(user.id)})

    return AuthResponse(
        token=token,
        user=UserResponse.model_validate(user),
        message="Logged in successfully!"
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if update_data.name is not None:
        current_user.name = update_data.name

    if update_data.password is not None:
        current_user.hashed_password = hash_password(update_data.password)

    if update_data.preferred_genres is not None:
        current_user.preferred_genres = update_data.preferred_genres

    if update_data.is_onboarded is not None:
        current_user.is_onboarded = update_data.is_onboarded

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)


@router.post("/onboarding")
async def complete_onboarding(
    onboarding_data: dict = Body(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Save preferred genres
    genres = onboarding_data.get("preferred_genres", [])
    current_user.preferred_genres = json.dumps(genres)
    current_user.is_onboarded = True

    # Force SQLAlchemy to track changes
    db.add(current_user)

    # Save initial movie ratings
    ratings = onboarding_data.get("ratings", [])
    for r in ratings:
        existing = db.query(Rating).filter(
            Rating.user_id == current_user.id,
            Rating.movie_id == r["movie_id"]
        ).first()

        if existing:
            existing.rating = r["rating"]
        else:
            new_rating = Rating(
                user_id=current_user.id,
                movie_id=r["movie_id"],
                rating=r["rating"]
            )
            db.add(new_rating)

    db.commit()
    db.refresh(current_user)

    return {
        "message": "Onboarding completed successfully!",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "preferred_genres": current_user.preferred_genres,
            "is_onboarded": current_user.is_onboarded,
            "created_at": str(current_user.created_at)
        }
    }