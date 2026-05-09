"""
models/user_genre.py — UserGenre Database Model

Normalised replacement for the old preferred_genres JSON column on users.
Each row stores one genre preference for one user (1NF compliant).
"""

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base


class UserGenre(Base):
    __tablename__ = "user_genres"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    genre_name = Column(String(100), nullable=False)

    user = relationship("User", back_populates="user_genres")
