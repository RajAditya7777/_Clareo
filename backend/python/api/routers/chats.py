from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from ..schemas import ChatSessionResponse, ChatMessageResponse, ChatMessagePayload, ChatSessionPayload
from ...db.connection import get_db
from ...repositories.chat_repo import ChatRepository
from ...retrieval.llamaindex_setup import index_chat_message

router = APIRouter(prefix="/chats", tags=["chats"])
chat_repo = ChatRepository()

@router.post("", response_model=ChatSessionResponse)
def create_chat(payload: ChatSessionPayload, db: Session = Depends(get_db)):
    return chat_repo.create_session(db, payload.title, payload.resume_id)

@router.get("", response_model=List[ChatSessionResponse])
def list_chats(db: Session = Depends(get_db)):
    return chat_repo.get_user_sessions(db)

@router.get("/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(session_id: int, db: Session = Depends(get_db)):
    return chat_repo.get_messages(db, session_id)

@router.post("/{session_id}/messages", response_model=ChatMessageResponse)
def add_message(
    session_id: int, 
    payload: ChatMessagePayload, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    msg = chat_repo.add_message(
        db, 
        session_id, 
        payload.role, 
        payload.content,
        attachment_name=payload.attachment_name,
        attachment_path=payload.attachment_path
    )
    
    # Trigger Semantic Memory Indexing in the background
    background_tasks.add_task(
        index_chat_message, 
        payload.role, 
        payload.content, 
        f"msg_{msg.id}"
    )
        
    return msg

@router.delete("/{session_id}")
def delete_chat(session_id: int, db: Session = Depends(get_db)):
    success = chat_repo.delete_session(db, session_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat session not found")
    return {"status": "success", "message": "Chat session and messages deleted"}
