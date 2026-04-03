"""
models/user.py — User Database Model

A "model" defines the structure of a database table. Each class attribute
becomes a column in the table. SQLAlchemy creates the actual SQL table
from this Python class.
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from database import Base


class User(Base):
    """
    Users table — stores all registered user accounts.

    Columns:
    - id: Unique number for each user (auto-generated)
    - name: Display name shown in the app
    - email: Login email (must be unique — no two users can have same email)
    - hashed_password: Scrambled password (NEVER store plain text passwords!)
    - preferred_genres: JSON string of genre names picked during onboarding
    - is_onboarded: Has the user completed the onboarding flow?
    - created_at: When the account was created (auto-set to current time)
    """

    __tablename__ = "users"  # This is the actual table name in the database

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    preferred_genres = Column(Text, default="[]")  # Stored as JSON string
    is_onboarded = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())