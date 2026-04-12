from typing import List, Optional
from sqlalchemy.orm import Session
from ..db.models import ChatSession, ChatMessage
from .base import BaseRepository

class ChatRepository(BaseRepository[ChatSession]):
    def __init__(self):
        super().__init__(ChatSession)

    def get_user_sessions(self, db: Session, limit: int = 20) -> List[ChatSession]:
        """Fetch chronological list of recent chat sessions."""
        return db.query(ChatSession).order_by(ChatSession.updated_at.desc()).limit(limit).all()

    def create_session(self, db: Session, title: str, resume_id: str = None) -> ChatSession:
        """Initialize a new chat session."""
        session = ChatSession(title=title, resume_id=resume_id)
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_messages(self, db: Session, session_id: int) -> List[ChatMessage]:
        """Fetch all messages for a specific session."""
        return db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at.asc()).all()

    def add_message(
        self, 
        db: Session, 
        session_id: int, 
        role: str, 
        content: str,
        attachment_name: Optional[str] = None,
        attachment_path: Optional[str] = None
    ) -> ChatMessage:
        """Append a new message to a session and update the session's timestamp."""
        # Update session timestamp
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if session:
            import datetime
            session.updated_at = datetime.datetime.utcnow()
        
        message = ChatMessage(
            session_id=session_id, 
            role=role, 
            content=content,
            attachment_name=attachment_name,
            attachment_path=attachment_path
        )
        db.add(message)
        db.commit()
        db.refresh(message)
        return message

    def delete_session(self, db: Session, session_id: int) -> bool:
        """Permanently delete a session and all its messages."""
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            return False
        
        # Manually delete child messages
        db.query(ChatMessage).filter(ChatMessage.session_id == session_id).delete()
        
        # Delete session
        db.delete(session)
        db.commit()
        return True

class MessageRepository(BaseRepository[ChatMessage]):
    def __init__(self):
        super().__init__(ChatMessage)
