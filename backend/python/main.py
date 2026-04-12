"""
Clariyo API — FastAPI backend for the 7-agent ElizaOS pipeline.

Skills used: fastapi-pro (lifespan, Pydantic v2, CORS, production patterns)
"""
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .db.connection import get_db, init_db
from .db.models import JobApplication, ApplicationStatus
from .agents.pipeline import run_agent_pipeline

load_dotenv()


# ── Pydantic request/response models ──────────────────────────────────────
class PipelineRequest(BaseModel):
    resume_id: str
    search_query: str


class ApplicationPayload(BaseModel):
    job_id: str
    company: str = ""
    title: str = ""
    location: str = ""
    url: str = ""
    match_score: int = 0
    matched_skills: list = []
    missing_skills: list = []
    recommendation: str = ""
    cover_letter: str = ""
    form_data: dict = {}
    status: str = "SCRAPED"


class ApplicationResponse(BaseModel):
    id: int
    job_id: str
    company: str
    title: str
    location: Optional[str] = None
    url: str = ""
    match_score: Optional[int] = None
    matched_skills: Optional[list] = None
    missing_skills: Optional[list] = None
    recommendation: Optional[str] = None
    status: str

    model_config = {"from_attributes": True}


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


# ── Lifespan (replaces deprecated @app.on_event) ──────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: initialize DB tables. Shutdown: nothing to clean up."""
    init_db()
    yield


# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Clariyo API",
    description="AI-powered job application intelligence platform — 7-agent pipeline backend.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow local frontends and any dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Helper: map status string to enum ──────────────────────────────────────
def _resolve_status(status_str: str) -> ApplicationStatus:
    try:
        return ApplicationStatus(status_str)
    except ValueError:
        return ApplicationStatus.SCRAPED


# ── Routes ─────────────────────────────────────────────────────────────────

@app.get("/health", response_model=HealthResponse)
def health_check():
    return {"status": "healthy", "service": "clariyo-api", "version": "1.0.0"}


@app.get("/applications", response_model=list[ApplicationResponse])
def get_applications(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Get all job applications, newest first. Optional filter by status."""
    query = db.query(JobApplication)
    if status:
        resolved = _resolve_status(status)
        query = query.filter(JobApplication.status == resolved)
    return query.order_by(JobApplication.created_at.desc()).all()


@app.get("/applications/{job_id}", response_model=ApplicationResponse)
def get_application(job_id: str, db: Session = Depends(get_db)):
    """Get a single application by job_id."""
    app_record = db.query(JobApplication).filter(
        JobApplication.job_id == job_id
    ).first()
    if not app_record:
        raise HTTPException(status_code=404, detail=f"Application {job_id} not found")
    return app_record


@app.post("/applications")
def create_or_update_application(
    payload: ApplicationPayload,
    db: Session = Depends(get_db),
):
    """Create a new application or update an existing one (by job_id)."""
    existing = db.query(JobApplication).filter(
        JobApplication.job_id == payload.job_id
    ).first()

    data = payload.model_dump()
    data["status"] = _resolve_status(data.get("status", "SCRAPED"))

    # Auto-generate cover_letter_preview
    if data.get("cover_letter"):
        data["cover_letter_preview"] = data["cover_letter"][:200]

    if existing:
        # Update existing record
        for key, val in data.items():
            if hasattr(existing, key) and val is not None:
                setattr(existing, key, val)
        db.commit()
        db.refresh(existing)
        return {"action": "updated", "job_id": payload.job_id, "id": existing.id}

    # Create new record
    new_app = JobApplication(**{
        k: v for k, v in data.items() if hasattr(JobApplication, k)
    })
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return {"action": "created", "job_id": new_app.job_id, "id": new_app.id}


@app.post("/start-pipeline")
def start_pipeline(
    request: PipelineRequest,
    background_tasks: BackgroundTasks,
):
    """Trigger the 7-agent ElizaOS pipeline in the background."""
    background_tasks.add_task(
        run_agent_pipeline,
        request.resume_id,
        request.search_query,
    )
    return {
        "status": "Processing",
        "message": "The 7-agent pipeline has been started.",
        "resume_id": request.resume_id,
        "search_query": request.search_query,
    }


@app.post("/confirm-apply/{job_id}")
def confirm_apply(job_id: str, db: Session = Depends(get_db)):
    """Human-In-The-Loop: confirm and submit an application."""
    application = db.query(JobApplication).filter(
        JobApplication.job_id == job_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail=f"Application {job_id} not found")

    if application.status == ApplicationStatus.APPLIED:
        return {"status": "Already applied", "job_id": job_id}

    application.status = ApplicationStatus.APPLIED
    db.commit()
    return {
        "status": "Success",
        "message": f"Application {job_id} confirmed and submitted.",
        "company": application.company,
        "title": application.title,
    }


@app.delete("/applications/{job_id}")
def delete_application(job_id: str, db: Session = Depends(get_db)):
    """Delete an application by job_id."""
    application = db.query(JobApplication).filter(
        JobApplication.job_id == job_id
    ).first()
    if not application:
        raise HTTPException(status_code=404, detail=f"Application {job_id} not found")
    db.delete(application)
    db.commit()
    return {"status": "Deleted", "job_id": job_id}


# ── Entrypoint ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "backend.python.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
