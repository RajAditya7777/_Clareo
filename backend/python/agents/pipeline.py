"""
Agent pipeline runner — calls ElizaOS via Bun subprocess.

Skill used: bash-pro (hardened subprocess with timeout, path validation, env passthrough)
"""
import subprocess
import json
import os
import shutil
from pathlib import Path

TIMEOUT_SECONDS = 120
ELIZA_DIR = Path(__file__).resolve().parent.parent.parent


def _find_bun() -> str:
    """Locate the bun binary or raise a clear error."""
    bun = shutil.which("bun")
    if not bun:
        # Fallback to common install location
        home_bun = Path.home() / ".bun" / "bin" / "bun"
        if home_bun.exists():
            return str(home_bun)
            
        raise RuntimeError(
            "'bun' runtime not found on PATH.\n"
            "Install it: curl -fsSL https://bun.sh/install | bash"
        )
    return bun


from typing import Optional

def _extract_json_from_stdout(stdout: str) -> Optional[dict]:
    """Find the last valid JSON line in stdout (Eliza emits it as the final line)."""
    for line in reversed(stdout.strip().split("\n")):
        line = line.strip()
        if line.startswith("{") and line.endswith("}"):
            try:
                return json.loads(line)
            except json.JSONDecodeError:
                continue
    return None


def run_agent_pipeline(resume_id: str, job_search_query: str) -> dict:
    """
    Execute the 7-agent ElizaOS pipeline.

    Returns dict with:
      - status: "success" | "error"
      - pipeline_result: [...] (on success)
      - message: "..." (on error)
    """
    # ── Validate environment ───────────────────────────────────────────────
    bun = _find_bun()
    index_file = ELIZA_DIR / "src" / "index.ts"

    if not index_file.exists():
        return {
            "status": "error",
            "message": f"ElizaOS entry point not found: {index_file}",
        }

    # ── Build command ──────────────────────────────────────────────────────
    cmd = [
        bun, "run", str(index_file),
        f"--resume={resume_id}",
        f"--search={job_search_query}",
    ]

    # Pass all env vars to subprocess (includes .env loaded by FastAPI)
    env = {**os.environ}

    # ── Execute with timeout ───────────────────────────────────────────────
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            cwd=str(ELIZA_DIR),
            env=env,
        )

        if result.returncode != 0:
            return {
                "status": "error",
                "message": f"ElizaOS exited with code {result.returncode}",
                "stderr": (result.stderr or "")[-2000:],
            }

        # ── Parse JSON from stdout ─────────────────────────────────────────
        json_output = _extract_json_from_stdout(result.stdout)

        if json_output:
            return json_output

        return {
            "status": "error",
            "message": "No valid JSON found in ElizaOS stdout",
            "raw_stdout": (result.stdout or "")[-1000:],
        }

    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "message": f"Pipeline timed out after {TIMEOUT_SECONDS}s",
        }
    except FileNotFoundError:
        return {
            "status": "error",
            "message": f"Could not execute: {cmd[0]}",
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"Unexpected error: {type(e).__name__}: {e}",
        }
