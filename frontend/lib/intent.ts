/**
 * Intent detection logic for the Clariyo chat interface.
 */

export function isJobSearchIntent(text: string): boolean {
    const lower = text.toLowerCase();
    const keywords = [
        "search", "find", "look for", "job", "jobs", "role", "roles",
        "position", "positions", "work", "hire", "hiring", "career",
        "opportunity", "opportunities", "apply", "developer", "engineer",
        "internship", "vacancy", "vacancies",
    ];
    return keywords.some((k) => lower.includes(k));
}

export function isQAIntent(text: string): boolean {
    const lower = text.toLowerCase();
    const keywords = [
        "ats", "score", "resume", "profile", "skills", 
        "who are you", "what can you do", "help", 
        "hello", "hi", "how are you"
    ];
    return keywords.some((k) => lower.includes(k));
}
