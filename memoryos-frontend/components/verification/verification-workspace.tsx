"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, Target, Activity, FileText, Database, CheckCircle2, Play, Pause, SkipBack, FastForward, Fingerprint, FileCheck } from "lucide-react"

import { VerificationRuns } from "./runs"
import { VerificationPassFail } from "./pass-fail"
import { VerificationAssurance } from "./assurance"
import { VerificationCertificates } from "./certificates"

export function VerificationWorkspace({ initialLens = 'runs' }: { initialLens?: string }) {
  const [activeLens, setActiveLens] = useState(initialLens)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (initialLens) setActiveLens(initialLens)
  }, [initialLens])

  const lenses = [
    { id: 'runs', label: 'Verifier Runs', icon: <Activity className="size-4" /> },
    { id: 'pass-fail', label: 'PASS / FAIL', icon: <CheckCircle2 className="size-4" /> },
    { id: 'assurance', label: 'Assurance', icon: <Target className="size-4" /> },
    { id: 'certificates', label: 'Certificates', icon: <Fingerprint className="size-4" /> },
  ]

  const TIMELINE_STEPS = [
    { id: "s1", time: "11:20", label: "Mission Started", icon: <Target className="size-4"/>, progress: 0 },
    { id: "s2", time: "11:21", label: "Evidence Gathered", icon: <Database className="size-4"/>, progress: 20 },
    { id: "s3", time: "11:22", label: "Claims Extracted", icon: <FileCheck className="size-4"/>, progress: 40 },
    { id: "s4", time: "11:25", label: "Verification", icon: <Activity className="size-4"/>, progress: 60 },
    { id: "s5", time: "11:32", label: "Certificate", icon: <Fingerprint className="size-4"/>, progress: 80 },
    { id: "s6", time: "11:35", label: "Settlement", icon: <CheckCircle2 className="size-4"/>, progress: 100 },
  ]

  return (
    <div className="flex flex-col h-full w-full bg-[#fafafa]">
      
      {/* Verification Header */}
      <div className="bg-white border-b border-black/5 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-semibold tracking-tight text-black flex items-center gap-2">
               <ShieldCheck className="size-5 text-[#2da44e]" /> Mission Quality & Trust
            </h1>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#e6ffec] text-[#2da44e]">
              <CheckCircle2 className="size-3" /> Fully Verified
            </div>
          </div>
          <p className="text-xs text-black/50">Cryptographic assurance of all mission outputs.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-black/5 p-1 rounded-md">
           {lenses.map(lens => (
              <button 
                key={lens.id}
                onClick={() => setActiveLens(lens.id)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeLens === lens.id ? 'bg-white text-black shadow-sm' : 'text-black/60 hover:text-black hover:bg-white/50'}`}
              >
                 <span className={activeLens === lens.id ? 'text-[#0f52ff]' : ''}>{lens.icon}</span> {lens.label}
              </button>
           ))}
        </div>
      </div>

      {/* 3-Pane Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
         
         {/* Left: Timeline Replay Scrubber */}
         <div className="w-[280px] bg-white border-r border-black/5 flex flex-col shrink-0">
            <div className="p-4 border-b border-black/5 font-semibold text-black text-sm flex items-center justify-between">
               Verification Timeline
               <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-black/5 rounded" onClick={() => setProgress(0)}><SkipBack className="size-3.5 text-black/50" /></button>
                  <button className="p-1 hover:bg-black/5 rounded text-[#2da44e]" onClick={() => setIsPlaying(!isPlaying)}>
                     {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>
                  <button className="p-1 hover:bg-black/5 rounded" onClick={() => setProgress(100)}><FastForward className="size-3.5 text-black/50" /></button>
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
               <div className="relative pl-6 space-y-6 before:absolute before:inset-y-2 before:left-2 before:w-px before:bg-black/10">
                  {TIMELINE_STEPS.map((step, idx) => {
                     const isPassed = progress >= step.progress
                     const isCurrent = progress >= step.progress && (idx === TIMELINE_STEPS.length - 1 || progress < TIMELINE_STEPS[idx+1].progress)
                     
                     return (
                        <div key={step.id} className="relative cursor-pointer group" onClick={() => setProgress(step.progress)}>
                           <div className={`absolute -left-[29px] top-1 size-4 rounded-full border-2 flex items-center justify-center transition-colors ${isCurrent ? 'bg-[#2da44e] border-white shadow-[0_0_0_2px_rgba(45,164,78,0.2)]' : isPassed ? 'bg-[#2da44e] border-white' : 'bg-white border-black/20 group-hover:border-black/40'}`}>
                              {isPassed && !isCurrent && <div className="size-1.5 bg-white rounded-full" />}
                              {isCurrent && <div className="size-1.5 bg-white rounded-full animate-pulse" />}
                           </div>
                           
                           <div className={`text-sm font-semibold transition-colors flex items-center gap-2 ${isCurrent ? 'text-[#2da44e]' : isPassed ? 'text-black' : 'text-black/40'}`}>
                              {step.label}
                           </div>
                           <div className="text-xs text-black/40">{step.time}</div>
                        </div>
                     )
                  })}
               </div>
            </div>
         </div>

         {/* Center: Live Verification Canvas (The Active Lens) */}
         <div className="flex-1 bg-[#fafafa] relative overflow-hidden flex flex-col min-w-0">
            {activeLens === 'runs' && <VerificationRuns />}
            {activeLens === 'pass-fail' && <VerificationPassFail />}
            {activeLens === 'assurance' && <VerificationAssurance />}
            {activeLens === 'certificates' && <VerificationCertificates />}
         </div>
      </div>
    </div>
  )
}
