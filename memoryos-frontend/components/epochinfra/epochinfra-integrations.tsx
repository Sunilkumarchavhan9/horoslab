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
} from "@/components/epoch/primitives/brand-icons";
import { cn } from "@/lib/utils";

const INTEGRATIONS = [
  { id: 'claude', name: 'Claude Code', icon: <ClaudeLogo size={28} />, ready: true, command: 'npx @epochinfra/connect claude', configPath: '~/.claude/settings.json', undoCommand: 'epochinfra-connect claude off' },
  { id: 'codex', name: 'Codex', icon: <OpenAILogo size={28} />, ready: true, command: 'npx @epochinfra/connect codex', configPath: '~/.codex/config', undoCommand: 'epochinfra-connect codex off' },
  { id: 'opencode', name: 'OpenCode', icon: <OpenCodeLogo size={28} />, ready: true, command: 'npx @epochinfra/connect opencode', configPath: '~/.opencode/config', undoCommand: 'epochinfra-connect opencode off' },
  { id: 'pi', name: 'Pi', icon: <PiLogo size={28} />, ready: true, command: 'npx @epochinfra/connect pi', configPath: '~/.pi/config', undoCommand: 'epochinfra-connect pi off' },
  { id: 'aider', name: 'Aider', icon: <AiderLogo size={28} />, ready: true, command: 'npx @epochinfra/connect aider', configPath: '~/.aider.conf.yml', undoCommand: 'epochinfra-connect aider off' },
  { id: 'qwen', name: 'Qwen Code', icon: <QwenLogo size={28} />, ready: true, command: 'npx @epochinfra/connect qwen', configPath: '~/.qwencode/config', undoCommand: 'epochinfra-connect qwen off' },
  { id: 'kilo', name: 'Kilo Code', icon: <KiloCodeLogo size={28} />, ready: true, command: 'npx @epochinfra/connect kilo', configPath: '~/.kilo/config', undoCommand: 'epochinfra-connect kilo off' },
  { id: 'goose', name: 'Goose', icon: <GooseLogo size={28} />, ready: true, command: 'npx @epochinfra/connect goose', configPath: '~/.config/goose/config.toml', undoCommand: 'epochinfra-connect goose off' },
  { id: 'continue', name: 'Continue', icon: <ContinueLogo size={28} />, ready: true, command: 'npx @epochinfra/connect continue', configPath: '~/.continue/config.json', undoCommand: 'epochinfra-connect continue off' },
  { id: 'cline', name: 'Cline', icon: <ClineLogo size={28} />, ready: true, command: 'npx @epochinfra/connect cline', configPath: '~/.cline/settings.json', undoCommand: 'epochinfra-connect cline off' },
  { id: 'droid', name: 'Droid (Factory)', icon: <DroidLogo size={28} />, ready: true, command: 'npx @epochinfra/connect droid', configPath: '~/.droid/config', undoCommand: 'epochinfra-connect droid off' },
  { id: 'grok', name: 'Grok Build', icon: <GrokLogo size={28} />, ready: true, command: 'npx @epochinfra/connect grok', configPath: '~/.grok/config', undoCommand: 'epochinfra-connect grok off' },
  { id: 'hermes', name: 'Hermes', icon: <HermesLogo size={28} />, ready: true, command: 'npx @epochinfra/connect hermes', configPath: '~/.hermes/config', undoCommand: 'epochinfra-connect hermes off' },
  { id: 'openclaw', name: 'OpenClaw', icon: <OpenClawLogo size={28} />, ready: true, command: 'npx @epochinfra/connect openclaw', configPath: '~/.openclaw/config', undoCommand: 'epochinfra-connect openclaw off' },
  { id: 'zed', name: 'Zed', icon: <ZedLogo size={28} />, ready: true, command: 'npx @epochinfra/connect zed', configPath: '~/.config/zed/settings.json', undoCommand: 'epochinfra-connect zed off' },
  { id: 'crush', name: 'Crush', icon: <CrushLogo size={28} />, ready: true, command: 'npx @epochinfra/connect crush', configPath: '~/.crush/config', undoCommand: 'epochinfra-connect crush off' },
  { id: 'cursor', name: 'Cursor', icon: <CursorLogo size={28} />, ready: true, command: 'npx @epochinfra/connect cursor', configPath: 'Cursor Settings', undoCommand: 'epochinfra-connect cursor off' },
  { id: 'fx', name: 'Fx', icon: <FxLogo size={28} />, ready: true, command: 'npx @epochinfra/connect fx', configPath: '~/.fx/config', undoCommand: 'epochinfra-connect fx off' },
  { id: 'anyscale', name: 'Anyscale', icon: <AnyscaleLogo size={28} />, ready: true, command: 'npx @epochinfra/connect anyscale', configPath: '~/.anyscale/config', undoCommand: 'epochinfra-connect anyscale off' },
  { id: 'modal', name: 'Modal', icon: <ModalLogo size={28} />, ready: true, command: 'npx @epochinfra/connect modal', configPath: '~/.modal.toml', undoCommand: 'epochinfra-connect modal off' },
  { id: 'runpod', name: 'RunPod', icon: <RunPodLogo size={28} />, ready: true, command: 'npx @epochinfra/connect runpod', configPath: '~/.runpod/config', undoCommand: 'epochinfra-connect runpod off' },
  { id: 'primeintellect', name: 'Prime Intellect', icon: <PrimeIntellectLogo size={28} />, ready: true, command: 'npx @epochinfra/connect primeintellect', configPath: '~/.primeintellect/config', undoCommand: 'epochinfra-connect primeintellect off' },
  { id: 'baseten', name: 'Baseten', icon: <BasetenLogo size={28} />, ready: true, command: 'npx @epochinfra/connect baseten', configPath: '~/.baseten/config', undoCommand: 'epochinfra-connect baseten off' },
  { id: 'together', name: 'Together AI', icon: <TogetherAILogo size={28} />, ready: true, command: 'npx @epochinfra/connect together', configPath: '~/.together/config', undoCommand: 'epochinfra-connect together off' },
  { id: 'fireworks', name: 'Fireworks AI', icon: <FireworksAILogo size={28} />, ready: true, command: 'npx @epochinfra/connect fireworks', configPath: '~/.fireworks/config', undoCommand: 'epochinfra-connect fireworks off' },
  { id: 'physicalintel', name: 'Physical Intel', icon: <PhysicalIntelligenceLogo size={28} />, ready: true, command: 'npx @epochinfra/connect physicalintel', configPath: '~/.physicalintel/config', undoCommand: 'epochinfra-connect physicalintel off' },
  { id: 'skild', name: 'Skild AI', icon: <SkildAILogo size={28} />, ready: true, command: 'npx @epochinfra/connect skild', configPath: '~/.skild/config', undoCommand: 'epochinfra-connect skild off' },
  { id: 'dexterity', name: 'Dexterity', icon: <DexterityLogo size={28} />, ready: true, command: 'npx @epochinfra/connect dexterity', configPath: '~/.dexterity/config', undoCommand: 'epochinfra-connect dexterity off' },
  { id: 'covariant', name: 'Covariant', icon: <CovariantLogo size={28} />, ready: true, command: 'npx @epochinfra/connect covariant', configPath: '~/.covariant/config', undoCommand: 'epochinfra-connect covariant off' },
  { id: 'geminirobots', name: 'Gemini Robotics', icon: <GeminiRoboticsLogo size={28} />, ready: true, command: 'npx @epochinfra/connect geminirobots', configPath: '~/.geminirobots/config', undoCommand: 'epochinfra-connect geminirobots off' },
  { id: 'telekinesis', name: 'Telekinesis', icon: <TelekinesisLogo size={28} />, ready: true, command: 'npx @epochinfra/connect telekinesis', configPath: '~/.telekinesis/config', undoCommand: 'epochinfra-connect telekinesis off' },
];

export function EpochInfraIntegrations() {
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
          EpochInfra connects intelligence to software, compute, edge, vehicles, robots, and factories. Actuate when authorized. Verify the physical consequences.
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
                <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight">Register surface</h3>
                <button className="flex items-center gap-2 text-[#888] hover:text-[#F0EFE2] transition-colors text-[13px]">
                  <Copy size={14} /> Copy
                </button>
              </div>
              <div className="bg-[#151515] border border-dashed border-[#333] rounded-[2px] p-4 font-mono text-[13px] text-[#F0EFE2] mb-3">
                <span className="text-[#666]">epochinfra</span> <span className="text-[#75bf00]">surface register</span> {selectedIntegration.id}
              </div>
              <p className="text-[13px] text-[#888] font-medium">Adds capability to your environment.</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6 mb-10 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              2
            </div>
            <div className="flex flex-col w-full pt-[1px]">
              <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight mb-2">Configure verification</h3>
              <p className="text-[14px] text-[#888] mb-4">Establish cryptographic provenance for measurements.</p>
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
              <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight mb-2">Execute mission</h3>
              <div className="flex items-center gap-2 text-[14px] text-[#888] mb-4">
                Dispatches outcome to <span className="font-mono text-[12px] bg-[#1a1a1a] border border-dashed border-[#333] px-1.5 py-0.5 rounded-[2px]">{selectedIntegration.name}</span>
              </div>
              <p className="text-[14px] text-[#888]">Monitored continuously.</p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-6 relative z-10">
            <div className="shrink-0 w-[28px] h-[28px] rounded-[2px] bg-[#1a1a1a] border border-dashed border-[#333] text-[#F0EFE2] font-medium flex items-center justify-center text-[12px]">
              4
            </div>
            <div className="flex flex-col w-full pt-[1px]">
              <h3 className="text-[20px] font-medium text-[#F0EFE2] tracking-tight mb-2">Learn & Evolve</h3>
              <p className="text-[14px] text-[#888]">
                Intelligence evolution updates reality model based on verified results.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
