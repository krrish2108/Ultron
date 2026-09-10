"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Box, FileText, FileImage, FileCode, FileArchive, Download, Trash2, Search, UploadCloud, FolderPlus, Folder, ArrowLeft, X } from "lucide-react";

import { useAppStore, Asset } from "@/store/useAppStore";

export default function AssetsPage() {
  const assets = useAppStore(state => state.assets);
  const setAssets = useAppStore(state => state.setAssets);
  const addAsset = useAppStore(state => state.addAsset);
  const deleteAsset = useAppStore(state => state.deleteAsset);

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const currentAssets = assets.filter(a => a.folderId === currentFolderId);
  const currentFolder = assets.find(a => a.id === currentFolderId);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((f, i) => ({
        id: `uploaded-${Date.now()}-${i}`,
        name: f.name,
        type: f.name.split('.').pop() || "unknown",
        size: (f.size / 1024 / 1024).toFixed(1) + " MB",
        date: "Just now",
        status: "Processing",
        folderId: currentFolderId,
        isFolder: false
      }));
      setAssets([...newFiles, ...assets]);
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
                      window.open(`/${asset.name}`, '_blank');
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

    </div>
  );
}
