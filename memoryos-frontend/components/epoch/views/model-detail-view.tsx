"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Clock,
  Key,
  Code2,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Users,
  ArrowDown,
  ArrowUp,
  Braces,
  Gauge,
} from "lucide-react";
import { ModelEntity } from "@/lib/epoch-types";
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
import { cn } from "@/lib/utils";

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
  dark = true,
}: ModelDetailViewProps) {
  const [activeLang, setActiveLang] = useState<"python" | "node" | "ai_sdk" | "curl">("curl");
  const [copiedRequest, setCopiedRequest] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [specExpanded, setSpecExpanded] = useState(true);

  const modelId = model?.hfIdentity?.repositoryId ?? model?.name ?? "meta-llama/Llama-3.1-8B-Instruct";
  const servedModelId = model?.name ?? modelId;
  const modelName = model?.name ?? "Unknown model";
  const modelStatus = model?.status ?? "available";
  const contextWindow = model?.contextWindow ? model.contextWindow.toLocaleString() : "128,000";
  const inputPrice = model?.pricing?.inputPricePer1M ? `$${model.pricing.inputPricePer1M}` : "Unavailable";
  const outputPrice = model?.pricing?.outputPricePer1M ? `$${model.pricing.outputPricePer1M}` : "Unavailable";
  const cachedInputPrice = model?.pricing?.cachedInputPricePer1M ? `$${model.pricing.cachedInputPricePer1M}` : "Unavailable";
  const maxGeneratedOutput = model?.pricing?.maxGeneratedOutput ? `${model.pricing.maxGeneratedOutput.toLocaleString()} tokens` : "Unknown";

  // Official brand logo resolver (100% real brand vectors)
  function getBrandLogo(rawName: string) {
    const raw = rawName.toLowerCase();
    if (raw.includes("microsoft") || raw.includes("deberta") || raw.includes("florence") || raw.includes("phi-") || raw.includes("trellis")) return <MicrosoftLogo size={26} />;
    if (raw.includes("llama") || raw.includes("meta")) return <MetaLogo size={26} />;
    if (raw.includes("mistral") || raw.includes("mixtral") || raw.includes("codestral")) return <MistralLogo size={26} />;
    if (raw.includes("qwen") || raw.includes("alibaba")) return <QwenLogo size={26} />;
    if (raw.includes("deepseek")) return <DeepSeekLogo size={26} />;
    if (raw.includes("claude") || raw.includes("anthropic")) return <AnthropicLogo size={26} />;
    if (raw.includes("gpt") || raw.includes("openai") || raw.includes("whisper") || raw.includes("openrouter")) return <OpenAILogo size={26} />;
    if (raw.includes("gemini") || raw.includes("gemma") || raw.includes("google")) return <GoogleLogo size={26} />;
    if (raw.includes("nvidia") || raw.includes("nemotron") || raw.includes("megatron")) return <NvidiaLogo size={26} />;
    if (raw.includes("glm") || raw.includes("zhipu") || raw.includes("thudm") || raw.includes("chatglm")) return <GLMLogo size={26} />;
    if (raw.includes("bge") || raw.includes("baai")) return <BAAILogo size={26} />;
    if (raw.includes("kimi") || raw.includes("moonshot")) return <KimiLogo size={26} />;
    return <HuggingFaceLogo size={26} />;
  }

  const curlCode = `CLIENT_REQUEST_ID="$(uuidgen)"

curl -X POST "https://api.runinfra.ai/v1/chat/completions" \\
  -H "Authorization: Bearer $RUNINFRA_GATEWAY_KEY" \\
  -H "X-Client-Request-Id: $CLIENT_REQUEST_ID" \\
  -H "Content-Type: application/json" \\
  -d '{"model":"${servedModelId}","messages":[{"role":"user","content":"Hello"}],"max_tokens":512}'`;

  const pythonCode = `import os
from openai import OpenAI

client = OpenAI(
    base_url="https://api.runinfra.ai/v1",
    api_key=os.environ.get("RUNINFRA_GATEWAY_KEY"),
)

response = client.chat.completions.create(
    model="${servedModelId}",
    messages=[{"role": "user", "content": "Hello"}],
    max_tokens=512,
)
print(response.choices[0].message.content)`;

  const nodeCode = `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://api.runinfra.ai/v1",
  apiKey: process.env.RUNINFRA_GATEWAY_KEY,
});

const response = await openai.chat.completions.create({
  model: "${servedModelId}",
  messages: [{ role: "user", content: "Hello" }],
  max_tokens: 512,
});
console.log(response.choices[0].message.content);`;

  const aiSdkCode = `import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const runinfra = createOpenAI({
  baseURL: "https://api.runinfra.ai/v1",
  apiKey: process.env.RUNINFRA_GATEWAY_KEY,
});

const { text } = await generateText({
  model: runinfra("${servedModelId}"),
  prompt: "Hello",
});
console.log(text);`;

  const getCodeSnippet = () => {
    switch (activeLang) {
      case "python": return pythonCode;
      case "node": return nodeCode;
      case "ai_sdk": return aiSdkCode;
      default: return curlCode;
    }
  };

  const handleCopyRequest = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedRequest(true);
    setTimeout(() => setCopiedRequest(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(servedModelId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-16 font-sans text-xs">
      {/* Top Header matching exact Screenshot 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center w-7 h-7">
            {getBrandLogo(modelName)}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#F0EFE2] font-sans">
            {modelName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="flex items-center gap-1.5 border border-[#384820] bg-[#1c2a12] text-[#86dc00] px-2.5 py-1 text-xs rounded-xs font-mono">
            <Clock size={13} />
            <span className="capitalize">{modelStatus}</span>
          </div>

          {/* All models button */}
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 border border-[#383838] bg-[#222] text-[#F0EFE2] hover:border-[#555] px-3 py-1 text-xs font-medium transition-colors rounded-xs cursor-pointer font-mono"
          >
            <ArrowLeft size={13} />
            <span>All models</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Columns matching exact Screenshot 1 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-dashed border-[#282828] py-4 text-xs">
        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <ArrowDown size={12} />
            <span>INPUT / 1M</span>
          </div>
          <div className="font-bold font-mono text-base mt-1 text-[#F0EFE2]">
            {inputPrice}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <ArrowUp size={12} />
            <span>OUTPUT / 1M</span>
          </div>
          <div className="font-bold font-mono text-base mt-1 text-[#F0EFE2]">
            {outputPrice}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <Braces size={12} />
            <span>CONTEXT WINDOW</span>
          </div>
          <div className="font-bold font-mono text-base mt-1 text-[#F0EFE2]">
            {contextWindow}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <Gauge size={12} />
            <span>WORKSPACE TOKEN RATE</span>
          </div>
          <div className="font-bold font-mono text-base mt-1 text-[#F0EFE2]">
            400,000 <span className="text-xs font-normal text-[#788274]">tok/min</span>
          </div>
        </div>
      </div>

      {/* Section 1: API Key matching exact Screenshot 1 */}
      <div className="border border-dashed border-[#282828] bg-[#181818] p-4 rounded-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#F0EFE2]">
          <Key size={14} className="text-[#788274]" />
          <span>API key</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-dashed border-[#282828]">
          <div className="flex items-center gap-2 text-[#788274]">
            <Clock size={13} className="shrink-0" />
            <span>New key creation is unavailable until hosted access resumes. Existing keys remain available in settings.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
            <button
              type="button"
              className="border border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555] px-2.5 py-1 text-xs font-medium transition-colors rounded-xs cursor-pointer"
            >
              Refresh availability
            </button>
            <button
              type="button"
              onClick={onManageKeys}
              className="border border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555] px-2.5 py-1 text-xs font-medium transition-colors rounded-xs cursor-pointer"
            >
              Manage keys
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: API Request matching exact Screenshot 1 */}
      <div className="border border-dashed border-[#282828] bg-[#181818] p-4 rounded-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F0EFE2]">
              <Code2 size={14} className="text-[#788274]" />
              <span>API request</span>
            </div>
            <p className="text-[11px] text-[#788274] mt-0.5">
              Copy the request now and run it after access resumes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Language tabs */}
            <div className="flex items-center gap-1 border border-[#333] bg-[#141414] p-0.5 rounded-xs text-xs font-mono">
              {(["python", "node", "ai_sdk", "curl"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={cn(
                    "px-2 py-0.5 text-xs transition-colors rounded-xs cursor-pointer",
                    activeLang === lang
                      ? "bg-[#282828] text-[#F0EFE2] font-bold"
                      : "text-[#C8C7BA] hover:text-[#F0EFE2]"
                  )}
                >
                  {lang === "ai_sdk" ? "AI SDK" : lang === "node" ? "Node" : lang === "python" ? "Python" : "curl"}
                </button>
              ))}
            </div>

            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopyRequest}
              className="flex items-center gap-1.5 border border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555] px-2.5 py-1 text-xs font-medium transition-colors rounded-xs cursor-pointer font-mono"
            >
              {copiedRequest ? <Check size={12} className="text-[#86dc00]" /> : <Copy size={12} />}
              <span>{copiedRequest ? "Copied" : "Copy request"}</span>
            </button>
          </div>
        </div>

        {/* Code Snippet Box */}
        <pre className="border border-[#282828] bg-[#121212] p-3.5 rounded-xs text-[11px] font-mono text-[#a0a89d] overflow-x-auto leading-relaxed">
          <code>{getCodeSnippet()}</code>
        </pre>

        <p className="text-[11px] text-[#788274] font-mono">
          Set RUNINFRA_GATEWAY_KEY to a workspace API key before running this request.
        </p>
      </div>

      {/* Section 3: Usage Snapshot matching exact Screenshot 1 */}
      <div className="border border-dashed border-[#282828] bg-[#181818] p-4 rounded-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#F0EFE2]">
              <BarChart2 size={14} className="text-[#788274]" />
              <span>Usage snapshot</span>
            </div>
            <p className="text-[11px] text-[#788274] mt-0.5">
              Measured for this model across all workspace API keys in the last 7 days.
            </p>
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 border border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555] px-2.5 py-1 text-xs font-medium transition-colors rounded-xs cursor-pointer font-mono"
          >
            <BarChart2 size={12} className="text-[#788274]" />
            <span>View analytics</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-1 font-mono text-xs">
          <div>
            <div className="flex items-center gap-1 text-[10px] text-[#788274] uppercase">
              <Users size={11} />
              <span>REQUESTS</span>
            </div>
            <div className="text-base font-bold text-[#F0EFE2] mt-1">0</div>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] text-[#788274] uppercase">
              <ArrowDown size={11} />
              <span>INPUT TOKENS</span>
            </div>
            <div className="text-base font-bold text-[#F0EFE2] mt-1">0</div>
          </div>

          <div>
            <div className="flex items-center gap-1 text-[10px] text-[#788274] uppercase">
              <ArrowUp size={11} />
              <span>OUTPUT TOKENS</span>
            </div>
            <div className="text-base font-bold text-[#F0EFE2] mt-1">0</div>
          </div>
        </div>
      </div>

      {/* Section 4: Full Specifications Table matching exact Screenshot 2 */}
      <div className="border border-dashed border-[#282828] bg-[#181818] rounded-xs overflow-hidden font-mono text-xs">
        <div
          onClick={() => setSpecExpanded(!specExpanded)}
          className="flex items-center justify-between p-3.5 bg-[#1e1e1e] cursor-pointer hover:bg-[#252525] transition-colors"
        >
          <span className="font-bold text-[#F0EFE2] uppercase tracking-wider text-xs font-sans">
            {specExpanded ? "Collapse Full Spec" : "Expand Full Spec"}
          </span>
          {specExpanded ? <ChevronUp size={14} className="text-[#788274]" /> : <ChevronDown size={14} className="text-[#788274]" />}
        </div>

        {specExpanded && (
          <div className="divide-y divide-[#262626] text-xs">
            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">PROVIDER</span>
              <div className="col-span-2 text-[#F0EFE2] font-semibold flex items-center gap-2">
                <div className="shrink-0">{getBrandLogo(modelName)}</div>
                <span>{model?.provider || "open-weights"}</span>
              </div>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">SERVED ID</span>
              <div className="col-span-2 text-[#F0EFE2] font-mono flex items-center gap-2">
                <span>{servedModelId}</span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="text-[#788274] hover:text-[#F0EFE2] cursor-pointer"
                  title="Copy Served ID"
                >
                  {copiedId ? <Check size={12} className="text-[#86dc00]" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">HUGGING FACE</span>
              <span className="col-span-2 text-[#60a5fa] flex items-center gap-1 hover:underline cursor-pointer">
                <span>Model card</span>
                <ExternalLink size={11} />
              </span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">CONTEXT WINDOW</span>
              <span className="col-span-2 text-[#F0EFE2]">{contextWindow} tokens</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">MAXIMUM GENERATED OUTPUT</span>
              <span className="col-span-2 text-[#F0EFE2]">{maxGeneratedOutput}</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">INPUT PRICE</span>
              <span className="col-span-2 text-[#F0EFE2]">{inputPrice} per 1M input tokens</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">CACHED INPUT PRICE</span>
              <span className="col-span-2 text-[#F0EFE2]">{cachedInputPrice} per 1M cached input tokens</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">OUTPUT PRICE</span>
              <span className="col-span-2 text-[#F0EFE2]">{outputPrice} per 1M output tokens</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">DELIVERY</span>
              <div className="col-span-2">
                <span className="border border-[#383838] bg-[#222] text-[#F0EFE2] px-2 py-0.5 rounded-xs text-[10px]">
                  SERVERLESS
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">INPUT MODALITIES</span>
              <div className="col-span-2">
                <span className="border border-[#383838] bg-[#222] text-[#F0EFE2] px-2 py-0.5 rounded-xs text-[10px]">
                  TEXT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">OUTPUT MODALITIES</span>
              <div className="col-span-2">
                <span className="border border-[#383838] bg-[#222] text-[#F0EFE2] px-2 py-0.5 rounded-xs text-[10px]">
                  TEXT
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">JSON MODE</span>
              <span className="col-span-2 text-[#86dc00] font-bold">✓ Supported</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">STREAMING</span>
              <span className="col-span-2 text-[#86dc00] font-bold">✓ Supported</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">FUNCTION CALLING</span>
              <span className="col-span-2 text-[#788274]">✕ Not yet enabled</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">IMAGE INPUT</span>
              <span className="col-span-2 text-[#788274]">✕ Not supported</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">PREFIX CACHING</span>
              <span className="col-span-2 text-[#788274]">✕ Not supported</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">PER-KEY CONCURRENCY</span>
              <span className="col-span-2 text-[#F0EFE2]">16 requests</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">WORKSPACE CONCURRENCY</span>
              <span className="col-span-2 text-[#F0EFE2]">16 requests</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">SHARED MODEL CONCURRENCY</span>
              <span className="col-span-2 text-[#F0EFE2]">64 requests</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">WORKSPACE TOKEN RATE</span>
              <span className="col-span-2 text-[#F0EFE2]">400,000 tokens/min</span>
            </div>

            <div className="grid grid-cols-3 p-3 text-[#788274]">
              <span className="uppercase text-[11px]">STREAMING TIME TO FIRST TOKEN LIMIT</span>
              <span className="col-span-2 text-[#F0EFE2]">60 seconds</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
