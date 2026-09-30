"use client";

import React, { useState } from "react";
import { Copy, ChevronDown, Check, Lock, Database, ArrowLeft, ArrowUpRight } from "lucide-react";
import { ModelEntity } from "@/lib/dhyra-types";
import {
  AnthropicLogo,
  BAAILogo,
  DeepSeekLogo,
  GLMLogo,
  GoogleLogo,
  HuggingFaceLogo,
  MetaLogo,
  MistralLogo,
  NvidiaLogo,
  OpenAILogo,
  QwenLogo,
  KimiLogo,
  MicrosoftLogo,
} from "../primitives/brand-icons";

interface ModelDetailViewProps {
  model?: ModelEntity;
  onBack: () => void;
  onStartProgramWithModel?: (modelName: string) => void;
  onManageKeys?: () => void;
  dark?: boolean;
}

export function ModelDetailView({
  model,
  onBack,
  onManageKeys,
}: ModelDetailViewProps) {
  const [activeLang, setActiveLang] = useState<string>("curl");
  const [specExpanded, setSpecExpanded] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const modelId = model?.hfIdentity?.repositoryId ?? model?.name ?? "meta-llama/Llama-3.1-8B-Instruct";
  const servedModelId = model?.name ?? modelId;
  const modelName = model?.name ?? "GLM 5.3 Flash";
  const providerDisplay = "z.ai-org/GLM-5.3-Flash"; // From screenshot
  
  // From screenshot image 2:
  const inputPrice = "$0.10";
  const cachedInputPrice = "$0.01";
  const outputPrice = "$0.40";
  const outputSpeed = "254.1";
  const ttf = "703";
  const cacheHit = "99.6%";

  function getBrandLogo(rawName: string) {
    const raw = rawName.toLowerCase();
    if (raw.includes("microsoft")) return <MicrosoftLogo size={42} />;
    if (raw.includes("llama") || raw.includes("meta")) return <MetaLogo size={42} />;
    if (raw.includes("mistral")) return <MistralLogo size={42} />;
    if (raw.includes("qwen") || raw.includes("alibaba")) return <QwenLogo size={42} />;
    if (raw.includes("deepseek")) return <DeepSeekLogo size={42} />;
    if (raw.includes("claude") || raw.includes("anthropic")) return <AnthropicLogo size={42} />;
    if (raw.includes("gpt") || raw.includes("openai")) return <OpenAILogo size={42} />;
    if (raw.includes("gemini") || raw.includes("google")) return <GoogleLogo size={42} />;
    if (raw.includes("nvidia")) return <NvidiaLogo size={42} />;
    if (raw.includes("glm") || raw.includes("zhipu")) return <GLMLogo size={42} />;
    if (raw.includes("bge") || raw.includes("baai")) return <BAAILogo size={42} />;
    if (raw.includes("kimi") || raw.includes("moonshot")) return <KimiLogo size={42} />;
    return <GLMLogo size={42} />; // Default to GLM logo based on the image
  }

  const curlCode = `CLIENT_REQUEST_ID="$(uuidgen)"

curl -X POST "https://api.dhyra.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $DHYRA_GATEWAY_KEY" \\
  -H "X-Client-Request-Id: $CLIENT_REQUEST_ID" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"glm-5-3-flash","messages":[{"role":"user","content":"Hello"}],"max_tokens":2048}'`;

  return (
    <div className="w-full text-[#F0EFE2] font-sans pb-16">
      <div className="max-w-[1280px] mx-auto px-6 pt-10">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[13px] text-[#666] mb-8 font-medium">
          <button onClick={onBack} className="hover:text-[#F0EFE2] transition-colors">Model Library</button>
          <span>/</span>
          <span>Z.ai</span>
          <span>/</span>
          <span className="text-[#F0EFE2]">GLM 5.3 Flash</span>
        </div>

        {/* Header Block */}
        <div className="flex items-start gap-6 mb-8 border-b border-dashed border-[#282828] pb-10">
          <div className="bg-[#1a1a1a] p-4 rounded-sm border border-[#282828] shrink-0">
            {getBrandLogo(modelName)}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between w-full">
              <h1 className="text-[32px] font-bold text-[#F0EFE2] tracking-tight">{modelName}</h1>
              <div className="flex items-center gap-6 text-[13px] font-medium">
                <button className="bg-[#75bf00] text-black px-4 py-1.5 rounded-sm hover:bg-[#85d600] transition-colors">
                  Get API key {`>`}
                </button>
                <button className="text-[#888] hover:text-[#F0EFE2] underline underline-offset-4 decoration-[#333] hover:decoration-[#888] transition-all">
                  Chat Completions API reference
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-[#888] text-[13px] mt-2 mb-6 font-mono">
               <span>{providerDisplay}</span>
               <button className="flex items-center gap-1.5 hover:text-[#F0EFE2] transition-colors">
                 <Copy size={12} /> Share
               </button>
            </div>

            <p className="text-[#888] text-[14px] leading-relaxed max-w-4xl">
              GLM 5.3 Flash is an LLM listed in Dhyra Model APIs. Dhyra serves it as zai-org/GLM-5.3-Flash at $0.10 per 1M input tokens and $0.40 per 1M output tokens. Its context window is 1,048,576 tokens. The API provides OpenAI-compatible chat completions and Anthropic-compatible Messages, POST /v1/messages.
            </p>
          </div>
        </div>

        {/* Pricing & Performance */}
        <div className="grid grid-cols-1 gap-12 border-b border-dashed border-[#282828] pb-12 mb-12">
          
          {/* Pricing */}
          <div>
            <h2 className="text-[20px] font-bold text-[#F0EFE2] mb-6">Pricing</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#161616] border border-[#282828] p-6 rounded-sm">
                 <div className="text-[32px] font-bold text-[#F0EFE2] tracking-tight">
                    <span className="text-[#888] text-[20px] font-medium mr-1">$</span>{inputPrice}
                 </div>
                 <div className="text-[#888] text-[13px] mt-2">per 1M input tokens</div>
              </div>
              <div className="bg-[#161616] border border-[#282828] p-6 rounded-sm">
                 <div className="text-[32px] font-bold text-[#F0EFE2] tracking-tight">
                    <span className="text-[#888] text-[20px] font-medium mr-1">$</span>{cachedInputPrice}
                 </div>
                 <div className="text-[#888] text-[13px] mt-2">per 1M cached input tokens</div>
              </div>
              <div className="bg-[#161616] border border-[#282828] p-6 rounded-sm relative">
                 <div className="absolute top-4 right-4 text-[11px] text-[#666]">USD, pay per token</div>
                 <div className="text-[32px] font-bold text-[#F0EFE2] tracking-tight">
                    <span className="text-[#888] text-[20px] font-medium mr-1">$</span>{outputPrice}
                 </div>
                 <div className="text-[#888] text-[13px] mt-2">per 1M output tokens</div>
              </div>
            </div>
          </div>

          {/* Measured performance */}
          <div>
            <h2 className="text-[20px] font-bold text-[#F0EFE2] mb-6">Measured performance</h2>
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#161616] border border-[#282828] p-6 rounded-sm">
                 <div className="text-[#888] text-[13px] mb-2">Output speed</div>
                 <div className="text-[32px] font-bold text-[#F0EFE2] tracking-tight mb-1">{outputSpeed}</div>
                 <div className="text-[#888] text-[13px]">output tokens per second, model only</div>
              </div>
              <div className="bg-[#161616] border border-[#282828] p-6 rounded-sm">
                 <div className="text-[#888] text-[13px] mb-2">Time to first token</div>
                 <div className="text-[32px] font-bold text-[#F0EFE2] tracking-tight mb-1">{ttf}</div>
                 <div className="text-[#888] text-[13px]">milliseconds to first reasoning token</div>
              </div>
              <div className="bg-[#161616] border border-[#282828] p-6 rounded-sm">
                 <div className="text-[#888] text-[13px] mb-2">Cache hit rate</div>
                 <div className="flex items-end gap-2">
                   <div className="text-[32px] font-bold text-[#F0EFE2] tracking-tight mb-0.5">{cacheHit}</div>
                   <div className="text-[#888] text-[13px] pb-1.5">last 24 hours</div>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Column Specs */}
        <div className="grid grid-cols-3 gap-8 mb-4">
          {/* Access */}
          <div>
            <h3 className="text-[18px] font-bold text-[#F0EFE2] mb-2">Access</h3>
            <p className="text-[#666] text-[13px] mb-6">Confirm how your client reaches this model.</p>
            
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Provider</span>
                <span className="flex items-center gap-1.5 font-bold text-[#F0EFE2]"><GLMLogo size={14} /> Z.ai</span>
              </div>
              <div className="flex justify-between items-start text-[13px]">
                <span className="text-[#888]">API compatibility</span>
                <span className="flex items-center gap-1.5 font-medium text-[#F0EFE2] text-right"><ArrowUpRight size={14} /> OpenAI-compatible<br/>chat completions</span>
              </div>
              <div className="flex justify-between items-start text-[13px]">
                <span className="text-[#888]">Anthropic compatibility</span>
                <span className="flex items-center gap-1.5 font-medium text-[#F0EFE2] text-right"><ArrowUpRight size={14} /> Anthropic-<br/>compatible<br/>Messages, POST<br/>/v1/messages</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Accepted input</span>
                <span className="font-medium text-[#F0EFE2]">Text and images</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Availability</span>
                <span className="font-medium text-[#F0EFE2]">Available</span>
              </div>
              <div className="flex justify-between items-start text-[13px] pt-2 border-t border-dashed border-[#282828]">
                <span className="text-[#888]">Data retention</span>
                <div className="flex gap-2 text-right">
                  <Check size={14} className="text-[#888] shrink-0 mt-0.5" />
                  <span className="font-medium text-[#F0EFE2] max-w-[160px]">Your prompts are never stored and never used for training.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capacity */}
          <div>
            <h3 className="text-[18px] font-bold text-[#F0EFE2] mb-2">Capacity</h3>
            <p className="text-[#666] text-[13px] mb-6">Check the limits your workload must fit.</p>
            
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Context window</span>
                <span className="flex items-center gap-1.5 font-bold text-[#F0EFE2]"><Database size={14} className="text-[#888]" /> 1,048,576 tokens</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Maximum request size</span>
                <span className="flex items-center gap-1.5 font-bold text-[#F0EFE2]"><Database size={14} className="text-[#888]" /> 3.5 MB per request</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Maximum generated<br/>output</span>
                <span className="flex items-center gap-1.5 font-bold text-[#F0EFE2]"><Database size={14} className="text-[#888]" /> 1,048,576 tokens</span>
              </div>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h3 className="text-[18px] font-bold text-[#F0EFE2] mb-2">Capabilities</h3>
            <p className="text-[#666] text-[13px] mb-6">See which request modes the API supports.</p>
            
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Tool calling</span>
                <span className="flex items-center gap-1.5 font-bold text-[#F0EFE2]"><Check size={14} className="text-[#75bf00]" /> Supported</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">JSON mode</span>
                <span className="flex items-center gap-1.5 font-bold text-[#F0EFE2]"><Check size={14} className="text-[#75bf00]" /> Supported</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Streaming</span>
                <span className="flex items-center gap-1.5 font-bold text-[#F0EFE2]"><Check size={14} className="text-[#75bf00]" /> Supported</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#888]">Precision</span>
                <span className="font-bold text-[#F0EFE2]">FP8, vendor-native<br/>release</span>
              </div>
            </div>
          </div>
        </div>

        {/* View Full Spec */}
        <div className="border-t border-[#282828] pt-4 mt-8 mb-12 cursor-pointer flex justify-between items-center">
          <span className="text-[13px] font-bold text-[#F0EFE2]">View Full Spec</span>
          <ChevronDown size={16} className="text-[#75bf00]" />
        </div>

        {/* Code Examples */}
        <div className="mb-12">
          <h2 className="text-[20px] font-bold text-[#F0EFE2] mb-2">Code examples</h2>
          <p className="text-[#888] text-[13px] mb-6">Set DHYRA_GATEWAY_KEY to your workspace API key before using an example.</p>
          
          <div className="bg-[#1a1a1a] border border-[#282828] rounded-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between bg-[#161616] border-b border-[#282828] px-4">
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                {["curl", "Python", "Node", "Image Input", "AI SDK", "Anthropic SDK", "Claude Code", "Shell", "Chat completion"].map(lang => (
                  <button 
                    key={lang}
                    onClick={() => setActiveLang(lang)}
                    className={`py-3 px-3 text-[13px] whitespace-nowrap transition-colors ${activeLang === lang ? 'text-[#F0EFE2] font-medium border-t-2 border-[#75bf00]' : 'text-[#888] hover:text-[#ccc] border-t-2 border-transparent'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <button className="flex items-center gap-2 text-[#888] hover:text-[#F0EFE2] text-[13px] px-2 py-3 transition-colors shrink-0">
                <Copy size={14} /> Copy
              </button>
            </div>
            
            <div className="p-6 bg-[#1f1f1f] overflow-x-auto">
              <pre className="font-mono text-[13px] leading-[1.6]">
                <code dangerouslySetInnerHTML={{ __html: curlCode.replace(/CLIENT_REQUEST_ID/g, '<span class="text-[#a5d6ff]">CLIENT_REQUEST_ID</span>')
                  .replace(/uuidgen/g, '<span class="text-[#79c0ff]">uuidgen</span>')
                  .replace(/curl/g, '<span class="text-[#79c0ff]">curl</span>')
                  .replace(/-X POST|-H|-d/g, '<span class="text-[#ff7b72]">$&</span>')
                  .replace(/"https[^"]+"|"\${[^}]+}"|'[^']+'/g, '<span class="text-[#a5d6ff]">$&</span>')
                }}></code>
              </pre>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
