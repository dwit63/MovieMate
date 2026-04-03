"""
models/watchlist.py — Watchlist Database Model

Stores movies that users have saved to watch later.
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class Watchlist(Base):
    """Each row = one user saving one movie to their watchlist."""

    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)  # TMDB movie ID
    added_at = Column(DateTime(timezone=True), server_default=func.now())
    