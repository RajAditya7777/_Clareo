"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  MessageSquarePlus,
  Briefcase,
  Lightbulb,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  Users,
  LogOut,
} from "lucide-react";
import { signOut } from "next-auth/react";

export function AppSidebar({ userName }: { userName: string }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const navItems = [
    { icon: MessageSquarePlus, label: "New chat", href: "/chat" },
    { icon: Users, label: "Roles", href: "#" },
    { icon: Briefcase, label: "Opportunities", href: "/opportunities" },
    { icon: Lightbulb, label: "Insights", href: "#" },
    { icon: Bell, label: "Notifications", href: "#" },
  ];

  const sidebarVariants = {
    expanded: { width: "256px" },
    collapsed: { width: "72px" },
  };

  const itemVariants = {
    expanded: { opacity: 1, display: "block" },
    collapsed: { opacity: 0, display: "none" },
  };

  return (
    <motion.aside
      initial="expanded"
      animate={isExpanded ? "expanded" : "collapsed"}
      variants={sidebarVariants}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="h-screen bg-black border-r border-white/10 flex flex-col justify-between py-6 shrink-0 relative overflow-hidden"
    >
      <div>
        <div className="flex items-center justify-between px-6 mb-8">
          <motion.div
            variants={itemVariants}
            transition={{ duration: 0.2 }}
            className="text-white font-serif italic text-2xl tracking-wide"
          >
            Clareo
          </motion.div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-white/60 hover:text-white transition-colors p-1"
          >
            {isExpanded ? (
              <PanelLeftClose className="w-5 h-5" />
            ) : (
              <PanelLeftOpen className="w-5 h-5 mx-auto" />
            )}
          </button>
        </div>

        <nav className="flex flex-col gap-2 px-4">
          {navItems.map((item, i) => (
            <a
              key={i}
              href={item.href}
              className="flex items-center gap-4 px-2 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors group whitespace-nowrap"
            >
              <item.icon className="w-5 h-5 shrink-0 group-hover:text-white" />
              <motion.span
                variants={itemVariants}
                className="text-sm tracking-wide font-medium"
              >
                {item.label}
              </motion.span>
            </a>
          ))}
        </nav>

        <motion.div
          variants={itemVariants}
          className="px-6 mt-12 mb-4"
        >
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
            Recents
          </h3>
          <ul className="flex flex-col gap-3 text-sm text-white/60">
            <li className="hover:text-white cursor-pointer transition-colors truncate">
              Freelancer Project Search
            </li>
          </ul>
        </motion.div>
      </div>

      <div className="flex flex-col gap-2 px-4 mt-auto">
        <a
          href="#"
          className="flex items-center gap-4 px-2 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors group whitespace-nowrap"
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          <motion.span
            variants={itemVariants}
            className="text-sm tracking-wide font-medium"
          >
            Feedback
          </motion.span>
        </a>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-4 px-2 py-2 rounded-lg text-white/60 hover:text-[#E57A44] hover:bg-[#E57A44]/10 transition-colors group whitespace-nowrap text-left"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <motion.span
            variants={itemVariants}
            className="text-sm tracking-wide font-medium"
          >
            Log out
          </motion.span>
        </button>

        <div className="flex items-center gap-4 px-2 py-2 mt-4 border-t border-white/10 pt-4">
          <div className="w-8 h-8 rounded-full bg-[#E57A44] flex items-center justify-center text-white font-bold text-sm shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <motion.div
            variants={itemVariants}
            className="flex flex-col justify-center overflow-hidden"
          >
            <span className="text-sm font-medium text-white truncate">{userName}</span>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}
