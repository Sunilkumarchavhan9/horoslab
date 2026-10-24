"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  ClaudeLogo,
  AnthropicLogo,
  OpenAILogo,
  QwenLogo,
  PiLogo,
  AiderLogo,
  ContinueLogo,
  ClineLogo,
  ZedLogo,
  CursorLogo,
  GrokLogo,
  HermesLogo,
  GooseLogo,
  OpenCodeLogo,
  KiloCodeLogo,
  DroidLogo,
  OpenClawLogo,
  CrushLogo,
  FxLogo,
  ModalLogo,
  RunPodLogo,
  AnyscaleLogo,
  PrimeIntellectLogo,
  BasetenLogo,
  TogetherAILogo,
  FireworksAILogo,
  PhysicalIntelligenceLogo,
  SkildAILogo,
  DexterityLogo,
  CovariantLogo,
  GeminiRoboticsLogo,
  TelekinesisLogo,
  FigureLogo,
  BostonDynamicsLogo,
  UnitreeLogo,
  WindsurfLogo,
  DevinLogo,
  CopilotLogo,
  GroqLogo,
  CoreWeaveLogo,
  LambdaLogo,
  CerebrasLogo
} from "@/components/horos/primitives/brand-icons";
import { cn } from "@/lib/utils";

export type SurfaceCategory = 'all' | 'coding' | 'robotics' | 'compute';

interface Integration {
  id: string;
  name: string;
  category: 'coding' | 'robotics' | 'compute';
  icon: React.ReactNode;
  ready: boolean;
  command: string;
  configPath: string;
  undoCommand: string;
}

const INTEGRATIONS: Integration[] = [
  // Coding Agents & IDEs
  { id: 'claude', name: 'Claude Code', category: 'coding', icon: <ClaudeLogo size={24} />, ready: true, command: 'npx @horos/connect claude', configPath: '~/.claude/settings.json', undoCommand: 'horos-connect claude off' },
  { id: 'codex', name: 'Codex', category: 'coding', icon: <OpenAILogo size={24} />, ready: true, command: 'npx @horos/connect codex', configPath: '~/.codex/config', undoCommand: 'horos-connect codex off' },
  { id: 'windsurf', name: 'Windsurf', category: 'coding', icon: <WindsurfLogo size={24} />, ready: true, command: 'npx @horos/connect windsurf', configPath: '~/.windsurf/config', undoCommand: 'horos-connect windsurf off' },
  { id: 'cursor', name: 'Cursor', category: 'coding', icon: <CursorLogo size={24} />, ready: true, command: 'npx @horos/connect cursor', configPath: 'Cursor Settings', undoCommand: 'horos-connect cursor off' },
  { id: 'copilot', name: 'GitHub Copilot', category: 'coding', icon: <CopilotLogo size={24} />, ready: true, command: 'npx @horos/connect copilot', configPath: '~/.copilot/config', undoCommand: 'horos-connect copilot off' },
  { id: 'devin', name: 'Devin', category: 'coding', icon: <DevinLogo size={24} />, ready: true, command: 'npx @horos/connect devin', configPath: '~/.devin/config', undoCommand: 'horos-connect devin off' },
  { id: 'opencode', name: 'OpenCode', category: 'coding', icon: <OpenCodeLogo size={24} />, ready: true, command: 'npx @horos/connect opencode', configPath: '~/.opencode/config', undoCommand: 'horos-connect opencode off' },
  { id: 'pi', name: 'Pi', category: 'coding', icon: <PiLogo size={24} />, ready: true, command: 'npx @horos/connect pi', configPath: '~/.pi/config', undoCommand: 'horos-connect pi off' },
  { id: 'aider', name: 'Aider', category: 'coding', icon: <AiderLogo size={24} />, ready: true, command: 'npx @horos/connect aider', configPath: '~/.aider.conf.yml', undoCommand: 'horos-connect aider off' },
  { id: 'qwen', name: 'Qwen Code', category: 'coding', icon: <QwenLogo size={24} />, ready: true, command: 'npx @horos/connect qwen', configPath: '~/.qwencode/config', undoCommand: 'horos-connect qwen off' },
  { id: 'kilo', name: 'Kilo Code', category: 'coding', icon: <KiloCodeLogo size={24} />, ready: true, command: 'npx @horos/connect kilo', configPath: '~/.kilo/config', undoCommand: 'horos-connect kilo off' },
  { id: 'goose', name: 'Goose', category: 'coding', icon: <GooseLogo size={24} />, ready: true, command: 'npx @horos/connect goose', configPath: '~/.config/goose/config.toml', undoCommand: 'horos-connect goose off' },
  { id: 'continue', name: 'Continue', category: 'coding', icon: <ContinueLogo size={24} />, ready: true, command: 'npx @horos/connect continue', configPath: '~/.continue/config.json', undoCommand: 'horos-connect continue off' },
  { id: 'cline', name: 'Cline', category: 'coding', icon: <ClineLogo size={24} />, ready: true, command: 'npx @horos/connect cline', configPath: '~/.cline/settings.json', undoCommand: 'horos-connect cline off' },
  { id: 'droid', name: 'Droid', category: 'coding', icon: <DroidLogo size={24} />, ready: true, command: 'npx @horos/connect droid', configPath: '~/.droid/config', undoCommand: 'horos-connect droid off' },
  { id: 'grok', name: 'Grok Build', category: 'coding', icon: <GrokLogo size={24} />, ready: true, command: 'npx @horos/connect grok', configPath: '~/.grok/config', undoCommand: 'horos-connect grok off' },
  { id: 'hermes', name: 'Hermes', category: 'coding', icon: <HermesLogo size={24} />, ready: true, command: 'npx @horos/connect hermes', configPath: '~/.hermes/config', undoCommand: 'horos-connect hermes off' },
  { id: 'openclaw', name: 'OpenClaw', category: 'coding', icon: <OpenClawLogo size={24} />, ready: true, command: 'npx @horos/connect openclaw', configPath: '~/.openclaw/config', undoCommand: 'horos-connect openclaw off' },
  { id: 'zed', name: 'Zed', category: 'coding', icon: <ZedLogo size={24} />, ready: true, command: 'npx @horos/connect zed', configPath: '~/.config/zed/settings.json', undoCommand: 'horos-connect zed off' },
  { id: 'crush', name: 'Crush', category: 'coding', icon: <CrushLogo size={24} />, ready: true, command: 'npx @horos/connect crush', configPath: '~/.crush/config', undoCommand: 'horos-connect crush off' },
  { id: 'fx', name: 'Fx', category: 'coding', icon: <FxLogo size={24} />, ready: true, command: 'npx @horos/connect fx', configPath: '~/.fx/config', undoCommand: 'horos-connect fx off' },

  // Physical AI & Robotics
  { id: 'physicalintel', name: 'Physical Intel π0', category: 'robotics', icon: <PhysicalIntelligenceLogo size={24} />, ready: true, command: 'npx @horos/connect physicalintel', configPath: '~/.physicalintel/config', undoCommand: 'horos-connect physicalintel off' },
  { id: 'figure', name: 'Figure AI', category: 'robotics', icon: <FigureLogo size={24} />, ready: true, command: 'npx @horos/connect figure', configPath: '~/.figure/config', undoCommand: 'horos-connect figure off' },
  { id: 'bostondynamics', name: 'Boston Dynamics', category: 'robotics', icon: <BostonDynamicsLogo size={24} />, ready: true, command: 'npx @horos/connect bostondynamics', configPath: '~/.bostondynamics/config', undoCommand: 'horos-connect bostondynamics off' },
  { id: 'skild', name: 'Skild AI', category: 'robotics', icon: <SkildAILogo size={24} />, ready: true, command: 'npx @horos/connect skild', configPath: '~/.skild/config', undoCommand: 'horos-connect skild off' },
  { id: 'unitree', name: 'Unitree Robotics', category: 'robotics', icon: <UnitreeLogo size={24} />, ready: true, command: 'npx @horos/connect unitree', configPath: '~/.unitree/config', undoCommand: 'horos-connect unitree off' },
  { id: 'dexterity', name: 'Dexterity', category: 'robotics', icon: <DexterityLogo size={24} />, ready: true, command: 'npx @horos/connect dexterity', configPath: '~/.dexterity/config', undoCommand: 'horos-connect dexterity off' },
  { id: 'covariant', name: 'Covariant', category: 'robotics', icon: <CovariantLogo size={24} />, ready: true, command: 'npx @horos/connect covariant', configPath: '~/.covariant/config', undoCommand: 'horos-connect covariant off' },
  { id: 'geminirobots', name: 'Gemini Robotics', category: 'robotics', icon: <GeminiRoboticsLogo size={24} />, ready: true, command: 'npx @horos/connect geminirobots', configPath: '~/.geminirobots/config', undoCommand: 'horos-connect geminirobots off' },
  { id: 'telekinesis', name: 'Telekinesis', category: 'robotics', icon: <TelekinesisLogo size={24} />, ready: true, command: 'npx @horos/connect telekinesis', configPath: '~/.telekinesis/config', undoCommand: 'horos-connect telekinesis off' },

  // Inference & Cloud Mesh
  { id: 'groq', name: 'Groq LPU', category: 'compute', icon: <GroqLogo size={24} />, ready: true, command: 'npx @horos/connect groq', configPath: '~/.groq/config', undoCommand: 'horos-connect groq off' },
  { id: 'cerebras', name: 'Cerebras', category: 'compute', icon: <CerebrasLogo size={24} />, ready: true, command: 'npx @horos/connect cerebras', configPath: '~/.cerebras/config', undoCommand: 'horos-connect cerebras off' },
  { id: 'coreweave', name: 'CoreWeave', category: 'compute', icon: <CoreWeaveLogo size={24} />, ready: true, command: 'npx @horos/connect coreweave', configPath: '~/.coreweave/config', undoCommand: 'horos-connect coreweave off' },
  { id: 'lambda', name: 'Lambda Labs', category: 'compute', icon: <LambdaLogo size={24} />, ready: true, command: 'npx @horos/connect lambda', configPath: '~/.lambda/config', undoCommand: 'horos-connect lambda off' },
  { id: 'modal', name: 'Modal', category: 'compute', icon: <ModalLogo size={24} />, ready: true, command: 'npx @horos/connect modal', configPath: '~/.modal.toml', undoCommand: 'horos-connect modal off' },
  { id: 'runpod', name: 'RunPod', category: 'compute', icon: <RunPodLogo size={24} />, ready: true, command: 'npx @horos/connect runpod', configPath: '~/.runpod/config', undoCommand: 'horos-connect runpod off' },
  { id: 'together', name: 'Together AI', category: 'compute', icon: <TogetherAILogo size={24} />, ready: true, command: 'npx @horos/connect together', configPath: '~/.together/config', undoCommand: 'horos-connect together off' },
  { id: 'fireworks', name: 'Fireworks AI', category: 'compute', icon: <FireworksAILogo size={24} />, ready: true, command: 'npx @horos/connect fireworks', configPath: '~/.fireworks/config', undoCommand: 'horos-connect fireworks off' },
  { id: 'baseten', name: 'Baseten', category: 'compute', icon: <BasetenLogo size={24} />, ready: true, command: 'npx @horos/connect baseten', configPath: '~/.baseten/config', undoCommand: 'horos-connect baseten off' },
  { id: 'anyscale', name: 'Anyscale', category: 'compute', icon: <AnyscaleLogo size={24} />, ready: true, command: 'npx @horos/connect anyscale', configPath: '~/.anyscale/config', undoCommand: 'horos-connect anyscale off' },
  { id: 'primeintellect', name: 'Prime Intellect', category: 'compute', icon: <PrimeIntellectLogo size={24} />, ready: true, command: 'npx @horos/connect primeintellect', configPath: '~/.primeintellect/config', undoCommand: 'horos-connect primeintellect off' },
];

export function HorosIntegrations() {
  const [selectedId, setSelectedId] = useState(INTEGRATIONS[0].id);
  const [activeCategory, setActiveCategory] = useState<SurfaceCategory>('all');
  const [copied, setCopied] = useState(false);

  const selectedIntegration = INTEGRATIONS.find(i => i.id === selectedId) || INTEGRATIONS[0];

  const filteredIntegrations = activeCategory === 'all'
    ? INTEGRATIONS
    : INTEGRATIONS.filter(i => i.category === activeCategory);

  const categoryCounts = {
    all: INTEGRATIONS.length,
    coding: INTEGRATIONS.filter(i => i.category === 'coding').length,
    robotics: INTEGRATIONS.filter(i => i.category === 'robotics').length,
    compute: INTEGRATIONS.filter(i => i.category === 'compute').length,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`horos surface register ${selectedIntegration.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="w-full flex flex-col lg:flex-row items-start justify-between gap-10 lg:gap-14 py-16">
      
      {/* Left Column: Grid */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <h2 className="text-3xl sm:text-4xl lg:text-[42px] xl:text-[44px] font-medium tracking-tight leading-[1.15] text-[#F0EFE2] mb-6">
          <span className="block whitespace-nowrap">Connect to any</span>
          <span className="block mt-1">
            <span className="bg-[#75bf00] text-[#151515] px-2.5 py-0.5 rounded-[2px] inline-block font-semibold whitespace-nowrap">
              Reality Surface
            </span>
          </span>
        </h2>
        
        <p className="text-[16px] sm:text-[17px] text-[#A0A0A0] leading-relaxed mb-6 max-w-md">
          HOROS connects intelligence to software, compute, edge, vehicles, robots, and factories. Actuate when authorized. Verify the physical consequences.
        </p>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6 text-[12px]">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "px-2.5 py-1 rounded-[2px] transition-colors whitespace-nowrap font-medium",
              activeCategory === 'all'
                ? "bg-[#75bf00] text-[#151515] font-semibold"
                : "text-[#888] hover:text-[#F0EFE2] hover:bg-[#1f1f1f]"
            )}
          >
            All Surfaces <span className={activeCategory === 'all' ? "text-[#2a4500] font-bold" : "text-[#555]"}>{categoryCounts.all}</span>
          </button>
          <button
            onClick={() => setActiveCategory('coding')}
            className={cn(
              "px-2.5 py-1 rounded-[2px] transition-colors whitespace-nowrap font-medium",
              activeCategory === 'coding'
                ? "bg-[#75bf00] text-[#151515] font-semibold"
                : "text-[#888] hover:text-[#F0EFE2] hover:bg-[#1f1f1f]"
            )}
          >
            Coding Agents <span className={activeCategory === 'coding' ? "text-[#2a4500] font-bold" : "text-[#555]"}>{categoryCounts.coding}</span>
          </button>
          <button
            onClick={() => setActiveCategory('robotics')}
            className={cn(
              "px-2.5 py-1 rounded-[2px] transition-colors whitespace-nowrap font-medium",
              activeCategory === 'robotics'
                ? "bg-[#75bf00] text-[#151515] font-semibold"
                : "text-[#888] hover:text-[#F0EFE2] hover:bg-[#1f1f1f]"
            )}
          >
            Robotics & Physical AI <span className={activeCategory === 'robotics' ? "text-[#2a4500] font-bold" : "text-[#555]"}>{categoryCounts.robotics}</span>
          </button>
          <button
            onClick={() => setActiveCategory('compute')}
            className={cn(
              "px-2.5 py-1 rounded-[2px] transition-colors whitespace-nowrap font-medium",
              activeCategory === 'compute'
                ? "bg-[#75bf00] text-[#151515] font-semibold"
                : "text-[#888] hover:text-[#F0EFE2] hover:bg-[#1f1f1f]"
            )}
          >
            Inference & Cloud <span className={activeCategory === 'compute' ? "text-[#2a4500] font-bold" : "text-[#555]"}>{categoryCounts.compute}</span>
          </button>
        </div>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-8 w-full max-w-[520px]">
          {filteredIntegrations.map((integration) => {
            const isSelected = integration.id === selectedId;
            return (
              <button
                key={integration.id}
                onClick={() => setSelectedId(integration.id)}
                className={cn(
                  "flex items-center gap-2.5 py-2 px-2.5 rounded-[2px] border border-dashed text-left transition-all group overflow-hidden min-w-0 cursor-pointer",
                  isSelected 
                    ? "border-[#75bf00] bg-[#1a1a1a] shadow-[0_0_15px_rgba(117,191,0,0.12)]" 
                    : "border-[#333] hover:border-[#555] hover:bg-[#1a1a1a]"
                )}
                title={integration.name}
              >
                <div className="shrink-0 w-[34px] h-[34px] flex items-center justify-center bg-[#151515] border border-dashed border-[#333] rounded-[2px] overflow-hidden group-hover:border-[#555] transition-colors">
                  {integration.icon}
                </div>
                <span className={cn(
                  "font-medium text-[12px] leading-tight truncate min-w-0 flex-1",
                  isSelected ? "text-[#F0EFE2] font-semibold" : "text-[#ccc] group-hover:text-white"
                )}>
                  {integration.name}
                </span>
              </button>
            );
          })}
        </div>

        <p className="text-[13px] text-[#666]">
          Every flag, and what preview still needs. <a href="#" className="text-[#F0EFE2] underline hover:text-[#75bf00] transition-colors font-medium">Read the guide</a>
        </p>
      </div>

      {/* Right Column: Setup Guide */}
      <div className="w-full lg:w-1/2 flex flex-col max-w-[500px] lg:mt-6">
        
        <div className="flex flex-col gap-1 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-[#75bf00] border border-[#75bf00] px-1.5 py-0.5 rounded-[2px] uppercase tracking-wider">
              Ready
            </span>
            <span className="text-[16px] font-bold text-[#F0EFE2]">{selectedIntegration.name}</span>
          </div>
          <p className="text-[13px] text-[#888]">
            Capability available on the Reality Fabric.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col relative">
          {/* Vertical line connecting steps */}
          <div className="absolute left-[13px] top-[14px] bottom-[20px] w-px bg-transparent border-l border-dashed border-[#333]"></div>

          {/* Step 1 */}
          <div className="flex gap-6 mb-8 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              1
            </div>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[19px] font-medium text-[#F0EFE2] tracking-tight">Connect</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-[#888] hover:text-[#F0EFE2] transition-colors text-[12px] cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check size={13} className="text-[#75bf00]" />
                      <span className="text-[#75bf00] font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <div className="bg-[#151515] border border-dashed border-[#333] rounded-[2px] p-3.5 font-mono text-[13px] text-[#F0EFE2] mb-2 flex items-center justify-between">
                <span>
                  <span className="text-[#666]">horos</span> <span className="text-[#75bf00]">surface register</span> <span className="text-[#F0EFE2] font-semibold">{selectedIntegration.id}</span>
                </span>
              </div>
              <p className="text-[13px] text-[#888]">Register a reality surface (software, sensor, or physical actuator) and map its state space.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6 mb-8 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              2
            </div>
            <div className="flex flex-col w-full pt-[1px]">
              <h3 className="text-[19px] font-medium text-[#F0EFE2] tracking-tight mb-1.5">Compose</h3>
              <p className="text-[14px] text-[#888] mb-3">Compose intelligence workflows that can perceive and actuate the surface.</p>
              <div>
                <a href="#" className="text-[13px] text-[#aaa] hover:text-[#F0EFE2] transition-colors font-medium flex items-center gap-1">
                  View protocol <span className="text-[10px]">▶</span>
                </a>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6 mb-8 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              3
            </div>
            <div className="flex flex-col w-full pt-[1px]">
              <h3 className="text-[19px] font-medium text-[#F0EFE2] tracking-tight mb-1.5">Execute</h3>
              <div className="flex items-center gap-2 text-[14px] text-[#888] mb-3">
                Dispatches mission to <span className="font-mono text-[12px] bg-[#1a1a1a] border border-dashed border-[#333] px-1.5 py-0.5 rounded-[2px] text-[#F0EFE2]">{selectedIntegration.name}</span>
              </div>
              <p className="text-[14px] text-[#888]">Deploy the mission. The runtime maintains persistent state and context affinity.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-6 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              4
            </div>
            <div className="flex flex-col w-full pt-[1px]">
              <h3 className="text-[19px] font-medium text-[#F0EFE2] tracking-tight mb-1.5">Verify & Evolve</h3>
              <p className="text-[14px] text-[#888]">
                Continuously verify physical or computational outcomes and automatically evolve the intelligence constraints.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
