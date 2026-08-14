"use client";

import React, { useState } from "react";
import { Play, Pause, FastForward, Rewind, Clock, Zap, CheckCircle2, ShieldCheck, Activity, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandBar, SectionHeader, SplitPane } from "./execution-shared-components";

const MOCK_REPLAY_EVENTS = [
 { id: "e1", time: "11:30:00", text: "Planner created strategy", type: "system", agent: "Epoch Planner" },
 { id: "e2", time: "11:30:08", text: "Research Agent started", type: "running", agent: "Research Agent" },
 { id: "e3", time: "11:30:21", text: "Coding Agent opened PR", type: "success", agent: "Coding Agent" },
 { id: "e4", time: "11:31:10", text: "Security Review requested", type: "review", agent: "Security Verifier" },
 { id: "e5", time: "11:31:42", text: "Human Approval granted", type: "success", agent: "Engineering Manager" },
 { id: "e6", time: "11:32:05", text: "Verifier PASS", type: "success", agent: "System Verifier" },
 { id: "e7", time: "11:32:10", text: "Settlement completed", type: "system", agent: "Epoch Runtime" },
];

export function ExecutionTimeline() {
 const [isPlaying, setIsPlaying] = useState(false);
 const [activeEventIndex, setActiveEventIndex] = useState(3); // Currently at "Security Review"

 const togglePlayback = () => setIsPlaying(!isPlaying);

 return (
 <div className="flex flex-col h-full w-full bg-card dark:bg-[#0a0a0a] text-foreground dark:text-white font-sans overflow-hidden relative">
 <CommandBar className="border-b-0" />

 {/* Main Graph Area (Replay visualizer) */}
 <div className="flex-1 overflow-hidden relative flex flex-col bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.02)_0%,transparent_100%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]">
 <SectionHeader 
 title="Execution Replay" 
 description="Watch the mission unfold chronologically."
 className="p-8 pb-0 shrink-0 absolute top-0 left-0 w-full"
 />

 {/* Central Visualization (Mock) */}
 <div className="flex-1 flex items-center justify-center p-8 mt-12">
 <div className="flex flex-col items-center gap-12">
 <div className="text-[48px] font-mono font-bold text-foreground/10 dark:text-white/10 tracking-widest transition-all">
 {MOCK_REPLAY_EVENTS[activeEventIndex].time}
 </div>
 
 <div className="flex items-center gap-6">
 {[0, 1, 2, 3, 4].map((i) => (
 <React.Fragment key={i}>
 <div className={cn(
 "size-16 rounded-md flex items-center justify-center border transition-all duration-500",
 i < activeEventIndex ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 scale-95 opacity-50" :
 i === activeEventIndex ? "bg-[#0f52ff]/10 border-[#0f52ff]/50 text-[#0f52ff] shadow-[0_0_30px_rgba(15,82,255,0.2)] scale-110 ring-4 ring-[#0f52ff]/10" :
 "bg-card dark:bg-[#121212] border-border dark:border-white/10 text-foreground/30 dark:text-white/30 scale-90 opacity-30"
 )}>
 {i === 0 && <Zap className="size-6" />}
 {i === 1 && <Activity className="size-6" />}
 {i === 2 && <Terminal className="size-6" />}
 {i === 3 && <ShieldCheck className="size-6" />}
 {i === 4 && <CheckCircle2 className="size-6" />}
 </div>
 {i < 4 && (
 <div className="w-12 h-1 rounded-full bg-muted dark:bg-white/5 relative overflow-hidden">
 {i < activeEventIndex && <div className="absolute inset-0 bg-emerald-500" />}
 </div>
 )}
 </React.Fragment>
 ))}
 </div>

 <div className="text-[20px] font-bold mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
 {MOCK_REPLAY_EVENTS[activeEventIndex].agent}: {MOCK_REPLAY_EVENTS[activeEventIndex].text}
 </div>
 </div>
 </div>

 {/* Playback Controls & Timeline Scrubber */}
 <div className="absolute bottom-0 left-0 w-full h-[140px] bg-card/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-border dark:border-white/10 p-6 flex flex-col gap-6">
 <div className="flex items-center gap-6">
 <button className="p-2 rounded-full bg-muted dark:bg-white/5 hover:bg-black/10 dark:hover:bg-card/10 transition-colors text-foreground dark:text-white">
 <Rewind className="size-4" />
 </button>
 <button 
 onClick={togglePlayback}
 className="size-12 rounded-full bg-[#0f52ff] hover:bg-[#0042e6] text-white flex items-center justify-center transition-colors "
 >
 {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-1" />}
 </button>
 <button className="p-2 rounded-full bg-muted dark:bg-white/5 hover:bg-black/10 dark:hover:bg-card/10 transition-colors text-foreground dark:text-white">
 <FastForward className="size-4" />
 </button>

 {/* Scrubber Track */}
 <div className="flex-1 relative h-12 ml-4">
 <div className="absolute top-1/2 left-0 w-full h-1 -translate-y-1/2 bg-muted dark:bg-white/5 rounded-full" />
 <div 
 className="absolute top-1/2 left-0 h-1 -translate-y-1/2 bg-[#0f52ff] rounded-full transition-all duration-300"
 style={{ width: `${(activeEventIndex / (MOCK_REPLAY_EVENTS.length - 1)) * 100}%` }}
 />
 
 {/* Event Markers */}
 {MOCK_REPLAY_EVENTS.map((event, i) => {
 const percent = (i / (MOCK_REPLAY_EVENTS.length - 1)) * 100;
 const isActive = i === activeEventIndex;
 const isPast = i < activeEventIndex;
 
 return (
 <div 
 key={event.id}
 onClick={() => setActiveEventIndex(i)}
 className="absolute top-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group"
 style={{ left: `${percent}%` }}
 >
 <div className={cn(
 "size-3 rounded-full border-2 bg-card dark:bg-[#121212] transition-all duration-300 -translate-y-[6px]",
 isActive ? "border-[#0f52ff] scale-150" : 
 isPast ? "border-[#0f52ff] bg-[#0f52ff]" : 
 "border-black/20 dark:border-white/20 group-hover:border-black/40 dark:group-hover:border-white/40"
 )} />
 <span className={cn(
 "absolute top-4 text-[10px] font-mono whitespace-nowrap transition-all duration-300",
 isActive ? "text-[#0f52ff] font-bold opacity-100" : "text-foreground/40 dark:text-white/40 opacity-0 group-hover:opacity-100"
 )}>
 {event.time}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
