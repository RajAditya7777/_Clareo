from typing import Optional, List
from sqlalchemy.orm import Session
from .base import BaseRepository
from ..db.models import JobApplication, ApplicationStatus

class ApplicationRepository(BaseRepository[JobApplication]):
    def __init__(self):
        super().__init__(JobApplication)

    def get_by_job_id(self, db: Session, job_id: str) -> Optional[JobApplication]:
        return db.query(self.model).filter(self.model.job_id == job_id).first()

    def get_by_status(self, db: Session, status: ApplicationStatus) -> List[JobApplication]:
        return db.query(self.model).filter(self.model.status == status).order_by(self.model.created_at.desc()).all()

    def get_all_ordered(self, db: Session) -> List[JobApplication]:
        return db.query(self.model).order_by(self.model.created_at.desc()).all()
