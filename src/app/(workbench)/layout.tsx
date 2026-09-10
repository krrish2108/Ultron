"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { 
  Plus, Search, FileText, 
  Settings, ChevronLeft, ChevronRight, Terminal, Network, ShieldCheck, Activity, BrainCircuit,
  FolderOpen, Box, Code2, SlidersHorizontal, Pin
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export default function WorkbenchLayout({ children }: { children: React.ReactNode }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const [comingSoon, setComingSoon] = useState<string | null>(null);

  const recentSessions = useAppStore(state => state.sessions);

  const documents = [
    { id: "d1", title: "syslog_export.txt", type: "log" },
    { id: "d2", title: "architecture_v2.pdf", type: "pdf" },
  ];

  const connectTransparencyWS = useAppStore(state => state.connectTransparencyWS);
  const terminalLogs = useAppStore(state => state.transparency.agentTrace);
  const routingLogic = useAppStore(state => state.transparency.routingLogic);
  const networkStatus = useAppStore(state => state.transparency.networkStatus);

  useEffect(() => {
    connectTransparencyWS();
  }, [connectTransparencyWS]);

  const renderStatusDot = (status: string) => {
    switch (status) {
      case "done": return <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />;
      case "active": return <div className="w-2 h-2 rounded-full bg-[#00f0ff] shadow-[0_0_8px_rgba(0,240,255,0.8)] animate-pulse" />;
      case "progress": return <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />;
      default: return null;
    }
  };

  return (
    <div className="h-screen w-full bg-[#030303] flex overflow-hidden text-white font-sans relative">
      
      {/* Global Animated Grid Background */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00f0ff]/5 rounded-full blur-[120px]" 
        />
      </div>

      {/* LEFT SIDEBAR */}
      <AnimatePresence initial={false}>
        {leftOpen ? (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            className="h-full bg-black/40 backdrop-blur-2xl border-r border-white/10 flex flex-col shrink-0 overflow-hidden relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-4 flex items-center justify-between">
              <Link href="/home" className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-md overflow-hidden flex items-center justify-center border border-white/10 group-hover:border-[#00f0ff]/50 transition-colors">
                  <Image src="/logo.jpeg" alt="Logo" width={32} height={32} className="w-full h-full object-cover" />
                </div>
                <span className="font-extrabold tracking-widest text-sm">ULTRON</span>
              </Link>
              <button onClick={() => setLeftOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Top Navigation Links */}
            <div className="px-3 pb-2 space-y-0.5 mt-2">
              <Link href="/home" className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group text-white/80 hover:text-white">
                <Plus className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium">New Task</span>
              </Link>
              
              <Link href="/enclaves" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group mt-1 text-white/80 hover:text-white">
                <FolderOpen className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium transition-colors">Enclaves</span>
              </Link>
              
              <Link href="/assets" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group text-white/80 hover:text-white">
                <Box className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium transition-colors">Assets</span>
              </Link>

              <button onClick={() => setComingSoon("Source")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group">
                <Code2 className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Source</span>
              </button>

              <button onClick={() => setComingSoon("Customize")} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 transition-all group">
                <SlidersHorizontal className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">Customize</span>
              </button>
            </div>

            {/* Pinned Enclaves */}
            <div className="px-3 py-4">
              <div className="flex items-center justify-between px-3 text-white/40 hover:text-white transition-colors group cursor-pointer mb-2">
                <h3 className="text-xs font-semibold">Pinned Enclaves</h3>
                <Plus className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="px-3 py-2 text-xs text-white/30 flex items-center gap-2">
                <Pin className="w-3 h-3" /> Pin enclaves to keep them here
              </div>
            </div>

            {/* Search and Sessions */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 no-scrollbar">
              
              <div className="flex items-center justify-between px-4 mt-2 mb-2 text-white/40 hover:text-white transition-colors group cursor-pointer">
                <h3 className="text-xs font-semibold">Tasks and logs</h3>
                <Search className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Recent Sessions */}
              <div className="mb-6">
                <h3 className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Today</h3>
                <div className="space-y-0.5 px-1">
                  {recentSessions.filter(s => s.time === "Today").map(session => (
                    <Link key={session.id} href={`/chat/${session.id}`} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#00f0ff]/10 hover:shadow-[inset_2px_0_0_#00f0ff] transition-all group">
                      {renderStatusDot(session.status)}
                      <span className="text-xs text-white/70 truncate group-hover:text-white group-hover:translate-x-1 transition-transform">{session.title}</span>
                    </Link>
                  ))}
                </div>
                
                <h3 className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider mt-4 mb-2">Yesterday</h3>
                <div className="space-y-0.5 px-1">
                  {recentSessions.filter(s => s.time === "Yesterday").map(session => (
                    <Link key={session.id} href={`/chat/${session.id}`} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#00f0ff]/10 hover:shadow-[inset_2px_0_0_#00f0ff] transition-all group">
                      {renderStatusDot(session.status)}
                      <span className="text-xs text-white/70 truncate group-hover:text-white group-hover:translate-x-1 transition-transform">{session.title}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <h3 className="px-3 text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2 flex items-center">
                  <FileText className="w-3 h-3 mr-1" /> Ingested Documents
                </h3>
                <div className="space-y-0.5 px-1">
                  {documents.map(doc => (
                    <button key={doc.id} className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-all group text-left">
                      <FileText className="w-3 h-3 text-white/30 group-hover:text-[#3b82f6] shrink-0 transition-colors" />
                      <span className="text-xs text-white/50 truncate group-hover:text-white/90 group-hover:translate-x-1 transition-transform">{doc.title}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 space-y-4 shrink-0 bg-black/20">
              {/* Egress Pill */}
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md px-3 py-2 flex items-center justify-between shadow-[0_0_15px_rgba(16,185,129,0.1)] relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
                <div className="flex items-center gap-2 relative z-10">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-bold text-emerald-400 tracking-wider">EGRESS</span>
                </div>
                <span className="text-xs font-mono text-emerald-300 font-bold relative z-10">0 KB</span>
              </div>
              
              {/* User Bar */}
              <div className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-blue-900 border border-black flex items-center justify-center font-bold text-sm shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                    KP
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm text-white">Krish P</div>
                    <div className="text-[10px] text-white/40">krish@company.local</div>
                  </div>
                </div>
                <Settings className="w-4 h-4 text-white/30 group-hover:text-[#00f0ff] transition-colors shrink-0" />
              </div>
            </div>
          </motion.aside>
        ) : (
        <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 72, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            className="h-full bg-black/40 backdrop-blur-2xl border-r border-white/10 flex flex-col items-center py-4 shrink-0 relative z-10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]"
          >
            <button onClick={() => setLeftOpen(true)} className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center border border-white/20 hover:border-[#00f0ff] hover:shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all mb-8 group">
              <Image src="/logo.jpeg" alt="Logo" width={40} height={40} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </button>
            <Link href="/home" className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 hover:shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center mb-6 transition-all group">
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            </Link>
            <div className="flex-1" />
            <button className="w-10 h-10 flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 rounded-xl transition-all">
              <Settings className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CENTER MAIN */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-0 bg-transparent">
        {children}
      </main>

      {/* RIGHT TRANSPARENCY PANEL */}
      <AnimatePresence initial={false}>
        {rightOpen ? (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 300, damping: 30 }}
            className="h-full bg-black/40 backdrop-blur-2xl border-l border-white/10 flex flex-col shrink-0 overflow-hidden relative z-10 shadow-[-4px_0_24px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="p-5 flex items-center justify-between border-b border-white/10 bg-black/20">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#00f0ff]" />
                <span className="text-xs font-bold uppercase tracking-wider text-white/70">System Transparency</span>
              </div>
              <button onClick={() => setRightOpen(false)} className="text-white/40 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8 no-scrollbar">
              
              {/* Agent Trace */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-[#00f0ff] uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5" /> Agent Trace
                </h3>
                <div className="bg-black/60 border border-white/10 rounded-xl p-4 font-mono text-[10px] leading-relaxed text-white/60 h-48 overflow-y-auto no-scrollbar shadow-inner relative">
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(0,240,255,0.05)_50%,transparent_100%)] bg-[length:100%_4px] animate-[scan_2s_linear_infinite] pointer-events-none opacity-50" />
                  {terminalLogs.map((log, idx) => {
                    let colorClass = "text-white/60";
                    if (log.includes("[PLAN]")) colorClass = "text-[#00f0ff]";
                    if (log.includes("Intent classified")) colorClass = "text-emerald-400";
                    if (log.includes("[ACT]")) colorClass = "text-[#3b82f6]";
                    if (log.includes("[OBSERVE]")) colorClass = "text-amber-400";
                    return <motion.div initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={idx} className={colorClass}>{log}</motion.div>;
                  })}
                  <div className="text-[#00f0ff] mt-2 animate-pulse">_</div>
                </div>
              </div>

              {/* Routing Decision */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-[#3b82f6] uppercase tracking-widest flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5" /> Auto-Routing Logic
                </h3>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 space-y-3 hover:border-white/20 hover:bg-white/5 transition-all">
                  {routingLogic ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/60">Task Type</span>
                        <span className="text-xs font-bold text-[#00f0ff]">{routingLogic.taskType}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/60">Selected Model</span>
                        <span className="text-xs font-mono text-black font-bold bg-[#3b82f6] px-2 py-0.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.5)]">{routingLogic.selectedModel}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t border-white/10">
                        <span className="text-xs text-white/50 leading-relaxed block">
                          Reasoning: {routingLogic.reasoning}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-white/40 italic text-center py-2">Waiting for task...</div>
                  )}
                </div>
              </div>

              {/* Network Status */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <Network className="w-3.5 h-3.5" /> Live Network
                </h3>
                <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex items-center gap-5 hover:border-emerald-500/30 transition-colors relative overflow-hidden group">
                  <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-[spin_3s_linear_infinite] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] relative z-10">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tighter drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">0</div>
                    <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-bold mt-1">Outbound Conn.</div>
                  </div>
                </div>
              </div>

            </div>
          </motion.aside>
        ) : (
          <div className="absolute top-4 right-4 z-50">
            <button onClick={() => setRightOpen(true)} className="w-10 h-10 rounded-xl bg-black/50 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/60 hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] group">
              <Activity className="w-5 h-5 group-hover:animate-pulse" />
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* COMING SOON MODAL */}
      <AnimatePresence>
        {comingSoon && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setComingSoon(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/10 to-transparent opacity-50" />
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 relative z-10">
                <BrainCircuit className="w-8 h-8 text-[#00f0ff]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 relative z-10">{comingSoon} Module</h2>
              <p className="text-white/50 text-sm mb-8 relative z-10">
                The {comingSoon.toLowerCase()} capabilities are currently in active development. This feature will be deployed in a future over-the-air update.
              </p>
              <button 
                onClick={() => setComingSoon(null)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all rounded-xl text-sm font-bold text-white relative z-10"
              >
                Acknowledge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
