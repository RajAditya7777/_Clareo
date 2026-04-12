from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from ...db.connection import get_db
from ...services.resume_service import ResumeService

router = APIRouter(prefix="/upload-resume", tags=["resumes"])
service = ResumeService()

@router.post("")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a resume file (PDF, DOCX, TXT), parse it, 
    and create a candidate profile.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file filename provided")
    
    # Check file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ["pdf", "docx", "txt", "md"]:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported file format: {ext}. Please upload a PDF, DOCX, or text file."
        )

    try:
        result = await service.process_resume_upload(db, file)
        return result
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Upload router error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
