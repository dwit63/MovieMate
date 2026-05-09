"""
routers/watchlist.py — Watchlist & Watch History API Endpoints

Endpoints:
- GET    /api/watchlist              → Get user's full watchlist with movie details
- GET    /api/watchlist/ids          → Get just the movie IDs (for quick checking)
- POST   /api/watchlist              → Add a movie to watchlist
- DELETE /api/watchlist/{movie_id}   → Remove a movie from watchlist
- POST   /api/watchlist/watched      → Mark a movie as watched (move to history)
- GET    /api/watchlist/history      → Get user's watch history

All endpoints require authentication (JWT token).
"""

import asyncio

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.watchlist import Watchlist
from models.watch_history import WatchHistory
from models.movie import Movie
from services.auth_service import get_current_user
from models.user import User
from services.tmdb_service import tmdb_service

router = APIRouter(prefix="/api/watchlist", tags=["Watchlist"])


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

async def _ensure_movie_exists(movie_id: int, db: Session) -> None:
    """Insert a Movie row if it isn't already in the local movies table."""
    if db.query(Movie).filter(Movie.id == movie_id).first():
        return
    details = await tmdb_service.get_movie_details(movie_id)
    if details and details.get("id"):
        db.add(Movie(
            id=details["id"],
            title=details.get("title", "Unknown"),
            poster_path=details.get("poster_path"),
            release_date=details.get("release_date"),
            vote_average=details.get("vote_average"),
            genres=",".join(details.get("genres", [])),
        ))
        db.flush()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's full watchlist with movie details from TMDB.

    FRONTEND USAGE:
    - Watchlist page: Shows all saved movies with posters, titles, ratings
    - Home page: "From Your Watchlist" section

    HOW IT WORKS:
    1. Get all watchlist entries for this user from the database
    2. For each movie ID, fetch the movie details from TMDB
    3. Return the combined data

    This is slightly slow because we make multiple TMDB calls.
    For a production app, you'd cache this data. For a university
    project, it's perfectly fine.
    """
    # Get all watchlist entries for this user, newest first
    watchlist_entries = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).order_by(Watchlist.added_at.desc()).all()

    # Early return if watchlist is empty
    if not watchlist_entries:
        return {"movies": [], "total": 0}

    # Fetch all movie details from TMDB in parallel
    async def fetch_one(entry):
        try:
            movie = await tmdb_service.get_movie_details(entry.movie_id)
            if movie and "id" in movie:
                movie["added_at"] = entry.added_at.isoformat() if entry.added_at else None
                movie["watchlist_id"] = entry.id
                return movie
            return None
        except Exception as e:
            print(f"Error fetching movie {entry.movie_id}: {e}")
            return None

    results = await asyncio.gather(*[fetch_one(e) for e in watchlist_entries])
    movies = [m for m in results if m is not None]

    return {
        "movies": movies,
        "total": len(movies)
    }


@router.get("/ids")
async def get_watchlist_ids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get just the movie IDs in the user's watchlist.

    FRONTEND USAGE:
    - Called on app load to know which movies are bookmarked
    - Used by MovieCard to show "✓ In Watchlist" vs "+ Add to Watchlist"
    - Much faster than fetching full details for every movie

    WHY THIS EXISTS:
    The full watchlist endpoint fetches details from TMDB for every movie,
    which is slow. This endpoint just returns IDs from our database —
    it's instant. The frontend calls this once on load and stores the
    IDs in React state.
    """
    watchlist_entries = db.query(Watchlist.movie_id).filter(
        Watchlist.user_id == current_user.id
    ).all()

    # Extract just the movie IDs into a flat list
    movie_ids = [entry.movie_id for entry in watchlist_entries]

    return {"movie_ids": movie_ids}


@router.post("")
async def add_to_watchlist(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a movie to the user's watchlist.

    FRONTEND USAGE:
    - "Add to Watchlist" button on MovieDetail page
    - Bookmark icon on any MovieCard
    - Hero banner "Add to Watchlist" button on Home page

    Frontend sends: { "movie_id": 550 }
    """
    movie_id = data.get("movie_id")

    if not movie_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="movie_id is required"
        )

    # Check if already in watchlist
    existing = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movie is already in your watchlist"
        )

    # Ensure the movie exists in the local movies table (FK requirement)
    await _ensure_movie_exists(movie_id, db)

    # Add to watchlist
    new_entry = Watchlist(
        user_id=current_user.id,
        movie_id=movie_id
    )
    db.add(new_entry)
    db.commit()

    return {
        "message": "Added to watchlist!",
        "movie_id": movie_id
    }


@router.delete("/{movie_id}")
async def remove_from_watchlist(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a movie from the user's watchlist.

    FRONTEND USAGE:
    - Trash/delete button on Watchlist page cards
    - Toggle: clicking "✓ In Watchlist" removes it

    Example request: DELETE /api/watchlist/550
    """
    entry = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie_id
    ).first()

    if not entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movie not found in your watchlist"
        )

    db.delete(entry)
    db.commit()

    return {
        "message": "Removed from watchlist",
        "movie_id": movie_id
    }


@router.post("/watched")
async def mark_as_watched(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a movie as watched.

    This does two things:
    1. Removes the movie from the watchlist (if it's there)
    2. Adds the movie to the watch history

    FRONTEND USAGE:
    - "Watched" button on Watchlist page cards
    - After marking as watched, the card disappears from watchlist

    Frontend sends: { "movie_id": 550 }
    """
    movie_id = data.get("movie_id")

    if not movie_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="movie_id is required"
        )

    # Ensure the movie exists in the local movies table (FK requirement)
    await _ensure_movie_exists(movie_id, db)

    # Remove from watchlist if present
    watchlist_entry = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id,
        Watchlist.movie_id == movie_id
    ).first()

    if watchlist_entry:
        db.delete(watchlist_entry)

    # Check if already in watch history
    existing_history = db.query(WatchHistory).filter(
        WatchHistory.user_id == current_user.id,
        WatchHistory.movie_id == movie_id
    ).first()

    if not existing_history:
        # Add to watch history
        history_entry = WatchHistory(
            user_id=current_user.id,
            movie_id=movie_id
        )
        db.add(history_entry)

    db.commit()

    return {
        "message": "Marked as watched!",
        "movie_id": movie_id
    }


@router.get("/history")
async def get_watch_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the user's watch history.

    FRONTEND USAGE:
    - Profile page: watch history count
    - Could be used for a "Movies You've Watched" section

    Returns just movie IDs and timestamps (no TMDB details to keep it fast).
    """
    history_entries = db.query(WatchHistory).filter(
        WatchHistory.user_id == current_user.id
    ).order_by(WatchHistory.watched_at.desc()).all()

    history = []
    for entry in history_entries:
        history.append({
            "movie_id": entry.movie_id,
            "watched_at": entry.watched_at.isoformat() if entry.watched_at else None
        })

    return {
        "history": history,
        "total": len(history)
    }
