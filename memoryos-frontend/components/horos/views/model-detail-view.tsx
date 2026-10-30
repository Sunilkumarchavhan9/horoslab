"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  Key,
  Code2,
  ArrowDown,
  ArrowUp,
  Zap,
  Clock,
  Calendar,
  Gauge,
  BarChart2,
  Users,
  Table,
  ChevronDown,
  ChevronUp,
  Building2,
  ExternalLink,
  Maximize2,
  Cloud,
  ArrowRight,
  ArrowRightFromLine,
  Radio,
  Wrench,
  Image as ImageIcon,
  Database,
  Share2,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";
import { ModelEntity } from "@/lib/horos-types";
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
  OrnithLogo,
} from "../primitives/brand-icons";
import { cn } from "@/lib/utils";

interface ModelDetailViewProps {
  model?: ModelEntity;
  onBack: () => void;
  onStartProgramWithModel?: (modelName: string) => void;
  onManageKeys?: () => void;
  onNavigateToAnalytics?: () => void;
  dark?: boolean;
}

export function ModelDetailView({
  model,
  onBack,
  onStartProgramWithModel,
  onManageKeys,
  onNavigateToAnalytics,
}: ModelDetailViewProps) {
  const [activeLang, setActiveLang] = useState<string>("curl");
  const [specExpanded, setSpecExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [createdKeyMessage, setCreatedKeyMessage] = useState(false);

  const modelName = model?.name ?? "Ornith 1.5 122B";
  const servedModelId =
    model?.hfIdentity?.repositoryId ??
    (model?.id === "ornith-1-5-122b"
      ? "ornith-ai/Ornith-1.5-122B"
      : model?.id ?? "ornith-ai/Ornith-1.5-122B");

  function getBrandLogo(rawName: string) {
    const raw = rawName.toLowerCase();
    if (raw.includes("ornith")) return <OrnithLogo size={24} />;
    if (raw.includes("deepseek")) return <DeepSeekLogo size={22} />;
    if (raw.includes("glm") || raw.includes("zhipu") || raw.includes("zai")) return <GLMLogo size={22} />;
    if (raw.includes("nvidia") || raw.includes("nemotron")) return <NvidiaLogo size={22} />;
    if (raw.includes("qwen") || raw.includes("alibaba")) return <QwenLogo size={22} />;
    if (raw.includes("microsoft")) return <MicrosoftLogo size={22} />;
    if (raw.includes("llama") || raw.includes("meta")) return <MetaLogo size={22} />;
    if (raw.includes("mistral")) return <MistralLogo size={22} />;
    if (raw.includes("claude") || raw.includes("anthropic")) return <AnthropicLogo size={22} />;
    if (raw.includes("gpt") || raw.includes("openai")) return <OpenAILogo size={22} />;
    if (raw.includes("gemini") || raw.includes("google")) return <GoogleLogo size={22} />;
    if (raw.includes("bge") || raw.includes("baai")) return <BAAILogo size={22} />;
    if (raw.includes("kimi") || raw.includes("moonshot")) return <KimiLogo size={22} />;
    return <OrnithLogo size={24} />;
  }

  function getProviderName(rawName: string) {
    const raw = rawName.toLowerCase();
    if (raw.includes("ornith")) return "Ornith";
    if (raw.includes("deepseek")) return "DeepSeek";
    if (raw.includes("glm")) return "Zhipu AI";
    if (raw.includes("nvidia") || raw.includes("nemotron")) return "NVIDIA";
    if (raw.includes("qwen")) return "Qwen";
    return model?.provider || "Hosted";
  }

  // Model metrics matching Image 2 & Image 3
  const getMetrics = () => {
    const name = modelName.toLowerCase();
    const id = (model?.id || "").toLowerCase();

    if (name.includes("122b") || id.includes("122b")) {
      return {
        inputPrice: "$0.26",
        cachedInputPrice: "$0.07",
        outputPrice: "$2.08",
        contextWindow: "262,144 tokens",
        outputSpeed: "302 output tokens per second, model only",
        ttf: "72 milliseconds to first reasoning token",
        cacheHit: "78.1% of input tokens served from the cache",
        accountTokenRate: "4,000,000 tokens/min",
        maxRequestSize: "3.5 MB per request",
        maxGeneratedOutput: "262,144 tokens",
        delivery: "Serverless",
        inputModalities: ["Text", "Image"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: true,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "18 requests",
        sharedConcurrency: "72 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "65 tokens",
      };
    }

    if (name.includes("1017") || id.includes("1017")) {
      return {
        inputPrice: "$0.15",
        cachedInputPrice: "$0.03",
        outputPrice: "$0.60",
        contextWindow: "1,048,576 tokens",
        outputSpeed: "385 output tokens per second, model only",
        ttf: "58 milliseconds to first reasoning token",
        cacheHit: "82.4% of input tokens served from the cache",
        accountTokenRate: "6,000,000 tokens/min",
        maxRequestSize: "5.0 MB per request",
        maxGeneratedOutput: "32,768 tokens",
        delivery: "Serverless",
        inputModalities: ["Text", "Image"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: true,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "24 requests",
        sharedConcurrency: "96 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "0 tokens",
      };
    }

    if (name.includes("glm 5.3 flash") || id.includes("glm-5-3-flash")) {
      return {
        inputPrice: "$0.05",
        cachedInputPrice: "$0.01",
        outputPrice: "$0.22",
        contextWindow: "1,048,576 tokens",
        outputSpeed: "254.1 output tokens per second, model only",
        ttf: "45 milliseconds to first reasoning token",
        cacheHit: "99.6% of input tokens served from the cache",
        accountTokenRate: "10,000,000 tokens/min",
        maxRequestSize: "4.0 MB per request",
        maxGeneratedOutput: "32,768 tokens",
        delivery: "Serverless",
        inputModalities: ["Text", "Image"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: true,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "32 requests",
        sharedConcurrency: "128 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "0 tokens",
      };
    }

    if (name.includes("glm 5.3") || id.includes("glm-5-3")) {
      return {
        inputPrice: "$1.30",
        cachedInputPrice: "$0.25",
        outputPrice: "$4.20",
        contextWindow: "1,048,576 tokens",
        outputSpeed: "180 output tokens per second, model only",
        ttf: "85 milliseconds to first reasoning token",
        cacheHit: "91.2% of input tokens served from the cache",
        accountTokenRate: "3,000,000 tokens/min",
        maxRequestSize: "3.0 MB per request",
        maxGeneratedOutput: "16,384 tokens",
        delivery: "Serverless",
        inputModalities: ["Text"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: false,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "16 requests",
        sharedConcurrency: "64 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "0 tokens",
      };
    }

    if (name.includes("deepseek") && name.includes("flash")) {
      return {
        inputPrice: "$0.14",
        cachedInputPrice: "$0.03",
        outputPrice: "$0.58",
        contextWindow: "1,048,576 tokens",
        outputSpeed: "340 output tokens per second, model only",
        ttf: "62 milliseconds to first reasoning token",
        cacheHit: "85.0% of input tokens served from the cache",
        accountTokenRate: "5,000,000 tokens/min",
        maxRequestSize: "3.5 MB per request",
        maxGeneratedOutput: "32,768 tokens",
        delivery: "Serverless",
        inputModalities: ["Text"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: false,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "20 requests",
        sharedConcurrency: "80 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "0 tokens",
      };
    }

    if (name.includes("nemotron") || id.includes("nemotron")) {
      return {
        inputPrice: "$0.05",
        cachedInputPrice: "$0.01",
        outputPrice: "$0.15",
        contextWindow: "262,144 tokens",
        outputSpeed: "540.9 output tokens per second, model only",
        ttf: "35 milliseconds to first reasoning token",
        cacheHit: "95.8% of input tokens served from the cache",
        accountTokenRate: "8,000,000 tokens/min",
        maxRequestSize: "2.0 MB per request",
        maxGeneratedOutput: "8,192 tokens",
        delivery: "Serverless",
        inputModalities: ["Text"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: false,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "32 requests",
        sharedConcurrency: "128 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "0 tokens",
      };
    }

    if (name.includes("35b") || id.includes("35b")) {
      return {
        inputPrice: "$0.10",
        cachedInputPrice: "$0.02",
        outputPrice: "$0.40",
        contextWindow: "262,144 tokens",
        outputSpeed: "216 output tokens per second, model only",
        ttf: "65 milliseconds to first reasoning token",
        cacheHit: "75.0% of input tokens served from the cache",
        accountTokenRate: "4,000,000 tokens/min",
        maxRequestSize: "3.0 MB per request",
        maxGeneratedOutput: "16,384 tokens",
        delivery: "Serverless",
        inputModalities: ["Text", "Image"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: true,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "18 requests",
        sharedConcurrency: "72 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "0 tokens",
      };
    }

    if (name.includes("qwen") || id.includes("qwen")) {
      return {
        inputPrice: "$0.10",
        cachedInputPrice: "$0.02",
        outputPrice: "$0.40",
        contextWindow: "262,144 tokens",
        outputSpeed: "140 output tokens per second, model only",
        ttf: "70 milliseconds to first reasoning token",
        cacheHit: "96.3% of input tokens served from the cache",
        accountTokenRate: "4,000,000 tokens/min",
        maxRequestSize: "3.0 MB per request",
        maxGeneratedOutput: "16,384 tokens",
        delivery: "Serverless",
        inputModalities: ["Text", "Image"],
        outputModalities: ["Text"],
        hasJson: true,
        hasStreaming: true,
        hasToolCalling: true,
        hasImageInput: true,
        prefixCaching: "Enabled, hit rate not guaranteed",
        defaultConcurrency: "18 requests",
        sharedConcurrency: "72 requests",
        requestsCount: "0 requests",
        inputTokensCount: "0 tokens",
        outputTokensCount: "0 tokens",
      };
    }

    // Default to Image 2 values
    return {
      inputPrice: model?.pricing?.inputPricePer1M ? `$${model.pricing.inputPricePer1M.toFixed(2)}` : "$0.26",
      cachedInputPrice: model?.pricing?.cachedInputPricePer1M ? `$${model.pricing.cachedInputPricePer1M.toFixed(2)}` : "$0.07",
      outputPrice: model?.pricing?.outputPricePer1M ? `$${model.pricing.outputPricePer1M.toFixed(2)}` : "$2.08",
      contextWindow: model?.contextWindow ? `${Number(model.contextWindow).toLocaleString()} tokens` : "262,144 tokens",
      outputSpeed: "302 output tokens per second, model only",
      ttf: "72 milliseconds to first reasoning token",
      cacheHit: "78.1% of input tokens served from the cache",
      accountTokenRate: "4,000,000 tokens/min",
      maxRequestSize: "3.5 MB per request",
      maxGeneratedOutput: "262,144 tokens",
      delivery: "Serverless",
      inputModalities: ["Text", "Image"],
      outputModalities: ["Text"],
      hasJson: true,
      hasStreaming: true,
      hasToolCalling: true,
      hasImageInput: true,
      prefixCaching: "Enabled, hit rate not guaranteed",
      defaultConcurrency: "18 requests",
      sharedConcurrency: "72 requests",
      requestsCount: "0 requests",
      inputTokensCount: "0 tokens",
      outputTokensCount: "65 tokens",
    };
  };

  const metrics = getMetrics();
  const provider = getProviderName(modelName);

  // Code snippets by language
  const getCodeSnippet = () => {
    const slug = model?.id || "ornith-1-5-122b";

    switch (activeLang) {
      case "curl":
        return [
          "# Set RUNINFRA_GATEWAY_KEY to your API key before running this example.",
          `curl -X POST "https://api.runinfra.ai/v1/chat/completions" \\`,
          `  -H "Authorization: Bearer $RUNINFRA_GATEWAY_KEY" \\`,
          `  -H "Content-Type: application/json" \\`,
          `  -d '{"model":"${slug}","messages":[{"role":"user","content":"Hello"}],"max_tokens":16384}'`,
        ];
      case "Python":
        return [
          "# pip install openai",
          "import os",
          "from openai import OpenAI",
          "",
          "client = OpenAI(",
          '    base_url="https://api.runinfra.ai/v1",',
          '    api_key=os.environ.get("RUNINFRA_GATEWAY_KEY"),',
          ")",
          "",
          "response = client.chat.completions.create(",
          `    model="${slug}",`,
          '    messages=[{"role": "user", "content": "Hello"}],',
          "    max_tokens=16384,",
          ")",
          "print(response.choices[0].message.content)",
        ];
      case "Node":
        return [
          "// npm install openai",
          'import OpenAI from "openai";',
          "",
          "const client = new OpenAI({",
          '  baseURL: "https://api.runinfra.ai/v1",',
          "  apiKey: process.env.RUNINFRA_GATEWAY_KEY,",
          "});",
          "",
          "const response = await client.chat.completions.create({",
          `  model: "${slug}",`,
          '  messages: [{ role: "user", content: "Hello" }],',
          "  max_tokens: 16384,",
          "});",
          "console.log(response.choices[0].message.content);",
        ];
      case "AI SDK":
        return [
          "// npm install @ai-sdk/openai ai",
          'import { createOpenAI } from "@ai-sdk/openai";',
          'import { generateText } from "ai";',
          "",
          "const runinfra = createOpenAI({",
          '  baseURL: "https://api.runinfra.ai/v1",',
          "  apiKey: process.env.RUNINFRA_GATEWAY_KEY,",
          "});",
          "",
          "const { text } = await generateText({",
          `  model: runinfra("${slug}"),`,
          '  prompt: "Hello",',
          "});",
          "console.log(text);",
        ];
      case "Anthropic SDK":
        return [
          "# pip install anthropic",
          "import os",
          "import anthropic",
          "",
          "client = anthropic.Anthropic(",
          '    base_url="https://api.runinfra.ai/v1",',
          '    api_key=os.environ.get("RUNINFRA_GATEWAY_KEY"),',
          ")",
          "",
          "message = client.messages.create(",
          `    model="${slug}",`,
          "    max_tokens=16384,",
          '    messages=[{"role": "user", "content": "Hello"}],',
          ")",
          "print(message.content[0].text)",
        ];
      case "Claude Code":
        return [
          "# Configure Claude Code CLI to route through RunInfra Gateway",
          'export ANTHROPIC_BASE_URL="https://api.runinfra.ai/v1"',
          'export ANTHROPIC_API_KEY="$RUNINFRA_GATEWAY_KEY"',
          `claude --model "${slug}"`,
        ];
      default:
        return [];
    }
  };

  const codeLines = getCodeSnippet();

  const handleCopyServedId = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(servedModelId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleCopyCode = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(codeLines.join("\n"));
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCreateKey = () => {
    setCreatedKeyMessage(true);
    setTimeout(() => setCreatedKeyMessage(false), 4000);
  };

  return (
    <div className="w-full bg-transparent min-h-screen text-[#F0EFE2] font-sans pb-32">
      <div className="max-w-[1120px] mx-auto px-6 pt-8">

        {/* Navigation Breadcrumb / Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[12px] text-[#777] hover:text-white transition-colors mb-6 cursor-pointer font-medium"
        >
          <ArrowLeft size={14} />
          <span>Back to Model APIs</span>
        </button>

        {/* Top Header Block matching Image 2 */}
        <div className="flex items-center justify-between pb-6">
          <div className="flex items-center gap-3.5">
            {/* Clean transparent logo container */}
            <div className="w-[32px] h-[32px] flex items-center justify-center shrink-0">
              {getBrandLogo(modelName)}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-[20px] font-semibold text-white tracking-tight">
                  {modelName}
                </h1>
                <span className="bg-[#12220e] text-[#75bf00] border border-[#75bf00]/30 text-[11px] font-medium px-2 py-0.5 rounded-[3px] flex items-center gap-1.5 leading-none">
                  <CheckCircle2 size={12} className="text-[#75bf00]" />
                  Available
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12px] font-mono text-[#777] mt-0.5">
                <span>{servedModelId}</span>
                <button
                  onClick={handleCopyServedId}
                  className="text-[#666] hover:text-white transition-colors p-0.5"
                  title="Copy model ID"
                >
                  {copiedId ? (
                    <Check size={12} className="text-[#75bf00]" />
                  ) : (
                    <Copy size={12} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Playground Button */}
          <button
            onClick={() => onStartProgramWithModel?.(modelName)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#181818] border border-[#2e2e2e] text-[#ccc] hover:text-white hover:border-[#444] transition-colors text-[12.5px] font-medium cursor-pointer"
          >
            <SlidersHorizontal size={13} className="text-[#888]" />
            <span>Playground</span>
          </button>
        </div>

        {/* Section: API key matching Image 2 */}
        <div className="border-t border-dashed border-[#242424] pt-5 pb-6">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[#ddd]">
            <Key size={13} className="text-[#888]" />
            <span>API key</span>
          </div>
          <p className="text-[12.5px] text-[#777] mt-1.5">
            Your account has a key you can&apos;t view here. Create one to copy it now.
          </p>

          <div className="flex flex-col items-start gap-2 mt-3.5">
            <button
              onClick={handleCreateKey}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#14220e] border border-[#75bf00]/30 text-[#75bf00] hover:bg-[#1b3013] transition-colors text-[12px] font-medium cursor-pointer"
            >
              <Key size={12} />
              <span>Create API key</span>
            </button>
            {createdKeyMessage && (
              <span className="text-[11.5px] text-[#75bf00] font-mono">
                API key created: rinf_live_{Math.random().toString(36).substring(2, 18)} (copied to clipboard)
              </span>
            )}
            <button
              onClick={onManageKeys}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#181818] border border-[#2e2e2e] text-[#aaa] hover:text-white hover:border-[#444] transition-colors text-[12px] font-medium cursor-pointer"
            >
              Manage keys
            </button>
          </div>
        </div>

        {/* Section: API request matching Image 2 */}
        <div className="border-t border-dashed border-[#242424] pt-5 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-[#ddd]">
              <Code2 size={14} className="text-[#888]" />
              <span>API request</span>
            </div>

            {/* Language Selection Tabs */}
            <div className="flex items-center gap-1">
              {["curl", "Python", "Node", "AI SDK", "Anthropic SDK", "Claude Code"].map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={cn(
                    "px-2.5 py-0.5 rounded-[3px] text-[12px] font-medium transition-colors cursor-pointer",
                    activeLang === lang
                      ? "bg-[#75bf00] text-black font-semibold"
                      : "text-[#888] hover:text-[#eee]"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Code Box matching Image 2 */}
          <div className="relative mt-3 rounded-[5px] bg-[#141414] border border-[#242424] p-4 font-mono text-[12px] leading-relaxed text-[#ddd] overflow-x-auto">
            <button
              onClick={handleCopyCode}
              className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-[#14220e] border border-[#75bf00]/30 text-[#75bf00] hover:bg-[#1b3013] transition-colors text-[11px] font-medium cursor-pointer"
            >
              {copiedCode ? <Check size={12} /> : <Copy size={12} />}
              <span>{copiedCode ? "Copied" : "Copy request"}</span>
            </button>

            <div className="space-y-1">
              {codeLines.map((line, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="text-[#444] select-none text-right w-3 shrink-0">
                    {idx + 1}
                  </span>
                  <span
                    className={
                      line.startsWith("#") || line.startsWith("//")
                        ? "text-[#777]"
                        : line.includes("https://")
                          ? "text-[#93c5fd]"
                          : "text-[#eee]"
                    }
                  >
                    {line}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section: Metric Rows matching Image 2 */}
        <div className="border-t border-dashed border-[#242424]">
          {/* INPUT / 1M */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <ArrowDown size={14} className="text-[#777]" />
              <span>INPUT / 1M</span>
            </div>
            <div className="flex-1 text-left text-[13px] font-semibold text-white font-mono">
              {metrics.inputPrice}
            </div>
          </div>

          {/* CACHED INPUT / 1M */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <Database size={14} className="text-[#777]" />
              <span>CACHED INPUT / 1M</span>
            </div>
            <div className="flex-1 text-left text-[13px] font-semibold text-white font-mono">
              {metrics.cachedInputPrice}
            </div>
          </div>

          {/* OUTPUT / 1M */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <ArrowUp size={14} className="text-[#777]" />
              <span>OUTPUT / 1M</span>
            </div>
            <div className="flex-1 text-left text-[13px] font-semibold text-white font-mono">
              {metrics.outputPrice}
            </div>
          </div>

          {/* CONTEXT WINDOW */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <span className="font-mono text-[#777] text-[12px]">{"{ }"}</span>
              <span>CONTEXT WINDOW</span>
            </div>
            <div className="flex-1 text-left text-[13px] text-white font-mono">
              {metrics.contextWindow}
            </div>
          </div>

          {/* OUTPUT SPEED */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <Zap size={14} className="text-[#777]" />
              <span>OUTPUT SPEED</span>
            </div>
            <div className="flex-1 text-left text-[13px] text-white">
              {metrics.outputSpeed}
            </div>
          </div>

          {/* TIME TO FIRST TOKEN */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <Clock size={14} className="text-[#777]" />
              <span>TIME TO FIRST TOKEN</span>
            </div>
            <div className="flex-1 text-left text-[13px] text-white">
              {metrics.ttf}
            </div>
          </div>

          {/* CACHE HIT, 24H */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <Calendar size={14} className="text-[#777]" />
              <span>CACHE HIT, 24H</span>
            </div>
            <div className="flex-1 text-left text-[13px] text-white">
              {metrics.cacheHit}
            </div>
          </div>

          {/* ACCOUNT TOKEN RATE */}
          <div className="border-b border-dashed border-[#242424] py-3.5 flex items-center justify-between">
            <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
              <Gauge size={14} className="text-[#777]" />
              <span>ACCOUNT TOKEN RATE</span>
            </div>
            <div className="flex-1 text-left text-[13px] text-white font-mono">
              {metrics.accountTokenRate}
            </div>
          </div>
        </div>

        {/* Section: Usage snapshot matching Image 2 */}
        <div className="pt-6 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 text-[13px] font-semibold text-[#ddd]">
                <BarChart2 size={14} className="text-[#888]" />
                <span>Usage snapshot</span>
              </div>
              <div className="text-[11.5px] text-[#666] mt-0.5">
                Last 24 hours, all keys.
              </div>
            </div>

            <button
              onClick={() => onNavigateToAnalytics?.()}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#181818] border border-[#2e2e2e] text-[#aaa] hover:text-white hover:border-[#444] transition-colors text-[12px] font-medium cursor-pointer"
            >
              <BarChart2 size={12} />
              <span>View analytics</span>
            </button>
          </div>

          <div className="space-y-0">
            {/* REQUESTS */}
            <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
              <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                <Users size={14} className="text-[#777]" />
                <span>REQUESTS</span>
              </div>
              <div className="flex-1 text-left text-[13px] font-mono text-white">
                {metrics.requestsCount}
              </div>
            </div>

            {/* INPUT TOKENS */}
            <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
              <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                <ArrowDown size={14} className="text-[#777]" />
                <span>INPUT TOKENS</span>
              </div>
              <div className="flex-1 text-left text-[13px] font-mono text-white">
                {metrics.inputTokensCount}
              </div>
            </div>

            {/* OUTPUT TOKENS */}
            <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
              <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                <ArrowUp size={14} className="text-[#777]" />
                <span>OUTPUT TOKENS</span>
              </div>
              <div className="flex-1 text-left text-[13px] font-mono text-white">
                {metrics.outputTokensCount}
              </div>
            </div>
          </div>
        </div>

        {/* Section: View full spec accordion matching Image 2 & Image 3 */}
        <div className="border-t border-dashed border-[#242424] pt-2">
          <div
            onClick={() => setSpecExpanded(!specExpanded)}
            className="py-3 flex items-center justify-between cursor-pointer group hover:bg-[#161616]/40 transition-colors select-none"
          >
            <div className="flex items-center gap-2.5 text-[11.5px] font-mono text-[#888] uppercase tracking-wider group-hover:text-white transition-colors">
              <Table size={14} className="text-[#777] group-hover:text-white" />
              <span>View full spec</span>
            </div>
            <div className="text-[#666] group-hover:text-white transition-colors">
              {specExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>

          {/* Expanded Spec Items matching Image 3 */}
          {specExpanded && (
            <div className="space-y-0">
              {/* PROVIDER */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <Building2 size={14} className="text-[#777]" />
                  <span>PROVIDER</span>
                </div>
                <div className="flex-1 flex items-center gap-2 text-[13px] text-white">
                  <div className="w-4 h-4 flex items-center justify-center shrink-0">
                    {getBrandLogo(modelName)}
                  </div>
                  <span>{provider}</span>
                </div>
              </div>

              {/* HUGGING FACE */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <ExternalLink size={14} className="text-[#777]" />
                  <span>HUGGING FACE</span>
                </div>
                <div className="flex-1 flex items-center text-[13px]">
                  <a
                    href={`https://huggingface.co/${servedModelId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[#ccc] hover:text-[#75bf00] transition-colors"
                  >
                    <span>Model card</span>
                    <ArrowUpRight size={13} />
                  </a>
                </div>
              </div>

              {/* MAXIMUM REQUEST SIZE */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <Maximize2 size={14} className="text-[#777]" />
                  <span>MAXIMUM REQUEST SIZE</span>
                </div>
                <div className="flex-1 text-[13px] text-white font-mono">
                  {metrics.maxRequestSize}
                </div>
              </div>

              {/* MAXIMUM GENERATED OUTPUT */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <ArrowUp size={14} className="text-[#777]" />
                  <span>MAXIMUM GENERATED OUTPUT</span>
                </div>
                <div className="flex-1 text-[13px] text-white font-mono">
                  {metrics.maxGeneratedOutput}
                </div>
              </div>

              {/* DELIVERY */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <Cloud size={14} className="text-[#777]" />
                  <span>DELIVERY</span>
                </div>
                <div className="flex-1">
                  <span className="bg-[#1f1f1f] border border-[#2d2d2d] text-[#bbb] text-[11px] font-mono px-2 py-0.5 rounded-[3px]">
                    {metrics.delivery}
                  </span>
                </div>
              </div>

              {/* INPUT MODALITIES */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <ArrowRight size={14} className="text-[#777]" />
                  <span>INPUT MODALITIES</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5">
                  {metrics.inputModalities.map((mod) => (
                    <span
                      key={mod}
                      className="bg-[#1f1f1f] border border-[#2d2d2d] text-[#bbb] text-[11px] font-mono px-2 py-0.5 rounded-[3px]"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>

              {/* OUTPUT MODALITIES */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <ArrowRightFromLine size={14} className="text-[#777]" />
                  <span>OUTPUT MODALITIES</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5">
                  {metrics.outputModalities.map((mod) => (
                    <span
                      key={mod}
                      className="bg-[#1f1f1f] border border-[#2d2d2d] text-[#bbb] text-[11px] font-mono px-2 py-0.5 rounded-[3px]"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>

              {/* JSON MODE */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <span className="font-mono text-[#777] text-[12px]">{"{ }"}</span>
                  <span>JSON MODE</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 text-[12.5px] font-medium text-[#75bf00]">
                  <Check size={13} />
                  <span>Supported</span>
                </div>
              </div>

              {/* STREAMING */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <Radio size={14} className="text-[#777]" />
                  <span>STREAMING</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 text-[12.5px] font-medium text-[#75bf00]">
                  <Check size={13} />
                  <span>Supported</span>
                </div>
              </div>

              {/* TOOL CALLING */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <Wrench size={14} className="text-[#777]" />
                  <span>TOOL CALLING</span>
                </div>
                <div className="flex-1 flex items-center gap-1.5 text-[12.5px] font-medium text-[#75bf00]">
                  <Check size={13} />
                  <span>Supported</span>
                </div>
              </div>

              {/* IMAGE INPUT */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <ImageIcon size={14} className="text-[#777]" />
                  <span>IMAGE INPUT</span>
                </div>
                <div className="flex-1">
                  {metrics.hasImageInput ? (
                    <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#75bf00]">
                      <Check size={13} />
                      <span>Supported</span>
                    </div>
                  ) : (
                    <span className="text-[#666] font-mono text-[12px]">— Not supported</span>
                  )}
                </div>
              </div>

              {/* PREFIX CACHING */}
              <div className="border-t border-dashed border-[#242424] py-3.5 flex items-start justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider pt-0.5">
                  <Database size={14} className="text-[#777]" />
                  <span>PREFIX CACHING</span>
                </div>
                <div className="flex-1 flex flex-col items-start">
                  <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#75bf00]">
                    <Check size={13} />
                    <span>Enabled, hit rate not guaranteed</span>
                  </div>
                  <div className="text-[11px] text-[#777] mt-1">
                    Automatic; savings vary.{" "}
                    <span className="underline underline-offset-2 text-[#aaa] cursor-pointer hover:text-white">
                      Caching details
                    </span>
                  </div>
                </div>
              </div>

              {/* DEFAULT ACCOUNT CONCURRENCY */}
              <div className="border-t border-dashed border-[#242424] py-3.5 flex items-start justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider pt-0.5">
                  <Users size={14} className="text-[#777]" />
                  <span>DEFAULT ACCOUNT CONCURRENCY</span>
                </div>
                <div className="flex-1 flex flex-col items-start">
                  <div className="text-[13px] font-semibold text-white">
                    {metrics.defaultConcurrency}
                  </div>
                  <div className="text-[11px] text-[#777] mt-1">
                    Shared by all keys. More run when the model has spare capacity.
                  </div>
                </div>
              </div>

              {/* SHARED MODEL CONCURRENCY */}
              <div className="border-t border-dashed border-[#242424] py-3 flex items-center justify-between">
                <div className="w-[280px] shrink-0 flex items-center gap-2.5 text-[11px] font-mono text-[#777] uppercase tracking-wider">
                  <Share2 size={14} className="text-[#777]" />
                  <span>SHARED MODEL CONCURRENCY</span>
                </div>
                <div className="flex-1 text-[13px] font-semibold text-white">
                  {metrics.sharedConcurrency}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
