"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, BrainCircuit, ChevronDown, Image as ImageIcon, Globe, FileUp, X, Folder, FileText, Mic, Square } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppStore, Asset } from "@/store/useAppStore";
import { AudioVisualizer } from "@/components/ui/audio-visualizer";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

const COMMAND_SNIPPETS = [
  { id: 's1', command: 'summarize', label: 'Summarize context', text: 'Summarize the attached files and provide key takeaways.' },
  { id: 's2', command: 'analyze', label: 'Analyze logs', text: 'Analyze the attached logs for any anomalies or security threats.' },
  { id: 's3', command: 'explain', label: 'Explain simply', text: 'Explain the current architecture/code in simple terms.' },
  { id: 's4', command: 'report', label: 'Generate report', text: 'Generate a detailed report based on the provided data.' }
];

export default function WorkbenchHome() {
  const router = useRouter();
  const createNewSession = useAppStore(state => state.createNewSession);
  const assets = useAppStore(state => state.assets);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);
  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<{name: string, type: string}[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);
  
  const { isListening, transcript, interimTranscript, startListening, stopListening } = useSpeechRecognition();

  const filteredSlashItems = useMemo(() => {
    if (!showSlashMenu) return [];
    const query = slashQuery.toLowerCase();
    const isAssetsCmd = query === 'assets' || query === 'assests';
    
    const matchedAssets = isAssetsCmd 
      ? assets 
      : assets.filter(a => a.name.toLowerCase().includes(query));
      
    const matchedSnippets = COMMAND_SNIPPETS.filter(s => s.command.toLowerCase().includes(query));
    
    return [
      ...matchedAssets.map(a => ({ type: 'asset' as const, data: a })),
      ...matchedSnippets.map(s => ({ type: 'snippet' as const, data: s }))
    ];
  }, [showSlashMenu, slashQuery, assets]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [slashQuery, showSlashMenu]);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  useEffect(() => {
    if (!isListening && transcript) {
      setInputText(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript);
    }
  }, [isListening, transcript]);

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
          const file = items[i].getAsFile();
          if (file) {
            setAttachments(prev => [...prev, { name: file.name, type: file.type }]);
          }
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ name: f.name, type: f.type }));
      setAttachments(prev => [...prev, ...newFiles]);
    }
    setShowAttachMenu(false);
  };

  const handleSend = () => {
    if (inputText.trim() === '/settings') {
      setSettingsOpen(true);
      setInputText("");
      setShowSlashMenu(false);
      return;
    }

    if (inputText.trim() === '/upload') {
      fileInputRef.current?.click();
      setInputText("");
      setShowSlashMenu(false);
      return;
    }

    if (showSlashMenu) {
      const query = slashQuery.toLowerCase();
      const isAssetsCmd = query === 'assets' || query === 'assests';
      const filteredAssets = isAssetsCmd 
        ? assets 
        : assets.filter(a => a.name.toLowerCase().includes(query));
        
      if (filteredAssets.length > 0) {
        handleSlashSelect(filteredAssets[0]);
        return;
      }
      
      const snippet = COMMAND_SNIPPETS.find(s => s.command.toLowerCase().includes(query));
      if (snippet) {
        handleSnippetSelect(snippet.text);
        return;
      }
    }

    if (inputText.trim() || attachments.length > 0) {
      const sessionId = createNewSession({
        id: Date.now().toString(),
        role: 'user',
        content: inputText,
        attachments: attachments
      });
      router.push(`/chat/${sessionId}`);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;

    const val = e.target.value;
    setInputText(val);

    const match = val.match(/(?:\s|^)\/(?:(?:assets|assests)\s+)?([^\s]*)$/i);
    if (match) {
      setShowSlashMenu(true);
      setSlashQuery(match[1]);
    } else {
      setShowSlashMenu(false);
    }
  };

  const handleSlashSelect = (asset: Asset) => {
    if (asset.isFolder) {
      const children = assets.filter(a => a.folderId === asset.id);
      const newAttachments = children.map(c => ({ name: c.name, type: c.type }));
      setAttachments(prev => [...prev, { name: asset.name, type: 'folder' }, ...newAttachments]);
    } else {
      setAttachments(prev => [...prev, { name: asset.name, type: asset.type }]);
    }
    
    setInputText(prev => prev.replace(/(?:\s|^)\/(?:(?:assets|assests)\s+)?[^\s]*$/i, ' '));
    setShowSlashMenu(false);
    setSlashQuery("");
  };

  const handleSnippetSelect = (snippetText: string) => {
    setInputText(prev => prev.replace(/(?:\s|^)\/(?:(?:assets|assests)\s+)?[^\s]*$/i, snippetText + ' '));
    setShowSlashMenu(false);
    setSlashQuery("");
  };

  const handleToggleRecord = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative z-10" onClick={() => { setShowAttachMenu(false); setShowModelMenu(false); setShowSlashMenu(false); }}>
      
      {/* Dynamic Background Elements for Empty State */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center z-0">
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0, 0.1, 0] }} 
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[400px] h-[400px] border border-[#00f0ff] rounded-full"
        />
        <motion.div 
          animate={{ scale: [0.8, 2, 0.8], opacity: [0, 0.05, 0] }} 
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute w-[600px] h-[600px] border border-[#3b82f6] rounded-full"
        />
      </div>

      {/* Empty State Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto w-full relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ duration: 0.8, type: "spring" }}
          className="relative mb-8 group cursor-default"
        >
          {/* Animated Glow behind the logo */}
          <div className="absolute inset-0 bg-primary blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-pulse rounded-full" />
          
          <div className="w-20 h-20 rounded-2xl bg-card/50 backdrop-blur-xl border border-border flex items-center justify-center shadow-[0_0_30px_var(--color-primary)] relative z-10 overflow-hidden group-hover:border-primary/50 transition-colors duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <BrainCircuit className="w-10 h-10 text-primary drop-shadow-[0_0_15px_var(--color-primary)] group-hover:scale-110 transition-transform duration-500" />
          </div>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} 
          className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-foreground to-muted-foreground mb-6 tracking-tight drop-shadow-sm"
        >
          Initialize Task
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} 
          className="text-muted-foreground text-lg mb-12 max-w-lg font-light leading-relaxed"
        >
          Deploy local intelligence. What do you need the enclave to process today?
        </motion.p>
      </div>

      {/* Input Area (Pinned to bottom) */}
      <div className="p-6 w-full relative z-20">
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">
          
          {/* Predictive Routing Chip */}
          <div className="absolute -top-10 left-4 flex gap-3">
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
              className="bg-[#3b82f6]/10 border border-[#3b82f6]/30 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-md shadow-[0_0_15px_rgba(59,130,246,0.15)] cursor-default"
            >
              <div className="w-2 h-2 rounded-full bg-[#3b82f6] shadow-[0_0_8px_#3b82f6] animate-pulse" />
              <span className="text-[10px] text-[#3b82f6] font-mono tracking-widest font-bold uppercase">Routing: General</span>
            </motion.div>
          </div>
          
          {/* Animated Input Box */}
          <div className="relative group w-full">
            {/* Aurora Glow Effect */}
            <div className="absolute -inset-[3px] rounded-2xl opacity-30 group-focus-within:opacity-100 blur-xl transition-all duration-700 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff] via-[#8b5cf6] to-[#00f0ff] bg-[length:200%_auto] animate-[aurora_8s_linear_infinite]" />
            </div>

            {/* Revolving Electrons */}
            <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
              <div className="absolute top-1/2 left-1/2 w-[3000px] h-[3000px] -translate-x-1/2 -translate-y-1/2 animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0%,transparent_30%,#00f0ff_49.5%,#ffffff_50%,transparent_50.5%,transparent_80%,#00f0ff_99.5%,#ffffff_100%)] opacity-100 transition-opacity duration-500" />
            </div>
            
            {/* Inner background to preserve dark input area */}
            <div className="absolute inset-[1px] bg-background/90 backdrop-blur-3xl rounded-[15px] pointer-events-none border border-border/50 shadow-sm" />

            {/* Content Container (Not clipped, allows popups) */}
            <div className="relative z-10 flex flex-col p-3">
              
              {/* Attached Files Display */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 p-2 mb-2 border-b border-border/50">
                  {attachments.map((file, idx) => (
                    <div key={idx} className="bg-accent/50 border border-border rounded-lg px-3 py-1.5 flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0">
                        <FileUp className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-xs text-foreground/80 max-w-[120px] truncate">{file.name}</span>
                      <button 
                        onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-red-400 ml-1 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end">
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowAttachMenu(!showAttachMenu); }}
                    className="p-3.5 text-muted-foreground hover:text-primary transition-colors rounded-xl hover:bg-primary/10"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>

                  {/* Attachment Popup Menu */}
                  <AnimatePresence>
                    {showAttachMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-2 w-56 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                        onClick={e => e.stopPropagation()}
                      >
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-foreground/80 hover:bg-accent transition-colors">
                          <FileUp className="w-4 h-4 text-muted-foreground" /> Add files or documents
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-foreground/80 hover:bg-accent transition-colors">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" /> Add photos
                        </button>
                        <div className="h-px bg-border/50 my-1" />
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-xs text-foreground/80 hover:bg-accent transition-colors">
                          <Globe className="w-4 h-4 text-muted-foreground" /> Web search
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <input 
                  type="file" 
                  multiple 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                />
                
                {/* Slash Command Popup Menu */}
                <AnimatePresence>
                  {showSlashMenu && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full left-0 mb-2 w-72 max-h-64 overflow-y-auto no-scrollbar bg-popover border border-primary/30 rounded-xl shadow-[0_0_20px_var(--color-primary)] py-2 z-50"
                      onClick={e => e.stopPropagation()}
                    >
                      {(() => {
                        const assetsItems = filteredSlashItems.filter(item => item.type === 'asset');
                        const snippetItems = filteredSlashItems.filter(item => item.type === 'snippet');
                        
                        return (
                          <>
                            <div className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-wider border-b border-border/50 mb-1 mt-2">
                              Attach Asset or Folder
                            </div>
                            {assetsItems.length === 0 ? (
                              <div className="px-4 py-3 text-xs text-muted-foreground">No matching assets found.</div>
                            ) : (
                              assetsItems.map(item => {
                                const asset = item.data as Asset;
                                const globalIdx = filteredSlashItems.findIndex(i => i === item);
                                const isSelected = globalIdx === selectedIndex;
                                return (
                                  <button 
                                    key={`asset-${asset.id}`}
                                    ref={isSelected ? selectedItemRef : null}
                                    onClick={() => handleSlashSelect(asset)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${isSelected ? 'bg-accent text-primary' : 'text-foreground/80 hover:bg-accent'}`}
                                  >
                                    {asset.isFolder ? <Folder className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-blue-400'}`} /> : <FileText className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
                                    <span className="truncate">{asset.name}</span>
                                    <span className={`text-[10px] ml-auto shrink-0 ${isSelected ? 'text-primary/70' : 'text-muted-foreground/60'}`}>{asset.isFolder ? 'Folder' : asset.type}</span>
                                  </button>
                                );
                              })
                            )}

                            <div className="px-4 py-2 text-xs font-bold text-primary uppercase tracking-wider border-b border-border/50 mb-1 mt-2">
                              Quick Snippets
                            </div>
                            {snippetItems.map(item => {
                              const snippet = item.data as typeof COMMAND_SNIPPETS[0];
                              const globalIdx = filteredSlashItems.findIndex(i => i === item);
                              const isSelected = globalIdx === selectedIndex;
                              return (
                                <button 
                                  key={`snippet-${snippet.id}`}
                                  ref={isSelected ? selectedItemRef : null}
                                  onClick={() => handleSnippetSelect(snippet.text)}
                                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors ${isSelected ? 'bg-accent text-primary' : 'text-foreground/80 hover:bg-accent'}`}
                                >
                                  <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${isSelected ? 'bg-primary/20 border-primary/40' : 'bg-primary/10 border-primary/20'}`}>
                                    <span className="text-primary font-mono text-[10px]">/</span>
                                  </div>
                                  <span className="font-medium truncate">{snippet.command}</span>
                                  <span className={`text-[10px] ml-auto shrink-0 ${isSelected ? 'text-primary/70' : 'text-muted-foreground'}`}>{snippet.label}</span>
                                </button>
                              );
                            })}
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="popLayout">
                  {isListening ? (
                    <motion.div 
                      key="visualizer"
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="flex-1 py-1 px-4 min-h-[56px] flex flex-col items-center justify-center relative w-full"
                    >
                      <AudioVisualizer isRecording={isListening} />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                        <AnimatePresence mode="wait">
                          <motion.span 
                            key={interimTranscript || transcript || "Listening..."}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5, position: "absolute" }}
                            transition={{ duration: 0.15 }}
                            className="text-primary font-mono text-xs uppercase tracking-widest font-bold drop-shadow-[0_0_8px_var(--color-primary)] bg-background/80 px-4 py-1.5 rounded-full backdrop-blur-md border border-primary/30 max-w-[90%] truncate shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                          >
                            {interimTranscript || transcript || "Listening..."}
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.textarea
                      key="textarea"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      placeholder="Query the local enclave... (Type '/' for assets)" 
                      value={inputText}
                      onChange={handleInputChange}
                      onPaste={handlePaste}
                      onKeyDown={(e) => {
                        if (showSlashMenu) {
                          if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setSelectedIndex(prev => (prev < filteredSlashItems.length - 1 ? prev + 1 : prev));
                            return;
                          }
                          if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
                            return;
                          }
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const selected = filteredSlashItems[selectedIndex];
                            if (selected) {
                              if (selected.type === 'asset') handleSlashSelect(selected.data as Asset);
                              else handleSnippetSelect((selected.data as typeof COMMAND_SNIPPETS[0]).text);
                            }
                            return;
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setShowSlashMenu(false);
                            return;
                          }
                        }

                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      className="w-full bg-transparent text-foreground placeholder:text-muted-foreground resize-none outline-none py-4 px-4 max-h-32 overflow-y-auto min-h-[56px] text-[17px] font-light leading-relaxed"
                      rows={1}
                    />
                  )}
                </AnimatePresence>
                <div className="relative flex items-center ml-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowModelMenu(!showModelMenu); }}
                    className="flex items-center gap-2 bg-accent/50 hover:bg-accent border border-border px-4 py-2 rounded-xl transition-all h-[50px]"
                  >
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:inline">Model:</span>
                    <span className="text-xs text-foreground font-mono font-bold">Drone 1</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </button>

                  <AnimatePresence>
                    {showModelMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-2 w-48 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="px-4 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-accent/50 border-b border-border/50">Available Models</div>
                        <button className="w-full text-left px-4 py-3 text-xs font-bold text-foreground hover:bg-accent transition-colors flex items-center justify-between">
                          Drone 1 <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={handleToggleRecord}
                  className={`h-[50px] w-[50px] rounded-xl transition-all ml-2 flex shrink-0 items-center justify-center border ${isListening ? 'bg-red-500/20 text-red-500 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse' : 'bg-accent/50 text-muted-foreground border-transparent hover:bg-accent hover:text-foreground'}`}
                >
                  {isListening ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button 
                  onClick={handleSend}
                  className="h-[50px] px-5 bg-gradient-to-r from-primary to-blue-600 text-white rounded-xl hover:shadow-[0_0_20px_var(--color-primary)] hover:scale-105 transition-all ml-2 flex shrink-0 items-center justify-center group/btn overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover/btn:animate-[shimmer_1.5s_infinite]" />
                  <Send className="w-5 h-5 relative z-10" />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
