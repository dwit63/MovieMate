"""
routers/ratings.py — Movie Ratings API Endpoints

Endpoints:
- POST /api/ratings              → Rate a movie (or update existing rating)
- GET  /api/ratings              → Get all ratings by current user
- GET  /api/ratings/ids          → Get just movie IDs + ratings (for quick lookup)
- GET  /api/ratings/{movie_id}   → Get user's rating for a specific movie
- DELETE /api/ratings/{movie_id} → Remove a rating

All endpoints require authentication (JWT token).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.rating import Rating
from models.user import User
from services.auth_service import get_current_user
from services.tmdb_service import tmdb_service

router = APIRouter(prefix="/api/ratings", tags=["Ratings"])


@router.post("")
async def rate_movie(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Rate a movie (1-5 stars).

    If the user has already rated this movie, update the existing rating.
    If not, create a new rating.

    FRONTEND USAGE:
    - RatingStars component on MovieDetail page
    - RatingStars on Onboarding page (initial movie ratings)
    - Any place where star rating is interactive

    Frontend sends: { "movie_id": 550, "rating": 4.5 }
    """
    movie_id = data.get("movie_id")
    rating_value = data.get("rating")

    if not movie_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="movie_id is required"
        )

    if rating_value is None or not (1.0 <= float(rating_value) <= 5.0):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rating must be between 1.0 and 5.0"
        )

    rating_value = float(rating_value)

    # Check if user already rated this movie
    existing_rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()

    if existing_rating:
        # Update existing rating
        existing_rating.rating = rating_value
        db.commit()
        db.refresh(existing_rating)
        return {
            "message": "Rating updated!",
            "movie_id": movie_id,
            "rating": rating_value,
            "updated": True
        }
    else:
        # Create new rating
        new_rating = Rating(
            user_id=current_user.id,
            movie_id=movie_id,
            rating=rating_value
        )
        db.add(new_rating)
        db.commit()
        db.refresh(new_rating)
        return {
            "message": "Rating saved!",
            "movie_id": movie_id,
            "rating": rating_value,
            "updated": False
        }


@router.get("")
async def get_user_ratings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all movies rated by the current user, with movie details.

    FRONTEND USAGE:
    - Profile page: "Recently Rated" section
    - Recommendations engine: uses these to find similar movies

    Returns full movie details from TMDB + the user's rating.
    """
    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).order_by(Rating.created_at.desc()).all()

    rated_movies = []
    for rating in ratings:
        try:
            movie = await tmdb_service.get_movie_details(rating.movie_id)
            if movie and "id" in movie:
                rated_movies.append({
                    "movie_id": rating.movie_id,
                    "rating": rating.rating,
                    "rated_at": rating.created_at.isoformat() if rating.created_at else None,
                    "movie": movie
                })
        except Exception as e:
            print(f"Error fetching movie {rating.movie_id}: {e}")
            # Include basic info even if TMDB fails
            rated_movies.append({
                "movie_id": rating.movie_id,
                "rating": rating.rating,
                "rated_at": rating.created_at.isoformat() if rating.created_at else None,
                "movie": None
            })

    return {
        "ratings": rated_movies,
        "total": len(rated_movies)
    }


@router.get("/ids")
async def get_user_rating_ids(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get just movie IDs and their ratings (no TMDB details).

    FRONTEND USAGE:
    - Called on app load to know which movies the user has rated
    - MovieCard/MovieDetail can show "Your rating: ★ 4.5" without extra API calls
    - Very fast since it only reads from our database

    Returns: { "ratings": { "550": 4.5, "680": 5.0, "155": 4.0 } }
    This is a dictionary where key = movie_id, value = rating.
    """
    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).all()

    # Build a dictionary: { movie_id: rating }
    rating_map = {}
    for r in ratings:
        rating_map[str(r.movie_id)] = r.rating

    return {"ratings": rating_map}


@router.get("/stats")
async def get_rating_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get rating statistics for the user.

    FRONTEND USAGE:
    - Profile page: Activity Overview stats (total rated, avg rating, etc.)

    Returns aggregate data calculated from the database.
    """
    ratings = db.query(Rating).filter(
        Rating.user_id == current_user.id
    ).all()

    if not ratings:
        return {
            "total_rated": 0,
            "average_rating": 0,
            "highest_rated": None,
            "lowest_rated": None,
        }

    total = len(ratings)
    avg = round(sum(r.rating for r in ratings) / total, 1)

    # Find highest and lowest rated movie IDs
    highest = max(ratings, key=lambda r: r.rating)
    lowest = min(ratings, key=lambda r: r.rating)

    return {
        "total_rated": total,
        "average_rating": avg,
        "highest_rated": {
            "movie_id": highest.movie_id,
            "rating": highest.rating
        },
        "lowest_rated": {
            "movie_id": lowest.movie_id,
            "rating": lowest.rating
        }
    }


@router.get("/{movie_id}")
async def get_movie_rating(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the user's rating for a specific movie.

    FRONTEND USAGE:
    - MovieDetail page: Show filled stars if user has rated this movie

    Returns the rating if found, or null if not rated.
    """
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()

    if rating:
        return {
            "movie_id": movie_id,
            "rating": rating.rating,
            "rated_at": rating.created_at.isoformat() if rating.created_at else None
        }
    else:
        return {
            "movie_id": movie_id,
            "rating": None
        }


@router.delete("/{movie_id}")
async def delete_rating(
    movie_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove a rating for a movie.

    FRONTEND USAGE:
    - If user wants to undo their rating

    Example request: DELETE /api/ratings/550
    """
    rating = db.query(Rating).filter(
        Rating.user_id == current_user.id,
        Rating.movie_id == movie_id
    ).first()

    if not rating:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You haven't rated this movie"
        )

    db.delete(rating)
    db.commit()

    return {
        "message": "Rating removed",
        "movie_id": movie_id
    }