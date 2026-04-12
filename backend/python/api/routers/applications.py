from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from ...db.connection import get_db
from ..schemas import ApplicationResponse, ApplicationPayload
from ...services.application_service import ApplicationService

router = APIRouter(prefix="/applications", tags=["applications"])
service = ApplicationService()

@router.get("", response_model=List[ApplicationResponse])
def get_applications(status: Optional[str] = None, db: Session = Depends(get_db)):
    return service.get_applications(db, status)

@router.get("/{job_id}", response_model=ApplicationResponse)
def get_application(job_id: str, db: Session = Depends(get_db)):
    app_record = service.get_application(db, job_id)
    if not app_record:
        raise HTTPException(status_code=404, detail=f"Application {job_id} not found")
    return app_record

@router.post("")
def create_or_update_application(payload: ApplicationPayload, db: Session = Depends(get_db)):
    return service.create_or_update(db, payload)

@router.delete("/{job_id}")
def delete_application(job_id: str, db: Session = Depends(get_db)):
    success = service.delete_application(db, job_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Application {job_id} not found")
    return {"status": "Deleted", "job_id": job_id}
