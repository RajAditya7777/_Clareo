import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, ThumbsUp, ThumbsDown, RotateCcw, FileText } from "lucide-react";
import { Message } from "./types";

// ─── Claude-style 8-spoke Asterisk Typing Indicator ────────────────────────────
export function ClaudeTypingIndicator() {
  const spokes = Array.from({ length: 8 }, (_, i) => ({
    angle: i * 45,
    delay: (i / 8) * 0.8,
  }));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "2px 0",
      }}
    >
      <motion.svg
        width={22}
        height={22}
        viewBox="0 0 22 22"
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        style={{ flexShrink: 0, marginTop: 2 }}
      >
        {spokes.map(({ angle, delay }) => (
          <motion.line
            key={angle}
            x1={11}
            y1={11}
            x2={11 + Math.cos(((angle - 90) * Math.PI) / 180) * 8}
            y2={11 + Math.sin(((angle - 90) * Math.PI) / 180) * 8}
            stroke="#E57A44"
            strokeWidth={2}
            strokeLinecap="round"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.svg>
    </motion.div>
  );
}

// ─── Message Action Buttons ────────────────────────────────────────────────────
function MessageActions() {
  const [liked, setLiked] = useState<null | "up" | "down">(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const btns = [
    { icon: <Copy size={13} />, label: "Copy", action: handleCopy, active: copied },
    { icon: <ThumbsUp size={13} />, label: "Good", action: () => setLiked("up"), active: liked === "up" },
    { icon: <ThumbsDown size={13} />, label: "Bad", action: () => setLiked("down"), active: liked === "down" },
    { icon: <RotateCcw size={13} />, label: "Retry", action: () => {}, active: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 5 }}
      transition={{ duration: 0.15 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        marginTop: 6,
      }}
    >
      {btns.map((b) => (
        <button
          key={b.label}
          onClick={b.action}
          title={b.label}
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            border: "none",
            background: b.active ? "rgba(255,255,255,0.1)" : "transparent",
            color: b.active ? "#fff" : "rgba(255,255,255,0.4)",
            cursor: "pointer",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {b.icon}
        </button>
      ))}
    </motion.div>
  );
}

// ─── Message Component ─────────────────────────────────────────────────────────
export function MessageRow({ msg }: { msg: Message }) {
  const [hovered, setHovered] = useState(false);
  const isUser = msg.role === "user";

  if (isUser) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 450, damping: 30 }}
        style={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <div
          style={{
            maxWidth: "55%",
            background: "rgba(255,255,255,0.09)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 18,
            padding: "10px 16px",
            fontSize: 15,
            lineHeight: 1.6,
            color: "#fff",
            fontFamily: "var(--font-inter, system-ui, sans-serif)",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          {msg.attachment_name && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "6px 10px",
                alignSelf: "flex-start",
                marginBottom: 2,
              }}
            >
              <FileText size={14} color="#3B82F6" />
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{msg.attachment_name}</span>
            </div>
          )}
          {msg.text}
        </div>
      </motion.div>
    );
  }

  // AI message — plain text, no bubble, action buttons on hover
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", flexDirection: "column", gap: 0 }}
    >
      <motion.p
        layout="position"
        style={{
          margin: 0,
          fontSize: 15,
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.85)",
          fontFamily: "var(--font-inter, system-ui, sans-serif)",
        }}
      >
        {msg.text}
      </motion.p>
      {/* Agent steps */}
      {msg.steps && msg.steps.length > 0 && (
        <motion.div layout="position" style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
          {msg.steps.map((step, idx) => (
            <motion.div
              layout
              key={idx}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "rgba(59,130,246,0.75)",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#10B981",
                  flexShrink: 0,
                }}
              />
              {step}
            </motion.div>
          ))}
          {msg.isStreaming && (
            <motion.div
              layout
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
                fontStyle: "italic",
                fontFamily: "var(--font-mono, monospace)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  flexShrink: 0,
                }}
              />
              <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                Crunching data...
              </motion.span>
            </motion.div>
          )}
        </motion.div>
      )}
      {/* Hover actions */}
      <AnimatePresence>
        {hovered && !msg.isStreaming && <MessageActions />}
      </AnimatePresence>
    </motion.div>
  );
}
