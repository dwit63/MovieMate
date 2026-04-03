"""
config.py — Application Configuration

This file reads values from the .env file and makes them available
throughout the app. Using environment variables is a security best
practice — you never hardcode secrets in your source code.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # JWT (Authentication) Settings
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "fallback-secret-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRY_MINUTES: int = int(os.getenv("JWT_EXPIRY_MINUTES", "1440"))

    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./moviemate.db")

    # TMDB API
    TMDB_API_KEY: str = os.getenv("TMDB_API_KEY", "")
    TMDB_BASE_URL: str = "https://api.themoviedb.org/3"
    TMDB_IMAGE_BASE: str = "https://image.tmdb.org/t/p"

    # CORS (Frontend URL)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")


# Create a single settings instance to use everywhere
settings = Settings()