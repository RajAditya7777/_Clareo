"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { api } from "@/services/api";

interface ResumeUploadProps {
  onSuccess: (resumeId: string) => void;
}

export function ResumeUpload({ onSuccess }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await api.uploadResume(file);
      setSuccess(true);
      setTimeout(() => {
        onSuccess(result.resume_id);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Failed to upload resume");
    } finally {
      setIsUploading(false);
    }
  }, [onSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    multiple: false,
  });

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        {...(getRootProps() as any)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 p-8 flex flex-col items-center justify-center gap-4 ${
          isDragActive 
            ? "border-[#3B82F6] bg-[#3B82F6]/5" 
            : success
            ? "border-[#10B981] bg-[#10B981]/5"
            : error
            ? "border-red-500/50 bg-red-500/5"
            : "border-white/10 hover:border-white/20 bg-white/5 backdrop-blur-xl"
        }`}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <Loader2 className="w-10 h-10 text-[#3B82F6] animate-spin" />
              <p className="text-sm text-white/60 font-medium">Analyzing document...</p>
            </motion.div>
          ) : success ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <CheckCircle className="w-10 h-10 text-[#10B981]" />
              <p className="text-sm text-[#10B981] font-semibold">Resume Profile Locked!</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center gap-3 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[#3B82F6]/20 transition-colors">
                <Upload className="w-6 h-6 text-white/40 group-hover:text-[#3B82F6] transition-colors" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">Click or drag resume here</p>
                <p className="text-xs text-white/40 mt-1">PDF, DOCX, or TXT (Max 5MB)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-10 left-0 right-0 flex items-center justify-center gap-2 text-red-400 text-xs"
          >
            <AlertCircle className="w-3 h-3" />
            {error}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
