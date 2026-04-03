"""
schemas/movie.py — Movie-related schemas.
Will be expanded in Phase 3 when we add TMDB integration.
"""

from pydantic import BaseModel
from typing import Optional, List


class MovieResponse(BaseModel):
    """Basic movie data structure."""
    id: int
    title: str
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    vote_average: Optional[float] = None
    vote_count: Optional[int] = None
    release_date: Optional[str] = None
    genres: Optional[List[str]] = []
    runtime: Optional[int] = None