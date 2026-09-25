"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Plus, ShieldCheck, Activity, Users, Settings2, MoreVertical, Terminal, X, Trash2, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const TelemetryDashboard = ({ isActive }: { isActive: boolean }) => {
  const [cpu, setCpu] = useState(isActive ? 45 : 0);
  const [vram, setVram] = useState(isActive ? 60 : 0);
  const [tokens, setTokens] = useState(isActive ? 124 : 0);

  useEffect(() => {
    if (!isActive) {
      setCpu(0); setVram(0); setTokens(0);
      return;
    }
    const interval = setInterval(() => {
      setCpu(prev => Math.min(100, Math.max(10, prev + (Math.random() * 30 - 15))));
      setVram(prev => Math.min(100, Math.max(20, prev + (Math.random() * 15 - 7.5))));
      setTokens(prev => Math.max(0, prev + (Math.floor(Math.random() * 60 - 30))));
    }, 2000);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="mb-4 p-3 bg-black/40 border border-white/5 rounded-xl space-y-3 relative z-10">
      <div>
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">
          <span>Compute Load</span>
          <span className={isActive ? "text-[#00f0ff]" : "text-white/30"}>{Math.round(cpu)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-[#00f0ff] to-blue-500" 
            animate={{ width: `${cpu}%` }} 
            transition={{ type: "spring", bounce: 0, duration: 2 }}
          />
        </div>
      </div>
      <div>
        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest text-white/50 mb-1">
          <span>VRAM Allocation</span>
          <span className={isActive ? "text-purple-400" : "text-white/30"}>{Math.round(vram)}%</span>
        </div>
        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
            animate={{ width: `${vram}%` }} 
            transition={{ type: "spring", bounce: 0, duration: 2 }}
          />
        </div>
      </div>
      <div className="flex justify-between items-center pt-2 mt-1 border-t border-white/5">
         <span className="text-[10px] uppercase font-bold tracking-widest text-white/50">Throughput</span>
         <div className="flex items-center gap-1.5">
           <Activity className={`w-3 h-3 ${isActive ? 'text-emerald-400 animate-pulse' : 'text-white/30'}`} />
           <span className={`text-xs font-mono font-bold ${isActive ? 'text-emerald-400' : 'text-white/30'}`}>{isActive ? `${tokens} t/s` : '0 t/s'}</span>
         </div>
      </div>
    </div>
  );
};

export default function EnclavesPage() {
  const enclaves = useAppStore((state) => state.enclaves);
  const addEnclave = useAppStore((state) => state.addEnclave);
  const removeEnclave = useAppStore((state) => state.removeEnclave);
  const updateEnclaveType = useAppStore((state) => state.updateEnclaveType);
  const workloadTypes = useAppStore((state) => state.workloadTypes);
  const addWorkloadType = useAppStore((state) => state.addWorkloadType);
  const removeWorkloadType = useAppStore((state) => state.removeWorkloadType);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEnclaveName, setNewEnclaveName] = useState("");
  const [newEnclaveType, setNewEnclaveType] = useState("");

  const [activeMenuIndex, setActiveMenuIndex] = useState<number | null>(null);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [showTypeManager, setShowTypeManager] = useState(false);

  const handleCreate = () => {
    if (!newEnclaveName.trim()) return;
    addEnclave({
      name: newEnclaveName,
      status: "active",
      nodes: 1,
      type: newEnclaveType || workloadTypes[0] || "Unassigned",
      lastActive: "Just now"
    });
    setShowCreateModal(false);
    setNewEnclaveName("");
    setNewEnclaveType(workloadTypes[0] || "");
  };

  const handleAddType = () => {
    if (newTypeInput.trim()) {
      addWorkloadType(newTypeInput.trim());
      setNewEnclaveType(newTypeInput.trim());
      setNewTypeInput("");
    }
  };

  const handleDelete = (index: number) => {
    removeEnclave(index);
    setActiveMenuIndex(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full relative z-10 overflow-y-auto custom-scrollbar p-8" onClick={() => setActiveMenuIndex(null)}>
      
      {/* Header */}
      <div className="flex items-end justify-between mb-10 max-w-6xl mx-auto w-full">
        <div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#00f0ff]/10 flex items-center justify-center border border-[#00f0ff]/20">
              <FolderOpen className="w-5 h-5 text-[#00f0ff]" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Enclaves</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/50 text-sm max-w-md">
            Manage your isolated compute environments and local intelligence projects.
          </motion.p>
        </div>

        <motion.button 
          onClick={() => setShowCreateModal(true)}
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[#00f0ff] to-blue-600 text-black px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 transition-all"
        >
          <Plus className="w-4 h-4" /> Create Enclave
        </motion.button>
      </div>

      {/* Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
        {enclaves.map((enclave, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 + i * 0.05 }}
            key={i} 
            className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-[#00f0ff]/30 transition-all group cursor-pointer hover:shadow-[0_0_30px_rgba(0,240,255,0.05)] relative overflow-hidden"
          >
            {/* Hover Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#00f0ff]/0 via-transparent to-[#00f0ff]/0 group-hover:from-[#00f0ff]/5 transition-colors duration-500" />
            
            <div className="flex items-start justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${enclave.status === 'active' ? 'bg-[#00f0ff] shadow-[0_0_10px_#00f0ff] animate-pulse' : enclave.status === 'processing' ? 'bg-amber-500' : 'bg-white/20'}`} />
                <h3 className="font-bold text-lg text-white/90 group-hover:text-white transition-colors">{enclave.name}</h3>
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => { e.stopPropagation(); setActiveMenuIndex(activeMenuIndex === i ? null : i); }}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {activeMenuIndex === i && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl py-1 z-50 overflow-hidden"
                      onClick={e => e.stopPropagation()}
                    >
                      <button className="w-full text-left px-4 py-2.5 text-xs font-bold text-white/80 hover:bg-white/5 transition-colors flex items-center gap-2">
                        <Settings2 className="w-4 h-4 text-white/50" /> Configure Node
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button 
                        onClick={() => handleDelete(i)}
                        className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Terminate Enclave
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <Terminal className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Nodes</span>
                </div>
                <div className="text-lg font-mono font-bold text-white/90">{enclave.nodes}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5 relative">
                <div className="flex items-center gap-2 text-white/40 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Type</span>
                </div>
                {enclave.type === "Requires Update" ? (
                  <div className="mt-1 flex flex-col gap-2">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {enclave.type}</span>
                    <select 
                      onChange={(e) => updateEnclaveType(i, e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-red-500/30 rounded px-2 py-1 text-xs text-white outline-none appearance-none cursor-pointer hover:border-red-500/60"
                      defaultValue=""
                      onClick={e => e.stopPropagation()}
                    >
                      <option value="" disabled>Select New Type...</option>
                      {workloadTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-white/80 mt-1">{enclave.type}</div>
                )}
              </div>
            </div>

            <TelemetryDashboard isActive={enclave.status === 'active' || enclave.status === 'processing'} />

            <div className="flex items-center justify-between text-xs relative z-10 pt-4 border-t border-white/5">
              <div className="flex items-center gap-3 text-white/40">
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> {enclave.lastActive}</span>
              </div>
              <div className="flex -space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-900 border border-black flex items-center justify-center text-[8px] font-bold">JD</div>
                <div className="w-6 h-6 rounded-full bg-purple-900 border border-black flex items-center justify-center text-[8px] font-bold">SM</div>
                <div className="w-6 h-6 rounded-full bg-white/10 border border-black flex items-center justify-center text-[10px]"><Users className="w-3 h-3" /></div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-md w-full relative shadow-[0_0_50px_rgba(0,240,255,0.1)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center border border-[#00f0ff]/20">
                    <FolderOpen className="w-4 h-4 text-[#00f0ff]" />
                  </div>
                  New Enclave
                </h2>
                <button onClick={() => setShowCreateModal(false)} className="text-white/30 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">Enclave Designation</label>
                  <input 
                    type="text" 
                    value={newEnclaveName}
                    onChange={e => setNewEnclaveName(e.target.value)}
                    placeholder="e.g. Operation Deep Thought"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f0ff]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <label className="block text-xs font-bold text-white/50 uppercase tracking-wider">Primary Workload Type</label>
                    <button onClick={() => setShowTypeManager(!showTypeManager)} className="text-[10px] text-[#00f0ff] hover:underline font-bold uppercase">
                      {showTypeManager ? "Done" : "Manage Types"}
                    </button>
                  </div>
                  
                  {showTypeManager ? (
                    <div className="space-y-2 bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newTypeInput}
                          onChange={e => setNewTypeInput(e.target.value)}
                          placeholder="New type name..."
                          className="flex-1 bg-[#0a0a0a] border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00f0ff]/50"
                        />
                        <button onClick={handleAddType} className="bg-[#00f0ff]/10 text-[#00f0ff] px-3 py-2 rounded-lg text-xs font-bold hover:bg-[#00f0ff]/20"><Plus className="w-4 h-4"/></button>
                      </div>
                      <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                        {workloadTypes.map(t => (
                          <div key={t} className="flex justify-between items-center bg-black/40 rounded px-3 py-1.5 border border-white/5">
                            <span className="text-xs text-white/80">{t}</span>
                            <button onClick={() => {
                              removeWorkloadType(t);
                              if (newEnclaveType === t) setNewEnclaveType(workloadTypes[0] || "");
                            }} className="text-red-400 hover:text-red-300"><Trash2 className="w-3 h-3"/></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <select 
                      value={newEnclaveType || (workloadTypes[0] || "")}
                      onChange={e => setNewEnclaveType(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00f0ff]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all appearance-none"
                    >
                      {workloadTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      {workloadTypes.length === 0 && <option value="" disabled>No types available</option>}
                    </select>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all rounded-xl text-sm font-bold text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreate}
                  className="flex-1 py-3 bg-gradient-to-r from-[#00f0ff] to-blue-600 text-black rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
                >
                  Initialize
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
