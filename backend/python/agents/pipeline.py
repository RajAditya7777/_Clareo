"""
Agent pipeline runner — calls ElizaOS via Bun subprocess.

Skill used: bash-pro (hardened subprocess with timeout, path validation, env passthrough)
"""
import subprocess
import json
import os
import shutil
import base64
from pathlib import Path
from sqlalchemy.orm import Session
from ..db.models import CandidateProfile
from ..db.connection import SessionLocal

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


from typing import Optional, Generator

def stream_agent_pipeline(resume_id: str, job_search_query: str, db: Session = None) -> Generator[str, None, None]:
    """
    Execute the 7-agent ElizaOS pipeline and yield status events as SSE-formatted strings.
    """
    bun = _find_bun()
    index_file = ELIZA_DIR / "src" / "index.ts"

    if not index_file.exists():
        yield f"data: {json.dumps({'status': 'error', 'message': f'Entry point not found: {index_file}'})}\n\n"
        return

    # Check for cached profile
    profile_arg = None
    session = db if db else SessionLocal()
    try:
        profile = session.query(CandidateProfile).filter(CandidateProfile.resume_id == resume_id).first()
        if profile:
            profile_data = {
                "full_name": profile.full_name,
                "email": profile.email,
                "skills": profile.skills,
                "seniority": profile.seniority,
                "years_exp": profile.years_exp,
                "tech_stack": profile.tech_stack,
                "summary": profile.summary
            }
            profile_json = json.dumps(profile_data)
            profile_arg = base64.b64encode(profile_json.encode()).decode()
    finally:
        if not db: session.close()

    cmd = [
        bun, "run", str(index_file),
        f"--resume={resume_id}",
        f"--search={job_search_query}",
    ]
    if profile_arg:
        cmd.append(f"--profile={profile_arg}")

    env = {**os.environ}
    
    # Use Popen to stream stdout/stderr
    process = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1,
        cwd=str(ELIZA_DIR),
        env=env,
    )

    # Helper to stream stderr (which contains [Clariyo] status messages) 
    # and final stdout (JSON result)
    import selectors
    sel = selectors.DefaultSelector()
    sel.register(process.stdout, selectors.EVENT_READ)
    sel.register(process.stderr, selectors.EVENT_READ)

    stdout_acc = []
    
    while True:
        for key, _ in sel.select():
            line = key.fileobj.readline()
            if not line:
                sel.unregister(key.fileobj)
                continue
            
            if key.fileobj is process.stderr:
                line = line.strip()
                if "[Clariyo]" in line:
                    # Clean up the log message and yield as a step event
                    msg = line.split("[Clariyo]")[-1].strip()
                    yield f"data: {json.dumps({'type': 'step', 'message': msg})}\n\n"
            else:
                stdout_acc.append(line)

        if process.poll() is not None:
            break

    # After process finishes, parse the accumulated stdout for the final result
    full_stdout = "".join(stdout_acc)
    json_output = _extract_json_from_stdout(full_stdout)

    if json_output:
        yield f"data: {json.dumps({'type': 'result', 'data': json_output})}\n\n"
    elif process.returncode != 0:
        yield f"data: {json.dumps({'type': 'error', 'message': f'Exited with code {process.returncode}'})}\n\n"
    else:
        yield f"data: {json.dumps({'type': 'error', 'message': 'No JSON result found'})}\n\n"

    # Explicitly close streams
    process.stdout.close()
    process.stderr.close()


def run_agent_pipeline(resume_id: str, job_search_query: str, db: Session = None) -> dict:
    """Old blocking wrapper for compatibility if needed."""
    gen = stream_agent_pipeline(resume_id, job_search_query, db)
    final_res = {}
    for event in gen:
        if "data: " in event:
            data = json.loads(event.replace("data: ", "").strip())
            if data.get("type") == "result":
                final_res = data["data"]
            elif data.get("status") == "error" or data.get("type") == "error":
                final_res = {"status": "error", "message": data.get("message")}
    return final_res


def run_browser_apply(
    job_id: str,
    job_url: str,
    resume_path: str,
    cover_letter: str,
    full_name: str,
    email: str
) -> dict:
    """Execute the browser-based submission agent (The Closer)."""
    bun = _find_bun()
    script_file = ELIZA_DIR / "src" / "actions" / "browser_apply.ts"

    if not script_file.exists():
        return {"status": "error", "message": f"Script not found: {script_file}"}

    cmd = [
        bun, "run", str(script_file),
        f"--url={job_url}",
        f"--resumePath={resume_path}",
        f"--fullName={full_name}",
        f"--email={email}",
    ]
    if cover_letter:
        cmd.append(f"--coverLetter={cover_letter}")

    try:
        process = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=TIMEOUT_SECONDS,
            cwd=str(ELIZA_DIR),
        )

        if process.returncode == 0:
            return {"status": "success", "message": "Browser application submitted successfully."}
        else:
            return {
                "status": "error", 
                "message": process.stderr or f"Exited with code {process.returncode}"
            }
    except Exception as e:
        return {"status": "error", "message": str(e)}
