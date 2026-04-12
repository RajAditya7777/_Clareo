# Clariyo Project Instructions & Rules

These are the strict operational rules for the Clariyo project. All AI agents and development systems must adhere to these guidelines during the lifecycle of this repository.

## 1. Documentation-First Protocol (@file:tokensaver)

The core principle of this project is strict technical documentation and transparency.

**THE RULE:** 
Whenever a source code file (e.g., `.ts`, `.py`, `.js`, etc.) is CREATED or CHANGED, a corresponding Markdown (`.md`) file MUST be created or updated simultaneously in the `md/` directory.

**Requirements for the `.md` file:**
1.  **Snippet-by-Snippet Breakdown:** Do not just summarize the code. Break it down function-by-function. Explain exactly what each function does, why it exists, and its expected input/output.
2.  **Real-Life Dry Run:** Every capability of the code must include a "dry run" scenario. Walk through a real-life situation showing exactly how the data flows from start to finish.
3.  **Token Saver Efficiency:** The source code itself must be as clean, concise, and functional as possible. Save the verbose explanations, edge cases, and architectural philosophy strictly for the documentation (`.md`) files. This ensures the codebase remains lightweight and token-efficient for AI processing.

## 2. Skill Utilization

This project utilizes specific domains of expertise located in `.claude/skills/`. Before executing complex tasks in these domains, reference the appropriate skill file:

*   **Backend:** `fastapi-backend.md` (SQLAlchemy, async Python patterns)
*   **Agentic Orchestration:** `agentic-patterns.md` (ElizaOS characters, MCP, HIL flows)
*   **Retrieval/AI:** `ai-ml-rag.md` (LlamaIndex, matching algorithms, Nosana usage)
*   **Frontend/UI:** `ui-ux-pro.md` (Modern, premium interface design standards)

## 3. Human-In-The-Loop (HIL) Enforcement

Since this system submits job applications on behalf of a user, strict safety gates are required.
*   The `Apply Agent` must **never** auto-submit.
*   It must always stage the application and wait for explicit confirmation from the FastAPI endpoint `/confirm-apply`. Wait for human cryptographic or user-interface confirmation before finalizing any state-altering external action.
