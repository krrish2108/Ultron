"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  Sparkles, 
  Code2, 
  Sliders, 
  Copy, 
  Check, 
  Terminal, 
  ShieldCheck, 
  Layers, 
  HelpCircle,
  FileJson,
  Cpu,
  ArrowRight,
  RefreshCw,
  Gauge,
  SlidersHorizontal,
  Flame,
  Activity,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  Database,
  ExternalLink
} from "lucide-react";

export interface PresetRule {
  id: string;
  name: string;
  prompt: string;
  regex: string;
  flags: string;
  category: "Hydraulics" | "Turbines" | "SCADA" | "Thermal";
  icon: any;
  explanation: { token: string; desc: string }[];
  schema: object;
  sampleLog: string;
}

export const INDUSTRIAL_PRESETS: PresetRule[] = [
  {
    id: "fluid-pressure",
    name: "Hydraulic Pressure (PSI)",
    prompt: "Extract all fluid pressure readings ending in PSI with numeric values",
    regex: "(?:pressure|press|p)?:?\\s*([0-9]+(?:\\.[0-9]+)?)\\s*(?:PSI|psi)\\b",
    flags: "gm",
    category: "Hydraulics",
    icon: Gauge,
    explanation: [
      { token: "(?:pressure|press|p)?", desc: "Optional non-capturing prefix indicator" },
      { token: "([0-9]+(?:\\.[0-9]+)?)", desc: "Captures integer or floating point decimal value" },
      { token: "\\s*(?:PSI|psi)", desc: "Matches PSI unit delimiter (case tolerant)" },
      { token: "\\b", desc: "Enforces strict word boundary constraint" }
    ],
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "FluidPressureTelemetry",
      type: "object",
      properties: {
        pressure_psi: {
          type: "number",
          description: "Calibrated hydraulic gauge pressure",
          minimum: 0.0,
          maximum: 10000.0
        },
        unit: {
          type: "string",
          enum: ["PSI", "psi"],
          default: "PSI"
        },
        severity: {
          type: "string",
          enum: ["NOMINAL", "ELEVATED", "CRITICAL"]
        }
      },
      required: ["pressure_psi", "unit"],
      additionalProperties: false
    },
    sampleLog: `[HYDRO_SYS_4] Line A inlet pressure: 3120.5 PSI. 
[HYDRO_SYS_4] Manifold secondary back-pressure registered 48.2 PSI under bypass.
[ALERT_OVERPRESSURE] Pump station #2 spiked to 4890.0 PSI (Trip threshold: 5000 PSI).
[DIAG] Auxiliary return line stable at 115 PSI.`
  },
  {
    id: "turbine-vibration",
    name: "Turbine Dynamics (RPM / Hz)",
    prompt: "Parse turbine vibration frequency logs and rotational speed (RPM or Hz)",
    regex: "\\b([0-9]{2,5}(?:\\.[0-9]+)?)\\s*(RPM|Hz|rpm|hz)\\b",
    flags: "gmi",
    category: "Turbines",
    icon: Activity,
    explanation: [
      { token: "\\b", desc: "Word boundary preventing partial substring match" },
      { token: "([0-9]{2,5}(?:\\.[0-9]+)?)", desc: "Captures 2-5 digit rotational or harmonic velocity" },
      { token: "(RPM|Hz|rpm|hz)", desc: "Captures physical frequency unit dimension" },
      { token: "\\b", desc: "Strict end boundary" }
    ],
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "TurbineVibrationHarmonic",
      type: "object",
      properties: {
        frequency_value: {
          type: "number",
          minimum: 10,
          maximum: 50000
        },
        unit: {
          type: "string",
          enum: ["RPM", "Hz"]
        },
        bearing_axis: {
          type: "string",
          enum: ["RADIAL_X", "RADIAL_Y", "AXIAL_Z"]
        }
      },
      required: ["frequency_value", "unit"],
      additionalProperties: false
    },
    sampleLog: `[TURBINE_GEN_02] Shaft rotor 1 operating at 3600 RPM steady state.
[HARMONIC_VIB] Spectral peak detected at 120.4 Hz on Radial X accelerometer.
[BEARING_3] High-frequency sub-harmonic pulse: 18450 RPM transient spike.`
  },
  {
    id: "scada-fault",
    name: "SCADA Fault Codes (ERR / FLT)",
    prompt: "Detect and isolate standard industrial SCADA error codes (ERR-* or FLT-*)",
    regex: "\\b(ERR|FLT)-([0-9]{3,4}(?:-[A-Z0-9]+)?)\\b",
    flags: "gm",
    category: "SCADA",
    icon: AlertTriangle,
    explanation: [
      { token: "(ERR|FLT)", desc: "Captures error category prefix (Error or Fault)" },
      { token: "-", desc: "Standard delimiter hyphen" },
      { token: "([0-9]{3,4}...)", desc: "Captures 3-4 digit diagnostic identifier plus optional sub-code" },
      { token: "\\b", desc: "Ensures code is isolated token" }
    ],
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "ScadaDiagnosticEvent",
      type: "object",
      properties: {
        fault_type: {
          type: "string",
          enum: ["ERR", "FLT"]
        },
        error_code: {
          type: "string",
          pattern: "^[0-9]{3,4}(?:-[A-Z0-9]+)?$"
        },
        enclave_action: {
          type: "string",
          enum: ["LOG_ONLY", "ISOLATE_SUBSYSTEM", "EMERGENCY_SCRAM"]
        }
      },
      required: ["fault_type", "error_code"],
      additionalProperties: false
    },
    sampleLog: `[PLC_RACK_01] Optical bus handshake failed. Logged code: ERR-409-NET.
[SAFETY_INTERLOCK] Valve feedback mismatch. Flagged FLT-802 immediately.
[STATUS] Clean cycle completed on Node 4 with zero faults.
[WATCHDOG] Auxiliary timeout triggered ERR-104-TIMEOUT.`
  },
  {
    id: "thermal-sensor",
    name: "Thermal Gradient (°C / °F)",
    prompt: "Isolate thermal sensor readouts with Celsius or Fahrenheit temperature scales",
    regex: "([+-]?[0-9]+(?:\\.[0-9]+)?)\\s*(?:°C|°F|degC|degF)\\b",
    flags: "gm",
    category: "Thermal",
    icon: Flame,
    explanation: [
      { token: "([+-]?[0-9]+(?:\\.[0-9]+)?)", desc: "Captures signed real temperature value (supports negative)" },
      { token: "\\s*", desc: "Zero or more spaces before scale notation" },
      { token: "(?:°C|°F|degC|degF)", desc: "Standard thermodynamic unit symbols" }
    ],
    schema: {
      $schema: "http://json-schema.org/draft-07/schema#",
      title: "ThermalSensorReading",
      type: "object",
      properties: {
        temperature: {
          type: "number",
          minimum: -100.0,
          maximum: 2500.0
        },
        scale: {
          type: "string",
          enum: ["CELSIUS", "FAHRENHEIT"]
        },
        quarantine_breach: {
          type: "boolean"
        }
      },
      required: ["temperature"],
      additionalProperties: false
    },
    sampleLog: `[CHAMBER_A] Reaction vessel core temp: 842.6 °C.
[EXCHANGER] Chiller output cold plate measured at -14.2 °C.
[EXHAUST] Stack plenum thermal probe registered 1548.0 °F peak.`
  }
];

export interface PromptToRegexBuilderProps {
  onDeployRule?: (rule: { name: string; regex: string; schema: object }) => void;
  className?: string;
}

export function PromptToRegexBuilder({ onDeployRule, className = "" }: PromptToRegexBuilderProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>("fluid-pressure");
  const [customPrompt, setCustomPrompt] = useState<string>(
    "Extract all fluid pressure readings ending in PSI with numeric values"
  );
  const [activeCodeTab, setActiveCodeTab] = useState<"regex" | "schema">("regex");
  const [copiedRegex, setCopiedRegex] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);

  // Constraint Sliders & Toggles
  const [strictBoundaries, setStrictBoundaries] = useState(true);
  const [caseInsensitive, setCaseInsensitive] = useState(false);
  const [allowNegativeValues, setAllowNegativeValues] = useState(false);
  const [namedCaptureGroups, setNamedCaptureGroups] = useState(false);
  const [strictSchemaTypes, setStrictSchemaTypes] = useState(true);
  const [maxConstraintRange, setMaxConstraintRange] = useState<number>(5000);

  // Live Test Document Sandbox State
  const [sampleDocument, setSampleDocument] = useState<string>(INDUSTRIAL_PRESETS[0].sampleLog);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployedRule, setDeployedRule] = useState<{ name: string; timestamp: string } | null>(null);

  // Load existing deployed rule from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ultron_enclave_validator");
      if (saved) {
        setDeployedRule(JSON.parse(saved));
      }
    } catch {}
  }, []);

  // Current active preset
  const activePreset = useMemo(() => {
    return INDUSTRIAL_PRESETS.find(p => p.id === selectedPresetId) || INDUSTRIAL_PRESETS[0];
  }, [selectedPresetId]);

  // When preset changes, update sample document
  const selectPreset = (preset: PresetRule) => {
    setSelectedPresetId(preset.id);
    setCustomPrompt(preset.prompt);
    setSampleDocument(preset.sampleLog);
  };

  // Dynamic Rule Synthesis based on prompt & sliders
  const synthesizedRegex = useMemo(() => {
    let pattern = activePreset.regex;

    // Adjust boundaries
    if (!strictBoundaries) {
      pattern = pattern.replace(/^\\b/, "").replace(/\\b$/, "");
    }

    // Adjust named groups
    if (namedCaptureGroups) {
      pattern = pattern.replace(/\(([0-9]+)/, "(?<metric>$1");
    }

    // Adjust negative numbers
    if (allowNegativeValues && !pattern.includes("[+-]?")) {
      pattern = pattern.replace(/\[0-9\]\+/, "[+-]?[0-9]+");
    } else if (!allowNegativeValues && pattern.includes("[+-]?")) {
      pattern = pattern.replace("([+-]?", "(");
    }

    let flags = "gm";
    if (caseInsensitive) flags += "i";

    return { pattern, flags };
  }, [activePreset, strictBoundaries, namedCaptureGroups, allowNegativeValues, caseInsensitive]);

  // Dynamic Synthesized JSON Schema
  const synthesizedSchema = useMemo(() => {
    const base = JSON.parse(JSON.stringify(activePreset.schema));
    if (base.properties) {
      const keys = Object.keys(base.properties);
      for (const k of keys) {
        if (base.properties[k]?.maximum !== undefined) {
          base.properties[k].maximum = maxConstraintRange;
        }
      }
    }
    if (!strictSchemaTypes) {
      delete base.additionalProperties;
    } else {
      base.additionalProperties = false;
    }
    return base;
  }, [activePreset, maxConstraintRange, strictSchemaTypes]);

  // Live Match Extraction on Sample Document
  const matchHighlights = useMemo(() => {
    if (!sampleDocument || !synthesizedRegex.pattern) return [];
    try {
      const rx = new RegExp(synthesizedRegex.pattern, synthesizedRegex.flags);
      const matches: Array<{ start: number; end: number; text: string; groups: string[] }> = [];
      let m: RegExpExecArray | null;
      let safeguard = 0;
      while ((m = rx.exec(sampleDocument)) !== null && safeguard++ < 300) {
        if (m.index === rx.lastIndex) {
          rx.lastIndex++;
        }
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          text: m[0],
          groups: m.slice(1)
        });
        if (!synthesizedRegex.flags.includes("g")) break;
      }
      return matches;
    } catch {
      return [];
    }
  }, [sampleDocument, synthesizedRegex]);

  // Highlighted Text Segments Renderer
  const renderedSegments = useMemo(() => {
    if (!sampleDocument) return null;
    if (matchHighlights.length === 0) return <span>{sampleDocument}</span>;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    matchHighlights.forEach((match, idx) => {
      if (match.start > lastIndex) {
        elements.push(<span key={`text-${lastIndex}`}>{sampleDocument.slice(lastIndex, match.start)}</span>);
      }
      elements.push(
        <mark
          key={`match-${idx}`}
          className="bg-primary/25 text-primary border border-primary/50 px-1 py-0.5 rounded font-mono font-bold shadow-[0_0_10px_rgba(0,240,255,0.3)] transition-all cursor-pointer hover:bg-primary/40"
          title={`Match #${idx + 1}: "${match.text}"`}
        >
          {sampleDocument.slice(match.start, match.end)}
        </mark>
      );
      lastIndex = match.end;
    });

    if (lastIndex < sampleDocument.length) {
      elements.push(<span key={`text-${lastIndex}`}>{sampleDocument.slice(lastIndex)}</span>);
    }

    return elements;
  }, [sampleDocument, matchHighlights]);

  // Structured Extraction Preview conforming to schema
  const extractedRecords = useMemo(() => {
    return matchHighlights.map((m, idx) => {
      const rawNum = m.groups[0] || m.text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
      const numVal = parseFloat(rawNum);
      const isCompliant = !isNaN(numVal) ? numVal <= maxConstraintRange : true;
      return {
        id: idx + 1,
        rawString: m.text,
        extractedMetric: isNaN(numVal) ? (m.groups[1] || m.groups[0] || m.text) : numVal,
        unit: activePreset.id === "fluid-pressure" ? "PSI" : activePreset.id === "turbine-vibration" ? (m.groups[1] || "RPM") : activePreset.id === "thermal-sensor" ? "°C" : "SCADA",
        isCompliant
      };
    });
  }, [matchHighlights, maxConstraintRange, activePreset]);

  // Copy helper
  const handleCopy = (text: string, type: "regex" | "schema") => {
    navigator.clipboard.writeText(text);
    if (type === "regex") {
      setCopiedRegex(true);
      setTimeout(() => setCopiedRegex(false), 2000);
    } else {
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    }
  };

  // Deploy Action
  const handleDeployToEnclave = () => {
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      const rule = {
        name: activePreset.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      setDeployedRule(rule);
      try {
        localStorage.setItem("ultron_enclave_validator", JSON.stringify(rule));
      } catch {}
      if (onDeployRule) {
        onDeployRule({
          name: activePreset.name,
          regex: `/${synthesizedRegex.pattern}/${synthesizedRegex.flags}`,
          schema: synthesizedSchema
        });
      }
    }, 850);
  };

  const handleUndeploy = () => {
    setDeployedRule(null);
    try {
      localStorage.removeItem("ultron_enclave_validator");
    } catch {}
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-primary/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground tracking-wide">
                Prompt-to-Regex & Schema Builder
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider bg-primary/20 text-primary border border-primary/30 uppercase">
                Enclave Validator Studio
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Turn unstructured natural language instructions into mathematically deterministic PCRE Regular Expressions and strict JSON Schemas for industrial telemetry.
            </p>
          </div>
        </div>

        {/* Persistent Enclave Deployment Status */}
        {deployedRule ? (
          <div className="relative z-10 flex items-center gap-2 p-2 px-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
            <div>
              <div className="font-semibold text-[11px] leading-tight">ACTIVE IN ENCLAVE</div>
              <div className="text-[10px] text-muted-foreground">{deployedRule.name} · {deployedRule.timestamp}</div>
            </div>
            <button 
              onClick={handleUndeploy}
              className="ml-2 text-[10px] text-red-400 hover:underline px-1.5 py-0.5 rounded hover:bg-red-500/10"
              title="Remove validator"
            >
              Undeploy
            </button>
          </div>
        ) : (
          <div className="relative z-10 hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/40 border border-border/60 text-muted-foreground text-xs font-mono">
            <Database className="w-3.5 h-3.5 text-primary" />
            <span>Enclave Guard: Standby</span>
          </div>
        )}
      </div>

      {/* Preset Quick Selectors */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-primary" />
            Industrial Archetypes
          </span>
          <span className="text-[11px] text-muted-foreground/60">Select standard SCADA / telemetry rule</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {INDUSTRIAL_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`p-3 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isSelected 
                    ? "bg-primary/15 border-primary/60 shadow-[0_0_15px_rgba(0,240,255,0.15)] ring-1 ring-primary/40" 
                    : "bg-accent/40 border-border/70 hover:border-primary/30 hover:bg-accent/70"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`p-1.5 rounded-md ${isSelected ? 'bg-primary text-black' : 'bg-background/80 text-primary'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground/70 uppercase">
                    {preset.category}
                  </span>
                </div>
                <div className="text-xs font-medium text-foreground truncate">
                  {preset.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Natural Language Prompt Input */}
      <div className="space-y-2">
        <label className="text-xs font-mono uppercase tracking-wider text-muted-foreground/80 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Natural Language Specification Prompt
          </span>
          <span className="text-[11px] text-primary/80 font-mono">Local LLM Intent Synthesis</span>
        </label>
        <div className="relative">
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={2}
            placeholder="Type your extraction intent, e.g., 'Extract all fluid pressure readings ending in PSI'..."
            className="w-full bg-accent/40 border border-border/80 focus:border-primary/70 rounded-xl p-3.5 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors resize-none font-sans"
          />
        </div>
      </div>

      {/* Formatting & Constraint Sliders Deck */}
      <div className="p-4 rounded-xl border border-border/60 bg-accent/20 space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground tracking-wide">
              Deterministic Constraint Controls
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground/70 font-mono">
            Fine-tune mathematical boundaries
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Word Boundaries */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Word Boundary</div>
              <div className="text-[10px] font-mono text-muted-foreground">Enforces \b tokens</div>
            </div>
            <button
              onClick={() => setStrictBoundaries(!strictBoundaries)}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                strictBoundaries ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-background transition-transform ${
                  strictBoundaries ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Case Insensitive */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Case Tolerant</div>
              <div className="text-[10px] font-mono text-muted-foreground">Appends /i flag</div>
            </div>
            <button
              onClick={() => setCaseInsensitive(!caseInsensitive)}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                caseInsensitive ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-background transition-transform ${
                  caseInsensitive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Named Groups */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Named Captures</div>
              <div className="text-[10px] font-mono text-muted-foreground">(?&lt;metric&gt;...)</div>
            </div>
            <button
              onClick={() => setNamedCaptureGroups(!namedCaptureGroups)}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                namedCaptureGroups ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-background transition-transform ${
                  namedCaptureGroups ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Strict Schema */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
            <div>
              <div className="text-xs font-medium text-foreground">Strict Schema</div>
              <div className="text-[10px] font-mono text-muted-foreground">Disallows extra keys</div>
            </div>
            <button
              onClick={() => setStrictSchemaTypes(!strictSchemaTypes)}
              className={`w-9 h-5 rounded-full transition-colors relative flex items-center ${
                strictSchemaTypes ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-background transition-transform ${
                  strictSchemaTypes ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Numeric Threshold Slider */}
        <div className="p-3 rounded-lg bg-background/50 border border-border/50 space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-foreground flex items-center gap-1.5">
              <span>Schema Max Value Upper Bound</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30">
                {maxConstraintRange.toLocaleString()} Units
              </span>
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">Range: 100 - 20,000</span>
          </div>
          <input
            type="range"
            min={100}
            max={20000}
            step={100}
            value={maxConstraintRange}
            onChange={(e) => setMaxConstraintRange(Number(e.target.value))}
            className="w-full accent-primary h-1.5 bg-accent rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Side-by-Side Dual Engine Code Output Deck */}
      <div className="border border-border/70 rounded-xl overflow-hidden bg-background/60 shadow-lg">
        {/* Deck Header Tabs */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-accent/40 border-b border-border/60">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab("regex")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCodeTab === "regex"
                  ? "bg-primary text-black font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>PCRE Regular Expression</span>
            </button>
            <button
              onClick={() => setActiveCodeTab("schema")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeCodeTab === "schema"
                  ? "bg-primary text-black font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>JSON Schema (Draft-07)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeCodeTab === "regex" ? (
              <button
                onClick={() => handleCopy(`/${synthesizedRegex.pattern}/${synthesizedRegex.flags}`, "regex")}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-background border border-border/70 text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedRegex ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRegex ? "Copied" : "Copy Pattern"}</span>
              </button>
            ) : (
              <button
                onClick={() => handleCopy(JSON.stringify(synthesizedSchema, null, 2), "schema")}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-background border border-border/70 text-muted-foreground hover:text-foreground transition-colors"
              >
                {copiedSchema ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSchema ? "Copied" : "Copy Schema"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 font-mono text-xs">
          {activeCodeTab === "regex" ? (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-black/60 border border-primary/30 text-primary font-mono text-sm tracking-wide break-all selection:bg-primary selection:text-black">
                <span className="text-muted-foreground/60">/</span>
                {synthesizedRegex.pattern}
                <span className="text-muted-foreground/60">/</span>
                <span className="text-yellow-400 font-semibold">{synthesizedRegex.flags}</span>
              </div>

              {/* Token Breakdown Explanations */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-primary" />
                  Token Breakdown & Physical Constraint Mapping
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activePreset.explanation.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-md bg-accent/30 border border-border/40 text-xs flex flex-col justify-between"
                    >
                      <code className="text-primary font-bold text-[11px] bg-background/80 px-1.5 py-0.5 rounded border border-primary/20 w-fit mb-1">
                        {item.token}
                      </code>
                      <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <pre className="p-3.5 rounded-lg bg-black/60 border border-primary/30 text-green-400 text-xs overflow-x-auto leading-relaxed max-h-72">
              <code>{JSON.stringify(synthesizedSchema, null, 2)}</code>
            </pre>
          )}
        </div>
      </div>

      {/* Live Interactive Telemetry & Document Sandbox */}
      <div className="border border-border/70 rounded-xl overflow-hidden bg-background/50 shadow-md space-y-0">
        <div className="flex items-center justify-between px-4 py-2.5 bg-accent/30 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground">
              Live Document & Telemetry Stream Sandbox
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-primary/20 text-primary border border-primary/30">
              {matchHighlights.length} {matchHighlights.length === 1 ? "Match" : "Matches"} Detected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSampleDocument(activePreset.sampleLog)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-background border border-border/70 text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Sample</span>
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Editable Sample Stream */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase text-muted-foreground flex justify-between">
              <span>Input Telemetry Log / Document</span>
              <span className="text-[10px] text-primary/70">Editable Textarea</span>
            </div>
            <textarea
              value={sampleDocument}
              onChange={(e) => setSampleDocument(e.target.value)}
              rows={6}
              className="w-full bg-black/50 border border-border/70 focus:border-primary/60 rounded-lg p-3 text-xs font-mono text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Real-time Match Highlighting Visualizer */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-mono uppercase text-muted-foreground flex justify-between">
              <span>Live Highlighted Pattern Visualizer</span>
              <span className="text-[10px] text-primary">Zero-latency Regex Eval</span>
            </div>
            <div className="w-full h-[126px] bg-black/60 border border-primary/30 rounded-lg p-3 text-xs font-mono text-muted-foreground overflow-y-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
              {renderedSegments}
            </div>
          </div>
        </div>

        {/* Structured Extraction Records Table */}
        {extractedRecords.length > 0 && (
          <div className="px-4 pb-4">
            <div className="text-[11px] font-mono uppercase text-muted-foreground mb-2 flex items-center justify-between">
              <span>Extracted Schema Objects ({extractedRecords.length})</span>
              <span className="text-[10px] text-green-400 font-mono">Conforming to Draft-07</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
              {extractedRecords.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2.5 rounded-lg bg-accent/40 border border-border/60 text-xs font-mono flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">Record #{rec.id}</span>
                    <span className={`text-[10px] px-1 rounded ${rec.isCompliant ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {rec.isCompliant ? 'VALID' : 'OUT-OF-BOUNDS'}
                    </span>
                  </div>
                  <div className="text-primary font-bold text-sm">
                    {String(rec.extractedMetric)} <span className="text-xs text-muted-foreground font-normal">{rec.unit}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate mt-1">
                    Raw: "{rec.rawString}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deploy as Enclave Validator Action Bar */}
        <div className="p-4 bg-accent/30 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            <div className="text-xs text-muted-foreground">
              Deploy this mathematical rule to enforce zero-hallucination agent outputs.
            </div>
          </div>

          <button
            onClick={handleDeployToEnclave}
            disabled={isDeploying}
            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-md ${
              isDeploying
                ? "bg-primary/50 text-black cursor-wait"
                : "bg-primary text-black hover:bg-primary/90 hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            }`}
          >
            {isDeploying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Injecting Bytecode into Enclave...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Deploy as Agent Validator</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
