from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..schemas import CareerDashboardResponse
from ...db.connection import get_db
from ...repositories.application_repo import ApplicationRepository
from ...repositories.profile_repo import ProfileRepository
from ...repositories.job_cache_repo import JobCacheRepository
from ...repositories.insight_repo import InsightRepository
from ...services.insight_service import CareerInsightService

router = APIRouter(prefix="/insights", tags=["insights"])

# Setup service dependencies
app_repo = ApplicationRepository()
profile_repo = ProfileRepository()
cache_repo = JobCacheRepository()
insight_repo = InsightRepository()
insight_service = CareerInsightService(app_repo, profile_repo, cache_repo, insight_repo)

@router.get("", response_model=CareerDashboardResponse)
def get_career_insights(resume_id: str = "default", db: Session = Depends(get_db)):
    """
    Get the career dashboard. Prompts generation if no cache is found.
    """
    return insight_service.get_or_generate_dashboard(db, resume_id, force_refresh=False)

@router.post("/generate", response_model=CareerDashboardResponse)
def generate_career_insights(resume_id: str = "default", db: Session = Depends(get_db)):
    """
    Called by the Career Coach ElizaOS agent to run the deep-dive LLM synthesis.
    """
    return insight_service.get_or_generate_dashboard(db, resume_id, force_refresh=True)
