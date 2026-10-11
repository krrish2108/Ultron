"use client";

import React, { useState, useMemo } from "react";
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
  AlertTriangle
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

  // Current active preset
  const activePreset = useMemo(() => {
    return INDUSTRIAL_PRESETS.find(p => p.id === selectedPresetId) || INDUSTRIAL_PRESETS[0];
  }, [selectedPresetId]);

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

  const selectPreset = (preset: PresetRule) => {
    setSelectedPresetId(preset.id);
    setCustomPrompt(preset.prompt);
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
    </div>
  );
}
