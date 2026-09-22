import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, FileText, Download, Scan, ZoomIn, ZoomOut, Database, Loader2, Maximize, X } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export type UltronViewAsset = {
  id: string;
  name: string;
  type: string;
  size: string;
  fileUrl?: string;
  content?: string;
};

type UltronViewProps = {
  asset: UltronViewAsset;
  onClose: () => void;
  className?: string;
};

export function UltronView({ asset, onClose, className = "" }: UltronViewProps) {
  const [zoom, setZoom] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setZoom(1);
    setIsAnalyzing(false);
  }, [asset]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    if (asset.fileUrl) {
      a.href = asset.fileUrl;
    } else if (asset.content) {
      const blob = new Blob([asset.content], { type: 'text/plain' });
      a.href = URL.createObjectURL(blob);
    } else {
      return;
    }
    a.download = asset.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  return (
    <div ref={containerRef} className={`bg-[#050505] flex flex-col overflow-hidden relative ${className}`}>
      {/* UltronView Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#0a0a0a]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_10px_var(--color-primary)] shrink-0">
            <Database className="w-4 h-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span className="hidden sm:inline">UltronView</span>
              <span className="text-white/30 font-normal hidden sm:inline">|</span> 
              <span className="truncate max-w-[150px] sm:max-w-xs">{asset.name}</span>
            </h2>
            <div className="text-[10px] text-white/50 flex items-center gap-2 uppercase tracking-wider font-bold mt-0.5">
              <span>{asset.type}</span>
              <span>&bull;</span>
              <span>{asset.size}</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="text-[#00f0ff] animate-pulse hidden sm:inline">SECURE ENCLAVE</span>
            </div>
          </div>
        </div>
        
        {/* UltronView Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white py-1.5 px-3 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors">
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />} 
            <span className="hidden lg:inline">{isAnalyzing ? 'Analyzing...' : 'Analyze'}</span>
          </button>
          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
          <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white hidden sm:block" title="Zoom In">
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-xs text-white/30 font-mono w-8 text-center hidden sm:block">{Math.round(zoom * 100)}%</div>
          <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white hidden sm:block" title="Zoom Out">
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1 hidden sm:block" />
          <button onClick={handleDownload} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white" title="Download">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white" title="Fullscreen">
            <Maximize className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-white/50 ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto bg-[#030303] relative custom-scrollbar">
        {isAnalyzing && (
          <div className="absolute inset-0 z-50 pointer-events-none bg-[#00f0ff]/5 flex items-center justify-center overflow-hidden">
            <motion.div 
              initial={{ top: '-10%' }} animate={{ top: '110%' }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-32 bg-gradient-to-b from-transparent to-[#00f0ff]/20 border-b border-[#00f0ff]"
            />
            <div className="bg-black/60 backdrop-blur-sm border border-[#00f0ff]/30 px-6 py-3 rounded-xl flex items-center gap-3">
              <Scan className="w-5 h-5 text-[#00f0ff] animate-pulse" />
              <span className="text-[#00f0ff] font-mono font-bold tracking-widest text-sm">ANALYZING ASSET...</span>
            </div>
          </div>
        )}

        {asset.fileUrl && (asset.type === 'pdf' || asset.name.toLowerCase().endsWith('.pdf')) ? (
          <iframe 
            key={`pdf-${asset.id}-${zoom}`}
            src={`${asset.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=${Math.round(zoom * 100)}`} 
            className="w-full h-full border-0 bg-[#323639]" 
            title={asset.name} 
          />
        ) : asset.fileUrl && asset.type.match(/^(jpg|jpeg|png|gif|webp|svg|bmp)$/i) ? (
          <div className="flex items-center justify-center min-h-full p-8 min-w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s ease-out' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.fileUrl} alt={asset.name} className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-white/10" />
          </div>
        ) : asset.content && asset.type !== 'pdf' && !asset.name.toLowerCase().endsWith('.pdf') ? (
          <div className="min-h-full min-w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease-out' }}>
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={asset.type === 'py' ? 'python' : asset.type === 'sql' ? 'sql' : asset.type === 'json' ? 'json' : asset.type === 'tsx' || asset.type === 'ts' ? 'typescript' : asset.type === 'md' ? 'markdown' : 'text'}
              customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', minHeight: '100%', fontSize: '13px' }}
              showLineNumbers={true}
            >
              {asset.content}
            </SyntaxHighlighter>
          </div>
        ) : (
          <div className="flex flex-col h-full bg-[#050505] p-6 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-[#00f0ff]">
                <Scan className="w-5 h-5 animate-pulse" />
                <h3 className="font-mono text-sm font-bold tracking-widest uppercase">Deep Scan / Hex Analysis</h3>
              </div>
              <div className="text-xs font-mono text-white/40 bg-white/5 px-2 py-1 rounded">OFFSET: 0x00000000</div>
            </div>
            
            <div className="relative z-10 flex-1 border border-white/10 bg-black/50 rounded-xl overflow-hidden flex shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              {/* Left: Memory Addresses */}
              <div className="w-24 border-r border-white/10 bg-white/5 p-4 font-mono text-[11px] text-white/30 leading-relaxed text-right select-none hidden sm:block">
                {Array.from({length: 20}).map((_, i) => (
                  <div key={i}>{(i * 16).toString(16).padStart(8, '0')}</div>
                ))}
              </div>
              
              {/* Middle: Hex Dump */}
              <div className="flex-1 p-4 font-mono text-[11px] text-[#00f0ff]/70 leading-relaxed tracking-widest overflow-hidden">
                {Array.from({length: 20}).map((_, i) => (
                  <div key={i} className="flex gap-2">
                    {Array.from({length: 16}).map((_, j) => {
                      const val = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
                      return <span key={j} className="hover:text-white hover:bg-[#00f0ff]/20 cursor-crosshair transition-colors">{val}</span>;
                    })}
                  </div>
                ))}
              </div>
              
              {/* Right: ASCII decoding */}
              <div className="w-24 sm:w-48 border-l border-white/10 bg-white/5 p-4 font-mono text-[11px] text-white/40 leading-relaxed overflow-hidden whitespace-pre hidden sm:block">
                {Array.from({length: 20}).map((_, i) => (
                  <div key={i}>
                    {Array.from({length: 16}).map((_, j) => {
                      const isPrintable = Math.random() > 0.3;
                      return <span key={j}>{isPrintable ? String.fromCharCode(33 + Math.floor(Math.random() * 93)) : '.'}</span>;
                    })}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative z-10 mt-6 flex justify-between items-center border border-white/10 bg-black/60 p-4 rounded-xl flex-col sm:flex-row gap-4 text-center sm:text-left">
              <div className="flex items-center gap-4 flex-col sm:flex-row">
                <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mx-auto sm:mx-0">
                  <Box className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-red-500 tracking-wider">UNRECOGNIZED FORMAT</div>
                  <div className="text-[10px] text-white/40 font-mono mt-1 max-w-xs mx-auto sm:mx-0">
                    {asset.name.match(/\.(ppt|pptx|doc|docx|xls|xlsx)$/i) 
                      ? "Browser preview is not supported for Office documents. Please convert this file to a PDF format and re-upload it for seamless viewing."
                      : "Attempting brute-force decryption..."}
                  </div>
                </div>
              </div>
              <button className="bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 py-2 px-4 rounded-lg text-xs font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)] shrink-0">
                EXTRACT PAYLOAD
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
