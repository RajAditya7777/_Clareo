import "dotenv/config";
import { AgentRuntime, stringToUuid, ModelType } from "@elizaos/core";

// ── Characters ───────────────────────────────────────────────────────────────
// Actions are now located in the same parent directory as index.ts
import { scrapeJobsAction }      from "./actions/scrape_jobs";
import { analyzeJDAction }       from "./actions/analyze_jd";
import { parseResumeAction }     from "./actions/parse_resume";
import { matchResumeJobAction }  from "./actions/match_resume_job";
import { draftApplicationAction } from "./actions/draft_application";
import { autoApplyAction }       from "./actions/auto_apply";
import { trackApplicationAction } from "./actions/track_application";

// ── CLI Arg Parsing ──────────────────────────────────────────────────────────
function parseArgs() {
  const args: Record<string, string> = {};
  for (const arg of process.argv.slice(2)) {
    const [key, ...rest] = arg.replace(/^--/, "").split("=");
    if (key !== undefined) {
      args[key] = rest.join("=");
    }
  }
  return args;
}

// ── Emit result to stdout (consumed by Python backend) ──────────────────────
function emit(data: object) {
  process.stdout.write(JSON.stringify(data) + "\n");
}

// ── LLM helper (OpenAI-compat via Nosana) ────────────────────────────────────
async function callLLM(system: string, user: string): Promise<string> {
  const url = process.env.NOSANA_LLM_URL;
  if (!url || url.includes("...")) {
    // Fallback mock so pipeline doesn't crash without Nosana endpoint
    return JSON.stringify({ _mock: true, note: "NOSANA_LLM_URL not configured" });
  }
  const res = await fetch(`${url}/v1/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "nosana-job-llm",
      messages: [
        { role: "system", content: system },
        { role: "user",   content: user   }
      ],
      temperature: 0.2
    })
  });
  if (!res.ok) throw new Error(`LLM call failed: ${res.status}`);
  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data?.choices?.[0]?.message?.content ?? "";
}

// ── Step runner ──────────────────────────────────────────────────────────────
async function runStep(stepName: string, fn: () => Promise<unknown>) {
  const stepStart = Date.now();
  try {
    const result = await fn();
    const elapsed = ((Date.now() - stepStart) / 1000).toFixed(1);
    process.stderr.write(`[Clariyo] ✓ ${stepName} (${elapsed}s)\n`);
    return { ok: true, data: result };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[Clariyo] ✗ ${stepName}: ${msg}\n`);
    return { ok: false, error: msg };
  }
}

// ── Main pipeline ────────────────────────────────────────────────────────────
async function main() {
  const { resume: resumeId, search: searchQuery } = parseArgs();

  if (!resumeId || !searchQuery) {
    emit({ status: "error", message: "Usage: bun run index.ts --resume=<id> --search=<query>" });
    process.exit(1);
  }

  // Validate required env
  if (!process.env.FIRECRAWL_API_KEY) {
    emit({ status: "error", message: "FIRECRAWL_API_KEY is not set in .env" });
    process.exit(1);
  }

  process.stderr.write(`[Clariyo] Starting 7-agent pipeline — resume=${resumeId} search="${searchQuery}"\n`);

  const pipelineResults: Record<string, unknown> = {};

  // ── Step 1: SCRAPE_JOBS ─────────────────────────────────────────────────
  const step1 = await runStep("SCRAPE_JOBS", async () => {
    const apiKey = process.env.FIRECRAWL_API_KEY!;
    const res = await fetch("https://api.firecrawl.dev/v1/search", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: searchQuery, limit: 10 })
    });
    if (!res.ok) throw new Error(`Firecrawl ${res.status}: ${await res.text()}`);
    const raw = await res.json() as { data?: any[] };
    const results = (raw.data ?? []);
    const seen = new Set<string>();
    return results.filter(r => {
      const url = r.url ?? r.sourceURL ?? "";
      if (seen.has(url) || !url) return false;
      seen.add(url);
      return true;
    }).map((r, i) => ({
      id: `job_${Date.now()}_${i}`,
      company: (r.metadata as Record<string, any>)?.ogSiteName ?? (r.title ? r.title.split(" at ")?.[1] : undefined) ?? "Unknown",
      title: r.title ?? searchQuery,
      location: "Remote",
      url: r.url ?? r.sourceURL ?? "",
      description: r.markdown ?? r.content ?? r.description ?? ""
    }));
  });
  if (!step1.ok) { emit({ status: "error", step: "SCRAPE_JOBS", message: step1.error }); process.exit(1); }
  const jobs = step1.data as { id: string; company: string; title: string; location: string; url: string; description: string }[];
  pipelineResults.jobs_found = jobs.length;

  // ── Step 3: PARSE_RESUME ────────────────────────────────────────────────
  const step3 = await runStep("PARSE_RESUME", async () => {
    const system = `You are a resume parser. Extract structured information.
Return ONLY valid JSON:
{"name":"","email":"","skills":[],"seniority":"","years_exp":0,"tech_stack":[],"summary":"","education":"","recent_titles":[]}`;
    const user = `Resume ID: ${resumeId}\n\nParse the resume for this candidate and return their profile.`;
    const text = await callLLM(system, user);
    try { return JSON.parse(text.replace(/```json\n?|```/g, "").trim()); }
    catch { return { skills: [], seniority: "Mid-Level", years_exp: 2, summary: `Resume: ${resumeId}` }; }
  });
  const resumeProfile = step3.data ?? {};
  pipelineResults.resume_parsed = !!(resumeProfile as Record<string, unknown>).skills;

  const processedJobs = [];

  // ── Steps 2 + 4 + 5 + 6 + 7 per job ────────────────────────────────────
  for (const job of jobs.slice(0, 5)) { // max 5 jobs
    process.stderr.write(`[Clariyo]   Processing: ${job.title} @ ${job.company}\n`);

    // Step 2: ANALYZE_JD
    const jdStep = await runStep(`ANALYZE_JD:${job.company}`, async () => {
      const system = `You are a job description analyzer. Return ONLY valid JSON:
{"required_skills":[],"optional_skills":[],"seniority":"","years_required":0,"responsibilities":[],"location":"","salary_range":null}`;
      const text = await callLLM(system, `Analyze this job description:\n\n${job.description.slice(0, 3000)}`);
      try { return JSON.parse(text.replace(/```json\n?|```/g, "").trim()); }
      catch { return { required_skills: [], optional_skills: [], seniority: "Mid-Level", years_required: 0 }; }
    });
    const jdReqs = jdStep.data ?? {};

    // Step 4: MATCH_RESUME_JOB
    const matchStep = await runStep(`MATCH:${job.company}`, async () => {
      const system = `You are a hiring match analyst. Return ONLY valid JSON:
{"score":0,"matched_skills":[],"missing_skills":[],"recommendation":"SKIP","explanation":""}
Score 0-100. recommendation: APPLY if >75, BORDERLINE if 50-75, SKIP if <50.`;
      const user = `Resume: ${JSON.stringify(resumeProfile)}\nJob Requirements: ${JSON.stringify(jdReqs)}`;
      const text = await callLLM(system, user);
      try { return JSON.parse(text.replace(/```json\n?|```/g, "").trim()); }
      catch { return { score: 0, matched_skills: [], missing_skills: [], recommendation: "SKIP", explanation: "Parse error" }; }
    });
    const match = matchStep.data as { score: number; matched_skills: string[]; missing_skills: string[]; recommendation: string; explanation: string } ?? { score: 0, recommendation: "SKIP", matched_skills: [], missing_skills: [], explanation: "" };

    let draft: { cover_letter?: string, form_data?: unknown } | null = null;

    // Step 5: DRAFT_APPLICATION (only if score > 75)
    if (match.score >= 75) {
      const draftStep = await runStep(`DRAFT:${job.company}`, async () => {
        const system = `You are an expert cover letter writer. Return ONLY valid JSON:
{"cover_letter":"","form_data":{"full_name":"","email":"","desired_salary":"market rate","how_did_you_hear":"Job board"}}`;
        const user = `Write a compelling cover letter for this candidate applying to this role.
Candidate: ${JSON.stringify(resumeProfile)}
Job: ${JSON.stringify({ company: job.company, title: job.title, description: job.description.slice(0, 1000) })}
Match analysis: ${JSON.stringify(match)}`;
        const text = await callLLM(system, user);
        try { return JSON.parse(text.replace(/```json\n?|```/g, "").trim()); }
        catch { return { cover_letter: `Application for ${job.title} at ${job.company}`, form_data: {} }; }
      });
      draft = draftStep.data as { cover_letter?: string, form_data?: unknown };

      // Step 6: AUTO_APPLY — stage for human approval
      await runStep(`STAGE:${job.company}`, async () => {
        const backendUrl = "http://localhost:8000";
        try {
          await fetch(`${backendUrl}/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              job_id: job.id,
              company: job.company,
              title: job.title,
              location: job.location,
              url: job.url,
              match_score: match.score,
              matched_skills: match.matched_skills,
              missing_skills: match.missing_skills,
              recommendation: match.recommendation,
              cover_letter: draft?.cover_letter ?? "",
              form_data: draft?.form_data ?? {},
              status: "DRAFTED"
            })
          });
        } catch { /* Backend might not be up during ElizaOS test runs */ }
      });
    }

    // Step 7: TRACK_APPLICATION
    await runStep(`TRACK:${job.company}`, async () => {
      const backendUrl = "http://localhost:8000";
      try {
        await fetch(`${backendUrl}/applications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id: job.id,
            company: job.company,
            title: job.title,
            location: job.location,
            url: job.url,
            match_score: match.score,
            matched_skills: match.matched_skills,
            missing_skills: match.missing_skills,
            recommendation: match.recommendation,
            status: match.score >= 75 ? "DRAFTED" : "MATCHED"
          })
        });
      } catch { /* Backend might not be up */ }
    });

    processedJobs.push({
      company: job.company,
      title: job.title,
      url: job.url,
      score: match.score,
      recommendation: match.recommendation,
      matched_skills: match.matched_skills,
      missing_skills: match.missing_skills,
      draft_ready: match.score >= 75
    });
  }

  // ── Final JSON output (consumed by Python backend) ───────────────────────
  emit({
    status: "success",
    resume_id: resumeId,
    search_query: searchQuery,
    jobs_found: jobs.length,
    jobs_processed: processedJobs.length,
    pipeline_result: processedJobs
  });
}

main().catch(err => {
  emit({ status: "error", message: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});