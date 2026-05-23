"""
schemas/user.py — User Request/Response Schemas (Pydantic)

WHAT ARE SCHEMAS?
Schemas define the SHAPE of data coming in (requests) and going out (responses).
- When a user signs up, the frontend sends {name, email, password} — that's a request schema
- The backend responds with {id, name, email, token} — that's a response schema

Pydantic validates the data automatically:
- If someone sends an email without @, Pydantic rejects it
- If a required field is missing, Pydantic returns an error

This is DIFFERENT from models:
- Models = database table structure (what's stored)
- Schemas = API data structure (what's sent/received)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for signup request — what the frontend sends."""
    name: str = Field(..., min_length=1, max_length=100, description="User's display name")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., min_length=8, description="Password (min 8 characters)")


class UserLogin(BaseModel):
    """Schema for login request."""
    email: str
    password: str


class GoogleAuthRequest(BaseModel):
    """Schema for Google Sign-In request."""
    credential: str


class UserResponse(BaseModel):
    """Schema for user data in responses — what the backend sends back.
    Notice: NO password field here. Never send passwords back!"""
    id: int
    name: str
    email: str
    genres: List[str] = []       # populated from the user_genres relationship
    is_onboarded: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows creating this from a SQLAlchemy model object


class UserUpdate(BaseModel):
    """Schema for updating profile."""
    name: Optional[str] = None
    password: Optional[str] = None
    genres: Optional[List[str]] = None   # replaces preferred_genres JSON string
    is_onboarded: Optional[bool] = None


class AuthResponse(BaseModel):
    """Schema for login/signup response — includes the JWT token."""
    token: str
    user: UserResponse
    message: str = "Success"
