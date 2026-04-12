import {
    Action,
    ActionExample,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
} from "@elizaos/core";

export const generateInsightsAction: Action = {
    name: "GENERATE_INSIGHTS",
    description: "Triggers a deep-dive analysis of the user's resume against current job market trends to generate the Career Dashboard insights.",
    similes: ["ANALYZE_RESUME", "CHECK_OPPORTUNITIES", "MARKET_ANALYSIS"],
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        // Validation could ensure the user has a resume ID stored in their state
        return true; 
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        options: any,
        callback: HandlerCallback
    ) => {
        try {
            // Assume the user's resume_id is stored in state. If not, default applies.
            const resumeId = state?.resumeId || "default";

            callback({
                text: "I'm initiating a deep-dive analysis of your resume and recent market trends. The Insights Dashboard will be updated shortly.",
            });

            // Trigger the Python backend to use the Nosana LLM and cache the insights into the database
            const API_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";
            const response = await fetch(`${API_URL}/api/insights/generate?resume_id=${resumeId}`, {
                method: "POST"
            });

            if (!response.ok) {
                throw new Error("Failed to generate insights via backend");
            }

            callback({
                text: "Analysis complete! Your Career Dashboard has been successfully updated with the latest market data and skill gap priorities.",
            });

            return true;
        } catch (error) {
            console.error("Error generating insights:", error);
            callback({
                text: "I ran into an issue connecting to the market data system. Please try again later.",
            });
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Analyze my resume to see what roles I should apply for." }
            },
            {
                user: "CareerCoach",
                content: { text: "Calculaing... I will let you know when the Insights tab is updated." },
                action: "GENERATE_INSIGHTS"
            }
        ]
    ] as ActionExample[][]
};
