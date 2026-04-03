"""
schemas/rating.py — Rating-related schemas.
Will be expanded in Phase 5 when we add ratings functionality.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RatingCreate(BaseModel):
    """Schema for creating a rating."""
    movie_id: int
    rating: float = Field(..., ge=1.0, le=5.0, description="Rating from 1 to 5")


class RatingResponse(BaseModel):
    """Schema for rating response."""
    id: int
    user_id: int
    movie_id: int
    rating: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True