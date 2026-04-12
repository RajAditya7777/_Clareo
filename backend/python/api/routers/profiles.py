from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ...db.connection import get_db
from ..schemas import CandidateProfilePayload
from ...services.profile_service import ProfileService

router = APIRouter(prefix="/profiles", tags=["profiles"])
service = ProfileService()

@router.get("/{resume_id}")
def get_profile(resume_id: str, db: Session = Depends(get_db)):
    profile = service.get_profile(db, resume_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.post("")
def save_profile(payload: CandidateProfilePayload, db: Session = Depends(get_db)):
    service.save_profile(db, payload)
    return {"status": "success", "resume_id": payload.resume_id}
