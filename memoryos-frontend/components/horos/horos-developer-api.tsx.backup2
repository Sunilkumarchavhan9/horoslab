"use client";

import React, { useState } from "react";
import { Copy, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NvidiaLogo, QwenLogo, GLMLogo, DeepSeekLogo } from "@/components/dhyra/primitives/brand-icons";

const MODELS = [
  { id: "nemotron-3-5-lightning-30b", label: "Nemotron 3.5 Lightning 30B", icon: <NvidiaLogo size={14} className="text-[#76b900]" /> },
  { id: "qwen3-8-27b", label: "Qwen3.8 27B", icon: <QwenLogo size={14} className="text-[#8B5CF6]" /> },
  { id: "deepseek-v3", label: "DeepSeek-V3", icon: <DeepSeekLogo size={14} className="text-[#4F46E5]" /> },
  { id: "glm-5-3-flash", label: "GLM 5.3 Flash", icon: <GLMLogo size={14} /> },
];

const TABS = ["curl", "TypeScript", "Python"];

const TAB_HEADERS: Record<string, { badge: string; title: string; link?: string }> = {
  "curl": { badge: "Shell", title: "Mission Runtime API" },
  "TypeScript": { badge: "TypeScript", title: "Dhyra SDK", link: "#" },
  "Python": { badge: "Python", title: "Dhyra SDK", link: "#" },
};

export function DhyraDeveloperAPI() {
  const [activeModel, setActiveModel] = useState(MODELS[0].id);
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCodeSnippet = () => {
    if (activeTab === "curl") {
      return `MISSION_ID="$(uuidgen)"

curl -X POST "https://api.dhyra.com/v1/missions/execute" \\
  -H "Authorization: Bearer $DHYRA_API_KEY" \\
  -H "X-Mission-Id: $MISSION_ID" \\
  -H "Content-Type: application/json" \\
  -d '{
    "intent": "Optimize factory assembly line parameters for next chassis.",
    "capabilities": ["${activeModel}", "factory-telemetry", "robotics-control"],
    "reality_surface": "industrial",
    "verification": "continuous"
  }'`;
    }
    if (activeTab === "Python") {
      return `import os
from dhyra import Dhyra

runtime = Dhyra(api_key=os.environ.get("DHYRA_API_KEY"))

mission = runtime.missions.execute(
    intent="Optimize factory assembly line parameters for next chassis.",
    capabilities=["${activeModel}", "factory-telemetry", "robotic-actuation"],
    reality_surface="industrial",
    verification="continuous"
)

print(mission.outcome_contract.status)

# Stream verified reality measurements
for measurement in mission.observe():
    print(f"Verified change: {measurement.evidence}")`;
    }
    if (activeTab === "TypeScript") {
      return `import { Dhyra } from "@dhyra/sdk";

const runtime = new Dhyra({ apiKey: process.env.DHYRA_API_KEY });

const mission = await runtime.missions.execute({
  intent: "Optimize factory assembly line parameters for next chassis.",
  capabilities: ["${activeModel}", "factory-telemetry", "robotic-actuation"],
  realitySurface: "industrial",
  verification: "continuous"
});

console.log(mission.outcomeContract.status);

// Listen to verified reality measurements
for await (const measurement of mission.observe()) {
  console.log("Verified change:", measurement.evidence);
}`;
    }
    return "";
  };

  return (
    <section className="w-full flex flex-col py-24 border-t border-dashed border-[#222]">
      {/* Header row: Title on left, Button on right */}
      <div className="flex flex-col md:flex-row md:items-end justify-between w-full mb-10 gap-6">
        <div>
          <h2 className="text-4xl lg:text-[48px] font-medium tracking-tight leading-[1.1] text-[#F0EFE2] mb-3">
            Compose a <span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative -ml-1">mission</span>.
          </h2>
          <p className="text-[15px] text-[#A0A0A0]">
            Interact with the Reality Intelligence Runtime via the System Composer API.
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-[13px] text-[#888] hover:text-[#F0EFE2] transition-colors pb-1">
          Access the Runtime <ChevronRight size={14} />
        </button>
      </div>

      {/* Model Selectors */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-2 scrollbar-none">
        {MODELS.map((model) => (
          <button
            key={model.id}
            onClick={() => setActiveModel(model.id)}
            className={cn(
              "flex items-center gap-2.5 px-4 py-2 border transition-all whitespace-nowrap",
              activeModel === model.id
                ? "border-[#75bf00] bg-[#1a1a1a]"
                : "border-[#333] bg-[#111] hover:bg-[#1a1a1a] hover:border-[#444]"
            )}
          >
            <span className="shrink-0">{model.icon}</span>
            <span className={cn(
              "font-bold text-[13px]",
              activeModel === model.id ? "text-[#F0EFE2]" : "text-[#ccc]"
            )}>
              {model.label}
            </span>
          </button>
        ))}
      </div>

      {/* Code Block Container */}
      <div className="w-full bg-[#1e1e1e] border border-dashed border-[#333] flex flex-col overflow-hidden relative">
        {/* Decorative subtle pattern (optional, mimicking the screenshot's dotted border around the pre block) */}
        <div className="absolute inset-0 pointer-events-none border border-dashed border-[#333] m-2 z-0" />

        {/* Code Header Tabs */}
        <div className="flex items-center justify-between border-b border-dashed border-[#333] bg-[#1a1a1a] px-4 py-3 relative z-10">
          <div className="flex items-center">
            <div className="flex items-center gap-2 mr-6 overflow-x-auto scrollbar-none">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "text-[13px] font-semibold transition-colors whitespace-nowrap px-3 py-1.5 rounded-[2px]",
                    activeTab === tab
                      ? "text-[#F0EFE2] bg-[#111] border border-dashed border-[#444]"
                      : "text-[#888] hover:text-[#ccc] border border-dashed border-transparent"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Dynamic Badges beside the tabs */}
            <div className="hidden sm:flex items-center gap-3">
               <span className="text-[12px] font-medium text-[#75bf00] bg-[#111] border border-dashed border-[#444] px-2 py-0.5 rounded-[2px]">
                 {TAB_HEADERS[activeTab].badge}
               </span>
               <span className="text-[13px] font-medium text-[#F0EFE2]">
                 {TAB_HEADERS[activeTab].title}
               </span>
               {TAB_HEADERS[activeTab].link && (
                 <a href={TAB_HEADERS[activeTab].link} className="text-[13px] text-[#888] underline underline-offset-2 hover:text-[#ccc] transition-colors ml-1">
                   Read docs
                 </a>
               )}
            </div>
          </div>
          
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-medium text-[#A0A0A0] hover:text-[#F0EFE2] bg-[#111] border border-dashed border-[#444] hover:bg-[#222] rounded-[2px] transition-colors"
          >
            {copied ? <Check size={14} className="text-[#75bf00]" /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        
        {/* Code Area */}
        <div className="p-6 bg-[#1e1e1e] min-h-[300px] overflow-x-auto relative z-10 pl-10">
          <pre className="font-mono text-[13px] leading-loose text-[#D4D4D4]">
            <code>
              {getCodeSnippet().split('\n').map((line, i) => {
                // Extremely basic syntax coloring
                let coloredLine = line
                  .replace(/from|import|const|new|async|function|await|export|if|throw/g, '<span class="text-[#569CD6]">$&</span>')
                  .replace(/("|'.*?'|")/g, '<span class="text-[#CE9178]">$&</span>')
                  .replace(/https:\/\/api\.dhyra\.com\/v1|https:\/\/api\.dhyra\.com/g, '<span class="text-[#75bf00] font-bold">$&</span>')
                  .replace(/\$DHYRA_GATEWAY_KEY|process\.env\.DHYRA_GATEWAY_KEY/g, '<span class="text-[#9CDCFE]">$&</span>')
                  .replace(/# .*/g, '<span class="text-[#6A9955]">$&</span>')
                  .replace(/\/\/ .*/g, '<span class="text-[#6A9955]">$&</span>');
                
                return (
                  <div key={i} className="flex group">
                    <span className="absolute left-4 w-4 text-right text-[#555] select-none group-hover:text-[#888] transition-colors">{i + 1}</span>
                    <span dangerouslySetInnerHTML={{ __html: coloredLine || ' ' }} />
                  </div>
                );
              })}
            </code>
          </pre>
        </div>
      </div>
    </section>
  );
}
