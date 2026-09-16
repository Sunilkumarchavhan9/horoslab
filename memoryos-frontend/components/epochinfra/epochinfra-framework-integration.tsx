"use client";

import React, { useState } from "react";
import { Terminal, Box, Settings, RefreshCw, Copy, Check, Hexagon, Circle, Triangle, Square, Code, Cpu, ChevronRight } from "lucide-react";

const FRAMEWORKS = [
  { id: "claude", name: "Claude Code", icon: <Terminal size={18} className="text-[#ff6600]" />, selected: true },
  { id: "codex", name: "Codex", icon: <Box size={18} className="text-[#00a67e]" /> },
  { id: "opencode", name: "OpenCode", icon: <Square size={18} className="text-[#fff]" /> },
  { id: "pi", name: "Pi", icon: <Circle size={18} className="text-[#f0f0f0]" /> },
  { id: "aider", name: "Aider", icon: <Triangle size={18} className="text-[#00ff9d]" /> },
  { id: "qwen", name: "Qwen Code", icon: <Hexagon size={18} className="text-[#6d28d9]" /> },
  { id: "kilo", name: "Kilo Code", icon: <Code size={18} className="text-[#eab308]" /> },
  { id: "goose", name: "Goose", icon: <Terminal size={18} className="text-[#777]" /> },
  { id: "continue", name: "Continue", icon: <Hexagon size={18} className="text-[#fff]" /> },
  { id: "cline", name: "Cline", icon: <Box size={18} className="text-[#3b82f6]" /> },
  { id: "droid", name: "Droid (Factory)", icon: <Cpu size={18} className="text-[#999]" /> },
  { id: "grok", name: "Grok Build", icon: <Terminal size={18} className="text-[#fff]" /> },
  { id: "hermes", name: "Hermes", icon: <Circle size={18} className="text-[#ff0000]" /> },
  { id: "openclaw", name: "OpenClaw", icon: <Triangle size={18} className="text-[#ef4444]" /> },
  { id: "zed", name: "Zed", icon: <Square size={18} className="text-[#fff]" /> },
  { id: "crush", name: "Crush", icon: <Box size={18} className="text-[#8b5cf6]" /> },
  { id: "cursor", name: "Cursor", icon: <Circle size={18} className="text-[#fff]" /> },
  { id: "fx", name: "Fx", icon: <Terminal size={18} className="text-[#888]" /> },
];

export function EpochInfraFrameworkIntegration() {
  const [copied, setCopied] = useState(false);
  const selectedFramework = FRAMEWORKS[0]; // Hardcoded Claude Code to match image

  const handleCopy = () => {
    navigator.clipboard.writeText(`npx @epochinfra/connect ${selectedFramework.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full flex flex-col lg:flex-row items-start justify-between gap-16 py-20 border-t border-dashed border-[#222]">
      
      {/* Left Column: Grid & Copy */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <h2 className="text-[36px] sm:text-[42px] leading-[1.1] font-bold text-[#F0EFE2] mb-6 tracking-tight">
          Keep your framework.<br />Change the <span className="bg-[#75bf00] text-black px-2 py-0.5 inline-block">reality</span>.
        </h2>
        
        <p className="text-[17px] text-[#A0A0A0] leading-relaxed mb-10 pr-0 sm:pr-12">
          One command points the physical agent framework you already run at EpochInfra. One takes it back.
        </p>

        {/* The Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {FRAMEWORKS.map((fw) => (
            <div 
              key={fw.id} 
              className={`flex items-center gap-3 p-3 border ${fw.selected ? 'border-[#75bf00] bg-[#151515]' : 'border-[#222] bg-[#111] hover:bg-[#1a1a1a]'} rounded-[2px] transition-colors cursor-pointer group`}
            >
              <div className="w-8 h-8 rounded-sm bg-[#1a1a1a] border border-[#333] flex items-center justify-center shrink-0">
                {fw.icon}
              </div>
              <span className={`text-[13px] font-semibold ${fw.selected ? 'text-[#F0EFE2]' : 'text-[#888] group-hover:text-[#ccc]'} truncate`}>
                {fw.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 text-[12px] text-[#888]">
          Every flag, and what preview still needs. <a href="#" className="text-[#F0EFE2] underline decoration-[#555] hover:decoration-white transition-colors">Read the guide</a>
        </div>
      </div>

      {/* Right Column: Connection Steps */}
      <div className="w-full lg:w-1/2 flex flex-col pt-4">
        
        {/* Header (Ready badge + Name) */}
        <div className="flex flex-col mb-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="border border-[#75bf00] text-[#75bf00] text-[10px] font-bold px-1.5 py-0.5 uppercase tracking-wide rounded-sm">Ready</span>
            <span className="text-[#F0EFE2] font-bold text-[15px]">{selectedFramework.name}</span>
          </div>
          <p className="text-[13px] text-[#888]">Automatic setup, verified live against EpochInfra.</p>
        </div>

        {/* Steps List */}
        <div className="relative flex flex-col space-y-10 border-l border-dashed border-[#333] pl-8 ml-3">
          
          {/* Step 1 */}
          <div className="relative">
            <div className="absolute -left-[45px] top-0 w-6 h-6 rounded-full bg-white text-black font-bold text-[12px] flex items-center justify-center shadow-[0_0_0_4px_#111]">1</div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[#F0EFE2] font-bold text-[18px]">Run it</h3>
              <button onClick={handleCopy} className="flex items-center gap-1.5 text-[12px] text-[#888] hover:text-white transition-colors">
                {copied ? <Check size={14} className="text-[#75bf00]" /> : <Copy size={14} />}
                {copied ? <span className="text-[#75bf00]">Copied</span> : <span>Copy</span>}
              </button>
            </div>
            
            <div className="w-full bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-[2px] font-mono text-[13px] text-[#C8C7BA] mb-3">
              <span className="text-[#777]">npx</span> <span className="text-[#75bf00]">@epochinfra/connect</span> {selectedFramework.id}
            </div>
            <p className="text-[12px] text-[#666]">Node 20 or newer.</p>
          </div>

          {/* Step 2 */}
          <div className="relative">
            <div className="absolute -left-[45px] top-0 w-6 h-6 rounded-full bg-[#222] text-[#888] font-bold text-[12px] flex items-center justify-center shadow-[0_0_0_4px_#111]">2</div>
            <h3 className="text-[#F0EFE2] font-bold text-[18px] mb-2">Paste your key</h3>
            <p className="text-[14px] text-[#888] mb-3">Once. Every agent reuses it.</p>
            <a href="#" className="text-[13px] text-[#888] hover:text-white flex items-center gap-1 transition-colors">
              Get your key <ChevronRight size={14} />
            </a>
          </div>

          {/* Step 3 */}
          <div className="relative">
            <div className="absolute -left-[45px] top-0 w-6 h-6 rounded-full bg-[#222] text-[#888] font-bold text-[12px] flex items-center justify-center shadow-[0_0_0_4px_#111]">3</div>
            <h3 className="text-[#F0EFE2] font-bold text-[18px] mb-2">Approve the change</h3>
            <p className="text-[14px] text-[#888] mb-2">
              Writes <code className="bg-[#1a1a1a] border border-[#333] px-1.5 py-0.5 rounded-sm text-[12px]">~/.claude/settings.json</code>
            </p>
            <p className="text-[12px] text-[#666]">The check request uses credits.</p>
          </div>

          {/* Step 4 */}
          <div className="relative">
            <div className="absolute -left-[45px] top-0 w-6 h-6 rounded-full bg-[#222] text-[#888] font-bold text-[12px] flex items-center justify-center shadow-[0_0_0_4px_#111]">4</div>
            <h3 className="text-[#F0EFE2] font-bold text-[18px] mb-2">Restart {selectedFramework.name}</h3>
            <p className="text-[12px] text-[#666]">
              Undo with <code className="text-[#888]">epochinfra-connect {selectedFramework.id} off</code>.
            </p>
          </div>

        </div>

      </div>

    </section>
  );
}
