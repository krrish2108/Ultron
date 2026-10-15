"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Puzzle, Plus, Search, ShieldCheck, Download, Trash2, 
  ExternalLink, Check, Code, X, CheckCircle2, Lock, Cpu, Server, 
  Terminal, RefreshCw, AlertCircle
} from "lucide-react";
import { useAppStore, MCPPlugin } from "@/store/useAppStore";

export function MCPPluginsMarketplace() {
  const plugins = useAppStore(state => state.plugins);
  const togglePlugin = useAppStore(state => state.togglePlugin);
  const installPlugin = useAppStore(state => state.installPlugin);
  const uninstallPlugin = useAppStore(state => state.uninstallPlugin);
  const addCustomPlugin = useAppStore(state => state.addCustomPlugin);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedForManifest, setSelectedForManifest] = useState<MCPPlugin | null>(null);
  const [isInstallingId, setIsInstallingId] = useState<string | null>(null);

  // Custom Manifest Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState<MCPPlugin["category"]>("bridge");
  const [customDesc, setCustomDesc] = useState("");
  const [customVersion, setCustomVersion] = useState("v1.0.0");
  const [customAuthor, setCustomAuthor] = useState("Local Engineering Team");
  const [customEndpoints, setCustomEndpoints] = useState("stdio://python -m custom_mcp_tool");
  const [customPermissions, setCustomPermissions] = useState("Zero-Network WAN Egress, Local Loopback Only");

  const installedCount = plugins.filter(p => p.installed).length;
  const activeCount = plugins.filter(p => p.installed && p.enabled).length;

  const filteredPlugins = plugins.filter(plugin => {
    const matchesCategory = activeCategory === "all" || plugin.category === activeCategory;
    const matchesSearch = !searchQuery || 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleInstallClick = (pluginId: string) => {
    setIsInstallingId(pluginId);
    setTimeout(() => {
      installPlugin(pluginId);
      setIsInstallingId(null);
    }, 600);
  };

  const handleCreateCustomPlugin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const endpoints = customEndpoints.split(",").map(e => e.trim()).filter(Boolean);
    const perms = customPermissions.split(",").map(p => p.trim()).filter(Boolean);

    const created: MCPPlugin = {
      id: `plugin-custom-${Date.now()}`,
      name: customName.trim(),
      category: customCategory,
      description: customDesc.trim() || "Custom enterprise Model Context Protocol bundle.",
      version: customVersion.trim() || "v1.0.0",
      author: customAuthor.trim() || "Local Enclave",
      installed: true,
      enabled: true,
      airGapVerified: true,
      endpoints: endpoints.length > 0 ? endpoints : ["stdio://local_custom_tool"],
      permissions: perms.length > 0 ? perms : ["Zero-Network WAN Egress"]
    };

    addCustomPlugin(created);
    setIsUploadOpen(false);
    // Reset fields
    setCustomName("");
    setCustomDesc("");
    setCustomEndpoints("stdio://python -m custom_mcp_tool");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-500/10 via-primary/5 to-transparent border border-primary/20 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/20 text-primary">
              <Puzzle className="w-5 h-5" />
            </div>
            <h2 className="text-base font-bold text-foreground tracking-wide">
              Sovereign MCP Plugin Bundles
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/15 text-primary border border-primary/30 uppercase tracking-wider">
              VERIFIED SOVEREIGN PLUGINS
            </span>
          </div>
          <p className="text-xs text-muted-foreground/80 max-w-xl leading-relaxed">
            Modular Model Context Protocol (MCP) tool packs and air-gap containerized sidecars extending Ultron with specialized hardware telemetry, industrial drivers, and secure sandboxes.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-all shadow-md shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Install Local MCP Bundle</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>INSTALLED PLUGINS</span>
            <Puzzle className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            {installedCount} <span className="text-xs font-normal text-muted-foreground">/ {plugins.length}</span>
          </div>
          <span className="text-[10px] text-primary font-mono mt-0.5">{activeCount} Currently Active</span>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>SANDBOX CGROUPS</span>
            <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            v2 <span className="text-xs font-normal text-muted-foreground">Hardened</span>
          </div>
          <span className="text-[10px] text-green-400 font-mono mt-0.5">Zero WAN Leak Guarantee</span>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>DISCOVERABLE TOOLS</span>
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            32+ <span className="text-xs font-normal text-muted-foreground">Callable</span>
          </div>
          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">Callable by Supervisor</span>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>PROTOCOL INTEGRITY</span>
            <Server className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="text-xl font-bold font-mono text-foreground mt-1">
            mTLS <span className="text-xs font-normal text-muted-foreground">v1.3</span>
          </div>
          <span className="text-[10px] text-primary font-mono mt-0.5">Air-Gap Loopback IPC</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-accent/30 border border-border/60 overflow-x-auto no-scrollbar">
          {(
            [
              { id: "all", label: "All Plugins" },
              { id: "bridge", label: "SCADA Bridges" },
              { id: "storage", label: "Historian Storage" },
              { id: "sandbox", label: "Isolation Sandbox" },
              { id: "protocol", label: "Protocols & Serial" },
              { id: "analytics", label: "Analytics" }
            ] as const
          ).map(tab => {
            const count = tab.id === "all" ? plugins.length : plugins.filter(p => p.category === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  activeCategory === tab.id
                    ? "bg-primary text-black font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                  activeCategory === tab.id ? "bg-black/20 text-black font-bold" : "bg-white/10 text-muted-foreground"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search plugin or driver..."
            className="w-full bg-accent/30 border border-border/60 focus:border-primary/60 rounded-xl pl-8 pr-8 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Plugins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPlugins.map(plugin => {
          const isInstalling = isInstallingId === plugin.id;

          return (
            <div
              key={plugin.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between bg-card/80 ${
                plugin.installed && plugin.enabled
                  ? "border-border/80 hover:border-primary/50 shadow-sm"
                  : "border-border/40 opacity-70 hover:opacity-90"
              }`}
            >
              <div>
                {/* Header: Title + Version + Author */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-semibold text-foreground tracking-wide">
                        {plugin.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-accent border border-border/60 text-muted-foreground">
                        {plugin.version}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground/80">
                      By {plugin.author} • <span className="capitalize">{plugin.category}</span>
                    </span>
                  </div>

                  {plugin.installed && (
                    <button
                      onClick={() => togglePlugin(plugin.id)}
                      className={`w-8 h-4 rounded-full transition-colors relative flex items-center shrink-0 ${
                        plugin.enabled ? "bg-primary" : "bg-muted"
                      }`}
                      title={plugin.enabled ? "Disable plugin" : "Enable plugin"}
                    >
                      <div className={`w-3 h-3 rounded-full bg-background transition-transform ${
                        plugin.enabled ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                  {plugin.description}
                </p>

                {/* Endpoints & Security Badges */}
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-primary/80 truncate">
                    <Lock className="w-3 h-3 text-primary/60 shrink-0" />
                    <span className="truncate">{plugin.endpoints[0]}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {plugin.permissions.map((perm, i) => (
                      <span
                        key={i}
                        className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 border border-border/60 text-muted-foreground/90"
                      >
                        {perm}
                      </span>
                    ))}
                    {plugin.airGapVerified && (
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-green-500/10 border border-green-500/30 text-green-400 font-bold">
                        ✓ Air-Gap Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <button
                  onClick={() => setSelectedForManifest(plugin)}
                  className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-primary transition-colors"
                >
                  <Code className="w-3 h-3" />
                  <span>Inspect Manifest</span>
                </button>

                <div className="flex items-center gap-2">
                  {plugin.installed ? (
                    <button
                      onClick={() => uninstallPlugin(plugin.id)}
                      className="px-2.5 py-1 rounded-lg bg-accent hover:bg-red-500/15 text-muted-foreground hover:text-red-400 text-xs transition-colors"
                    >
                      Uninstall
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstallClick(plugin.id)}
                      disabled={isInstalling}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-all shadow-sm"
                    >
                      {isInstalling ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Installing...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>Install Plugin</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredPlugins.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-8 rounded-xl border border-dashed border-border/80 bg-background/30 text-center">
            <Search className="w-8 h-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm font-semibold text-foreground">No plugins found</p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              {searchQuery ? `No plugins match "${searchQuery}".` : "No plugins available under this category."}
            </p>
            <div className="flex gap-2">
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="px-3 py-1.5 rounded-lg bg-accent text-xs hover:bg-accent/80 text-foreground transition-colors">
                  Clear Search
                </button>
              )}
              <button onClick={() => setIsUploadOpen(true)} className="px-3 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-colors">
                + Install Local MCP Bundle
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Manifest Modal */}
      <AnimatePresence>
        {selectedForManifest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">MCP Manifest Definition</h3>
                    <span className="text-[10px] font-mono text-muted-foreground">{selectedForManifest.name} ({selectedForManifest.version})</span>
                  </div>
                </div>
                <button onClick={() => setSelectedForManifest(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="text-[10px] uppercase text-muted-foreground/70">JSON-RPC / stdio Manifest:</div>
                <pre className="p-3 rounded-lg bg-black/90 border border-border/70 text-green-400 text-[11px] overflow-x-auto custom-scrollbar max-h-72 leading-relaxed">
                  {JSON.stringify({
                    schema_version: "2024-11-05",
                    plugin_id: selectedForManifest.id,
                    name: selectedForManifest.name,
                    version: selectedForManifest.version,
                    author: selectedForManifest.author,
                    category: selectedForManifest.category,
                    air_gap_certified: selectedForManifest.airGapVerified,
                    protocol: "Model Context Protocol (stdio/IPC)",
                    transport_endpoints: selectedForManifest.endpoints,
                    security_enclave: {
                      sandbox: "Docker cgroup v2 / seccomp",
                      allow_outbound_wan: false,
                      enforce_mtls: true,
                      permissions: selectedForManifest.permissions
                    }
                  }, null, 2)}
                </pre>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setSelectedForManifest(null)}
                  className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Upload / Install Custom Bundle Modal */}
      <AnimatePresence>
        {isUploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-card border border-border rounded-xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Puzzle className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Install Custom MCP Bundle</h3>
                </div>
                <button onClick={() => setIsUploadOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCustomPlugin} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Bundle / Plugin Name</label>
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Beckhoff TwinCAT ADS Bridge"
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-3 py-2 text-foreground outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1">Category</label>
                    <select
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value as any)}
                      style={{ colorScheme: "dark" }}
                      className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-2.5 py-2 text-foreground outline-none text-xs cursor-pointer"
                    >
                      <option value="bridge" className="bg-[#0d1527] text-slate-100 py-1.5">SCADA Bridge</option>
                      <option value="storage" className="bg-[#0d1527] text-slate-100 py-1.5">Historian Storage</option>
                      <option value="sandbox" className="bg-[#0d1527] text-slate-100 py-1.5">Isolation Sandbox</option>
                      <option value="protocol" className="bg-[#0d1527] text-slate-100 py-1.5">Serial / Fieldbus</option>
                      <option value="analytics" className="bg-[#0d1527] text-slate-100 py-1.5">Industrial Analytics</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-muted-foreground block mb-1">Version</label>
                    <input
                      type="text"
                      value={customVersion}
                      onChange={(e) => setCustomVersion(e.target.value)}
                      placeholder="v1.0.0"
                      className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-3 py-2 font-mono text-foreground outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Author / Organization</label>
                  <input
                    type="text"
                    value={customAuthor}
                    onChange={(e) => setCustomAuthor(e.target.value)}
                    placeholder="e.g. Plant SCADA Team"
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-3 py-2 text-foreground outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="e.g. Interfaces Beckhoff PLC symbol tables over ADS loopback socket."
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg p-2.5 text-foreground outline-none text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Transport Endpoints (comma separated)</label>
                  <input
                    type="text"
                    required
                    value={customEndpoints}
                    onChange={(e) => setCustomEndpoints(e.target.value)}
                    placeholder="e.g. stdio://python -m ads_mcp_bridge"
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-3 py-2 font-mono text-[11px] text-foreground outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Security Permissions</label>
                  <input
                    type="text"
                    value={customPermissions}
                    onChange={(e) => setCustomPermissions(e.target.value)}
                    placeholder="e.g. Zero-Network WAN Egress, Read-Only Symbol Memory"
                    className="w-full bg-[#0d1527] border border-border/80 focus:border-primary rounded-lg px-3 py-2 text-foreground outline-none text-xs font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => setIsUploadOpen(false)}
                    className="px-3 py-1.5 rounded-lg bg-accent text-muted-foreground hover:text-foreground text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-primary text-black font-semibold text-xs hover:bg-primary/90 shadow-md"
                  >
                    Install Bundle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
