"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
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
  Trash2,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { http } from "@/services/http";

interface ChatSession {
  id: number;
  title: string;
}

export function AppSidebar({ userName }: { userName: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [recentChats, setRecentChats] = useState<ChatSession[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFeedbackToast, setShowFeedbackToast] = useState(false);
  const pathname = usePathname();

  // Load chats on mount and every 10 seconds
  React.useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchChats = async () => {
    try {
      const [chats, notifications] = await Promise.all([
        http.listChats(),
        http.getNotifications(20)
      ]);
      setRecentChats(chats);
      
      const unread = notifications.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch sidebar data:", err);
    }
  };

  const handleDeleteChat = async (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Optimistic update
    setRecentChats((prev) => prev.filter((c) => c.id !== id));
    
    try {
      await http.deleteChat(id);
    } catch (err) {
      console.error("Delete failed:", err);
      fetchChats(); // Revert on failure
    }
  };

  const handleFeedback = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowFeedbackToast(true);
    setTimeout(() => {
      setShowFeedbackToast(false);
    }, 3000);
  };

  const navItems = [
    { icon: MessageSquarePlus, label: "New chat", href: "/chat" },
    { icon: Users, label: "Roles", href: "/roles" },
    { icon: Briefcase, label: "Opportunities", href: "/opportunities" },
    { icon: Lightbulb, label: "Insights", href: "/insights" },
    { icon: Bell, label: "Notifications", href: "/notifications", badge: unreadCount > 0 ? unreadCount : undefined },
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
            Clariyo
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
          {navItems.map((item, i) => {
            const isActive = pathname === item.href || (pathname === '/' && item.href === '/chat');
            return (
              <a
                key={i}
                href={item.href}
                className={`flex items-center justify-between px-2 py-2 rounded-lg transition-colors group whitespace-nowrap ${
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-[#E57A44]" : "group-hover:text-white"}`} />
                  <motion.span
                    variants={itemVariants}
                    className="text-sm tracking-wide font-medium"
                  >
                    {item.label}
                  </motion.span>
                </div>
                {item.badge && isExpanded && (
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-[#E57A44] text-[10px] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        <motion.div
          variants={itemVariants}
          className="px-6 mt-12 mb-4"
        >
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
            Recent Chats
          </h3>
          <ul className="flex flex-col gap-1 text-sm text-white/60">
            {recentChats.map((chat) => (
              <li 
                key={chat.id} 
                className="group flex items-center justify-between py-1.5 hover:text-white cursor-pointer transition-colors"
                onClick={() => window.location.href = `/chat?id=${chat.id}`}
              >
                <span className="truncate flex-1">{chat.title}</span>
                <button
                  onClick={(e) => handleDeleteChat(e, chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#E57A44] transition-all"
                  title="Delete chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
            {recentChats.length === 0 && (
              <li className="text-white/20 italic py-1 px-1">No recent chats</li>
            )}
          </ul>
        </motion.div>
      </div>

      <div className="flex flex-col gap-2 px-4 mt-auto">
        <button
          onClick={handleFeedback}
          className="flex items-center gap-4 px-2 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors group whitespace-nowrap relative"
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          <motion.span
            variants={itemVariants}
            className="text-sm tracking-wide font-medium"
          >
            Feedback
          </motion.span>
          
          {showFeedbackToast && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute left-full ml-4 px-3 py-1 bg-[#E57A44] text-white text-[11px] font-bold rounded shadow-lg whitespace-nowrap z-50"
            >
              Sent to HQ!
            </motion.div>
          )}
        </button>

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

