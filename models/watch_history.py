"""
models/watch_history.py — Watch History Database Model

Stores movies that users have marked as "watched".
"""

from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
from database import Base


class WatchHistory(Base):
    """Each row = one user marking one movie as watched."""

    __tablename__ = "watch_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)  # TMDB movie ID
    watched_at = Column(DateTime(timezone=True), server_default=func.now())