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

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: "AGENT" | "SYSTEM" | "UPDATE";
    is_read: boolean;
    link?: string;
    created_at: string;
}

export interface Profile {
    id: number;
    resume_id: string;
    full_name: string;
    email: string;
    seniority: string;
    years_exp: number;
    summary: string;
    skills: string[];
    tech_stack: string[];
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
        return this.request<JobApplication[]>(`/api/applications${query}`);
    }

    async getInsights(resumeId?: string): Promise<any> {
        const query = resumeId ? `?resume_id=${resumeId}` : "";
        return this.request(`/api/insights${query}`);
    }

    async generateInsights(resumeId?: string): Promise<any> {
        const query = resumeId ? `?resume_id=${resumeId}` : "";
        return this.request(`/api/insights/generate${query}`, { method: "POST" });
    }

    async getApplication(jobId: string): Promise<JobApplication> {
        return this.request<JobApplication>(`/api/applications/${jobId}`);
    }

    async confirmApply(jobId: string, resumeId?: string): Promise<any> {
        const query = resumeId ? `?resume_id=${resumeId}` : "";
        return this.request(`/api/confirm-apply/${jobId}${query}`, {
            method: "POST",
        });
    }

    async deleteApplication(jobId: string): Promise<any> {
        return this.request(`/api/applications/${jobId}`, {
            method: "DELETE",
        });
    }

    async uploadResume(file: File): Promise<any> {
        const formData = new FormData();
        formData.append("file", file);

        const url = `${API_BASE_URL}/api/upload-resume`;
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

    // ── Chat API ──────────────────────────────────────────────────────────
    async listChats(): Promise<any[]> {
        return this.request("/api/chats");
    }

    async createChat(title: string, resumeId?: string): Promise<any> {
        return this.request("/api/chats", {
            method: "POST",
            body: JSON.stringify({ title, resume_id: resumeId }),
        });
    }

    async getMessages(sessionId: number): Promise<any[]> {
        return this.request(`/api/chats/${sessionId}/messages`);
    }

    async addMessage(
        sessionId: number, 
        role: string, 
        content: string,
        attachmentName?: string,
        attachmentPath?: string
    ): Promise<any> {
        return this.request(`/api/chats/${sessionId}/messages`, {
            method: "POST",
            body: JSON.stringify({ 
                role, 
                content,
                attachment_name: attachmentName,
                attachment_path: attachmentPath
            }),
        });
    }

    async deleteChat(sessionId: number): Promise<any> {
        return this.request(`/api/chats/${sessionId}`, { method: "DELETE" });
    }

    // ── Notifications API ──────────────────────────────────────────────────
    async getNotifications(limit: number = 20): Promise<Notification[]> {
        return this.request<Notification[]>(`/api/notifications?limit=${limit}`);
    }

    async markAllNotificationsRead(): Promise<any> {
        return this.request("/api/notifications/read-all", { method: "POST" });
    }

    // ── Profiles API ──────────────────────────────────────────────────────
    async listProfiles(): Promise<Profile[]> {
        return this.request<Profile[]>("/api/profiles");
    }

    async deleteProfile(resumeId: string): Promise<any> {
        return this.request(`/api/profiles/${resumeId}`, { method: "DELETE" });
    }
}

export const http = new ClariyoHTTP();
