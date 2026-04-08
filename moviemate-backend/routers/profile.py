"""
routers/profile.py — User Profile API Endpoints

Endpoints:
- GET /api/profile        → Full profile with stats, genre distribution, recent ratings
- GET /api/profile/stats  → Just the activity stats (lighter endpoint)

All endpoints require authentication.
"""

import json
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

    # Build genre distribution from rated movies
    genre_counter = Counter()

    for rating in ratings:
        try:
            movie = await tmdb_service.get_movie_details(rating.movie_id)
            if movie:
                for genre_name in movie.get("genres", []):
                    genre_counter[genre_name] += 1
        except Exception:
            continue

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

    recent_rated_movies = []
    for rating in recent_ratings_db:
        try:
            movie = await tmdb_service.get_movie_details(rating.movie_id)
            if movie:
                recent_rated_movies.append({
                    "movie_id": rating.movie_id,
                    "title": movie.get("title", "Unknown"),
                    "poster_path": movie.get("poster_path"),
                    "rating": rating.rating,
                    "rated_at": rating.created_at.isoformat() if rating.created_at else None
                })
        except Exception:
            continue

    try:
        preferred_genres = json.loads(current_user.preferred_genres or "[]")
    except json.JSONDecodeError:
        preferred_genres = []

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
