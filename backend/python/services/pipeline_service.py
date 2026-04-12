from sqlalchemy.orm import Session
from ..agents.pipeline import run_agent_pipeline, stream_agent_pipeline, run_browser_apply
from ..repositories.application_repo import ApplicationRepository
from ..repositories.profile_repo import ProfileRepository
from ..db.models import ApplicationStatus
from typing import Optional

class PipelineService:
    def __init__(self):
        self.app_repo = ApplicationRepository()
        self.profile_repo = ProfileRepository()

    def start_background_pipeline(self, resume_id: str, search_query: str):
        # This calls the existing agent runner
        from ..agents.pipeline import run_agent_pipeline
        return run_agent_pipeline(resume_id, search_query)

    def stream_pipeline(self, db: Session, resume_id: str, search_query: str):
        return stream_agent_pipeline(resume_id, search_query, db)

    def confirm_and_apply(self, db: Session, job_id: str, resume_id: Optional[str] = None):
        application = self.app_repo.get_by_job_id(db, job_id)
        if not application:
            return None, "Application not found"

        if application.status == ApplicationStatus.APPLIED:
            return application, "Already applied"

        # Update status
        application.status = ApplicationStatus.APPLIED
        db.commit()

        # Get profile for metadata
        profile = None
        if resume_id:
            profile = self.profile_repo.get_by_resume_id(db, resume_id)

        # Prepare background apply task data
        apply_data = {
            "job_id": application.job_id,
            "job_url": application.url,
            "resume_path": application.tailored_resume_path,
            "cover_letter": application.cover_letter,
            "full_name": profile.full_name if profile else "Professional Candidate",
            "email": profile.email if profile else ""
        }
        
        return application, apply_data
