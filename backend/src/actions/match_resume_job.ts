// @ts-nocheck
import type { Action, ActionExample, IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";

export const matchResumeJobAction = {
    name: "MATCH_RESUME_JOB",
    similes: ["SCORE_MATCH", "CALCULATE_SCORE"],
    description: "Compares a resume against a job description and returns a match score.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Trigger if the text contains a resume vs JD comparison request
        return !!message.content.text.match(/match|score|compare/i);
    },
    handler: async (runtime: IAgentRuntime, message: Memory, _state?: State, _options: any, callback?: HandlerCallback) => {
        // MOCK LOGIC for development:
        const mockMatchData = {
            score: 85,
            matched_skills: ["React", "TypeScript", "Node.js"],
            missing_skills: ["GraphQL"],
            explanation: "Very strong frontend presence but lacked the specific GraphQL requirement mentioned in the JD."
        };

        callback({
            text: `Match analysis complete. Score: ${mockMatchData.score}%.\nExplanation: ${mockMatchData.explanation}`,
            content: mockMatchData
        });

        return true;
    },
    // @ts-ignore
    examples: [
        [
            { user: "{{user1}}", content: { text: "Calculate match score for this job." } },
            { user: "MatchMaker", content: { text: "Match analysis complete.", action: "MATCH_RESUME_JOB" } }
        ]
    ] as ActionExample[][]
} as unknown as Action;
