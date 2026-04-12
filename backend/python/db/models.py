import datetime
import enum
from sqlalchemy import Column, Integer, String, JSON, DateTime, Enum, Text
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Modern SQLAlchemy 2.0 declarative base."""
    pass


class ApplicationStatus(enum.Enum):
    SCRAPED = "SCRAPED"
    MATCHED = "MATCHED"
    DRAFTED = "DRAFTED"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"
    APPLIED = "APPLIED"
    REPLIED = "REPLIED"
    INTERVIEW = "INTERVIEW"
    OFFER = "OFFER"
    REJECTED = "REJECTED"
    DISCARDED = "DISCARDED"


class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String, unique=True, index=True, nullable=False)

    # ── Job info ───────────────────────────────────────────────────────────
    company = Column(String, nullable=False, default="")
    title = Column(String, nullable=False, default="")
    location = Column(String, default="")
    url = Column(String, default="")

    # ── Match metadata ─────────────────────────────────────────────────────
    match_score = Column(Integer, default=0)
    matched_skills = Column(JSON, default=list)
    missing_skills = Column(JSON, default=list)
    recommendation = Column(String, default="")   # APPLY / BORDERLINE / SKIP
    platform = Column(String, default="")
    company_logo = Column(String, default="")

    # ── Application artifacts ──────────────────────────────────────────────
    cover_letter = Column(Text, default="")
    cover_letter_preview = Column(String(200), default="")
    form_data = Column(JSON, default=dict)
    tailored_resume_path = Column(String, default="")

    # ── Lifecycle ──────────────────────────────────────────────────────────
    status = Column(
        Enum(ApplicationStatus),
        default=ApplicationStatus.SCRAPED,
        nullable=False,
    )
    created_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        nullable=False,
    )
    updated_at = Column(
        DateTime,
        default=datetime.datetime.utcnow,
        onupdate=datetime.datetime.utcnow,
    )

    def __repr__(self) -> str:
        return f"<JobApplication {self.job_id} | {self.company} | {self.status}>"


class CandidateProfile(Base):
    __tablename__ = "candidate_profiles"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(String, unique=True, index=True, nullable=False)
    
    full_name = Column(String, default="")
    email = Column(String, default="")
    seniority = Column(String, default="")
    years_exp = Column(Integer, default=0)
    summary = Column(Text, default="")
    skills = Column(JSON, default=list)
    tech_stack = Column(JSON, default=list)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def __repr__(self) -> str:
        return f"<CandidateProfile {self.resume_id} | {self.full_name}>"


class JobCache(Base):
    __tablename__ = "job_cache"

    id = Column(Integer, primary_key=True, index=True)
    url = Column(String, unique=True, index=True, nullable=False)
    
    company = Column(String, default="")
    title = Column(String, default="")
    extracted_skills = Column(JSON, default=list)
    seniority = Column(String, default="")
    years_required = Column(Integer, default=0)
    company_logo = Column(String, default="")
    platform = Column(String, default="")
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    def __repr__(self) -> str:
        return f"<JobCache {self.url} | {self.company}>"


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Chat")
    resume_id = Column(String, index=True, nullable=True) # Link to a Role/Persona
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, index=True, nullable=False)
    role = Column(String, nullable=False) # 'user' or 'assistant'
    content = Column(Text, nullable=False)
    
    # Store LlamaIndex node ID if already indexed
    llama_node_id = Column(String, nullable=True)
    
    # Attachment metadata
    attachment_name = Column(String, nullable=True)
    attachment_path = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="AGENT") # AGENT, SYSTEM, UPDATE
    is_read = Column(Integer, default=0) # SQLite/Postgres compatible bool as int
    
    # Optional link to an application or job
    link = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CareerInsight(Base):
    __tablename__ = "career_insights"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(String, unique=True, index=True, nullable=False)
    payload = Column(JSON, nullable=False)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
