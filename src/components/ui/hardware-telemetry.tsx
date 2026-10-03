"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, HardDrive, Maximize, Activity } from "lucide-react";

type MetricPoint = {
  vram: number;
  ram: number;
  cpu: number;
};

export function HardwareTelemetry({ rightOpen = false }: { rightOpen?: boolean }) {
  const MAX_HISTORY = 30; // 30 seconds of history
  
  const [data, setData] = useState({
    vram_used: 0,
    vram_total: 8,
    ram_used: 0,
    ram_total: 16,
    cpu_used: 0,
    cpu_total: 100,
    token_speed: 0,
    context_used: 0,
    context_total: 32000
  });

  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState<MetricPoint[]>([]);
  const [countdown, setCountdown] = useState(5);
  const [hoverTab, setHoverTab] = useState<'vram' | 'ram' | 'cpu' | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setHoverTab(null);
      }
    };

    if (hoverTab !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [hoverTab]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const fetchTelemetry = async () => {
      let currentVram = 0;
      let currentRam = 0;
      let currentCpu = 0;

      try {
        const res = await fetch("http://localhost:8000/api/telemetry");
        if (res.ok) {
          const json = await res.json();
          setData(json);
          currentVram = json.vram_used;
          currentRam = json.ram_used;
          currentCpu = json.cpu_used;
          if (!isConnected) setIsConnected(true);
        } else {
          throw new Error("Bad response");
        }
      } catch (error) {
        if (isConnected) setIsConnected(false);
        // Backend unreachable. Retain last known max boundaries if possible, but drop usage to 0 to stop hallucinating active load.
        setData(prev => {
          const nextData = {
            ...prev,
            vram_used: 0,
            ram_used: 0,
            cpu_used: 0,
            token_speed: 0
          };
          currentVram = 0;
          currentRam = 0;
          currentCpu = 0;
          return nextData;
        });
      }

      // Update history and tick countdown
      setHistory(prev => {
        const next = [...prev, { vram: currentVram, ram: currentRam, cpu: currentCpu }];
        if (next.length > MAX_HISTORY) return next.slice(-MAX_HISTORY);
        return next;
      });
      
      setCountdown(prev => Math.max(0, prev - 1));
    };

    // Run once initially to populate immediately
    fetchTelemetry();
    interval = setInterval(fetchTelemetry, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected]);

  // Setup dynamic chart parameters based on hovered tab
  const isVram = hoverTab === 'vram';
  const isCpu = hoverTab === 'cpu';
  const maxVal = Math.max(1, isVram ? data.vram_total : isCpu ? data.cpu_total : data.ram_total);
  
  // Generate 6 Y-axis steps dynamically
  const yAxis = [
    maxVal,
    maxVal * 0.8,
    maxVal * 0.6,
    maxVal * 0.4,
    maxVal * 0.2,
    0
  ];

  const getY = (val: number) => 100 - (Math.min(val, maxVal) / maxVal) * 100;
  const getX = (idx: number, len: number) => len > 1 ? (idx / (len - 1)) * 100 : 0;

  const points = history.map((h, i) => `${getX(i, history.length)},${getY(isVram ? h.vram : isCpu ? h.cpu : h.ram)}`).join(" ");
  return (
    <div 
      className={`absolute top-4 z-[70] flex transition-all duration-300 ${rightOpen ? 'right-[360px]' : 'right-[72px]'}`} 
      ref={containerRef}
    >
      {/* Status Pill matching the design */}
      <div className="h-10 px-4 rounded-[12px] border border-[#00f0ff]/30 backdrop-blur-md bg-[#0a0a0a]/90 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] hover:shadow-[0_0_20px_rgba(0,240,255,0.2)] hover:border-[#00f0ff]/50 cursor-default">
        
        {/* CPU indicator */}
        <div 
          className="flex items-center gap-1.5 text-blue-500 hover:bg-white/5 py-2 px-2 -ml-2 rounded cursor-pointer"
          onClick={() => setHoverTab(prev => prev === 'cpu' ? null : 'cpu')}
        >
          <Activity className="w-3.5 h-3.5 opacity-80" />
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase opacity-90">CPU</span>
          <span className="text-[10px] font-mono text-blue-400/80 ml-0.5">
            {Math.round(data.cpu_used)}%
          </span>
          <div className="w-[5px] h-3.5 bg-blue-950 rounded-[2px] overflow-hidden flex items-end ml-1 origin-bottom">
            <div className="w-full bg-blue-500 rounded-[2px]" style={{ height: `${(data.cpu_used / Math.max(data.cpu_total, 1)) * 100}%` }} />
          </div>
        </div>

        {/* VRAM indicator */}
        <div 
          className="flex items-center gap-1.5 text-emerald-500 border-l border-white/10 pl-4 py-2 px-3 hover:bg-white/5 rounded cursor-pointer"
          onClick={() => setHoverTab(prev => prev === 'vram' ? null : 'vram')}
        >
          <Cpu className="w-3.5 h-3.5 opacity-80" />
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase opacity-90">VRAM</span>
          <span className="text-[10px] font-mono text-emerald-400/80 ml-0.5">
            {data.vram_used.toFixed(1)}G
          </span>
          <div className="w-[5px] h-3.5 bg-emerald-950 rounded-[2px] overflow-hidden flex items-end ml-1 origin-bottom">
            <div className="w-full bg-emerald-500 rounded-[2px]" style={{ height: `${(data.vram_used / Math.max(data.vram_total, 1)) * 100}%` }} />
          </div>
        </div>

        {/* RAM indicator */}
        <div 
          className="flex items-center gap-1.5 text-red-500 border-l border-white/10 pl-4 py-2 px-3 hover:bg-white/5 rounded cursor-pointer"
          onClick={() => setHoverTab(prev => prev === 'ram' ? null : 'ram')}
        >
          <HardDrive className="w-3.5 h-3.5 opacity-80" />
          <span className="text-[10px] font-bold tracking-[0.1em] uppercase opacity-90">RAM</span>
          <span className="text-[10px] font-mono text-red-400/80 ml-0.5">
            {data.ram_used.toFixed(1)}G
          </span>
          <div className="w-[5px] h-3.5 bg-red-950 rounded-[2px] overflow-hidden flex items-end ml-1 origin-bottom">
            <div className="w-full bg-red-500 rounded-[2px]" style={{ height: `${(data.ram_used / Math.max(data.ram_total, 1)) * 100}%` }} />
          </div>
        </div>

        {/* Connected LED */}
        <div className="border-l border-white/10 pl-4 pr-1 flex items-center justify-center h-full gap-2 opacity-80" title={isConnected ? "Online" : "Backend Offline"}>
          {!isConnected && <span className="text-[9px] font-bold tracking-widest uppercase text-red-500/80">Offline</span>}
          <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isConnected ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.9)]' : 'bg-red-500/50'}`} />
        </div>
      </div>

      {/* Hover Card / Dropdown Graph */}
      <AnimatePresence>
        {hoverTab !== null && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98, pointerEvents: 'none' }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full right-0 mt-3 border border-white/10 rounded-2xl p-5 bg-[#0e0e0e] shadow-[0_20px_50px_rgba(0,0,0,0.8)] font-sans transition-all duration-300 ${isMaximized ? 'w-[600px]' : 'w-[360px]'}`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[14px] font-bold text-white tracking-wide">{isCpu ? 'CPU Usage' : isVram ? 'VRAM Usage' : 'RAM Usage'}</span>
              <button 
                className={`transition-colors cursor-pointer ${isMaximized ? 'text-white' : 'text-white/40 hover:text-white'}`}
                onClick={() => setIsMaximized(!isMaximized)}
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
            <div className="text-[12px] font-mono text-white/40 mb-5">
              {isCpu
                ? `${Math.round(data.cpu_used)}% · ${data.cpu_total > 0 ? Math.round((data.cpu_used / data.cpu_total) * 100) : 0}%`
                : isVram
                  ? `${data.vram_used.toFixed(1)} / ${data.vram_total.toFixed(1)} GB · ${data.vram_total > 0 ? Math.round((data.vram_used / data.vram_total) * 100) : 0}%`
                  : `${data.ram_used.toFixed(1)} / ${data.ram_total.toFixed(1)} GB · ${data.ram_total > 0 ? Math.round((data.ram_used / data.ram_total) * 100) : 0}%`
              }
            </div>

            {countdown > 0 ? (
              <div className={`flex items-center justify-center text-sm text-white/50 font-mono tracking-tight animate-pulse border-b border-white/5 pb-2 transition-all duration-300 ${isMaximized ? 'h-[400px]' : 'h-[200px]'}`}>
                Metrics available in {countdown} s...
              </div>
            ) : (
              <div className={`relative flex text-[#666666] transition-all duration-300 ${isMaximized ? 'h-[400px]' : 'h-[200px]'}`}>
                {/* Y-Axis Label */}
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] tracking-widest uppercase font-bold text-white/30 whitespace-nowrap">
                  {isCpu ? 'Usage (%)' : 'Memory (GB)'}
                </div>
                
                {/* Y-Axis Scales */}
                <div className="w-12 flex flex-col justify-between items-end pr-3 text-[11px] font-sans font-medium pb-[20px] ml-4">
                  {yAxis.map((y, i) => (
                    <span key={i} className="shrink-0 leading-none relative -top-[5px]">{y % 1 === 0 ? y : y.toFixed(1)}</span>
                  ))}
                </div>
                
                {/* Chart Grid and Lines */}
                <div className="flex-1 relative flex flex-col justify-between pb-[20px]">
                  {/* Grid Lines */}
                  {yAxis.map((y, i) => (
                    <div key={y} className="w-full border-t border-[rgba(255,255,255,0.06)] relative top-[1px]" />
                  ))}
                  
                  {/* SVG Container wrapping the graph to pin properly */}
                  <div className="absolute inset-x-0 top-0 bottom-[20px]">
                    <svg 
                      className="w-full h-full overflow-visible" 
                      viewBox="0 0 100 100" 
                      preserveAspectRatio="none"
                    >
                      {isCpu ? (
                        <polyline 
                          points={points} 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      ) : isVram ? (
                        <polyline 
                          points={points} 
                          fill="none" 
                          stroke="#10b981" 
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="4 4"
                        />
                      ) : (
                        <polyline 
                          points={points} 
                          fill="none" 
                          stroke="#ef4444" 
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                  </div>

                  {/* X-Axis Scale */}
                  <div className="absolute bottom-0 left-0 right-0 h-[20px] flex justify-between items-end text-[10px] font-sans font-medium text-[#666666]">
                    <span>-30s</span>
                    <span>-15s</span>
                    <span className="text-white/40">Now</span>
                  </div>
                  {/* X-Axis Label */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] tracking-widest uppercase font-bold text-white/30 whitespace-nowrap">
                    Time
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
