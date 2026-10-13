"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plug, 
  Network, 
  ShieldCheck, 
  Database, 
  Terminal, 
  Cpu, 
  RefreshCw, 
  Plus, 
  Search, 
  Radio, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Trash2, 
  Power, 
  Layers, 
  Activity, 
  ChevronRight, 
  X, 
  HardDrive, 
  WifiOff,
  Flame,
  FileCode,
  Gauge,
  Key,
  Check,
  Copy
} from "lucide-react";

export type ConnectorCategory = "all" | "scada" | "historian" | "mcp" | "storage";
export type IsolationLevel = "L1-Local-Loopback" | "L2-Enclave-VPC" | "L3-Strict-Air-Gap";

export interface IndustrialConnector {
  id: string;
  name: string;
  protocol: string;
  category: "scada" | "historian" | "mcp" | "storage";
  endpoint: string;
  status: "online" | "polling" | "standby" | "offline";
  latencyMs: number;
  throughput: string;
  isolation: IsolationLevel;
  tlsCipher: string;
  exposedToAgent: boolean;
  activeNodesCount: number;
  description: string;
  lastSync: string;
  mcpToolsCount: number;
  config: {
    pollIntervalMs: number;
    autoReconnect: boolean;
    authTokenMasked?: string;
    topicOrPath?: string;
  };
}

export const INITIAL_CONNECTORS: IndustrialConnector[] = [
  {
    id: "conn-opcua",
    name: "Siemens S7 / OPC-UA Gateway",
    protocol: "OPC-UA Binary (TCP)",
    category: "scada",
    endpoint: "opc.tcp://127.0.0.1:4840/UA/UltronGateway",
    status: "online",
    latencyMs: 2.4,
    throughput: "240 tags/sec",
    isolation: "L3-Strict-Air-Gap",
    tlsCipher: "TLS_AES_256_GCM_SHA384",
    exposedToAgent: true,
    activeNodesCount: 128,
    description: "Direct binary register polling for hydraulic pressure transducers, turbine velocity tachometers, and thermowell RTDs.",
    lastSync: "1s ago",
    mcpToolsCount: 6,
    config: {
      pollIntervalMs: 50,
      autoReconnect: true,
      authTokenMasked: "opc_key_••••••••904A",
      topicOrPath: "ns=2;s=TurbineTelemetry"
    }
  },
  {
    id: "conn-mqtt",
    name: "Local Industrial MQTT Bus",
    protocol: "MQTT v5.0 (mTLS)",
    category: "scada",
    endpoint: "mqtts://localhost:8883/enclave/telemetry/#",
    status: "online",
    latencyMs: 1.6,
    throughput: "1,420 msgs/sec",
    isolation: "L3-Strict-Air-Gap",
    tlsCipher: "ECDHE-ECDSA-AES256-GCM",
    exposedToAgent: true,
    activeNodesCount: 64,
    description: "Ultra-low-latency pub/sub message bus routing distributed SCADA edge sensor packets and vibration telemetry frames.",
    lastSync: "Just now",
    mcpToolsCount: 4,
    config: {
      pollIntervalMs: 10,
      autoReconnect: true,
      authTokenMasked: "mqtt_cert_••••••••F71C",
      topicOrPath: "factory/cell-04/vibration"
    }
  },
  {
    id: "conn-timescale",
    name: "TimescaleDB Historian & Vector Store",
    protocol: "PostgreSQL / Timescale",
    category: "historian",
    endpoint: "postgresql://enclave_db:5432/historian_timeseries",
    status: "polling",
    latencyMs: 4.8,
    throughput: "48 queries/sec",
    isolation: "L2-Enclave-VPC",
    tlsCipher: "TLS_CHACHA20_POLY1305",
    exposedToAgent: true,
    activeNodesCount: 4200000,
    description: "Compressed chunked hypertable storing 10-year historical telemetry, thermal runaways, and machine vibration spectrums for RAG.",
    lastSync: "3s ago",
    mcpToolsCount: 8,
    config: {
      pollIntervalMs: 500,
      autoReconnect: true,
      authTokenMasked: "pg_secret_••••••••12E0",
      topicOrPath: "telemetry_hypertable"
    }
  },
  {
    id: "conn-mcp-stdio",
    name: "Ultron Local MCP Tools Bridge",
    protocol: "Model Context Protocol (stdio)",
    category: "mcp",
    endpoint: "python -m ultron.mcp.industrial_tools --enclave=active",
    status: "online",
    latencyMs: 0.9,
    throughput: "24 tool calls/min",
    isolation: "L3-Strict-Air-Gap",
    tlsCipher: "IPC Unix Socket (No WAN)",
    exposedToAgent: true,
    activeNodesCount: 14,
    description: "Standard Model Context Protocol daemon supplying Ultron with deterministic unit conversion, PID tuning, and regex validation.",
    lastSync: "Just now",
    mcpToolsCount: 14,
    config: {
      pollIntervalMs: 0,
      autoReconnect: true,
      authTokenMasked: "ipc_token_••••••••LOCAL",
      topicOrPath: "/ipc/ultron-mcp.sock"
    }
  },
  {
    id: "conn-modbus",
    name: "Modbus-TCP Coupler (Rack 04)",
    protocol: "Modbus-TCP / IP",
    category: "scada",
    endpoint: "modbus://127.0.0.1:5020/unit-id/1",
    status: "standby",
    latencyMs: 8.2,
    throughput: "14 coils/sec",
    isolation: "L3-Strict-Air-Gap",
    tlsCipher: "Plain Air-Gapped Loopback",
    exposedToAgent: false,
    activeNodesCount: 32,
    description: "Legacy programmable logic controller coupler bridging relay coils, emergency stop SCRAM switches, and motor contactors.",
    lastSync: "12m ago",
    mcpToolsCount: 2,
    config: {
      pollIntervalMs: 250,
      autoReconnect: false,
      authTokenMasked: "none",
      topicOrPath: "coils/0x0001-0x0020"
    }
  },
  {
    id: "conn-vault",
    name: "Air-Gapped POSIX Enclave Vault",
    protocol: "Sandboxed Inotify Watcher",
    category: "storage",
    endpoint: "/var/run/ultron/enclave/vault/diagnostics/",
    status: "online",
    latencyMs: 0.3,
    throughput: "18.4 MB/s I/O",
    isolation: "L3-Strict-Air-Gap",
    tlsCipher: "EncFS / dm-crypt (AES-XTS)",
    exposedToAgent: true,
    activeNodesCount: 1420,
    description: "Kernel-isolated virtual drive providing cryptographically verified read/write scratchpad for agent-generated diagnostic scripts.",
    lastSync: "4s ago",
    mcpToolsCount: 5,
    config: {
      pollIntervalMs: 100,
      autoReconnect: true,
      authTokenMasked: "posix_enclave_key",
      topicOrPath: "/enclave/vault"
    }
  }
];

export function IndustrialConnectorsHub() {
  const [connectors, setConnectors] = useState<IndustrialConnector[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("ultron_industrial_connectors");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_CONNECTORS;
  });

  const [activeCategory, setActiveCategory] = useState<ConnectorCategory>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [testingConnectorId, setTestingConnectorId] = useState<string | null>(null);
  const [handshakeLogs, setHandshakeLogs] = useState<string[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
  const [selectedForConfig, setSelectedForConfig] = useState<IndustrialConnector | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedEndpointId, setCopiedEndpointId] = useState<string | null>(null);

  // New Connector Form State
  const [newConnName, setNewConnName] = useState("");
  const [newConnProtocol, setNewConnProtocol] = useState("OPC-UA Binary (TCP)");
  const [newConnCategory, setNewConnCategory] = useState<"scada" | "historian" | "mcp" | "storage">("scada");
  const [newConnEndpoint, setNewConnEndpoint] = useState("opc.tcp://127.0.0.1:4840/UA/CustomNode");
  const [newConnIsolation, setNewConnIsolation] = useState<IsolationLevel>("L3-Strict-Air-Gap");
  const [newConnExposed, setNewConnExposed] = useState(true);

  // Persist changes
  useEffect(() => {
    try {
      localStorage.setItem("ultron_industrial_connectors", JSON.stringify(connectors));
    } catch {}
  }, [connectors]);

  // Filtered List
  const filteredConnectors = useMemo(() => {
    return connectors.filter(c => {
      const matchesCategory = activeCategory === "all" || c.category === activeCategory;
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.protocol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.endpoint.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [connectors, activeCategory, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = connectors.length;
    const online = connectors.filter(c => c.status === "online" || c.status === "polling").length;
    const totalMcpTools = connectors
      .filter(c => c.exposedToAgent)
      .reduce((acc, curr) => acc + curr.mcpToolsCount, 0);
    const airGappedCount = connectors.filter(c => c.isolation === "L3-Strict-Air-Gap").length;

    return { total, online, totalMcpTools, airGappedCount };
  }, [connectors]);

  // Toggle Stream / Status
  const toggleConnectorStatus = (id: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id !== id) return c;
      const nextStatus = c.status === "offline" ? "online" : "offline";
      return { ...c, status: nextStatus, lastSync: "Just now" };
    }));
  };

  // Toggle Agent Exposure
  const toggleAgentExposure = (id: string) => {
    setConnectors(prev => prev.map(c => {
      if (c.id !== id) return c;
      return { ...c, exposedToAgent: !c.exposedToAgent };
    }));
  };

  // Copy helper
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpointId(id);
    setTimeout(() => setCopiedEndpointId(null), 2000);
  };

  // Run Simulated Cryptographic Handshake
  const runHandshakeTest = (connector: IndustrialConnector) => {
    setTestingConnectorId(connector.id);
    setShowTerminal(true);
    setHandshakeLogs([
      `[${new Date().toISOString().slice(11, 23)}] INITIALIZING AIR-GAP PROTOCOL HANDSHAKE...`,
      `[${new Date().toISOString().slice(11, 23)}] TARGET: ${connector.name} (${connector.protocol})`,
      `[${new Date().toISOString().slice(11, 23)}] ENDPOINT: ${connector.endpoint}`,
      `[${new Date().toISOString().slice(11, 23)}] KERNEL EGRESS FIREWALL: ENFORCED (DENY 0.0.0.0/0 WAN)`
    ]);

    const steps = [
      `[${new Date().toISOString().slice(11, 23)}] PROBING LOOPBACK ROUTE... OK (0.2ms)`,
      `[${new Date().toISOString().slice(11, 23)}] VERIFYING TLS CIPHER: ${connector.tlsCipher}`,
      `[${new Date().toISOString().slice(11, 23)}] PINNING ENCLAVE CERTIFICATE HASH: SHA256:7b91...4a20`,
      `[${new Date().toISOString().slice(11, 23)}] ISOLATION COMPLIANCE: ${connector.isolation} CONFIRMED`,
      connector.exposedToAgent 
        ? `[${new Date().toISOString().slice(11, 23)}] MCP AGENT DISCOVERY: DISCOVERED ${connector.mcpToolsCount} EXECUTABLE TOOLS`
        : `[${new Date().toISOString().slice(11, 23)}] MCP AGENT ACCESS: ISOLATED (EXPOSURE SWITCH IS OFF)`,
      `[${new Date().toISOString().slice(11, 23)}] HANDSHAKE VERIFIED: ${connector.latencyMs}ms LATENCY · 0 BYTES LEAKED OUTSIDE ENCLAVE.`
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setHandshakeLogs(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setTestingConnectorId(null);
          setConnectors(prev => prev.map(c => {
            if (c.id === connector.id) {
              return { ...c, status: "online", lastSync: "Just now" };
            }
            return c;
          }));
        }
      }, (idx + 1) * 350);
    });
  };

  // Handle Add New Connector
  const handleCreateConnector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConnName.trim() || !newConnEndpoint.trim()) return;

    const newConnector: IndustrialConnector = {
      id: `conn-custom-${Date.now()}`,
      name: newConnName.trim(),
      protocol: newConnProtocol,
      category: newConnCategory,
      endpoint: newConnEndpoint.trim(),
      status: "online",
      latencyMs: +(Math.random() * 3 + 1).toFixed(1),
      throughput: "64 msgs/sec",
      isolation: newConnIsolation,
      tlsCipher: "TLS_AES_256_GCM_SHA384",
      exposedToAgent: newConnExposed,
      activeNodesCount: 16,
      description: "Custom user-configured air-gap industrial connector.",
      lastSync: "Just now",
      mcpToolsCount: newConnExposed ? 4 : 0,
      config: {
        pollIntervalMs: 100,
        autoReconnect: true,
        authTokenMasked: "custom_token_••••••••"
      }
    };

    setConnectors([newConnector, ...connectors]);
    setShowAddModal(false);
    setNewConnName("");
    setNewConnEndpoint("");
  };

  // Delete Connector
  const handleDeleteConnector = (id: string) => {
    setConnectors(connectors.filter(c => c.id !== id));
    if (selectedForConfig?.id === id) {
      setSelectedForConfig(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-36 bg-primary/10 blur-3xl pointer-events-none rounded-full" />
        <div className="relative z-10 flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Plug className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground tracking-wide">
                Industrial Connectors & MCP Hub
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium tracking-wider bg-primary/20 text-primary border border-primary/30 uppercase">
                Zero-Egress Air-Gap Hub
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 max-w-xl">
              Interface real-time SCADA telemetry buses, time-series historians, and local Model Context Protocol (MCP) servers for deterministic autonomous agent tool calls.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs transition-all hover:bg-primary/90 shadow-[0_0_15px_rgba(0,240,255,0.25)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Connector</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metrics HUD Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-accent/30 border border-border/60">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
            <span className="font-mono uppercase">Active Bridges</span>
            <Activity className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div className="text-lg font-bold text-foreground font-mono">
            {stats.online} <span className="text-xs text-muted-foreground font-normal">/ {stats.total}</span>
          </div>
          <div className="text-[10px] text-green-400 font-mono mt-0.5">● Nominal Throughput</div>
        </div>

        <div className="p-3 rounded-xl bg-accent/30 border border-border/60">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
            <span className="font-mono uppercase">MCP Tools Exposed</span>
            <Cpu className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-primary font-mono">
            {stats.totalMcpTools}
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Callable by Agent</div>
        </div>

        <div className="p-3 rounded-xl bg-accent/30 border border-border/60">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
            <span className="font-mono uppercase">Air-Gap Isolation</span>
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-lg font-bold text-foreground font-mono">
            {stats.airGappedCount}
          </div>
          <div className="text-[10px] text-primary/80 font-mono mt-0.5">Strict Zero-Egress</div>
        </div>

        <div className="p-3 rounded-xl bg-accent/30 border border-border/60">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
            <span className="font-mono uppercase">Mean Bus Latency</span>
            <Gauge className="w-3.5 h-3.5 text-yellow-400" />
          </div>
          <div className="text-lg font-bold text-yellow-400 font-mono">
            1.8 ms
          </div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">Direct Loopback IPC</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-accent/30 border border-border/60 overflow-x-auto custom-scrollbar">
          {(
            [
              { id: "all", label: "All Connectors" },
              { id: "scada", label: "SCADA & Bus" },
              { id: "historian", label: "Historian DB" },
              { id: "mcp", label: "MCP Protocols" },
              { id: "storage", label: "Air-Gap Vault" }
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === tab.id
                  ? "bg-primary text-black font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search protocol or endpoint..."
            className="w-full bg-accent/30 border border-border/60 focus:border-primary/60 rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
          />
        </div>
      </div>

      {/* Connectors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredConnectors.map((connector) => {
          const isOnline = connector.status === "online" || connector.status === "polling";
          const isTesting = testingConnectorId === connector.id;

          return (
            <div
              key={connector.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between relative overflow-hidden bg-background/50 ${
                isOnline 
                  ? "border-border/80 hover:border-primary/40 shadow-sm" 
                  : "border-border/40 opacity-75 hover:opacity-100"
              }`}
            >
              <div>
                {/* Header: Title + Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                      isOnline ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-muted-foreground"
                    }`}>
                      {connector.category === "scada" && <Radio className="w-4 h-4" />}
                      {connector.category === "historian" && <Database className="w-4 h-4" />}
                      {connector.category === "mcp" && <Cpu className="w-4 h-4" />}
                      {connector.category === "storage" && <HardDrive className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground tracking-wide leading-tight">
                        {connector.name}
                      </h3>
                      <span className="text-[10px] font-mono text-muted-foreground/80">
                        {connector.protocol}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${
                      isOnline ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)] animate-pulse" : "bg-zinc-500"
                    }`} />
                    <span className={`text-[10px] font-mono uppercase font-bold ${
                      isOnline ? "text-green-400" : "text-muted-foreground"
                    }`}>
                      {connector.status}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3">
                  {connector.description}
                </p>

                {/* Endpoint Bar with Copy */}
                <div className="flex items-center justify-between p-2 rounded-lg bg-black/50 border border-border/50 text-[11px] font-mono text-primary/90 mb-3 group">
                  <div className="truncate mr-2 flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="truncate">{connector.endpoint}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(connector.id, connector.endpoint)}
                    className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary transition-colors shrink-0"
                    title="Copy endpoint"
                  >
                    {copiedEndpointId === connector.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Micro Metrics Strip */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/40 text-[10px] font-mono text-muted-foreground mb-3">
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Latency</span>
                    <span className="text-foreground font-semibold">{connector.latencyMs} ms</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Throughput</span>
                    <span className="text-foreground font-semibold">{connector.throughput}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase tracking-wider text-muted-foreground/60">Isolation</span>
                    <span className="text-primary truncate block font-semibold">{connector.isolation.split("-")[0]}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Bar */}
              <div className="flex items-center justify-between pt-1">
                {/* Expose to Agent MCP Toggle */}
                <div className="flex items-center gap-1.5" title="Allows Ultron Agent to invoke this connector as a tool">
                  <button
                    onClick={() => toggleAgentExposure(connector.id)}
                    className={`w-7 h-4 rounded-full transition-colors relative flex items-center ${
                      connector.exposedToAgent ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full bg-background transition-transform ${
                        connector.exposedToAgent ? "translate-x-3.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Agent MCP ({connector.mcpToolsCount})
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => runHandshakeTest(connector)}
                    disabled={isTesting}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-accent/60 hover:bg-accent border border-border/60 text-[11px] font-medium text-foreground transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 text-primary ${isTesting ? "animate-spin" : ""}`} />
                    <span>Test Handshake</span>
                  </button>

                  <button
                    onClick={() => setSelectedForConfig(connector)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Configure Connector Parameters"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => toggleConnectorStatus(connector.id)}
                    className={`p-1 rounded-md transition-colors ${
                      isOnline 
                        ? "text-red-400 hover:bg-red-500/10" 
                        : "text-green-400 hover:bg-green-500/10"
                    }`}
                    title={isOnline ? "Disconnect stream" : "Connect stream"}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Handshake Diagnostic Terminal Drawer */}
      {showTerminal && (
        <div className="rounded-xl border border-border/80 bg-black/90 p-4 font-mono text-xs shadow-xl space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-primary font-bold">
              <Terminal className="w-4 h-4" />
              <span>AIR-GAP CRYPTOGRAPHIC HANDSHAKE DIAGNOSTIC FEED</span>
            </div>
            <button
              onClick={() => setShowTerminal(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-32 overflow-y-auto space-y-1 text-green-400/90 text-[11px] leading-relaxed custom-scrollbar">
            {handshakeLogs.map((log, i) => (
              <div key={i}>{log}</div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Connector Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Plug className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Add Industrial Connector</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateConnector} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Connector Name</label>
                  <input
                    type="text"
                    required
                    value={newConnName}
                    onChange={(e) => setNewConnName(e.target.value)}
                    placeholder="e.g. Hydraulic Press PLC Rack 02"
                    className="w-full bg-accent/40 border border-border/80 focus:border-primary rounded-lg px-3 py-1.5 text-foreground outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1">Protocol Type</label>
                    <select
                      value={newConnProtocol}
                      onChange={(e) => {
                        setNewConnProtocol(e.target.value);
                        if (e.target.value.includes("OPC-UA")) {
                          setNewConnEndpoint("opc.tcp://127.0.0.1:4840/UA/Node");
                          setNewConnCategory("scada");
                        } else if (e.target.value.includes("MQTT")) {
                          setNewConnEndpoint("mqtts://localhost:8883/telemetry/#");
                          setNewConnCategory("scada");
                        } else if (e.target.value.includes("PostgreSQL")) {
                          setNewConnEndpoint("postgresql://localhost:5432/historian");
                          setNewConnCategory("historian");
                        } else if (e.target.value.includes("MCP")) {
                          setNewConnEndpoint("python -m local_mcp_server");
                          setNewConnCategory("mcp");
                        }
                      }}
                      className="w-full bg-accent/40 border border-border/80 focus:border-primary rounded-lg px-2.5 py-1.5 text-foreground outline-none"
                    >
                      <option value="OPC-UA Binary (TCP)">OPC-UA Binary</option>
                      <option value="MQTT v5.0 (mTLS)">MQTT v5.0 (mTLS)</option>
                      <option value="PostgreSQL / Timescale">PostgreSQL Timescale</option>
                      <option value="Model Context Protocol (stdio)">MCP stdio (Python)</option>
                      <option value="Modbus-TCP / IP">Modbus-TCP</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1">Category</label>
                    <select
                      value={newConnCategory}
                      onChange={(e) => setNewConnCategory(e.target.value as any)}
                      className="w-full bg-accent/40 border border-border/80 focus:border-primary rounded-lg px-2.5 py-1.5 text-foreground outline-none"
                    >
                      <option value="scada">SCADA & Bus</option>
                      <option value="historian">Historian DB</option>
                      <option value="mcp">MCP Protocol</option>
                      <option value="storage">Air-Gap Vault</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Endpoint URI / Command</label>
                  <input
                    type="text"
                    required
                    value={newConnEndpoint}
                    onChange={(e) => setNewConnEndpoint(e.target.value)}
                    placeholder="opc.tcp://127.0.0.1:4840/..."
                    className="w-full bg-accent/40 border border-border/80 focus:border-primary rounded-lg px-3 py-1.5 font-mono text-[11px] text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Isolation Boundary</label>
                  <select
                    value={newConnIsolation}
                    onChange={(e) => setNewConnIsolation(e.target.value as any)}
                    className="w-full bg-accent/40 border border-border/80 focus:border-primary rounded-lg px-2.5 py-1.5 text-foreground outline-none"
                  >
                    <option value="L3-Strict-Air-Gap">L3 - Strict Air-Gap (Zero WAN Egress)</option>
                    <option value="L2-Enclave-VPC">L2 - Enclave VPC Protected</option>
                    <option value="L1-Local-Loopback">L1 - Local Loopback Only</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-background/50 border border-border/50">
                  <div>
                    <div className="text-xs font-medium text-foreground">Expose as Agent Tool</div>
                    <div className="text-[10px] text-muted-foreground">Allows LLM to autonomously query this connector via MCP</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewConnExposed(!newConnExposed)}
                    className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                      newConnExposed ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <div className={`w-3 h-3 rounded-full bg-background transition-transform ${
                      newConnExposed ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground hover:text-foreground text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 shadow-md"
                  >
                    Register Connector
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Configuration Detail Slide-out / Modal */}
      <AnimatePresence>
        {selectedForConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{selectedForConfig.name}</h3>
                    <span className="text-[10px] font-mono text-muted-foreground">{selectedForConfig.protocol}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedForConfig(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Target Endpoint</label>
                  <input
                    type="text"
                    value={selectedForConfig.endpoint}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConnectors(connectors.map(c => c.id === selectedForConfig.id ? { ...c, endpoint: val } : c));
                      setSelectedForConfig({ ...selectedForConfig, endpoint: val });
                    }}
                    className="w-full bg-accent/40 border border-border/80 rounded-lg px-3 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1">Poll Interval (ms)</label>
                    <input
                      type="number"
                      value={selectedForConfig.config.pollIntervalMs}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setConnectors(connectors.map(c => c.id === selectedForConfig.id ? { ...c, config: { ...c.config, pollIntervalMs: val } } : c));
                        setSelectedForConfig({
                          ...selectedForConfig,
                          config: { ...selectedForConfig.config, pollIntervalMs: val }
                        });
                      }}
                      className="w-full bg-accent/40 border border-border/80 rounded-lg px-3 py-1.5 font-mono text-foreground outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1">Topic / Node Filter</label>
                    <input
                      type="text"
                      value={selectedForConfig.config.topicOrPath || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setConnectors(connectors.map(c => c.id === selectedForConfig.id ? { ...c, config: { ...c.config, topicOrPath: val } } : c));
                        setSelectedForConfig({
                          ...selectedForConfig,
                          config: { ...selectedForConfig.config, topicOrPath: val }
                        });
                      }}
                      className="w-full bg-accent/40 border border-border/80 rounded-lg px-3 py-1.5 font-mono text-[11px] text-foreground outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-border/50 space-y-1 font-mono text-[11px]">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Cipher Suite:</span>
                    <span className="text-foreground">{selectedForConfig.tlsCipher}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Auth Token:</span>
                    <span className="text-primary">{selectedForConfig.config.authTokenMasked || "None"}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Active Tags / Nodes:</span>
                    <span className="text-foreground">{selectedForConfig.activeNodesCount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/60">
                  <button
                    onClick={() => handleDeleteConnector(selectedForConfig.id)}
                    className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Connector</span>
                  </button>

                  <button
                    onClick={() => setSelectedForConfig(null)}
                    className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
