"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { ArrowRight, TrendingUp, AlertCircle, Briefcase, Zap, RefreshCw } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { http } from "@/services/http";
import { useSession } from "next-auth/react";

const COLORS = ['#E57A44', '#f1a882', '#333333', '#888888'];

export default function InsightsPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // By default hits the backend endpoint and fetches db-cached LLM insights
      const res = await http.getInsights();
      if (!res.error) {
        setData(res);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await http.generateInsights();
      if (!res.error) {
        setData(res);
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  if (loading || (!data && generating)) {
    return (
      <div className="flex h-screen bg-[#0A0A0A] text-white">
        <AppSidebar userName={session?.user?.name || "User"} />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-white/50 flex flex-col items-center">
            <Zap className="w-8 h-8 animate-pulse text-[#E57A44] mb-4" />
            <p>Analyzing market data and skill gaps...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-white">
      <div className="sticky top-0 h-screen shrink-0">
        <AppSidebar userName={session?.user?.name || "User"} />
      </div>
      
      <main className="flex-1 p-12">
        <div className="max-w-6xl mx-auto space-y-12 pb-20">
          
          <header className="flex justify-between items-end mb-4 border-b border-white/10 pb-6">
            <div>
              <h1 className="text-4xl font-serif tracking-tight mb-2">Career Insights</h1>
              <p className="text-xl text-white/60">Data-driven analysis of your market value and growth opportunities.</p>
            </div>
            <button 
              onClick={handleGenerate}
              disabled={generating}
              className={`flex items-center gap-2 px-4 py-2 bg-[#E57A44] text-white font-medium rounded-lg hover:bg-[#E57A44]/90 transition-colors ${generating ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <RefreshCw className={`w-5 h-5 ${generating ? "animate-spin" : ""}`} /> 
              {generating ? "Scanning Market..." : "Initialize AI Agent"}
            </button>
          </header>

          {!data && !loading && (
            <div className="p-12 text-center text-white/50 border border-white/10 rounded-2xl bg-[#141414]">
              <p className="mb-4">No insights exist for your profile yet.</p>
              <button onClick={handleGenerate} className="px-6 py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg">
                Run First Analysis
              </button>
            </div>
          )}

          {data && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. Skill -> Salary Impact */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#E57A44]" /> Salary Impact by Skill</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.salary_impact} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={true} vertical={false} />
                    <XAxis type="number" stroke="#666" />
                    <YAxis dataKey="skill" type="category" stroke="#888" width={100} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333' }} />
                    <Bar dataKey="percent" fill="#E57A44" radius={[0, 4, 4, 0]} name="Increase %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* 2. Hiring Demand Trends */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-6">Market Demand</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.hiring_demand} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {data.hiring_demand.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1f1f1f', borderColor: '#333' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {data.hiring_demand.map((d: any, i: number) => (
                  <span key={i} className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10">
                    <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                    {d.skill}
                  </span>
                ))}
              </div>
            </motion.div>

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 7. Learning Priority (ROI) */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Top Learning Priorities</h2>
              <div className="space-y-4">
                {data.learning_priority.map((p: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-[#E57A44]">{p.skill}</span>
                      <span className="text-xs px-2 py-1 bg-[#E57A44]/20 text-[#E57A44] rounded-md">ROI: {p.roi}/100</span>
                    </div>
                    <p className="text-sm text-white/60">{p.reason}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* 3. Role Opportunities & Transitions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-lg font-medium mb-6 flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-400" /> Target Roles</h2>
              <div className="space-y-4">
                {data.role_opportunities.map((r: any, i: number) => (
                  <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white/40">{r.current}</span>
                      <ArrowRight className="w-4 h-4 text-white/20" />
                      <span className="font-medium text-white">{r.role}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-md ${
                      r.transition_difficulty === 'Low' ? 'bg-green-500/20 text-green-400' :
                      r.transition_difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {r.transition_difficulty} Effort
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 5. Skill Gap Analysis */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm text-white/40 uppercase tracking-wider mb-4">Critical Skill Gaps</h2>
              <ul className="space-y-3 text-sm">
                {data.skill_gap.map((s: any, i: number) => (
                  <li key={i} className="flex justify-between items-center pb-2 border-b border-white/5 last:border-0">
                    <span className="text-white/80">{s.skill}</span>
                    {s.status === 'Missing' ? (
                      <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Missing</span>
                    ) : (
                      <span className="text-green-400">Met</span>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* 4. Market Insights */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm text-white/40 uppercase tracking-wider mb-4">Top Hiring Tech</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {data.market_insights.top_companies.map((c: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-white/10 rounded text-xs text-white/80">{c}</span>
                ))}
              </div>
              <p className="text-xs text-[#E57A44] italic">"{data.market_insights.trends[0]}"</p>
            </motion.div>

            {/* 6. Emerging Roles */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-[#141414] border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm text-white/40 uppercase tracking-wider mb-4">Emerging Roles</h2>
              <ul className="space-y-3">
                {data.emerging_roles.map((r: any, i: number) => (
                  <li key={i} className="text-sm">
                    <div className="font-medium text-white/90">{r.role}</div>
                    <div className="text-xs text-white/40 mt-1">Growth: <span className="text-green-400">{r.growth_rate}</span></div>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          </>
          )}

        </div>
      </main>
    </div>
  );
}
