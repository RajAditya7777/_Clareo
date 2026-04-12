"""
LlamaIndex vector-based resume matching.

Skill used: ai-ml (RAG implementation, vector search, retry patterns)
"""
import os
import re
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

load_dotenv()

# ── Graceful imports (don't crash if llama-index not installed) ────────────
try:
    from llama_index.core import (
        VectorStoreIndex,
        SimpleDirectoryReader,
        StorageContext,
        load_index_from_storage,
    )
    from llama_index.llms.openai_like import OpenAILike

    LLAMA_INDEX_AVAILABLE = True
except ImportError:
    LLAMA_INDEX_AVAILABLE = False


# ── Configuration ──────────────────────────────────────────────────────────
NOSANA_LLM_URL = os.getenv("NOSANA_LLM_URL", "https://node.nosana.io")
NOSANA_MODEL = os.getenv("NOSANA_MODEL_NAME", "nosana-job-llm")
RESUMES_DIR = Path(os.getenv("RESUMES_DIR", "./resumes"))
PERSIST_DIR = Path(os.getenv("VECTOR_STORE_DIR", "./storage"))
MAX_RETRIES = 3
RETRY_DELAY_SECONDS = 2


def _ensure_resumes_dir() -> bool:
    """Ensure the resumes directory exists. Returns True if it has files."""
    if not RESUMES_DIR.exists():
        RESUMES_DIR.mkdir(parents=True, exist_ok=True)
        # Create placeholder README so the user knows to put resumes here
        readme_path = RESUMES_DIR / "README.md"
        readme_path.write_text(
            "# Resumes Directory\n\n"
            "Place PDF resumes here for LlamaIndex to index.\n"
            "Supported formats: .pdf, .txt, .md, .docx\n"
        )
        return False
    return any(RESUMES_DIR.iterdir())


def _get_llm():
    """Create the LLM client."""
    if not LLAMA_INDEX_AVAILABLE:
        raise ImportError("llama-index is not installed. Run: pip install llama-index-core llama-index-readers-file llama-index-llms-openai-like")

    return OpenAILike(
        model=NOSANA_MODEL,
        api_base=NOSANA_LLM_URL,
        api_key=os.getenv("NOSANA_API_KEY", "nosana"),  # Some endpoints require a key
        is_chat_model=True,
        timeout=60,
    )


def get_resume_index() -> Optional[object]:
    """
    Build or load the resume vector index.
    Returns None if resumes dir is empty or indexing fails.
    """
    if not LLAMA_INDEX_AVAILABLE:
        return None

    try:
        if PERSIST_DIR.exists() and any(PERSIST_DIR.iterdir()):
            # Load from cache
            storage_context = StorageContext.from_defaults(persist_dir=str(PERSIST_DIR))
            return load_index_from_storage(storage_context)

        if not _ensure_resumes_dir():
            return None  # No resumes to index

        # Build fresh index
        documents = SimpleDirectoryReader(str(RESUMES_DIR)).load_data()
        if not documents:
            return None

        index = VectorStoreIndex.from_documents(documents)
        index.storage_context.persist(str(PERSIST_DIR))
        return index

    except Exception as e:
        print(f"[LlamaIndex] Warning: Failed to build index: {e}")
        return None


def _extract_score(text: str) -> int:
    """Pull a numeric score from LLM response text."""
    # Look for patterns like "score: 85", "Score: 85/100", "match score of 85"
    patterns = [
        r"score[:\s]+(\d{1,3})",
        r"(\d{1,3})\s*(?:/100|%|out of 100)",
        r"match[:\s]+(\d{1,3})",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            score = int(match.group(1))
            return min(100, max(0, score))
    return 0


def match_job_to_resume(job_description: str) -> dict:
    """
    Semantically match a job description against indexed resumes.

    Returns:
        {"score": 85, "explanation": "...", "source": "llamaindex|fallback"}
    """
    index = get_resume_index()

    if index is None:
        return {
            "score": 0,
            "explanation": "No resumes indexed. Upload PDF resumes to the /resumes directory.",
            "source": "none",
        }

    llm = _get_llm()
    query_engine = index.as_query_engine(llm=llm)

    prompt = (
        f"Calculate a match score (0-100) for this job description "
        f"based on the candidate's resume. Be specific about which skills "
        f"match and which are missing.\n\n"
        f"Job Description:\n{job_description[:3000]}"
    )

    # ── Retry loop ─────────────────────────────────────────────────────────
    last_error = ""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            response = query_engine.query(prompt)
            response_text = str(response)
            score = _extract_score(response_text)

            return {
                "score": score,
                "explanation": response_text,
                "source": "llamaindex",
            }

        except Exception as e:
            last_error = str(e)
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY_SECONDS * attempt)
            continue

    return {
        "score": 0,
        "explanation": f"LLM matching failed after {MAX_RETRIES} attempts: {last_error}",
        "source": "error",
    }