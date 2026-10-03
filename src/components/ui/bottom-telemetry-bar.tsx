"use client";

import { useState, useEffect } from "react";
import { Database, HardDrive, Zap, Cpu } from "lucide-react";

export function BottomTelemetryBar() {
  const [data, setData] = useState({
    vram_used: 0,
    vram_total: 8,
    ram_used: 0,
    ram_total: 16,
    token_speed: 0,
    context_used: 0,
    context_total: 32000
  });

  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchTelemetry = async () => {
      try {
        const res = await fetch("http://localhost:8000/api/telemetry");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          if (!isConnected) setIsConnected(true);
        } else {
          throw new Error("Bad response");
        }
      } catch (error) {
        if (isConnected) setIsConnected(false);
      }
    };

    fetchTelemetry();
    interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Calculate percentages
  const vramPercent = Math.min(100, Math.max(0, (data.vram_used / Math.max(1, data.vram_total)) * 100));
  const ramPercent = Math.min(100, Math.max(0, (data.ram_used / Math.max(1, data.ram_total)) * 100));
  const contextPercent = Math.min(100, Math.max(0, (data.context_used / Math.max(1, data.context_total)) * 100));

  return (
    <div className="absolute bottom-0 left-0 right-0 h-10 bg-[#060606] border-t border-white/5 flex items-center px-4 justify-between z-50 font-sans select-none shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
      
      <div className="flex items-center gap-10 flex-1">
        {/* VRAM */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-purple-400">
            <Cpu className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase">VRAM</span>
          </div>
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden flex items-center">
            <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full" style={{ width: `${vramPercent}%` }} />
          </div>
          <span className="text-[10px] text-white/50 font-mono">
            {data.vram_used.toFixed(1)} / {data.vram_total.toFixed(1)} GB
          </span>
        </div>

        {/* RAM */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-blue-400">
            <HardDrive className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase">RAM</span>
          </div>
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden flex items-center">
            <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${ramPercent}%` }} />
          </div>
          <span className="text-[10px] text-white/50 font-mono">
            {data.ram_used.toFixed(1)} / {data.ram_total.toFixed(1)} GB
          </span>
        </div>

        {/* CONTEXT */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-orange-400">
            <Database className="w-3.5 h-3.5 opacity-80" />
            <span className="text-[10px] font-bold tracking-[0.1em] uppercase">CONTEXT</span>
          </div>
          <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden flex items-center">
            <div className="h-full bg-gradient-to-r from-orange-600 to-orange-400 rounded-full" style={{ width: `${contextPercent}%` }} />
          </div>
          <span className="text-[10px] text-white/50 font-mono">
            {data.context_used.toLocaleString()} / {data.context_total.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Token Speed */}
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-yellow-500 opacity-80" />
          <span className="text-[11px] font-mono text-white/70">
            {Math.round(data.token_speed)} <span className="text-white/40">t/s</span>
          </span>
        </div>

        {/* Status Dot */}
        <div className="flex items-center pl-4 border-l border-white/10">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
        </div>
      </div>

    </div>
  );
}
