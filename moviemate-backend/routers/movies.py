"""
routers/movies.py — Movie API Endpoints

These endpoints are called by the frontend to get movie data.
The endpoints talk to TMDB via the tmdb_service.

Endpoints:
- GET /api/movies/trending      → Trending movies (Home page hero + trending row)
- GET /api/movies/top-rated      → Top rated movies (Home page)
- GET /api/movies/popular        → Popular movies (Explore page default)
- GET /api/movies/search         → Search by title (Search bar + Search Results page)
- GET /api/movies/{id}           → Single movie full details (MovieDetail page)
- GET /api/movies/genre/{id}     → Movies by genre (Explore page filter)
- GET /api/movies/discover       → Advanced filtered discovery (Explore page sidebar)
- GET /api/movies/genres         → List of all genres (Explore page filter checkboxes)
"""

from fastapi import APIRouter, Query
from typing import Optional
from services.tmdb_service import tmdb_service

router = APIRouter(prefix="/api/movies", tags=["Movies"])


@router.get("/trending")
async def get_trending_movies(page: int = Query(1, ge=1, description="Page number")):
    """
    Get trending movies this week.

    FRONTEND USAGE:
    - Home page: Hero banner (first movie) + "Trending This Week" row
    - Called when HomePage loads

    Example request: GET /api/movies/trending?page=1
    """
    return await tmdb_service.get_trending(page=page)


@router.get("/top-rated")
async def get_top_rated_movies(page: int = Query(1, ge=1)):
    """
    Get top rated movies of all time.

    FRONTEND USAGE:
    - Home page: "Top Rated" row

    Example request: GET /api/movies/top-rated?page=1
    """
    return await tmdb_service.get_top_rated(page=page)


@router.get("/popular")
async def get_popular_movies(page: int = Query(1, ge=1)):
    """
    Get popular movies right now.

    FRONTEND USAGE:
    - Explore page: Default movie grid when no filters applied

    Example request: GET /api/movies/popular?page=1
    """
    return await tmdb_service.get_popular(page=page)


@router.get("/search")
async def search_movies(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1)
):
    """
    Search movies by title.

    FRONTEND USAGE:
    - Navbar search bar: Auto-suggest dropdown (as user types)
    - Search Results page: Full results when user presses Enter

    Example request: GET /api/movies/search?q=inception&page=1
    """
    return await tmdb_service.search_movies(query=q, page=page)


@router.get("/genres")
async def get_genres():
    """
    Get the list of all movie genres.

    FRONTEND USAGE:
    - Explore page: Genre filter checkboxes in sidebar
    - Onboarding page: Genre selection cards

    Example request: GET /api/movies/genres
    Returns: [{"id": 28, "name": "Action"}, {"id": 35, "name": "Comedy"}, ...]
    """
    genres = await tmdb_service.get_genres()
    return {"genres": genres}


@router.get("/discover")
async def discover_movies(
    page: int = Query(1, ge=1),
    sort_by: str = Query("popularity.desc", description="Sort order"),
    genres: Optional[str] = Query(None, description="Comma-separated genre IDs, e.g. '28,878'"),
    year_min: Optional[int] = Query(None, description="Minimum release year"),
    year_max: Optional[int] = Query(None, description="Maximum release year"),
    rating_min: Optional[float] = Query(None, description="Minimum rating"),
    language: Optional[str] = Query(None, description="Language code, e.g. 'en'")
):
    """
    Discover movies with advanced filters.

    FRONTEND USAGE:
    - Explore page: When user applies sidebar filters (genre, year, rating, language)

    Example request: GET /api/movies/discover?genres=28,878&year_min=2020&rating_min=7.0&sort_by=vote_average.desc
    """
    return await tmdb_service.discover_movies(
        page=page,
        sort_by=sort_by,
        genre_ids=genres,
        year_min=year_min,
        year_max=year_max,
        rating_min=rating_min,
        language=language
    )


@router.get("/{movie_id}")
async def get_movie_details(movie_id: int):
    """
    Get full details for a single movie.

    FRONTEND USAGE:
    - MovieDetail page: All movie info, cast, trailer, similar movies

    Example request: GET /api/movies/550
    (550 is Fight Club's TMDB ID)

    IMPORTANT: This route MUST be the last one defined because {movie_id}
    would match any path like /trending, /popular etc. if placed before them.
    FastAPI checks routes in order — specific routes first, dynamic routes last.
    """
    movie = await tmdb_service.get_movie_details(movie_id=movie_id)

    if movie is None:
        return {"error": "Movie not found", "id": movie_id}

    return movie