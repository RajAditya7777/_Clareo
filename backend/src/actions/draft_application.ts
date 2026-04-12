// @ts-nocheck
import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { z } from "zod";

// ── Schema ─────────────────────────────────────────────────────────────────
const ApplicationDraftSchema = z.object({
  cover_letter: z.string().min(10),
  form_data: z.object({
    full_name: z.string().default(""),
    email: z.string().default(""),
    phone: z.string().default(""),
    linkedin: z.string().default(""),
    github: z.string().default(""),
    desired_salary: z.string().default("market rate"),
    how_did_you_hear: z.string().default("Job board"),
    cover_letter_short: z.string().default("")
  }).default({})
});

export type ApplicationDraft = z.infer<typeof ApplicationDraftSchema>;

// ── LLM call ──────────────────────────────────────────────────────────────
async function generateDraftViaLLM(
  resumeProfile: Record<string, unknown>,
  jobInfo: Record<string, unknown>,
  matchResult: Record<string, unknown>
): Promise<ApplicationDraft> {
  const url = process.env.NOSANA_LLM_URL;
  if (!url || url.includes("...")) throw new Error("NOSANA_LLM_URL not configured");

  const endpoint = url.endsWith("/v1/chat/completions")
    ? url
    : `${url.replace(/\/$/, "")}/v1/chat/completions`;

  const systemPrompt = `You are an expert career coach and cover letter writer.
Write a compelling, personalized cover letter that:
- Opens with a strong hook referencing the specific company/role
- Highlights 2-3 directly matching skills from their tech stack
- Addresses any gaps constructively
- Closes with a specific, confident call to action
- Is 250-320 words, professional and natural (never generic)

Return ONLY valid JSON:
{
  "cover_letter": "Dear Hiring Manager at [Company]...",
  "form_data": {
    "full_name": "[from profile]",
    "email": "[from profile]",
    "phone": "[from profile]",
    "linkedin": "[from profile]",
    "github": "[from profile]",
    "desired_salary": "market rate",
    "how_did_you_hear": "Job board",
    "cover_letter_short": "[first 150 chars of cover letter]"
  }
}`;

  const userPrompt = `Write a cover letter for this application:

Candidate: ${JSON.stringify(resumeProfile, null, 2)}
Job: ${JSON.stringify(jobInfo, null, 2)}
Why they're a match: ${JSON.stringify(matchResult, null, 2)}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nosana-job-llm",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1200
    })
  });

  if (!res.ok) throw new Error(`LLM error ${res.status}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const raw = data.choices?.[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/```json\n?|```/g, "").trim();
  return ApplicationDraftSchema.parse(JSON.parse(cleaned));
}

// ── Fallback template ─────────────────────────────────────────────────────
function generateFallbackDraft(
  resumeProfile: Record<string, unknown>,
  jobInfo: Record<string, unknown>
): ApplicationDraft {
  const name = String(resumeProfile.name ?? "");
  const company = String(jobInfo.company ?? "the company");
  const role = String(jobInfo.title ?? "this position");
  const matchedSkills = (resumeProfile.skills as string[] ?? []).slice(0, 3).join(", ");

  const letter = `Dear Hiring Manager at ${company},

I am excited to apply for the ${role} role. With ${resumeProfile.years_exp ?? "several"} years of experience and strong expertise in ${matchedSkills}, I am confident in my ability to make an immediate impact on your team.

Throughout my career as a ${(resumeProfile.recent_titles as string[])?.[0] ?? resumeProfile.seniority + " Engineer"}, I have consistently delivered high-quality solutions. My background aligns closely with the technical and collaborative requirements of this role.

I would welcome the opportunity to discuss how my experience can contribute to ${company}'s goals. Thank you for your consideration.

Best regards,
${name}`;

  return ApplicationDraftSchema.parse({
    cover_letter: letter,
    form_data: {
      full_name: name,
      email: String(resumeProfile.email ?? ""),
      phone: String(resumeProfile.phone ?? ""),
      linkedin: String(resumeProfile.linkedin ?? ""),
      github: String(resumeProfile.github ?? ""),
      desired_salary: "market rate",
      how_did_you_hear: "Job board",
      cover_letter_short: letter.slice(0, 150)
    }
  });
}

// ── Action ────────────────────────────────────────────────────────────────
export const draftApplicationAction = {
  name: "DRAFT_APPLICATION",
  similes: ["WRITE_COVER_LETTER", "PREFILL_FORM", "GENERATE_APPLICATION"],
  description: "Generates a personalized cover letter and form data using LLM, tailored to the candidate and specific job.",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text ?? "";
    return !!text.match(/draft|write|generate|cover letter|apply|application/i);
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback
  ) => {
    const stateAny = state as Record<string, unknown>;
    const resumeProfile = (stateAny.resumeProfile as Record<string, unknown>) ?? {};
    const currentJob = (stateAny.currentJob as Record<string, unknown>) ?? {};
    const matchResult = (stateAny.matchResult as Record<string, unknown>) ?? {};

    // Require at minimum something to work with
    const hasContext = Object.keys(resumeProfile).length > 0 || Object.keys(currentJob).length > 0;
    if (!hasContext) {
      callback({ text: "Please parse your resume and select a job first.", content: { error: "Missing resume or job context" } });
      return false;
    }

    try {
      const draft = await generateDraftViaLLM(resumeProfile, currentJob, matchResult);
      callback({
        text: `Draft ready for ${currentJob.title ?? "the role"} at ${currentJob.company ?? "the company"}.\n\nPreview: ${draft.cover_letter.slice(0, 120)}...`,
        content: draft
      });
      return true;
    } catch (err: unknown) {
      const draft = generateFallbackDraft(resumeProfile, currentJob);
      callback({
        text: `Draft created (template mode — ${err instanceof Error ? err.message : String(err)}).\n\nPreview: ${draft.cover_letter.slice(0, 120)}...`,
        content: draft
      });
      return true;
    }
  },

  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Draft an application for the Stripe Senior Engineer role" } },
      { user: "GhostWriter", content: { text: "Draft ready for Senior Engineer at Stripe.\n\nPreview: Dear Hiring Manager at Stripe...", action: "DRAFT_APPLICATION" } }
    ]
  ] as ActionExample[][]
} as unknown as Action;
