"use client";

import { useState, useRef, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Paperclip, Send, FileText, Download, FileUp, ImageIcon, Globe, X, ChevronDown, Loader2, BrainCircuit, Folder } from "lucide-react";
import { useAppStore, Message, Asset } from "@/store/useAppStore";



const COMMAND_SNIPPETS = [
  { id: 's1', command: 'summarize', label: 'Summarize context', text: 'Summarize the attached files and provide key takeaways.' },
  { id: 's2', command: 'analyze', label: 'Analyze logs', text: 'Analyze the attached logs for any anomalies or security threats.' },
  { id: 's3', command: 'explain', label: 'Explain simply', text: 'Explain the current architecture/code in simple terms.' },
  { id: 's4', command: 'report', label: 'Generate report', text: 'Generate a detailed report based on the provided data.' }
];

export default function ChatSession({ params }: { params: Promise<{ session_id: string }> }) {
  const unwrappedParams = use(params);
  const sessionId = unwrappedParams.session_id;

  const [inputText, setInputText] = useState("");
  const [attachments, setAttachments] = useState<{name: string, type: string}[]>([]);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replyingToRef = useRef<string | null>(null);

  const session = useAppStore(state => state.sessions.find(s => s.id === sessionId));
  const addMessageToSession = useAppStore(state => state.addMessageToSession);
  const updateMessageInSession = useAppStore(state => state.updateMessageInSession);
  const assets = useAppStore(state => state.assets);
  const setSettingsOpen = useAppStore(state => state.setSettingsOpen);

  const messages = session?.messages || [];

  const loadingStates = [
    "Ultron is checking Node availability...",
    "Allocating Drone 1 resources...",
    "Analyzing context...",
    "Synthesizing response...",
  ];

  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user') {
        const expectedBotMsgId = "bot-" + lastMessage.id;
        const botHasReplied = messages.some(m => m.id === expectedBotMsgId);
        
        if (!botHasReplied && replyingToRef.current !== lastMessage.id) {
          replyingToRef.current = lastMessage.id;
          addMessageToSession(sessionId, { id: expectedBotMsgId, role: "assistant", content: "", status: "loading", loadingText: "Connecting to Ultron Core..." });
          
          const fetchChatStream = async () => {
            try {
              updateMessageInSession(sessionId, expectedBotMsgId, { loadingText: "Synthesizing response..." });
              
              const response = await fetch("http://localhost:8000/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: lastMessage.content })
              });
              
              if (!response.body) throw new Error("No response body");
              
              const reader = response.body.getReader();
              const decoder = new TextDecoder("utf-8");
              let fullText = "";
              
              updateMessageInSession(sessionId, expectedBotMsgId, { status: "done", content: "" });

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                fullText += decoder.decode(value, { stream: true });
                updateMessageInSession(sessionId, expectedBotMsgId, { content: fullText });
              }
              
            } catch (error) {
              console.error(error);
              updateMessageInSession(sessionId, expectedBotMsgId, { 
                status: "done", 
                content: "Failed to connect to backend server. Make sure the FastAPI python server is running on localhost:8000.",
                loadingText: undefined
              });
            }
          };

          fetchChatStream();
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, sessionId]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const newFiles = files.map(f => ({ name: f.name, type: f.type }));
      setAttachments(prev => [...prev, ...newFiles]);
      setShowAttachMenu(false);
      
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        
        try {
          const endpoint = "/ingest";
          await fetch(`http://localhost:8000${endpoint}`, {
            method: "POST",
            body: formData,
          });
        } catch (error) {
          console.error("Upload failed", error);
        }
      }
    } else {
      setShowAttachMenu(false);
    }
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

    if (inputText.trim() || attachments.length > 0) {
      const newMessage: Message = { id: Date.now().toString(), role: 'user', content: inputText, attachments: attachments };
      addMessageToSession(sessionId, newMessage);
      setInputText("");
      setAttachments([]);
      setShowSlashMenu(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInputText(val);

    const match = val.match(/(?:\s|^)\/([^\s]*)$/);
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
      // Also add the folder itself if we want
      setAttachments(prev => [...prev, { name: asset.name, type: 'folder' }, ...newAttachments]);
    } else {
      setAttachments(prev => [...prev, { name: asset.name, type: asset.type }]);
    }
    
    setInputText(prev => prev.replace(/(?:\s|^)\/[^\s]*$/, ' '));
    setShowSlashMenu(false);
    setSlashQuery("");
  };

  const handleSnippetSelect = (snippetText: string) => {
    setInputText(prev => prev.replace(/(?:\s|^)\/[^\s]*$/, snippetText + ' '));
    setShowSlashMenu(false);
    setSlashQuery("");
  };

  return (
    <div className="flex-1 flex flex-col h-full relative" onClick={() => { setShowAttachMenu(false); setShowModelMenu(false); setShowSlashMenu(false); }}>
      
      {/* Top Header */}
      <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-[#030303]/80 backdrop-blur-md sticky top-0 z-10">
        <h2 className="font-bold text-sm text-white/90 truncate cursor-pointer hover:text-white transition-colors">
          {session?.title || "New Chat"}
        </h2>
        <div className="flex items-center gap-3">
          <div className="bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-white/50 uppercase tracking-wider">
            Log Analysis
          </div>
          <div className="bg-[#3b82f6]/10 border border-[#3b82f6]/20 px-2 py-1 rounded text-[10px] font-bold text-[#3b82f6] font-mono">
            Llama-3-8B-Local
          </div>
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 overflow-y-auto p-6 no-scrollbar relative">
        {/* Ambient Glowing Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00f0ff]/5 rounded-full blur-[120px] pointer-events-none opacity-50 animate-pulse" />
        
        <div className="max-w-4xl mx-auto space-y-10 pb-10 relative z-10 pt-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.role === 'assistant' && (
                <div className="w-10 h-10 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0 mr-4 shadow-[0_0_15px_rgba(0,240,255,0.15)] relative">
                  <div className="absolute inset-0 bg-[#00f0ff]/20 rounded-xl animate-pulse blur-md" />
                  <BrainCircuit className="w-5 h-5 text-[#00f0ff] relative z-10" />
                </div>
              )}

              <div className={`${
                msg.role === 'user' 
                  ? 'bg-gradient-to-tr from-[#00f0ff] to-blue-600 text-black px-6 py-4 rounded-3xl rounded-tr-sm max-w-[80%] shadow-[0_0_25px_rgba(0,240,255,0.25)] font-medium' 
                  : 'bg-black/40 backdrop-blur-2xl border border-white/10 text-white/90 px-6 py-5 rounded-3xl rounded-tl-sm max-w-[85%] shadow-[0_10px_40px_rgba(0,0,0,0.5)]'
              }`}>
                {msg.status === 'loading' ? (
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-5 h-5 text-[#00f0ff] animate-spin" />
                    <span className="text-sm text-[#00f0ff] font-mono animate-pulse tracking-wide">{msg.loadingText}</span>
                  </div>
                ) : (
                  <>
                    {(() => {
                      const fileMatch = msg.content.match(/\n\nFile: (.*)$/);
                      const textContent = fileMatch ? msg.content.replace(fileMatch[0], '') : msg.content;
                      const generatedFile = fileMatch ? fileMatch[1] : null;
                      const fileName = generatedFile ? generatedFile.split(/[/\\]/).pop() || "Document" : "";

                      return (
                        <>
                          <p className={`text-[15px] leading-relaxed mb-1 ${msg.role === 'user' ? 'text-black/90' : 'text-white/80 font-light tracking-wide whitespace-pre-wrap'}`}>{textContent}</p>
                          {generatedFile && (
                            <div className="bg-[#030303] border border-[#00f0ff]/30 rounded-xl p-4 flex flex-col gap-4 mt-4 hover:border-[#00f0ff] transition-colors group relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00f0ff]/5 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#00f0ff]/10 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                                    <FileText className="w-5 h-5 text-[#00f0ff]" />
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-bold text-white group-hover:text-[#00f0ff] transition-colors truncate max-w-[200px]" title={fileName}>{fileName}</div>
                                    <div className="text-[10px] text-white/40 uppercase tracking-wider font-bold">Generated Artifact</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => {
                                      useAppStore.getState().addAsset({
                                        id: Date.now().toString(),
                                        name: fileName,
                                        type: "document",
                                        size: "--",
                                        date: "Just now",
                                        status: "Saved",
                                      });
                                    }} 
                                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-white/70 hover:text-white hover:border-white/30 transition-all flex items-center gap-2 whitespace-nowrap"
                                  >
                                    <Folder className="w-3.5 h-3.5" /> Save to Assets
                                  </button>
                                  <a href={`http://localhost:8000/download?path=${encodeURIComponent(generatedFile)}`} download className="w-8 h-8 rounded-full bg-[#00f0ff]/10 flex items-center justify-center hover:bg-[#00f0ff]/20 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all shrink-0">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.attachments.map((file, idx) => (
                          <div key={idx} className="bg-white/10 rounded px-2 py-1 flex items-center gap-1.5 text-xs">
                            <FileUp className="w-3 h-3" /> {file.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

        </div>
      </div>

      {/* Input Area */}
      <div className="p-6 bg-gradient-to-t from-[#030303] via-[#030303] to-transparent w-full shrink-0 relative z-20">
        <div className="max-w-4xl mx-auto">
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
            <div className="absolute inset-[1px] bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-[15px] pointer-events-none border border-white/10" />

            {/* Content Container (Not clipped, allows popups) */}
            <div className="relative z-10 flex flex-col p-3">
            
            {/* Attached Files Display */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-2 mb-2 border-b border-white/5">
                {attachments.map((file, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-[#00f0ff]/10 flex items-center justify-center shrink-0">
                      <FileUp className="w-3.5 h-3.5 text-[#00f0ff]" />
                    </div>
                    <span className="text-xs text-white/80 max-w-[120px] truncate">{file.name}</span>
                    <button 
                      onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                      className="text-white/40 hover:text-red-400 ml-1 transition-colors"
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
                    className="p-3.5 text-white/40 hover:text-[#00f0ff] transition-colors rounded-xl hover:bg-[#00f0ff]/10"
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
                      className="absolute bottom-full left-0 mb-2 w-56 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                      onClick={e => e.stopPropagation()}
                    >
                      <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-white/80 hover:bg-white/5 transition-colors">
                        <FileUp className="w-4 h-4 text-white/40" /> Add files or documents
                      </button>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-3 text-xs text-white/80 hover:bg-white/5 transition-colors">
                        <ImageIcon className="w-4 h-4 text-white/40" /> Add photos
                      </button>
                      <div className="h-px bg-white/5 my-1" />
                      <button className="w-full flex items-center gap-3 px-4 py-3 text-xs text-white/80 hover:bg-white/5 transition-colors">
                        <Globe className="w-4 h-4 text-white/40" /> Web search
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
                    className="absolute bottom-full left-0 mb-2 w-72 max-h-64 overflow-y-auto no-scrollbar bg-[#0a0a0a] border border-[#00f0ff]/30 rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.1)] py-2 z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-4 py-2 text-xs font-bold text-[#00f0ff] uppercase tracking-wider border-b border-white/5 mb-1 mt-2">
                      Attach Asset or Folder
                    </div>
                    {assets.filter(a => a.name.toLowerCase().includes(slashQuery.toLowerCase())).length === 0 ? (
                      <div className="px-4 py-3 text-xs text-white/40">No matching assets found.</div>
                    ) : (
                      assets.filter(a => a.name.toLowerCase().includes(slashQuery.toLowerCase())).map(asset => (
                        <button 
                          key={asset.id}
                          onClick={() => handleSlashSelect(asset)}
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors text-left"
                        >
                          {asset.isFolder ? <Folder className="w-4 h-4 text-blue-400 shrink-0" /> : <FileText className="w-4 h-4 text-white/40 shrink-0" />}
                          <span className="truncate">{asset.name}</span>
                          <span className="text-[10px] text-white/30 ml-auto shrink-0">{asset.isFolder ? 'Folder' : asset.type}</span>
                        </button>
                      ))
                    )}

                    <div className="px-4 py-2 text-xs font-bold text-[#00f0ff] uppercase tracking-wider border-b border-white/5 mb-1 mt-2">
                      Quick Snippets
                    </div>
                    {COMMAND_SNIPPETS.filter(s => s.command.toLowerCase().includes(slashQuery.toLowerCase())).map(snippet => (
                      <button 
                        key={snippet.id}
                        onClick={() => handleSnippetSelect(snippet.text)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="w-5 h-5 rounded bg-[#00f0ff]/10 flex items-center justify-center shrink-0 border border-[#00f0ff]/20">
                          <span className="text-[#00f0ff] font-mono text-[10px]">/</span>
                        </div>
                        <span className="font-medium truncate">{snippet.command}</span>
                        <span className="text-[10px] text-white/40 ml-auto shrink-0">{snippet.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            
              <textarea 
                placeholder="Query the local enclave... (Type '/' for assets)" 
                value={inputText}
                onChange={handleInputChange}
                onPaste={handlePaste}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                  className="flex-1 bg-transparent text-white placeholder:text-white/30 resize-none outline-none py-4 px-4 max-h-32 no-scrollbar min-h-[56px] text-[17px] font-light leading-relaxed"
                rows={1}
              />
                <div className="relative flex items-center ml-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowModelMenu(!showModelMenu); }}
                    className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl transition-all h-[50px]"
                  >
                    <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest hidden sm:inline">Model:</span>
                    <span className="text-xs text-white font-mono font-bold">Drone 1</span>
                    <ChevronDown className="w-3 h-3 text-white/40" />
                  </button>

                  <AnimatePresence>
                    {showModelMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full right-0 mb-2 w-48 bg-[#0a0a0a] border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 z-50"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="px-4 py-2 text-[10px] font-bold text-white/30 uppercase tracking-wider bg-white/5 border-b border-white/5">Available Models</div>
                        <button className="w-full text-left px-4 py-3 text-xs font-bold text-white hover:bg-white/5 transition-colors flex items-center justify-between">
                          Drone 1 <div className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] shadow-[0_0_8px_#00f0ff]" />
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={handleSend}
                  className={`h-[50px] px-5 rounded-xl transition-all ml-2 flex shrink-0 items-center justify-center group/btn overflow-hidden relative ${inputText.trim() || attachments.length > 0 ? 'bg-gradient-to-r from-[#00f0ff] to-blue-600 text-black hover:shadow-[0_0_20px_rgba(0,240,255,0.5)] hover:scale-105' : 'bg-white/5 text-white/30'}`}
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
