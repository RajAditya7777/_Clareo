import json
import logging
from typing import Dict, List, Any
from sqlalchemy.orm import Session


from ..repositories.application_repo import ApplicationRepository
from ..repositories.profile_repo import ProfileRepository
from ..repositories.job_cache_repo import JobCacheRepository
from ..repositories.insight_repo import InsightRepository
from ..retrieval.llamaindex_setup import match_job_to_resume, _get_llm

logger = logging.getLogger(__name__)

class CareerInsightService:
    def __init__(
        self,
        application_repo: ApplicationRepository,
        profile_repo: ProfileRepository,
        job_cache_repo: JobCacheRepository,
        insight_repo: InsightRepository
    ):
        self.application_repo = application_repo
        self.profile_repo = profile_repo
        self.job_cache_repo = job_cache_repo
        self.insight_repo = insight_repo

    def get_or_generate_dashboard(self, db: Session, resume_id: str, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Synthesizes internal application data and LLM market knowledge.
        Returns cached insights instantly if available and force_refresh is False.
        """
        if not force_refresh:
            cached = self.insight_repo.get_by_resume(db, resume_id)
            if cached:
                logger.info(f"Returning cached insights for {resume_id}")
                return cached.payload

        profile = self.profile_repo.get_by_resume_id(db, resume_id)
        if not profile:
            return {"error": "Profile not found"}

        # Fetch recent application stats for internal context
        apps = self.application_repo.get_all(db, limit=50)
        jobs = self.job_cache_repo.get_all(db, limit=50)

        # ── LLM Insight Synthesis ──────────────────────────────────────────
        llm = _get_llm()
        
        prompt = f"""
        Analyze this candidate profile and the current job market to generate strategic career insights.
        
        Candidate Profile:
        - Skills: {profile.skills}
        - Tech Stack: {profile.tech_stack}
        - Experience: {profile.years_exp} years ({profile.seniority})
        
        Recent Internal Data:
        - Scanned {len(jobs)} relevant jobs.
        - Applied to {len([a for a in apps if a.status.value != 'SCRAPED'])} jobs.
        
        Task: 
        Generate extremely detailed, visual-oriented data for these 7 categories. 
        Return ONLY a JSON object with this structure:
        {{
            "salary_impact": [{{ "skill": string, "impact": string, "percent": number }}],
            "hiring_demand": [{{ "skill": string, "demand": "High"|"Medium"|"Low", "value": number }}],
            "role_opportunities": [{{ "role": string, "current": string, "transition_difficulty": string }}],
            "market_insights": {{ "top_companies": string[], "trends": string[] }},
            "skill_gap": [{{ "skill": string, "importance": number, "status": "Missing"|"Met" }}],
            "emerging_roles": [{{ "role": string, "growth_rate": string }}],
            "learning_priority": [{{ "skill": string, "roi": number, "reason": string }}]
        }}
        
        Be specific and data-driven based on current 2024-2025 tech market trends (AI, Web3, Cloud).
        """
        
        try:
            response = llm.complete(prompt)
            text = str(response)
            json_match = text[text.find("{"):text.rfind("}")+1]
            payload = json.loads(json_match)
            
            # Cache the new insights!
            self.insight_repo.upsert_insights(db, resume_id, payload)
            return payload

        except Exception as e:
            logger.error(f"Failed to generate insights: {e}")
            # Fallback mock data structure if LLM fails
            return {
                "salary_impact": [{"skill": "React + Node.js", "impact": "+$30k", "percent": 30}],
                "hiring_demand": [{"skill": "Python/AI", "demand": "High", "value": 95}],
                "role_opportunities": [{"role": "AI Engineer", "current": "Fullstack", "transition_difficulty": "Medium"}],
                "market_insights": {"top_companies": ["OpenAI", "Anthropic", "Google"], "trends": ["AI-First Development"]},
                "skill_gap": [{"skill": "Docker", "importance": 80, "status": "Missing"}],
                "emerging_roles": [{"role": "Agentic AI Developer", "growth_rate": "Extreme"}],
                "learning_priority": [{"skill": "LlamaIndex/LangChain", "roi": 90, "reason": "High demand for RAG engineers"}]
            }

