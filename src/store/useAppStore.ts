import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EnclaveMember = {
  id: string;
  name: string;
  initials: string;
  color: string;
  specialization: string;
};

export type Enclave = {
  name: string;
  status: string;
  nodes: number;
  type: string;
  lastActive: string;
  members?: EnclaveMember[];
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status?: 'loading' | 'done';
  loadingText?: string;
  attachments?: { name: string; type: string }[];
};

export type Asset = {
  id: string;
  name: string;
  type: string;
  size: string;
  date: string;
  status: string;
  isFolder?: boolean;
  folderId?: string | null;
  content?: string;
  fileUrl?: string;
};

export type Session = {
  id: string;
  title: string;
  status: string;
  time: string;
  messages: Message[];
};

export type AgentSkill = {
  id: string;
  name: string;
  domain: "scada" | "security" | "control" | "analytics" | "custom";
  description: string;
  triggerKeywords: string[];
  latencyMs: number;
  isolationLevel: "L1-Loopback" | "L2-VPC" | "L3-Air-Gap";
  enabled: boolean;
  isBuiltIn?: boolean;
  promptInstructions: string;
  connectedTool?: string;
  sampleInput?: string;
  sampleOutput?: string;
};

export type MCPPlugin = {
  id: string;
  name: string;
  category: "bridge" | "storage" | "sandbox" | "protocol" | "analytics";
  description: string;
  version: string;
  author: string;
  installed: boolean;
  enabled: boolean;
  airGapVerified: boolean;
  endpoints: string[];
  permissions: string[];
};

export type TransparencyState = {
  agentTrace: string[];
  routingLogic: { taskType: string; selectedModel: string; reasoning: string } | null;
  networkStatus: { outboundConn: number; egressKb: number };
  graphNodes: any[];
  graphEdges: any[];
};

interface AppState {
  enclaves: Enclave[];
  addEnclave: (enclave: Enclave) => void;
  removeEnclave: (index: number) => void;
  updateEnclaveType: (index: number, type: string) => void;
  updateEnclaveMembers: (index: number, members: EnclaveMember[]) => void;

  workloadTypes: string[];
  addWorkloadType: (type: string) => void;
  removeWorkloadType: (type: string) => void;
  
  sessions: Session[];
  createNewSession: (initialMessage: Message) => string;
  addMessageToSession: (sessionId: string, message: Message) => void;
  updateMessageInSession: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  deleteSession: (sessionId: string) => void;

  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;

  // Agent Skills & MCP Plugins
  skills: AgentSkill[];
  addSkill: (skill: AgentSkill) => void;
  toggleSkill: (id: string) => void;
  deleteSkill: (id: string) => void;

  plugins: MCPPlugin[];
  togglePlugin: (id: string) => void;
  installPlugin: (id: string) => void;
  uninstallPlugin: (id: string) => void;
  addCustomPlugin: (plugin: MCPPlugin) => void;

  // Transparency State
  transparency: TransparencyState;
  appendTrace: (log: string) => void;
  setRoutingLogic: (logic: TransparencyState['routingLogic']) => void;
  setNetworkStatus: (status: TransparencyState['networkStatus']) => void;
  setGraph: (nodes: any[], edges: any[]) => void;
  updateGraphNode: (id: string, data: any) => void;
  connectTransparencyWS: () => void;

  // UI State
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;

  // User Settings
  userSettings: {
    fullName: string;
    preferredName: string;
    workDescription: string;
    instructions: string;
    theme: string;
    chatFont: string;
    motion: string;
    voiceLanguage: string;
    voiceStyle: string;
    voiceSpeed: string;
    responseCompletions: boolean;
    email: string;
    trainOnData: boolean;
    ultronCursor: boolean;
    cursorEffects: boolean;
    autoOpenArtifacts: boolean;
    showBottomTelemetryBar: boolean;
    isScrubbingMode: boolean;
  };
  updateUserSettings: (updates: Partial<AppState['userSettings']>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  enclaves: [
    { name: "Core Intelligence", status: "active", nodes: 24, type: "Production", lastActive: "Just now", members: [{ id: "m1", name: "John Doe", initials: "JD", color: "bg-blue-900", specialization: "Backend" }] },
    { name: "Threat Analysis V2", status: "processing", nodes: 8, type: "Research", lastActive: "2 hrs ago", members: [{ id: "m2", name: "Sarah Miller", initials: "SM", color: "bg-purple-900", specialization: "Security" }] },
    { name: "Legacy DB Migration", status: "offline", nodes: 0, type: "Archived", lastActive: "3 weeks ago", members: [] },
    { name: "Neural Network Training", status: "active", nodes: 128, type: "Cluster", lastActive: "1 min ago", members: [] },
    { name: "Web Server Fleet", status: "active", nodes: 6, type: "Production", lastActive: "10 mins ago", members: [] },
  ],
  addEnclave: (enclave) => set((state) => ({ enclaves: [enclave, ...state.enclaves] })),
  removeEnclave: (index) => set((state) => {
    const newEnclaves = [...state.enclaves];
    newEnclaves.splice(index, 1);
    return { enclaves: newEnclaves };
  }),
  updateEnclaveType: (index, type) => set((state) => {
    const newEnclaves = [...state.enclaves];
    newEnclaves[index] = { ...newEnclaves[index], type };
    return { enclaves: newEnclaves };
  }),
  updateEnclaveMembers: (index, members) => set((state) => {
    const newEnclaves = [...state.enclaves];
    newEnclaves[index] = { ...newEnclaves[index], members };
    return { enclaves: newEnclaves };
  }),

  workloadTypes: ["Research & Analysis", "Production Server", "Compute Cluster", "Cold Storage"],
  addWorkloadType: (type) => set((state) => ({ workloadTypes: [...state.workloadTypes, type] })),
  removeWorkloadType: (type) => set((state) => ({
    workloadTypes: state.workloadTypes.filter((t) => t !== type),
    enclaves: state.enclaves.map((e) => e.type === type ? { ...e, type: "Requires Update" } : e)
  })),

  sessions: [
    {
      id: "1",
      title: "Analyze telemetry logs",
      status: "done",
      time: "Today",
      messages: [
        {
          id: "1", role: "user", content: "Can you scan the attached syslog for any unauthorized egress attempts?", attachments: []
        },
        {
          id: "2", role: "assistant", content: "I have analyzed the `syslog_export.txt`. The enclave is secure. There were 14 blocked outbound attempts from a quarantined container, but the hypervisor rules prevented any actual egress.", status: "done"
        }
      ]
    },
    { id: "2", title: "Compile NPU drivers", status: "active", time: "Today", messages: [] },
    { id: "3", title: "Scan local network", status: "progress", time: "Yesterday", messages: [] },
  ],
  
  assets: [
    { id: "f1", name: "Training Data", type: "folder", size: "--", date: "Today, 10:00 AM", status: "Indexed", isFolder: true, folderId: null },
    { id: "1", name: "architecture_v2.pdf", type: "pdf", size: "4.2 MB", date: "Today, 10:42 AM", status: "Processed", folderId: null },
    { id: "2", name: "syslog_export.txt", type: "log", size: "1.1 MB", date: "Today, 09:15 AM", status: "Processed", folderId: null, content: "Sep 19 09:12:34 ultron-core kernel: [ 12.3456] eth0: link up, 1000Mbps, full-duplex, lpa 0x3800\nSep 19 09:13:01 ultron-core sshd[1234]: Accepted publickey for root from 192.168.1.50 port 54321 ssh2\nSep 19 09:14:22 ultron-core nginx[5678]: 192.168.1.50 - - [19/Sep/2026:09:14:22 +0000] \"GET /api/v1/status HTTP/1.1\" 200 142 \"-\" \"UltronAgent/2.4\"\nSep 19 09:15:00 ultron-core systemd[1]: Started Data Aggregation Pipeline.\nSep 19 09:15:10 ultron-core python3[9999]: [INFO] Model loaded successfully. Ready for inference." },
    { id: "3", name: "training_data_batch1.csv", type: "data", size: "128.5 MB", date: "Yesterday", status: "Indexed", folderId: "f1", content: "id,feature_1,feature_2,label\n1,0.45,0.89,0\n2,0.12,0.34,1\n3,0.99,0.01,0\n4,0.55,0.55,1\n5,0.78,0.22,1" },
    { id: "4", name: "UI_Mockups.zip", type: "archive", size: "45.0 MB", date: "Oct 24", status: "Scanned", folderId: null },
    { id: "5", name: "main_controller.py", type: "code", size: "12 KB", date: "Oct 22", status: "Indexed", folderId: null, content: "import os\nimport sys\nimport logging\nfrom core.enclave import SecureEnclave\n\nlogger = logging.getLogger(__name__)\n\ndef initialize_system():\n    \"\"\"Initializes the Ultron local processing core.\"\"\"\n    logger.info(\"Booting Ultron core...\")\n    \n    try:\n        enclave = SecureEnclave(mode='air-gapped')\n        enclave.allocate_memory('16GB')\n        enclave.start_inference_engine()\n        logger.info(\"System initialized successfully.\")\n        return enclave\n    except Exception as e:\n        logger.error(f\"Failed to start: {e}\")\n        sys.exit(1)\n\nif __name__ == '__main__':\n    initialize_system()" },
    { id: "6", name: "database_schema.sql", type: "code", size: "8 KB", date: "Oct 21", status: "Indexed", folderId: null, content: "CREATE TABLE enclaves (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name VARCHAR(255) NOT NULL,\n    status VARCHAR(50) DEFAULT 'offline',\n    nodes INTEGER DEFAULT 0,\n    type VARCHAR(100),\n    last_active TIMESTAMP DEFAULT NOW()\n);\n\nCREATE TABLE assets (\n    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n    name VARCHAR(255) NOT NULL,\n    type VARCHAR(50),\n    size BIGINT,\n    content_hash VARCHAR(64),\n    uploaded_at TIMESTAMP DEFAULT NOW()\n);\n\nCREATE INDEX idx_enclaves_status ON enclaves(status);\nCREATE INDEX idx_assets_type ON assets(type);" },
  ],
  setAssets: (assets) => set({ assets }),
  addAsset: (asset) => set((state) => ({ assets: [asset, ...state.assets] })),
  deleteAsset: (id) => set((state) => ({ assets: state.assets.filter(a => a.id !== id && a.folderId !== id) })),
  
  createNewSession: (initialMessage) => {
    const sessionId = Date.now().toString();
    const newSession: Session = {
      id: sessionId,
      title: initialMessage.content.slice(0, 30) + (initialMessage.content.length > 30 ? "..." : "") || "New Chat",
      status: "active",
      time: "Today",
      messages: [initialMessage]
    };
    
    set((state) => ({
      sessions: [newSession, ...state.sessions]
    }));
    
    return sessionId;
  },

  deleteSession: (sessionId) => set((state) => ({
    sessions: state.sessions.filter(s => s.id !== sessionId)
  })),
  
  addMessageToSession: (sessionId, message) => set((state) => {
    const sessionExists = state.sessions.some(s => s.id === sessionId);
    if (!sessionExists) {
      return {
        sessions: [
          {
            id: sessionId,
            title: message.content.slice(0, 30) || "New Chat",
            status: "active",
            time: "Today",
            messages: [message]
          },
          ...state.sessions
        ]
      };
    }
    return {
      sessions: state.sessions.map((session) => 
        session.id === sessionId 
          ? { ...session, messages: [...session.messages, message] }
          : session
      )
    };
  }),
  
  updateMessageInSession: (sessionId, messageId, updates) => set((state) => ({
    sessions: state.sessions.map(s => {
      if (s.id !== sessionId) return s;
      return {
        ...s,
        messages: s.messages.map(m => m.id === messageId ? { ...m, ...updates } : m)
      };
    })
  })),

  // Agent Skills State & Actions
  skills: [
    {
      id: "skill-turbine-fft",
      name: "Turbine Vibration FFT Diagnostic",
      domain: "scada",
      description: "Computes Fourier harmonic spectra from accelerometer telemetry to predict bearing wear, cavitation, and imbalance.",
      triggerKeywords: ["vibration", "fft", "bearing", "harmonics", "rpm", "cavitation"],
      latencyMs: 14,
      isolationLevel: "L3-Air-Gap",
      enabled: true,
      isBuiltIn: true,
      connectedTool: "Local Industrial MQTT Bus (mqtt_query_vibration)",
      promptInstructions: "Extract rotational frequency and harmonic peaks. Flag 1X, 2X, or 3X multiples exceeding ISO 10816 standards.",
      sampleInput: '{"sensor": "TG-02", "rpm": 3600, "vibration_peak_hz": 120.4}',
      sampleOutput: '{"status": "NOMINAL", "bearing_condition": "0.98 Healthy", "peak_harmonic": "2X Misalignment within 0.12mm/s margin"}'
    },
    {
      id: "skill-iec-security",
      name: "IEC 62443 Air-Gap Security Auditor",
      domain: "security",
      description: "Continuously probes network socket bindings, mTLS cipher suites, and zero-egress iptables to prevent WAN data leaks.",
      triggerKeywords: ["security", "egress", "wan", "audit", "air-gap", "mtls", "leak"],
      latencyMs: 8,
      isolationLevel: "L3-Air-Gap",
      enabled: true,
      isBuiltIn: true,
      connectedTool: "TimescaleDB Historian & Vector Store",
      promptInstructions: "Verify outbound connection counter == 0. Enforce cryptographic TLS 1.3 verification on loopback bridges.",
      sampleInput: '{"action": "audit_egress", "enclave_id": "core-enclave-01"}',
      sampleOutput: '{"verdict": "SECURE", "outbound_egress_bytes": 0, "active_tls_ciphers": "TLS_AES_256_GCM_SHA384", "violations": []}'
    },
    {
      id: "skill-hydraulic-surge",
      name: "Hydraulic Surge & Relief Valve Calibrator",
      domain: "control",
      description: "Models transient pressure shockwaves in piping networks and validates relief valve trigger thresholds.",
      triggerKeywords: ["pressure", "surge", "psi", "hydraulic", "relief valve", "bar"],
      latencyMs: 19,
      isolationLevel: "L3-Air-Gap",
      enabled: true,
      isBuiltIn: true,
      connectedTool: "Siemens S7 / OPC-UA Gateway (opcua_read_pressure)",
      promptInstructions: "Monitor PSI gradients. If dP/dt > 45 PSI/s, recommend automated pilot bypass valve trip.",
      sampleInput: '{"line": "Line A", "current_psi": 284.6, "rate_of_rise": 12.3}',
      sampleOutput: '{"surge_margin": "SAFE (+35.4 PSI)", "relief_threshold": 320.0, "damping_factor": 0.88}'
    },
    {
      id: "skill-modbus-fault",
      name: "SCADA PLC Alarm Code Triager",
      domain: "scada",
      description: "Maps binary hex registers and PLC alarm words into human-readable industrial root-cause recovery steps.",
      triggerKeywords: ["fault", "alarm", "plc", "code", "register", "modbus", "triager"],
      latencyMs: 11,
      isolationLevel: "L2-VPC",
      enabled: true,
      isBuiltIn: true,
      connectedTool: "Modbus-TCP Coupler (scada_get_fault_codes)",
      promptInstructions: "Decode bitwise fault register words. Correlate with historical plant trip logs to prioritize operator dispatch.",
      sampleInput: '{"register_hex": "0x00A4", "rack": "PLC-02"}',
      sampleOutput: '{"alarm_name": "Over-Temperature Limit Trip", "severity": "HIGH", "recommended_sop": "SOP-ENG-442B"}'
    },
    {
      id: "skill-pid-tuner",
      name: "PID Dynamic Thermal Loop Auto-Tuner",
      domain: "control",
      description: "Applies Cohen-Coon and Ziegler-Nichols transfer function estimation to eliminate thermal oscillations.",
      triggerKeywords: ["pid", "autotune", "temperature", "thermal", "oscillation", "kp", "ki", "kd"],
      latencyMs: 25,
      isolationLevel: "L1-Loopback",
      enabled: false,
      isBuiltIn: true,
      connectedTool: "Local Industrial MQTT Bus",
      promptInstructions: "Calculate optimal Kp, Ki, Kd coefficients for closed-loop thermal furnaces.",
      sampleInput: '{"furnace_id": "F-04", "setpoint": 850.0, "measured": 842.1}',
      sampleOutput: '{"kp": 2.45, "ki": 0.18, "kd": 0.04, "estimated_settling_time_sec": 34.2}'
    }
  ],
  addSkill: (skill) => set((state) => ({ skills: [skill, ...state.skills] })),
  toggleSkill: (id) => set((state) => ({
    skills: state.skills.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s)
  })),
  deleteSkill: (id) => set((state) => ({
    skills: state.skills.filter(s => s.id !== id)
  })),

  // MCP Plugins State & Actions
  plugins: [
    {
      id: "plugin-s7-driver",
      name: "Siemens S7comm Industrial Protocol Driver",
      category: "bridge",
      description: "Native low-overhead S7comm driver directly communicating with SIMATIC S7-300/400/1200/1500 PLC racks.",
      version: "v2.4.0",
      author: "Ultron Industrial Core",
      installed: true,
      enabled: true,
      airGapVerified: true,
      endpoints: ["s7comm://127.0.0.1:102", "stdio://python -m s7_mcp_bridge"],
      permissions: ["Zero-Network WAN Egress", "Read-Only PLC DB Memory"]
    },
    {
      id: "plugin-timescale-coprocessor",
      name: "TimescaleDB Hypertable Analytics Sidecar",
      category: "storage",
      description: "Continuous aggregate hypertable coprocessor for high-frequency time-series sensor vectorization.",
      version: "v1.9.2",
      author: "Enterprise Grid Team",
      installed: true,
      enabled: true,
      airGapVerified: true,
      endpoints: ["postgresql://enclave_db:5432/historian_timeseries"],
      permissions: ["Local Loopback IPC", "Direct SQL Access"]
    },
    {
      id: "plugin-docker-sandbox",
      name: "Zero-Egress Docker Python Isolation Runner",
      category: "sandbox",
      description: "Spins hardened, network-disabled ephemeral Docker containers for executing generated code safely.",
      version: "v3.1.0",
      author: "SecOps Enclave",
      installed: true,
      enabled: true,
      airGapVerified: true,
      endpoints: ["unix:///var/run/docker.sock (cgroup v2 restricted)"],
      permissions: ["No WAN Outbound", "Read-Only Root Filesystem", "512MB RAM Cap"]
    },
    {
      id: "plugin-modbus-serial",
      name: "Modbus-RTU / ASCII RS-485 Gateway",
      category: "protocol",
      description: "Hardware serial bus adapter connecting legacy Modbus VFD inverters and energy analyzers.",
      version: "v1.2.4",
      author: "Industrial Automation Labs",
      installed: false,
      enabled: false,
      airGapVerified: true,
      endpoints: ["serial:///dev/ttyUSB0", "modbus://192.168.1.150:502"],
      permissions: ["Serial COM Port Access", "Zero-Network WAN Egress"]
    },
    {
      id: "plugin-pid-schematics",
      name: "P&ID Engineering Schematic Vectorizer",
      category: "analytics",
      description: "Docling-accelerated neural parser extracting instrument bubbles, valves, and flow loops from engineering PDFs.",
      version: "v1.5.0",
      author: "Plant Intelligence WG",
      installed: false,
      enabled: false,
      airGapVerified: true,
      endpoints: ["local_ipc://docling_pid_pipeline"],
      permissions: ["Local CPU/CUDA Acceleration", "Confidential Document Cache"]
    }
  ],
  togglePlugin: (id) => set((state) => ({
    plugins: state.plugins.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p)
  })),
  installPlugin: (id) => set((state) => ({
    plugins: state.plugins.map(p => p.id === id ? { ...p, installed: true, enabled: true } : p)
  })),
  uninstallPlugin: (id) => set((state) => ({
    plugins: state.plugins.map(p => p.id === id ? { ...p, installed: false, enabled: false } : p)
  })),
  addCustomPlugin: (plugin) => set((state) => ({
    plugins: [plugin, ...state.plugins]
  })),

  // Transparency Implementations
    transparency: {
      agentTrace: ["// Ultron OS v2.4.1", "> Waiting for telemetry..."],
      routingLogic: null,
      networkStatus: { outboundConn: 0, egressKb: 0 },
      graphNodes: [],
      graphEdges: []
    },
    
    appendTrace: (log) => set((state) => {
      const newTrace = [...state.transparency.agentTrace, log];
      if (newTrace.length > 100) newTrace.shift(); // Keep only last 100 logs
      return { transparency: { ...state.transparency, agentTrace: newTrace } };
    }),

    setRoutingLogic: (logic) => set((state) => ({
      transparency: { ...state.transparency, routingLogic: logic }
    })),

    setNetworkStatus: (status) => set((state) => ({
      transparency: { ...state.transparency, networkStatus: status }
    })),
    setGraph: (nodes, edges) => set((state) => ({
      transparency: { ...state.transparency, graphNodes: nodes, graphEdges: edges }
    })),
    updateGraphNode: (id, data) => set((state) => ({
      transparency: {
        ...state.transparency,
        graphNodes: state.transparency.graphNodes.map((n: any) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n)
      }
    })),

    connectTransparencyWS: () => {
      // Ensure we only connect once
      if (window._transparencyWsConnected) return;
      window._transparencyWsConnected = true;

      const ws = new WebSocket("ws://localhost:8000/ws/transparency");
      
      ws.onopen = () => {
        console.log("[Transparency] Connected to live trace.");
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "agentTrace") {
            useAppStore.getState().appendTrace(payload.data);
          } else if (payload.type === "routingLogic") {
            useAppStore.getState().setRoutingLogic(payload.data);
          } else if (payload.type === "networkStatus") {
            useAppStore.getState().setNetworkStatus(payload.data);
          } else if (payload.type === "graphInit") {
            useAppStore.getState().setGraph(payload.data.nodes, payload.data.edges);
          } else if (payload.type === "graphNodeUpdate") {
            useAppStore.getState().updateGraphNode(payload.data.id, payload.data.data);
          }
        } catch (e) {
          console.error("Failed to parse WebSocket message", e);
        }
      };

      ws.onclose = () => {
        console.log("[Transparency] Disconnected.");
        window._transparencyWsConnected = false;
        // Reconnect logic could be added here
        setTimeout(() => {
          useAppStore.getState().connectTransparencyWS();
        }, 5000);
      };
    },

    // UI State
    isSettingsOpen: false,
    setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),

    // User Settings
    userSettings: {
      fullName: "Krish Prajapati",
      preferredName: "Krishu",
      workDescription: "",
      instructions: "",
      theme: "dark",
      chatFont: "Default",
      motion: "System",
      voiceLanguage: "English",
      voiceStyle: "Buttery",
      voiceSpeed: "Normal",
      responseCompletions: true,
      email: "krish@company.local",
      trainOnData: false,
      ultronCursor: true,
      cursorEffects: true,
      autoOpenArtifacts: true,
      showBottomTelemetryBar: true,
      isScrubbingMode: false,
    },
    updateUserSettings: (updates) => set((state) => ({
      userSettings: { ...state.userSettings, ...updates }
    }))
  }),
  {
    name: 'ultron-app-storage',
    partialize: (state) => ({
      enclaves: state.enclaves,
      workloadTypes: state.workloadTypes,
      sessions: state.sessions,
      assets: state.assets,
      userSettings: state.userSettings,
      skills: state.skills,
      plugins: state.plugins,
      // Do not persist live transparency logs
    }),
  }
)
);

// Add global type for ws tracking
declare global {
  interface Window {
    _transparencyWsConnected?: boolean;
  }
}
