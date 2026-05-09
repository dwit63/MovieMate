"""
models/rating.py — Rating Database Model

Stores movie ratings given by users (1-5 stars).
movie_id references movies.id so every rated movie is tracked locally.
"""

from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Rating(Base):
    """Each row = one user rating one movie."""

    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    rating = Column(Float, nullable=False)  # 1.0 to 5.0
    created_at = Column(DateTime(timezone=True), server_default=func.now())
