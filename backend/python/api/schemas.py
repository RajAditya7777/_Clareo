from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from ..domain.enums import ApplicationStatus

class PipelineRequest(BaseModel):
    resume_id: str
    search_query: str

class ApplicationPayload(BaseModel):
    job_id: str
    company: str = ""
    title: str = ""
    location: str = ""
    url: str = ""
    match_score: int = 0
    matched_skills: List[str] = []
    missing_skills: List[str] = []
    recommendation: str = ""
    cover_letter: str = ""
    form_data: Dict[str, Any] = {}
    platform: str = ""
    company_logo: str = ""
    tailored_resume_path: str = ""
    status: str = "SCRAPED"

class ApplicationResponse(BaseModel):
    id: int
    job_id: str
    company: str
    title: str
    location: Optional[str] = None
    url: str = ""
    match_score: Optional[int] = None
    matched_skills: Optional[List[str]] = None
    missing_skills: Optional[List[str]] = None
    recommendation: Optional[str] = None
    platform: Optional[str] = None
    company_logo: Optional[str] = None
    tailored_resume_path: Optional[str] = None
    status: ApplicationStatus

    model_config = ConfigDict(from_attributes=True)

class CandidateProfilePayload(BaseModel):
    resume_id: str
    full_name: str = ""
    email: str = ""
    seniority: str = ""
    years_exp: int = 0
    summary: str = ""
    skills: List[str] = []
    tech_stack: List[str] = []

class JobCachePayload(BaseModel):
    url: str
    company: str = ""
    title: str = ""
    extracted_skills: List[str] = []
    seniority: str = ""
    years_required: int = 0
    company_logo: str = ""
    platform: str = ""

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: Optional[str] = None
    eliza_agents: Optional[int] = None
