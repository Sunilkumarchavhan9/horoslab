"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Zap, BrainCircuit, Activity, RefreshCw, Terminal } from "lucide-react";
import { RiSlackFill } from "@remixicon/react";
import { siGithub, siJira, siLinear, siNotion, siPagerduty } from "simple-icons";
import { useEffect, useState, useRef } from "react";

function SimpleIcon({ icon, size = 16, className }: { icon: any; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d={icon.path} />
    </svg>
  );
}

// 12-second cycle matched by a 1.5x slow-down factor to make it smoother
const SPEED_FACTOR = 1.5;
const CYCLE_MS = 12000 * SPEED_FACTOR;

// All events mapped to their exact millisecond in the cycle
const LOG_EVENTS = [
  // GitHub (delay 0s)
  { time: 0, type: "INGEST", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", msg: "Ingesting PR #802 (Add rate limiting)" },
  { time: 700, type: "GRAPH", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", msg: "Mapping PR to entity: AuthService" },
  { time: 1700, type: "AGENT EXP", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Found 2 past failures. Injecting constraint: 'Requires Redis lock'" },
  { time: 2700, type: "CORE", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", msg: "Compiling context into Inheritance Package" },
  { time: 3700, type: "AGENT", color: "text-[#5b5b9e]", bg: "bg-[#5b5b9e]/10", border: "border-[#5b5b9e]/30", msg: "Agent spawned with Package hash 0x7F2B" },
  { time: 4500, type: "LEARN", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Outcome captured. Next agent avoids race condition." },

  // Docs (delay 2s)
  { time: 2000, type: "INGEST", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", msg: "Parsing Notion page: V2 API Guidelines" },
  { time: 2700, type: "GRAPH", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", msg: "Linking docs to /api/v2 endpoints" },
  { time: 3700, type: "AGENT EXP", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Extracting standard auth headers" },
  { time: 4700, type: "CORE", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", msg: "Updating global inheritance rules" },
  { time: 5700, type: "AGENT", color: "text-[#5b5b9e]", bg: "bg-[#5b5b9e]/10", border: "border-[#5b5b9e]/30", msg: "Agent run complete (sync)" },
  { time: 6500, type: "LEARN", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "API rules successfully distributed." },

  // Issues (delay 4s)
  { time: 4000, type: "INGEST", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", msg: "Syncing ticket: ENG-941 (Checkout bug)" },
  { time: 4700, type: "GRAPH", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", msg: "Tracing proof to CheckoutComponent" },
  { time: 5700, type: "AGENT EXP", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Flagged risky file: checkout.tsx" },
  { time: 6700, type: "CORE", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", msg: "Building targeted test suite package" },
  { time: 7700, type: "AGENT", color: "text-[#5b5b9e]", bg: "bg-[#5b5b9e]/10", border: "border-[#5b5b9e]/30", msg: "Agent testing edge cases" },
  { time: 8500, type: "LEARN", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Added regression test to memory." },

  // Incidents (delay 6s)
  { time: 6000, type: "INGEST", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", msg: "Alert: High latency on Database" },
  { time: 6700, type: "GRAPH", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", msg: "Mapping alert to recent deploys" },
  { time: 7700, type: "AGENT EXP", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Correlated with missing index" },
  { time: 8700, type: "CORE", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", msg: "Generating rollback/fix package" },
  { time: 9700, type: "AGENT", color: "text-[#5b5b9e]", bg: "bg-[#5b5b9e]/10", border: "border-[#5b5b9e]/30", msg: "Agent diagnosing DB plan" },
  { time: 10500, type: "LEARN", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Index recommendation added." },

  // Chats (delay 8s)
  { time: 8000, type: "INGEST", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", msg: "Developer chat: 'Use the new fetcher'" },
  { time: 8700, type: "GRAPH", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", msg: "Updating intent graph for fetch wrapper" },
  { time: 9700, type: "AGENT EXP", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Deprecating old axios usage in memory" },
  { time: 10700, type: "CORE", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", msg: "Compiling updated code standards" },
  { time: 11700, type: "AGENT", color: "text-[#5b5b9e]", bg: "bg-[#5b5b9e]/10", border: "border-[#5b5b9e]/30", msg: "Agent rewriting old instances" },
  { time: 500, type: "LEARN", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Pattern solidified. (cycle wrap)" },

  // Corrections (delay 10s)
  { time: 10000, type: "INGEST", color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", msg: "Human correction: 'Wrong API key used'" },
  { time: 10700, type: "GRAPH", color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", msg: "Tracing to SecretsManager" },
  { time: 11700, type: "AGENT EXP", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Adding strict validation constraint" },
  { time: 700, type: "CORE", color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/30", msg: "Compiling updated auth constraints" },
  { time: 1700, type: "AGENT", color: "text-[#5b5b9e]", bg: "bg-[#5b5b9e]/10", border: "border-[#5b5b9e]/30", msg: "Agent verifying new keys" },
  { time: 2500, type: "LEARN", color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/30", msg: "Next agent will not repeat mistake." },
].map(e => ({ ...e, time: e.time * SPEED_FACTOR })).sort((a, b) => a.time - b.time); // Scale and sort

type LogEvent = typeof LOG_EVENTS[0] & { id: string; timestamp: Date };

export function WhatWeDoSection() {
  const [mounted, setMounted] = useState(false);
  
  // Telemetry state
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const lastTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    setMounted(true);
    
    // We establish a stable "start time" for the cycle to sync perfectly
    const startOffset = Date.now();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - startOffset) % CYCLE_MS;
      
      if (lastTimeRef.current !== null) {
        let prev = lastTimeRef.current;
        
        // Find events that occurred between prev and elapsed
        // Handle cycle wrap-around
        const newlyFiredEvents = LOG_EVENTS.filter(event => {
          if (prev < elapsed) {
            return event.time >= prev && event.time < elapsed;
          } else {
            // Wrapped around
            return event.time >= prev || event.time < elapsed;
          }
        });

        if (newlyFiredEvents.length > 0) {
          setLogs(current => {
            const added = newlyFiredEvents.map(e => ({ 
              ...e,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date()
            }));
            
            // Keep last 8 logs
            const next = [...current, ...added];
            if (next.length > 8) return next.slice(next.length - 8);
            return next;
          });
        }
      }
      
      lastTimeRef.current = elapsed;
    }, 100); // check 10 times a second
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-white text-slate-900 py-16 md:py-24 relative font-sans border-y border-slate-200 min-h-screen flex flex-col items-center justify-start overflow-hidden">
      
      {/* Headers */}
      <div className="text-center mb-4 md:mb-8 max-w-4xl px-6 relative z-20">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6 text-slate-900 drop-shadow-sm">
          Company work becomes agent inheritance.
        </h2>
        <p className="text-lg md:text-xl text-slate-600 leading-relaxed font-light">
          <strong className="font-semibold text-slate-900">memoryos™</strong> turns GitHub, docs, issues, incidents, agent chats, and human corrections into governed inheritance packages every AI agent can use before work.
        </p>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 flex flex-col lg:flex-row items-center justify-between gap-12 mt-4 md:mt-8 z-20">
        
        {/* 5-Layer 3D Infrastructure Stack - Sequential Live Pipeline */}
        <div className="relative w-full lg:w-1/2 h-[500px] md:h-[650px] flex items-center justify-center perspective-container">
          {mounted && (
            <div 
              className="relative w-[280px] h-[340px] md:w-[450px] md:h-[500px] 3d-scene"
              style={{ 
                transformStyle: 'preserve-3d',
                transform: 'rotateX(62deg) rotateZ(-40deg)',
              }}
            >
              {/* Corner frustum lines linking from Top (Z=200) to Bottom (Z=-200) */}
              <FrustumLine top={0} left={0} height={400} startZ={200} />
              <FrustumLine top="100%" left={0} height={400} startZ={200} />
              <FrustumLine top={0} left="100%" height={400} startZ={200} />
              <FrustumLine top="100%" left="100%" height={400} startZ={200} />

              {/* Layer 5: Output & Feedback Loop */}
              <BottomLayer translateZ={-200} />

              {/* Layer 4: Core Compiler (MemoryIgnition) */}
              <CoreLayer translateZ={-50} />

              {/* Layer 3: Agent Experience Graph */}
              <AgentExperienceLayer translateZ={40} />

              {/* Layer 2: Company Memory Graph */}
              <CompanyMemoryLayer translateZ={130} />

              {/* Layer 1: Sources */}
              <TopLayer translateZ={200} />

              {/* Sequential Data Pipeline Animations */}
              <PipelineOrchestrator zScale={0.666} />
            </div>
          )}
        </div>

        {/* Live Telemetry Feed */}
        <div className="w-full lg:w-1/2 max-w-lg h-[400px] md:h-[500px] flex flex-col justify-end bg-slate-50/50 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 bg-slate-100/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-3 flex items-center gap-3 z-10">
            <Terminal size={16} className="text-slate-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Live Pipeline Telemetry</span>
            <div className="ml-auto flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Syncing</span>
            </div>
          </div>
          
          <div className="flex flex-col justify-end p-4 pt-16 overflow-hidden h-full">
            <div className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {logs.map((log) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                    className="bg-white border border-slate-100 p-3 rounded-lg shadow-sm text-sm font-mono flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${log.bg} ${log.color} ${log.border}`}>
                        {log.type}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}.{log.timestamp.getMilliseconds().toString().padStart(3, '0')}
                      </div>
                    </div>
                    <div className="text-slate-700 font-medium">
                      {log.msg}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {logs.length === 0 && (
                <div className="text-slate-400 font-mono text-sm text-center py-8">
                  Waiting for data ingestion...
                </div>
              )}
            </div>
          </div>
          
          {/* Fade out top edge of logs */}
          <div className="absolute top-12 left-0 right-0 h-12 bg-gradient-to-b from-slate-50/50 to-transparent pointer-events-none" />
        </div>

      </div>

      <style jsx>{`
        .perspective-container {
          perspective: 1600px;
          transform-origin: center center;
        }
        @media (max-width: 1024px) {
          .perspective-container {
            perspective: 1200px;
          }
        }
      `}</style>
    </section>
  );
}

function FrustumLine({ top, left, height, startZ }: { top: number | string; left: number | string; height: number; startZ: number }) {
  return (
    <div 
      className="absolute bg-[#5b5b9e]/10 w-[1px] origin-top overflow-hidden"
      style={{ 
        top, left, 
        height: `${height}px`,
        transform: `translateZ(${startZ}px) rotateX(-90deg)`,
      }} 
    />
  );
}

const SOURCES = [
  { id: "github", label: "GitHub", Icon: (props: any) => <SimpleIcon icon={siGithub} {...props} />, x: 20, y: 15, delay: 0 },
  { id: "docs", label: "Docs", Icon: (props: any) => <SimpleIcon icon={siNotion} {...props} />, x: 75, y: 30, delay: 2 * SPEED_FACTOR },
  { id: "issues", label: "Issues", Icon: (props: any) => <SimpleIcon icon={siJira} {...props} />, x: 40, y: 60, delay: 4 * SPEED_FACTOR },
  { id: "incidents", label: "Incidents", Icon: (props: any) => <SimpleIcon icon={siPagerduty} {...props} />, x: 80, y: 80, delay: 6 * SPEED_FACTOR },
  { id: "chats", label: "Agent Chats", Icon: RiSlackFill, x: 15, y: 85, delay: 8 * SPEED_FACTOR },
  { id: "corrections", label: "Corrections", Icon: (props: any) => <SimpleIcon icon={siLinear} {...props} />, x: 50, y: 90, delay: 10 * SPEED_FACTOR },
];

function TopLayer({ translateZ }: { translateZ: number }) {
  return (
    <div 
      className="absolute inset-0 border-[0.5px] border-[#5b5b9e]/30 bg-white/60 shadow-sm"
      style={{ transform: `translateZ(${translateZ}px)` }}
    >
      <div className="absolute inset-0 p-4">
        {SOURCES.map((source) => (
          <div
            key={source.id}
            className="absolute flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${source.x}%`, top: `${source.y}%` }}
          >
            <motion.div
              className="absolute inset-0 bg-[#5b5b9e]/30 rounded-full"
              animate={{
                scale: [1, 2.5, 1, 1],
                opacity: [0, 0.8, 0, 0]
              }}
              transition={{
                duration: CYCLE_MS / 1000,
                repeat: Infinity,
                times: [0, 0.05, 0.1, 1],
                delay: source.delay,
                ease: "easeOut"
              }}
            />
            <div className="bg-white border border-[#5b5b9e]/40 p-2 rounded shadow-sm text-[#5b5b9e] relative z-10">
              <source.Icon size={16} />
            </div>
            <div className="mt-1 text-[9px] font-mono text-[#5b5b9e] font-bold bg-white px-1 shadow-sm whitespace-nowrap">
              {source.label}
            </div>
          </div>
        ))}
      </div>
      <div className="absolute -top-[14px] left-4 bg-white px-3 py-0.5 text-[10px] font-mono text-[#5b5b9e] font-bold uppercase tracking-widest border border-[#5b5b9e]/30 rounded-t shadow-sm">
        Layer 1: Real-time Ingestion
      </div>
    </div>
  );
}

function CompanyMemoryLayer({ translateZ }: { translateZ: number }) {
  const graphNodes = [
    { label: "Parse Intent", x: 30, y: 30 },
    { label: "Trace Proof", x: 70, y: 20 },
    { label: "Entity Link", x: 50, y: 50 },
    { label: "Decisions", x: 20, y: 70 },
    { label: "Risky Files", x: 80, y: 80 },
  ];

  return (
    <div 
      className="absolute inset-[5%] border-[0.5px] border-[#5b5b9e]/40 bg-white/40 shadow-sm"
      style={{ transform: `translateZ(${translateZ}px)` }}
    >
      <div 
        className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'linear-gradient(#5b5b9e 1px, transparent 1px), linear-gradient(90deg, #5b5b9e 1px, transparent 1px)', 
          backgroundSize: '20px 20px' 
        }} 
      />
      {graphNodes.map((node, i) => (
        <div 
          key={i} 
          className="absolute"
          style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-2 h-2 bg-white border border-[#5b5b9e] rounded-sm shadow-[0_0_5px_rgba(91,91,158,0.5)] z-10 relative" />
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-16 text-right pr-3 text-[8px] text-[#5b5b9e] font-mono whitespace-nowrap">
            {node.label}
          </div>
        </div>
      ))}
      <div className="absolute -top-[14px] left-4 bg-white px-3 py-0.5 text-[10px] font-mono text-[#5b5b9e] font-bold uppercase tracking-widest border border-[#5b5b9e]/30 rounded-t shadow-sm">
        Layer 2: Company Memory Graph
      </div>
    </div>
  );
}

function AgentExperienceLayer({ translateZ }: { translateZ: number }) {
  const nodes = [
    { label: "Past Mistakes", x: 25, y: 40 },
    { label: "Constraints", x: 75, y: 35 },
    { label: "Best Practices", x: 40, y: 75 },
    { label: "Success Patterns", x: 85, y: 65 },
  ];

  return (
    <div 
      className="absolute inset-[15%] border-[0.5px] border-emerald-500/30 bg-emerald-50/30 shadow-sm backdrop-blur-[1px]"
      style={{ transform: `translateZ(${translateZ}px)` }}
    >
      <div 
        className="absolute inset-0 opacity-10" 
        style={{ 
          backgroundImage: 'radial-gradient(circle at 2px 2px, #10b981 1px, transparent 0)', 
          backgroundSize: '16px 16px' 
        }} 
      />
      {nodes.map((node, i) => (
        <div 
          key={i} 
          className="absolute"
          style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <div className="w-1.5 h-1.5 bg-white border border-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] z-10 relative" />
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[8px] text-emerald-700 font-mono whitespace-nowrap">
            {node.label}
          </div>
        </div>
      ))}
      <div className="absolute -top-[14px] left-4 bg-white px-3 py-0.5 text-[10px] font-mono text-emerald-600 font-bold uppercase tracking-widest border border-emerald-500/30 rounded-t shadow-sm">
        Layer 3: Agent Experience
      </div>
    </div>
  );
}

function CoreLayer({ translateZ }: { translateZ: number }) {
  return (
    <div 
      className="absolute inset-[30%] flex items-center justify-center"
      style={{ transform: `translateZ(${translateZ}px)` }}
    >
      <div className="w-24 h-24 bg-white border-[1.5px] border-[#5b5b9e] flex items-center justify-center shadow-md backdrop-blur-sm relative z-20 overflow-hidden">
        
        {/* Rotating ring */}
        <motion.div
          className="absolute w-[150%] h-[150%] border-4 border-dashed border-[#5b5b9e]/20 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />
        
        <div className="text-center relative z-10 flex flex-col items-center">
          <Zap size={20} className="text-[#5b5b9e] mb-1" />
          <div className="text-[7px] font-mono text-[#5b5b9e] font-bold uppercase tracking-widest leading-tight">
            Memory<br/>Ignition
          </div>
        </div>

        <motion.div 
          className="absolute inset-0 bg-[#5b5b9e]/10"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="absolute -top-[14px] left-4 bg-white px-3 py-0.5 text-[10px] font-mono text-[#5b5b9e] font-bold uppercase tracking-widest border border-[#5b5b9e]/30 rounded-t shadow-sm z-30">
        Layer 4: Core Compiler
      </div>
    </div>
  );
}

function BottomLayer({ translateZ }: { translateZ: number }) {
  return (
    <div 
      className="absolute -inset-[5%] border-[0.5px] border-[#5b5b9e]/30 bg-white/20 flex"
      style={{ transform: `translateZ(${translateZ}px)` }}
    >
      {/* Top Left: Inheritance Package Ready */}
      <div className="absolute left-[0%] top-0 w-[50%] h-[50%] border-b border-r border-[#5b5b9e]/30 p-4 flex flex-col justify-end">
        <div className="text-[10px] text-[#5b5b9e]/80 font-mono font-semibold flex items-center gap-1">
          <BrainCircuit size={12} />
          Inheritance Package
        </div>
      </div>

      {/* Top Right: Agent Run Phase */}
      <div className="absolute right-[0%] top-0 w-[50%] h-[50%] border-b border-[#5b5b9e]/30 p-4 flex flex-col justify-end items-end">
        <div className="text-[10px] text-[#5b5b9e]/70 font-mono text-right">
          <div className="font-bold flex items-center justify-end gap-1"><Activity size={10}/> Agent Run</div>
          <div className="text-[8px]">✓ Context Applied</div>
        </div>
      </div>

      {/* Bottom Center: Outcome Learning -> Next Agent */}
      <div className="absolute left-[25%] bottom-0 w-[50%] h-[50%] p-2 flex flex-col items-center justify-center bg-white/50 border-x border-[#5b5b9e]/30">
        <div className="text-[10px] text-[#5b5b9e] font-mono font-bold text-center z-10 flex flex-col items-center gap-1">
          Next Agent Better
          <RefreshCw size={12} className="text-emerald-500 animate-spin-slow" style={{ animationDuration: '4s' }} />
        </div>
      </div>

      <div className="absolute -top-[14px] left-4 bg-white px-3 py-0.5 text-[10px] font-mono text-[#5b5b9e] font-bold uppercase tracking-widest border border-[#5b5b9e]/30 rounded-t shadow-sm">
        Layer 5: Output & Learn
      </div>
    </div>
  );
}

function PipelineOrchestrator({ zScale = 1 }: { zScale?: number }) {
  return (
    <>
      {SOURCES.map((source) => (
        <PipelineSequence key={source.id} source={source} zScale={zScale} />
      ))}
    </>
  );
}

function PipelineSequence({ source, zScale = 1 }: { source: typeof SOURCES[0], zScale?: number }) {
  const Z_TOP = 300 * zScale;
  const Z_GRAPH = 200 * zScale;
  const Z_EXP = 60 * zScale;
  const Z_CORE = -80 * zScale;
  const Z_OUT = -300 * zScale;
  
  const CYCLE = CYCLE_MS / 1000;

  return (
    <>
      {/* 1. Packet: Source to Company Graph */}
      <motion.div
        className="absolute w-2 h-2 bg-[#5b5b9e] rounded-sm shadow-[0_0_8px_#5b5b9e]"
        style={{ left: `${source.x}%`, top: `${source.y}%`, marginLeft: '-4px', marginTop: '-4px' }}
        animate={{
          translateZ: [Z_TOP, Z_GRAPH, Z_GRAPH, Z_GRAPH, Z_GRAPH],
          opacity: [0, 1, 0, 0, 0],
        }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.02, 0.06, 0.07, 1], delay: source.delay, ease: "easeInOut" }}
      />

      {/* 2. Company Graph Node Pulse */}
      <motion.div
        className="absolute w-6 h-6 rounded-full border-2 border-[#5b5b9e]"
        style={{ left: `${source.x}%`, top: `${source.y}%`, marginLeft: '-12px', marginTop: '-12px', translateZ: Z_GRAPH }}
        animate={{ scale: [0.5, 2, 0.5, 0.5], opacity: [0, 0.8, 0, 0] }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.05, 0.1, 1], delay: source.delay + 0.6 * SPEED_FACTOR, ease: "easeOut" }}
      />

      {/* 3. Packet: Company Graph to Exp Graph */}
      <motion.div
        className="absolute w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]"
        style={{ left: `${source.x}%`, top: `${source.y}%`, marginLeft: '-4px', marginTop: '-4px' }}
        animate={{
          translateZ: [Z_GRAPH, Z_EXP, Z_EXP, Z_EXP, Z_EXP],
          opacity: [0, 1, 0, 0, 0],
        }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.02, 0.06, 0.07, 1], delay: source.delay + 1.2 * SPEED_FACTOR, ease: "easeInOut" }}
      />

      {/* 4. Exp Graph Node Pulse */}
      <motion.div
        className="absolute w-6 h-6 rounded-full border-2 border-emerald-500"
        style={{ left: `${source.x}%`, top: `${source.y}%`, marginLeft: '-12px', marginTop: '-12px', translateZ: Z_EXP }}
        animate={{ scale: [0.5, 2, 0.5, 0.5], opacity: [0, 0.8, 0, 0] }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.05, 0.1, 1], delay: source.delay + 1.7 * SPEED_FACTOR, ease: "easeOut" }}
      />

      {/* 5. Packet: Exp Graph to Core */}
      <motion.div
        className="absolute w-3 h-3 bg-white border border-[#5b5b9e] rounded-sm shadow-[0_0_10px_rgba(91,91,158,0.8)]"
        style={{ left: `${source.x}%`, top: `${source.y}%`, marginLeft: '-6px', marginTop: '-6px' }}
        animate={{
          left: [`${source.x}%`, '50%', '50%', '50%'],
          top: [`${source.y}%`, '50%', '50%', '50%'],
          translateZ: [Z_EXP, Z_CORE, Z_CORE, Z_CORE],
          opacity: [0, 1, 0, 0],
        }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.02, 0.06, 1], delay: source.delay + 2.2 * SPEED_FACTOR, ease: "easeInOut" }}
      />

      {/* 6. Core Intense Pulse */}
      <motion.div
        className="absolute w-full h-full bg-[#5b5b9e] top-0 left-0"
        style={{ translateZ: Z_CORE }}
        animate={{ opacity: [0, 0.3, 0, 0] }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.04, 0.08, 1], delay: source.delay + 2.7 * SPEED_FACTOR, ease: "easeOut" }}
      />

      {/* 7. Inheritance Package: Core to Output */}
      <motion.div
        className="absolute flex items-center justify-center bg-white border-2 border-[#5b5b9e] shadow-lg rounded"
        style={{ left: '50%', top: '50%', width: '40px', height: '40px', marginLeft: '-20px', marginTop: '-20px' }}
        animate={{
          left: ['50%', '25%', '25%', '25%'],
          top: ['50%', '25%', '25%', '25%'],
          translateZ: [Z_CORE, Z_OUT, Z_OUT, Z_OUT],
          opacity: [0, 1, 0, 0],
          rotateZ: [0, 45, 0, 0]
        }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.03, 0.08, 1], delay: source.delay + 3.2 * SPEED_FACTOR, ease: "easeInOut" }}
      >
        <CheckCircle2 size={16} className="text-[#5b5b9e]" />
      </motion.div>
      
      {/* 8. Output Layer Flash */}
      <motion.div
        className="absolute left-0 top-0 w-[50%] h-[50%] bg-[#5b5b9e]"
        style={{ translateZ: Z_OUT }}
        animate={{ opacity: [0, 0.2, 0, 0] }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.05, 0.1, 1], delay: source.delay + 4.0 * SPEED_FACTOR, ease: "easeOut" }}
      />

      {/* 9. OUTCOME LEARNING Feedback Loop (Output to Exp Graph) */}
      <motion.div
        className="absolute w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_12px_#34d399]"
        style={{ left: '50%', top: '50%', marginLeft: '-4px', marginTop: '-4px' }}
        animate={{
          translateZ: [Z_OUT, Z_EXP, Z_EXP, Z_EXP, Z_EXP],
          opacity: [0, 1, 0, 0, 0],
          scale: [1, 1.5, 2, 0, 0]
        }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.04, 0.08, 0.1, 1], delay: source.delay + 4.5 * SPEED_FACTOR, ease: "easeInOut" }}
      />
      
      {/* 10. Exp Graph receives feedback flash */}
      <motion.div
        className="absolute w-full h-full bg-emerald-400 top-0 left-0"
        style={{ translateZ: Z_EXP }}
        animate={{ opacity: [0, 0.2, 0, 0] }}
        transition={{ duration: CYCLE, repeat: Infinity, times: [0, 0.03, 0.06, 1], delay: source.delay + 4.9 * SPEED_FACTOR, ease: "easeOut" }}
      />
    </>
  );
}
