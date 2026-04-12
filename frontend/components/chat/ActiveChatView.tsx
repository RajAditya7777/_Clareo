import React, { useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingInput } from "./FloatingInput";
import { IntakeCard } from "./IntakeCard";
import { MessageRow, ClaudeTypingIndicator } from "./MessageRow";
import { INTAKE_QUESTIONS, IntakeState, Message } from "./types";

export function ActiveChatView({
  messages,
  isTyping,
  value,
  onChange,
  onSend,
  intakeState,
  onIntakeAnswer,
  onIntakeSkip,
  isStreaming,
  onStop,
}: {
  messages: Message[];
  isTyping: boolean;
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  intakeState: IntakeState;
  onIntakeAnswer: (answer: string) => void;
  onIntakeSkip: () => void;
  isStreaming?: boolean;
  onStop?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, intakeState]);

  const currentQ = intakeState.active
    ? INTAKE_QUESTIONS[intakeState.questionIndex]
    : null;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
      {/* Scrollable messages */}
      <div
        className="custom-scrollbar"
        style={{
          flex: 1,
          overflowY: "auto",
          minHeight: 0, // CRUCIAL FIX FOR SCROLLING
          padding: "32px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
        }}
      >
        <div style={{ maxWidth: 672, margin: "0 auto", width: "100%", display: "flex", flexDirection: "column", gap: 32 }}>
          {messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} />
          ))}
          <AnimatePresence>
            {isTyping && <ClaudeTypingIndicator key="typing" />}
          </AnimatePresence>

          {/* Intake card — shown inline after AI asks each question */}
          <AnimatePresence>
            {currentQ && (
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <IntakeCard
                  question={currentQ.question}
                  options={currentQ.options}
                  allowSkip={currentQ.allowSkip}
                  onAnswer={onIntakeAnswer}
                  onSkip={onIntakeSkip}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} style={{ height: 20 }} />
        </div>
      </div>

      {/* Floating input — locked during intake */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          padding: "0 16px 8px",
          background: "linear-gradient(to top, rgba(10,10,11,1) 60%, transparent)",
        }}
      >
        <div style={{ maxWidth: 672, margin: "0 auto" }}>
          <FloatingInput
            value={value}
            onChange={onChange}
            onSend={onSend}
            disabled={intakeState.active}
            isStreaming={isStreaming}
            onStop={onStop}
          />
          <p
            style={{
              margin: "8px 0 0",
              textAlign: "center",
              fontSize: 11,
              color: "rgba(255,255,255,0.2)",
              fontFamily: "var(--font-inter, system-ui, sans-serif)",
            }}
          >
            Clareo AI can make mistakes. Always verify important information.
          </p>
        </div>
      </div>
    </div>
  );
}
