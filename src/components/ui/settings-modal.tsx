"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { X, Settings, User, Shield, CreditCard, Zap, Brain, Focus, Code, Wrench, Plug, Puzzle, Monitor, Sun, Moon, ChevronDown } from "lucide-react";
import { useState, useRef } from "react";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: Settings },
  { id: "account", label: "Account", icon: User },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "capabilities", label: "Capabilities", icon: Zap },
  { id: "source", label: "Source", icon: Code, comingSoon: true },
];

const CUSTOMIZE_TABS = [
  { id: "skills", label: "Skills", icon: Wrench, comingSoon: true },
  { id: "connectors", label: "Connectors", icon: Plug, comingSoon: true },
  { id: "plugins", label: "Plugins", icon: Puzzle, comingSoon: true },
];

// OTP Verification Component
const OTPInput = ({ onVerified }: { onVerified: () => void }) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return;
    setIsError(false);
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) refs.current[index + 1]?.focus();
    if (newOtp.every(v => v !== "")) {
      setIsVerifying(true);
      setTimeout(() => {
        setIsVerifying(false);
        const code = newOtp.join("");
        if (code === "000000") {
          setIsError(true);
          setTimeout(() => {
            setOtp(["", "", "", "", "", ""]);
            setIsError(false);
            refs.current[0]?.focus();
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
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <div className="w-full flex flex-col items-center mt-4">
      <div className="flex gap-2 justify-center mb-4">
        {otp.map((digit, i) => (
          <motion.div
            key={i}
            animate={
              isSuccess ? { scale: [1, 1.2, 1], borderColor: "#10b981", backgroundColor: "rgba(16,185,129,0.1)" }
                : isError ? { x: [0, -5, 5, -5, 5, 0], borderColor: "#ef4444", backgroundColor: "rgba(239,68,68,0.1)" }
                  : isVerifying ? { y: [0, -5, 5, 0], scale: [1, 0.9, 1.1, 1] }
                    : { scale: 1 }
            }
            className={`w-10 h-12 relative rounded-lg border flex items-center justify-center overflow-hidden transition-colors ${
              isSuccess ? "border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : 
              isError ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]" :
              "border-border bg-accent/50 focus-within:border-primary focus-within:shadow-[0_0_10px_var(--color-primary)]"
            }`}
          >
            {isVerifying && <div className="absolute inset-0 bg-primary/20 animate-pulse pointer-events-none" />}
            <input
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={isVerifying || isSuccess || isError}
              className="w-full h-full text-center bg-transparent text-foreground font-mono text-xl outline-none"
            />
          </motion.div>
        ))}
      </div>
      <div className="h-4">
        {isVerifying && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-primary text-xs font-mono tracking-widest animate-pulse">VERIFYING...</motion.p>}
        {isSuccess && <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-emerald-500 text-xs font-bold tracking-widest">VERIFIED</motion.p>}
        {isError && <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-bold tracking-widest">INVALID CODE</motion.p>}
      </div>
    </div>
  );
};

// Custom Select Component
const CustomSelect = ({ 
  value, 
  onChange, 
  options, 
  className = "" 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: { value: string, label: string }[];
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || "Select";

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-transparent text-sm text-muted-foreground outline-none flex items-center gap-2 hover:text-foreground transition-colors ${className}`}
      >
        {selectedLabel}
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 min-w-[160px] bg-popover border border-border rounded-xl overflow-hidden shadow-2xl z-50 py-1"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${value === opt.value ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export function SettingsModal() {
  const { isSettingsOpen, setSettingsOpen, userSettings, updateUserSettings } = useAppStore();
  const [activeTab, setActiveTab] = useState("general");
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);

  // Email update state
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [showOtpForEmail, setShowOtpForEmail] = useState(false);

  const handleManageSubscription = () => {
    alert("Subscription management is handled via the Stripe portal. Redirecting...");
  };
  
  if (!isSettingsOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setSettingsOpen(false)}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[1000px] h-[80vh] min-h-[600px] bg-card border border-border rounded-2xl shadow-2xl flex overflow-hidden z-10 font-sans"
        >
          {/* Sidebar */}
          <div className="w-[240px] bg-muted/30 border-r border-border p-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            {/* Search */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-muted-foreground/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-6">
              <div>
                <div className="px-3 text-xs font-medium text-muted-foreground mb-2">Settings</div>
                <nav className="space-y-0.5" onMouseLeave={() => setHoveredTab(null)}>
                  {SETTINGS_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onMouseEnter={() => setHoveredTab(tab.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {activeTab === tab.id && (
                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-accent rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {hoveredTab === tab.id && activeTab !== tab.id && (
                        <motion.div layoutId="hoverTab" className="absolute inset-0 bg-accent/50 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      <tab.icon className="w-4 h-4 opacity-70 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                      {(tab as any).comingSoon && (
                        <span className="ml-auto text-[8px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded relative z-10">Soon</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div>
                <div className="px-3 text-xs font-medium text-muted-foreground/70 mb-2">Customize</div>
                <nav className="space-y-0.5" onMouseLeave={() => setHoveredTab(null)}>
                  {CUSTOMIZE_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onMouseEnter={() => setHoveredTab(tab.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'text-foreground font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {activeTab === tab.id && (
                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-accent rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {hoveredTab === tab.id && activeTab !== tab.id && (
                        <motion.div layoutId="hoverTab" className="absolute inset-0 bg-accent/50 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      <tab.icon className="w-4 h-4 opacity-70 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                      {(tab as any).comingSoon && (
                        <span className="ml-auto text-[8px] uppercase tracking-wider font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded relative z-10">Soon</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-card relative overflow-hidden flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              
              {/* General Tab */}
              {activeTab === "general" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Profile Section */}
                  <div className="mb-10">
                    <h3 className="text-base font-medium text-foreground mb-6">Profile</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Avatar</span>
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium text-foreground uppercase">
                          {userSettings.fullName.split(" ").map(n => n[0]).join("").substring(0, 2) || "U"}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Full name</span>
                        <input 
                          type="text" 
                          value={userSettings.fullName}
                          onChange={(e) => updateUserSettings({ fullName: e.target.value })}
                          className="w-64 bg-accent/50 border border-transparent hover:border-border/50 focus:border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-right outline-none transition-colors"
                        />
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">What should Ultron call you?</span>
                        <input 
                          type="text" 
                          value={userSettings.preferredName}
                          onChange={(e) => updateUserSettings({ preferredName: e.target.value })}
                          className="w-64 bg-accent/50 border border-transparent hover:border-border/50 focus:border-border rounded-lg px-3 py-1.5 text-sm text-foreground text-right outline-none transition-colors"
                        />
                      </div>

                      <div className="flex items-start justify-between pb-4 border-b border-border/50">
                        <span className="text-sm text-muted-foreground mt-1">What best describes your work?</span>
                        <div className="flex flex-col items-end gap-2">
                          <CustomSelect 
                            value={["developer", "designer", "manager", ""].includes(userSettings.workDescription) ? userSettings.workDescription : "other"}
                            onChange={(val) => {
                              if (val !== "other") {
                                updateUserSettings({ workDescription: val });
                              } else {
                                updateUserSettings({ workDescription: "other_custom" });
                              }
                            }}
                            options={[
                              { value: "", label: "Select" },
                              { value: "developer", label: "Software Developer" },
                              { value: "designer", label: "Designer" },
                              { value: "manager", label: "Product Manager" },
                              { value: "other", label: "Other" }
                            ]}
                          />
                          
                          {!["developer", "designer", "manager", ""].includes(userSettings.workDescription) && (
                            <input 
                              type="text"
                              value={userSettings.workDescription === "other_custom" ? "" : userSettings.workDescription}
                              onChange={(e) => updateUserSettings({ workDescription: e.target.value })}
                              placeholder="Please specify..."
                              className="w-48 bg-accent/50 border border-border/50 hover:border-border focus:border-primary/50 rounded-lg px-3 py-1.5 text-sm text-foreground outline-none transition-colors"
                              autoFocus
                            />
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-sm text-muted-foreground block mb-1">Instructions for Ultron</span>
                        <p className="text-[13px] text-muted-foreground/70 mb-3 leading-relaxed">
                          Ultron will keep these in mind for this and any of your associated accounts across chats and Cowork within our guidelines. <a href="#" className="text-blue-500 hover:underline">Learn more</a>
                        </p>
                        <textarea 
                          placeholder="e.g. ask clarifying questions before giving detailed answers"
                          value={userSettings.instructions}
                          onChange={(e) => updateUserSettings({ instructions: e.target.value })}
                          className="w-full h-24 bg-accent/50 border border-border/50 hover:border-border focus:border-primary/50 rounded-xl p-3 text-sm text-foreground outline-none resize-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferences Section */}
                  <div className="mb-10">
                    <h3 className="text-base font-medium text-foreground mb-6">Preferences</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Appearance</span>
                        <div className="flex items-center gap-1 bg-accent/50 rounded-lg p-0.5">
                          <button 
                            onClick={() => updateUserSettings({ theme: 'system' })}
                            className={`p-1.5 rounded-md transition-colors ${userSettings.theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateUserSettings({ theme: 'light' })}
                            className={`p-1.5 rounded-md transition-colors ${userSettings.theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <Sun className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateUserSettings({ theme: 'dark' })}
                            className={`p-1.5 rounded-md transition-colors ${userSettings.theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            <Moon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Chat font</span>
                        <CustomSelect 
                          value={userSettings.chatFont}
                          onChange={(val) => updateUserSettings({ chatFont: val })}
                          options={[
                            { value: "Ultron Serif", label: "Ultron Serif" },
                            { value: "System Default", label: "System Default" },
                            { value: "Inter", label: "Inter" }
                          ]}
                        />
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <div>
                          <span className="text-sm text-muted-foreground block mb-1">Motion</span>
                          <p className="text-[13px] text-muted-foreground/70">Reduce animation in streaming responses and other interface elements.</p>
                        </div>
                        <div className="flex items-center bg-accent/50 rounded-lg p-0.5 shrink-0 ml-4">
                          <button 
                            onClick={() => updateUserSettings({ motion: 'System' })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${userSettings.motion === 'System' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            System
                          </button>
                          <button 
                            onClick={() => updateUserSettings({ motion: 'Reduced' })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${userSettings.motion === 'Reduced' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                          >
                            Reduced
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voice Section */}
                  <div className="mb-10">
                    <h3 className="text-base font-medium text-foreground mb-6">Voice</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-border/50">
                        <span className="text-sm text-muted-foreground">Language</span>
                        <CustomSelect 
                          value={userSettings.voiceLanguage}
                          onChange={(val) => updateUserSettings({ voiceLanguage: val })}
                          options={[
                            { value: "English", label: "English" },
                            { value: "Spanish", label: "Spanish" },
                            { value: "French", label: "French" }
                          ]}
                        />
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Style</span>
                        <CustomSelect 
                          value={userSettings.voiceStyle}
                          onChange={(val) => updateUserSettings({ voiceStyle: val })}
                          options={[
                            { value: "Buttery", label: "Buttery" },
                            { value: "Professional", label: "Professional" },
                            { value: "Energetic", label: "Energetic" }
                          ]}
                        />
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Speed</span>
                        <CustomSelect 
                          value={userSettings.voiceSpeed}
                          onChange={(val) => updateUserSettings({ voiceSpeed: val })}
                          options={[
                            { value: "Normal", label: "Normal" },
                            { value: "Fast", label: "Fast" },
                            { value: "Slow", label: "Slow" }
                          ]}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notifications Section */}
                  <div className="mb-10">
                    <h3 className="text-base font-medium text-foreground mb-6">Notifications</h3>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Response completions</span>
                        <p className="text-[13px] text-muted-foreground/70">Get notified when Ultron has finished a response. Useful for long-running tasks.</p>
                      </div>
                      <button 
                        onClick={() => updateUserSettings({ responseCompletions: !userSettings.responseCompletions })}
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ml-4 ${userSettings.responseCompletions ? 'bg-primary' : 'bg-accent/80'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-background transition-transform ${userSettings.responseCompletions ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "account" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-foreground mb-6">Account</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                      <span className="text-sm text-muted-foreground">Email</span>
                      <div className="flex items-center gap-3">
                        {isEditingEmail ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="email" 
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="New Email Address"
                              className="bg-accent/50 border border-border rounded-lg px-3 py-1 text-sm text-foreground outline-none focus:border-primary"
                            />
                            <button 
                              onClick={() => setShowOtpForEmail(true)}
                              className="text-xs bg-primary/20 text-primary px-2 py-1 rounded"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={() => { setIsEditingEmail(false); setShowOtpForEmail(false); }}
                              className="text-xs text-muted-foreground/70 hover:text-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-muted-foreground/60">{userSettings.email}</span>
                            <button onClick={() => setIsEditingEmail(true)} className="text-xs text-primary hover:underline">Edit</button>
                          </>
                        )}
                      </div>
                    </div>
                    {showOtpForEmail && isEditingEmail && (
                      <div className="p-4 border border-border rounded-xl bg-accent/50">
                        <p className="text-sm text-center text-muted-foreground/80 mb-2">Enter the code sent to {newEmail}</p>
                        <OTPInput onVerified={() => {
                          updateUserSettings({ email: newEmail });
                          setIsEditingEmail(false);
                          setShowOtpForEmail(false);
                          setNewEmail("");
                        }} />
                      </div>
                    )}

                    <div className="pt-8">
                      <h4 className="text-sm font-medium text-red-500 mb-2">Danger Zone</h4>
                      <p className="text-[13px] text-muted-foreground/70 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                      <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-foreground mb-6">Privacy</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Train on my data</span>
                        <p className="text-[13px] text-muted-foreground/70">Allow Ultron to use your conversations to improve its models.</p>
                      </div>
                      <button 
                        onClick={() => updateUserSettings({ trainOnData: !userSettings.trainOnData })}
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ml-4 ${userSettings.trainOnData ? 'bg-primary' : 'bg-accent/80'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-background transition-transform ${userSettings.trainOnData ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-foreground mb-6">Billing</h3>
                  <div className="bg-gradient-to-br from-primary/10 to-blue-500/10 border border-primary/20 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-foreground mb-1">Ultron Pro</h4>
                        <p className="text-sm text-muted-foreground/80">Active subscription</p>
                      </div>
                      <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <button onClick={handleManageSubscription} className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded-lg text-sm font-medium transition-colors">Manage Subscription</button>
                  </div>
                </div>
              )}

              {activeTab === "capabilities" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-foreground mb-6">Capabilities & Enclaves</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Default Compute Enclave</span>
                        <p className="text-[13px] text-muted-foreground/70">The primary model used for generic tasks.</p>
                      </div>
                      <CustomSelect 
                        value="drone-1"
                        onChange={() => {}}
                        options={[
                          { value: "drone-1", label: "Drone 1 (Local)" },
                          { value: "drone-2", label: "Drone 2 (Cloud)" }
                        ]}
                        className="text-primary font-mono"
                      />
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-border/50">
                      <div>
                        <span className="text-sm text-muted-foreground block mb-1">Storage Path</span>
                        <p className="text-[13px] text-muted-foreground/70">Where local enclaves store their vector databases.</p>
                      </div>
                      <span className="text-sm text-muted-foreground/60 font-mono">~/.ultron/storage/</span>
                    </div>
                  </div>
                </div>
              )}

              {["source", "skills", "connectors", "plugins"].includes(activeTab) && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-foreground mb-6 capitalize">{activeTab}</h3>
                  <div className="flex flex-col items-center justify-center h-48 bg-accent/50 rounded-xl border border-border border-dashed">
                    <p className="text-sm text-primary font-bold tracking-widest uppercase mb-2">Coming Soon</p>
                    <p className="text-xs text-muted-foreground/70">This section is currently under development.</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
