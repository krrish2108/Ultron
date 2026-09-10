import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Enclave = {
  name: string;
  status: string;
  nodes: number;
  type: string;
  lastActive: string;
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
};

export type Session = {
  id: string;
  title: string;
  status: string;
  time: string;
  messages: Message[];
};

export type TransparencyState = {
  agentTrace: string[];
  routingLogic: { taskType: string; selectedModel: string; reasoning: string } | null;
  networkStatus: { outboundConn: number; egressKb: number };
};

interface AppState {
  enclaves: Enclave[];
  addEnclave: (enclave: Enclave) => void;
  removeEnclave: (index: number) => void;
  updateEnclaveType: (index: number, type: string) => void;

  workloadTypes: string[];
  addWorkloadType: (type: string) => void;
  removeWorkloadType: (type: string) => void;
  
  sessions: Session[];
  createNewSession: (initialMessage: Message) => string;
  addMessageToSession: (sessionId: string, message: Message) => void;
  updateMessageInSession: (sessionId: string, messageId: string, updates: Partial<Message>) => void;

  assets: Asset[];
  setAssets: (assets: Asset[]) => void;
  addAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;

  // Transparency State
  transparency: TransparencyState;
  appendTrace: (log: string) => void;
  setRoutingLogic: (logic: TransparencyState['routingLogic']) => void;
  setNetworkStatus: (status: TransparencyState['networkStatus']) => void;
  connectTransparencyWS: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  enclaves: [
    { name: "Core Intelligence", status: "active", nodes: 24, type: "Production", lastActive: "Just now" },
    { name: "Threat Analysis V2", status: "processing", nodes: 8, type: "Research", lastActive: "2 hrs ago" },
    { name: "Legacy DB Migration", status: "offline", nodes: 0, type: "Archived", lastActive: "3 weeks ago" },
    { name: "Neural Network Training", status: "active", nodes: 128, type: "Cluster", lastActive: "1 min ago" },
    { name: "Web Server Fleet", status: "active", nodes: 6, type: "Production", lastActive: "10 mins ago" },
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
    { id: "2", name: "syslog_export.txt", type: "log", size: "1.1 MB", date: "Today, 09:15 AM", status: "Processed", folderId: null },
    { id: "3", name: "training_data_batch1.csv", type: "data", size: "128.5 MB", date: "Yesterday", status: "Indexed", folderId: "f1" },
    { id: "4", name: "UI_Mockups.zip", type: "archive", size: "45.0 MB", date: "Oct 24", status: "Scanned", folderId: null },
    { id: "5", name: "main_controller.py", type: "code", size: "12 KB", date: "Oct 22", status: "Indexed", folderId: null },
    { id: "6", name: "database_schema.sql", type: "code", size: "8 KB", date: "Oct 21", status: "Indexed", folderId: null },
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

    // Transparency Implementations
    transparency: {
      agentTrace: ["// Ultron OS v2.4.1", "> Waiting for telemetry..."],
      routingLogic: null,
      networkStatus: { outboundConn: 0, egressKb: 0 }
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
    }
  }),
  {
    name: 'ultron-app-storage',
    partialize: (state) => ({
      enclaves: state.enclaves,
      workloadTypes: state.workloadTypes,
      sessions: state.sessions,
      assets: state.assets,
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
