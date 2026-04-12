from typing import Optional
from sqlalchemy.orm import Session
from .base import BaseRepository
from ..db.models import CandidateProfile

class ProfileRepository(BaseRepository[CandidateProfile]):
    def __init__(self):
        super().__init__(CandidateProfile)

    def get_by_resume_id(self, db: Session, resume_id: str) -> Optional[CandidateProfile]:
        return db.query(self.model).filter(self.model.resume_id == resume_id).first()
