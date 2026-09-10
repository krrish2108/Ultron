"use client";

import { motion, useInView, AnimatePresence, Variants } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Brain, Zap, ScanEye, Lock, Terminal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Terminal Trace Examples
const TRACES = [
  [
    { type: 'info', text: '[System] Initiating secure enclave...' },
    { type: 'input', text: 'User: Extract defect codes from scan_001.pdf' },
    { type: 'action', text: '> Router assigning task to LLaVA-1.5 (Multimodal)' },
    { type: 'plan', text: 'PLAN: 1. Ingest Image 2. OCR 3. Extract Codes' },
    { type: 'act', text: 'ACT: Calling tool `ingest_image`...' },
    { type: 'observe', text: 'OBSERVE: {"text": "DEFECT-CODE: VLV-X99"}' },
    { type: 'done', text: 'Task Complete. Air-gap integrity: 100%' }
  ],
  [
    { type: 'info', text: '[System] Booting local Python sandbox...' },
    { type: 'input', text: 'User: Plot latency distribution from telemetry.csv' },
    { type: 'action', text: '> Router assigning task to CodeLlama-7B' },
    { type: 'plan', text: 'PLAN: 1. Read CSV 2. Generate Matplotlib script 3. Execute' },
    { type: 'act', text: 'ACT: Executing script in air-gapped sandbox...' },
    { type: 'observe', text: 'OBSERVE: plot_output.png generated successfully.' },
    { type: 'done', text: 'Task Complete. Zero data egress verified.' }
  ],
  [
    { type: 'info', text: '[System] Activating document ingestion pipeline...' },
    { type: 'input', text: 'User: Summarize the Q3 Report compliance risks' },
    { type: 'action', text: '> Router assigning task to Mistral-8x7B (Context-Heavy)' },
    { type: 'plan', text: 'PLAN: 1. Parse PDF 2. Vectorize chunks 3. RAG Retrieval' },
    { type: 'act', text: 'ACT: Retrieving risk factors from local chromaDB...' },
    { type: 'observe', text: 'OBSERVE: Found 3 high-risk non-compliance clauses.' },
    { type: 'done', text: 'Task Complete. Local memory updated.' }
  ],
  [
    { type: 'info', text: '[System] Initializing static analysis module...' },
    { type: 'input', text: 'User: Review AuthController.ts for vulnerabilities' },
    { type: 'action', text: '> Router assigning task to DeepSeek-Coder' },
    { type: 'plan', text: 'PLAN: 1. Read file 2. AST parsing 3. Vulnerability check' },
    { type: 'act', text: 'ACT: Scanning AST for injection patterns...' },
    { type: 'observe', text: 'OBSERVE: Warning - Unsanitized input at line 42.' },
    { type: 'done', text: 'Task Complete. Code remains on-device.' }
  ],
  [
    { type: 'info', text: '[System] Network isolation verified.' },
    { type: 'input', text: 'User: Generate a regex to parse machine logs' },
    { type: 'action', text: '> Router assigning task to Llama-3-8B' },
    { type: 'plan', text: 'PLAN: 1. Analyze log structure 2. Formulate regex' },
    { type: 'act', text: 'ACT: Formulating PCRE compatible regex string...' },
    { type: 'observe', text: 'OBSERVE: ^\\[(?<date>.*)\\] (?<lvl>\\w+): (?<msg>.*)$' },
    { type: 'done', text: 'Task Complete. Prompt secured locally.' }
  ],
  [
    { type: 'info', text: '[System] Accessing secure database enclave...' },
    { type: 'input', text: 'User: Query the employee registry for Department 4' },
    { type: 'action', text: '> Router assigning task to SQLCoder-7B' },
    { type: 'plan', text: 'PLAN: 1. Map schema 2. Generate SQL 3. Execute locally' },
    { type: 'act', text: 'ACT: Executing `SELECT * FROM registry WHERE dept_id=4`' },
    { type: 'observe', text: 'OBSERVE: 14 rows returned. PII redacted.' },
    { type: 'done', text: 'Task Complete. No external DB connection made.' }
  ]
];

// Terminal Trace Component cycling through 6 examples
const TerminalTrace = () => {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });
  
  const [currentTraceIndex, setCurrentTraceIndex] = useState(0);
  const [activeTraceLine, setActiveTraceLine] = useState(0);

  useEffect(() => {
    if (isInView) {
      const currentTrace = TRACES[currentTraceIndex];
      
      if (activeTraceLine < currentTrace.length) {
        const timer = setTimeout(() => {
          setActiveTraceLine(prev => prev + 1);
        }, 800); 
        return () => clearTimeout(timer);
      } else {
        // Trace is complete, wait 3 seconds then start next trace
        const resetTimer = setTimeout(() => {
          setActiveTraceLine(0);
          setCurrentTraceIndex((prev) => (prev + 1) % TRACES.length);
        }, 3000);
        return () => clearTimeout(resetTimer);
      }
    }
  }, [isInView, activeTraceLine, currentTraceIndex]);

  const activeLines = TRACES[currentTraceIndex].slice(0, activeTraceLine);

  return (
    <div ref={containerRef} className="w-full rounded-2xl bg-[#09090b]/80 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden font-mono text-sm relative z-20 transition-transform duration-500 hover:scale-[1.02]">
      
      {/* MacOS style traffic lights */}
      <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.5)]"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
        </div>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-muted-foreground/70" />
          <span className="text-muted-foreground/70 text-xs font-semibold tracking-wider">Live Trace ({currentTraceIndex + 1}/6)</span>
        </div>
        <div className="w-16" /> {/* Spacer for centering */}
      </div>

      <div className="p-6 space-y-4 min-h-[360px]">
        <AnimatePresence mode="popLayout">
          {activeLines.map((line, i) => (
            <motion.div 
              key={`${currentTraceIndex}-${i}`} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className={`
                ${line.type === 'plan' ? 'text-amber-400' : ''}
                ${line.type === 'act' ? 'text-[#00f0ff]' : ''}
                ${line.type === 'observe' ? 'text-emerald-400' : ''}
                ${line.type === 'input' ? 'text-white font-medium' : ''}
                ${line.type === 'info' ? 'text-muted-foreground' : ''}
                ${line.type === 'action' ? 'text-blue-400/80' : ''}
                ${line.type === 'done' ? 'text-[#00f0ff] font-bold mt-6 flex items-center gap-2' : ''}
              `}
            >
              {line.type === 'done' && <Sparkles className="w-4 h-4" />}
              {line.text}
            </motion.div>
          ))}
        </AnimatePresence>
        
        {activeTraceLine < TRACES[currentTraceIndex].length && isInView && (
          <div className="w-2.5 h-5 bg-[#00f0ff] animate-pulse inline-block align-middle ml-1 shadow-[0_0_10px_#00f0ff]" />
        )}
      </div>
    </div>
  );
};

export default function LandingPage() {
  const stagger: Variants = {
    animate: { transition: { staggerChildren: 0.15 } }
  };
  const fadeInUp: Variants = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <div className="min-h-screen bg-[#030303] text-foreground selection:bg-[#00f0ff]/30 flex flex-col font-sans">
      
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-[#030303]/70 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] border border-white/10">
              <Image src="/logo.jpeg" alt="Ultron Logo" width={40} height={40} className="w-full h-full object-cover" suppressHydrationWarning />
            </div>
            <span className="font-extrabold text-xl tracking-widest text-white">ULTRON</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <Link href="/login">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/10 hover:border-white/20 rounded-full px-6 transition-all duration-300 relative overflow-hidden group">
                <span className="relative z-10">Login</span>
                <div className="absolute inset-0 bg-[#00f0ff]/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative w-full pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden flex-1 flex flex-col justify-center">
        {/* Dynamic Abstract Background Blobs */}
        <motion.div 
          animate={{ x: [0, 50, 0], y: [0, -50, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" 
        />
        <motion.div 
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-[#00f0ff]/10 rounded-full blur-[120px] pointer-events-none" 
        />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Column: Text */}
            <motion.div 
              initial="initial" animate="animate" variants={stagger}
              className="flex flex-col items-center lg:items-start text-center lg:text-left"
            >
              <motion.div variants={fadeInUp} className="inline-flex items-center rounded-full border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-4 py-1.5 text-xs font-semibold text-[#00f0ff] mb-8 backdrop-blur-md shadow-[0_0_20px_rgba(0,240,255,0.1)]">
                <Sparkles className="w-3 h-3 mr-2" />
                SIH 2026 &middot; PS 26117
              </motion.div>
              
              <motion.h1 variants={fadeInUp} className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                Sovereignty you can <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f0ff] to-blue-500">watch happen.</span>
              </motion.h1>
              
              <motion.p variants={fadeInUp} className="text-lg md:text-xl text-white/60 max-w-xl mb-12 font-light leading-relaxed">
                An air-gapped, multi-model agentic assistant designed specifically for confidential industrial knowledge work.
              </motion.p>
              
              <motion.div variants={fadeInUp}>
                <Link href="/login">
                  <Button size="lg" className="bg-gradient-to-r from-[#00f0ff] to-blue-600 text-black font-bold hover:opacity-90 px-10 py-7 text-lg rounded-full group transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(0,240,255,0.4)] border border-white/20 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative z-10 flex items-center">
                      Enter Workbench
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Column: Terminal Trace */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, rotateY: 10 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
              style={{ perspective: 1000 }}
              className="w-full max-w-xl mx-auto lg:mx-0 lg:ml-auto"
            >
              <TerminalTrace />
            </motion.div>

          </div>
        </div>
      </section>

      {/* Stat Strip */}
      <section className="relative z-20 -mt-10">
        <div className="container mx-auto px-6">
          <div className="bg-[#111]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Subtle inner grid glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#00f0ff15,transparent_50%)]" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-white/10 relative z-10">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col items-center justify-center pt-4 md:pt-0">
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-[#00f0ff] to-[#00f0ff]/50 mb-2">₹0</div>
                <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Capital Expenditure</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex flex-col items-center justify-center pt-4 md:pt-0">
                <div className="text-5xl font-extrabold text-white mb-2">8GB</div>
                <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Minimum VRAM</div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="flex flex-col items-center justify-center pt-4 md:pt-0">
                <div className="text-5xl font-extrabold text-emerald-400 mb-2">100%</div>
                <div className="text-xs font-bold text-white/50 uppercase tracking-widest">Air-Gapped</div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Claims Grid */}
      <section className="py-32 px-6 bg-[#030303] relative overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white">Built for true independence.</h2>
            <p className="text-lg text-white/60 max-w-2xl mx-auto font-light">
              We did not just wrap an API. We built a localized agentic loop that dynamically routes requests without ever pinging the open internet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }}>
              <Card className="group h-full p-8 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 rounded-3xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-[#00f0ff] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-[0_0_15px_rgba(0,240,255,0.1)]">
                  <Brain className="w-7 h-7 text-[#00f0ff]" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-white group-hover:text-[#00f0ff] transition-colors">Multi-Model</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Dynamically routes tasks to specialized open-weight models based on complexity and requirements.
                </p>
              </Card>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.1 }}>
              <Card className="group h-full p-8 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 rounded-3xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-[0_0_15px_rgba(251,191,36,0.1)]">
                  <Zap className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-white group-hover:text-amber-400 transition-colors">Agentic Loop</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Not a simple chatbot. Real plan-act-observe loops using explicit state graphs and tool execution.
                </p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.2 }}>
              <Card className="group h-full p-8 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 rounded-3xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-[0_0_15px_rgba(52,211,153,0.1)]">
                  <ScanEye className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-white group-hover:text-emerald-400 transition-colors">Multimodal</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  On-device layout-aware OCR and vision-language capabilities for scanned engineering documents.
                </p>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: 0.3 }}>
              <Card className="group h-full p-8 bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-500 rounded-3xl relative overflow-hidden backdrop-blur-sm">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-500 shadow-[0_0_15px_rgba(129,140,248,0.1)]">
                  <Lock className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="font-bold text-xl mb-3 text-white group-hover:text-indigo-400 transition-colors">Provably Air-Gapped</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  Verifiable zero-egress architecture proven live via real-time network and tool monitoring.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-white/5 bg-[#030303] text-center relative z-10">
        <p className="text-white/30 text-sm">Ultron AI Workbench &copy; 2026. Built for SIH PS-26117.</p>
      </footer>

    </div>
  );
}
