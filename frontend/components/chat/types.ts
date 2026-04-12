export type ViewMode = "chat" | "preview";

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
  steps?: string[];
  attachment_name?: string;
  attachment_path?: string;
  isStreaming?: boolean;
};

export type IntakeQuestion = {
  id: string;
  question: string;
  options: string[];
  allowSkip?: boolean;
  skippedValue?: string;
};

export const INTAKE_QUESTIONS: IntakeQuestion[] = [
  {
    id: "role",
    question: "What role are you looking for?",
    options: ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Data Scientist", "DevOps / SRE"],
    allowSkip: false,
  },
  {
    id: "work_type",
    question: "Remote, hybrid, or on-site?",
    options: ["Remote", "Hybrid", "On-site", "No preference"],
    allowSkip: false,
  },
  {
    id: "location",
    question: "Which location are you targeting?",
    options: ["India", "United States", "United Kingdom", "Europe", "Worldwide / Anywhere"],
    allowSkip: false,
  },
  {
    id: "seniority",
    question: "What seniority level?",
    options: ["Junior (0-2 yrs)", "Mid-level (2-5 yrs)", "Senior (5-8 yrs)", "Lead / Principal (8+ yrs)", "Any level"],
    allowSkip: false,
  },
  {
    id: "salary",
    question: "Expected salary range? (per year)",
    options: ["< $50k", "$50k - $80k", "$80k - $120k", "$120k - $160k", "$160k+"],
    allowSkip: true,
    skippedValue: "Any salary",
  },
];

export type IntakeState = {
  active: boolean;
  questionIndex: number;
  answers: Record<string, string>;
  originalQuery: string;
};

export const EMPTY_INTAKE: IntakeState = {
  active: false,
  questionIndex: 0,
  answers: {},
  originalQuery: "",
};
