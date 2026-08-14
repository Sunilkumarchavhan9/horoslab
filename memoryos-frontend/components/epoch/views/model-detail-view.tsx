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
  Layers,
  Sparkles,
  Zap,
} from "lucide-react";
import { ModelEntity } from "@/lib/epoch-types";
import { DeepSeekLogo } from "../primitives/brand-icons";
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

  const modelId = model?.hfIdentity?.repositoryId ?? model?.name ?? "unknown-model";
  const servedModelId = model?.name ?? modelId;
  const modelName = model?.name ?? "Unknown model";
  const modelStatus = model?.status ?? "paused";
  const contextWindow = model?.contextWindow ? model.contextWindow.toLocaleString() : "Unknown";
  const inputPrice = model?.pricing ? `$${model.pricing.inputPricePer1M}` : "Unavailable";
  const outputPrice = model?.pricing ? `$${model.pricing.outputPricePer1M}` : "Unavailable";
  const cachedInputPrice = model?.pricing ? `$${model.pricing.cachedInputPricePer1M}` : "Unavailable";
  const maxGeneratedOutput = model?.pricing?.maxGeneratedOutput ? `${model.pricing.maxGeneratedOutput.toLocaleString()} tokens` : "Unknown";

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
    navigator.clipboard.writeText(modelId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const primaryText = dark ? "text-white" : "text-[#171a17]";
  const subText = dark ? "text-[#90988c]" : "text-[#555d50]";

  return (
    <div className="space-y-6 max-w-[1000px] mx-auto pb-16">
      {/* Top Header matching Screenshot 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <DeepSeekLogo size={28} />
          <h1 className={cn("text-2xl font-bold tracking-tight", primaryText)}>
            {modelName}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Paused status badge */}
          <div className="flex items-center gap-1.5 border border-[#78350f] bg-[#451a03]/40 text-[#fbbf24] px-2.5 py-1 text-xs rounded-xs font-mono">
            <Clock size={13} />
            <span>{modelStatus}</span>
          </div>

          {/* All models button */}
          <button
            type="button"
            onClick={onBack}
            className={cn(
              "flex items-center gap-1.5 border px-3 py-1 text-xs font-medium transition-colors rounded-xs",
              dark ? "border-[#333] bg-[#222] text-white hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#999]"
            )}
          >
            <ArrowLeft size={13} />
            <span>All models</span>
          </button>
        </div>
      </div>

      {/* 4 Stats Columns matching Screenshot 2 */}
      <div className={cn(
        "grid grid-cols-2 sm:grid-cols-4 gap-4 border-y border-dashed py-4 text-xs",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <ArrowDown size={12} />
            <span>INPUT / 1M</span>
          </div>
          <div className={cn("font-bold font-mono text-base mt-1", primaryText)}>
            {inputPrice}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <ArrowUp size={12} />
            <span>OUTPUT / 1M</span>
          </div>
          <div className={cn("font-bold font-mono text-base mt-1", primaryText)}>
            {outputPrice}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <Braces size={12} />
            <span>CONTEXT WINDOW</span>
          </div>
          <div className={cn("font-bold font-mono text-base mt-1", primaryText)}>
            {contextWindow}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1 font-mono text-xs text-[#788274]">
            <Gauge size={12} />
            <span>WORKSPACE TOKEN RATE</span>
          </div>
          <div className={cn("font-bold font-mono text-base mt-1", primaryText)}>
            400,000 <span className="text-xs font-normal text-[#788274]">tok/min</span>
          </div>
        </div>
      </div>

      {/* Section 1: API Key matching Screenshot 2 */}
      <div className={cn(
        "border border-dashed p-4 rounded-xs space-y-3",
        dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white"
      )}>
        <div className={cn("flex items-center gap-2 text-xs font-semibold", primaryText)}>
          <Key size={14} className="text-[#788274]" />
          <span>API key</span>
        </div>

        <div className={cn(
          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-1 border-t border-dashed",
          dark ? "border-[#282828]" : "border-[#edf0eb]"
        )}>
          <div className="flex items-center gap-2 text-[#788274]">
            <Clock size={13} className="shrink-0" />
            <span>New key creation is unavailable until hosted access resumes. Existing keys remain available in settings.</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className={cn(
                "border px-2.5 py-1 text-xs font-medium transition-colors rounded-xs",
                dark ? "border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#333] hover:border-[#999]"
              )}
            >
              Refresh availability
            </button>
            <button
              type="button"
              onClick={onManageKeys}
              className={cn(
                "border px-2.5 py-1 text-xs font-medium transition-colors rounded-xs",
                dark ? "border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#333] hover:border-[#999]"
              )}
            >
              Manage keys
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: API Request matching Screenshot 2 */}
      <div className={cn(
        "border border-dashed p-4 rounded-xs space-y-3",
        dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className={cn("flex items-center gap-2 text-xs font-semibold", primaryText)}>
              <Code2 size={14} className="text-[#788274]" />
              <span>API request</span>
            </div>
            <p className="text-[11px] text-[#788274] mt-0.5">
              Copy the request now and run it after access resumes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Language tabs */}
            <div className={cn(
              "flex items-center gap-1 border p-0.5 rounded-xs text-xs font-mono",
              dark ? "border-[#333] bg-[#141414]" : "border-[#d8ddd3] bg-[#f5f8f3]"
            )}>
              {(["python", "node", "ai_sdk", "curl"] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setActiveLang(lang)}
                  className={cn(
                    "px-2 py-0.5 text-xs transition-colors rounded-xs",
                    activeLang === lang
                      ? "bg-[#75bf00] text-black font-bold"
                      : dark ? "text-[#888] hover:text-white" : "text-[#666] hover:text-black"
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
              className={cn(
                "flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors rounded-xs",
                dark ? "border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#333] hover:border-[#999]"
              )}
            >
              {copiedRequest ? <Check size={12} className="text-[#75bf00]" /> : <Copy size={12} />}
              <span>{copiedRequest ? "Copied" : "Copy request"}</span>
            </button>
          </div>
        </div>

        {/* Code terminal block */}
        <div className={cn(
          "relative border p-4 rounded-xs font-mono text-xs overflow-x-auto leading-relaxed",
          dark ? "border-[#2e2e2e] bg-[#111111] text-[#a3e635]" : "border-[#d8ddd3] bg-[#1a1f18] text-[#a3e635]"
        )}>
          <pre className="whitespace-pre">{getCodeSnippet()}</pre>
        </div>

        <div className="text-[11px] text-[#788274] font-mono">
          Set RUNINFRA_GATEWAY_KEY to a workspace API key before running this request.
        </div>
      </div>

      {/* Section 3: Usage Snapshot matching Screenshot 2 */}
      <div className={cn(
        "border border-dashed p-4 rounded-xs space-y-4",
        dark ? "border-[#2e2e2e] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-white"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className={cn("flex items-center gap-2 text-xs font-semibold", primaryText)}>
              <BarChart2 size={14} className="text-[#788274]" />
              <span>Usage snapshot</span>
            </div>
            <p className="text-[11px] text-[#788274] mt-0.5">
              Measured for this model across all workspace API keys in the last 7 days.
            </p>
          </div>

          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 border px-2.5 py-1 text-xs font-medium transition-colors rounded-xs self-start sm:self-auto",
              dark ? "border-[#383838] bg-[#222] text-[#d1d5db] hover:border-[#555]" : "border-[#d8ddd3] bg-white text-[#333] hover:border-[#999]"
            )}
          >
            <BarChart2 size={12} />
            <span>View analytics</span>
          </button>
        </div>

        {/* 3 Metric Columns */}
        <div className={cn(
          "grid grid-cols-3 gap-4 border-t border-dashed pt-3 text-xs",
          dark ? "border-[#282828]" : "border-[#edf0eb]"
        )}>
          <div>
            <div className="flex items-center gap-1 font-mono text-[#788274] text-[11px]">
              <Users size={12} />
              <span>REQUESTS</span>
            </div>
            <div className={cn("font-bold font-mono text-base mt-1", primaryText)}>0</div>
          </div>

          <div>
            <div className="flex items-center gap-1 font-mono text-[#788274] text-[11px]">
              <ArrowDown size={12} />
              <span>INPUT TOKENS</span>
            </div>
            <div className={cn("font-bold font-mono text-base mt-1", primaryText)}>0</div>
          </div>

          <div>
            <div className="flex items-center gap-1 font-mono text-[#788274] text-[11px]">
              <ArrowUp size={12} />
              <span>OUTPUT TOKENS</span>
            </div>
            <div className={cn("font-bold font-mono text-base mt-1", primaryText)}>0</div>
          </div>
        </div>
      </div>

      {/* Section 4: Expandable Full Spec Accordion (Screenshots 3 & 4) */}
      <div className={cn(
        "border border-dashed rounded-xs overflow-hidden",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        {/* Toggle bar */}
        <button
          type="button"
          onClick={() => setSpecExpanded(!specExpanded)}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-2.5 text-xs font-mono transition-colors",
            dark ? "bg-[#1f1f1f] text-[#a0a89d] hover:text-white" : "bg-[#f5f8f3] text-[#444] hover:text-black"
          )}
        >
          <Layers size={13} />
          <span>{specExpanded ? "Collapse Full Spec" : "View Full Spec"}</span>
          {specExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {/* 22 High-density spec rows matching Screenshots 3 & 4 */}
        {specExpanded && (
          <div className={cn(
            "divide-y divide-dashed font-mono text-xs",
            dark ? "bg-[#141414] divide-[#242424]" : "bg-white divide-[#edf0eb]"
          )}>
            {[
              {
                label: "PROVIDER",
                value: (
                  <div className={cn("flex items-center gap-2", primaryText)}>
                    <DeepSeekLogo size={14} />
                    <span className="font-sans font-medium">{model?.provider ?? "Unknown"}</span>
                  </div>
                ),
              },
              {
                label: "SERVED ID",
                value: (
                  <div className={cn("flex items-center gap-2", primaryText)}>
                    <span>{modelId}</span>
                    <button
                      type="button"
                      onClick={handleCopyId}
                      className={cn("hover:opacity-100 transition-colors", dark ? "text-[#788274] hover:text-white" : "text-[#788274] hover:text-black")}
                      title="Copy ID"
                    >
                      {copiedId ? <Check size={12} className="text-[#75bf00]" /> : <Copy size={12} />}
                    </button>
                  </div>
                ),
              },
              {
                label: "HUGGING FACE",
                value: (
                  <a
                    href={model?.hfIdentity ? `https://huggingface.co/${model.hfIdentity.repositoryId}` : "https://huggingface.co"}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#2563eb] dark:text-[#60a5fa] hover:underline"
                  >
                    <span>Model card</span>
                    <ExternalLink size={11} />
                  </a>
                ),
              },
              {
                label: "CONTEXT WINDOW",
                value: <span className={primaryText}>{contextWindow} tokens</span>,
              },
              {
                label: "MAXIMUM GENERATED OUTPUT",
                value: <span className={primaryText}>{maxGeneratedOutput}</span>,
              },
              {
                label: "INPUT PRICE",
                value: <span className={primaryText}>{inputPrice} per 1M input tokens</span>,
              },
              {
                label: "CACHED INPUT PRICE",
                value: (
                  <div className="space-y-0.5">
                    <div className={primaryText}>{cachedInputPrice} per 1M cached input tokens</div>
                  </div>
                ),
              },
              {
                label: "OUTPUT PRICE",
                value: <span className={primaryText}>{outputPrice} per 1M output tokens</span>,
              },
              {
                label: "DELIVERY",
                value: (
                  <span className={cn(
                    "border px-2 py-0.5 rounded-xs text-[10px] uppercase tracking-wider",
                    dark ? "border-[#383838] bg-[#222] text-[#d1d5db]" : "border-[#d8ddd3] bg-[#f5f8f3] text-[#333]"
                  )}>
                    SERVERLESS
                  </span>
                ),
              },
              {
                label: "INPUT MODALITIES",
                value: (
                  <span className={cn(
                    "border px-2 py-0.5 rounded-xs text-[10px] uppercase tracking-wider",
                    dark ? "border-[#383838] bg-[#222] text-[#d1d5db]" : "border-[#d8ddd3] bg-[#f5f8f3] text-[#333]"
                  )}>
                    TEXT
                  </span>
                ),
              },
              {
                label: "OUTPUT MODALITIES",
                value: (
                  <span className={cn(
                    "border px-2 py-0.5 rounded-xs text-[10px] uppercase tracking-wider",
                    dark ? "border-[#383838] bg-[#222] text-[#d1d5db]" : "border-[#d8ddd3] bg-[#f5f8f3] text-[#333]"
                  )}>
                    TEXT
                  </span>
                ),
              },
              {
                label: "JSON MODE",
                value: <span className="text-[#65a30d] dark:text-[#75bf00] flex items-center gap-1.5 font-medium"><Check size={13} /> Supported</span>,
              },
              {
                label: "STREAMING",
                value: <span className="text-[#65a30d] dark:text-[#75bf00] flex items-center gap-1.5 font-medium"><Check size={13} /> Supported</span>,
              },
              {
                label: "FUNCTION CALLING",
                value: <span className="text-[#788274]">✕ Not yet enabled</span>,
              },
              {
                label: "IMAGE INPUT",
                value: <span className="text-[#788274]">✕ Not supported</span>,
              },
              {
                label: "PREFIX CACHING",
                value: <span className="text-[#788274]">✕ Not supported</span>,
              },
              {
                label: "PER-KEY CONCURRENCY",
                value: <span className={primaryText}>16 requests</span>,
              },
              {
                label: "WORKSPACE CONCURRENCY",
                value: <span className={primaryText}>16 requests</span>,
              },
              {
                label: "SHARED MODEL CONCURRENCY",
                value: <span className={primaryText}>64 requests</span>,
              },
              {
                label: "WORKSPACE TOKEN RATE",
                value: <span className={primaryText}>400,000 tokens/min</span>,
              },
              {
                label: "STREAMING TIME TO FIRST TOKEN LIMIT",
                value: <span className={primaryText}>60 seconds</span>,
              },
              {
                label: "MAXIMUM REQUEST DURATION",
                value: <span className={primaryText}>300 seconds</span>,
              },
            ].map((row, idx) => (
              <div
                key={idx}
                className={cn(
                  "grid grid-cols-1 md:grid-cols-3 gap-2 p-3 items-start transition-colors",
                  dark ? "hover:bg-[#1c1c1c]" : "hover:bg-[#f8faf7]"
                )}
              >
                <div className="text-[11px] text-[#788274] uppercase tracking-wider font-mono">
                  {row.label}
                </div>
                <div className="md:col-span-2">{row.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
