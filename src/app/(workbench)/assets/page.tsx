"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, FileText, FileImage, FileCode, FileArchive, Download, Trash2, Search, UploadCloud, FolderPlus, Folder, ArrowLeft, X, Maximize, Scan, ZoomIn, ZoomOut, Database, Loader2 } from "lucide-react";
import { useAppStore, Asset } from "@/store/useAppStore";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function AssetsPage() {
  const assets = useAppStore(state => state.assets);
  const setAssets = useAppStore(state => state.setAssets);
  const addAsset = useAppStore(state => state.addAsset);
  const deleteAsset = useAppStore(state => state.deleteAsset);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  
  const [zoom, setZoom] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedAsset) {
      setZoom(1);
      setIsAnalyzing(false);
    }
  }, [selectedAsset]);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      modalRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleDownload = () => {
    if (!selectedAsset) return;
    const a = document.createElement('a');
    if (selectedAsset.fileUrl) {
      a.href = selectedAsset.fileUrl;
    } else if (selectedAsset.content) {
      const blob = new Blob([selectedAsset.content], { type: 'text/plain' });
      a.href = URL.createObjectURL(blob);
    } else {
      return;
    }
    a.download = selectedAsset.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => setIsAnalyzing(false), 3000);
  };

  const currentAssets = assets.filter(a => a.folderId === currentFolderId);
  const currentFolder = assets.find(a => a.id === currentFolderId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newAssets: Asset[] = await Promise.all(
        Array.from(e.target.files).map(async (f, i) => {
          const isImage = f.type.startsWith('image/');
          const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
          let content = undefined;
          let fileUrl = undefined;
          
          if (isImage || isPdf) {
            fileUrl = URL.createObjectURL(f);
          } else if (f.size < 5 * 1024 * 1024 && !f.name.match(/\.(zip|tar|gz|bin|exe|dll)$/i)) { 
            content = await f.text();
          }

          return {
            id: `uploaded-${Date.now()}-${i}`,
            name: f.name,
            type: f.name.split('.').pop() || "unknown",
            size: (f.size / 1024 / 1024).toFixed(1) + " MB",
            date: "Just now",
            status: "Indexed",
            folderId: currentFolderId,
            isFolder: false,
            content,
            fileUrl
          };
        })
      );
      setAssets([...newAssets, ...assets]);
    }
  };

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    addAsset({
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: "folder",
      size: "--",
      date: "Just now",
      status: "Active",
      isFolder: true,
      folderId: currentFolderId
    });
    setShowCreateFolder(false);
    setNewFolderName("");
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteAsset(id);
  };

  const getIcon = (type: string, isFolder?: boolean) => {
    if (isFolder) return <Folder className="w-5 h-5 text-[#3b82f6]" />;
    switch(type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'log': return <FileText className="w-5 h-5 text-gray-400" />;
      case 'data': return <FileText className="w-5 h-5 text-emerald-400" />;
      case 'archive': return <FileArchive className="w-5 h-5 text-amber-400" />;
      case 'code': return <FileCode className="w-5 h-5 text-blue-400" />;
      default: return <FileText className="w-5 h-5 text-white/50" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative z-10 overflow-y-auto custom-scrollbar p-8">
      
      {/* Header */}
      <div className="flex items-end justify-between mb-10 max-w-6xl mx-auto w-full">
        <div>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center border border-[#3b82f6]/20">
              <Box className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Generated Assets</h1>
          </motion.div>
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-white/50 text-sm max-w-md">
            All files, reports, and data generated or ingested by your local Enclaves.
          </motion.p>
        </div>

        <div className="flex items-center gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="relative group">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#00f0ff] transition-colors" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-64 bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f0ff]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
            />
          </motion.div>
          
          <motion.button 
            onClick={() => setShowCreateFolder(true)}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
          >
            <FolderPlus className="w-4 h-4" /> New Folder
          </motion.button>

          <input 
            type="file" 
            multiple 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleUpload} 
          />
          <motion.button 
            onClick={() => fileInputRef.current?.click()}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
            className="bg-gradient-to-r from-[#00f0ff] to-blue-600 text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:scale-105 px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
          >
            <UploadCloud className="w-4 h-4" /> Upload
          </motion.button>
        </div>
      </div>

      {/* Path Breadcrumbs */}
      {currentFolder && (
        <div className="max-w-6xl mx-auto w-full mb-4 flex items-center gap-3">
          <button 
            onClick={() => setCurrentFolderId(null)}
            className="text-white/40 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to root
          </button>
          <span className="text-white/20">/</span>
          <span className="text-white font-bold text-sm">{currentFolder.name}</span>
        </div>
      )}

      {/* Asset List */}
      <div className="max-w-6xl mx-auto w-full pb-20">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/10 bg-white/5 text-xs font-bold text-white/40 uppercase tracking-wider">
            <div className="col-span-5 pl-2">Filename</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Date Added</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/5">
            {currentAssets.length === 0 ? (
              <div className="p-12 text-center text-white/30 text-sm">
                No assets in this directory.
              </div>
            ) : (
              currentAssets.map((asset, i) => (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 + i * 0.05 }}
                  key={asset.id} 
                  onClick={() => {
                    if (asset.isFolder) {
                      setCurrentFolderId(asset.id);
                    } else {
                      setSelectedAsset(asset);
                    }
                  }}
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/5 transition-colors group cursor-pointer"
                >
                  <div className="col-span-5 flex items-center gap-3 pl-2">
                    <div className="w-10 h-10 rounded-lg bg-black/50 border border-white/5 flex items-center justify-center shrink-0 group-hover:border-white/20 transition-colors">
                      {getIcon(asset.type, asset.isFolder)}
                    </div>
                    <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors truncate">{asset.name}</span>
                  </div>
                  
                  <div className="col-span-2 text-sm text-white/50 font-mono">
                    {asset.size}
                  </div>
                  
                  <div className="col-span-3 text-sm text-white/50">
                    {asset.date}
                  </div>
                  
                  <div className="col-span-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-1 rounded-md border border-[#00f0ff]/20">
                      {asset.status}
                    </span>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-white transition-colors" onClick={e => {
                        e.stopPropagation();
                        if (!asset.isFolder) {
                          window.open(`/${asset.name}`, '_blank');
                        }
                      }}>
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 hover:bg-white/10 rounded-lg text-white/40 hover:text-red-400 transition-colors"
                        onClick={(e) => handleDelete(asset.id, e)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* CREATE FOLDER MODAL */}
      <AnimatePresence>
        {showCreateFolder && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowCreateFolder(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative shadow-[0_0_50px_rgba(0,240,255,0.1)]"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <FolderPlus className="w-4 h-4 text-blue-500" />
                  </div>
                  New Folder
                </h2>
                <button onClick={() => setShowCreateFolder(false)} className="text-white/30 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-8">
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={e => setNewFolderName(e.target.value)}
                  placeholder="Folder name"
                  autoFocus
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateFolder();
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#00f0ff]/50 focus:shadow-[0_0_15px_rgba(0,240,255,0.1)] transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCreateFolder(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all rounded-xl text-sm font-bold text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFolder}
                  className="flex-1 py-3 bg-gradient-to-r from-[#00f0ff] to-blue-600 text-black rounded-xl text-sm font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* ASSET VIEWER MODAL */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 sm:p-8"
            onClick={() => setSelectedAsset(null)}
          >
            <motion.div 
              ref={modalRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-[#050505] border border-white/10 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative"
              onClick={e => e.stopPropagation()}
            >
              {/* UltronView Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#0a0a0a]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-primary/20 border border-primary/30 flex items-center justify-center shadow-[0_0_10px_var(--color-primary)]">
                    <Database className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                      UltronView <span className="text-white/30 font-normal">|</span> <span className="truncate max-w-[200px] sm:max-w-xs">{selectedAsset.name}</span>
                    </h2>
                    <div className="text-[10px] text-white/50 flex items-center gap-2 uppercase tracking-wider font-bold mt-0.5">
                      <span>{selectedAsset.type}</span>
                      <span>&bull;</span>
                      <span>{selectedAsset.size}</span>
                      <span>&bull;</span>
                      <span className="text-[#00f0ff] animate-pulse">SECURE ENCLAVE</span>
                    </div>
                  </div>
                </div>
                
                {/* UltronView Toolbar */}
                <div className="flex items-center gap-1.5">
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-white/5 hover:bg-white/10 disabled:opacity-50 border border-white/10 text-white py-1.5 px-3 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors">
                    {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Scan className="w-3.5 h-3.5" />} {isAnalyzing ? 'Analyzing...' : 'Analyze'}
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={handleZoomIn} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white" title="Zoom In">
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <div className="text-xs text-white/30 font-mono w-8 text-center">{Math.round(zoom * 100)}%</div>
                  <button onClick={handleZoomOut} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white" title="Zoom Out">
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-white/10 mx-1" />
                  <button onClick={handleDownload} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={toggleFullscreen} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white" title="Fullscreen">
                    <Maximize className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedAsset(null)} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-white/50 ml-1">
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

                {selectedAsset.fileUrl && (selectedAsset.type === 'pdf' || selectedAsset.name.toLowerCase().endsWith('.pdf')) ? (
                  <iframe 
                    key={`pdf-${selectedAsset.id}-${zoom}`}
                    src={`${selectedAsset.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&zoom=${Math.round(zoom * 100)}`} 
                    className="w-full h-full border-0 bg-[#323639]" 
                    title={selectedAsset.name} 
                  />
                ) : selectedAsset.fileUrl ? (
                  <div className="flex items-center justify-center min-h-full p-8 min-w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 0.2s ease-out' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedAsset.fileUrl} alt={selectedAsset.name} className="max-w-full max-h-full object-contain rounded-xl shadow-lg border border-white/10" />
                  </div>
                ) : selectedAsset.content && selectedAsset.type !== 'pdf' && !selectedAsset.name.toLowerCase().endsWith('.pdf') ? (
                  <div className="min-h-full min-w-max" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.2s ease-out' }}>
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={selectedAsset.type === 'py' ? 'python' : selectedAsset.type === 'sql' ? 'sql' : selectedAsset.type === 'json' ? 'json' : selectedAsset.type === 'tsx' || selectedAsset.type === 'ts' ? 'typescript' : selectedAsset.type === 'md' ? 'markdown' : 'text'}
                      customStyle={{ margin: 0, padding: '1.5rem', background: 'transparent', minHeight: '100%', fontSize: '13px' }}
                      showLineNumbers={true}
                    >
                      {selectedAsset.content}
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
                      <div className="w-24 border-r border-white/10 bg-white/5 p-4 font-mono text-[11px] text-white/30 leading-relaxed text-right select-none">
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
                      <div className="w-48 border-l border-white/10 bg-white/5 p-4 font-mono text-[11px] text-white/40 leading-relaxed overflow-hidden whitespace-pre">
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
                    
                    <div className="relative z-10 mt-6 flex justify-between items-center border border-white/10 bg-black/60 p-4 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                          <Box className="w-5 h-5 text-red-500" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-red-500 tracking-wider">UNRECOGNIZED FORMAT</div>
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">Attempting brute-force decryption...</div>
                        </div>
                      </div>
                      <button className="bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/30 py-2 px-4 rounded-lg text-xs font-bold tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                        EXTRACT PAYLOAD
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
