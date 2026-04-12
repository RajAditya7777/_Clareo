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

    # ── Application artifacts ──────────────────────────────────────────────
    cover_letter = Column(Text, default="")
    cover_letter_preview = Column(String(200), default="")
    form_data = Column(JSON, default=dict)

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
