import React, { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export function WaveformBars() {
  const heights = [10, 16, 12, 20, 14, 10, 18];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2, height: 22 }}>
      {heights.map((h, i) => (
        <motion.div
          key={i}
          style={{
            width: 2.5,
            borderRadius: 2,
            background: "rgba(255,255,255,0.25)",
          }}
          animate={{ scaleY: [0.4, 1, 0.4] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.12,
            ease: "easeInOut",
          }}
          initial={{ height: h }}
        />
      ))}
    </div>
  );
}

export function FloatingInput({
  value,
  onChange,
  onSend,
  disabled = false,
  isStreaming = false,
  onStop,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasContent = value.trim().length > 0;

  // Auto-grow textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 140)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (hasContent && !disabled) onSend();
    }
  };

  return (
    <div
      style={{
        background: "rgba(32,32,36,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "1rem",
        boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        overflow: "hidden",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Top Row: textarea + send button */}
      <div style={{ display: "flex", alignItems: "flex-end", padding: "12px 14px 10px" }}>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Reply..."
          rows={1}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            color: "#fff",
            fontSize: 15,
            lineHeight: 1.6,
            fontFamily: "var(--font-inter, system-ui, sans-serif)",
            caretColor: "#E57A44",
            padding: 0,
            maxHeight: 140,
            overflowY: "auto",
            width: "100%",
          }}
        />
        {/* Send dot button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => !disabled && hasContent && onSend()}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "none",
            background: hasContent && !disabled ? "#3B82F6" : "rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: hasContent && !disabled ? "pointer" : "not-allowed",
            flexShrink: 0,
            marginLeft: 8,
            transition: "background 0.2s ease",
            boxShadow: hasContent && !disabled ? "0 0 12px rgba(59,130,246,0.4)" : "none",
          }}
        >
          <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
            <path d="M7 12V2M7 2L3 6M7 2L11 6" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      {/* Bottom Row: + | Clareo HQ ↓ | waveform */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 14px 12px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <button
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Plus size={13} />
        </button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              fontFamily: "var(--font-inter, system-ui, sans-serif)",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Clareo HQ ↓
          </span>
        </div>
        {isStreaming && onStop ? (
          <button
            onClick={onStop}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: "rgba(239,68,68,0.15)",
              color: "#EF4444",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 6,
              padding: "4px 10px",
              fontSize: 12,
              cursor: "pointer",
              fontWeight: 500,
              fontFamily: "var(--font-inter, system-ui, sans-serif)",
              boxShadow: "0 0 10px rgba(239,68,68,0.2)"
            }}
          >
            <div style={{ width: 8, height: 8, background: "#EF4444", borderRadius: 2 }} />
            Stop
          </button>
        ) : (
          <WaveformBars />
        )}
      </div>
    </div>
  );
}
