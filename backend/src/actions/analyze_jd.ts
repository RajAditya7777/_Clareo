// @ts-nocheck
import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { z } from "zod";

// ── Schema ─────────────────────────────────────────────────────────────────
const JobRequirementsSchema = z.object({
  required_skills: z.array(z.string()).default([]),
  optional_skills: z.array(z.string()).default([]),
  seniority: z.enum(["Intern", "Junior", "Mid-Level", "Senior", "Lead", "Principal", "Director"]).default("Mid-Level"),
  years_required: z.number().min(0).max(30).default(0),
  responsibilities: z.array(z.string()).default([]),
  location: z.string().default("Not specified"),
  salary_range: z.string().nullable().default(null),
  remote_ok: z.boolean().default(false)
});

type JobRequirements = z.infer<typeof JobRequirementsSchema>;

// ── LLM system prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a precision job description analyzer.
Your only job is to extract structured requirements from raw job descriptions.

Return ONLY valid JSON matching this exact schema. No markdown, no explanation, just JSON:
{
  "required_skills": ["React", "TypeScript"],
  "optional_skills": ["GraphQL", "Docker"],
  "seniority": "Senior",
  "years_required": 5,
  "responsibilities": ["Build frontend features", "Lead code reviews"],
  "location": "Remote",
  "salary_range": "$120,000 - $160,000",
  "remote_ok": true
}

Rules:
- seniority must be one of: Intern, Junior, Mid-Level, Senior, Lead, Principal, Director
- years_required must be a number (0 if not specified)
- salary_range is null if not mentioned
- remote_ok is true if job description mentions remote, WFH, work from anywhere
- Extract ALL technical skills from the description (programming languages, frameworks, tools, platforms)`;

// ── Direct LLM call (OpenAI-compat format) ─────────────────────────────────
async function callNosanaLLM(jdText: string): Promise<string> {
  const url = process.env.NOSANA_LLM_URL;
  if (!url || url.includes("...")) {
    throw new Error("NOSANA_LLM_URL is not configured in .env");
  }

  const endpoint = url.endsWith("/v1/chat/completions")
    ? url
    : `${url.replace(/\/$/, "")}/v1/chat/completions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nosana-job-llm",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this job description:\n\n${jdText.slice(0, 4000)}` }
      ],
      temperature: 0.1,
      max_tokens: 800
    })
  });

  if (!res.ok) throw new Error(`LLM API error ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Parse & validate LLM output ───────────────────────────────────────────
function parseJobRequirements(rawText: string): JobRequirements {
  // Strip markdown code fences if present
  const cleaned = rawText.replace(/```json\n?|```/g, "").trim();
  const parsed = JSON.parse(cleaned);
  return JobRequirementsSchema.parse(parsed);
}

// ── Extract JD text from message ──────────────────────────────────────────
function extractJDText(message: Memory): string {
  const text = message.content.text ?? "";
  // Remove trigger phrases
  return text
    .replace(/^(analyze|parse|extract from|process)\s+(this\s+)?(JD|job description|job posting):?\s*/i, "")
    .trim();
}

// ── Action definition ──────────────────────────────────────────────────────
export const analyzeJDAction = {
  name: "ANALYZE_JD",
  similes: ["PARSE_JOB", "JOB_INSIGHTS", "EXTRACT_JD", "JD_ANALYSIS"],
  description: "Takes raw job description text and uses an LLM to return a validated structured JSON of requirements, skills, and responsibilities.",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text ?? "";
    return !!text.match(/JD:|job description|hiring|responsibilities|requirements|we are looking/i);
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: unknown,
    callback?: HandlerCallback
  ) => {
    // Pull JD text from message or from state (if set by SCRAPE_JOBS)
    let jdText = extractJDText(message);

    // If message is short, try to get description from state (piped from SCRAPE_JOBS)
    if (jdText.length < 100 && state) {
      const recentContent = (state as Record<string, unknown>).currentJobDescription as string;
      if (recentContent) jdText = recentContent;
    }

    if (!jdText || jdText.length < 20) {
      callback({
        text: "Please provide a job description to analyze.",
        content: { error: "No job description text provided" }
      });
      return false;
    }

    try {
      const rawResponse = await callNosanaLLM(jdText);
      const requirements = parseJobRequirements(rawResponse);

      callback({
        text: `JD analyzed. Seniority: ${requirements.seniority}. Required skills: ${requirements.required_skills.slice(0, 5).join(", ")}.`,
        content: requirements
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Fallback: return partial data extracted by simple regex
      const skills = (jdText.match(/\b(TypeScript|JavaScript|Python|React|Node\.js|Go|Rust|SQL|AWS|Docker|Kubernetes)\b/g) ?? []);
      const fallback: JobRequirements = {
        required_skills: [...new Set(skills)],
        optional_skills: [],
        seniority: jdText.match(/senior/i) ? "Senior" : jdText.match(/junior|entry/i) ? "Junior" : "Mid-Level",
        years_required: parseInt(jdText.match(/(\d+)\+?\s+years/i)?.[1] ?? "0"),
        responsibilities: [],
        location: jdText.match(/remote/i) ? "Remote" : "Not specified",
        salary_range: null,
        remote_ok: /remote/i.test(jdText)
      };

      callback({
        text: `JD analyzed (fallback mode — LLM unavailable: ${msg}). Found ${fallback.required_skills.length} skills.`,
        content: fallback
      });
      return true;
    }
  },

  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Analyze this JD: We are looking for a Senior TypeScript Engineer with 5+ years of React experience. Remote OK. Salary: $140k-$180k." } },
      { user: "JobAnalyst", content: { text: "JD analyzed. Seniority: Senior. Required skills: TypeScript, React.", action: "ANALYZE_JD" } }
    ]
  ] as ActionExample[][]
} as unknown as Action;
