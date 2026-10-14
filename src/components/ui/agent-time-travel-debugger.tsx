"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  FastForward, 
  Clock, 
  Layers, 
  Database, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Sliders,
  Maximize2,
  Minimize2
} from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export interface ReplayStep {
  stepIndex: number;
  label: string;
  agentName: string;
  nodeId: string;
  timestampMs: number;
  memorySnapshot: {
    intent: string;
    action: string;
    registersOrPayload: Record<string, any> | string;
    egressBytes: number;
    vramMb: number;
    status: "active" | "done" | "verified";
  };
  terminalSnippet: string[];
}

export interface ReplayScenario {
  id: string;
  name: string;
  description: string;
  steps: ReplayStep[];
}

export const REPLAY_SCENARIOS: ReplayScenario[] = [
  {
    id: "telemetry-anomaly",
    name: "Industrial Telemetry Intervention",
    description: "Audits a multi-agent flow querying physical hydraulic transducers and applying deterministic regex safety clamps.",
    steps: [
      {
        stepIndex: 0,
        label: "Ingest & Classify",
        agentName: "Supervisor Router",
        nodeId: "super",
        timestampMs: 0,
        memorySnapshot: {
          intent: "mcp_tool",
          action: "Classifying natural language telemetry request via Router LLM",
          registersOrPayload: {
            user_prompt: "Check pressure on Line A and clamp safety limits",
            classified_intent: "mcp_tool",
            confidence_score: 0.98,
            model: "qwen2.5-coder:7b"
          },
          egressBytes: 0,
          vramMb: 840,
          status: "active"
        },
        terminalSnippet: [
          "> [PLAN] Analyzing intent from user prompt...",
          "  Intent classified: mcp_tool (reason: Industrial sensor telemetry request)",
          "  Host Firewall: WAN Egress Denied (Zero-Egress Mode)"
        ]
      },
      {
        stepIndex: 1,
        label: "Formulate Regex & Schema",
        agentName: "Validator Studio",
        nodeId: "rag",
        timestampMs: 145,
        memorySnapshot: {
          intent: "compile_rules",
          action: "Synthesizing PCRE regex and Draft-07 JSON schema validator",
          registersOrPayload: {
            compiled_regex: "/(?:pressure|p)?:?\\s*([0-9.]+)\\s*PSI/gmi",
            enclave_schema: "FluidPressureTelemetry",
            max_bound_psi: 5000.0,
            boundary_tokens: "\\b enforced"
          },
          egressBytes: 0,
          vramMb: 910,
          status: "done"
        },
        terminalSnippet: [
          "> [PLAN] Formulating PCRE regex rule for hydraulic stream...",
          "  Compiled pattern: /(?:pressure|p)?:?\\s*([0-9.]+)\\s*PSI/gmi",
          "  Validation Schema locked: FluidPressureTelemetry (Draft-07)"
        ]
      },
      {
        stepIndex: 2,
        label: "Run in Enclave Gateway",
        agentName: "Siemens S7 / MCP Gateway",
        nodeId: "mcp",
        timestampMs: 420,
        memorySnapshot: {
          intent: "execute_mcp",
          action: "Executing opcua_read_pressure(line='Line A') via loopback IPC",
          registersOrPayload: {
            transducer: "LINE A INLET",
            calibrated_psi: 3120.5,
            unit: "PSI",
            nominal_range: "0 - 4500 PSI",
            trip_limit_psi: 5000.0,
            protocol: "OPC-UA Binary"
          },
          egressBytes: 0,
          vramMb: 1120,
          status: "active"
        },
        terminalSnippet: [
          "> [EXEC] Handing off to Industrial MCP Agent...",
          "  Target: Siemens S7 / OPC-UA Gateway (opc.tcp://127.0.0.1:4840)",
          "  Invoked tool opcua_read_pressure(line='Line A')",
          "  Readout: 3120.5 PSI (NOMINAL) in 2.4ms"
        ]
      },
      {
        stepIndex: 3,
        label: "Deterministic Verification",
        agentName: "Output Auditor",
        nodeId: "doc",
        timestampMs: 780,
        memorySnapshot: {
          intent: "verify_output",
          action: "Validating telemetry output against mathematical schema before user delivery",
          registersOrPayload: {
            reading_psi: 3120.5,
            schema_conformance: "100% VALID",
            safety_trip_triggered: false,
            cryptographic_hash: "sha256:7b91...4a20",
            quarantine_status: "PASSED_NOMINAL"
          },
          egressBytes: 0,
          vramMb: 980,
          status: "verified"
        },
        terminalSnippet: [
          "> [AUDIT] Running deterministic validation check against schema...",
          "  Result: 3120.5 PSI conforms strictly to Draft-07 specifications.",
          "  Audit complete: 0 egress bytes leaked outside air-gapped enclave.",
          "> [DONE] Formatted final response delivered to user."
        ]
      }
    ]
  },
  {
    id: "code-sandbox",
    name: "Enclave Code Sandbox Run",
    description: "Audits execution of diagnostic micro-scripts inside a kernel-isolated POSIX sandbox.",
    steps: [
      {
        stepIndex: 0,
        label: "Ingest Diagnostic Script",
        agentName: "Supervisor Router",
        nodeId: "super",
        timestampMs: 0,
        memorySnapshot: {
          intent: "sandbox_exec",
          action: "Receiving diagnostic payload for execution",
          registersOrPayload: { script: "calibrate_transducers.py", target_env: "microvm-01" },
          egressBytes: 0,
          vramMb: 750,
          status: "active"
        },
        terminalSnippet: [
          "> [INGEST] Received executable payload: calibrate_transducers.py",
          "  Enclave target: MicroVM #01 (Air-Gapped)"
        ]
      },
      {
        stepIndex: 1,
        label: "Static AST & Security Scan",
        agentName: "Security Gatekeeper",
        nodeId: "rag",
        timestampMs: 120,
        memorySnapshot: {
          intent: "ast_audit",
          action: "Scanning AST for unauthorized network or socket syscalls",
          registersOrPayload: { syscalls_checked: 84, blocked_calls: 0, risk_score: "ZERO" },
          egressBytes: 0,
          vramMb: 820,
          status: "done"
        },
        terminalSnippet: [
          "> [SEC] AST static analysis underway...",
          "  Syscalls verified: No WAN network sockets detected. Execution authorized."
        ]
      },
      {
        stepIndex: 2,
        label: "Execute in Air-Gap MicroVM",
        agentName: "Enclave Executor",
        nodeId: "mcp",
        timestampMs: 390,
        memorySnapshot: {
          intent: "sandbox_run",
          action: "Spawning isolated process in ephemeral microvm container",
          registersOrPayload: { exit_code: 0, stdout: "Calibrated 16 channels successfully.", execution_time_ms: 14.2 },
          egressBytes: 0,
          vramMb: 1250,
          status: "active"
        },
        terminalSnippet: [
          "> [SANDBOX] Booting ephemeral microvm environment...",
          "  Executed calibrate_transducers.py (Exit code: 0, Time: 14.2ms)"
        ]
      },
      {
        stepIndex: 3,
        label: "Verify & Sign Artifacts",
        agentName: "Cryptographic Signer",
        nodeId: "doc",
        timestampMs: 640,
        memorySnapshot: {
          intent: "sign_output",
          action: "Signing diagnostic artifact with enclave hardware key",
          registersOrPayload: { signature: "ed25519:e4a1...99bc", archive_path: "/vault/calibrated.bin" },
          egressBytes: 0,
          vramMb: 890,
          status: "verified"
        },
        terminalSnippet: [
          "> [SIGN] Enclave hardware key signature attached.",
          "  Artifact persisted to Air-Gapped POSIX Vault."
        ]
      }
    ]
  }
];

export interface AgentTimeTravelDebuggerProps {
  onStepChange?: (step: ReplayStep) => void;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

let persistedScenarioId = "telemetry-anomaly";
let persistedStepIndex = 3;

export function AgentTimeTravelDebugger({ 
  onStepChange, 
  className = "",
  isFullscreen = false,
  onToggleFullscreen
}: AgentTimeTravelDebuggerProps) {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>(() => persistedScenarioId);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(() => persistedStepIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(true);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    persistedScenarioId = selectedScenarioId;
  }, [selectedScenarioId]);

  useEffect(() => {
    persistedStepIndex = currentStepIndex;
  }, [currentStepIndex]);

  // Active scenario
  const activeScenario = useMemo(() => {
    return REPLAY_SCENARIOS.find(s => s.id === selectedScenarioId) || REPLAY_SCENARIOS[0];
  }, [selectedScenarioId]);

  const currentStep = useMemo(() => {
    return activeScenario.steps[currentStepIndex] || activeScenario.steps[0];
  }, [activeScenario, currentStepIndex]);

  // Sync step change with parent and store
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStep);
    }

    // Update graph nodes in global store so the active node turns glowing cyan!
    const { updateGraphNode } = useAppStore.getState();
    activeScenario.steps.forEach((step, idx) => {
      let status = "pending";
      let isTimeTravelActive = false;
      if (idx < currentStepIndex) {
        status = "done";
      } else if (idx === currentStepIndex) {
        status = "active";
        isTimeTravelActive = true;
      }
      updateGraphNode(step.nodeId, {
        status,
        isTimeTravelActive,
        detail: step.label
      });
    });
  }, [currentStep, currentStepIndex, activeScenario, onStepChange]);

  // Auto-play interval
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= activeScenario.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1400 / playbackSpeed);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, playbackSpeed, activeScenario]);

  const handleStepJump = (idx: number) => {
    setIsPlaying(false);
    setIsLiveMode(false);
    setCurrentStepIndex(idx);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setIsLiveMode(false);
    if (currentStepIndex < activeScenario.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    setIsLiveMode(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setIsLiveMode(false);
    setCurrentStepIndex(0);
  };

  const handleReturnToLive = () => {
    setIsPlaying(false);
    setIsLiveMode(true);
    setCurrentStepIndex(activeScenario.steps.length - 1);
  };

  return (
    <div className={`space-y-3 font-sans ${className}`}>
      {/* Top Scrubber Control Deck */}
      <div className="p-3 rounded-xl bg-background/80 border border-border shadow-sm space-y-3">
        {/* Header Strip with Live Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Time-Travel Replay
            </span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
              isLiveMode 
                ? "bg-green-500/20 text-green-400 border border-green-500/30" 
                : "bg-primary/20 text-primary border border-primary/40 animate-pulse"
            }`}>
              {isLiveMode ? "LIVE STREAM" : `REPLAY STEP ${currentStepIndex + 1}/${activeScenario.steps.length}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isLiveMode && (
              <button
                onClick={handleReturnToLive}
                className="text-[10px] text-primary hover:underline font-mono"
              >
                Return to Live ↗
              </button>
            )}

            {onToggleFullscreen && (
              <button
                onClick={onToggleFullscreen}
                className={`px-2 py-0.5 rounded-md border transition-all flex items-center gap-1.5 text-[10px] font-mono cursor-pointer ${
                  isFullscreen 
                    ? "bg-[#00f0ff]/15 border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25 shadow-[0_0_8px_rgba(0,240,255,0.2)]" 
                    : "bg-accent/40 border-border/60 text-muted-foreground hover:text-foreground hover:border-[#00f0ff]/40"
                }`}
                title={isFullscreen ? "Minimize back to sidebar (Esc)" : "Expand to Fullscreen Studio"}
              >
                {isFullscreen ? <Minimize2 className="w-3 h-3 text-[#00f0ff]" /> : <Maximize2 className="w-3 h-3 text-muted-foreground" />}
                <span className="hidden sm:inline font-semibold">{isFullscreen ? "Minimize" : "Full Screen"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Scenario Selector Dropdown */}
        <div className="flex items-center justify-between text-xs gap-2">
          <span className="text-[10px] font-mono uppercase text-muted-foreground/70 shrink-0">Workflow:</span>
          <select
            value={selectedScenarioId}
            onChange={(e) => {
              setSelectedScenarioId(e.target.value);
              setCurrentStepIndex(3);
              setIsLiveMode(true);
            }}
            className="w-full bg-accent/40 border border-border/80 focus:border-primary rounded-lg px-2 py-1 text-xs text-foreground outline-none font-mono"
          >
            {REPLAY_SCENARIOS.map(sc => (
              <option key={sc.id} value={sc.id}>{sc.name}</option>
            ))}
          </select>
        </div>

        {/* Time Scrubber Slider Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-primary font-bold">
              Step {currentStepIndex + 1}: {currentStep.label}
            </span>
            <span className="text-muted-foreground">
              +{currentStep.timestampMs} ms
            </span>
          </div>

          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={activeScenario.steps.length - 1}
              step={1}
              value={currentStepIndex}
              onChange={(e) => handleStepJump(Number(e.target.value))}
              className="w-full accent-primary h-2 bg-accent/60 rounded-lg cursor-pointer"
            />
          </div>

          {/* Stepper Node Badges */}
          <div className="grid grid-cols-4 gap-1 pt-1">
            {activeScenario.steps.map((st, i) => (
              <button
                key={i}
                onClick={() => handleStepJump(i)}
                className={`py-1 rounded text-[9px] font-mono transition-all truncate text-center ${
                  i === currentStepIndex
                    ? "bg-primary text-black font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                    : i < currentStepIndex
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                    : "bg-accent/40 text-muted-foreground/70 border border-border/40"
                }`}
                title={st.label}
              >
                {i + 1}. {st.label.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls Toolbar */}
        <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
          {/* Step Back & Forward */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Reset to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleStepBackward}
              disabled={currentStepIndex === 0}
              className="p-1 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground"
              title="Step Backward"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsLiveMode(false);
                setIsPlaying(!isPlaying);
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
              title={isPlaying ? "Pause replay" : "Auto-replay steps"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? "Pause" : "Play"}</span>
            </button>
            <button
              onClick={handleStepForward}
              disabled={currentStepIndex === activeScenario.steps.length - 1}
              className="p-1 rounded hover:bg-accent disabled:opacity-30 text-muted-foreground hover:text-foreground"
              title="Step Forward"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Toggle */}
          <button
            onClick={() => setPlaybackSpeed(prev => (prev === 1 ? 2 : 1))}
            className="px-2 py-0.5 rounded bg-accent/60 border border-border/60 text-[10px] font-mono text-muted-foreground hover:text-foreground"
            title="Toggle playback speed"
          >
            {playbackSpeed}x Speed
          </button>
        </div>
      </div>

      {/* Snapshot Memory Inspector Drawer */}
      <div className="p-3 rounded-xl bg-black/60 border border-primary/30 font-mono text-xs space-y-2.5 shadow-md">
        <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
          <div className="flex items-center gap-1.5 text-primary font-bold text-[11px]">
            <Cpu className="w-3.5 h-3.5" />
            <span>EXACT MEMORY SNAPSHOT (+{currentStep.timestampMs}ms)</span>
          </div>
          <span className="text-[10px] text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/30">
            WAN: {currentStep.memorySnapshot.egressBytes}B
          </span>
        </div>

        <div className="space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex justify-between">
            <span className="text-muted-foreground/60">ACTIVE AGENT:</span>
            <span className="text-foreground font-semibold">{currentStep.agentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground/60">MICRO-ACTION:</span>
            <span className="text-primary truncate max-w-[170px]" title={currentStep.memorySnapshot.action}>
              {currentStep.memorySnapshot.action}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground/60">VRAM FOOTPRINT:</span>
            <span className="text-yellow-400 font-bold">{currentStep.memorySnapshot.vramMb} MB</span>
          </div>
        </div>

        {/* Registers / Variables JSON */}
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/50 block">State Variables & Registers:</span>
          <pre className={`p-2 rounded bg-black/70 border border-border/50 text-[10px] text-green-400 overflow-x-auto ${isFullscreen ? "max-h-56" : "max-h-28"} leading-relaxed custom-scrollbar`}>
            <code>{JSON.stringify(currentStep.memorySnapshot.registersOrPayload, null, 2)}</code>
          </pre>
        </div>

        {/* Step Trace Snippet */}
        {currentStep.terminalSnippet && currentStep.terminalSnippet.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-border/40">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1 font-mono font-bold">
              <Terminal className="w-3 h-3 text-primary" /> Step Trace Log:
            </span>
            <div className={`p-2 rounded bg-black/80 border border-border/50 text-[10px] font-mono text-cyan-300/90 space-y-0.5 leading-relaxed overflow-x-auto ${isFullscreen ? "max-h-40" : "max-h-24"} custom-scrollbar`}>
              {currentStep.terminalSnippet.map((line, li) => (
                <div key={li}>{line}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
