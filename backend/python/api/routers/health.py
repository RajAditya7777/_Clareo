from fastapi import APIRouter
from ..schemas import HealthResponse

router = APIRouter(tags=["system"])

@router.get("/health", response_model=HealthResponse)
def health_check():
    return {
        "status": "healthy",
        "service": "clariyo-api",
        "version": "1.1.0"
    }
