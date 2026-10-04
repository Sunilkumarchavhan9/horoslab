"use client";

import React, { useState } from "react";
import { Copy } from "lucide-react";
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
  TelekinesisLogo
} from "@/components/hemera/primitives/brand-icons";
import { cn } from "@/lib/utils";

const INTEGRATIONS = [
  { id: 'claude', name: 'Claude Code', icon: <ClaudeLogo size={28} />, ready: true, command: 'npx @hemera/connect claude', configPath: '~/.claude/settings.json', undoCommand: 'hemera-connect claude off' },
  { id: 'codex', name: 'Codex', icon: <OpenAILogo size={28} />, ready: true, command: 'npx @hemera/connect codex', configPath: '~/.codex/config', undoCommand: 'hemera-connect codex off' },
  { id: 'opencode', name: 'OpenCode', icon: <OpenCodeLogo size={28} />, ready: true, command: 'npx @hemera/connect opencode', configPath: '~/.opencode/config', undoCommand: 'hemera-connect opencode off' },
  { id: 'pi', name: 'Pi', icon: <PiLogo size={28} />, ready: true, command: 'npx @hemera/connect pi', configPath: '~/.pi/config', undoCommand: 'hemera-connect pi off' },
  { id: 'aider', name: 'Aider', icon: <AiderLogo size={28} />, ready: true, command: 'npx @hemera/connect aider', configPath: '~/.aider.conf.yml', undoCommand: 'hemera-connect aider off' },
  { id: 'qwen', name: 'Qwen Code', icon: <QwenLogo size={28} />, ready: true, command: 'npx @hemera/connect qwen', configPath: '~/.qwencode/config', undoCommand: 'hemera-connect qwen off' },
  { id: 'kilo', name: 'Kilo Code', icon: <KiloCodeLogo size={28} />, ready: true, command: 'npx @hemera/connect kilo', configPath: '~/.kilo/config', undoCommand: 'hemera-connect kilo off' },
  { id: 'goose', name: 'Goose', icon: <GooseLogo size={28} />, ready: true, command: 'npx @hemera/connect goose', configPath: '~/.config/goose/config.toml', undoCommand: 'hemera-connect goose off' },
  { id: 'continue', name: 'Continue', icon: <ContinueLogo size={28} />, ready: true, command: 'npx @hemera/connect continue', configPath: '~/.continue/config.json', undoCommand: 'hemera-connect continue off' },
  { id: 'cline', name: 'Cline', icon: <ClineLogo size={28} />, ready: true, command: 'npx @hemera/connect cline', configPath: '~/.cline/settings.json', undoCommand: 'hemera-connect cline off' },
  { id: 'droid', name: 'Droid (Factory)', icon: <DroidLogo size={28} />, ready: true, command: 'npx @hemera/connect droid', configPath: '~/.droid/config', undoCommand: 'hemera-connect droid off' },
  { id: 'grok', name: 'Grok Build', icon: <GrokLogo size={28} />, ready: true, command: 'npx @hemera/connect grok', configPath: '~/.grok/config', undoCommand: 'hemera-connect grok off' },
  { id: 'hermes', name: 'Hermes', icon: <HermesLogo size={28} />, ready: true, command: 'npx @hemera/connect hermes', configPath: '~/.hermes/config', undoCommand: 'hemera-connect hermes off' },
  { id: 'openclaw', name: 'OpenClaw', icon: <OpenClawLogo size={28} />, ready: true, command: 'npx @hemera/connect openclaw', configPath: '~/.openclaw/config', undoCommand: 'hemera-connect openclaw off' },
  { id: 'zed', name: 'Zed', icon: <ZedLogo size={28} />, ready: true, command: 'npx @hemera/connect zed', configPath: '~/.config/zed/settings.json', undoCommand: 'hemera-connect zed off' },
  { id: 'crush', name: 'Crush', icon: <CrushLogo size={28} />, ready: true, command: 'npx @hemera/connect crush', configPath: '~/.crush/config', undoCommand: 'hemera-connect crush off' },
  { id: 'cursor', name: 'Cursor', icon: <CursorLogo size={28} />, ready: true, command: 'npx @hemera/connect cursor', configPath: 'Cursor Settings', undoCommand: 'hemera-connect cursor off' },
  { id: 'fx', name: 'Fx', icon: <FxLogo size={28} />, ready: true, command: 'npx @hemera/connect fx', configPath: '~/.fx/config', undoCommand: 'hemera-connect fx off' },
  { id: 'anyscale', name: 'Anyscale', icon: <AnyscaleLogo size={28} />, ready: true, command: 'npx @hemera/connect anyscale', configPath: '~/.anyscale/config', undoCommand: 'hemera-connect anyscale off' },
  { id: 'modal', name: 'Modal', icon: <ModalLogo size={28} />, ready: true, command: 'npx @hemera/connect modal', configPath: '~/.modal.toml', undoCommand: 'hemera-connect modal off' },
  { id: 'runpod', name: 'RunPod', icon: <RunPodLogo size={28} />, ready: true, command: 'npx @hemera/connect runpod', configPath: '~/.runpod/config', undoCommand: 'hemera-connect runpod off' },
  { id: 'primeintellect', name: 'Prime Intellect', icon: <PrimeIntellectLogo size={28} />, ready: true, command: 'npx @hemera/connect primeintellect', configPath: '~/.primeintellect/config', undoCommand: 'hemera-connect primeintellect off' },
  { id: 'baseten', name: 'Baseten', icon: <BasetenLogo size={28} />, ready: true, command: 'npx @hemera/connect baseten', configPath: '~/.baseten/config', undoCommand: 'hemera-connect baseten off' },
  { id: 'together', name: 'Together AI', icon: <TogetherAILogo size={28} />, ready: true, command: 'npx @hemera/connect together', configPath: '~/.together/config', undoCommand: 'hemera-connect together off' },
  { id: 'fireworks', name: 'Fireworks AI', icon: <FireworksAILogo size={28} />, ready: true, command: 'npx @hemera/connect fireworks', configPath: '~/.fireworks/config', undoCommand: 'hemera-connect fireworks off' },
  { id: 'physicalintel', name: 'Physical Intel', icon: <PhysicalIntelligenceLogo size={28} />, ready: true, command: 'npx @hemera/connect physicalintel', configPath: '~/.physicalintel/config', undoCommand: 'hemera-connect physicalintel off' },
  { id: 'skild', name: 'Skild AI', icon: <SkildAILogo size={28} />, ready: true, command: 'npx @hemera/connect skild', configPath: '~/.skild/config', undoCommand: 'hemera-connect skild off' },
  { id: 'dexterity', name: 'Dexterity', icon: <DexterityLogo size={28} />, ready: true, command: 'npx @hemera/connect dexterity', configPath: '~/.dexterity/config', undoCommand: 'hemera-connect dexterity off' },
  { id: 'covariant', name: 'Covariant', icon: <CovariantLogo size={28} />, ready: true, command: 'npx @hemera/connect covariant', configPath: '~/.covariant/config', undoCommand: 'hemera-connect covariant off' },
  { id: 'geminirobots', name: 'Gemini Robotics', icon: <GeminiRoboticsLogo size={28} />, ready: true, command: 'npx @hemera/connect geminirobots', configPath: '~/.geminirobots/config', undoCommand: 'hemera-connect geminirobots off' },
  { id: 'telekinesis', name: 'Telekinesis', icon: <TelekinesisLogo size={28} />, ready: true, command: 'npx @hemera/connect telekinesis', configPath: '~/.telekinesis/config', undoCommand: 'hemera-connect telekinesis off' },
];

export function HemeraIntegrations() {
  const [selectedId, setSelectedId] = useState(INTEGRATIONS[0].id);

  const selectedIntegration = INTEGRATIONS.find(i => i.id === selectedId) || INTEGRATIONS[0];

  return (
    <section className="w-full flex flex-col lg:flex-row items-start justify-between gap-16 py-32 border-t border-dashed border-[#222]">
      
      {/* Left Column: Grid */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <h2 className="text-5xl lg:text-[64px] font-medium tracking-tight leading-[1.1] text-[#F0EFE2] mb-6">
          Connect to any<br /><span className="bg-[#75bf00] text-black px-2 py-0 inline-block relative -ml-1">Reality Surface</span>
        </h2>
        
        <p className="text-[18px] text-[#A0A0A0] leading-relaxed mb-10 max-w-md">
          Hemera connects intelligence to software, compute, edge, vehicles, robots, and factories. Actuate when authorized. Verify the physical consequences.
        </p>

        {/* Integration Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-10 w-full max-w-[500px]">
          {INTEGRATIONS.map((integration) => {
            const isSelected = integration.id === selectedId;
            return (
              <button
                key={integration.id}
                onClick={() => setSelectedId(integration.id)}
                className={cn(
                  "flex items-center gap-3 py-2 px-3 rounded-[2px] border border-dashed text-left transition-all",
                  isSelected 
                    ? "border-[#75bf00] bg-[#1a1a1a] shadow-[0_0_15px_rgba(117,191,0,0.1)]" 
                    : "border-[#333] hover:bg-[#1a1a1a]"
                )}
              >
                <div className="shrink-0 w-[40px] h-[40px] flex items-center justify-center bg-[#151515] border border-dashed border-[#333] rounded-[2px] overflow-hidden">
                  {integration.icon}
                </div>
                <span className={cn(
                  "font-bold text-[13px] leading-tight",
                  isSelected ? "text-[#F0EFE2]" : "text-[#ccc]"
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
        
        <div className="flex flex-col gap-1 mb-10">
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
          <div className="flex gap-6 mb-10 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              1
            </div>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight">Connect</h3>
                <button className="flex items-center gap-2 text-[#888] hover:text-[#F0EFE2] transition-colors text-[13px]">
                  <Copy size={14} /> Copy
                </button>
              </div>
              <div className="bg-[#151515] border border-dashed border-[#333] rounded-[2px] p-4 font-mono text-[13px] text-[#F0EFE2] mb-3">
                <span className="text-[#666]">hemera</span> <span className="text-[#75bf00]">surface register</span> {selectedIntegration.id}
              </div>
              <p className="text-[13px] text-[#888] font-medium">Register a reality surface (software, sensor, or physical actuator) and map its state space.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6 mb-10 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              2
            </div>
            <div className="flex flex-col w-full pt-[1px]">
              <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight mb-2">Compose</h3>
              <p className="text-[14px] text-[#888] mb-4">Compose intelligence workflows that can perceive and actuate the surface.</p>
              <div>
                <a href="#" className="text-[13px] text-[#aaa] hover:text-[#F0EFE2] transition-colors font-medium flex items-center gap-1">
                  View protocol <span className="text-[10px]">▶</span>
                </a>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6 mb-10 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              3
            </div>
            <div className="flex flex-col w-full pt-[1px]">
              <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight mb-2">Execute</h3>
              <div className="flex items-center gap-2 text-[14px] text-[#888] mb-4">
                Dispatches mission to <span className="font-mono text-[12px] bg-[#1a1a1a] border border-dashed border-[#333] px-1.5 py-0.5 rounded-[2px]">{selectedIntegration.name}</span>
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
              <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight mb-2">Verify & Evolve</h3>
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
