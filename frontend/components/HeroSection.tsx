"use client";

import React from "react";
import { motion } from "framer-motion";
import RadarScanner from "./RadarScanner";

export default function HeroSection() {
  return (
    <section className="sticky top-0 h-screen w-screen overflow-hidden bg-black shadow-[0_-20px_40px_rgba(0,0,0,0.6)] z-10">
      <div className="absolute left-1/2 top-[85vh] -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[1]">
        <RadarScanner />
      </div>

      <motion.div
        className="absolute top-[35%] inset-x-0 text-center pointer-events-none z-50 py-[100px] -mt-[100px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, transparent 60%)",
        }}
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-white/50 mb-10 mt-10">
          Welcome to Claero
        </p>
        <h1 className="text-[clamp(40px,6vw,72px)] font-semibold leading-[1.1] tracking-[-0.01em] text-white mb-10 drop-shadow-[0_4px_24px_rgba(0,0,0,1)]">
          THE FUTURE OF<br />TALENT INTELLIGENCE
        </h1>
        <button
          className="pointer-events-auto px-8 py-3.5 border border-white/25 rounded-full bg-black text-white text-[11px] font-semibold tracking-[0.2em] uppercase cursor-pointer transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,1)] hover:bg-white hover:text-black"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: "smooth" })}
        >
          EXPLORE
        </button>
      </motion.div>
    </section>
  );
}
