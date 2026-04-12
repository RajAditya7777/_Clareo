import React from "react";
import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { ViewMode } from "./types";

// ─── ViewToggle ────────────────────────────────────────────────────────────────
export function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 999,
        padding: "3px",
        position: "relative",
        gap: 2,
        userSelect: "none",
      }}
    >
      {/* Sliding background pill */}
      <motion.div
        layout
        transition={{ type: "spring", stiffness: 600, damping: 40 }}
        style={{
          position: "absolute",
          top: 3,
          left: mode === "chat" ? 3 : "calc(50% + 1px)",
          width: "calc(50% - 4px)",
          height: "calc(100% - 6px)",
          background: "rgba(255,255,255,0.1)",
          borderRadius: 999,
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      />
      {(["chat", "preview"] as ViewMode[]).map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 14px",
            borderRadius: 999,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "var(--font-inter, system-ui, sans-serif)",
            color: "#fff",
            opacity: mode === v ? 1 : 0.38,
            transition: "opacity 0.2s ease",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              flexShrink: 0,
              background: v === "chat" ? "#E57A44" : "#3B82F6",
              boxShadow: mode === v
                ? `0 0 8px ${v === "chat" ? "#E57A44" : "#3B82F6"}`
                : "none",
              transition: "box-shadow 0.3s ease",
            }}
          />
          {v === "chat" ? "Chat" : "Preview"}
        </button>
      ))}
    </div>
  );
}

// ─── Chat Header ───────────────────────────────────────────────────────────────
export function ChatHeader({ mode, onModeChange }: { mode: ViewMode; onModeChange: (m: ViewMode) => void }) {
  return (
    <div
      style={{
        position: "relative",
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}
    >
      {/* Left */}
      <span
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.5)",
          fontFamily: "var(--font-inter, system-ui, sans-serif)",
          fontWeight: 500,
        }}
      >
        Chat ↓
      </span>

      {/* Center — absolutely positioned */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <ViewToggle mode={mode} onChange={onModeChange} />
      </div>

      {/* Right */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "transparent",
            color: "rgba(255,255,255,0.55)",
            fontSize: 12,
            fontFamily: "var(--font-inter, system-ui, sans-serif)",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.55)";
          }}
        >
          <Share2 size={12} />
          Share
        </button>
      </div>
    </div>
  );
}

// ─── Preview Header ────────────────────────────────────────────────────────────
export function PreviewHeader({ mode, onModeChange }: { mode: ViewMode; onModeChange: (m: ViewMode) => void }) {
  return (
    <div
      style={{
        position: "relative",
        height: 52,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        background: "rgba(10,10,12,0.92)",
        backdropFilter: "blur(8px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Left — green dot + HQ title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#10B981",
            boxShadow: "0 0 8px #10B981",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "rgba(200,200,176,0.9)",
            fontFamily: "var(--font-mono, JetBrains Mono, monospace)",
          }}
        >
          CLAREO HEADQUARTERS
        </span>
      </div>

      {/* Center — absolutely positioned toggle */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <ViewToggle mode={mode} onChange={onModeChange} />
      </div>
    </div>
  );
}
