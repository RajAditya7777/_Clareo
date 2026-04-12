"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { 
    Briefcase, 
    MapPin, 
    ExternalLink, 
    CheckCircle2, 
    XCircle, 
    ShieldCheck,
    Trash2,
    Loader2,
    Sparkles,
    Globe
} from "lucide-react";
import { JobApplication, ApplicationStatus, api } from "@/services/api";

interface JobCardProps {
    job: JobApplication;
    resumeId?: string;
    onStatusUpdate?: () => void;
}

export default function JobCard({ job, resumeId, onStatusUpdate }: JobCardProps) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        setIsConfirming(true);
        try {
            await api.confirmApply(job.job_id, resumeId);
            if (onStatusUpdate) onStatusUpdate();
        } catch (err) {
            console.error("Failed to confirm application:", err);
            alert("Failed to confirm application. Please try again.");
        } finally {
            setIsConfirming(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to discard this opportunity?")) return;
        setIsDeleting(true);
        try {
            await api.deleteApplication(job.job_id);
            if (onStatusUpdate) onStatusUpdate();
        } catch (err) {
            console.error("Failed to delete application:", err);
        } finally {
            setIsDeleting(false);
        }
    };

    const scoreColor = job.match_score && job.match_score > 80 
        ? "text-emerald-400" 
        : job.match_score && job.match_score > 60 
            ? "text-orange-400" 
            : "text-rose-400";

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative bg-[#111113] border border-white/5 hover:border-white/10 rounded-2xl p-5 transition-all duration-300 shadow-xl overflow-hidden"
        >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />

            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                        {job.company_logo ? (
                            <img src={job.company_logo} alt={job.company} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        ) : (
                            <Briefcase className="w-5 h-5 text-white/70" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-white font-medium text-[15px] leading-tight group-hover:text-[#E57A44] transition-colors">
                            {job.title}
                        </h3>
                        <p className="text-white/40 text-[13px]">{job.company}</p>
                    </div>
                </div>
                
                {job.match_score !== undefined && (
                    <div className="flex flex-col items-end">
                        <span className={`text-[18px] font-bold ${scoreColor}`}>
                            {job.match_score}%
                        </span>
                        <span className="text-[9px] text-white/20 uppercase tracking-widest font-semibold">Match</span>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-5">
                {job.location && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/60">
                        <MapPin className="w-3 h-3" />
                        {job.location}
                    </div>
                )}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-[11px] text-white/60 uppercase tracking-wider font-semibold">
                    {job.status}
                </div>
                {job.platform && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E57A44]/10 border border-[#E57A44]/20 text-[11px] text-[#E57A44] font-bold">
                        <Globe className="w-3 h-3" />
                        {job.platform}
                    </div>
                )}
                {job.tailored_resume_path && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 font-bold">
                        <Sparkles className="w-3 h-3" />
                        Tailored CV
                    </div>
                )}
            </div>

            {/* Recommendation / Insight */}
            {job.recommendation && (
                <div className="mb-5 p-3 rounded-lg bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#3B82F6]" />
                        <span className="text-[10px] text-[#3B82F6] font-bold uppercase tracking-widest">HQ Insight</span>
                    </div>
                    <p className="text-[12px] text-white/70 leading-relaxed italic">
                        "{job.recommendation}"
                    </p>
                </div>
            )}

            {/* Application Skills */}
            {(job.matched_skills?.length || job.missing_skills?.length) && (
                <div className="flex flex-col gap-2.5 mb-6">
                    {job.matched_skills && job.matched_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {job.matched_skills.slice(0, 4).map(skill => (
                                <span key={skill} className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
                                    <CheckCircle2 className="w-2.5 h-2.5" />
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                    {job.missing_skills && job.missing_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {job.missing_skills.slice(0, 3).map(skill => (
                                <span key={skill} className="flex items-center gap-1 text-[10px] text-white/30 font-medium">
                                    <XCircle className="w-2.5 h-2.5" />
                                    {skill}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                <a 
                    href={job.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 text-[12px] font-medium transition-all"
                >
                    View Listing
                    <ExternalLink className="w-3 h-3" />
                </a>

                {job.status !== ApplicationStatus.APPLIED ? (
                    <button
                        onClick={handleConfirm}
                        disabled={isConfirming}
                        className="flex-[1.5] flex items-center justify-center gap-2 py-2 rounded-xl bg-[#E57A44] hover:bg-[#d46b35] disabled:opacity-50 text-white text-[12px] font-semibold transition-all shadow-lg shadow-[#E57A44]/10"
                    >
                        {isConfirming ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            "Confirm Apply"
                        )}
                    </button>
                ) : (
                    <div className="flex-[1.5] flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-[12px] font-semibold border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Applied
                    </div>
                )}

                <button 
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 rounded-xl bg-rose-500/5 hover:bg-rose-500/10 text-rose-500/50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );
}
