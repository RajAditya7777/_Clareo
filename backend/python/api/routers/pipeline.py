from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from ...db.connection import get_db
from ..schemas import PipelineRequest
from ...services.pipeline_service import PipelineService
from ...agents.pipeline import run_agent_pipeline, run_browser_apply

router = APIRouter(tags=["pipeline"])
service = PipelineService()

@router.post("/start-pipeline")
def start_pipeline(request: PipelineRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        service.start_background_pipeline,
        request.resume_id,
        request.search_query,
    )
    return {
        "status": "Processing",
        "message": "The 7-agent pipeline has been started.",
        "resume_id": request.resume_id,
        "search_query": request.search_query,
    }

@router.get("/stream-pipeline")
def stream_pipeline(resume_id: str, search_query: str):
    # We do NOT use Depends(get_db) here because it would hold the session 
    # open for the full duration of the StreamingResponse (up to 120s).
    # Instead, we fetch what we need quickly and close the session.
    from ...db.connection import create_manual_session
    db = create_manual_session()
    try:
        generator = service.stream_pipeline(db, resume_id, search_query)
    finally:
        db.close()
        
    return StreamingResponse(
        generator,
        media_type="text/event-stream"
    )

@router.post("/confirm-apply/{job_id}")
def confirm_apply(
    job_id: str, 
    background_tasks: BackgroundTasks,
    resume_id: str = None,
    db: Session = Depends(get_db)
):
    application, result = service.confirm_and_apply(db, job_id, resume_id)
    
    if application is None:
        raise HTTPException(status_code=404, detail=result)
        
    if isinstance(result, str) and result == "Already applied":
        return {"status": "Already applied", "job_id": job_id}

    # Trigger Browser Automation in Background
    background_tasks.add_task(run_browser_apply, **result)

    return {
        "status": "Success",
        "message": f"Application {job_id} confirmed. Submission agent started.",
        "company": application.company,
        "title": application.title,
    }
