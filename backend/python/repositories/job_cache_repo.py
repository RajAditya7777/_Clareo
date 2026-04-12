from typing import Optional
from sqlalchemy.orm import Session
from .base import BaseRepository
from ..db.models import JobCache

class JobCacheRepository(BaseRepository[JobCache]):
    def __init__(self):
        super().__init__(JobCache)

    def get_by_url(self, db: Session, url: str) -> Optional[JobCache]:
        return db.query(self.model).filter(self.model.url == url).first()
