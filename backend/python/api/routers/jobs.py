from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ...db.connection import get_db
from ..schemas import JobCachePayload
from ...repositories.job_cache_repo import JobCacheRepository
from ...db.models import JobCache

router = APIRouter(prefix="/job-cache", tags=["jobs"])
repo = JobCacheRepository()

@router.get("")
def get_job_cache(url: str, db: Session = Depends(get_db)):
    cache = repo.get_by_url(db, url)
    if not cache:
        return None
    return cache

@router.post("")
def save_job_cache(payload: JobCachePayload, db: Session = Depends(get_db)):
    existing = repo.get_by_url(db, payload.url)
    data = payload.model_dump()
    
    if existing:
        repo.update(db, existing, data)
    else:
        new_cache = JobCache(**data)
        repo.create(db, new_cache)
    
    return {"status": "success", "url": payload.url}
