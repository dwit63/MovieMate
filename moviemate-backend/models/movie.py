"""
models/movie.py — Movie Database Model

A local cache of TMDB movie data.  The primary key is the TMDB movie ID
(not auto-generated) so it doubles as a foreign-key target for ratings,
watchlist, and watch_history rows.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, autoincrement=False)  # TMDB movie ID
    title = Column(String(500), nullable=False)
    poster_path = Column(String(500), nullable=True)
    release_date = Column(String(20), nullable=True)
    vote_average = Column(Float, nullable=True)
    genres = Column(String(500), nullable=True)  # comma-separated genre names
    created_at = Column(DateTime, server_default=func.now())
