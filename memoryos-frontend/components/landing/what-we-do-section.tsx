"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Users, Shield, Settings, Terminal, Search, Cpu, CheckCircle2, ChevronRight, Activity, ArrowRight } from "lucide-react";

const springTransition = { type: "spring" as const, stiffness: 350, damping: 25 };

function ContextSearchInterface() {
  return (
    <div className="w-full flex-1 rounded-[8px] bg-card border border-border/60 overflow-hidden flex flex-col font-mono shadow-sm h-[320px] mt-2">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-muted/20">
        <Search size={14} className="text-primary shrink-0" />
        <div className="flex text-[12px] text-foreground relative items-center h-5 w-full">
          <motion.span
            className="overflow-hidden whitespace-nowrap text-primary font-medium"
            animate={{ width: ["0%", "100%", "100%", "0%"] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "linear", times: [0, 0.2, 0.8, 1] }}
          >
            "database_lock timeout"
          </motion.span>
          <motion.span 
            animate={{ opacity: [1, 0] }} 
            transition={{ duration: 0.4, repeat: Number.POSITIVE_INFINITY }}
            className="w-[2px] h-[14px] bg-primary ml-[1px]"
          />
        </div>
      </div>
      
      <div className="flex flex-col p-3 gap-2 bg-muted/10 flex-1 relative overflow-hidden">
        {/* Skeleton lines before search finishes */}
        <motion.div 
          className="absolute inset-0 p-4 flex flex-col gap-3"
          animate={{ opacity: [1, 0, 0, 1] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, times: [0, 0.25, 0.9, 1] }}
        >
           <div className="flex items-center gap-2">
             <Activity size={12} className="text-muted-foreground animate-spin-slow" />
             <span className="text-[11px] text-muted-foreground">Searching vector space...</span>
           </div>
           <div className="h-2 w-full bg-border rounded-full mt-2" />
           <div className="h-2 w-3/4 bg-border rounded-full" />
           <div className="h-2 w-1/2 bg-border rounded-full" />
        </motion.div>

        {/* Results */}
        <motion.div 
          className="absolute inset-0 flex flex-col gap-2 p-3"
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, times: [0, 0.3, 0.9, 1] }}
        >
          <div className="text-[10px] text-muted-foreground font-semibold mb-1 tracking-wider uppercase">Found 3 related contexts</div>
          
          {/* Selected Item */}
          <div className="flex flex-col gap-1 p-2 rounded-[6px] w-full relative border border-primary/20 bg-primary/5">
            <div className="relative z-10 flex items-center gap-2 w-full text-foreground">
              <Brain size={12} className="text-primary" />
              <span className="truncate font-semibold text-[11px]">Decisions / src/db/mutex.ts</span>
            </div>
            <p className="text-[10px] text-muted-foreground pl-5 line-clamp-2 mt-1">
              "We implemented a 5s timeout on db locks to prevent deadlocks during high-load connection spikes."
            </p>
          </div>
          
          {/* Unselected Item 1 */}
          <div className="flex flex-col gap-1 p-2 rounded-[6px] w-full border border-border/50 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground/80 w-full">
              <Users size={12} />
              <span className="truncate text-[11px]">Team Slack / #backend</span>
            </div>
          </div>

          {/* Unselected Item 2 */}
          <div className="flex flex-col gap-1 p-2 rounded-[6px] w-full border border-border/50 bg-card">
            <div className="flex items-center gap-2 text-muted-foreground/80 w-full">
              <Activity size={12} />
              <span className="truncate text-[11px]">Sentry / Error Logs</span>
            </div>
          </div>

        </motion.div>

        {/* Mouse Cursor */}
        <motion.div
          className="absolute z-20 text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          initial={{ x: 180, y: 150, opacity: 0 }}
          animate={{
            x: [180, 180, 80, 80, 180],
            y: [150, 150, 60, 60, 150],
            opacity: [0, 1, 1, 0, 0],
            scale: [1, 1, 0.85, 1, 1]
          }}
          transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", times: [0, 0.35, 0.5, 0.7, 1] }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="2" strokeLinejoin="round">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </motion.div>
      </div>
    </div>
  );
}

function GovernanceInterface() {
  return (
    <div className="w-full flex-1 rounded-[8px] bg-card border border-border/60 overflow-hidden flex flex-col font-mono shadow-sm h-[320px] mt-2">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-muted/20">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-primary shrink-0" />
          <span className="text-[12px] font-semibold text-foreground">Trust Layer Activity</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
           <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
           <span className="text-[9px] uppercase tracking-wider text-primary font-bold">Live</span>
        </div>
      </div>
      
      <div className="flex flex-col p-4 gap-4 bg-muted/10 flex-1 relative overflow-hidden">
        
        {/* Stream 1 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-semibold">Auth.ts Rev #42</span>
            <span className="text-primary font-bold">Verified</span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
             <motion.div className="h-full bg-primary" animate={{ width: ["0%", "100%", "100%"] }} transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, times: [0, 0.4, 1] }} />
          </div>
          <motion.div 
            className="flex items-center gap-1.5 mt-1"
            animate={{ opacity: [0, 1, 1] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, times: [0, 0.45, 1] }}
          >
            <CheckCircle2 size={10} className="text-primary" />
            <span className="text-[10px] text-muted-foreground">Cryptographic hash matched.</span>
          </motion.div>
        </div>

        {/* Stream 2 */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-semibold">Session.ts Rev #12</span>
            <motion.span className="text-primary font-bold" animate={{ color: ["#64748b", "hsl(var(--primary))", "hsl(var(--primary))"] }} transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, times: [0, 0.8, 1], delay: 0.5 }}>
              Scanning
            </motion.span>
          </div>
          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
             <motion.div className="h-full bg-primary" animate={{ width: ["0%", "100%", "100%"] }} transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, times: [0, 0.8, 1], delay: 0.5 }} />
          </div>
        </div>

        {/* Code block scanning overlay */}
        <motion.div 
          className="mt-4 p-3 rounded-md border border-border bg-card text-[10px] text-muted-foreground/60 overflow-hidden relative shadow-inner"
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
        >
          <div className="flex flex-col gap-1.5 font-mono">
            <span>{`if (session.expired) {`}</span>
            <span className="pl-4">{`await triggerRefresh();`}</span>
            <span>{`}`}</span>
          </div>
          {/* Scanning laser */}
          <motion.div 
            className="absolute top-0 left-0 w-full h-[2px] bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  )
}

function AgentWorkspaceInterface({ isActive }: { isActive: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setStep(0);
      return;
    }

    let timeouts: NodeJS.Timeout[] = [];
    
    // Step 0: Idle / Model selecting
    timeouts.push(setTimeout(() => setStep(1), 500)); // Select model
    timeouts.push(setTimeout(() => setStep(2), 1500)); // Model selected, agent thinking
    timeouts.push(setTimeout(() => setStep(3), 2500)); // Agent sends message
    timeouts.push(setTimeout(() => setStep(4), 4000)); // MemoryOS system response
    timeouts.push(setTimeout(() => setStep(5), 5500)); // Agent responds
    timeouts.push(setTimeout(() => setStep(6), 7000)); // MemoryOS saving
    timeouts.push(setTimeout(() => setStep(7), 8000)); // User clicking suggestion
    timeouts.push(setTimeout(() => setStep(8), 9000)); // Suggestion sent

    return () => timeouts.forEach(clearTimeout);
  }, [isActive]);

  return (
    <div className={`relative border border-border bg-card rounded-xl overflow-hidden flex flex-col h-[440px] transition-all duration-700 ${isActive ? 'opacity-100 scale-[1.02] shadow-xl ring-1 ring-primary/30' : 'opacity-40 scale-100 shadow-sm'}`}>
      
      {/* Header */}
      <div className="bg-muted/40 border-b border-border px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-card border border-border rounded-md shadow-sm">
            <Cpu size={16} className="text-foreground" />
          </div>
          <span className="text-[14px] font-semibold text-foreground tracking-tight">Agent Workspace</span>
          
          {/* Animated Model Selector */}
          <div className="ml-2 px-2 py-1 bg-card border border-border rounded-md text-[10px] text-muted-foreground flex items-center gap-1.5 shadow-sm relative overflow-hidden">
             <div className={`absolute inset-0 bg-primary/10 transition-opacity duration-300 ${step === 1 ? 'opacity-100' : 'opacity-0'}`} />
             <Activity size={10} className={step === 1 ? "text-primary animate-spin" : ""} />
             <span>{step < 2 ? "Selecting model..." : "GPT-4o Selected"}</span>
             <ChevronRight size={10} className="rotate-90" />
          </div>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
          <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
          <span className="font-mono text-[10px] text-primary font-medium tracking-wide uppercase">Connected</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto relative font-mono text-[12px] bg-gradient-to-b from-card to-muted/20">
        <AnimatePresence mode="popLayout">
          {step >= 3 && (
            <motion.div key="step-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start max-w-[85%]">
              <div className="flex items-start gap-3 bg-primary/5 text-foreground p-3.5 rounded-xl rounded-tl-sm border border-primary/10 shadow-sm">
                <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                <span className="leading-relaxed font-medium">Task: Implement new memory retrieval strategy. Requesting context.</span>
              </div>
            </motion.div>
          )}

          {step >= 4 && (
            <motion.div key="step-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="self-center items-center my-1">
              <div className="flex items-center gap-2 text-muted-foreground text-[9px] tracking-widest uppercase bg-muted/40 px-3 py-1.5 rounded-full border border-border">
                <Activity size={10} className="animate-spin-slow text-primary" />
                <span className="font-semibold">MemoryOS / Loaded project state & 2 recent bugs.</span>
              </div>
            </motion.div>
          )}

          {step >= 5 && (
            <motion.div key="step-5" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-start max-w-[85%]">
              <div className="flex items-start gap-3 bg-primary/5 text-foreground p-3.5 rounded-xl rounded-tl-sm border border-primary/10 shadow-sm">
                <ChevronRight size={14} className="text-primary mt-0.5 shrink-0" />
                <span className="leading-relaxed font-medium">Context received. Avoiding #102 regression. Writing code...</span>
              </div>
            </motion.div>
          )}

          {step >= 6 && (
            <motion.div key="step-6" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="self-center items-center my-1">
              <div className="flex items-center gap-2 text-muted-foreground text-[9px] tracking-widest uppercase bg-muted/40 px-3 py-1.5 rounded-full border border-border">
                <CheckCircle2 size={10} className="text-primary" />
                <span className="font-semibold">MemoryOS / Decisions archived to graph.</span>
              </div>
            </motion.div>
          )}

          {step >= 8 && (
            <motion.div key="step-8" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="self-end max-w-[85%]">
              <div className="flex items-start gap-3 bg-card text-foreground p-3.5 rounded-xl rounded-tr-sm border border-border shadow-sm">
                <span className="leading-relaxed font-medium">Please review the PR diff before deploying.</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Input Area */}
      <div className="border-t border-border p-4 bg-card relative">
        {/* Suggested Replies */}
        <div className="flex items-center gap-2 mb-3 absolute -top-8 left-4">
           <motion.div 
             className={`px-3 py-1.5 rounded-full border text-[10px] font-medium shadow-sm transition-colors ${step >= 8 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:bg-muted'}`}
           >
             Review PR diff
           </motion.div>
           <motion.div className="px-3 py-1.5 rounded-full border border-border bg-card text-muted-foreground text-[10px] font-medium shadow-sm">
             Deploy to staging
           </motion.div>
        </div>

        {/* Simulated Mouse Cursor for clicking suggestion */}
        <motion.div
          className="absolute z-20 text-foreground drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          initial={{ x: 200, y: 80, opacity: 0 }}
          animate={{
            x: isActive && step >= 7 ? [200, 50, 50, 200] : 200,
            y: isActive && step >= 7 ? [80, -10, -10, 80] : 80,
            opacity: isActive && step >= 7 ? [0, 1, 1, 0] : 0,
            scale: isActive && step >= 7 ? [1, 1, 0.8, 1] : 1
          }}
          transition={{ duration: 1.5, ease: "easeInOut", times: [0, 0.4, 0.6, 1] }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="white" strokeWidth="2" strokeLinejoin="round">
            <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
          </svg>
        </motion.div>

        <div className="bg-muted/40 border border-border rounded-lg px-4 py-3 flex items-center justify-between text-muted-foreground font-mono text-[12px] shadow-inner">
          <span>{step >= 8 ? "Review PR diff|" : "Reply to agent..."}</span>
          <div className={`w-6 h-6 rounded flex items-center justify-center border shadow-sm transition-colors ${step >= 8 ? 'bg-primary border-primary text-primary-foreground' : 'bg-card border-border text-muted-foreground'}`}>
            <ArrowRight size={12} />
          </div>
        </div>
      </div>
    </div>
  )
}

function ApiWriteTerminal({ isActive }: { isActive: boolean }) {
  return (
    <div className="mt-4 bg-card border border-border/60 rounded-md overflow-hidden flex flex-col font-mono text-[9px] shadow-sm relative">
      <div className="bg-muted/30 px-3 py-2 border-b border-border/50 flex items-center justify-between">
         <span className="text-foreground font-sans text-[13px] font-bold">Write memory</span>
      </div>
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2 bg-muted/10">
         <span className={`font-bold transition-colors duration-300 ${isActive ? 'text-chart-2' : 'text-muted-foreground'}`}>POST</span>
         <span className="text-foreground tracking-tight">/v1/memory/process</span>
      </div>
      <div className="p-3 flex flex-col gap-1 text-muted-foreground/80 relative h-[50px]">
         <span>{`{ "data": "auth_bypass.ts" }`}</span>
         <motion.div 
           className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-chart-2 bg-chart-2/10 px-2 py-1 rounded border border-chart-2/20 font-bold"
           animate={{ opacity: isActive ? [0, 0, 1, 1, 0] : 0, y: isActive ? [5, 5, 0, 0, 0] : 0 }}
           transition={{ duration: 3.5, times: [0, 0.3, 0.4, 0.9, 1] }}
         >
           <CheckCircle2 size={10} /> <span>201 Created</span>
         </motion.div>
         <motion.div 
           className="absolute bottom-2.5 right-3 flex items-center gap-1 text-muted-foreground/50"
           animate={{ opacity: isActive ? [0, 1, 0, 0, 0] : 0 }}
           transition={{ duration: 3.5, times: [0, 0.1, 0.3, 0.9, 1] }}
         >
           <Activity size={10} className="animate-spin-slow" /> <span>Writing...</span>
         </motion.div>
      </div>
    </div>
  )
}

function ApiRecoverTerminal({ isActive }: { isActive: boolean }) {
  return (
    <div className="mt-4 bg-card border border-border/60 rounded-md overflow-hidden flex flex-col font-mono text-[9px] shadow-sm relative">
      <div className="bg-muted/30 px-3 py-2 border-b border-border/50 flex items-center justify-between">
         <span className="text-foreground font-sans text-[13px] font-bold">Recover context</span>
      </div>
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2 bg-muted/10">
         <span className={`font-bold transition-colors duration-300 ${isActive ? 'text-blue-500' : 'text-muted-foreground'}`}>GET</span>
         <span className="text-foreground tracking-tight">/v1/memory/retrieve</span>
      </div>
      <div className="p-3 flex flex-col gap-1 text-muted-foreground/80 relative h-[50px]">
         <span>{`?query=auth_bypass&limit=1`}</span>
         <motion.div 
           className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-blue-500 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 font-bold"
           animate={{ opacity: isActive ? [0, 0, 1, 1, 0] : 0, y: isActive ? [5, 5, 0, 0, 0] : 0 }}
           transition={{ duration: 3.5, times: [0, 0.3, 0.4, 0.9, 1] }}
         >
           <Search size={10} /> <span>Found 1 Context</span>
         </motion.div>
         <motion.div 
           className="absolute bottom-2.5 right-3 flex items-center gap-1 text-muted-foreground/50"
           animate={{ opacity: isActive ? [0, 1, 0, 0, 0] : 0 }}
           transition={{ duration: 3.5, times: [0, 0.1, 0.3, 0.9, 1] }}
         >
           <Activity size={10} className="animate-spin-slow" /> <span>Searching...</span>
         </motion.div>
      </div>
    </div>
  )
}

function ApiInspectTerminal({ isActive }: { isActive: boolean }) {
  return (
    <div className="mt-4 bg-card border border-border/60 rounded-md overflow-hidden flex flex-col font-mono text-[9px] shadow-sm relative">
      <div className="bg-muted/30 px-3 py-2 border-b border-border/50 flex items-center justify-between">
         <span className="text-foreground font-sans text-[13px] font-bold">Inspect trust</span>
      </div>
      <div className="px-3 py-2 border-b border-border/30 flex items-center gap-2 bg-muted/10">
         <span className={`font-bold transition-colors duration-300 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`}>GET</span>
         <span className="text-foreground tracking-tight">/v1/memory/status</span>
      </div>
      <div className="p-3 flex flex-col gap-1 text-muted-foreground/80 relative h-[50px]">
         <span>{`?id=mem_8f92a`}</span>
         <motion.div 
           className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-amber-500 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20 font-bold"
           animate={{ opacity: isActive ? [0, 0, 1, 1, 0] : 0, y: isActive ? [5, 5, 0, 0, 0] : 0 }}
           transition={{ duration: 3.5, times: [0, 0.3, 0.4, 0.9, 1] }}
         >
           <Shield size={10} /> <span>Verified Secure</span>
         </motion.div>
         <motion.div 
           className="absolute bottom-2.5 right-3 flex items-center gap-1 text-muted-foreground/50"
           animate={{ opacity: isActive ? [0, 1, 0, 0, 0] : 0 }}
           transition={{ duration: 3.5, times: [0, 0.1, 0.3, 0.9, 1] }}
         >
           <Activity size={10} className="animate-spin-slow" /> <span>Inspecting...</span>
         </motion.div>
      </div>
    </div>
  )
}

function AnimatedGrid({ id, isActive }: { id: string; isActive: boolean }) {
  return (
    <div className="grid grid-cols-6 gap-[3px] w-fit mb-4">
      {Array.from({ length: 18 }).map((_, i) => (
        <motion.div
          key={`${id}-${i}`}
          className="w-[5px] h-[5px] rounded-[1px] bg-primary"
          animate={{ opacity: isActive ? [0.4, 1, 0.4] : [0.1, 0.2, 0.1] }}
          transition={{
            duration: isActive ? 0.6 + (i % 3) * 0.2 : 2.5,
            repeat: Number.POSITIVE_INFINITY,
            delay: (i % 4) * 0.1,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export function WhatWeDoSection() {
  const [activeApi, setActiveApi] = useState(0);
  const [activeCard, setActiveCard] = useState(0);

  useEffect(() => {
    const apiInterval = setInterval(() => {
      setActiveApi((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(apiInterval);
  }, []);

  useEffect(() => {
    let timeouts: NodeJS.Timeout[] = [];

    const runSequence = () => {
      setActiveCard(0);

      timeouts.push(setTimeout(() => {
        setActiveCard(1);
      }, 3500));

      timeouts.push(setTimeout(() => {
        setActiveCard(2);
      }, 14000));

      timeouts.push(setTimeout(() => {
        runSequence();
      }, 17500));
    };

    runSequence();

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <section className="bg-background text-foreground py-32 relative overflow-hidden font-sans border-b border-border">
      <div className="max-w-7xl mx-auto px-6 relative z-20">

        {/* The Interactive UI Bento Box Wrapper */}
        <div className="relative w-full flex flex-col gap-6 lg:gap-[80px]">

          {/* SVG Animated Connector Lines (Desktop only) */}
          <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block">
            <svg width="0" height="0" className="absolute">
              <defs>
                <filter id="glow-primary" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
            </svg>

            {/* Left Gap Wire */}
            <div className="absolute top-[220px] left-[25%] w-[160px] h-[4px] -translate-x-1/2 -translate-y-1/2">
              <svg className="w-full h-full overflow-visible">
                <line x1="0" y1="2" x2="100%" y2="2" className="stroke-border" strokeWidth="3" />
                <motion.line x1="0" y1="2" x2="100%" y2="2" className="stroke-primary" strokeWidth="4" filter="url(#glow-primary)" strokeLinecap="round"
                  initial={{ pathLength: 0.6, pathOffset: -0.6 }}
                  animate={{ pathOffset: 1 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                />
              </svg>
            </div>

            {/* Right Gap Wire */}
            <div className="absolute top-[220px] left-[75%] w-[160px] h-[4px] -translate-x-1/2 -translate-y-1/2">
              <svg className="w-full h-full overflow-visible">
                <line x1="0" y1="2" x2="100%" y2="2" className="stroke-border" strokeWidth="3" />
                <motion.line x1="0" y1="2" x2="100%" y2="2" className="stroke-primary" strokeWidth="4" filter="url(#glow-primary)" strokeLinecap="round"
                  initial={{ pathLength: 0.6, pathOffset: -0.6 }}
                  animate={{ pathOffset: 1 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 0.6, repeatDelay: 1 }}
                />
              </svg>
            </div>

            {/* Bottom Gap Wire */}
            <div className="absolute top-[440px] left-1/2 w-[4px] h-[160px] -translate-x-1/2 -translate-y-[40px]">
              <svg className="w-full h-full overflow-visible">
                <line x1="2" y1="0" x2="2" y2="100%" className="stroke-border" strokeWidth="3" />
                <motion.line x1="2" y1="0" x2="2" y2="100%" className="stroke-primary" strokeWidth="4" filter="url(#glow-primary)" strokeLinecap="round"
                  initial={{ pathLength: 0.6, pathOffset: -0.6 }}
                  animate={{ pathOffset: 1 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear", delay: 1.2, repeatDelay: 1 }}
                />
              </svg>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-[80px] relative z-10">
            {/* Left Column (Search / Context) */}
            <motion.div
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={springTransition}
              className="lg:col-span-3 flex flex-col gap-6"
            >
              <div className={`group relative border border-border bg-card rounded-xl p-5 flex-1 overflow-hidden transition-all duration-700 ${activeCard === 0 ? 'opacity-100 scale-[1.02] shadow-lg ring-1 ring-primary/30' : 'opacity-40 scale-100 shadow-sm'}`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-primary transition-opacity duration-500 ${activeCard === 0 ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground mb-4 tracking-widest pb-3 border-b border-border uppercase">
                  <Search size={14} className="text-primary" />
                  <span>Context_Search</span>
                </div>
                <ContextSearchInterface />
              </div>
            </motion.div>

            {/* Center Column (Agent) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...springTransition, delay: 0.1 }}
              className="lg:col-span-6"
            >
              <AgentWorkspaceInterface isActive={activeCard === 1} />
            </motion.div>

            {/* Right Column (Connections / Execute) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ ...springTransition, delay: 0.2 }}
              className="lg:col-span-3 flex flex-col gap-6"
            >
              <div className={`group relative border border-border bg-card rounded-xl p-5 flex-1 overflow-hidden transition-all duration-700 ${activeCard === 2 ? 'opacity-100 scale-[1.02] shadow-lg ring-1 ring-primary/30' : 'opacity-40 scale-100 shadow-sm'}`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-primary transition-opacity duration-500 ${activeCard === 2 ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="font-mono text-[10px] text-muted-foreground mb-4 tracking-widest pb-3 border-b border-border uppercase flex items-center gap-2">
                  <Shield size={14} className="text-primary" />
                  <span>Governance</span>
                </div>
                <GovernanceInterface />
              </div>
            </motion.div>
          </div>

          {/* Bottom Column (Sandbox / API) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ ...springTransition, delay: 0.3 }}
            className="border border-border bg-card rounded-xl p-6 lg:p-8 font-mono relative z-10 shadow-sm overflow-hidden group"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-50"></div>

            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-border gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted/40 border border-border">
                  <Terminal size={16} className="text-primary" />
                </div>
                <span className="text-foreground text-[12px] font-semibold tracking-widest uppercase">PLATFORM_SURFACE_API</span>
              </div>
              <span className="text-muted-foreground text-[12px] bg-muted/40 px-3 py-1.5 rounded-md border border-border font-sans font-medium shadow-sm hidden md:block">
                One memory API for the full developer loop
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div
                className={`group/item cursor-default p-4 rounded-xl transition-all duration-700 ${activeApi === 0 ? 'bg-muted/30 opacity-100 scale-[1.02]' : 'opacity-40 hover:opacity-70 scale-100'}`}
              >
                <AnimatedGrid id="what-write" isActive={activeApi === 0} />
                <ApiWriteTerminal isActive={activeApi === 0} />
              </motion.div>

              <motion.div
                className={`group/item cursor-default p-4 rounded-xl transition-all duration-700 ${activeApi === 1 ? 'bg-muted/30 opacity-100 scale-[1.02]' : 'opacity-40 hover:opacity-70 scale-100'}`}
              >
                <AnimatedGrid id="what-recover" isActive={activeApi === 1} />
                <ApiRecoverTerminal isActive={activeApi === 1} />
              </motion.div>

              <motion.div
                className={`group/item cursor-default p-4 rounded-xl transition-all duration-700 ${activeApi === 2 ? 'bg-muted/30 opacity-100 scale-[1.02]' : 'opacity-40 hover:opacity-70 scale-100'}`}
              >
                <AnimatedGrid id="what-inspect" isActive={activeApi === 2} />
                <ApiInspectTerminal isActive={activeApi === 2} />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
