"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Wrench, Plus, Search, Shield, Zap, Activity, Cpu, Check, 
  Trash2, Play, Terminal, Sliders, X, CheckCircle2, ChevronRight,
  Flame, Lock, RefreshCw, Layers
} from "lucide-react";
import { useAppStore, AgentSkill } from "@/store/useAppStore";

export function AgentSkillsStudio() {
  const skills = useAppStore(state => state.skills);
  const toggleSkill = useAppStore(state => state.toggleSkill);
  const addSkill = useAppStore(state => state.addSkill);
  const deleteSkill = useAppStore(state => state.deleteSkill);

  const [activeDomain, setActiveDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [testingSkill, setTestingSkill] = useState<AgentSkill | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any | null>(null);

  // Create Skill Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState<AgentSkill["domain"]>("scada");
  const [newDesc, setNewDesc] = useState("");
  const [newKeywords, setNewKeywords] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newConnectedTool, setNewConnectedTool] = useState("Local Industrial MQTT Bus (mqtt_query_vibration)");
  const [newIsolation, setNewIsolation] = useState<AgentSkill["isolationLevel"]>("L3-Air-Gap");
  const [newSampleInput, setNewSampleInput] = useState('{"target_metric": "pressure_psi", "threshold": 250}');
  const [newSampleOutput, setNewSampleOutput] = useState('{"status": "ALERT", "recommendation": "Emergency Trip"}');

  const activeSkillsCount = skills.filter(s => s.enabled).length;
  const meanLatency = skills.length > 0 
    ? Math.round(skills.reduce((acc, s) => acc + s.latencyMs, 0) / skills.length) 
    : 12;

  const filteredSkills = skills.filter(skill => {
    const matchesDomain = activeDomain === "all" || skill.domain === activeDomain;
    const matchesSearch = !searchQuery || 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.triggerKeywords.some(k => k.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDomain && matchesSearch;
  });

  const handleCreateSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newInstructions.trim()) return;

    const keywords = newKeywords
      .split(",")
      .map(k => k.trim().toLowerCase())
      .filter(Boolean);

    const created: AgentSkill = {
      id: `skill-custom-${Date.now()}`,
      name: newName.trim(),
      domain: newDomain,
      description: newDesc.trim() || "Custom autonomous operator skill.",
      triggerKeywords: keywords.length > 0 ? keywords : ["custom", "task"],
      latencyMs: Math.floor(Math.random() * 15) + 8,
      isolationLevel: newIsolation,
      enabled: true,
      isBuiltIn: false,
      connectedTool: newConnectedTool,
      promptInstructions: newInstructions.trim(),
      sampleInput: newSampleInput,
      sampleOutput: newSampleOutput
    };

    addSkill(created);
    setIsCreateOpen(false);
    // Reset fields
    setNewName("");
    setNewDesc("");
    setNewKeywords("");
    setNewInstructions("");
  };

  const handleRunSimulation = (skill: AgentSkill) => {
    setTestingSkill(skill);
    setSimulating(true);
    setSimulationResult(null);

    setTimeout(() => {
      setSimulating(false);
      try {
        const parsedOutput = JSON.parse(skill.sampleOutput || "{}");
        setSimulationResult({
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: skill.latencyMs,
          executionId: `EXEC-AIRGAP-${Math.floor(Math.random() * 90000 + 10000)}`,
          skill: skill.name,
          input: JSON.parse(skill.sampleInput || "{}"),
          output: parsedOutput,
          reasoningTrace: [
            `> [Supervisor] Intent classified as "${skill.domain}" (Confidence: 0.994)`,
            `> [Enclave IPC] Bound to isolation boundary: ${skill.isolationLevel}`,
            `> [Tool Hook] Dispatching parameters to ${skill.connectedTool || "Local Kernel Sandbox"}`,
            `> [Zero-Egress Audit] 0 bytes leaked to public WAN. Cryptographic payload validated.`
          ]
        });
      } catch {
        setSimulationResult({
          timestamp: new Date().toLocaleTimeString(),
          latencyMs: skill.latencyMs,
          skill: skill.name,
          rawOutput: skill.sampleOutput || "Execution completed successfully.",
          reasoningTrace: [
            `> [Supervisor] Skill executed with standard return code 0`
          ]
        });
      }
    }, 850);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground tracking-wide">
              Autonomous Agent Skills Studio
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
              CONFIDENTIAL REASONING KERNEL
            </span>
          </div>
          <p className="text-xs text-muted-foreground/80 max-w-xl leading-relaxed">
            Equip Ultron agents with deterministic industrial reasoning procedures, SOP logic chains, and automated diagnostic workflows executed entirely in zero-egress enclaves.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Custom Skill</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>ACTIVE SKILLS</span>
            <Activity className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {activeSkillsCount} <span className="text-xs font-normal text-muted-foreground">/ {skills.length}</span>
          </div>
          <span className="text-[10px] text-green-400 font-mono mt-0.5">● Ready in Supervisor</span>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>MEAN LATENCY</span>
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {meanLatency} <span className="text-xs font-normal text-muted-foreground">ms</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">Deterministic IPC</span>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>AIR-GAP BOUNDARY</span>
            <Shield className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            L3 <span className="text-xs font-normal text-muted-foreground">Strict</span>
          </div>
          <span className="text-[10px] text-primary font-mono mt-0.5">100% Zero-Egress</span>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>TOOL HOOKS</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {skills.filter(s => s.connectedTool).length} <span className="text-xs font-normal text-muted-foreground">Linked</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">SCADA & MCP Bridges</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-accent/30 border border-border/60 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: "All Skills" },
              { id: "scada", label: "SCADA & Bus" },
              { id: "security", label: "Cybersecurity" },
              { id: "control", label: "Control Systems" },
              { id: "custom", label: "Custom" }
            ] as const
          ).map(tab => {
            const count = tab.id === "all" ? skills.length : skills.filter(s => s.domain === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDomain(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeDomain === tab.id
                    ? "bg-primary text-black font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeDomain === tab.id ? "bg-black/20 text-black font-bold" : "bg-white/10 text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skill name or keywords..."
            className="w-full bg-accent/30 border border-border/60 focus:border-primary/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSkills.map(skill => (
          <div
            key={skill.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between bg-card/80 ${
              skill.enabled 
                ? "border-border/80 hover:border-primary/50 shadow-sm" 
                : "border-border/40 opacity-70 hover:opacity-90"
            }`}
          >
            <div>
              {/* Header: Title + Domain Badge + Switch */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-foreground tracking-wide">
                      {skill.name}
                    </h3>
                    {skill.isBuiltIn ? (
                      <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                        Core
                      </span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        Custom
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground capitalize">
                    Domain: {skill.domain}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSkill(skill.id)}
                    className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                      skill.enabled ? "bg-primary" : "bg-muted"
                    }`}
                    title={skill.enabled ? "Disable skill" : "Enable skill"}
                  >
                    <div className={`w-3 h-3 rounded-full bg-background transition-transform ${
                      skill.enabled ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                {skill.description}
              </p>

              {/* Trigger Keywords */}
              <div className="flex flex-wrap items-center gap-1 mb-3">
                {skill.triggerKeywords.map((kw, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/40 border border-border/60 text-muted-foreground"
                  >
                    #{kw}
                  </span>
                ))}
              </div>

              {/* Micro specs */}
              <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-[10px] font-mono text-muted-foreground mb-3">
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Latency</span>
                  <span className="text-foreground font-semibold">{skill.latencyMs} ms</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Isolation</span>
                  <span className="text-primary truncate block font-semibold">{skill.isolationLevel}</span>
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Status</span>
                  <span className={`font-semibold ${skill.enabled ? "text-green-400" : "text-zinc-500"}`}>
                    {skill.enabled ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>

              {/* Connected Tool indicator */}
              {skill.connectedTool && (
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400/80 mb-3 truncate">
                  <Zap className="w-3 h-3 shrink-0" />
                  <span className="truncate">Hook: {skill.connectedTool}</span>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => handleRunSimulation(skill)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-medium transition-colors"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Test Skill</span>
              </button>

              {!skill.isBuiltIn && (
                <button
                  onClick={() => deleteSkill(skill.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Delete custom skill"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredSkills.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border/80 bg-background/30 text-center">
            <Search className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No agent skills found</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              {searchQuery ? `No skills match "${searchQuery}".` : "No skills configured in this domain."}
            </p>
            <div className="flex gap-2">
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="px-3 py-1.5 rounded-lg bg-accent text-xs hover:bg-accent/80 text-foreground transition-colors">
                  Clear Search
                </button>
              )}
              <button onClick={() => setIsCreateOpen(true)} className="px-3 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-colors">
                + Create Custom Skill
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Result Modal */}
      <AnimatePresence>
        {testingSkill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-primary fill-current" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Skill Simulation Sandbox</h3>
                    <span className="text-[10px] font-mono text-muted-foreground">{testingSkill.name}</span>
                  </div>
                </div>
                <button onClick={() => setTestingSkill(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {simulating ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs font-mono text-muted-foreground">Running air-gap simulation in local enclave...</p>
                </div>
              ) : simulationResult ? (
                <div className="space-y-3 text-xs font-mono">
                  <div className="flex items-center justify-between p-2 rounded bg-black/50 border border-border/50 text-[11px]">
                    <span className="text-muted-foreground">Execution ID: <span className="text-primary font-bold">{simulationResult.executionId}</span></span>
                    <span className="text-green-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> NOMINAL ({simulationResult.latencyMs} ms)
                    </span>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground/70 mb-1">Reasoning Trace:</div>
                    <div className="p-2.5 rounded bg-black/70 border border-border/50 space-y-1 text-green-400/90 text-[11px] leading-relaxed custom-scrollbar max-h-32 overflow-y-auto">
                      {simulationResult.reasoningTrace.map((line: string, i: number) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase text-muted-foreground/70 mb-1">Structured Skill Output:</div>
                    <pre className="p-2.5 rounded bg-black/80 border border-primary/30 text-cyan-300 text-[11px] overflow-x-auto custom-scrollbar">
                      {JSON.stringify(simulationResult.output || simulationResult.rawOutput, null, 2)}
                    </pre>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleRunSimulation(testingSkill)}
                      className="px-3 py-1.5 rounded-lg bg-accent hover:bg-accent/80 text-foreground text-xs font-medium transition-colors mr-2"
                    >
                      Re-run Test
                    </button>
                    <button
                      onClick={() => setTestingSkill(null)}
                      className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create Skill Modal */}
      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Create Autonomous Agent Skill</h3>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateSkill} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Skill Name</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Exotherm Reactor Runaway Watcher"
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-3 py-2 text-foreground outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1">Domain Classification</label>
                    <select
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value as any)}
                      style={{ colorScheme: "dark" }}
                      className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-2.5 py-2 text-foreground outline-none text-xs cursor-pointer"
                    >
                      <option value="scada" className="bg-[#0d1527] text-slate-100 py-1.5">SCADA & Telemetry</option>
                      <option value="security" className="bg-[#0d1527] text-slate-100 py-1.5">Cybersecurity & Egress</option>
                      <option value="control" className="bg-[#0d1527] text-slate-100 py-1.5">Control Systems (PID/PLC)</option>
                      <option value="analytics" className="bg-[#0d1527] text-slate-100 py-1.5">Industrial Analytics</option>
                      <option value="custom" className="bg-[#0d1527] text-slate-100 py-1.5">General Custom</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1">Isolation Boundary</label>
                    <select
                      value={newIsolation}
                      onChange={(e) => setNewIsolation(e.target.value as any)}
                      style={{ colorScheme: "dark" }}
                      className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-2.5 py-2 text-foreground outline-none text-xs cursor-pointer"
                    >
                      <option value="L3-Air-Gap" className="bg-[#0d1527] text-slate-100 py-1.5">L3 - Strict Air-Gap</option>
                      <option value="L2-VPC" className="bg-[#0d1527] text-slate-100 py-1.5">L2 - Enclave VPC</option>
                      <option value="L1-Loopback" className="bg-[#0d1527] text-slate-100 py-1.5">L1 - Local Loopback</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Trigger Keywords (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="e.g. exotherm, reactor, temperature, gradient, runaway"
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-3 py-2 text-foreground outline-none text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Prompt Instructions / Reasoning Logic</label>
                  <textarea
                    required
                    rows={3}
                    value={newInstructions}
                    onChange={(e) => setNewInstructions(e.target.value)}
                    placeholder="e.g. When temperature rise rate exceeds 2.5 C/min, compute cooling jacket valve angle and recommend automated nitrogen purge."
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg p-2.5 text-foreground outline-none text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Connected MCP Tool Hook</label>
                  <select
                    value={newConnectedTool}
                    onChange={(e) => setNewConnectedTool(e.target.value)}
                    style={{ colorScheme: "dark" }}
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-2.5 py-2 text-foreground outline-none text-xs cursor-pointer"
                  >
                    <option value="Local Industrial MQTT Bus (mqtt_query_vibration)" className="bg-[#0d1527] text-slate-100 py-1.5">Local Industrial MQTT Bus (mqtt_query_vibration)</option>
                    <option value="Siemens S7 / OPC-UA Gateway (opcua_read_pressure)" className="bg-[#0d1527] text-slate-100 py-1.5">Siemens S7 / OPC-UA Gateway (opcua_read_pressure)</option>
                    <option value="TimescaleDB Historian (timescaledb_query_telemetry)" className="bg-[#0d1527] text-slate-100 py-1.5">TimescaleDB Historian (timescaledb_query_telemetry)</option>
                    <option value="Modbus-TCP Coupler (scada_get_fault_codes)" className="bg-[#0d1527] text-slate-100 py-1.5">Modbus-TCP Coupler (scada_get_fault_codes)</option>
                    <option value="Ultron Local MCP Tools Bridge" className="bg-[#0d1527] text-slate-100 py-1.5">Ultron Local MCP Tools Bridge</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground hover:text-foreground text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 shadow-md"
                  >
                    Register Skill
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
