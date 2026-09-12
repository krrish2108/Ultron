"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, Cpu, Network, Activity, Server, Database, KeyRound, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type AuthState = "LOGIN" | "SIGNUP" | "RESET" | "OTP";

// OTP Verification Component
const OTPInput = ({ onVerified }: { onVerified: () => void }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    // Only accept numbers
    if (value && !/^\d+$/.test(value)) return;
    
    setIsError(false);
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger verification if all filled
    if (newOtp.every(v => v !== "")) {
      setIsVerifying(true);
      // Simulate network request
      setTimeout(() => {
        setIsVerifying(false);
        const code = newOtp.join("");
        // Simulate failure on '000000' to show retry logic
        if (code === "000000") {
          setIsError(true);
          setTimeout(() => {
            setOtp(["", "", "", "", "", ""]);
            setIsError(false);
            inputRefs.current[0]?.focus();
          }, 1500);
        } else {
          setIsSuccess(true);
          setTimeout(onVerified, 1500);
        }
      }, 1500);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="w-full flex flex-col items-center mt-8">
      <div className="flex gap-3 justify-center mb-6 relative">
        {otp.map((digit, i) => (
          <motion.div
            key={i}
            animate={
              isSuccess 
                ? { scale: [1, 1.2, 1], borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)" }
                : isError
                  ? { x: [0, -10, 10, -10, 10, 0], borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }
                  : isVerifying 
                    ? { 
                        y: [0, -15, 15, -10, 10, 0], 
                        x: [0, 5, -5, 5, -5, 0],
                        rotate: [0, 10, -10, 10, -10, 0],
                        scale: [1, 0.8, 1.1, 0.9, 1] 
                      }
                    : { scale: 1 }
            }
            transition={
              isSuccess ? { duration: 0.5, delay: i * 0.1 } : 
              isError ? { duration: 0.4 } :
              isVerifying ? { duration: 0.4, repeat: Infinity, repeatType: "mirror", delay: i * 0.05 } : 
              { duration: 0.2 }
            }
            className={`w-12 h-14 relative rounded-xl border flex items-center justify-center overflow-hidden transition-colors ${
              isSuccess ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]" : 
              isError ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]" :
              "border-white/20 bg-white/5 focus-within:border-[#00f0ff] focus-within:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
            }`}
          >
            {isVerifying && (
              <div className="absolute inset-0 bg-[#00f0ff]/20 animate-pulse pointer-events-none" />
            )}
            <input
              ref={el => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={isVerifying || isSuccess || isError}
              className="w-full h-full text-center bg-transparent text-white font-mono text-2xl outline-none"
            />
          </motion.div>
        ))}
      </div>
      
      <div className="h-6">
        {isVerifying && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#00f0ff] text-sm font-mono tracking-widest animate-pulse">
            DECRYPTING...
          </motion.p>
        )}
        {isSuccess && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-emerald-400 text-sm font-bold tracking-widest">
            ACCESS GRANTED
          </motion.p>
        )}
        {isError && (
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm font-bold tracking-widest">
            INVALID CODE - RETRY
          </motion.p>
        )}
      </div>
    </div>
  );
};


export default function LoginPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>("LOGIN");
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [authContext, setAuthContext] = useState<"signup" | "reset">("signup"); // Knowing where OTP came from
  const [signupId, setSignupId] = useState("");
  const [signupError, setSignupError] = useState("");

  // Simulated taken IDs
  const takenIds = ["EMP-8492", "ADMIN-001", "ULTRON-TEST"];

  const handleRegister = () => {
    if (!signupId) return;
    if (takenIds.includes(signupId.toUpperCase())) {
      setSignupError("This Ultron ID is already provisioned.");
      return;
    }
    setSignupError("");
    navigateTo("OTP", "left", "signup");
  };

  const navigateTo = (state: AuthState, dir: "left" | "right", context?: "signup" | "reset") => {
    setDirection(dir);
    setAuthState(state);
    if (context) setAuthContext(context);
  };

  const handleOTPVerified = () => {
    // In a real app, route to the dashboard.
    router.push("/home");
  };

  // Flip animation variants (Snappier with scale)
  const flipVariants = {
    enter: (dir: string) => ({
      rotateY: dir === "left" ? -90 : 90,
      opacity: 0,
      scale: 0.9,
      z: -200
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      z: 0
    },
    exit: (dir: string) => ({
      rotateY: dir === "left" ? 90 : -90,
      opacity: 0,
      scale: 0.9,
      z: -200
    })
  };
  
  const flipTransition = { duration: 0.4, type: "spring" as const, stiffness: 350, damping: 25 };

  return (
    <div className="min-h-screen bg-[#030303] text-foreground selection:bg-[#00f0ff]/30 flex font-sans overflow-hidden">
      
      {/* Left Panel - Auth Forms (40%) */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center px-8 md:px-16 lg:px-20 relative z-10 bg-[#030303]" style={{ perspective: "1500px" }}>
        
        {/* Top Logo - Fixed outside the flip container */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-10 left-8 md:left-16 lg:left-20 flex items-center gap-3 z-50"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.3)] border border-white/10 group-hover:scale-105 transition-transform">
              <Image src="/logo.jpeg" alt="Ultron Logo" width={40} height={40} className="w-full h-full object-cover" suppressHydrationWarning />
            </div>
            <span className="font-extrabold text-xl tracking-widest text-white group-hover:text-[#00f0ff] transition-colors">ULTRON</span>
          </Link>
        </motion.div>

        {/* Form Container with 3D Flip */}
        <div className="relative w-full max-w-md mx-auto mt-20">
          <AnimatePresence mode="wait" custom={direction}>
            
            {/* LOGIN STATE */}
            {authState === "LOGIN" && (
              <motion.div
                key="LOGIN"
                custom={direction}
                variants={flipVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={flipTransition}
                className="w-full"
                style={{ transformStyle: "preserve-3d", transformOrigin: "center" }}
              >
                <div className="mb-10">
                  <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Access Workbench</h1>
                  <p className="text-white/50 font-light text-sm">Enter your credentials to connect to the local enclave.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 relative group">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Ultron ID</label>
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="EMP-8492"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50 focus:border-[#00f0ff] transition-all"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00f0ff]/20 to-transparent opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
                    </div>
                  </div>

                  <div className="space-y-2 relative group">
                    <div className="flex justify-between items-center pr-1">
                      <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Pass Code</label>
                      <button onClick={() => navigateTo("RESET", "right")} className="text-xs text-[#00f0ff] hover:text-white transition-colors">
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type="password" 
                        placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-[#00f0ff]/50 focus:border-[#00f0ff] transition-all font-mono"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#00f0ff]/20 to-transparent opacity-0 group-hover:opacity-10 pointer-events-none transition-opacity" />
                    </div>
                  </div>

                  <Button onClick={() => router.push("/home")} className="w-full bg-gradient-to-r from-[#00f0ff] to-blue-600 text-black font-bold hover:opacity-90 py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(0,240,255,0.3)] hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all group overflow-hidden relative mt-4">
                    <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                    <span className="relative z-10 flex items-center justify-center">
                      Initialize Session
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>

                  <div className="pt-6 text-center">
                    <p className="text-white/40 text-sm">
                      Unregistered node?{' '}
                      <button onClick={() => navigateTo("SIGNUP", "left")} className="text-[#00f0ff] hover:text-white hover:underline transition-colors font-medium">
                        Create an Ultron ID
                      </button>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SIGNUP STATE */}
            {authState === "SIGNUP" && (
              <motion.div
                key="SIGNUP"
                custom={direction}
                variants={flipVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={flipTransition}
                className="w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="mb-8">
                  <button onClick={() => navigateTo("LOGIN", "right")} className="flex items-center text-white/50 hover:text-white text-sm mb-6 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Login
                  </button>
                  <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">Register Node</h1>
                  <p className="text-white/50 font-light text-sm">Provision a new identity within the enclave.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1 relative group">
                    <div className="flex justify-between items-center pr-1">
                      <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Ultron ID</label>
                      {signupError && <span className="text-xs text-red-400">{signupError}</span>}
                    </div>
                    <input 
                      type="text" 
                      placeholder="EMP-NEW" 
                      value={signupId}
                      onChange={(e) => setSignupId(e.target.value)}
                      className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none transition-all ${
                        signupError ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-[#00f0ff]"
                      }`} 
                    />
                  </div>
                  <div className="space-y-1 relative group">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Full Name</label>
                    <input type="text" placeholder="Krish P" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff] transition-all" />
                  </div>
                  <div className="space-y-1 relative group">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Email Node</label>
                    <input type="email" placeholder="krish@company.local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff] transition-all" />
                  </div>
                  <div className="space-y-1 relative group">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Pass Code</label>
                    <input type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-[#00f0ff] transition-all font-mono" />
                  </div>

                  <Button onClick={handleRegister} className="w-full bg-white text-black font-bold hover:bg-gray-200 py-6 text-lg rounded-xl transition-all group overflow-hidden relative mt-6">
                    Generate Identity
                  </Button>
                </div>
              </motion.div>
            )}

            {/* RESET STATE */}
            {authState === "RESET" && (
              <motion.div
                key="RESET"
                custom={direction}
                variants={flipVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={flipTransition}
                className="w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="mb-10">
                  <button onClick={() => navigateTo("LOGIN", "left")} className="flex items-center text-white/50 hover:text-white text-sm mb-6 transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Login
                  </button>
                  <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                    <KeyRound className="w-7 h-7 text-red-400" />
                  </div>
                  <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">System Override</h1>
                  <p className="text-white/50 font-light text-sm">Initiate a secure pass code reset via registered email node.</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2 relative group">
                    <label className="text-xs font-bold text-white/70 uppercase tracking-wider pl-1">Registered Email</label>
                    <input type="email" placeholder="admin@company.local" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all" />
                  </div>

                  <Button onClick={() => navigateTo("OTP", "left", "reset")} className="w-full bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold hover:opacity-90 py-6 text-lg rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.3)] transition-all mt-4">
                    Transmit Override Code
                  </Button>
                </div>
              </motion.div>
            )}

            {/* OTP VERIFICATION STATE */}
            {authState === "OTP" && (
              <motion.div
                key="OTP"
                custom={direction}
                variants={flipVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={flipTransition}
                className="w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="mb-10 text-center">
                  <button onClick={() => navigateTo(authContext === "signup" ? "SIGNUP" : "RESET", "right")} className="absolute top-0 left-0 flex items-center text-white/50 hover:text-white text-sm transition-colors">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,240,255,0.2)] mt-12">
                    <ShieldCheck className="w-8 h-8 text-[#00f0ff]" />
                  </div>
                  <h1 className="text-3xl font-extrabold text-white mb-3 tracking-tight">Security Protocol</h1>
                  <p className="text-white/50 font-light text-sm max-w-xs mx-auto">
                    Enter the 6-digit cryptographic token transmitted to your node.
                  </p>
                </div>

                <OTPInput onVerified={handleOTPVerified} />

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Panel - Visuals (60%) */}
      <div className="hidden lg:flex w-[60%] relative bg-[#0a0a0a] border-l border-white/5 items-center justify-center overflow-hidden">
        
        {/* Animated Background Gradients & Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#00f0ff10,transparent_70%)]" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" 
          />
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full border-dashed opacity-50"
          />
          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 90, repeat: Infinity, ease: "linear" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-[#00f0ff]/10 rounded-full border-dotted opacity-50"
          />
          
          {/* Subtle connecting lines */}
          <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none">
            <line x1="20%" y1="20%" x2="50%" y2="50%" stroke="#00f0ff" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="80%" y1="30%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="4 4" />
            <line x1="70%" y1="80%" x2="50%" y2="50%" stroke="#00f0ff" strokeWidth="0.5" strokeDasharray="4 4" />
            <circle cx="20%" cy="20%" r="4" fill="#00f0ff" />
            <circle cx="80%" cy="30%" r="4" fill="#3b82f6" />
            <circle cx="70%" cy="80%" r="4" fill="#00f0ff" />
          </svg>
        </div>

        {/* Floating Telemetry Badges */}
        <motion.div 
          animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[15%] right-[10%] bg-[#00f0ff]/10 border border-[#00f0ff]/20 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(0,240,255,0.1)]"
        >
          <Activity className="w-4 h-4 text-[#00f0ff]" />
          <div>
            <div className="text-[10px] text-[#00f0ff]/60 uppercase tracking-wider font-bold">Node Status</div>
            <div className="text-sm text-white font-mono">Air-Gapped &middot; Active</div>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-[20%] left-[5%] bg-blue-500/10 border border-blue-500/20 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
        >
          <Server className="w-4 h-4 text-blue-400" />
          <div>
            <div className="text-[10px] text-blue-400/60 uppercase tracking-wider font-bold">Local Compute</div>
            <div className="text-sm text-white font-mono">VRAM: 6.8 / 8.0 GB</div>
          </div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute bottom-[35%] right-[5%] bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-lg px-4 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <div>
            <div className="text-[10px] text-emerald-400/60 uppercase tracking-wider font-bold">Vector Graph</div>
            <div className="text-sm text-white font-mono">14.2M Nodes Indexed</div>
          </div>
        </motion.div>

        {/* Feature Cards Floating (Center) */}
        <div className="relative z-10 w-full max-w-lg">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-extrabold text-white mb-4">Secure. Private. Local.</h2>
            <p className="text-white/60 font-light leading-relaxed">
              Your telemetry, codebase, and IP never leave this machine. The Ultron architecture guarantees 100% data sovereignty.
            </p>
          </motion.div>

          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              whileHover={{ scale: 1.02, x: -10 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-5 cursor-default transition-all shadow-lg"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Air-Gapped Enclave</h3>
                <p className="text-white/50 text-xs leading-relaxed">Zero egress network isolation verified by hypervisor.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              whileHover={{ scale: 1.02, x: -10 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-5 cursor-default transition-all shadow-lg ml-8"
            >
              <div className="w-12 h-12 rounded-xl bg-[#00f0ff]/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <Cpu className="w-6 h-6 text-[#00f0ff]" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Hardware Accelerated</h3>
                <p className="text-white/50 text-xs leading-relaxed">Direct metal access via NPU and integrated graphics.</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              whileHover={{ scale: 1.02, x: -10 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 flex items-center gap-5 cursor-default transition-all shadow-lg ml-16"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Network className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm mb-1">Local RAG Graph</h3>
                <p className="text-white/50 text-xs leading-relaxed">Vectorized memory spanning millions of your documents.</p>
              </div>
            </motion.div>
          </div>
        </div>

      </div>
    </div>
  );
}
