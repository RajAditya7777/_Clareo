from typing import List, Optional, Any, Dict
from sqlalchemy.orm import Session
from ..repositories.application_repo import ApplicationRepository
from ..api.schemas import ApplicationPayload
from ..db.models import JobApplication, ApplicationStatus

class ApplicationService:
    def __init__(self):
        self.repo = ApplicationRepository()

    def get_applications(self, db: Session, status: Optional[str] = None) -> List[JobApplication]:
        if status:
            try:
                resolved_status = ApplicationStatus(status.upper())
                return self.repo.get_by_status(db, resolved_status)
            except ValueError:
                return []
        return self.repo.get_all_ordered(db)

    def get_application(self, db: Session, job_id: str) -> Optional[JobApplication]:
        return self.repo.get_by_job_id(db, job_id)

    def create_or_update(self, db: Session, payload: ApplicationPayload) -> Dict[str, Any]:
        existing = self.repo.get_by_job_id(db, payload.job_id)
        data = payload.model_dump()
        
        # Resolve status
        try:
            status_val = data.get("status", "SCRAPED").upper()
            data["status"] = ApplicationStatus(status_val)
        except ValueError:
            data["status"] = ApplicationStatus.SCRAPED

        # Auto-generate cover_letter_preview
        if data.get("cover_letter"):
            data["cover_letter_preview"] = data["cover_letter"][:200]

        if existing:
            updated = self.repo.update(db, existing, data)
            return {"action": "updated", "job_id": payload.job_id, "id": updated.id}

        new_app = JobApplication(**{
            k: v for k, v in data.items() if hasattr(JobApplication, k)
        })
        created = self.repo.create(db, new_app)
        return {"action": "created", "job_id": created.job_id, "id": created.id}

    def delete_application(self, db: Session, job_id: str) -> bool:
        application = self.repo.get_by_job_id(db, job_id)
        if application:
            db.delete(application)
            db.commit()
            return True
        return False
