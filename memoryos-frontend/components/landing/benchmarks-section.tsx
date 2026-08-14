"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Reveal } from "./motion";
import { Activity, Database, Zap, ShieldCheck, CheckCircle2, ChevronRight, BrainCircuit, Search, AlertCircle, Sparkles, TerminalSquare, Network, Globe, Code2 } from "lucide-react";

function TestRunner() {
  const [step, setStep] = useState(0);
  const tests = [
    { id: "SYS_01", name: "Semantic Retrieval Precision", latency: "12ms" },
    { id: "MEM_02", name: "Cross-Agent Context Handoff", latency: "18ms" },
    { id: "SEC_03", name: "Contradiction Resolution", latency: "24ms" },
    { id: "VOL_04", name: "High-Noise Recall Assertion", latency: "15ms" },
    { id: "INT_05", name: "Memory Contract Integrity", latency: "9ms" },
    { id: "CRY_06", name: "Cryptographic Verification", latency: "11ms" },
    { id: "RES_07", name: "State Resume Fidelity", latency: "14ms" }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % (tests.length + 3)); // +3 for pause at end
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-[320px] bg-card border border-border rounded-md overflow-hidden flex flex-col font-mono text-[11px] shadow-sm relative group transition-all duration-500 hover:border-primary/40">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-primary/20 z-10">
         <motion.div className="h-full bg-primary" animate={{ width: `${Math.min(100, (step / tests.length) * 100)}%` }} transition={{ duration: 0.5 }} />
      </div>
      <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between">
         <div className="flex items-center gap-2 text-foreground font-bold font-sans text-[13px]">
           <Activity size={14} className="text-primary" /> Test Suite Execution
         </div>
         <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Running: <span className="text-primary">7/7</span></span>
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
         </div>
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1 overflow-hidden relative bg-gradient-to-b from-card to-muted/10">
         <AnimatePresence mode="popLayout">
            {tests.slice(0, Math.min(step, tests.length)).map((test, i) => (
              <motion.div 
                key={test.id}
                initial={{ opacity: 0, x: -10, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                className="flex items-center justify-between bg-muted/40 p-2.5 rounded-md border border-border/50"
              >
                 <div className="flex items-center gap-2 text-foreground">
                   <ChevronRight size={12} className="text-muted-foreground" />
                   <span className="text-muted-foreground font-medium">{test.id}</span>
                   <span className="font-semibold">{test.name}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <span className="text-muted-foreground">{test.latency}</span>
                   <span className="text-chart-2 flex items-center gap-1 font-bold"><CheckCircle2 size={10} /> PASS</span>
                 </div>
              </motion.div>
            ))}
         </AnimatePresence>
         
         {step < tests.length && (
           <motion.div 
             className="flex items-center gap-2 p-2 text-muted-foreground/70"
             animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
           >
             <Activity size={12} className="animate-spin" /> Executing next instruction...
           </motion.div>
         )}

         <AnimatePresence>
         {step >= tests.length && (
            <motion.div 
              initial={{ opacity: 0, backdropFilter: "blur(0px)" }} 
              animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-card/60 flex items-center justify-center z-20"
            >
               <motion.div 
                 initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", damping: 20 }}
                 className="bg-card border border-primary/30 p-6 rounded-md flex flex-col items-center gap-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-primary/20"
               >
                 <div className="w-12 h-12 rounded-full bg-chart-2/10 flex items-center justify-center text-chart-2 mb-1 border border-chart-2/20">
                    <CheckCircle2 size={24} />
                 </div>
                 <h3 className="text-foreground font-bold text-lg font-sans">100% Pass Rate</h3>
                 <p className="text-muted-foreground font-sans text-xs">All 7 benchmark conditions met.</p>
               </motion.div>
            </motion.div>
         )}
         </AnimatePresence>
      </div>
    </div>
  )
}

function Typewriter({ text, delay = 40 }: { text: string; delay?: number }) {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText("");
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i));
      i++;
      if (i > text.length) clearInterval(interval);
    }, delay);
    return () => clearInterval(interval);
  }, [text, delay]);

  return <span>{displayedText}</span>;
}

function RetrievalSimulation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 0) {
      timer = setTimeout(() => setStep(1), 1800);
    } else if (step === 1) {
      timer = setTimeout(() => setStep(2), 1500);
    } else if (step === 2) {
      timer = setTimeout(() => setStep(0), 4000);
    }
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="w-full h-[320px] bg-card border border-border rounded-md p-6 flex flex-col relative overflow-hidden group shadow-sm transition-all duration-500 hover:border-primary/40">
       <div className="flex items-center gap-2 text-foreground font-bold font-sans text-[13px] mb-4 relative z-10">
         <Search size={14} className="text-primary" /> Top-3 Retrieval Precision
       </div>
       
       <div className="flex-1 flex flex-col gap-3 relative z-10 w-full mt-2">
          {/* Query Box */}
          <div className="bg-muted/50 border border-border rounded-md p-3">
             <div className="text-[9px] text-muted-foreground uppercase font-mono mb-1">Agent Query</div>
             <div className="flex items-center gap-2 text-xs font-mono text-foreground h-4">
                <span className="text-primary">{`>`}</span>
                <span className="border-r-2 border-primary pr-1">
                  {step === 0 ? <Typewriter text="Get latest user auth flow logic..." /> : "Get latest user auth flow logic..."}
                </span>
             </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 flex flex-col gap-2 relative mt-2">
             <AnimatePresence>
                {step === 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center z-0 gap-2 text-muted-foreground"
                  >
                     <div className="flex gap-1.5">
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                        <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Number.POSITIVE_INFINITY, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary/60 rounded-full" />
                     </div>
                     <span className="text-[9px] font-mono uppercase tracking-widest">Traversing Graph...</span>
                  </motion.div>
                )}
             </AnimatePresence>

             <AnimatePresence>
                {step === 2 && (
                   <div className="flex flex-col gap-2 relative z-10 h-full justify-center">
                     {[
                       { title: "auth/session_manager.ts", match: "99%", type: "CODE" },
                       { title: "auth/oauth_flow.tsx", match: "95%", type: "CODE" },
                       { title: "docs/auth_architecture.md", match: "92%", type: "DOC" }
                     ].map((doc, i) => (
                       <motion.div 
                         key={i}
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -10 }}
                         transition={{ delay: i * 0.15, type: "spring" }}
                         className="bg-card border border-chart-2/30 rounded p-2 flex items-center justify-between shadow-sm relative overflow-hidden"
                       >
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-chart-2" />
                         <div className="flex items-center gap-2 pl-2">
                            <span className="text-[8px] font-mono bg-muted text-muted-foreground px-1 py-0.5 rounded">{doc.type}</span>
                            <span className="text-[10px] font-mono text-foreground/80 truncate w-[130px]">{doc.title}</span>
                         </div>
                         <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] font-mono text-chart-2 font-bold bg-chart-2/10 px-1 py-0.5 rounded">{doc.match}</span>
                         </div>
                       </motion.div>
                     ))}
                   </div>
                )}
             </AnimatePresence>
          </div>

          <AnimatePresence>
             {step === 2 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ delay: 0.6, type: "spring" }}
                  className="absolute bottom-4 right-4 bg-card border border-border shadow-lg rounded-md px-3 py-2 flex items-center gap-2 z-20"
                >
                   <div className="w-2 h-2 rounded-full bg-chart-2 animate-pulse shadow-[0_0_8px_hsl(var(--chart-2) / 0.5)]" />
                   <span className="text-sm font-black font-sans tracking-tight">100% PRECISION</span>
                </motion.div>
             )}
          </AnimatePresence>

       </div>
    </div>
  )
}

function RetentionSimulation() {
  const [step, setStep] = useState(0);

  const incomingFacts = [
    { id: 1, text: "Project: React" },
    { id: 2, text: "Theme: Dark" },
    { id: 3, text: "API: GraphQL" },
    { id: 4, text: "Auth: JWT" },
    { id: 5, text: "Deploy: AWS" },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step <= incomingFacts.length) {
      timer = setTimeout(() => setStep(s => s + 1), 1400);
    } else {
      timer = setTimeout(() => setStep(0), 3000);
    }
    return () => clearTimeout(timer);
  }, [step]);

  const visibleStandard = incomingFacts.slice(Math.max(0, step - 3), step);
  const droppedStandard = step > 3 && step <= incomingFacts.length ? incomingFacts[step - 4] : null;

  return (
    <div className="w-full h-[320px] bg-card border border-border rounded-md p-5 flex flex-col relative overflow-hidden group shadow-sm transition-all duration-500 hover:border-primary/40">
       <div className="flex items-center justify-between mb-3 relative z-10">
         <div className="flex items-center gap-2 text-foreground font-bold font-sans text-[13px]">
           <Database size={14} className="text-primary" /> Context Retention
         </div>
       </div>
       
       <div className="flex-1 flex gap-3 w-full relative z-10">
          
          {/* Left: Standard Session Agent */}
          <div className="flex-1 bg-muted/20 border border-border/50 rounded-md p-3 flex flex-col relative overflow-hidden">
             <div className="text-[9px] font-mono uppercase text-muted-foreground mb-2 flex items-center justify-between">
                <span>Session Agent</span>
                <span className="text-destructive bg-destructive/10 px-1 rounded">Decays</span>
             </div>
             
             {/* Context Window */}
             <div className="border border-border/50 rounded-md p-2 h-[120px] flex flex-col justify-end gap-1.5 overflow-hidden bg-card/50">
               <AnimatePresence mode="popLayout">
                 {visibleStandard.map((fact) => (
                   <motion.div 
                     key={`std-${fact.id}`}
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                     className="bg-muted p-1.5 rounded text-[10px] font-mono text-foreground border border-border/30 truncate"
                   >
                     {fact.text}
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>

             {/* Overflow Area */}
             <div className="mt-3 bg-destructive/5 border border-destructive/10 rounded-md flex-1 flex flex-col items-center justify-center p-2">
               <AnimatePresence mode="wait">
                 {droppedStandard ? (
                   <motion.div
                     key={`drop-${droppedStandard.id}`}
                     initial={{ opacity: 0, y: -10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="text-[9px] font-mono text-destructive flex flex-col items-center gap-1 text-center"
                   >
                     <AlertCircle size={12} />
                     <span>Lost: {droppedStandard.text}</span>
                   </motion.div>
                 ) : (
                   <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-muted-foreground/50 font-mono">Void</motion.span>
                 )}
               </AnimatePresence>
             </div>
          </div>

          {/* Right: MemoryOS */}
          <div className="flex-1 bg-primary/5 border border-primary/20 rounded-md p-3 flex flex-col relative overflow-hidden">
             <div className="text-[9px] font-mono uppercase text-primary font-bold mb-2 flex items-center justify-between">
                <span>MemoryOS</span>
                <span className="text-chart-2 bg-chart-2/10 px-1 rounded">100%</span>
             </div>
             
             {/* Context Window */}
             <div className="border border-primary/20 rounded-md p-2 h-[120px] flex flex-col justify-end gap-1.5 overflow-hidden bg-card/50 relative z-10">
               <AnimatePresence mode="popLayout">
                 {visibleStandard.map((fact) => (
                   <motion.div 
                     key={`mos-${fact.id}`}
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 20, scale: 0.8 }} 
                     className="bg-primary/10 p-1.5 rounded text-[10px] font-mono text-foreground border border-primary/20 truncate"
                   >
                     {fact.text}
                   </motion.div>
                 ))}
               </AnimatePresence>
             </div>

             {/* Graph Archive Area */}
             <div className="mt-3 bg-chart-2/5 border border-chart-2/20 rounded-md flex-1 flex flex-col items-center justify-center p-2">
               <AnimatePresence mode="wait">
                 {droppedStandard ? (
                   <motion.div
                     key={`arch-${droppedStandard.id}`}
                     initial={{ opacity: 0, scale: 0.8, y: -10 }}
                     animate={{ opacity: 1, scale: 1, y: 0 }}
                     exit={{ opacity: 0 }}
                     className="text-[9px] font-mono text-chart-2 flex flex-col items-center gap-1 text-center"
                   >
                     <CheckCircle2 size={12} />
                     <span>Saved: {droppedStandard.text}</span>
                   </motion.div>
                 ) : (
                   <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-chart-2/50 font-mono">Core Graph</motion.span>
                 )}
               </AnimatePresence>
             </div>
          </div>

       </div>
    </div>
  )
}

function ContradictionSimulation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 0) timer = setTimeout(() => setStep(1), 1000); 
    if (step === 1) timer = setTimeout(() => setStep(2), 2000); 
    if (step === 2) timer = setTimeout(() => setStep(3), 2000); 
    if (step === 3) timer = setTimeout(() => setStep(4), 2000); 
    if (step === 4) timer = setTimeout(() => setStep(0), 4000); 
    return () => clearTimeout(timer);
  }, [step]);

  return (
     <div className="w-full h-[320px] bg-card border border-border rounded-md overflow-hidden flex flex-col relative group shadow-sm font-mono text-[10px] transition-all duration-500 hover:border-primary/40">
        <div className="bg-muted/30 px-4 py-3 border-b border-border flex items-center justify-between z-10 relative">
           <div className="flex items-center gap-2 text-foreground font-bold font-sans text-[13px]">
             <ShieldCheck size={14} className="text-primary" /> Contradiction Engine
           </div>
           <div className="bg-chart-2/10 text-chart-2 px-2 py-0.5 rounded uppercase tracking-wider font-bold">0% Miss Rate</div>
        </div>
        
        <div className="p-5 flex flex-col gap-0 flex-1 relative z-0 overflow-hidden bg-card/30">
           
           {/* Vertical timeline line */}
           <div className="absolute left-9 top-6 bottom-6 w-px bg-border/60 z-0" />

           {/* Step 1: Incoming Memory */}
           <AnimatePresence>
             {step >= 1 && (
               <motion.div 
                 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                 className="relative z-10 flex gap-3 mb-4"
               >
                  <div className="w-8 flex justify-center mt-2 shrink-0">
                     <div className="w-2 h-2 rounded-full bg-primary ring-4 ring-primary/20" />
                  </div>
                  <div className="flex-1 bg-card border border-border/60 p-2.5 rounded-md shadow-sm">
                     <div className="text-[9px] font-mono uppercase text-muted-foreground mb-1">Incoming Session Fact</div>
                     <div className="text-[10px] text-foreground font-bold leading-relaxed">"Disable rate limits for API key #110"</div>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Step 2: Conflict Detection */}
           <AnimatePresence>
             {step >= 2 && (
               <motion.div 
                 initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                 className="relative z-10 flex gap-3 mb-4"
               >
                  <div className="w-8 flex justify-center mt-2 shrink-0">
                     <div className="w-2 h-2 rounded-full bg-destructive ring-4 ring-destructive/20 animate-pulse" />
                  </div>
                  <div className="flex-1 bg-destructive/5 border border-destructive/30 p-2.5 rounded-md shadow-sm">
                     <div className="text-destructive font-bold mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wider"><AlertCircle size={10} /> Graph Conflict</div>
                     <p className="text-muted-foreground/80 leading-relaxed text-[9px]">Violates immutable rule <span className="bg-destructive/10 text-destructive px-1 py-0.5 rounded font-bold">#strict_rate_limits</span>.</p>
                  </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Step 3 & 4: Resolution */}
           <div className="mt-auto relative z-10 flex gap-3">
             <AnimatePresence mode="wait">
                {step === 3 && (
                   <motion.div key="resolving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-3 w-full">
                      <div className="w-8 flex justify-center shrink-0">
                         <Zap size={12} className="text-primary animate-pulse" />
                      </div>
                      <span className="text-primary text-[9px] uppercase tracking-widest font-bold">Resolving contradiction...</span>
                   </motion.div>
                )}
                
                {step === 4 && (
                   <motion.div 
                     key="resolved"
                     initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                     className="flex gap-3 w-full"
                   >
                      <div className="w-8 flex justify-center mt-2 shrink-0">
                         <div className="w-2 h-2 rounded-full bg-chart-2 ring-4 ring-chart-2/20" />
                      </div>
                      <div className="flex-1 bg-chart-2/5 border border-chart-2/30 p-2.5 rounded-md shadow-sm">
                         <div className="text-chart-2 font-bold mb-1 flex items-center gap-1.5 text-[9px] uppercase tracking-wider"><CheckCircle2 size={10} /> Resolved & Patched</div>
                         <p className="text-foreground/80 leading-relaxed text-[10px]">Fact discarded. Core rule retained.</p>
                      </div>
                   </motion.div>
                )}
             </AnimatePresence>
           </div>
        </div>
     </div>
  )
}

function InteroperabilitySimulation() {
  return (
    <div className="w-full h-[320px] bg-card border border-border rounded-md p-6 flex flex-col relative overflow-hidden group shadow-sm font-mono text-[10px] transition-all duration-500 hover:border-primary/40">
       <div className="flex items-center justify-between z-10 relative mb-4">
           <div className="flex items-center gap-2 text-foreground font-bold font-sans text-[13px]">
             <Network size={14} className="text-primary" /> Production Interoperability
           </div>
           <div className="bg-primary/10 text-primary px-2 py-0.5 rounded uppercase tracking-wider font-bold">Multi-Protocol</div>
        </div>

        <div className="flex-1 relative w-full h-full flex items-center justify-center mt-2">
           
           {/* Connecting Lines Layer */}
           <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {/* SDK to Core */}
              <line x1="50%" y1="15%" x2="50%" y2="50%" stroke="currentColor" className="text-border/60" strokeWidth="2" strokeDasharray="4 4" />
              {/* MCP to Core */}
              <line x1="20%" y1="85%" x2="50%" y2="50%" stroke="currentColor" className="text-border/60" strokeWidth="2" strokeDasharray="4 4" />
              {/* HTTP to Core */}
              <line x1="80%" y1="85%" x2="50%" y2="50%" stroke="currentColor" className="text-border/60" strokeWidth="2" strokeDasharray="4 4" />

              {/* Packets */}
              <motion.circle r="3.5" fill="hsl(var(--primary))" animate={{ cy: ["15%", "50%"] }} cx="50%" transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }} />
              <motion.circle r="3.5" fill="hsl(var(--chart-2))" animate={{ cx: ["20%", "50%"], cy: ["85%", "50%"] }} transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: 0.5 }} />
              <motion.circle r="3.5" fill="hsl(var(--destructive))" animate={{ cx: ["80%", "50%"], cy: ["85%", "50%"] }} transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: 1 }} />
              
              {/* Reverse Packets (Responses) */}
              <motion.circle r="2" fill="hsl(var(--primary) / 0.6)" animate={{ cy: ["50%", "15%"] }} cx="50%" transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: 0.75 }} />
              <motion.circle r="2" fill="hsl(var(--chart-2) / 0.6)" animate={{ cx: ["50%", "20%"], cy: ["50%", "85%"] }} transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: 1.4 }} />
              <motion.circle r="2" fill="hsl(var(--destructive) / 0.6)" animate={{ cx: ["50%", "80%"], cy: ["50%", "85%"] }} transition={{ duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: "linear", delay: 0.6 }} />
           </svg>

           {/* Center Node (MemoryOS) */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }} className="w-16 h-16 bg-card border-2 border-primary rounded-md flex flex-col items-center justify-center shadow-[0_0_20px_hsl(var(--primary) / 0.25)] relative overflow-hidden">
                 <div className="absolute inset-0 bg-primary/10" />
                 <Database size={20} className="text-primary relative z-10" />
                 <span className="font-bold font-sans text-[10px] text-foreground relative z-10 mt-1">CORE</span>
              </motion.div>
           </div>

           {/* Top Node (TypeScript SDK) */}
           <div className="absolute top-[5%] left-1/2 -translate-x-1/2 z-10">
              <div className="bg-card border border-border rounded-md p-2.5 flex items-center gap-2 shadow-sm min-w-[130px] justify-center relative overflow-hidden group-hover:border-primary/40 transition-colors">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                 <Code2 size={12} className="text-muted-foreground" />
                 <span className="font-sans font-bold text-[11px] text-foreground">TypeScript SDK</span>
              </div>
           </div>

           {/* Bottom Left Node (MCP Native) */}
           <div className="absolute bottom-[5%] left-[5%] z-10">
              <div className="bg-card border border-border rounded-md p-2.5 flex items-center gap-2 shadow-sm min-w-[120px] justify-center relative overflow-hidden group-hover:border-chart-2/40 transition-colors">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-chart-2" />
                 <TerminalSquare size={12} className="text-muted-foreground" />
                 <span className="font-sans font-bold text-[11px] text-foreground">MCP Native</span>
              </div>
           </div>

           {/* Bottom Right Node (HTTP API) */}
           <div className="absolute bottom-[5%] right-[5%] z-10">
              <div className="bg-card border border-border rounded-md p-2.5 flex items-center gap-2 shadow-sm min-w-[120px] justify-center relative overflow-hidden group-hover:border-destructive/40 transition-colors">
                 <div className="absolute right-0 top-0 bottom-0 w-1 bg-destructive" />
                 <Globe size={12} className="text-muted-foreground" />
                 <span className="font-sans font-bold text-[11px] text-foreground">HTTP API</span>
              </div>
           </div>

        </div>
    </div>
  )
}

export function BenchmarksSection() {
  return (
    <section className="bg-background py-32 border-b border-border font-sans relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-20">
        <Reveal>
          <h2 className="text-center text-3xl font-semibold tracking-[-0.03em] text-foreground md:text-5xl">
            Benchmarked continuity outcomes
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-center text-base text-muted-foreground md:text-lg">
            Forget generic storage. MemoryOS is measured entirely on retrieve precision, resume fidelity, and automated conflict resolution.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mt-16">
          
          <Reveal delay={0.1} className="lg:col-span-5">
            <TestRunner />
          </Reveal>
          
          <Reveal delay={0.2} className="lg:col-span-3">
            <RetrievalSimulation />
          </Reveal>
          
          <Reveal delay={0.3} className="lg:col-span-4">
            <RetentionSimulation />
          </Reveal>

          <Reveal delay={0.4} className="lg:col-span-6">
            <ContradictionSimulation />
          </Reveal>
          
          <Reveal delay={0.5} className="lg:col-span-6">
            <InteroperabilitySimulation />
          </Reveal>

        </div>
      </div>
    </section>
  );
}

