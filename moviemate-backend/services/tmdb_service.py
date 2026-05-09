"""
services/tmdb_service.py — TMDB API Service

This file talks to the TMDB API to get movie data.
All TMDB API calls go through here — no other file should
call TMDB directly.

TMDB API DOCS: https://developer.themoviedb.org/reference/intro/getting-started

HOW IT WORKS:
1. We use 'httpx' (an HTTP library) to send requests to TMDB
2. Every request includes our API key as a query parameter
3. TMDB responds with JSON data
4. We format the data and return it

RATE LIMIT: TMDB allows 40 requests per 10 seconds.
For a university project, you'll never hit this limit.
"""

import asyncio
import time
import httpx
from typing import Optional, List, Dict
from config import settings


class TMDBService:
    """Handles all communication with the TMDB API."""

    def __init__(self):
        self.api_key = settings.TMDB_API_KEY
        self.base_url = settings.TMDB_BASE_URL  # https://api.themoviedb.org/3
        self.image_base = settings.TMDB_IMAGE_BASE  # https://image.tmdb.org/t/p

        # We'll store genre mappings here (loaded once, reused)
        self._genre_map = None

        # Simple in-memory response cache — avoids redundant TMDB calls
        self._cache = {}
        self._cache_ttl = 300  # seconds (5 minutes)

        # Persistent HTTP client — reuses TCP+TLS connections instead of creating
        # a new connection for every request. Prevents ConnectErrors on Windows when
        # many requests fire in parallel (asyncio.gather).
        self._http_client: httpx.AsyncClient | None = None

    def _get_http_client(self) -> httpx.AsyncClient:
        """Return the shared persistent HTTP client, creating it if needed."""
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                trust_env=True,
                timeout=httpx.Timeout(15.0, connect=10.0),
                limits=httpx.Limits(
                    max_connections=20,
                    max_keepalive_connections=10,
                    keepalive_expiry=30.0,
                ),
            )
        return self._http_client

    # ============================================================
    # CACHE HELPERS
    # ============================================================

    def _get_cached(self, key: str):
        """Return cached data if it exists and is under TTL, otherwise evict and return None."""
        entry = self._cache.get(key)
        if entry is None:
            return None
        ttl = entry.get("ttl", self._cache_ttl)   # per-entry TTL, falls back to default
        if time.time() - entry["ts"] < ttl:
            return entry["data"]
        # Stale — remove it
        del self._cache[key]
        return None

    def _set_cached(self, key: str, data, ttl: int = None) -> None:
        """Store data in the cache with the current timestamp.

        ttl: seconds until expiry; defaults to self._cache_ttl (300 s).
        Pass ttl=3600 for data that rarely changes (e.g. genre lists).
        """
        self._cache[key] = {"data": data, "ts": time.time(), "ttl": ttl or self._cache_ttl}

    # ============================================================
    # HELPER: Make API Request
    # ============================================================

    async def _make_request(self, endpoint: str, params: dict = None) -> dict:
        """
        Send a GET request to TMDB API.

        Uses a persistent HTTP client so connections are reused across requests
        (no per-request TCP handshake). Retries up to 3 times on transient errors.
        """
        if params is None:
            params = {}

        # Always include the API key
        params["api_key"] = self.api_key

        url = f"{self.base_url}{endpoint}"
        client = self._get_http_client()

        for attempt in range(3):
            try:
                response = await client.get(url, params=params)
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectError, httpx.TimeoutException) as e:
                if attempt < 2:
                    await asyncio.sleep(0.5 * (attempt + 1))
                    continue
                print(f"TMDB API {type(e).__name__} (gave up after 3 attempts): {url}")
                return {"results": [], "total_pages": 0, "total_results": 0}
            except httpx.HTTPStatusError as e:
                print(f"TMDB API HTTP {e.response.status_code}: {e.response.text[:200]}")
                return {"results": [], "total_pages": 0, "total_results": 0}
            except httpx.HTTPError as e:
                print(f"TMDB API Error: {type(e).__name__} - {e}")
                return {"results": [], "total_pages": 0, "total_results": 0}

        return {"results": [], "total_pages": 0, "total_results": 0}

    # ============================================================
    # GENRE MAPPING
    # ============================================================

    async def get_genre_map(self) -> Dict[int, str]:
        """
        Get a mapping of genre ID → genre name.

        TMDB uses numbers for genres (e.g., 28 = Action, 35 = Comedy).
        This function fetches the mapping so we can convert IDs to names.

        We cache it after the first call so we don't re-fetch every time.
        Persisted in the TTL cache with a 1-hour expiry (genres rarely change).
        """
        # 1. In-process dict (fastest — no serialization)
        if self._genre_map is not None:
            return self._genre_map

        # 2. TTL cache (survives across _genre_map resets, 1-hour TTL)
        cache_key = "genre_map"
        cached = self._get_cached(cache_key)
        if cached is not None:
            self._genre_map = cached
            return self._genre_map

        data = await self._make_request("/genre/movie/list", {"language": "en-US"})
        genres = data.get("genres", [])

        # Build a dictionary: {28: "Action", 35: "Comedy", ...}
        self._genre_map = {g["id"]: g["name"] for g in genres}
        self._set_cached(cache_key, self._genre_map, ttl=3600)  # 1-hour TTL
        return self._genre_map

    # ============================================================
    # FORMAT MOVIE DATA
    # ============================================================

    async def _format_movie(self, movie: dict) -> dict:
        """
        Convert raw TMDB movie data into our app's format.

        TMDB sends a lot of fields we don't need. This function
        picks only the ones we want and renames them for clarity.
        """
        genre_map = await self.get_genre_map()

        # Convert genre IDs [28, 878] → genre names ["Action", "Sci-Fi"]
        genre_ids = movie.get("genre_ids", [])
        # Some endpoints return 'genres' as objects instead of 'genre_ids'
        if not genre_ids and "genres" in movie:
            genre_names = [g["name"] for g in movie.get("genres", [])]
        else:
            genre_names = [genre_map.get(gid, "Unknown") for gid in genre_ids]

        return {
            "id": movie.get("id"),
            "title": movie.get("title", "Unknown Title"),
            "overview": movie.get("overview", ""),
            "poster_path": movie.get("poster_path"),
            "backdrop_path": movie.get("backdrop_path"),
            "vote_average": round(movie.get("vote_average", 0), 1),
            "vote_count": movie.get("vote_count", 0),
            "release_date": movie.get("release_date", ""),
            "genres": genre_names,
            "genre_ids": genre_ids,
            "popularity": movie.get("popularity", 0),
            "original_language": movie.get("original_language", "en"),
        }

    async def _format_movie_list(self, movies: list) -> list:
        """Format a list of movies."""
        formatted = []
        for movie in movies:
            formatted.append(await self._format_movie(movie))
        return formatted

    # ============================================================
    # TRENDING MOVIES
    # ============================================================

    async def get_trending(self, page: int = 1) -> dict:
        """
        Get trending movies this week.

        TMDB Endpoint: /trending/movie/week
        This returns movies that are popular/trending right now.
        Used on the Home page hero banner and "Trending This Week" section.
        """
        cache_key = "trending"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        data = await self._make_request("/trending/movie/week", {
            "page": page,
            "language": "en-US"
        })

        movies = await self._format_movie_list(data.get("results", []))

        result = {
            "movies": movies,
            "page": data.get("page", 1),
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0)
        }
        self._set_cached(cache_key, result)
        return result

    # ============================================================
    # TOP RATED MOVIES
    # ============================================================

    async def get_top_rated(self, page: int = 1) -> dict:
        """
        Get top rated movies of all time.

        TMDB Endpoint: /movie/top_rated
        Used on the Home page "Top Rated" section.
        """
        cache_key = f"top_rated_{page}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        data = await self._make_request("/movie/top_rated", {
            "page": page,
            "language": "en-US"
        })

        movies = await self._format_movie_list(data.get("results", []))

        result = {
            "movies": movies,
            "page": data.get("page", 1),
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0)
        }
        self._set_cached(cache_key, result)
        return result

    # ============================================================
    # POPULAR MOVIES
    # ============================================================

    async def get_popular(self, page: int = 1) -> dict:
        """
        Get popular movies right now.

        TMDB Endpoint: /movie/popular
        Used on the Explore page default view.
        """
        cache_key = f"popular_{page}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        data = await self._make_request("/movie/popular", {
            "page": page,
            "language": "en-US"
        })

        movies = await self._format_movie_list(data.get("results", []))

        result = {
            "movies": movies,
            "page": data.get("page", 1),
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0)
        }
        self._set_cached(cache_key, result)
        return result

    # ============================================================
    # SEARCH MOVIES
    # ============================================================

    async def search_movies(self, query: str, page: int = 1) -> dict:
        """
        Search movies by title.

        TMDB Endpoint: /search/movie
        Used by the Search bar and Search Results page.

        Example: search_movies("inception") → returns Inception (2010), etc.
        """
        data = await self._make_request("/search/movie", {
            "query": query,
            "page": page,
            "language": "en-US",
            "include_adult": False
        })

        movies = await self._format_movie_list(data.get("results", []))

        return {
            "movies": movies,
            "page": data.get("page", 1),
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0)
        }

    # ============================================================
    # MOVIE DETAILS (Single Movie — Full Info)
    # ============================================================

    async def get_movie_details(self, movie_id: int) -> dict:
        """
        Get full details for a single movie.

        TMDB Endpoint: /movie/{id}
        With append_to_response, we get credits (cast/crew) and videos (trailers)
        in a single API call instead of three separate calls.

        Used on the Movie Detail page.
        """
        cache_key = f"movie_{movie_id}"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        data = await self._make_request(f"/movie/{movie_id}", {
            "language": "en-US",
            "append_to_response": "credits,videos,similar"
        })

        if "id" not in data:
            return None

        genre_map = await self.get_genre_map()

        # Extract director from crew
        crew = data.get("credits", {}).get("crew", [])
        director = "Unknown"
        for person in crew:
            if person.get("job") == "Director":
                director = person.get("name", "Unknown")
                break

        # Extract top cast (first 6 actors)
        cast_list = data.get("credits", {}).get("cast", [])
        cast = []
        for actor in cast_list[:6]:
            cast.append({
                "name": actor.get("name", ""),
                "character": actor.get("character", ""),
                "profile_path": actor.get("profile_path"),
            })

        # Extract YouTube trailer key
        videos = data.get("videos", {}).get("results", [])
        trailer_key = None
        for video in videos:
            if video.get("type") == "Trailer" and video.get("site") == "YouTube":
                trailer_key = video.get("key")
                break
        # Fallback: if no trailer, try any YouTube video
        if not trailer_key and videos:
            for video in videos:
                if video.get("site") == "YouTube":
                    trailer_key = video.get("key")
                    break

        # Extract similar movies
        similar_raw = data.get("similar", {}).get("results", [])[:10]
        similar_movies = await self._format_movie_list(similar_raw)

        # Format genre names
        genres = [g["name"] for g in data.get("genres", [])]

        result = {
            "id": data.get("id"),
            "title": data.get("title", ""),
            "overview": data.get("overview", ""),
            "poster_path": data.get("poster_path"),
            "backdrop_path": data.get("backdrop_path"),
            "vote_average": round(data.get("vote_average", 0), 1),
            "vote_count": data.get("vote_count", 0),
            "release_date": data.get("release_date", ""),
            "runtime": data.get("runtime", 0),
            "tagline": data.get("tagline", ""),
            "genres": genres,
            "director": director,
            "cast": cast,
            "trailer_key": trailer_key,
            "similar_movies": similar_movies,
            "budget": data.get("budget", 0),
            "revenue": data.get("revenue", 0),
            "status": data.get("status", ""),
            "original_language": data.get("original_language", "en"),
        }
        self._set_cached(cache_key, result)
        return result

    # ============================================================
    # MOVIES BY GENRE
    # ============================================================

    async def get_movies_by_genre(self, genre_id: int, page: int = 1, sort_by: str = "popularity.desc") -> dict:
        """
        Discover movies filtered by genre.

        TMDB Endpoint: /discover/movie
        Used on the Explore page when user selects a genre filter.
        Also used for mood-based recommendations (map mood → genres → movies).

        sort_by options: popularity.desc, vote_average.desc, release_date.desc, title.asc
        """
        data = await self._make_request("/discover/movie", {
            "with_genres": str(genre_id),
            "sort_by": sort_by,
            "page": page,
            "language": "en-US",
            "include_adult": False,
            "vote_count.gte": 50  # Only movies with at least 50 votes (filters out obscure ones)
        })

        movies = await self._format_movie_list(data.get("results", []))

        return {
            "movies": movies,
            "page": data.get("page", 1),
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0)
        }

    # ============================================================
    # DISCOVER MOVIES (Advanced Filtering)
    # ============================================================

    async def discover_movies(
        self,
        page: int = 1,
        sort_by: str = "popularity.desc",
        genre_ids: str = None,
        year_min: int = None,
        year_max: int = None,
        rating_min: float = None,
        language: str = None
    ) -> dict:
        """
        Advanced movie discovery with multiple filters.

        Used on the Explore page with sidebar filters.
        Supports filtering by genre, year range, minimum rating, and language.
        """
        params = {
            "sort_by": sort_by,
            "page": page,
            "language": "en-US",
            "include_adult": False,
            "vote_count.gte": 50
        }

        if genre_ids:
            params["with_genres"] = genre_ids  # Comma-separated: "28,878"
        if year_min:
            params["primary_release_date.gte"] = f"{year_min}-01-01"
        if year_max:
            params["primary_release_date.lte"] = f"{year_max}-12-31"
        if rating_min:
            params["vote_average.gte"] = rating_min
        if language:
            params["with_original_language"] = language

        data = await self._make_request("/discover/movie", params)
        movies = await self._format_movie_list(data.get("results", []))

        return {
            "movies": movies,
            "page": data.get("page", 1),
            "total_pages": data.get("total_pages", 1),
            "total_results": data.get("total_results", 0)
        }

    # ============================================================
    # GET ALL GENRES LIST
    # ============================================================

    async def get_genres(self) -> list:
        """
        Get the full list of movie genres from TMDB.

        Returns: [{"id": 28, "name": "Action"}, {"id": 35, "name": "Comedy"}, ...]
        Used on the Explore page genre filter checkboxes.
        Cached for 1 hour — genre list changes extremely rarely.
        """
        cache_key = "genres_list"
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        data = await self._make_request("/genre/movie/list", {"language": "en-US"})
        genres = data.get("genres", [])
        self._set_cached(cache_key, genres, ttl=3600)  # 1-hour TTL
        return genres


# Create a single instance to use everywhere
tmdb_service = TMDBService()