// @ts-nocheck
import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { z } from "zod";

// ── Types ──────────────────────────────────────────────────────────────────
const JobSchema = z.object({
  id: z.string(),
  company: z.string(),
  title: z.string(),
  location: z.string().default("Remote"),
  url: z.string().url(),
  description: z.string().default("")
});

type Job = z.infer<typeof JobSchema>;

interface FirecrawlSearchResponse {
  success?: boolean;
  data?: Array<{
    url?: string;
    sourceURL?: string;
    title?: string;
    markdown?: string;
    content?: string;
    description?: string;
    metadata?: {
      ogSiteName?: string;
      description?: string;
    };
  }>;
}

// ── Firecrawl API call ─────────────────────────────────────────────────────
async function searchJobsViaFirecrawl(query: string, limit = 10): Promise<Job[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) throw new Error("FIRECRAWL_API_KEY is not set in environment");

  const res = await fetch("https://api.firecrawl.dev/v1/search", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, limit })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Firecrawl API error ${res.status}: ${errorText}`);
  }

  const data = await res.json() as FirecrawlSearchResponse;
  const results = data.data ?? [];

  // Deduplicate by URL
  const seen = new Set<string>();
  const jobs: Job[] = [];

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const url = r.url ?? r.sourceURL ?? "";
    if (!url || seen.has(url)) continue;
    seen.add(url);

    // Extract company from title ("Role at Company") or metadata
    const titleParts = r.title?.split(" at ");
    const company = r.metadata?.ogSiteName
      ?? (titleParts && titleParts.length > 1 ? titleParts[titleParts.length - 1].trim() : "Unknown");

    const parsed = JobSchema.safeParse({
      id: `job_${Date.now()}_${i}`,
      company,
      title: r.title ?? query,
      location: "Remote",
      url,
      description: r.markdown ?? r.content ?? r.description ?? r.metadata?.description ?? ""
    });

    if (parsed.success) jobs.push(parsed.data);
  }

  return jobs;
}

// ── Extract search query from message ─────────────────────────────────────
function extractQuery(text: string): string {
  // Strip trigger phrases and extract the core query
  return text
    .replace(/^(find|search|look for|scan for|get me)\s+/i, "")
    .replace(/(jobs?|roles?|positions?|openings?)$/i, "")
    .replace(/(on linkedin|on indeed|on remotive|on glassdoor)/i, "")
    .trim() || text.trim();
}

// ── Action definition ──────────────────────────────────────────────────────
export const scrapeJobsAction = {
  name: "SCRAPE_JOBS",
  similes: ["FIND_JOBS", "SCAN_BOARDS", "SEARCH_JOBS", "JOB_SEARCH"],
  description: "Uses Firecrawl to search and extract job postings from the web. Returns a structured list of Job objects.",

  validate: async (_runtime: IAgentRuntime, message: Memory) => {
    if (!process.env.FIRECRAWL_API_KEY) return false;
    const keywords = ["find", "search", "looking", "jobs", "hiring", "roles", "positions"];
    return keywords.some(k => message.content.text?.toLowerCase().includes(k));
  },

  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    __state?: State,
    _options?: unknown,
    callback?: HandlerCallback
  ) => {
    const rawText = message.content.text ?? "";
    const query = extractQuery(rawText);

    try {
      const jobs = await searchJobsViaFirecrawl(query, 10);

      if (jobs.length === 0) {
        callback({
          text: `No jobs found for "${query}". Try a different search term.`,
          content: { jobs: [], count: 0 }
        });
        return true;
      }

      callback({
        text: `Search complete. Found ${jobs.length} job${jobs.length !== 1 ? "s" : ""} for "${query}".`,
        content: { jobs, count: jobs.length, query }
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      callback({
        text: `Job search failed: ${msg}`,
        content: { error: msg, jobs: [] }
      });
      return false;
    }
  },

  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Search for Senior TypeScript Engineer remote jobs on LinkedIn" } },
      { user: "JobScout", content: { text: "Search complete. Found 8 jobs for \"Senior TypeScript Engineer remote\".", action: "SCRAPE_JOBS" } }
    ],
    [
      { user: "{{user1}}", content: { text: "Find Rust backend roles" } },
      { user: "JobScout", content: { text: "Search complete. Found 5 jobs for \"Rust backend roles\".", action: "SCRAPE_JOBS" } }
    ]
  ] as ActionExample[][]
} as unknown as Action;
