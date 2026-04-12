// @ts-nocheck
import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

// ── POST or update an application record in FastAPI ───────────────────────
async function trackToBackend(payload: Record<string, unknown>): Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.status === 409) {
      // Duplicate — update instead
      const putRes = await fetch(`${BACKEND_URL}/applications/${payload.job_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!putRes.ok) return { ok: false, error: `Update failed: ${putRes.status}` };
      return { ok: true, data: await putRes.json() as Record<string, unknown> };
    }

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Backend ${res.status}: ${text}` };
    }

    return { ok: true, data: await res.json() as Record<string, unknown> };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ── Action definition ─────────────────────────────────────────────────────
export const trackApplicationAction = {
  name: "TRACK_APPLICATION",
  similes: ["LOG_APPLICATION", "STATUS_UPDATE", "RECORD_APPLICATION"],
  description: "Logs a job application and its current status to the centralized PostgreSQL database via FastAPI.",

  validate: async (_runtime: IAgentRuntime, _message: Memory) => true,

  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback
  ) => {
    const s = state as Record<string, unknown>;
    const currentJob = (s.currentJob as Record<string, unknown>) ?? {};
    const matchResult = (s.matchResult as Record<string, unknown>) ?? {};
    const draft = (s.applicationDraft as Record<string, unknown>) ?? {};

    const payload: Record<string, unknown> = {
      job_id: currentJob.id ?? `job_${Date.now()}`,
      company: currentJob.company ?? "Unknown",
      title: currentJob.title ?? "Unknown",
      location: currentJob.location ?? "",
      url: currentJob.url ?? "",
      match_score: typeof matchResult.score === "number" ? matchResult.score : 0,
      matched_skills: (matchResult.matched_skills as string[]) ?? [],
      missing_skills: (matchResult.missing_skills as string[]) ?? [],
      recommendation: matchResult.recommendation ?? "SKIP",
      cover_letter: (draft.cover_letter as string) ?? "",
      form_data: (draft.form_data as Record<string, unknown>) ?? {},
      status: matchResult.score != null && (matchResult.score as number) >= 75 ? "DRAFTED" : "MATCHED"
    };

    const result = await trackToBackend(payload);

    if (result.ok) {
      callback({
        text: `✅ Tracked: ${payload.title} at ${payload.company} — Status: ${payload.status}`,
        content: {
          status: "TRACKED",
          job_id: payload.job_id,
          application_id: result.data?.id,
          action: result.data?.action ?? "created"
        }
      });
    } else {
      // Don't break the pipeline — log the error but continue
      process.stderr.write(`[Tracker] Backend error: ${result.error}\n`);
      callback({
        text: `⚠️ Tracked locally (backend unavailable): ${payload.title} at ${payload.company}`,
        content: {
          status: "TRACKED_LOCALLY",
          job_id: payload.job_id,
          backend_error: result.error,
          payload // Include data so it can be retried
        }
      });
    }

    return true;
  },

  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Log the Stripe application as DRAFTED" } },
      { user: "LogMaster", content: { text: "✅ Tracked: Senior Engineer at Stripe — Status: DRAFTED", action: "TRACK_APPLICATION" } }
    ]
  ] as ActionExample[][]
} as unknown as Action;
