"""
models/__init__.py — Export all database models.

This file makes it easy to import models from anywhere:
  from models import User, Rating, Watchlist, WatchHistory
"""

from models.user import User
from models.rating import Rating
from models.watchlist import Watchlist
from models.watch_history import WatchHistory