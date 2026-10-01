"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, HardDrive, Activity, Zap } from "lucide-react";

export function HardwareTelemetry() {
  const [data, setData] = useState({
    vram_used: 4.2,
    vram_total: 24.0,
    ram_used: 16.5,
    ram_total: 64.0,
    token_speed: 45,
    context_used: 4200,
    context_total: 128000
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
        // Fallback to mock data if no server is running
        setData(prev => ({
          vram_used: Math.max(2, Math.min(prev.vram_total, prev.vram_used + (Math.random() - 0.5) * 0.2)),
          vram_total: prev.vram_total,
          ram_used: Math.max(8, Math.min(prev.ram_total, prev.ram_used + (Math.random() - 0.5) * 0.5)),
          ram_total: prev.ram_total,
          token_speed: Math.max(0, prev.token_speed + (Math.random() - 0.5) * 15),
          context_used: prev.context_used,
          context_total: prev.context_total
        }));
      }
    };

    interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  const vramPercent = (data.vram_used / data.vram_total) * 100;
  const ramPercent = (data.ram_used / data.ram_total) * 100;
  const contextPercent = (data.context_used / data.context_total) * 100;

  return (
    <div className="h-10 w-full bg-[#050505] border-t border-white/10 flex items-center px-4 justify-between z-50 shrink-0 font-mono text-xs text-white/50 relative overflow-hidden">
      {/* Background glow when high usage */}
      <div 
        className="absolute inset-0 bg-red-500/10 transition-opacity duration-1000 pointer-events-none" 
        style={{ opacity: vramPercent > 80 ? 1 : 0 }}
      />

      <div className="flex items-center gap-6 z-10 w-full">
        {/* VRAM */}
        <div className="flex items-center gap-3 flex-1 min-w-[150px]">
          <div className="flex items-center gap-1.5 w-16">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="font-bold text-white/80">VRAM</span>
          </div>
          <div className="flex-1 max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className={`h-full ${vramPercent > 85 ? 'bg-red-500' : 'bg-gradient-to-r from-purple-500 to-indigo-400'}`}
              animate={{ width: `${vramPercent}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="w-20 text-right">
            <span className="text-white/90">{data.vram_used.toFixed(1)}</span> / {data.vram_total} GB
          </div>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* RAM */}
        <div className="flex items-center gap-3 flex-1 min-w-[150px]">
          <div className="flex items-center gap-1.5 w-16">
            <HardDrive className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-bold text-white/80">RAM</span>
          </div>
          <div className="flex-1 max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
            <motion.div 
              className={`h-full ${ramPercent > 85 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-500 to-cyan-400'}`}
              animate={{ width: `${ramPercent}%` }}
              transition={{ duration: 1 }}
            />
          </div>
          <div className="w-20 text-right">
            <span className="text-white/90">{data.ram_used.toFixed(1)}</span> / {data.ram_total} GB
          </div>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Context */}
        <div className="flex items-center gap-3 flex-1 min-w-[150px]">
          <div className="flex items-center gap-1.5 w-[72px]">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-white/80">CONTEXT</span>
          </div>
          <div className="flex-1 max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 relative">
            <motion.div 
              className={`h-full ${contextPercent > 90 ? 'bg-red-500' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
              animate={{ width: `${contextPercent}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="w-[120px] text-right">
            <span className="text-white/90">{data.context_used.toLocaleString()}</span> / {data.context_total.toLocaleString()}
          </div>
        </div>

        <div className="w-px h-4 bg-white/10" />

        {/* Token Speed */}
        <div className="flex items-center gap-2 min-w-[90px] justify-end">
          <Zap className={`w-3.5 h-3.5 ${data.token_speed > 10 ? 'text-[#00f0ff] animate-pulse' : 'text-white/20'}`} />
          <span className="font-bold text-white/90">{Math.round(data.token_speed)}</span> t/s
        </div>

        {/* Connection Status */}
        <div className="flex items-center gap-2 ml-4">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-white/20'}`} title={isConnected ? "Connected to Host PC" : "Mock Data (Disconnected)"} />
        </div>
      </div>
    </div>
  );
}
