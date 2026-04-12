import { useState, useCallback } from "react";
import { Message, IntakeState, INTAKE_QUESTIONS, EMPTY_INTAKE } from "@/components/chat/types";

interface UseIntakeProps {
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    fireSearch: (query: string) => void;
}

function buildSearchQuery(intake: IntakeState): string {
    const r = intake.answers;
    const parts: string[] = [];
    if (r.role) parts.push(r.role);
    if (r.work_type && r.work_type !== "No preference") parts.push(r.work_type);
    if (r.location) parts.push("in " + r.location);
    if (r.seniority && r.seniority !== "Any level") parts.push(r.seniority);
    if (r.salary && r.salary !== "Any salary") parts.push("salary " + r.salary);
    return parts.length > 0 ? parts.join(" ") : intake.originalQuery;
}

export function useIntake({ setMessages, fireSearch }: UseIntakeProps) {
    const [intakeState, setIntakeState] = useState<IntakeState>(EMPTY_INTAKE);

    const startIntake = useCallback((originalQuery: string) => {
        const firstQ = INTAKE_QUESTIONS[0];
        setMessages((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                role: "assistant",
                text: `Sure! Let me gather a few details so I can find the best matches for you.\n\n${firstQ.question}`,
                ts: Date.now(),
            },
        ]);
        setIntakeState({
            active: true,
            questionIndex: 0,
            answers: {},
            originalQuery,
        });
    }, [setMessages]);

    const handleIntakeAnswer = useCallback((answer: string) => {
        const currentQ = INTAKE_QUESTIONS[intakeState.questionIndex];
        const updatedAnswers = { ...intakeState.answers, [currentQ.id]: answer };

        // Echo user's pick as a message
        setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), role: "user", text: answer, ts: Date.now() },
        ]);

        const nextIndex = intakeState.questionIndex + 1;

        if (nextIndex >= INTAKE_QUESTIONS.length) {
            // All done — compile and fire
            setIntakeState(EMPTY_INTAKE);
            const finalState: IntakeState = { ...intakeState, answers: updatedAnswers };
            const query = buildSearchQuery(finalState);
            setMessages((prev) => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    text: `Perfect! Searching for: **${query}**`,
                    ts: Date.now(),
                },
            ]);
            fireSearch(query);
        } else {
            // Ask next question
            const nextQ = INTAKE_QUESTIONS[nextIndex];
            setMessages((prev) => [
                ...prev,
                { id: crypto.randomUUID(), role: "assistant", text: nextQ.question, ts: Date.now() },
            ]);
            setIntakeState({ ...intakeState, questionIndex: nextIndex, answers: updatedAnswers });
        }
    }, [intakeState, setMessages, fireSearch]);

    const handleIntakeSkip = useCallback(() => {
        const currentQ = INTAKE_QUESTIONS[intakeState.questionIndex];
        handleIntakeAnswer(currentQ.skippedValue ?? "Any");
    }, [intakeState, handleIntakeAnswer]);

    return {
        intakeState,
        startIntake,
        handleIntakeAnswer,
        handleIntakeSkip
    };
}
