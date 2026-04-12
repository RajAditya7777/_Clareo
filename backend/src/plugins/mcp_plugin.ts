// @ts-nocheck
import type { Plugin, Action, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

// ── Types ─────────────────────────────────────────────────────────────────────
interface FirecrawlResult {
  url?: string;
  sourceURL?: string;
  title?: string;
  markdown?: string;
  content?: string;
  description?: string;
  metadata?: { ogSiteName?: string };
}

// ── firecrawl_search ─────────────────────────────────────────────────────────
const firecrawlSearchAction: Action = {
  name: "firecrawl_search",
  description: "Search job boards and web using Firecrawl API",
  similes: ["SEARCH_WEB", "CRAWL_JOBS", "FIND_JOBS_WEB"],
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    return !!process.env.FIRECRAWL_API_KEY;
  },
  handler: async (...args: any[]): Promise<boolean> => {
    const _runtime = args[0];
    const message = args[1];
    const callback = args[4];
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (!apiKey) {
      callback({ text: "Error: FIRECRAWL_API_KEY not set in environment", content: { error: true } });
      return false;
    }

    const query = message.content.text ?? "";
    try {
      const res = await fetch("https://api.firecrawl.dev/v1/search", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query, limit: 10 })
      });

      if (!res.ok) {
        const errorText = await res.text();
        callback({ text: `Firecrawl error ${res.status}: ${errorText}`, content: { error: true } });
        return false;
      }

      const data = await res.json() as { data?: FirecrawlResult[] };
      const results = data.data ?? [];

      // Deduplicate by URL
      const seen = new Set<string>();
      const jobs = results.filter(r => {
        const url = r.url ?? r.sourceURL ?? "";
        if (seen.has(url) || !url) return false;
        seen.add(url);
        return true;
      }).map((r, i) => ({
        id: `job_${Date.now()}_${i}`,
        company: r.metadata?.ogSiteName ?? r.title?.split(" at ")?.[1]?.trim() ?? "Unknown",
        title: r.title ?? query,
        url: r.url ?? r.sourceURL ?? "",
        description: r.markdown ?? r.content ?? r.description ?? ""
      }));

      callback({
        text: `Found ${jobs.length} results for: "${query}"`,
        content: jobs
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      callback({ text: `Firecrawl request failed: ${msg}`, content: { error: true } });
      return false;
    }
  },
  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Find Senior TypeScript remote jobs" } },
      { user: "JobScout", content: { text: "Found 8 results for: \"Senior TypeScript remote jobs\"", action: "firecrawl_search" } }
    ]
  ]
};

// ── gdrive_get_file ──────────────────────────────────────────────────────────
const gdriveGetFileAction: Action = {
  name: "gdrive_get_file",
  description: "Fetch a file from Google Drive using the Drive API",
  similes: ["FETCH_RESUME", "GET_PDF"],
  validate: async () => true,
  handler: async (...args: any[]): Promise<boolean> => {
    const _runtime = args[0];
    const message = args[1];
    const callback = args[4];
    // Extract file_id from message text: gdrive://FILE_ID or file_id:FILE_ID
    const match = message.content.text?.match(/gdrive:\/\/([^\s]+)|file_id:([^\s]+)/);
    const fileId = match?.[1] ?? match?.[2];

    if (!fileId) {
      callback({ text: "No Google Drive file ID found in message", content: { error: true } });
      return false;
    }

    // For now: return the file_id so downstream parse_resume can handle it
    // Full OAuth flow can be added when GOOGLE_CLIENT_ID/SECRET are configured
    callback({
      text: `Google Drive file ID extracted: ${fileId}`,
      content: { file_id: fileId, source: "gdrive" }
    });
    return true;
  },
  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Parse resume from gdrive://1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs" } },
      { user: "ResumeParser", content: { text: "Google Drive file ID extracted", action: "gdrive_get_file" } }
    ]
  ]
};

// ── gmail_send_notification ──────────────────────────────────────────────────
const gmailNotifyAction: Action = {
  name: "gmail_send_notification",
  description: "Send a notification email to the user about pipeline updates",
  similes: ["SEND_EMAIL", "NOTIFY_USER"],
  validate: async () => true,
  handler: async (
    _runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _opts?: unknown,
    callback?: HandlerCallback
  ) => {
    // Placeholder — full Gmail OAuth can be added with GOOGLE_CLIENT_ID
    process.stderr.write(`[Gmail] Notification queued: ${message.content.text}\n`);
    callback({
      text: "Notification logged (Gmail OAuth not yet configured)",
      content: { queued: true, message: message.content.text }
    });
    return true;
  },
  // @ts-ignore
    examples: [
    [
      { user: "{{user1}}", content: { text: "Notify me about the Stripe application status" } },
      { user: "Notifier", content: { text: "Notification logged", action: "gmail_send_notification" } }
    ]
  ]
};

// ── Plugin export ────────────────────────────────────────────────────────────
export const mcpPlugin = {
  name: "clariyo-mcp-plugin",
  description: "Connects Clariyo to Firecrawl (job search), Google Drive (resume fetch), and Gmail (notifications).",
  actions: [firecrawlSearchAction, gdriveGetFileAction, gmailNotifyAction],
  providers: [],
  evaluators: []
} as unknown as Plugin;
