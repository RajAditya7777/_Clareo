// @ts-nocheck
import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

// ── Stage application for human approval ─────────────────────────────────
async function stageApplication(payload: Record<string, unknown>): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`${BACKEND_URL}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, status: "AWAITING_APPROVAL" })
    });
    if (!res.ok) {
      const text = await res.text();
      return { success: false, message: `Backend error ${res.status}: ${text}` };
    }
    const data = await res.json() as { action?: string; job_id?: string };
    return { success: true, message: `Application staged (${data.action ?? "saved"}) — job_id: ${data.job_id ?? payload.job_id}` };
  } catch (err: unknown) {
    return { success: false, message: `Backend unreachable: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ── Action definition ─────────────────────────────────────────────────────
export const autoApplyAction = {
  name: "AUTO_APPLY",
  similes: ["FILL_APPLICATION", "SUBMIT_FORM", "STAGE_APPLICATION"],
  description: "Human-In-The-Loop gate: stages an application for user approval if match score >= 80. Submits to FastAPI backend.",

  validate: async (_runtime: IAgentRuntime, _message: Memory) => true,

  handler: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback
  ) => {
    const stateAny = state as Record<string, unknown>;
    const matchResult = stateAny.matchResult as Record<string, unknown> | undefined;
    const currentJob  = stateAny.currentJob  as Record<string, unknown> | undefined;
    const resumeProfile = stateAny.resumeProfile as Record<string, unknown> | undefined;
    const draft = stateAny.applicationDraft as Record<string, unknown> | undefined;

    const score = typeof matchResult?.score === "number" ? matchResult.score : 0;

    // ── Gate: skip low-score jobs ────────────────────────────────────────
    if (score < 80) {
      callback({
        text: `Auto-apply skipped for ${currentJob?.title ?? "job"} at ${currentJob?.company ?? "company"}. Score ${score}% is below the 80% threshold.`,
        content: {
          status: "SKIPPED",
          score,
          reason: "Score below 80% threshold",
          job_id: currentJob?.id
        }
      });
      return true;
    }

    // ── Build application payload ────────────────────────────────────────
    const payload: Record<string, unknown> = {
      job_id: currentJob?.id ?? `job_${Date.now()}`,
      company: currentJob?.company ?? "",
      title: currentJob?.title ?? "",
      location: currentJob?.location ?? "",
      url: currentJob?.url ?? "",
      match_score: score,
      matched_skills: (matchResult?.matched_skills as string[]) ?? [],
      missing_skills: (matchResult?.missing_skills as string[]) ?? [],
      recommendation: matchResult?.recommendation ?? "APPLY",
      cover_letter: (draft?.cover_letter as string) ?? "",
      form_data: (draft?.form_data as Record<string, unknown>) ?? {}
    };

    // ── Stage for human approval ─────────────────────────────────────────
    const result = await stageApplication(payload);

    if (result.success) {
      callback({
        text: `✅ Application staged for ${currentJob?.title} at ${currentJob?.company}.\nScore: ${score}%\n\nTo approve and submit: POST /confirm-apply/${payload.job_id}\n\nWaiting for human approval...`,
        content: {
          status: "AWAITING_APPROVAL",
          job_id: payload.job_id,
          score,
          company: currentJob?.company,
          title: currentJob?.title,
          confirm_url: `${BACKEND_URL}/confirm-apply/${payload.job_id}`,
          message: "Review in the Clariyo dashboard and confirm to submit."
        }
      });
    } else {
      // Backend down — still log locally
      process.stderr.write(`[AutoApply] Backend unavailable: ${result.message}\n`);
      callback({
        text: `Application for ${currentJob?.title} at ${currentJob?.company} ready for manual submission (backend unavailable).\nScore: ${score}%`,
        content: {
          status: "PENDING_MANUAL",
          score,
          job_id: payload.job_id,
          draft: draft,
          backend_error: result.message
        }
      });
    }

    return true;
  },

  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Apply to the Stripe role if it matches well" } },
      { user: "AutoApplier", content: { text: "✅ Application staged for Senior Engineer at Stripe. Score: 87%\nWaiting for human approval...", action: "AUTO_APPLY" } }
    ],
    [
      { user: "{{user1}}", content: { text: "Fill out the Rippling application form" } },
      { user: "AutoApplier", content: { text: "Auto-apply skipped. Score 43% is below the 80% threshold.", action: "AUTO_APPLY" } }
    ]
  ] as ActionExample[][]
} as unknown as Action;
