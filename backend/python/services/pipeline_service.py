from sqlalchemy.orm import Session
from ..agents.pipeline import run_agent_pipeline, stream_agent_pipeline, run_browser_apply
from ..repositories.notification_repo import NotificationRepository
from ..repositories.application_repo import ApplicationRepository
from ..repositories.profile_repo import ProfileRepository
from ..services.notification_service import NotificationService
from ..db.models import ApplicationStatus
from typing import Optional

class PipelineService:
    def __init__(self):
        self.app_repo = ApplicationRepository()
        self.profile_repo = ProfileRepository()
        self.notif_repo = NotificationRepository()
        self.notif_service = NotificationService(self.notif_repo)

    def start_background_pipeline(self, resume_id: str, search_query: str):
        # This calls the existing agent runner
        from ..agents.pipeline import run_agent_pipeline
        return run_agent_pipeline(resume_id, search_query)

    def stream_pipeline(self, db: Session, resume_id: str, search_query: str):
        # Fetch profile data while we have the DB session
        profile = self.profile_repo.get_by_resume_id(db, resume_id)
        profile_data = None
        if profile:
            profile_data = {
                "full_name": profile.full_name,
                "email": profile.email,
                "skills": profile.skills,
                "seniority": profile.seniority,
                "years_exp": profile.years_exp,
                "tech_stack": profile.tech_stack,
                "summary": profile.summary
            }
        
        # Create notification for pipeline start
        self.notif_service.create_agent_notification(
            db, 
            title="Analysis Started", 
            message=f"Agent pipeline is searching for '{search_query}' matches.",
            link="/chat"
        )

        # Pass the pre-fetched data to the generator (which will run for a long time)
        # We don't pass 'db' here because we want its lifecycle to end as soon as the generator starts or the controller returns
        return stream_agent_pipeline(resume_id, search_query, profile_data=profile_data)

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
        
        # Create notification for application confirmed
        self.notif_service.create_agent_notification(
            db,
            title="Application Submitted",
            message=f"The Closer agent has successfully submitted your application to {application.company}.",
            link=f"/chat" # Or a specific application page if we had one
        )
        
        return application, apply_data
