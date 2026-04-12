import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from ..repositories.notification_repo import NotificationRepository
from ..db.models import Notification

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self, notification_repo: NotificationRepository):
        self.notification_repo = notification_repo

    def create_agent_notification(
        self, 
        db: Session, 
        title: str, 
        message: str, 
        link: Optional[str] = None
    ) -> Notification:
        """Create a notification triggered by an agent discovery or update."""
        notification = Notification(
            title=title,
            message=message,
            link=link,
            type="AGENT"
        )
        return self.notification_repo.create(db, notification)

    def get_user_notifications(self, db: Session, limit: int = 20) -> List[Notification]:
        """Fetch chronological list of notifications."""
        return self.notification_repo.get_recent(db, limit)

    def mark_all_read(self, db: Session) -> int:
        """Mark all unread notifications as read."""
        return self.notification_repo.mark_all_as_read(db)
