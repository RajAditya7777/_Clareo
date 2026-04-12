import React from "react";
import { motion } from "framer-motion";
import { ResumeUpload } from "../ResumeUpload";
import { FloatingInput } from "./FloatingInput";

const CHIPS = [
  "I am a freelancer",
  "I am a client looking for talent",
  "Check my active projects",
];

export function WelcomeScreen({
  firstName,
  value,
  onChange,
  onSend,
  resumeId,
  onUploadSuccess,
  isStreaming,
  onStop,
}: {
  firstName: string;
  value: string;
  onChange: (v: string) => void;
  onSend: (text?: string) => void;
  resumeId: string | null;
  onUploadSuccess: (id: string) => void;
  isStreaming?: boolean;
  onStop?: () => void;
}) {
  return (
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px 48px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Greeting */}
        <p
          style={{
            margin: "0 0 10px",
            fontSize: 18,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-lora, Georgia, serif)",
            letterSpacing: "0.01em",
          }}
        >
          Hey {firstName}
        </p>
        {/* Heading */}
        <h1
          style={{
            margin: "0 0 40px",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontFamily: "var(--font-lora, Georgia, serif)",
            fontWeight: 600,
            color: "#fff",
            textAlign: "center",
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
          }}
        >
          How can I help you today?
        </h1>

        {/* Input or Resume Upload */}
        {!resumeId ? (
          <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
            <div
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 24,
                fontSize: 14,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.6,
                textAlign: "center",
                maxWidth: 420,
              }}
            >
              To get precise job matches, I need to analyze your resume first.
              <p style={{ margin: "12px 0 0", fontWeight: 600, color: "#fff", fontSize: 13 }}>
                Upload your resume to unlock Clareo HQ.
              </p>
            </div>
            <ResumeUpload onSuccess={onUploadSuccess} />
          </div>
        ) : (
          <>
            {/* Floating input */}
            <div style={{ width: "100%", maxWidth: 520, marginBottom: 24 }}>
              <FloatingInput
                value={value}
                onChange={onChange}
                onSend={() => onSend()}
                isStreaming={isStreaming}
                onStop={onStop}
              />
            </div>

            {/* Suggestion chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
              {CHIPS.map((chip) => (
                <button
                  key={chip}
                  onClick={() => onSend(chip)}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.65)",
                    fontSize: 13,
                    fontFamily: "var(--font-inter, system-ui, sans-serif)",
                    cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.65)";
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
