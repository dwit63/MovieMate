"""
main.py — FastAPI Application Entry Point

This is the main file that starts your backend server.
It sets up the app, configures CORS, includes all routers,
and creates the database tables.

"""

import asyncio
from concurrent.futures import ThreadPoolExecutor

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
from routers import recommendations
from routers import profile
from services.recommendation_engine import recommendation_engine

# Single-worker executor — used to run the blocking initialize() off the event loop
_executor = ThreadPoolExecutor(max_workers=1)

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
# INITIALIZE ML RECOMMENDATION ENGINE (background thread)
# ============================================================
# initialize() is CPU-bound and blocks for ~2 s (pickle load) or
# ~10–20 min (full rebuild). Running it in an executor lets the
# server accept requests immediately.  Endpoints that need the
# engine check recommendation_engine.is_loaded and return 503
# until it's ready.

@app.on_event("startup")
async def startup_event():
    loop = asyncio.get_event_loop()
    loop.run_in_executor(_executor, recommendation_engine.initialize)
    print("Server started. ML engine loading in background...")

# ============================================================
# INCLUDE ROUTERS
# ============================================================
# Each router handles a group of related endpoints.
# We'll add more routers in later phases.

app.include_router(auth.router)
app.include_router(movies.router)
app.include_router(watchlist.router)
app.include_router(ratings.router)
app.include_router(recommendations.router)
app.include_router(profile.router)


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