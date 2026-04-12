"""
Clariyo API — FastAPI backend for the 7-agent ElizaOS pipeline.
Refactored to Clean Architecture with Routers, Services, and Repositories.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .db.connection import init_db
from .api.routers import applications, pipeline, profiles, jobs, health

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize DB tables."""
    init_db()
    yield

def create_app() -> FastAPI:
    app = FastAPI(
        title="Clariyo API",
        description="AI-powered job application intelligence platform — 7-agent pipeline backend.",
        version="1.1.0",
        lifespan=lifespan,
    )

    # CORS configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002",
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:3001",
            "http://127.0.0.1:3002",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register Routers
    app.include_router(health.router)
    app.include_router(applications.router)
    app.include_router(pipeline.router)
    app.include_router(profiles.router)
    app.include_router(jobs.router)

    return app

app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.python.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
