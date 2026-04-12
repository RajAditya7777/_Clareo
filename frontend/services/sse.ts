/**
 * Clariyo SSE Service
 * Handles Server-Sent Events for real-time pipeline updates.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class ClariyoSSE {
    /**
     * Stream the pipeline progress using Server-Sent Events.
     */
    streamPipeline(
        searchQuery: string,
        resumeId: string = "default",
        onMessage: (data: any) => void,
        onError: (err: any) => void
    ): EventSource {
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
}

export const sse = new ClariyoSSE();
