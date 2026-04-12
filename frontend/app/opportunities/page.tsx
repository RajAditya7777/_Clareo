"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import JobCard from "@/components/JobCard";
import { api, JobApplication, ApplicationStatus } from "@/services/api";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, RefreshCw, Briefcase, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";

export default function OpportunitiesDashboard() {
    const { data: session } = useSession();
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "MATCHED" | "APPLIED">("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [resumeId, setResumeId] = useState<string | undefined>();

    const fetchJobs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await api.getApplications();
            setJobs(data);
        } catch (err) {
            console.error("Failed to fetch jobs:", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJobs();
        // Get resumeId from localStorage
        const storedId = localStorage.getItem("clariyo_resume_id");
        if (storedId) setResumeId(storedId);

        // Polling every 15 seconds to catch pipeline updates
        const interval = setInterval(fetchJobs, 15000);
        return () => clearInterval(interval);
    }, [fetchJobs]);

    const filteredJobs = jobs.filter(job => {
        const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             job.company.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (filter === "ALL") return matchesSearch;
        if (filter === "MATCHED") return matchesSearch && job.status === ApplicationStatus.MATCHED;
        if (filter === "APPLIED") return matchesSearch && job.status === ApplicationStatus.APPLIED;
        return matchesSearch;
    });

    return (
        <div className="flex h-screen w-full bg-[#0a0a0b] text-white overflow-hidden font-sans">
            <AppSidebar userName={session?.user?.name || "User"} />
            
            <main className="flex-1 flex flex-col relative h-full overflow-hidden">
                {/* Header */}
                <div className="px-8 pt-10 pb-6 border-b border-white/5 bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-10">
                    <div className="flex justify-between items-end mb-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-[#E57A44]" />
                                <span className="text-[10px] font-bold text-[#E57A44] uppercase tracking-[0.2em]">HQ Control</span>
                            </div>
                            <h1 className="text-3xl font-serif italic tracking-wide">Opportunities</h1>
                        </div>
                        <button 
                            onClick={fetchJobs}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all border border-white/5 text-xs font-medium"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            Sync Data
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Tabs */}
                        <div className="flex p-1 bg-white/5 rounded-xl border border-white/5">
                            {["ALL", "MATCHED", "APPLIED"].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilter(t as any)}
                                    className={`px-6 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all ${
                                        filter === t 
                                            ? "bg-[#E57A44] text-white shadow-lg" 
                                            : "text-white/40 hover:text-white/70"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                            <input 
                                type="text" 
                                placeholder="Search by role or company..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl py-2 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-[#E57A44]/40 text-sm transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {isLoading && jobs.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-30">
                            <LoaderAnimation />
                            <p className="mt-4 text-sm font-medium">Scanning HQ Archives...</p>
                        </div>
                    ) : filteredJobs.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredJobs.map((job) => (
                                    <JobCard 
                                        key={job.job_id} 
                                        job={job} 
                                        resumeId={resumeId}
                                        onStatusUpdate={fetchJobs} 
                                    />
                                ))}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-20">
                            <Briefcase className="w-12 h-12 mb-4" />
                            <h3 className="text-xl font-medium">No opportunities found</h3>
                            <p className="text-sm">Start a new search in the Chat interface.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function LoaderAnimation() {
    return (
        <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    animate={{ height: [12, 24, 12], opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1.5 bg-[#E57A44] rounded-full"
                />
            ))}
        </div>
    );
}
