"""
models/__init__.py — Export all database models.

This file makes it easy to import models from anywhere:
  from models import User, UserGenre, Movie, Rating, Watchlist, WatchHistory
"""

from models.user import User
from models.user_genre import UserGenre
from models.movie import Movie
from models.rating import Rating
from models.watchlist import Watchlist
from models.watch_history import WatchHistory
