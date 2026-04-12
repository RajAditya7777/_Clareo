"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Briefcase, Zap, CheckCircle2, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { http, Notification } from "@/services/http";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await http.getNotifications(50);
      setNotifications(data);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    try {
      await http.markAllNotificationsRead();
      fetchNotifications(); // Refresh to be safe
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const getIcon = (type: string) => {
    switch(type.toUpperCase()) {
      case 'AGENT': return <Briefcase className="w-5 h-5 text-blue-400" />;
      case 'SYSTEM': return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'ALERT': 
      case 'UPDATE': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Bell className="w-5 h-5 text-white/60" />;
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 h-screen shrink-0">
        <AppSidebar userName="User" />
      </div>
      
      <main className="flex-1 p-12">
        <div className="max-w-3xl mx-auto">
          <header className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-4xl font-serif tracking-tight mb-2">Notifications</h1>
              <p className="text-white/60">Updates from your autonomous agents and system alerts.</p>
            </div>
            <button 
              onClick={markAllAsRead}
              disabled={loading || notifications.every(n => n.is_read)}
              className="text-sm font-medium text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Mark all as read
            </button>
          </header>

          <div className="space-y-4">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-white/20">
                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                <p>Syncing your alerts...</p>
              </div>
            ) : (
              <AnimatePresence>
                {notifications.map((notif, i) => (
                  <motion.div 
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.05 }}
                    className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-300 ${
                      notif.is_read 
                        ? 'bg-[#141414] border-white/5 text-white/60' 
                        : 'bg-[#1a1a1a] border-[#E57A44]/30 hover:border-[#E57A44]/60 cursor-pointer shadow-lg shadow-[#E57A44]/5'
                    }`}
                  >
                    {!notif.is_read && (
                      <div className="absolute top-0 left-0 w-1 h-full bg-[#E57A44]" />
                    )}
                    
                    <div className="flex gap-4">
                      <div className={`mt-1 p-2 rounded-lg shrink-0 ${notif.is_read ? 'bg-white/5' : 'bg-white/10'}`}>
                        {getIcon(notif.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className={`font-medium ${notif.is_read ? 'text-white/80' : 'text-white'}`}>{notif.title}</h3>
                          <span className="text-xs text-white/40">{formatTime(notif.created_at)}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{notif.message}</p>
                        {notif.link && (
                          <a 
                            href={notif.link}
                            className="inline-flex items-center gap-1 text-xs text-[#E57A44] mt-3 hover:underline"
                          >
                            View details <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
            
            {!loading && notifications.length === 0 && (
              <div className="text-center py-20 text-white/40 border border-dashed border-white/5 rounded-2xl">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>No new notifications.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
