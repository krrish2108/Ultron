"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/useAppStore";
import { X, Settings, User, Shield, CreditCard, Zap, Brain, Focus, Code, Wrench, Plug, Puzzle, Monitor, Sun, Moon } from "lucide-react";
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
              "border-white/20 bg-white/5 focus-within:border-[#00f0ff] focus-within:shadow-[0_0_10px_rgba(0,240,255,0.2)]"
            }`}
          >
            {isVerifying && <div className="absolute inset-0 bg-[#00f0ff]/20 animate-pulse pointer-events-none" />}
            <input
              ref={el => { refs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={isVerifying || isSuccess || isError}
              className="w-full h-full text-center bg-transparent text-white font-mono text-xl outline-none"
            />
          </motion.div>
        ))}
      </div>
      <div className="h-4">
        {isVerifying && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[#00f0ff] text-xs font-mono tracking-widest animate-pulse">VERIFYING...</motion.p>}
        {isSuccess && <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-emerald-400 text-xs font-bold tracking-widest">VERIFIED</motion.p>}
        {isError && <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs font-bold tracking-widest">INVALID CODE</motion.p>}
      </div>
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
          className="relative w-full max-w-[1000px] h-[80vh] min-h-[600px] bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex overflow-hidden z-10 font-sans"
        >
          {/* Sidebar */}
          <div className="w-[240px] bg-[#0a0a0a] border-r border-white/5 p-4 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            {/* Search */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input 
                type="text" 
                placeholder="Search" 
                className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/20"
              />
            </div>

            <div className="space-y-6">
              <div>
                <div className="px-3 text-xs font-medium text-white/40 mb-2">Settings</div>
                <nav className="space-y-0.5" onMouseLeave={() => setHoveredTab(null)}>
                  {SETTINGS_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onMouseEnter={() => setHoveredTab(tab.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'text-white font-medium' : 'text-white/60 hover:text-white'}`}
                    >
                      {activeTab === tab.id && (
                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {hoveredTab === tab.id && activeTab !== tab.id && (
                        <motion.div layoutId="hoverTab" className="absolute inset-0 bg-white/5 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      <tab.icon className="w-4 h-4 opacity-70 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                      {(tab as any).comingSoon && (
                        <span className="ml-auto text-[8px] uppercase tracking-wider font-bold bg-[#00f0ff]/10 text-[#00f0ff] px-1.5 py-0.5 rounded relative z-10">Soon</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div>
                <div className="px-3 text-xs font-medium text-white/40 mb-2">Customize</div>
                <nav className="space-y-0.5" onMouseLeave={() => setHoveredTab(null)}>
                  {CUSTOMIZE_TABS.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onMouseEnter={() => setHoveredTab(tab.id)}
                      className={`relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${activeTab === tab.id ? 'text-white font-medium' : 'text-white/60 hover:text-white'}`}
                    >
                      {activeTab === tab.id && (
                        <motion.div layoutId="activeTab" className="absolute inset-0 bg-white/10 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      {hoveredTab === tab.id && activeTab !== tab.id && (
                        <motion.div layoutId="hoverTab" className="absolute inset-0 bg-white/5 rounded-lg" transition={{ type: "spring", bounce: 0.2, duration: 0.6 }} />
                      )}
                      <tab.icon className="w-4 h-4 opacity-70 relative z-10" />
                      <span className="relative z-10">{tab.label}</span>
                      {tab.comingSoon && (
                        <span className="ml-auto text-[8px] uppercase tracking-wider font-bold bg-[#00f0ff]/10 text-[#00f0ff] px-1.5 py-0.5 rounded relative z-10">Soon</span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 bg-[#111111] relative overflow-hidden flex flex-col">
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setSettingsOpen(false)}
                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
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
                    <h3 className="text-base font-medium text-white mb-6">Profile</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Avatar</span>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium text-white">
                          KP
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Full name</span>
                        <input 
                          type="text" 
                          value={userSettings.fullName}
                          onChange={(e) => updateUserSettings({ fullName: e.target.value })}
                          className="w-64 bg-white/5 border border-white/5 hover:border-white/10 focus:border-white/20 rounded-lg px-3 py-1.5 text-sm text-white text-right outline-none transition-colors"
                        />
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">What should Ultron call you?</span>
                        <input 
                          type="text" 
                          value={userSettings.preferredName}
                          onChange={(e) => updateUserSettings({ preferredName: e.target.value })}
                          className="w-64 bg-white/5 border border-white/5 hover:border-white/10 focus:border-white/20 rounded-lg px-3 py-1.5 text-sm text-white text-right outline-none transition-colors"
                        />
                      </div>

                      <div className="flex items-start justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80 mt-1">What best describes your work?</span>
                        <div className="flex flex-col items-end gap-2">
                          <select 
                            value={["developer", "designer", "manager", ""].includes(userSettings.workDescription) ? userSettings.workDescription : "other"}
                            onChange={(e) => {
                              if (e.target.value !== "other") {
                                updateUserSettings({ workDescription: e.target.value });
                              } else {
                                updateUserSettings({ workDescription: "other_custom" });
                              }
                            }}
                            className="w-48 bg-transparent text-sm text-white/80 outline-none text-right appearance-none cursor-pointer hover:text-white"
                          >
                            <option value="" className="bg-[#111111]">Select</option>
                            <option value="developer" className="bg-[#111111]">Software Developer</option>
                            <option value="designer" className="bg-[#111111]">Designer</option>
                            <option value="manager" className="bg-[#111111]">Product Manager</option>
                            <option value="other" className="bg-[#111111]">Other</option>
                          </select>
                          
                          {!["developer", "designer", "manager", ""].includes(userSettings.workDescription) && (
                            <input 
                              type="text"
                              value={userSettings.workDescription === "other_custom" ? "" : userSettings.workDescription}
                              onChange={(e) => updateUserSettings({ workDescription: e.target.value })}
                              placeholder="Please specify..."
                              className="w-48 bg-white/5 border border-white/10 hover:border-white/20 focus:border-[#00f0ff]/50 rounded-lg px-3 py-1.5 text-sm text-white outline-none transition-colors"
                              autoFocus
                            />
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-sm text-white/80 block mb-1">Instructions for Ultron</span>
                        <p className="text-[13px] text-white/40 mb-3 leading-relaxed">
                          Ultron will keep these in mind for this and any of your associated accounts across chats and Cowork within our guidelines. <a href="#" className="text-blue-400 hover:underline">Learn more</a>
                        </p>
                        <textarea 
                          placeholder="e.g. ask clarifying questions before giving detailed answers"
                          value={userSettings.instructions}
                          onChange={(e) => updateUserSettings({ instructions: e.target.value })}
                          className="w-full h-24 bg-white/5 border border-white/5 hover:border-white/10 focus:border-white/20 rounded-xl p-3 text-sm text-white outline-none resize-none transition-colors"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferences Section */}
                  <div className="mb-10">
                    <h3 className="text-base font-medium text-white mb-6">Preferences</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Appearance</span>
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5">
                          <button 
                            onClick={() => updateUserSettings({ theme: 'system' })}
                            className={`p-1.5 rounded-md transition-colors ${userSettings.theme === 'system' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                          >
                            <Monitor className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateUserSettings({ theme: 'light' })}
                            className={`p-1.5 rounded-md transition-colors ${userSettings.theme === 'light' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                          >
                            <Sun className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => updateUserSettings({ theme: 'dark' })}
                            className={`p-1.5 rounded-md transition-colors ${userSettings.theme === 'dark' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                          >
                            <Moon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Chat font</span>
                        <select 
                          value={userSettings.chatFont}
                          onChange={(e) => updateUserSettings({ chatFont: e.target.value })}
                          className="bg-transparent text-sm text-white/80 outline-none text-right appearance-none cursor-pointer hover:text-white"
                        >
                          <option value="Ultron Serif" className="bg-[#111111]">Ultron Serif</option>
                          <option value="System Default" className="bg-[#111111]">System Default</option>
                          <option value="Inter" className="bg-[#111111]">Inter</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <div>
                          <span className="text-sm text-white/80 block mb-1">Motion</span>
                          <p className="text-[13px] text-white/40">Reduce animation in streaming responses and other interface elements.</p>
                        </div>
                        <div className="flex items-center bg-white/5 rounded-lg p-0.5 shrink-0 ml-4">
                          <button 
                            onClick={() => updateUserSettings({ motion: 'System' })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${userSettings.motion === 'System' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                          >
                            System
                          </button>
                          <button 
                            onClick={() => updateUserSettings({ motion: 'Reduced' })}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${userSettings.motion === 'Reduced' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}
                          >
                            Reduced
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Voice Section */}
                  <div className="mb-10">
                    <h3 className="text-base font-medium text-white mb-6">Voice</h3>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Language</span>
                        <select 
                          value={userSettings.voiceLanguage}
                          onChange={(e) => updateUserSettings({ voiceLanguage: e.target.value })}
                          className="bg-transparent text-sm text-white/80 outline-none text-right appearance-none cursor-pointer hover:text-white"
                        >
                          <option value="English" className="bg-[#111111]">English</option>
                          <option value="Spanish" className="bg-[#111111]">Spanish</option>
                          <option value="French" className="bg-[#111111]">French</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Style</span>
                        <select 
                          value={userSettings.voiceStyle}
                          onChange={(e) => updateUserSettings({ voiceStyle: e.target.value })}
                          className="bg-transparent text-sm text-white/80 outline-none text-right appearance-none cursor-pointer hover:text-white"
                        >
                          <option value="Buttery" className="bg-[#111111]">Buttery</option>
                          <option value="Professional" className="bg-[#111111]">Professional</option>
                          <option value="Energetic" className="bg-[#111111]">Energetic</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between pb-4 border-b border-white/5">
                        <span className="text-sm text-white/80">Speed</span>
                        <select 
                          value={userSettings.voiceSpeed}
                          onChange={(e) => updateUserSettings({ voiceSpeed: e.target.value })}
                          className="bg-transparent text-sm text-white/80 outline-none text-right appearance-none cursor-pointer hover:text-white"
                        >
                          <option value="Normal" className="bg-[#111111]">Normal</option>
                          <option value="Fast" className="bg-[#111111]">Fast</option>
                          <option value="Slow" className="bg-[#111111]">Slow</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Notifications Section */}
                  <div className="mb-10">
                    <h3 className="text-base font-medium text-white mb-6">Notifications</h3>
                    
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div>
                        <span className="text-sm text-white/80 block mb-1">Response completions</span>
                        <p className="text-[13px] text-white/40">Get notified when Ultron has finished a response. Useful for long-running tasks.</p>
                      </div>
                      <button 
                        onClick={() => updateUserSettings({ responseCompletions: !userSettings.responseCompletions })}
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ml-4 ${userSettings.responseCompletions ? 'bg-blue-500' : 'bg-white/20'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${userSettings.responseCompletions ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "account" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-white mb-6">Account</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <span className="text-sm text-white/80">Email</span>
                      <div className="flex items-center gap-3">
                        {isEditingEmail ? (
                          <div className="flex items-center gap-2">
                            <input 
                              type="email" 
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="New Email Address"
                              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white outline-none focus:border-[#00f0ff]"
                            />
                            <button 
                              onClick={() => setShowOtpForEmail(true)}
                              className="text-xs bg-[#00f0ff]/20 text-[#00f0ff] px-2 py-1 rounded"
                            >
                              Verify
                            </button>
                            <button 
                              onClick={() => { setIsEditingEmail(false); setShowOtpForEmail(false); }}
                              className="text-xs text-white/40 hover:text-white"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm text-white/50">{userSettings.email}</span>
                            <button onClick={() => setIsEditingEmail(true)} className="text-xs text-[#00f0ff] hover:underline">Edit</button>
                          </>
                        )}
                      </div>
                    </div>
                    {showOtpForEmail && isEditingEmail && (
                      <div className="p-4 border border-white/10 rounded-xl bg-white/5">
                        <p className="text-sm text-center text-white/60 mb-2">Enter the code sent to {newEmail}</p>
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
                      <p className="text-[13px] text-white/40 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                      <button className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "privacy" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-white mb-6">Privacy</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div>
                        <span className="text-sm text-white/80 block mb-1">Train on my data</span>
                        <p className="text-[13px] text-white/40">Allow Ultron to use your conversations to improve its models.</p>
                      </div>
                      <button 
                        onClick={() => updateUserSettings({ trainOnData: !userSettings.trainOnData })}
                        className={`w-10 h-5 rounded-full transition-colors relative flex items-center shrink-0 ml-4 ${userSettings.trainOnData ? 'bg-[#00f0ff]' : 'bg-white/20'}`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white transition-transform ${userSettings.trainOnData ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-white mb-6">Billing</h3>
                  <div className="bg-gradient-to-br from-[#00f0ff]/10 to-blue-500/10 border border-[#00f0ff]/20 rounded-xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-bold text-white mb-1">Ultron Pro</h4>
                        <p className="text-sm text-white/60">Active subscription</p>
                      </div>
                      <span className="px-3 py-1 bg-[#00f0ff]/20 text-[#00f0ff] rounded-full text-xs font-bold uppercase tracking-wider">Active</span>
                    </div>
                    <button onClick={handleManageSubscription} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">Manage Subscription</button>
                  </div>
                </div>
              )}

              {activeTab === "capabilities" && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-white mb-6">Capabilities & Enclaves</h3>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div>
                        <span className="text-sm text-white/80 block mb-1">Default Compute Enclave</span>
                        <p className="text-[13px] text-white/40">The primary model used for generic tasks.</p>
                      </div>
                      <select className="bg-transparent text-sm text-[#00f0ff] font-mono outline-none text-right appearance-none cursor-pointer">
                        <option value="drone-1" className="bg-[#111111]">Drone 1 (Local)</option>
                        <option value="drone-2" className="bg-[#111111]">Drone 2 (Cloud)</option>
                      </select>
                    </div>
                    <div className="flex items-center justify-between pb-4 border-b border-white/5">
                      <div>
                        <span className="text-sm text-white/80 block mb-1">Storage Path</span>
                        <p className="text-[13px] text-white/40">Where local enclaves store their vector databases.</p>
                      </div>
                      <span className="text-sm text-white/50 font-mono">~/.ultron/storage/</span>
                    </div>
                  </div>
                </div>
              )}

              {["source", "skills", "connectors", "plugins"].includes(activeTab) && (
                <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-base font-medium text-white mb-6 capitalize">{activeTab}</h3>
                  <div className="flex flex-col items-center justify-center h-48 bg-white/5 rounded-xl border border-white/10 border-dashed">
                    <p className="text-sm text-[#00f0ff] font-bold tracking-widest uppercase mb-2">Coming Soon</p>
                    <p className="text-xs text-white/40">This section is currently under development.</p>
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
