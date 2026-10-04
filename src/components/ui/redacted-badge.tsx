"use client";

import { useState } from "react";
import { Lock, Unlock, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function RedactedBadge({ type, children }: { type: string, children: React.ReactNode }) {
  const [unlocked, setUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === "1234") {
      setUnlocked(true);
      setShowPin(false);
      setPin("");
      // Re-lock after 10 seconds for security
      setTimeout(() => setUnlocked(false), 10000);
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
      setPin("");
    }
  };

  if (unlocked) {
    return (
      <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1 rounded mx-0.5 font-mono">
        <Unlock className="w-3 h-3" />
        {children}
      </span>
    );
  }

  return (
    <span className="relative inline-block mx-0.5 align-middle group">
      <span 
        onClick={() => setShowPin(true)}
        className="inline-flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/50 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest cursor-pointer transition-colors shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]"
      >
        <AlertTriangle className="w-3 h-3" />
        [REDACTED_{type.toUpperCase()}]
      </span>

      <AnimatePresence>
        {showPin && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 backdrop-blur-xl border border-border rounded-xl shadow-2xl p-3 z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50 pb-2">
              <Lock className="w-3 h-3 text-amber-500" /> Auth Required
            </div>
            <p className="text-[9px] text-white/50 mb-2 leading-tight">Enter supervisor PIN to decrypt {type}. (Hint: 1234)</p>
            <form onSubmit={handleUnlock}>
              <input
                type="password"
                maxLength={4}
                autoFocus
                value={pin}
                onChange={e => setPin(e.target.value)}
                className={`w-full bg-white/5 border ${error ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-white/10 text-white'} rounded p-1.5 text-center tracking-[0.5em] font-mono text-sm outline-none focus:border-primary transition-colors`}
                placeholder="****"
              />
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      
      {showPin && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => { setShowPin(false); setPin(""); }}
        />
      )}
    </span>
  );
}
