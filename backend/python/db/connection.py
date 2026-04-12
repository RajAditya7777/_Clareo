import os
from typing import Optional
from dotenv import load_dotenv
from sqlalchemy import create_engine, Engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from .models import Base

load_dotenv()

_engine: Optional[Engine] = None
_SessionLocal: Optional[sessionmaker] = None

def get_engine() -> Engine:
    """Lazy initialization of the SQLAlchemy engine."""
    global _engine
    if _engine is None:
        url = os.getenv("DATABASE_URL")
        if not url:
            raise ValueError(
                "DATABASE_URL environment variable is not set.\n"
                "Set it in your .env file."
            )
        _engine = create_engine(
            url,
            poolclass=QueuePool,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={"connect_timeout": 15},
        )
    return _engine

def get_session_factory() -> sessionmaker:
    """Lazy initialization of the session factory."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            autocommit=False, 
            autoflush=False, 
            bind=get_engine()
        )
    return _SessionLocal

def get_db():
    """FastAPI dependency: yields a DB session and cleans up after."""
    factory = get_session_factory()
    db = factory()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Create all tables if they don't exist."""
    Base.metadata.create_all(bind=get_engine())

# For manual usage outside of FastAPI dependency injection
def get_session() -> Session:
    return get_session_factory()()
