from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..schemas import NotificationResponse
from ...db.connection import get_db
from ...repositories.notification_repo import NotificationRepository
from ...services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Setup service
notif_repo = NotificationRepository()
notif_service = NotificationService(notif_repo)

@router.get("", response_model=List[NotificationResponse])
def list_notifications(limit: int = 50, db: Session = Depends(get_db)):
    return notif_service.get_user_notifications(db, limit)

@router.post("/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    count = notif_service.mark_all_read(db)
    return {"status": "success", "updated_count": count}
