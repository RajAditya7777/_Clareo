"""
Clariyo API — FastAPI backend for the 7-agent ElizaOS pipeline.
Refactored to Clean Architecture with Routers, Services, and Repositories.
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from .db.connection import init_db
from .api.routers import applications, pipeline, profiles, jobs, health, chats, insights, notifications, resumes

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize DB tables."""
    init_db()
    yield

def create_app() -> FastAPI:
    app = FastAPI(
        title="Clariyo API",
        description="Scalable Clean Architecture Backend for Clariyo — 7-agent pipeline.",
        version="1.0.0",
        lifespan=lifespan,
    )

    # ── Middleware ──────────────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Router Registration ─────────────────────────────────────────────────
    app.include_router(health.router)
    app.include_router(applications.router, prefix="/api")
    app.include_router(pipeline.router, prefix="/api")
    app.include_router(profiles.router, prefix="/api")
    app.include_router(jobs.router, prefix="/api")
    app.include_router(chats.router, prefix="/api")
    app.include_router(insights.router, prefix="/api")
    app.include_router(notifications.router, prefix="/api")
    app.include_router(resumes.router, prefix="/api")

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
