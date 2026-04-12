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


# ── Chat & Memory ──────────────────────────────────────────────────────────

class ChatMessagePayload(BaseModel):
    role: str
    content: str
    attachment_name: Optional[str] = None
    attachment_path: Optional[str] = None

class ChatSessionPayload(BaseModel):
    title: str = "New Chat"
    resume_id: Optional[str] = None

class ChatMessageResponse(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    attachment_name: Optional[str] = None
    attachment_path: Optional[str] = None
    created_at: Any
    model_config = ConfigDict(from_attributes=True)

class ChatSessionResponse(BaseModel):
    id: int
    title: str
    resume_id: Optional[str] = None
    created_at: Any
    updated_at: Any
    model_config = ConfigDict(from_attributes=True)


# ── Career Insights ────────────────────────────────────────────────────────

class SalaryImpact(BaseModel):
    skill: str
    impact: str
    percent: int

class HiringDemand(BaseModel):
    skill: str
    demand: str
    value: int

class RoleOpportunity(BaseModel):
    role: str
    current: str
    transition_difficulty: str

class MarketInsights(BaseModel):
    top_companies: List[str]
    trends: List[str]

class SkillGapItem(BaseModel):
    skill: str
    importance: int
    status: str

class EmergingRole(BaseModel):
    role: str
    growth_rate: str

class LearningPriorityItem(BaseModel):
    skill: str
    roi: int
    reason: str

class CareerDashboardResponse(BaseModel):
    salary_impact: List[SalaryImpact]
    hiring_demand: List[HiringDemand]
    role_opportunities: List[RoleOpportunity]
    market_insights: MarketInsights
    skill_gap: List[SkillGapItem]
    emerging_roles: List[EmergingRole]
    learning_priority: List[LearningPriorityItem]


# ── Notifications ──────────────────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: Any
    model_config = ConfigDict(from_attributes=True)
