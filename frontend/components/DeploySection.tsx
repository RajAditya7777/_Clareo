"use client";

import React from "react";
import { motion } from "framer-motion";

export default function DeploySection() {
  return (
    <section className="sticky top-0 h-screen w-screen overflow-hidden bg-black shadow-[0_-20px_40px_rgba(0,0,0,0.6)] z-30">
      <div className="absolute right-[15%] top-1/2 -translate-y-1/2 max-w-[360px] z-20">
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        >
          <div className="text-[11px] font-semibold tracking-[0.2em] text-white mb-6 uppercase">
            DEPLOY — 03
          </div>
          <div className="w-[40px] h-[1px] bg-white/30 mb-6" />
          <h2 className="text-[36px] font-semibold leading-[1.15] tracking-[-0.01em] text-white mb-5 whitespace-pre-line">
            HIRE WITH<br />CONFIDENCE
          </h2>
          <p className="text-[15px] font-normal leading-[1.72] text-white/50 max-w-[400px]">
            From first scan to final offer — Claero gives your team the intelligence to act fast and hire right.
          </p>
        </motion.div>
      </div>

      {/* Abstract Visual representation of Deploy */}
      <motion.div
        className="absolute left-[15%] top-1/2 w-[400px] -translate-y-1/2"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2 }}
      >
        <div className="w-[400px] h-[1px] bg-white/20" />
      </motion.div>
    </section>
  );
}
