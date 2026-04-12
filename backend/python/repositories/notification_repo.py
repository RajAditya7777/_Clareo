from typing import List
from sqlalchemy.orm import Session
from ..db.models import Notification
from .base import BaseRepository

class NotificationRepository(BaseRepository[Notification]):
    def __init__(self):
        super().__init__(Notification)

    def get_unread(self, db: Session, limit: int = 50) -> List[Notification]:
        """Fetch all unread notifications."""
        return db.query(Notification).filter(Notification.is_read == 0).order_by(Notification.created_at.desc()).limit(limit).all()

    def mark_all_as_read(self, db: Session) -> int:
        """Mark all unread notifications as read. Returns count of updated rows."""
        result = db.query(Notification).filter(Notification.is_read == 0).update({Notification.is_read: 1})
        db.commit()
        return result

    def get_recent(self, db: Session, limit: int = 20) -> List[Notification]:
        """Fetch latest notifications regardless of read status."""
        return db.query(Notification).order_by(Notification.created_at.desc()).limit(limit).all()
