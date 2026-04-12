import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function IntakeCard({
  question,
  options,
  allowSkip,
  onAnswer,
  onSkip,
}: {
  question: string;
  options: string[];
  allowSkip?: boolean;
  onAnswer: (answer: string) => void;
  onSkip?: () => void;
}) {
  const [highlighted, setHighlighted] = useState(0);
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const customInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (customMode) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, options.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        onAnswer(options[highlighted]);
      }
      if (e.key === "Escape" && allowSkip && onSkip) onSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [highlighted, options, onAnswer, customMode, allowSkip, onSkip]);

  useEffect(() => {
    if (customMode) customInputRef.current?.focus();
  }, [customMode]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      style={{
        background: "rgba(24,24,28,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 14,
        overflow: "hidden",
        fontFamily: "var(--font-inter, system-ui, sans-serif)",
        maxWidth: 520,
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      }}
    >
      {/* Question header */}
      <div
        style={{
          padding: "18px 20px 14px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: "#fff",
            lineHeight: 1.4,
            fontFamily: "var(--font-lora, Georgia, serif)",
          }}
        >
          {question}
        </p>
      </div>

      {/* Options */}
      <div style={{ padding: "6px 0" }}>
        {options.map((opt, i) => (
          <button
            key={opt}
            onClick={() => onAnswer(opt)}
            onMouseEnter={() => setHighlighted(i)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "11px 20px",
              background: i === highlighted ? "rgba(255,255,255,0.07)" : "transparent",
              border: "none",
              borderBottom: i < options.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 0.1s",
            }}
          >
            <span
              style={{
                width: 24,
                height: 24,
                borderRadius: 6,
                background: i === highlighted ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: i === highlighted ? "#fff" : "rgba(255,255,255,0.4)",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
            >
              {i + 1}
            </span>
            <span
              style={{
                fontSize: 14,
                color: i === highlighted ? "#fff" : "rgba(255,255,255,0.7)",
                fontWeight: i === highlighted ? 500 : 400,
                flex: 1,
                transition: "color 0.1s",
              }}
            >
              {opt}
            </span>
            {i === highlighted && (
              <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{ opacity: 0.3 }}>
                <path d="M13 4v5H3M3 9l3-3M3 9l3 3" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" />
              </svg>
            )}
          </button>
        ))}

        {/* Something else + Skip row */}
        {!customMode ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <button
              onClick={() => setCustomMode(true)}
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "11px 20px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width={11} height={11} viewBox="0 0 11 11" fill="none">
                  <path d="M1 9l6-6M7 3H4M7 3v3" stroke="rgba(255,255,255,0.35)" strokeWidth={1.4} strokeLinecap="round" />
                </svg>
              </span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>Something else…</span>
            </button>
            {allowSkip && onSkip && (
              <button
                onClick={onSkip}
                style={{
                  marginRight: 16,
                  padding: "5px 14px",
                  borderRadius: 7,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.04)",
                  color: "rgba(255,255,255,0.5)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-inter, system-ui, sans-serif)",
                }}
              >
                Skip
              </button>
            )}
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (customValue.trim()) onAnswer(customValue.trim());
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px",
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <input
              ref={customInputRef}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="Type your answer…"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "8px 12px",
                color: "#fff",
                fontSize: 14,
                outline: "none",
                fontFamily: "var(--font-inter, system-ui, sans-serif)",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: customValue.trim() ? "#3B82F6" : "rgba(255,255,255,0.08)",
                border: "none",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Done
            </button>
          </form>
        )}
      </div>

      {/* Keyboard hint footer */}
      <div
        style={{
          padding: "8px 20px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          gap: 16,
        }}
      >
        {["↑↓ to navigate", "Enter to select", allowSkip ? "Esc to skip" : ""]
          .filter(Boolean)
          .map((h) => (
            <span key={h} style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>
              {h}
            </span>
          ))}
      </div>
    </motion.div>
  );
}
