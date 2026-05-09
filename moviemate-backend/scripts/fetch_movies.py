"""
scripts/fetch_movies.py — Fetch 5000-10000 fresh movies from TMDB API

This script fetches movies from MULTIPLE TMDB endpoints to build a diverse,
up-to-date dataset for the ML recommendation engine.

SOURCES:
1. Popular movies (500 pages × 20 = 10,000 movies)
2. Top rated movies (200 pages)
3. Trending this week
4. Discover by genre (fills gaps in underrepresented genres)

For each movie, we also fetch: genres, keywords, director, top cast.

RUN THIS ONCE:
  cd moviemate-backend
  python scripts/fetch_movies.py

TAKES: 15-25 minutes (due to TMDB rate limits: 40 requests/10 seconds)
OUTPUTS: data/movies_metadata.csv (~5000-8000 unique movies)
"""

import httpx
import csv
import time
import os
import sys
from datetime import datetime

# Add parent directory to path so we can import config
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings

API_KEY = settings.TMDB_API_KEY
BASE_URL = "https://api.themoviedb.org/3"

if not API_KEY:
    print("❌ ERROR: TMDB_API_KEY not set in .env file!")
    print("   Get your free key at https://www.themoviedb.org/settings/api")
    sys.exit(1)

# Track all unique movie IDs to avoid duplicates
seen_ids = set()
all_movies = []

# Rate limiting
request_count = 0
rate_limit_start = time.time()


def rate_limit():
    """Respect TMDB's rate limit: 40 requests per 10 seconds."""
    global request_count, rate_limit_start

    request_count += 1

    if request_count >= 38:  # Leave small buffer
        elapsed = time.time() - rate_limit_start
        if elapsed < 10:
            wait_time = 10 - elapsed + 0.5
            print(f"   ⏳ Rate limit pause: {wait_time:.1f}s")
            time.sleep(wait_time)
        request_count = 0
        rate_limit_start = time.time()


def fetch_page(endpoint, params=None):
    """Fetch a single page from TMDB API."""
    if params is None:
        params = {}
    params["api_key"] = API_KEY

    rate_limit()

    try:
        response = httpx.get(
            f"{BASE_URL}{endpoint}",
            params=params,
            timeout=15.0
        )
        if response.status_code == 200:
            return response.json()
        else:
            print(f"   ⚠️ HTTP {response.status_code} for {endpoint}")
            return {"results": []}
    except Exception as e:
        print(f"   ⚠️ Error: {e}")
        return {"results": []}


def collect_movies_from_list(movies_list):
    """Add movies to the global list, skipping duplicates."""
    added = 0
    for movie in movies_list:
        mid = movie.get("id")
        if mid and mid not in seen_ids:
            # Skip movies with no title or very low vote count
            if not movie.get("title"):
                continue
            if movie.get("vote_count", 0) < 10:
                continue

            seen_ids.add(mid)
            all_movies.append(movie)
            added += 1
    return added


def fetch_movies_from_endpoint(endpoint, label, max_pages=100, extra_params=None):
    """Fetch movies from a TMDB list endpoint (popular, top_rated, etc.)."""
    print(f"\n📥 Fetching: {label}")
    total_added = 0

    for page in range(1, max_pages + 1):
        params = {"page": page, "language": "en-US"}
        if extra_params:
            params.update(extra_params)

        data = fetch_page(endpoint, params)
        results = data.get("results", [])

        if not results:
            print(f"   No more results at page {page}")
            break

        added = collect_movies_from_list(results)
        total_added += added

        total_pages = data.get("total_pages", 1)
        if page >= total_pages:
            break

        if page % 25 == 0:
            print(f"   Page {page}/{min(max_pages, total_pages)} — {total_added} new movies added (Total: {len(all_movies)})")

    print(f"   ✅ {label}: Added {total_added} new movies")


def fetch_discover_by_genre(genre_id, genre_name, max_pages=30):
    """Fetch movies by genre using discover endpoint."""
    fetch_movies_from_endpoint(
        "/discover/movie",
        f"Discover: {genre_name}",
        max_pages=max_pages,
        extra_params={
            "with_genres": str(genre_id),
            "sort_by": "popularity.desc",
            "vote_count.gte": 20,
            "include_adult": "false",
        }
    )


def fetch_discover_by_year(year, max_pages=15):
    """Fetch popular movies from a specific year."""
    fetch_movies_from_endpoint(
        "/discover/movie",
        f"Year: {year}",
        max_pages=max_pages,
        extra_params={
            "primary_release_year": year,
            "sort_by": "popularity.desc",
            "vote_count.gte": 20,
            "include_adult": "false",
        }
    )


def fetch_movie_details(movie_id):
    """Fetch full details for a single movie (genres, keywords, credits)."""
    rate_limit()

    try:
        response = httpx.get(
            f"{BASE_URL}/movie/{movie_id}",
            params={
                "api_key": API_KEY,
                "append_to_response": "keywords,credits",
                "language": "en-US"
            },
            timeout=15.0
        )
        if response.status_code == 200:
            return response.json()
        return None
    except Exception:
        return None


def enrich_movies(movies_list):
    """Fetch detailed info (genres, keywords, director, cast) for each movie."""
    print(f"\n🔍 Enriching {len(movies_list)} movies with details (genres, keywords, cast, director)...")
    print("   This is the slowest part — fetching individual movie details.")
    print(f"   Estimated time: {len(movies_list) * 0.3 / 60:.0f}-{len(movies_list) * 0.4 / 60:.0f} minutes\n")

    enriched = []
    errors = 0
    start_time = time.time()

    for i, movie in enumerate(movies_list):
        detail = fetch_movie_details(movie["id"])

        if detail and "id" in detail:
            # Extract genres as space-separated names
            genres = " ".join([g["name"] for g in detail.get("genres", [])])

            # Extract keywords
            keywords_data = detail.get("keywords", {})
            # Handle both 'keywords' and 'results' formats
            kw_list = keywords_data.get("keywords", keywords_data.get("results", []))
            keywords = " ".join([k["name"] for k in kw_list])

            # Extract director
            director = ""
            for crew in detail.get("credits", {}).get("crew", []):
                if crew.get("job") == "Director":
                    director = crew["name"]
                    break

            # Extract top 3 cast
            cast_list = detail.get("credits", {}).get("cast", [])[:3]
            cast = " ".join([c["name"] for c in cast_list])

            enriched.append({
                "id": movie["id"],
                "title": detail.get("title", movie.get("title", "")),
                "overview": detail.get("overview", movie.get("overview", "")),
                "genres": genres,
                "keywords": keywords,
                "director": director,
                "cast": cast,
                "vote_average": detail.get("vote_average", movie.get("vote_average", 0)),
                "vote_count": detail.get("vote_count", movie.get("vote_count", 0)),
                "popularity": detail.get("popularity", movie.get("popularity", 0)),
                "release_date": detail.get("release_date", movie.get("release_date", "")),
                "poster_path": detail.get("poster_path", movie.get("poster_path", "")),
                "backdrop_path": detail.get("backdrop_path", movie.get("backdrop_path", "")),
                "runtime": detail.get("runtime", 0),
                "tagline": detail.get("tagline", ""),
                "original_language": detail.get("original_language", "en"),
            })
        else:
            errors += 1

        # Progress update every 100 movies
        if (i + 1) % 100 == 0:
            elapsed = time.time() - start_time
            rate = (i + 1) / elapsed
            remaining = (len(movies_list) - i - 1) / rate
            print(f"   Progress: {i + 1}/{len(movies_list)} ({len(enriched)} enriched, {errors} errors) — ~{remaining/60:.1f} min remaining")

    print(f"\n   ✅ Enriched {len(enriched)} movies ({errors} errors)")
    return enriched


def save_to_csv(movies, filepath):
    """Save movie data to CSV."""
    if not movies:
        print("❌ No movies to save!")
        return

    fieldnames = movies[0].keys()

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(movies)

    # File size
    size_mb = os.path.getsize(filepath) / (1024 * 1024)
    print(f"\n💾 Saved {len(movies)} movies to {filepath} ({size_mb:.1f} MB)")


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":
    print("=" * 70)
    print("  MovieMate — Fresh Movie Data Fetcher")
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print("=" * 70)

    overall_start = time.time()

    # --------------------------------------------------------
    # PHASE 1: Collect movie IDs from multiple endpoints
    # --------------------------------------------------------

    # 1. Popular movies (largest source — up to 500 pages)
    fetch_movies_from_endpoint("/movie/popular", "Popular Movies", max_pages=250)

    # 2. Top rated movies
    fetch_movies_from_endpoint("/movie/top_rated", "Top Rated Movies", max_pages=100)

    # 3. Trending this week
    fetch_movies_from_endpoint("/trending/movie/week", "Trending This Week", max_pages=20)

    # 4. Now playing
    fetch_movies_from_endpoint("/movie/now_playing", "Now Playing", max_pages=10)

    # 5. Upcoming
    fetch_movies_from_endpoint("/movie/upcoming", "Upcoming Movies", max_pages=10)

    # 6. Recent years — ensure we have latest movies
    current_year = datetime.now().year
    for year in range(current_year, current_year - 3, -1):
        fetch_discover_by_year(year, max_pages=20)

    # 7. Fill in underrepresented genres
    important_genres = [
        (28, "Action"), (12, "Adventure"), (16, "Animation"),
        (35, "Comedy"), (80, "Crime"), (99, "Documentary"),
        (18, "Drama"), (10751, "Family"), (14, "Fantasy"),
        (36, "History"), (27, "Horror"), (10402, "Music"),
        (9648, "Mystery"), (10749, "Romance"), (878, "Science Fiction"),
        (53, "Thriller"), (10752, "War"), (37, "Western"),
    ]

    for genre_id, genre_name in important_genres:
        fetch_discover_by_genre(genre_id, genre_name, max_pages=10)

    print(f"\n{'=' * 70}")
    print(f"📊 COLLECTION SUMMARY: {len(all_movies)} unique movies collected")
    print(f"{'=' * 70}")

    # --------------------------------------------------------
    # PHASE 2: Limit to manageable size
    # --------------------------------------------------------
    # Sort by popularity (most popular first) and take top 7000
    # This keeps dataset size manageable for TF-IDF
    TARGET_SIZE = 7000

    if len(all_movies) > TARGET_SIZE:
        all_movies.sort(key=lambda m: m.get("popularity", 0), reverse=True)
        all_movies = all_movies[:TARGET_SIZE]
        print(f"   Trimmed to top {TARGET_SIZE} by popularity")

    # --------------------------------------------------------
    # PHASE 3: Enrich with details (genres, keywords, cast, director)
    # --------------------------------------------------------
    enriched_movies = enrich_movies(all_movies)

    # --------------------------------------------------------
    # PHASE 4: Save to CSV
    # --------------------------------------------------------
    os.makedirs("data", exist_ok=True)
    save_to_csv(enriched_movies, "data/movies_metadata.csv")

    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------
    total_time = time.time() - overall_start
    print(f"\n{'=' * 70}")
    print(f"  ✅ COMPLETE!")
    print(f"  Movies: {len(enriched_movies)}")
    print(f"  Time: {total_time/60:.1f} minutes")
    print(f"  File: data/movies_metadata.csv")
    print(f"{'=' * 70}")
    print(f"\n  Next step: python scripts/build_model.py")
