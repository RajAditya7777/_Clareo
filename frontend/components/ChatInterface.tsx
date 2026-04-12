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

import { useRouter, useSearchParams } from "next/navigation";

// ─── Dynamic HQ3DScene (no SSR) ────────────────────────────────────────────────
const HQ3DScene = dynamic(
  () => import("@/components/HQ3DScene").then((m) => ({ default: m.HQ3DScene })),
  { ssr: false },
);

// ─── Main export ───────────────────────────────────────────────────────────────
export function ChatInterface({ firstName }: { firstName: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const isCreatingSession = useRef(false);

  // Sync resumeId from localStorage and handle sessionId from URL
  useEffect(() => {
    const savedId = localStorage.getItem("clariyo_resume_id");
    if (savedId) setResumeId(savedId);

    const sId = searchParams.get("id");
    if (sId) {
      const parsedId = parseInt(sId, 10);
      setSessionId(parsedId);
      setHasSentMessage(true);
      loadSessionMessages(parsedId);
    } else {
      // If we are back on /chat without an ID, reset states
      setSessionId(null);
      setHasSentMessage(false);
      setMessages([]);
    }
  }, [searchParams]);

  const loadSessionMessages = async (id: number) => {
    setIsLoadingHistory(true);
    try {
      const backendMsgs = await http.getMessages(id);
      const formatted = backendMsgs.map((m: any) => ({
        id: m.id.toString(),
        role: m.role,
        text: m.content,
        attachment_name: m.attachment_name,
        attachment_path: m.attachment_path,
        ts: new Date(m.created_at).getTime(),
      }));
      setMessages(formatted);
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Custom Hooks
  const { isPipelineRunning, stopPipeline, fireSearch } = usePipeline({ resumeId, sessionId, setMessages });
  const { intakeState, startIntake, handleIntakeAnswer, handleIntakeSkip } = useIntake({ sessionId, setMessages, fireSearch });

  const handleUploadSuccess = (id: string) => {
    setResumeId(id);
    localStorage.setItem("clariyo_resume_id", id);
    setHasSentMessage(true);
    
    const welcomeMsg = "Resume analyzed! I've established your professional persona. I'm now ready to hunt for opportunities. What kind of roles should I scout for?";
    setMessages([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        text: welcomeMsg,
        ts: Date.now(),
      },
    ]);
    
    // Create session on first upload if we want to persist it immediately
    // For now, we'll wait for the first user message to create a session for a better title
  };

  const handleFileUpload = async (file: File) => {
    setIsTyping(true);
    try {
      const result = await http.uploadResume(file);
      handleUploadSuccess(result.resume_id);
    } catch (err) {
      console.error("Upload failed:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: `Error analyzing resume: ${err instanceof Error ? err.message : "Possible file format issue"}. Please try again with a standard PDF/Doc.`,
          ts: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // ── Helper: Save message to backend ──
  const persistMessage = async (sId: number, role: string, content: string) => {
    try {
      await http.addMessage(sId, role, content);
    } catch (err) {
      console.error("Failed to persist message:", err);
    }
  };

  // ── Main send ──
  const sendMessage = useCallback(
    async (file?: File, overrideText?: string) => {
      const text = overrideText || inputValue;
      if (!text.trim() && !file) return;

      let currentSId = sessionId;

      // 1. Create session if it doesn't exist
      if (!currentSId) {
        if (isCreatingSession.current) return; // Prevention lock
        isCreatingSession.current = true;
        
        try {
          // Generate a title from the first 30 chars
          const title = text.length > 30 ? text.substring(0, 27) + "..." : text;
          const session = await http.createChat(title, resumeId || undefined);
          currentSId = session.id;
          setSessionId(currentSId);
          
          // Update URL without full reload
          const newUrl = `${window.location.pathname}?id=${currentSId}`;
          window.history.pushState({ path: newUrl }, "", newUrl);
        } catch (err) {
          console.error("Failed to create session:", err);
        } finally {
          isCreatingSession.current = false;
        }
      }

      // 2. Add message to local state
      let attachmentName = "";
      let attachmentPath = "";
      
      if (file) {
        try {
          const uploadRes = await http.uploadResume(file);
          attachmentName = file.name;
          attachmentPath = uploadRes.resume_id; // Using resume_id as the path/identifier
        } catch (err) {
          console.error("Attachment upload failed:", err);
        }
      }

      // 2. Add user message locally
      const userMsg: Message = {
          id: Date.now().toString(),
          role: "user",
          text,
          attachment_name: attachmentName || undefined,
          attachment_path: attachmentPath || undefined,
          ts: Date.now()
      };
      setMessages(prev => [...prev, userMsg]);
      setInputValue("");
      setHasSentMessage(true);

      // 3. Save to DB
      try {
        if (currentSId) {
          await http.addMessage(currentSId, "user", text, attachmentName, attachmentPath);
        }
      } catch (err) {
        console.error("Failed to save message:", err);
      }

      // All other messages are handled by the backend Agent pipeline
      fireSearch(text);
      // Note: fireSearch internally handles messages. 
      // To fully persist pipeline results, we'd need to update usePipeline to call persistMessage.
    },
    [inputValue, resumeId, sessionId, intakeState, startIntake, fireSearch]
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
                  {isLoadingHistory ? (
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
                      Synchronizing with HQ...
                    </div>
                  ) : (
                    <ActiveChatView
                      messages={messages}
                      isTyping={isTyping}
                      value={inputValue}
                      onChange={setInputValue}
                      onSend={sendMessage}
                      intakeState={intakeState}
                      onIntakeAnswer={handleIntakeAnswer}
                      onIntakeSkip={handleIntakeSkip}
                      onUpload={handleFileUpload}
                      isStreaming={isPipelineRunning}
                      onStop={stopPipeline}
                    />
                  )}
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
