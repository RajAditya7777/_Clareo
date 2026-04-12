// @ts-nocheck
import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { z } from "zod";

// ── Schema ─────────────────────────────────────────────────────────────────
const ResumeProfileSchema = z.object({
  name: z.string().default(""),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  skills: z.array(z.string()).default([]),
  seniority: z.enum(["Intern", "Junior", "Mid-Level", "Senior", "Lead", "Principal"]).default("Mid-Level"),
  years_exp: z.number().min(0).max(50).default(0),
  tech_stack: z.array(z.string()).default([]),
  summary: z.string().default(""),
  education: z.string().default(""),
  recent_titles: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([])
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

// ── LLM system prompt ──────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a precise resume parser.
Extract ALL structured information from the resume text.

Return ONLY valid JSON matching this schema:
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+1-555-000-0000",
  "linkedin": "https://linkedin.com/in/janedoe",
  "github": "https://github.com/janedoe",
  "skills": ["TypeScript", "React", "Node.js", "PostgreSQL"],
  "seniority": "Senior",
  "years_exp": 6,
  "tech_stack": ["Frontend", "Backend", "Fullstack"],
  "summary": "Senior engineer specializing in...",
  "education": "BSc Computer Science, MIT, 2018",
  "recent_titles": ["Senior Frontend Engineer", "Full Stack Developer"],
  "languages": ["English", "Spanish"]
}

Rules:
- seniority: Intern, Junior, Mid-Level, Senior, Lead, or Principal
- years_exp: estimate from dates in experience section (0 if unclear)
- skills: ALL technical tools, frameworks, languages, platforms mentioned
- tech_stack: high-level categories (Frontend / Backend / Fullstack / Data / DevOps / Mobile)
- recent_titles: job titles from the last 3 positions
- No markdown, no explanation — ONLY valid JSON`;

// ── LLM call ───────────────────────────────────────────────────────────────
async function parseResumeWithLLM(resumeText: string): Promise<ResumeProfile> {
  const url = process.env.NOSANA_LLM_URL;
  if (!url || url.includes("...")) {
    throw new Error("NOSANA_LLM_URL is not configured — cannot parse resume via LLM");
  }

  const endpoint = url.endsWith("/v1/chat/completions")
    ? url
    : `${url.replace(/\/$/, "")}/v1/chat/completions`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.NOSANA_MODEL_NAME || "DeepSeek-R1-Distill-Qwen-7B",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Parse this resume:\n\n${resumeText.slice(0, 5000)}` }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })
  });

  if (!res.ok) throw new Error(`LLM API error ${res.status}`);
  const data = await res.json() as { choices?: { message?: { content?: string } }[] };
  const rawText = data.choices?.[0]?.message?.content ?? "{}";
  const cleaned = rawText.replace(/```json\n?|```/g, "").trim();
  return ResumeProfileSchema.parse(JSON.parse(cleaned));
}

// ── Simple regex fallback parser ──────────────────────────────────────────
function parseResumeWithRegex(text: string): ResumeProfile {
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = text.match(/[\+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/);
  const githubMatch = text.match(/github\.com\/[\w-]+/);

  const skillKeywords = [
    "TypeScript", "JavaScript", "Python", "Go", "Rust", "Java", "C++", "C#",
    "React", "Next.js", "Vue", "Angular", "Node.js", "Express", "FastAPI", "Django",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
    "GraphQL", "REST", "gRPC", "WebSockets",
    "Git", "CI/CD", "GitHub Actions", "Jenkins"
  ];
  const foundSkills = skillKeywords.filter(s =>
    new RegExp(`\\b${s.replace(".", "\\.")}\\b`, "i").test(text)
  );

  const yearsMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4}|present|current)/gi);
  const yearsExp = yearsMatch ? Math.min(30, yearsMatch.length * 2) : 0;

  return ResumeProfileSchema.parse({
    name: "",
    email: emailMatch?.[0] ?? "",
    phone: phoneMatch?.[0] ?? "",
    linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : "",
    github: githubMatch ? `https://${githubMatch[0]}` : "",
    skills: foundSkills,
    seniority: text.match(/\b(lead|principal|staff)\b/i) ? "Lead"
      : text.match(/\bsenior\b/i) ? "Senior"
      : text.match(/\bjunior\b/i) ? "Junior"
      : "Mid-Level",
    years_exp: yearsExp,
    tech_stack: foundSkills.length > 0 ? ["Fullstack"] : [],
    summary: "",
    education: "",
    recent_titles: [],
    languages: []
  });
}

// ── Decode base64 if needed ───────────────────────────────────────────────
function decodeContent(input: string): string {
  // If it looks like base64, decode it
  if (/^[A-Za-z0-9+/]+=*$/.test(input.replace(/\s/g, "")) && input.length > 100) {
    try {
      return Buffer.from(input, "base64").toString("utf8");
    } catch {
      return input;
    }
  }
  return input;
}

// ── Action definition ──────────────────────────────────────────────────────
export const parseResumeAction = {
  name: "PARSE_RESUME",
  similes: ["EXTRACT_SKILLS", "ANALYZE_RESUME", "READ_RESUME", "LOAD_CV"],
  description: "Parses a resume from text, file upload, or base64-encoded content. Returns a structured ResumeProfile via LLM.",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    const text = message.content.text ?? "";
    return !!text.match(/gdrive:\/\/|file_id:|resume|cv|curriculum|parse|skills|experience/i);
  },

  handler: async (...args: any[]): Promise<boolean> => {
    const message = args[1];
    const callback = args[4];
    const text = message.content.text ?? "";

    // Extract resume text from message
    // Priority: attachment → base64 in text → plain text
    let resumeText = "";

    // Check for base64 attachment
    if ((message.content as Record<string, unknown>).attachment) {
      resumeText = decodeContent(String((message.content as Record<string, unknown>).attachment));
    } else if (text.match(/^[A-Za-z0-9+/]+=*$/) && text.length > 200) {
      // Looks like base64
      resumeText = decodeContent(text);
    } else {
      // Plain text resume
      resumeText = text
        .replace(/^(parse|analyze|extract from)\s+(my\s+)?(resume|cv):?\s*/i, "")
        .trim();
    }

    if (!resumeText || resumeText.length < 30) {
      callback({
        text: "Please provide your resume text, a base64-encoded PDF, or a Google Drive link.",
        content: { error: "No resume content provided" }
      });
      return false;
    }

    try {
      const profile = await parseResumeWithLLM(resumeText);
      callback({
        text: `Resume parsed. Found ${profile.skills.length} skills. Seniority: ${profile.seniority}. Experience: ${profile.years_exp} years.`,
        content: profile
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);

      // Fallback to regex parsing
      const profile = parseResumeWithRegex(resumeText);
      callback({
        text: `Resume parsed (fallback mode — ${msg}). Found ${profile.skills.length} skills.`,
        content: profile
      });
      return true;
    }
  },

  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Parse my resume: Jane Doe, Senior TypeScript Engineer, 6 years exp, React, Node.js, PostgreSQL" } },
      { user: "ResumeParser", content: { text: "Resume parsed. Found 3 skills. Seniority: Senior. Experience: 6 years.", action: "PARSE_RESUME" } }
    ]
  ] as unknown as ActionExample[][]
} as unknown as Action;
