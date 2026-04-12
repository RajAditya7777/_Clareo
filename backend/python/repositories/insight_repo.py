import logging
from typing import Optional
from sqlalchemy.orm import Session
from ..db.models import CareerInsight
from .base import BaseRepository

logger = logging.getLogger(__name__)

class InsightRepository(BaseRepository[CareerInsight]):
    def __init__(self):
        super().__init__(CareerInsight)

    def get_by_resume(self, db: Session, resume_id: str) -> Optional[CareerInsight]:
        """Fetch the pre-generated insights for a specific resume."""
        return db.query(CareerInsight).filter(CareerInsight.resume_id == resume_id).first()

    def upsert_insights(self, db: Session, resume_id: str, payload: dict) -> CareerInsight:
        """Create or update the insights payload for a given resume."""
        existing = self.get_by_resume(db, resume_id)
        if existing:
            existing.payload = payload
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_insight = CareerInsight(resume_id=resume_id, payload=payload)
            db.add(new_insight)
            db.commit()
            db.refresh(new_insight)
            return new_insight
