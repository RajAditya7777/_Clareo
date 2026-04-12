"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings2, Trash2, CheckCircle2, User, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { http, Profile } from "@/services/http";
import { useSession } from "next-auth/react";

export default function RolesPage() {
  const { data: session } = useSession();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
    const stored = localStorage.getItem("clariyo_resume_id");
    setActiveResumeId(stored || "default");
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const data = await http.listProfiles();
      setProfiles(data);
    } catch (e) {
      console.error("Failed to fetch profiles:", e);
    }
    setLoading(false);
  };

  const activateRole = (resumeId: string) => {
    localStorage.setItem("clariyo_resume_id", resumeId);
    setActiveResumeId(resumeId);
  };

  const deleteRole = async (e: React.MouseEvent, resumeId: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this persona?")) return;
    
    try {
      await http.deleteProfile(resumeId);
      setProfiles(profiles.filter(p => p.resume_id !== resumeId));
      if (activeResumeId === resumeId) {
        activateRole("default");
      }
    } catch (e) {
      console.error("Failed to delete profile:", e);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <div className="sticky top-0 h-screen shrink-0">
        <AppSidebar userName={session?.user?.name || "User"} />
      </div>
      
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-4xl mx-auto p-12 py-20">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-10 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#E57A44]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#E57A44] font-bold">Identity Manager</span>
              </div>
              <h1 className="text-5xl font-serif tracking-tight mb-4 italic">My Personas</h1>
              <p className="text-lg text-white/50 max-w-xl">
                Switch search identities to change how AI agents represent you.
                Each persona has its own tailored resume and skill priorities.
              </p>
            </div>
            <button 
              onClick={() => window.location.href = "/"}
              className="group flex items-center gap-2 px-6 py-3 bg-[#E57A44] text-white font-bold rounded-2xl hover:bg-[#E57A44]/90 transition-all shadow-lg shadow-[#E57A44]/10 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> 
              Add Identity
            </button>
          </header>

          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center opacity-30">
              <Loader2 className="w-8 h-8 animate-spin text-[#E57A44] mb-4" />
              <p className="text-sm font-medium uppercase tracking-widest">Scanning HQ Profiles...</p>
            </div>
          ) : profiles.length === 0 ? (
            <div className="p-20 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-white/20" />
              </div>
              <h2 className="text-xl font-medium mb-2">No personas found</h2>
              <p className="text-white/40 mb-8 max-w-xs mx-auto text-sm">Upload a new resume in the chat to create your first search identity.</p>
              <button onClick={() => window.location.href = "/"} className="px-6 py-2 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-sm font-bold">
                Go to Chat
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              <AnimatePresence mode="popLayout">
                {profiles.map((profile, i) => {
                  const isActive = activeResumeId === profile.resume_id;
                  return (
                    <motion.div 
                      key={profile.resume_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => activateRole(profile.resume_id)}
                      className={`relative overflow-hidden cursor-pointer group border-2 rounded-3xl p-8 transition-all duration-500 ${
                        isActive 
                          ? 'bg-[#1a1a1a]/80 border-[#E57A44]/50 shadow-2xl shadow-[#E57A44]/5' 
                          : 'bg-[#141414]/40 border-white/5 hover:border-white/10 hover:bg-[#18181a]'
                      }`}
                    >
                      {isActive && (
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E57A44]/5 blur-[80px] rounded-full pointer-events-none" />
                      )}
                      
                      <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                            isActive 
                              ? 'bg-[#E57A44] text-white shadow-xl shadow-[#E57A44]/20 scale-110' 
                              : 'bg-white/5 text-white/20 group-hover:text-white/40 group-hover:scale-105'
                          }`}>
                            {isActive ? <CheckCircle2 className="w-8 h-8" /> : <User className="w-8 h-8" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className={`text-2xl font-serif italic ${isActive ? 'text-white' : 'text-white/80'}`}>
                                {profile.full_name || "Unknown Persona"}
                              </h3>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isActive ? 'bg-[#E57A44] text-white' : 'bg-white/5 text-white/40'
                              }`}>
                                {profile.seniority}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {profile.tech_stack.slice(0, 3).map((tech, idx) => (
                                <span key={idx} className="text-[11px] text-white/30 px-2 py-0.5 bg-white/5 rounded-md">
                                  {tech}
                                </span>
                              ))}
                              {profile.tech_stack.length > 3 && (
                                <span className="text-[11px] text-white/20 px-2 py-0.5">+{profile.tech_stack.length - 3} more</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 self-end md:self-center">
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all">
                              <Settings2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => deleteRole(e, profile.resume_id)}
                              className="p-3 bg-white/5 hover:bg-red-500/20 rounded-xl text-white/40 hover:text-red-400 transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                          
                          {isActive ? (
                            <span className="text-[10px] font-bold text-[#E57A44] uppercase tracking-[0.2em] bg-[#E57A44]/10 px-4 py-2 rounded-xl border border-[#E57A44]/20">
                              Active Persona
                            </span>
                          ) : (
                            <button className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-4 py-2 rounded-xl group-hover:text-white/60 transition-colors">
                              Select
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
