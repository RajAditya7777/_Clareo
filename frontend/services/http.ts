/**
 * Clariyo HTTP Service
 * REST client for interacting with the FastAPI backend.
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

class ClariyoHTTP {
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

    async getApplications(status?: ApplicationStatus): Promise<JobApplication[]> {
        const query = status ? `?status=${status}` : "";
        return this.request<JobApplication[]>(`/applications${query}`);
    }

    async getApplication(jobId: string): Promise<JobApplication> {
        return this.request<JobApplication>(`/applications/${jobId}`);
    }

    async confirmApply(jobId: string, resumeId?: string): Promise<any> {
        const query = resumeId ? `?resume_id=${resumeId}` : "";
        return this.request(`/confirm-apply/${jobId}${query}`, {
            method: "POST",
        });
    }

    async deleteApplication(jobId: string): Promise<any> {
        return this.request(`/applications/${jobId}`, {
            method: "DELETE",
        });
    }

    async uploadResume(file: File): Promise<any> {
        const formData = new FormData();
        formData.append("file", file);

        const url = `${API_BASE_URL}/upload-resume`;
        const response = await fetch(url, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: "Upload failed" }));
            throw new Error(error.detail || `Upload failed with status ${response.status}`);
        }

        return response.json();
    }

    async checkHealth(): Promise<any> {
        return this.request("/health");
    }
}

export const http = new ClariyoHTTP();
