"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { http } from "@/services/http";

import { WelcomeScreen } from "./chat/WelcomeScreen";
import { ActiveChatView } from "./chat/ActiveChatView";
import { ChatHeader, PreviewHeader } from "./chat/Headers";
import {
  Message,
  ViewMode,
} from "./chat/types";

import { usePipeline } from "@/hooks/usePipeline";
import { useIntake } from "@/hooks/useIntake";
import { isJobSearchIntent, isQAIntent } from "@/lib/intent";

// ─── Dynamic HQ3DScene (no SSR) ────────────────────────────────────────────────
const HQ3DScene = dynamic(
  () => import("@/components/HQ3DScene").then((m) => ({ default: m.HQ3DScene })),
  { ssr: false },
);

// ─── Main export ───────────────────────────────────────────────────────────────
export function ChatInterface({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [resumeId, setResumeId] = useState<string | null>(null);

  // Sync resumeId from localStorage on mount (hydration safety)
  useEffect(() => {
    const savedId = localStorage.getItem("clariyo_resume_id");
    if (savedId) setResumeId(savedId);
  }, []);

  // Custom Hooks
  const { isPipelineRunning, stopPipeline, fireSearch } = usePipeline({ resumeId, setMessages });
  const { intakeState, startIntake, handleIntakeAnswer, handleIntakeSkip } = useIntake({ setMessages, fireSearch });

  const handleUploadSuccess = (id: string) => {
    setResumeId(id);
    localStorage.setItem("clariyo_resume_id", id);
    setHasSentMessage(true);
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Resume analyzed! I've established your professional persona. I'm now ready to hunt for opportunities. What kind of roles should I scout for?",
        ts: Date.now(),
      },
    ]);
  };

  // ── Main send ──
  const sendMessage = useCallback(
    (overrideText?: string) => {
      const text = (overrideText ?? inputValue).trim();
      if (!text) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text, ts: Date.now() },
      ]);
      setInputValue("");
      setHasSentMessage(true);

      // Detect job search intent → start intake
      if (isJobSearchIntent(text)) {
        startIntake(text);
        return;
      }

      // Non-job-search intent: Is it a generic QA or ATS question?
      if (isQAIntent(text)) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const isAts = text.toLowerCase().includes("ats") || text.toLowerCase().includes("resume");
          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              text: isAts 
                ? "Allan (Resume Parser) here! 📄 I've analyzed your resume. Based on standard ATS scoring systems, your resume matches well with core developer skills but might lack explicit seniority metrics. I'll need a specific job description to give you an exact match score out of 100!"
                : "Clareo HQ here! I am an orchestrator for a 7-agent pipeline. I primarily launch complex job scraping and auto-application missions. If you want to search for jobs, just tell me what role to look for!",
              ts: Date.now(),
            },
          ]);
        }, 800);
        return;
      }

      // Fallback: Orchestrate pipeline for any other input
      fireSearch(text);
    },
    [inputValue, resumeId, intakeState, startIntake, fireSearch]
  );

  const chatToPreview = { x: 16, opacity: 0 };
  const previewToChat = { x: -16, opacity: 0 };


  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
        background: "#050507",
      }}
    >
      <AnimatePresence mode="wait">
        {!hasSentMessage ? (
          <WelcomeScreen
            key="welcome"
            firstName={firstName}
            value={inputValue}
            onChange={setInputValue}
            onSend={sendMessage}
            resumeId={resumeId}
            onUploadSuccess={handleUploadSuccess}
            isStreaming={isPipelineRunning}
            onStop={stopPipeline}
          />
        ) : (
          <motion.div
            key="active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          >
            <AnimatePresence mode="wait">
              {viewMode === "chat" ? (
                <motion.div key="chat-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <ChatHeader mode={viewMode} onModeChange={setViewMode} />
                </motion.div>
              ) : (
                <motion.div key="preview-header" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <PreviewHeader mode={viewMode} onModeChange={setViewMode} />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {viewMode === "chat" ? (
                <motion.div
                  key="chat-view"
                  initial={previewToChat}
                  animate={{ x: 0, opacity: 1 }}
                  exit={chatToPreview}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
                >
                  <ActiveChatView
                    messages={messages}
                    isTyping={isTyping}
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={sendMessage}
                    intakeState={intakeState}
                    onIntakeAnswer={handleIntakeAnswer}
                    onIntakeSkip={handleIntakeSkip}
                    isStreaming={isPipelineRunning}
                    onStop={stopPipeline}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="preview-view"
                  initial={chatToPreview}
                  animate={{ x: 0, opacity: 1 }}
                  exit={previewToChat}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  style={{ flex: 1, overflow: "hidden" }}
                >
                  <HQ3DScene />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
