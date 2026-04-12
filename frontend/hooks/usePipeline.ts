import { useState, useRef, useCallback } from "react";
import { sse } from "@/services/sse";
import { Message } from "@/components/chat/types";

interface UsePipelineProps {
    resumeId: string | null;
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export function usePipeline({ resumeId, setMessages }: UsePipelineProps) {
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
                    setIsPipelineRunning(false);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId
                                ? { ...m, isStreaming: false, text: `Found ${res.jobs_found} jobs. ${res.jobs_processed} high-match roles are ready in your Opportunities dashboard.` }
                                : m
                        )
                    );
                } else if (data.type === "error") {
                    setIsPipelineRunning(false);
                    setMessages((prev) =>
                        prev.map((m) =>
                            m.id === assistantMsgId
                                ? { ...m, isStreaming: false, text: `Pipeline error: ${data.message}` }
                                : m
                        )
                    );
                }
            },
            (err) => {
                console.error("SSE error:", err);
                setIsPipelineRunning(false);
                setMessages((prev) =>
                    prev.map((m) =>
                        m.id === assistantMsgId
                            ? { ...m, isStreaming: false, text: "Lost connection to HQ. Please check if the backend is running." }
                            : m
                    )
                );
            }
        );
    }, [resumeId, setMessages]);

    return {
        isPipelineRunning,
        stopPipeline,
        fireSearch
    };
}
