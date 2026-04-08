"""
main.py — FastAPI Application Entry Point

This is the main file that starts your backend server.
It sets up the app, configures CORS, includes all routers,
and creates the database tables.

TO RUN THE SERVER:
  cd moviemate-backend
  source venv/bin/activate  (or venv\\Scripts\\activate on Windows)
  uvicorn main:app --reload --port 8000

The --reload flag means the server auto-restarts when you change code.
Visit http://localhost:8000/docs for the auto-generated API documentation.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import engine, Base

# Import all models so SQLAlchemy knows about them when creating tables
from models import User, Rating, Watchlist, WatchHistory

# Import routers
from routers import auth
from routers import movies
from routers import watchlist
from routers import ratings

# ============================================================
# CREATE THE APP
# ============================================================

app = FastAPI(
    title="MovieMate API",
    description="Personalized Movie Recommendation System API",
    version="1.0.0",
)

# ============================================================
# CONFIGURE CORS
# ============================================================
# This allows your React frontend (localhost:5173) to make
# requests to this backend (localhost:8000).
# Without this, the browser would block all requests.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,  # http://localhost:5173
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,      # Allow cookies/auth headers
    allow_methods=["*"],         # Allow all HTTP methods (GET, POST, PUT, DELETE)
    allow_headers=["*"],         # Allow all headers (including Authorization)
)

# ============================================================
# CREATE DATABASE TABLES
# ============================================================
# This creates all the tables defined in our models (users, ratings, etc.)
# If the tables already exist, it does nothing (safe to run multiple times).

Base.metadata.create_all(bind=engine)

# ============================================================
# INCLUDE ROUTERS
# ============================================================
# Each router handles a group of related endpoints.
# We'll add more routers in later phases.

app.include_router(auth.router)
app.include_router(movies.router)          # Phase 3
# app.include_router(recommendations.router) # Phase 4
app.include_router(watchlist.router)        # Phase 5
app.include_router(ratings.router)          # Phase 5


# ============================================================
# ROOT ENDPOINT (Health Check)
# ============================================================

@app.get("/")
async def root():
    """Simple health check — visit http://localhost:8000 to verify the server is running."""
    return {
        "message": "MovieMate API is running!",
        "version": "1.0.0",
        "docs": "Visit /docs for API documentation"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "MovieMate API"}