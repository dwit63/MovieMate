"""
routers/recommendations.py — Recommendation API Endpoints

Endpoints:
- GET /api/recommend/moods              → List of all available moods
- GET /api/recommend/mood/{mood}        → Movies for a mood (Mood page)
- GET /api/recommend/personalized       → Genre-based "For You" recommendations
- GET /api/recommend/genres-you-love    → Based on user's top rated genres
- GET /api/recommend/hidden-gems        → High quality, less popular movies
- GET /api/recommend/similar/{id}       → ML similar movies (TF-IDF cosine similarity)
- GET /api/recommend/ml/personalized    → ML-powered "Because You Liked X" sections
"""

import asyncio
import json
import os
import random
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from collections import Counter

from database import get_db
from models.rating import Rating
from models.user import User
from services.auth_service import get_current_user
from services.tmdb_service import tmdb_service
from services.recommendation_engine import recommendation_engine

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

    async def _fetch_genre_movie(rating):
        try:
            return await tmdb_service.get_movie_details(rating.movie_id)
        except Exception as e:
            print(f"Error fetching movie {rating.movie_id} for genre analysis: {e}")
            return None

    genre_movie_results = await asyncio.gather(*[_fetch_genre_movie(r) for r in good_ratings])

    for movie in genre_movie_results:
        if movie and "genres" in movie:
            for genre_name in movie.get("genres", []):
                for gid, gname in genre_map.items():
                    if gname == genre_name:
                        genre_counter[gid] += 1
                        genre_id_to_name[gid] = gname
                        break

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
    # Use | (pipe) for OR logic — comma means AND in TMDB which returns near-zero results
    # when multiple genres are combined
    genre_string = "|".join(str(gid) for gid in genre_ids)

    result = await tmdb_service.discover_movies(
        page=page,
        sort_by="popularity.desc",
        genre_ids=genre_string,
        rating_min=5.5
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
        preferred = [ug.genre_name for ug in current_user.user_genres]

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

    # Vary sort and page per genre so results differ on each refresh
    sort_options = ["vote_average.desc", "popularity.desc", "primary_release_date.desc"]

    # Build one section per top genre
    sections = []
    for genre_info in top_genres:
        rand_page = random.randint(1, 4)
        rand_sort = random.choice(sort_options)
        result = await tmdb_service.discover_movies(
            page=rand_page,
            sort_by=rand_sort,
            genre_ids=str(genre_info["genre_id"]),
            rating_min=7.0
        )

        all_movies = [m for m in result.get("movies", []) if m["id"] not in rated_ids]
        random.shuffle(all_movies)
        filtered_movies = all_movies[:10]

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
        preferred = [ug.genre_name for ug in current_user.user_genres]

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
    # Use a random page each call so hidden gems vary on refresh
    rand_page = random.randint(1, 8)
    result = await tmdb_service.discover_movies(
        page=rand_page,
        sort_by="vote_average.desc",
        rating_min=7.5
    )

    hidden_gems = []
    for movie in result.get("movies", []):
        vote_count = movie.get("vote_count", 0)
        if 100 <= vote_count <= 5000:
            hidden_gems.append(movie)

    random.shuffle(hidden_gems)
    return {
        "movies": hidden_gems[:15],
        "total": len(hidden_gems)
    }


# ============================================================
# ML-POWERED ENDPOINTS (TF-IDF + Cosine Similarity)
# ============================================================

@router.get("/status")
async def engine_status():
    """
    Check whether the ML recommendation engine has finished loading.
    FRONTEND USAGE: Poll this on app start; show a loading state until ready.
    """
    return {
        "engine_loaded": recommendation_engine.is_loaded,
        "total_movies": len(recommendation_engine.movies_df) if recommendation_engine.is_loaded else 0,
        "message": "ML engine ready" if recommendation_engine.is_loaded else "ML engine still loading, try again in a moment"
    }


@router.get("/similar/{movie_id}")
async def get_similar_movies_ml(
    movie_id: int,
    limit: int = Query(10, ge=1, le=30)
):
    """
    Get movies similar to a given movie using ML (TF-IDF + Cosine Similarity).

    FRONTEND USAGE:
    - MovieDetail page "Similar Movies" section with real match percentages and explanations.

    Returns 503 while the ML engine is still loading.
    Falls back to TMDB similar movies if the movie is not in the ML index.

    Example: GET /api/recommend/similar/550
    """
    # 503 while engine is still warming up
    if not recommendation_engine.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="ML engine is still loading. Please try again in a moment."
        )

    similar = recommendation_engine.get_similar_movies(
        movie_id=movie_id,
        top_n=limit
    )

    # Movie found in ML index — return ML results
    if similar:
        source_movie = recommendation_engine.get_movie_from_dataset(movie_id)
        return {
            "movie_id": movie_id,
            "source_movie": source_movie,
            "similar_movies": similar,
            "source": "ml",
            "method": "tfidf_cosine_similarity",
            "total": len(similar)
        }

    # Movie not in ML index — fall back to TMDB (never return an empty list)
    movie = await tmdb_service.get_movie_details(movie_id)
    if movie:
        return {
            "movie_id": movie_id,
            "source_movie": {"id": movie_id, "title": movie.get("title", "")},
            "similar_movies": movie.get("similar_movies", []),
            "source": "tmdb_fallback",
            "method": "tmdb_fallback"
        }

    # TMDB also has nothing — return empty rather than crash
    return {
        "movie_id": movie_id,
        "source_movie": None,
        "similar_movies": [],
        "source": "tmdb_fallback",
        "method": "unavailable"
    }


@router.get("/ml/personalized")
async def get_ml_personalized(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = Query(20, ge=1, le=50)
):
    """
    Get ML-powered personalized recommendations.

    Uses TF-IDF + Cosine Similarity on the user's highly-rated movies
    to find similar movies across ALL features (genres, director, cast, themes).

    FRONTEND USAGE:
    - Home page "Recommended For You" (upgraded from genre-only)
    - Recommendations page "Because You Liked X" sections

    Falls back to genre-based recommendations if ML engine is unavailable.
    """
    if not recommendation_engine.is_loaded:
        return await get_personalized_recommendations(
            current_user=current_user, db=db
        )

    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).all()

    if len(ratings) < 2:
        return {
            "message": "Rate at least 2 movies to get personalized recommendations",
            "sections": []
        }

    rated_movies = [{"movie_id": r.movie_id, "rating": r.rating} for r in ratings]

    ml_results = recommendation_engine.get_personalized_recommendations(
        rated_movies=rated_movies,
        top_n=limit
    )

    if not ml_results:
        return await get_personalized_recommendations(
            current_user=current_user, db=db
        )

    # Group results into "Because You Liked X" sections
    sections = {}
    for movie in ml_results:
        for source in movie.get("recommended_because", []):
            source_id = source["source_id"]
            source_movie = recommendation_engine.get_movie_from_dataset(source_id)
            source_title = source_movie["title"] if source_movie else f"Movie {source_id}"

            if source_title not in sections:
                sections[source_title] = {
                    "title": f"Because You Liked {source_title}",
                    "reason": f"Movies similar to {source_title} based on genres, director, cast, and themes",
                    "source_id": source_id,
                    "movies": []
                }

            if len(sections[source_title]["movies"]) < 8:
                sections[source_title]["movies"].append(movie)

    section_list = sorted(sections.values(), key=lambda s: len(s["movies"]), reverse=True)

    return {
        "sections": section_list[:5],
        "method": "tfidf_cosine_similarity",
        "total_recommendations": len(ml_results)
    }
