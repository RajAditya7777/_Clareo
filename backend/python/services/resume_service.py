import os
import json
import logging
import shutil
import uuid
from pathlib import Path
from sqlalchemy.orm import Session
from fastapi import UploadFile

from ..db.models import CandidateProfile
from ..repositories.profile_repo import ProfileRepository
from ..retrieval.llamaindex_setup import _get_llm

# LlamaIndex imports
try:
    from llama_index.core import SimpleDirectoryReader
    LLAMA_INDEX_AVAILABLE = True
except ImportError:
    LLAMA_INDEX_AVAILABLE = False

logger = logging.getLogger(__name__)

class ResumeService:
    def __init__(self):
        # We'll use a local repo instance since this is a stateless service helper
        from ..repositories.profile_repo import ProfileRepository
        self.profile_repo = ProfileRepository()
        self.uploads_dir = Path("./uploads")
        self.resumes_dir = Path("./resumes")
        
        self.uploads_dir.mkdir(parents=True, exist_ok=True)
        self.resumes_dir.mkdir(parents=True, exist_ok=True)

    async def process_resume_upload(self, db: Session, file: UploadFile) -> dict:
        """
        1. Save the file to uploads/
        2. Parse with LlamaIndex
        3. Extract structured profile data with DeepSeek
        4. Save to candidate_profiles table
        5. Return the profile data
        """
        # 1. Save file
        resume_id = str(uuid.uuid4())
        file_ext = os.path.splitext(file.filename)[1]
        filename = f"{resume_id}{file_ext}"
        upload_path = self.uploads_dir / filename
        resume_path = self.resumes_dir / filename

        with open(upload_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Also copy to resumes/ for vector index
        shutil.copy2(upload_path, resume_path)

        # 2. Parse text
        if not LLAMA_INDEX_AVAILABLE:
            logger.warning("LlamaIndex not available. Falling back to basic profile.")
            return self._create_fallback_profile(db, resume_id, file.filename)

        try:
            reader = SimpleDirectoryReader(input_files=[str(upload_path)])
            docs = reader.load_data()
            if not docs:
                raise ValueError("No text extracted from file")
            
            resume_text = docs[0].text
            
            # 3. Extract structured data
            llm = _get_llm()
            
            prompt = f"""
            Identify and extract the following information from this resume text.
            Return ONLY a valid JSON object. Do not include any other text or reasoning.
            
            JSON Structure:
            {{
                "full_name": string,
                "email": string,
                "seniority": "Junior" | "Mid-level" | "Senior" | "Lead",
                "years_exp": number,
                "summary": string (2-3 sentences),
                "skills": string[],
                "tech_stack": string[]
            }}
            
            Resume Text:
            {resume_text[:4000]}
            """
            
            response = llm.complete(prompt)
            raw_json = str(response)
            
            # Clean up response if it has markdown blocks
            if "```json" in raw_json:
                raw_json = raw_json.split("```json")[1].split("```")[0].strip()
            elif "{" in raw_json:
                raw_json = raw_json[raw_json.find("{"):raw_json.rfind("}")+1]

            profile_data = json.loads(raw_json)
            profile_data["resume_id"] = resume_id
            
            # 4. Save to DB
            new_profile = CandidateProfile(
                resume_id=resume_id,
                full_name=profile_data.get("full_name", "Unknown"),
                email=profile_data.get("email", ""),
                seniority=profile_data.get("seniority", "Mid-level"),
                years_exp=profile_data.get("years_exp", 0),
                summary=profile_data.get("summary", ""),
                skills=profile_data.get("skills", []),
                tech_stack=profile_data.get("tech_stack", [])
            )
            
            self.profile_repo.create(db, new_profile)
            
            return {
                "status": "success",
                "resume_id": resume_id,
                "profile": profile_data
            }

        except Exception as e:
            logger.error(f"Structured parsing failed: {e}")
            return self._create_fallback_profile(db, resume_id, file.filename)

    def _create_fallback_profile(self, db: Session, resume_id: str, filename: str) -> dict:
        """Create a skeleton profile if AI extraction fails."""
        new_profile = CandidateProfile(
            resume_id=resume_id,
            full_name=filename.split(".")[0],
            email="",
            seniority="Mid-level",
            years_exp=0,
            summary="New resume uploaded. AI analysis failed or was skipped.",
            skills=[],
            tech_stack=[]
        )
        self.profile_repo.create(db, new_profile)
        return {
            "status": "partial_success",
            "resume_id": resume_id,
            "message": "File uploaded but AI analysis failed."
        }
