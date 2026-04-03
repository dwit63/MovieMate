"""
database.py — Database Setup with SQLAlchemy

SQLAlchemy is an ORM (Object-Relational Mapper). Instead of writing raw SQL
queries like "SELECT * FROM users WHERE id = 1", you write Python code like
User.query.get(1). SQLAlchemy translates Python code into SQL for you.

SQLite is a file-based database — it stores everything in a single .db file.
No need to install any database server. Perfect for development and academic projects.
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import settings

# Create the database engine
# check_same_thread=False is needed for SQLite to work with FastAPI
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite-specific setting
)

# SessionLocal is a factory that creates database sessions
# A "session" is like opening a connection to the database to do work
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class — all our database models will inherit from this
Base = declarative_base()


def get_db():
    """
    Dependency function that provides a database session.

    HOW THIS WORKS:
    - FastAPI calls this function before each request that needs a database
    - It creates a new session (connection)
    - The request uses the session to read/write data
    - After the request is done, the session is closed (connection returned)

    The 'yield' keyword makes this a generator — the code after yield
    runs AFTER the request is complete (cleanup).
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()