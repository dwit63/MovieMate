"""
routers/recommendations.py — Recommendation API Endpoints

These endpoints power the Mood page, Recommendations page,
and "Recommended For You" section on the Home page.

Endpoints:
- GET /api/recommend/moods              → List of all available moods
- GET /api/recommend/mood/{mood}        → Movies for a mood (Mood page)
- GET /api/recommend/personalized       → "For You" recommendations (Home + Recs page)
- GET /api/recommend/genres-you-love    → Based on user's top rated genres
- GET /api/recommend/hidden-gems        → High quality, less popular movies
"""

import json
import os
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from collections import Counter

from database import get_db
from models.rating import Rating
from models.user import User
from services.auth_service import get_current_user
from services.tmdb_service import tmdb_service

router = APIRouter(prefix="/api/recommend", tags=["Recommendations"])

# ============================================================
# LOAD MOOD MAPPING
# ============================================================

MOOD_MAPPING = {}
mood_file_path = os.path.join(os.path.dirname(__file__), "..", "data", "mood_mapping.json")

try:
    with open(mood_file_path, "r", encoding="utf-8") as f:
        MOOD_MAPPING = json.load(f)
    print(f"Loaded mood mapping: {list(MOOD_MAPPING.keys())}")
except FileNotFoundError:
    print("WARNING: mood_mapping.json not found! Mood recommendations won't work.")
except json.JSONDecodeError:
    print("WARNING: mood_mapping.json is invalid JSON!")


# ============================================================
# HELPER: Get User's Top Genres
# ============================================================

async def get_user_top_genres(user_id: int, db: Session, limit: int = 5) -> list:
    """
    Analyze the user's ratings to find their favorite genres.
    Only considers movies rated 3.5+ stars.
    Returns list of {genre_id, genre_name, count} dicts sorted by count.
    """
    good_ratings = db.query(Rating).filter(
        Rating.user_id == user_id,
        Rating.rating >= 3.5
    ).all()

    if not good_ratings:
        return []

    genre_counter = Counter()
    genre_id_to_name = {}
    genre_map = await tmdb_service.get_genre_map()

    for rating in good_ratings:
        try:
            movie = await tmdb_service.get_movie_details(rating.movie_id)
            if movie and "genres" in movie:
                for genre_name in movie.get("genres", []):
                    for gid, gname in genre_map.items():
                        if gname == genre_name:
                            genre_counter[gid] += 1
                            genre_id_to_name[gid] = gname
                            break
        except Exception:
            continue

    top_genres = []
    for genre_id, count in genre_counter.most_common(limit):
        top_genres.append({
            "genre_id": genre_id,
            "genre_name": genre_id_to_name.get(genre_id, "Unknown"),
            "count": count
        })

    return top_genres


# ============================================================
# ENDPOINTS
# ============================================================

@router.get("/moods")
async def get_available_moods():
    """
    Get all available mood options.
    FRONTEND USAGE: Mood page grid, Home page mood pills.
    """
    moods = []
    for key, data in MOOD_MAPPING.items():
        moods.append({
            "id": key,
            "name": data["name"],
            "emoji": data["emoji"],
            "color": data["color"],
            "description": data["description"],
            "genre_names": data["genre_names"]
        })
    return {"moods": moods}


@router.get("/mood/{mood}")
async def get_mood_recommendations(
    mood: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=40)
):
    """
    Get movie recommendations based on a mood.
    FRONTEND USAGE: Mood page results after clicking a mood card.
    """
    mood_lower = mood.lower()

    if mood_lower not in MOOD_MAPPING:
        raise HTTPException(
            status_code=404,
            detail=f"Mood '{mood}' not found. Available moods: {list(MOOD_MAPPING.keys())}"
        )

    mood_data = MOOD_MAPPING[mood_lower]
    genre_ids = mood_data["genre_ids"]
    genre_string = ",".join(str(gid) for gid in genre_ids)

    result = await tmdb_service.discover_movies(
        page=page,
        sort_by="popularity.desc",
        genre_ids=genre_string,
        rating_min=6.0
    )

    return {
        "mood": mood_data["name"],
        "emoji": mood_data["emoji"],
        "color": mood_data["color"],
        "description": mood_data["description"],
        "genre_names": mood_data["genre_names"],
        "movies": result.get("movies", [])[:limit],
        "total_results": result.get("total_results", 0),
        "page": page
    }


@router.get("/personalized")
async def get_personalized_recommendations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1)
):
    """
    Get personalized movie recommendations based on the user's rating history.
    FRONTEND USAGE: Home page "Recommended For You", Recommendations page.
    Falls back to trending if no ratings exist.
    """
    top_genres = await get_user_top_genres(current_user.id, db, limit=3)

    if not top_genres:
        # Fallback 1: use preferred genres from onboarding
        try:
            preferred = json.loads(current_user.preferred_genres or "[]")
        except json.JSONDecodeError:
            preferred = []

        if preferred:
            genre_map = await tmdb_service.get_genre_map()
            for genre_name in preferred[:3]:
                for gid, gname in genre_map.items():
                    if gname.lower() == genre_name.lower():
                        top_genres.append({
                            "genre_id": gid,
                            "genre_name": gname,
                            "count": 0
                        })
                        break

    if not top_genres:
        # Fallback 2: return trending movies
        trending = await tmdb_service.get_trending(page=page)
        return {
            "sections": [{
                "title": "Trending Now",
                "reason": "Popular movies everyone is watching",
                "movies": trending.get("movies", [])[:10]
            }],
            "total_sections": 1
        }

    # Get already-rated movie IDs to exclude
    rated_movies = db.query(Rating.movie_id).filter(
        Rating.user_id == current_user.id
    ).all()
    rated_ids = set(r.movie_id for r in rated_movies)

    # Build one section per top genre
    sections = []
    for genre_info in top_genres:
        result = await tmdb_service.discover_movies(
            page=page,
            sort_by="vote_average.desc",
            genre_ids=str(genre_info["genre_id"]),
            rating_min=7.0
        )

        filtered_movies = [
            m for m in result.get("movies", [])
            if m["id"] not in rated_ids
        ][:10]

        if filtered_movies:
            sections.append({
                "title": f"Because You Like {genre_info['genre_name']}",
                "reason": f"Based on your highly-rated {genre_info['genre_name']} movies",
                "genre": genre_info["genre_name"],
                "movies": filtered_movies
            })

    return {
        "sections": sections,
        "total_sections": len(sections)
    }


@router.get("/genres-you-love")
async def get_genres_you_love(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get top movies from the user's favorite genres.
    FRONTEND USAGE: Recommendations page "Genres You Love" section.
    """
    top_genres = await get_user_top_genres(current_user.id, db, limit=5)

    if not top_genres:
        try:
            preferred = json.loads(current_user.preferred_genres or "[]")
        except json.JSONDecodeError:
            preferred = []

        genre_map = await tmdb_service.get_genre_map()
        for genre_name in preferred[:5]:
            for gid, gname in genre_map.items():
                if gname.lower() == genre_name.lower():
                    top_genres.append({
                        "genre_id": gid,
                        "genre_name": gname,
                        "count": 0
                    })
                    break

    genre_picks = []
    for genre_info in top_genres:
        result = await tmdb_service.discover_movies(
            sort_by="popularity.desc",
            genre_ids=str(genre_info["genre_id"]),
            rating_min=7.0
        )
        movies = result.get("movies", [])
        if movies:
            genre_picks.append({
                "genre_id": genre_info["genre_id"],
                "genre_name": genre_info["genre_name"],
                "count": genre_info["count"],
                "featured_movie": movies[0],
                "movies": movies[:5]
            })

    return {
        "genres": genre_picks,
        "total": len(genre_picks)
    }


@router.get("/hidden-gems")
async def get_hidden_gems(
    page: int = Query(1, ge=1)
):
    """
    Get high-quality but less popular movies.
    FRONTEND USAGE: Recommendations page "Hidden Gems" section.
    Filters: rating >= 7.5, vote_count between 100 and 3000.
    """
    result = await tmdb_service.discover_movies(
        page=page,
        sort_by="vote_average.desc",
        rating_min=7.5
    )

    hidden_gems = []
    for movie in result.get("movies", []):
        vote_count = movie.get("vote_count", 0)
        if 100 <= vote_count <= 3000:
            hidden_gems.append(movie)

    return {
        "movies": hidden_gems[:15],
        "total": len(hidden_gems)
    }
