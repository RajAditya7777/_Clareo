import { useState, useRef, useCallback } from "react";
import { sse } from "@/services/sse";
import { Message } from "@/components/chat/types";

import { http } from "@/services/http";

interface UsePipelineProps {
    resumeId: string | null;
    sessionId: number | null;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function usePipeline({ resumeId, sessionId, setMessages }: UsePipelineProps) {
    const [isPipelineRunning, setIsPipelineRunning] = useState(false);
    const streamRef = useRef<EventSource | null>(null);

    const stopPipeline = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.close();
            streamRef.current = null;
            setIsPipelineRunning(false);
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    text: "Agent orchestration stopped. 🛑",
                    ts: Date.now(),
                },
            ]);
        }
    }, [setMessages]);

    const fireSearch = useCallback((query: string) => {
        const assistantMsgId = crypto.randomUUID();
        setMessages((prev) => [
            ...prev,
            {
                id: assistantMsgId,
                role: "assistant",
                text: `Got it! Launching agents to find "${query}"…`,
                ts: Date.now(),
                steps: [],
                isStreaming: true,
            },
        ]);
        
        setIsPipelineRunning(true);
        streamRef.current = sse.streamPipeline(
            query,
            resumeId || "default",
            (data) => {
                if (data.type === "step") {
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId
                                ? { ...m, steps: [...(m.steps || []), data.message] }
                                : m
                        )
                    );
                } else if (data.type === "result") {
                    const res = data.data;
                    const resultText = `Found ${res.jobs_found} jobs. ${res.jobs_processed} high-match roles are ready in your Opportunities dashboard.`;
                    setIsPipelineRunning(false);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId
                                ? { ...m, isStreaming: false, text: resultText }
                                : m
                        )
                    );
                    if (sessionId) http.addMessage(sessionId, "assistant", resultText);
                } else if (data.type === "error") {
                    const errorText = `Pipeline error: ${data.message}`;
                    setIsPipelineRunning(false);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId
                                ? { ...m, isStreaming: false, text: errorText }
                                : m
                        )
                    );
                    if (sessionId) http.addMessage(sessionId, "assistant", errorText);
                }
            },
            (err) => {
                console.error("SSE error:", err);
                const disconnectText = "Lost connection to HQ. Please check if the backend is running.";
                setIsPipelineRunning(false);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMsgId
                            ? { ...m, isStreaming: false, text: disconnectText }
                            : m
                    )
                );
                if (sessionId) http.addMessage(sessionId, "assistant", disconnectText);
            }
        );
    }, [resumeId, sessionId, setMessages]);

    return {
        isPipelineRunning,
        stopPipeline,
        fireSearch
    };
}
