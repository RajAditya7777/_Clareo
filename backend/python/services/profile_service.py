from sqlalchemy.orm import Session
from ..repositories.profile_repo import ProfileRepository
from ..api.schemas import CandidateProfilePayload
from ..db.models import CandidateProfile

class ProfileService:
    def __init__(self):
        self.repo = ProfileRepository()

    def get_profile(self, db: Session, resume_id: str):
        return self.repo.get_by_resume_id(db, resume_id)

    def get_all_profiles(self, db: Session):
        return self.repo.list_all_roles(db)

    def save_profile(self, db: Session, payload: CandidateProfilePayload):
        existing = self.repo.get_by_resume_id(db, payload.resume_id)
        data = payload.model_dump()
        
        if existing:
            return self.repo.update(db, existing, data)
        else:
            new_profile = CandidateProfile(**data)
            return self.repo.create(db, new_profile)

    def delete_profile(self, db: Session, resume_id: str):
        profile = self.repo.get_by_resume_id(db, resume_id)
        if profile:
            self.repo.delete(db, profile.id)
            return True
        return False
