"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Plus, ArrowUp, ArrowUpRight, Send, Sparkles, Upload, FileText } from "lucide-react";
import dynamic from "next/dynamic";
import { api } from "@/services/api";
import { ResumeUpload } from "./ResumeUpload";

// Dynamically import the 3D scene to avoid SSR issues
const HQ3DScene = dynamic(
  () => import("@/components/HQ3DScene").then((m) => ({ default: m.HQ3DScene })),
  { ssr: false },
);

// ─── Types ────────────────────────────────────────────────────────────────────
type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  ts: number;
  steps?: string[]; // Real-time agent steps
  isStreaming?: boolean;
};

// ─── Mock AI responses ────────────────────────────────────────────────────────
const AI_RESPONSES = [
  "I'm analyzing the market landscape for freelance opportunities in your domain — Atlas is running a deep search right now.",
  "Nova has identified 12 high-potential clients based on your profile. Want me to prepare outreach templates?",
  "Cipher is cross-referencing your skills with current demand trends. The data looks promising — let me compile a summary.",
  "Echo has flagged 3 urgent opportunities that match your requirements. Lyra is drafting the initial pitch deck.",
  "Vex is monitoring 6 active pipelines for you. I'll notify you the moment a decision comes in.",
  "I've assigned your request to the HQ team. Atlas, Nova, and Cipher are collaborating on a comprehensive strategy.",
];

let responseIdx = 0;

// ─── Suggestion chips ─────────────────────────────────────────────────────────
const CHIPS = [
  { icon: Plus, label: "I am a freelancer" },
  { icon: Plus, label: "I am a client looking for talent" },
  { icon: ArrowUpRight, label: "Check my active projects" },
];

// ─── Individual message bubble ────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex items-end gap-1.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold ${
          isUser ? "bg-[#E57A44] text-white" : "bg-[#1a1a2e] border border-[#3B82F6]/40"
        }`}
      >
        {isUser ? "U" : <Bot className="w-2.5 h-2.5 text-[#3B82F6]" />}
      </div>
      <div
        className={`max-w-[82%] px-2.5 py-1.5 rounded-xl text-[11px] leading-relaxed ${
          isUser
            ? "bg-[#E57A44] text-white rounded-br-sm"
            : "bg-[#111827] border border-white/8 text-white/80 rounded-bl-sm"
        }`}
      >
        {msg.text}
        {msg.steps && msg.steps.length > 0 && (
          <div className="mt-2 space-y-1 pt-2 border-t border-white/10">
            {msg.steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-[9px] text-[#3B82F6]/70"
              >
                <span className="w-1 h-1 rounded-full bg-[#10B981]" />
                {step}
              </motion.div>
            ))}
            {msg.isStreaming && (
                <div className="flex items-center gap-1.5 text-[9px] text-white/30 italic animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-white/20" />
                    Crunching data...
                </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex items-end gap-2.5"
    >
      <div className="w-7 h-7 rounded-full flex-shrink-0 bg-[#1a1a2e] border border-[#3B82F6]/40 flex items-center justify-center">
        <Bot className="w-3.5 h-3.5 text-[#3B82F6]" />
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-[#111827] border border-white/8 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Empty/welcome state ──────────────────────────────────────────────────────
function WelcomeView({
  firstName,
  value,
  onChange,
  onSend,
  resumeId,
  onUploadSuccess,
}: {
  firstName: string;
  value: string;
  onChange: (v: string) => void;
  onSend: (text?: string) => void;
  resumeId: string | null;
  onUploadSuccess: (id: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl flex flex-col items-center">
        <h2 className="text-white/50 text-lg font-serif italic mb-2 tracking-wide">
          Hey {firstName}
        </h2>
        <h1 className="text-4xl md:text-5xl font-serif text-white tracking-wide mb-12 text-center">
            {resumeId ? "How can I help you today?" : "Ready to hit the market?"}
        </h1>

        {!resumeId ? (
            <div className="w-full flex flex-col items-center gap-6">
                 <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white/80 text-sm leading-relaxed text-center max-w-md backdrop-blur-xl">
                    <Sparkles className="w-5 h-5 text-[#3B82F6] mx-auto mb-3" />
                    To provide high-fidelity job matches, I first need to analyze your professional DNA.
                    <p className="mt-2 font-semibold text-white">Please upload your resume to unlock Clariyo HQ.</p>
                </div>
                <ResumeUpload onSuccess={onUploadSuccess} />
            </div>
        ) : (
            <>
                {/* Input */}
                <div className="relative w-full mb-7">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-white/50 hover:text-white cursor-pointer transition-colors">
                    <Plus className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => {
                    if (e.key === "Enter" && value.trim()) onSend();
                    }}
                    placeholder={`Try "Search for Senior Backend roles"`}
                    className="w-full bg-[#111] border border-white/10 rounded-3xl py-4 pl-14 pr-14 text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/20 shadow-md transition-shadow text-[15px]"
                />
                <button
                    onClick={() => value.trim() && onSend()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#E57A44] flex items-center justify-center text-white hover:bg-[#d46b35] transition-colors shadow-sm disabled:opacity-40"
                    disabled={!value.trim()}
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                </div>

                {/* Chips */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                {CHIPS.map(({ icon: Icon, label }) => (
                    <button
                    key={label}
                    onClick={() => onSend(label)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-all hover:border-white/20 hover:text-white shadow-sm font-medium"
                    >
                    <Icon className="w-3.5 h-3.5 text-white/40" />
                    {label}
                    </button>
                ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
}

// ─── Chat panel (right side after first message) ──────────────────────────────
function ChatPanel({
  messages,
  isTyping,
  inputValue,
  onChange,
  onSend,
  resumeId,
  onUploadSuccess,
}: {
  messages: Message[];
  isTyping: boolean;
  inputValue: string;
  onChange: (v: string) => void;
  onSend: () => void;
  resumeId: string | null;
  onUploadSuccess: (id: string) => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex flex-col h-full bg-[#050505]/50 backdrop-blur-2xl">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-white/8 bg-black/20">
        <div className="w-6 h-6 rounded-full bg-[#1a1a2e] border border-[#3B82F6]/40 flex items-center justify-center shrink-0">
          <Bot className="w-3 h-3 text-[#3B82F6]" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate">Clareo HQ Agent</p>
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-[#10B981] animate-pulse" />
            <p className="text-white/35 text-[10px] truncate">Active · Multi-agent system</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-6 scrollbar-hide">
        {/* Fixed Intro */}
        {!resumeId && messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 max-w-[85%]"
          >
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-white/80 text-xs leading-relaxed">
              <Sparkles className="w-4 h-4 text-[#3B82F6] mb-2" />
              Welcome to <strong>Clareo HQ</strong>. I'm your dedicated career scout. 
              <br />
              Before I can hunt for jobs and analyze matches, I need to understand your professional DNA.
              <p className="mt-3 font-semibold text-white">Please upload your resume to begin.</p>
            </div>
            <ResumeUpload onSuccess={onUploadSuccess} />
          </motion.div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <AnimatePresence>
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-4 border-t border-white/8 bg-black/40">
        <div className="relative flex items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => onChange(e.target.value)}
            disabled={!resumeId}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue.trim()) onSend();
            }}
            placeholder={resumeId ? "Ask for any job (e.g. 'Frontend roles in NYC')..." : "Upload resume to enable search"}
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/30 text-xs transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => inputValue.trim() && onSend()}
            disabled={!inputValue.trim() || !resumeId}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function ChatInterface({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasSentMessage, setHasSentMessage] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("clariyo_resume_id");
    }
    return null;
  });

  const handleUploadSuccess = (id: string) => {
    setResumeId(id);
    localStorage.setItem("clariyo_resume_id", id);
    setHasSentMessage(true);
    const successMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        text: "Resume analyzed! I've established your professional persona. I'm now ready to hunt for opportunities. What kind of roles should I scout for?",
        ts: Date.now(),
    };
    setMessages([successMsg]);
  };

  const sendMessage = (overrideText?: string) => {
    const text = (overrideText ?? inputValue).trim();
    if (!text) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      ts: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setHasSentMessage(true);

    // Initial assistant message that will grow with steps
    const assistantMsgId = crypto.randomUUID();
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: "assistant",
      text: `Clareo HQ is on it. I'm orchestrating 8 agents to scour the web for "${text}"...`,
      ts: Date.now(),
      steps: [],
      isStreaming: true
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setIsTyping(false); // We show our own progress UI now

    // Start Real-Time Streaming
    api.streamPipeline(text, resumeId || "default", 
      (data) => {
        if (data.type === "step") {
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId 
              ? { ...m, steps: [...(m.steps || []), data.message] } 
              : m
          ));
        } else if (data.type === "result") {
          const res = data.data;
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId 
              ? { 
                  ...m, 
                  isStreaming: false,
                  text: `Success! My agents found and analyzed ${res.jobs_found} jobs. You have ${res.jobs_processed} matches ready for review in your dashboard.` 
                } 
              : m
          ));
        } else if (data.type === "error") {
          setMessages(prev => prev.map(m => 
            m.id === assistantMsgId 
              ? { ...m, isStreaming: false, text: `Pipeline error: ${data.message}` } 
              : m
          ));
        }
      },
      (err) => {
        console.error("SSE Connection error:", err);
        setMessages(prev => prev.map(m => 
          m.id === assistantMsgId 
            ? { ...m, isStreaming: false, text: "Lost connection to the HQ engine. Please check if the backend is running." } 
            : m
        ));
      }
    );
  };

  return (
    <div className="relative flex-1 flex h-full overflow-hidden">
      <AnimatePresence mode="wait">
        {!hasSentMessage ? (
          /* ── Welcome state ── */
          <motion.div
            key="welcome"
            className="w-full flex flex-col"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
          >
            <WelcomeView
              firstName={firstName}
              value={inputValue}
              onChange={setInputValue}
              onSend={sendMessage}
            />
          </motion.div>
        ) : (
          /* ── Split view ── */
          <motion.div
            key="split"
            className="w-full flex h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* LEFT — 3D HQ */}
            <motion.div
              className="h-full overflow-hidden border-r border-white/8"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "78%", opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1] }}
            >
              <HQ3DScene />
            </motion.div>

            {/* RIGHT — Chat */}
            <motion.div
              className="h-full bg-[#0d0d0f] flex flex-col border-l border-white/8"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "22%", opacity: 1 }}
              transition={{ duration: 0.55, ease: [0.32, 0.72, 0, 1], delay: 0.05 }}
            >
              <ChatPanel
                messages={messages}
                isTyping={isTyping}
                inputValue={inputValue}
                onChange={setInputValue}
                onSend={sendMessage}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
