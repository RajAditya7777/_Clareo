/**
 * Clariyo API Service
 * Centralized client for interacting with the FastAPI backend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export enum ApplicationStatus {
    SCRAPED = "SCRAPED",
    MATCHED = "MATCHED",
    DRAFTED = "DRAFTED",
    AWAITING_APPROVAL = "AWAITING_APPROVAL",
    APPLIED = "APPLIED",
    REPLIED = "REPLIED",
    INTERVIEW = "INTERVIEW",
    OFFER = "OFFER",
    REJECTED = "REJECTED",
    DISCARDED = "DISCARDED",
}

export interface JobApplication {
    id: number;
    job_id: string;
    company: string;
    title: string;
    location?: string;
    url: string;
    match_score?: number;
    matched_skills?: string[];
    missing_skills?: string[];
    recommendation?: string;
    platform?: string;
    company_logo?: string;
    tailored_resume_path?: string;
    status: ApplicationStatus;
    created_at: string;
}

class ClariyoAPI {
    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...options?.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Unknown error" }));
            throw new Error(error.detail || `Request failed with status ${response.status}`);
        }

        return response.json();
    }

    /**
     * Get all job applications.
     */
    async getApplications(status?: ApplicationStatus): Promise<JobApplication[]> {
        const query = status ? `?status=${status}` : "";
        return this.request<JobApplication[]>(`/api/applications${query}`);
    }

    /**
     * Get a single application by job_id.
     */
    async getApplication(jobId: string): Promise<JobApplication> {
        return this.request<JobApplication>(`/api/applications/${jobId}`);
    }

    /**
     * Start the 7-agent AI pipeline.
     */
    async startPipeline(searchQuery: string, resumeId: string = "default"): Promise<any> {
        return this.request("/api/start-pipeline", {
            method: "POST",
            body: JSON.stringify({
                resume_id: resumeId,
                search_query: searchQuery,
            }),
        });
    }

    /**
     * Stream the pipeline progress using Server-Sent Events.
     * Returns the EventSource so it can be closed by the UI (Stop generation).
     */
    streamPipeline(searchQuery: string, resumeId: string = "default", onMessage: (data: any) => void, onError: (err: any) => void): EventSource {
        const url = `${API_BASE_URL}/api/stream-pipeline?resume_id=${resumeId}&search_query=${encodeURIComponent(searchQuery)}`;
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
                if (data.type === "result" || data.type === "error") {
                    eventSource.close();
                }
            } catch (err) {
                console.error("Error parsing SSE data:", err);
            }
        };

        eventSource.onerror = (err) => {
            onError(err);
            eventSource.close();
        };

        return eventSource;
    }

    /**
     * Human-In-The-Loop: Confirm and submit an application.
     */
    async confirmApply(jobId: string, resumeId?: string): Promise<any> {
        const query = resumeId ? `?resume_id=${resumeId}` : "";
        return this.request(`/api/confirm-apply/${jobId}${query}`, {
            method: "POST",
        });
    }

    /**
     * Delete an application.
     */
    async deleteApplication(jobId: string): Promise<any> {
        return this.request(`/api/applications/${jobId}`, {
            method: "DELETE",
        });
    }

    /**
     * Upload a resume file.
     */
    async uploadResume(file: File): Promise<any> {
        const formData = new FormData();
        formData.append("file", file);

        const url = `${API_BASE_URL}/api/upload-resume`;
        const response = await fetch(url, {
            method: "POST",
            body: formData,
            // Header "Content-Type" must NOT be set for FormData so the browser can set the boundary
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Upload failed" }));
            throw new Error(error.detail || `Upload failed with status ${response.status}`);
        }

        return response.json();
    }

    /**
     * Health check.
     */
    async checkHealth(): Promise<any> {
        return this.request("/health");
    }

    // ── Chat API ──────────────────────────────────────────────────────────
    async listChats(): Promise<any[]> {
        return this.request("/api/chats");
    }

    async deleteChat(sessionId: number): Promise<any> {
        return this.request(`/api/chats/${sessionId}`, { method: "DELETE" });
    }
}

export const api = new ClariyoAPI();
