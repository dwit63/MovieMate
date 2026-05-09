"""
routers/profile.py — User Profile API Endpoints

Endpoints:
- GET /api/profile        → Full profile with stats, genre distribution, recent ratings
- GET /api/profile/stats  → Just the activity stats (lighter endpoint)

All endpoints require authentication.
"""

import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from collections import Counter

from database import get_db
from models.user import User
from models.rating import Rating
from models.watchlist import Watchlist
from models.watch_history import WatchHistory
from services.auth_service import get_current_user
from services.tmdb_service import tmdb_service

router = APIRouter(prefix="/api/profile", tags=["Profile"])


@router.get("")
async def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the full user profile with all stats.
    FRONTEND USAGE: Profile page — header, stats, genre chart, recent ratings.
    """
    total_rated = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).count()

    total_watchlist = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).count()

    total_watched = db.query(WatchHistory).filter(
        WatchHistory.user_id == current_user.id
    ).count()

    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).all()

    avg_rating = 0
    if ratings:
        avg_rating = round(sum(r.rating for r in ratings) / len(ratings), 1)

    # Build genre distribution from rated movies — fetch all in parallel
    genre_counter = Counter()

    async def _fetch_genre(rating):
        try:
            return await tmdb_service.get_movie_details(rating.movie_id)
        except Exception as e:
            print(f"Error fetching movie {rating.movie_id} for genre distribution: {e}")
            return None

    genre_results = await asyncio.gather(*[_fetch_genre(r) for r in ratings])
    for movie in genre_results:
        if movie:
            for genre_name in movie.get("genres", []):
                genre_counter[genre_name] += 1

    top_genre = genre_counter.most_common(1)[0][0] if genre_counter else "N/A"

    total_genre_count = sum(genre_counter.values()) or 1
    genre_distribution = []
    for genre_name, count in genre_counter.most_common(6):
        genre_distribution.append({
            "genre": genre_name,
            "count": count,
            "percentage": round((count / total_genre_count) * 100)
        })

    # Recent ratings (last 5)
    recent_ratings_db = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).order_by(Rating.created_at.desc()).limit(5).all()

    # Fetch recent rating movie details in parallel
    async def _fetch_recent(rating):
        try:
            return (rating, await tmdb_service.get_movie_details(rating.movie_id))
        except Exception as e:
            print(f"Error fetching movie {rating.movie_id} for recent ratings: {e}")
            return (rating, None)

    recent_results = await asyncio.gather(*[_fetch_recent(r) for r in recent_ratings_db])
    recent_rated_movies = []
    for rating, movie in recent_results:
        if movie:
            recent_rated_movies.append({
                "movie_id": rating.movie_id,
                "title": movie.get("title", "Unknown"),
                "poster_path": movie.get("poster_path"),
                "rating": rating.rating,
                "rated_at": rating.created_at.isoformat() if rating.created_at else None
            })

    preferred_genres = [ug.genre_name for ug in current_user.user_genres]

    return {
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "member_since": current_user.created_at.isoformat() if current_user.created_at else None,
            "is_onboarded": current_user.is_onboarded,
            "preferred_genres": preferred_genres,
        },
        "stats": {
            "total_rated": total_rated,
            "average_rating": avg_rating,
            "top_genre": top_genre,
            "total_watchlist": total_watchlist,
            "total_watched": total_watched,
        },
        "genre_distribution": genre_distribution,
        "recent_ratings": recent_rated_movies,
    }


@router.get("/stats")
async def get_profile_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get just the activity stats (lighter endpoint — no TMDB calls).
    FRONTEND USAGE: Quick stats display, home page sidebar.
    """
    total_rated = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).count()

    total_watchlist = db.query(Watchlist).filter(
        Watchlist.user_id == current_user.id
    ).count()

    total_watched = db.query(WatchHistory).filter(
        WatchHistory.user_id == current_user.id
    ).count()

    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).all()

    avg_rating = 0
    if ratings:
        avg_rating = round(sum(r.rating for r in ratings) / len(ratings), 1)

    return {
        "total_rated": total_rated,
        "average_rating": avg_rating,
        "total_watchlist": total_watchlist,
        "total_watched": total_watched,
    }
