import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from .models import Base

load_dotenv()


def _get_database_url() -> str:
    """Get and validate DATABASE_URL from environment."""
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError(
            "DATABASE_URL environment variable is not set.\n"
            "Set it in your .env file:\n"
            "  DATABASE_URL=postgresql://user:pass@host/db?sslmode=require\n"
            "For NeonDB: copy the connection string from your Neon dashboard."
        )
    return url


DATABASE_URL = _get_database_url()

# ── Engine with production-grade pool settings ─────────────────────────────
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,          # test connections before use (handles NeonDB cold starts)
    pool_recycle=300,             # recycle connections every 5 min
    connect_args={
        "connect_timeout": 15,   # NeonDB can be slow on cold start
    },
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency: yields a DB session and cleans up after."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=engine)
