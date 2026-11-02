import React, { useState } from "react";
import NextLink from "next/link";
import { ChevronRight, ChevronDown, Info, Gauge, Box, ArrowRight, CheckCircle2, ChevronUp, Copy, Share2, Link, ExternalLink, MemoryStick, SquareTerminal, Bot, TriangleAlert, Server, Cpu, SlidersHorizontal, Scale, ArrowRightLeft, Leaf, TrendingUp, Boxes, Link2, Layers, Binary, Activity, BarChart2, HardDrive, Calendar, X, Plus } from "lucide-react";
import { QwenLogo, NvidiaLogo } from "@/components/horos/primitives/brand-icons";

export function ResourceCalculatorResult({
  model,
  gpu,
  onBack
}: {
  model: string;
  gpu: string;
  onBack: () => void;
}) {
  const shortGpuName = gpu.replace('NVIDIA ', '').replace(/ \d+(?:\.\d+)? GB/, '').replace('AWS ', '');
  const gbMatch = gpu.match(/(\d+(?:\.\d+)?)\s*GB/);
  const availableGb = gbMatch ? parseFloat((parseFloat(gbMatch[1]) * 0.9).toFixed(1)) : 0;
  const [showConfig, setShowConfig] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [showOptimization, setShowOptimization] = useState(false);
  const [showChartMeaning, setShowChartMeaning] = useState(false);

  return (
    <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] mx-auto border-x border-dashed border-[#333] relative z-10 bg-[#151515] min-h-screen text-[#C8C7BA] font-sans pb-32 pt-24 px-6 lg:px-8">

      {/* Back button */}
      <button onClick={onBack} className="text-[#888] hover:text-[#C8C7BA] flex items-center gap-2 text-[12px] md:text-[13px] lg:text-[14px] mb-12 transition-colors">
        <ArrowRight size={14} className="rotate-180" /> Back to calculator
      </button>

      {/* Header */}
      <div className="flex flex-col gap-4 mb-10">
        <h1 className="text-2xl md:text-3xl lg:text-[32px] md:text-[40px] font-medium tracking-tight text-[#C8C7BA] flex items-center gap-2 flex-wrap leading-tight">
          {model} on
          <span className="relative inline-block ml-1 mt-1">
            <span className="absolute -top-1.5 -left-1.5 w-full h-full bg-[#76b900]"></span>
            <span className="relative bg-[#76b900] text-[#151515] px-2 py-0.5 z-10 block">{shortGpuName}</span>
          </span>
        </h1>
        <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#888]">
          1 GPU, FP16, 50,000 requests/day. 500 input and 500 output tokens per request.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_250px] gap-8 mb-8">
        {/* Estimated Memory Fit Box */}
        <div className="flex flex-col gap-4">
          <div className="border border-dashed border-[#333] p-6 flex flex-col relative overflow-hidden">
            <div className="flex items-start gap-3 mb-4">
              <Info size={16} className="text-[#76b900] mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] md:text-[10px] text-[#76b900] font-medium tracking-wider">ESTIMATED MEMORY FIT</span>
                <h2 className="text-xl md:text-[22px] lg:text-[24px] font-medium text-[#C8C7BA]">Fits in memory, cost withheld.</h2>
                <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#aaa] mt-2 leading-relaxed max-w-[80%]">
                  No measured aggregate serving capacity matches this configuration. Memory fit and dated hourly rates remain available; monthly rent, replica counts, and API comparisons are withheld.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 mt-6 pt-6 border-t border-dashed border-[#333]">
              <div className="flex flex-col gap-1 border-r border-dashed border-[#333]">
                <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">Memory required</span>
                <span className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">1.3 GB</span>
              </div>
              <div className="flex flex-col gap-1 pl-6">
                <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">Usable GPU memory</span>
                <span className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">{availableGb} GB</span>
              </div>
            </div>
          </div>
          <NextLink href="/model-api-pricing" className="relative inline-block mt-4 ml-1.5 w-fit group cursor-pointer block">
            <div className="absolute -top-1.5 -left-1.5 w-full h-full bg-[#76b900] transition-transform group-hover:translate-x-1 group-hover:translate-y-1"></div>
            <button className="relative bg-[#76b900] text-[#151515] font-medium px-4 py-2 text-[12px] md:text-[13px] lg:text-[14px] flex items-center gap-2 transition-colors z-10 w-fit leading-none">
              See Model APIs pricing <ArrowRight size={16} />
            </button>
          </NextLink>
        </div>

        {/* Right side: Edit inputs */}
        <div className="flex flex-col items-start pt-2">
          <button className="text-[12px] md:text-[13px] lg:text-[14px] text-[#C8C7BA] hover:text-[#C8C7BA] font-medium flex items-center gap-2 transition-colors">
            <span className="text-[9px] md:text-[10px]">▶</span> Edit inputs
          </button>
        </div>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-2 border border-dashed border-[#333] mb-8">
        <div className="p-5 border-r border-dashed border-[#333] flex items-start gap-4">
          <div className="mt-0.5">
            {model.toLowerCase().includes("qwen") ? (
              <QwenLogo size={20} />
            ) : (
              <Box className="text-[#888]" size={20} />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] text-[#888] font-medium tracking-wider mb-1">MODEL</span>
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#C8C7BA]">Qwen/{model}</span>
          </div>
        </div>
        <div className="p-5 flex items-start gap-4">
          <div className="mt-0.5">
            <NvidiaLogo size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] md:text-[10px] text-[#888] font-medium tracking-wider mb-1">HARDWARE</span>
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#C8C7BA]">1 x {gpu}, FP16</span>
          </div>
        </div>
      </div>

      {/* Memory Fit */}
      <div className="border border-dashed border-[#333] flex flex-col mb-8">
        <div className="p-6 border-b border-dashed border-[#333] flex items-start gap-4">
          <MemoryStick size={20} className="text-[#888] mt-1" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base md:text-[17px] lg:text-[18px] font-medium text-[#C8C7BA]">Memory fit</h3>
            <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888]">Weights and KV cache stay separate so the fit is reproducible.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-8 bg-[#1c1c1c]">
          {/* Row 1 */}
          <div className="p-5 md:p-6 border-b border-dashed border-[#333] md:border-r flex flex-col gap-1 md:col-span-2">
            <span className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">1 GB</span>
            <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">Model weights</span>
          </div>
          <div className="p-5 md:p-6 border-b border-dashed border-[#333] md:border-r flex flex-col gap-1 md:col-span-2">
            <span className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">0.1 GB</span>
            <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">KV cache</span>
          </div>
          <div className="p-5 md:p-6 border-b border-dashed border-[#333] md:border-r flex flex-col gap-1 md:col-span-2">
            <span className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">1.3 GB</span>
            <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">Total required</span>
          </div>
          <div className="p-5 md:p-6 border-b border-dashed border-[#333] flex flex-col gap-1 md:col-span-2">
            <span className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">{availableGb} GB</span>
            <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">Usable (90% of {gbMatch?.[1]} GB)</span>
          </div>

          {/* Row 2 */}
          <div className="p-5 md:p-6 md:border-r border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-1 md:col-span-3">
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#C8C7BA]">8,192 tokens</span>
            <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">Served context used</span>
          </div>
          <div className="p-5 md:p-6 md:border-r border-b md:border-b-0 border-dashed border-[#333] flex flex-col gap-1 md:col-span-3">
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#C8C7BA]">0.2 GB</span>
            <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">Runtime overhead</span>
          </div>
          <div className="p-5 md:p-6 flex flex-col gap-1 md:col-span-2">
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#C8C7BA]">Exact transformer shape</span>
            <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">KV cache method</span>
          </div>
        </div>
      </div>

      {/* Decode Bandwidth Ceiling */}
      <div className="border border-dashed border-[#333] flex flex-col mb-12">
        <div className="p-6 border-b border-dashed border-[#333] flex items-start gap-4">
          <Gauge size={20} className="text-[#e2934a] mt-1" />
          <div className="flex flex-col gap-1">
            <h3 className="text-base md:text-[17px] lg:text-[18px] font-medium text-[#C8C7BA]">Decode bandwidth ceiling</h3>
            <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888]">Single-stream physics only. Batched serving capacity is not established.</p>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl md:text-2xl lg:text-[28px] font-medium text-[#C8C7BA]">323 output tok/s</span>
            <span className="text-[9px] md:text-[10px] border border-[#e2934a] text-[#e2934a] px-1.5 py-0.5 rounded-sm tracking-wider font-medium">CEILING</span>
          </div>
          <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888] max-w-[80%]">
            Ceiling, not an expected throughput result.
          </p>
          <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888] mt-2">
            Decode and prefill ceilings derived from GPU memory bandwidth, dense compute, and model parameters, as of 2026-08-08
          </p>
        </div>
      </div>

      {/* Provider price spread */}
      <div className="border border-dashed border-[#333] flex flex-col mb-12">
        <div className="flex flex-col gap-2 p-6 border-b border-dashed border-[#333]">
          <h3 className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">Provider price spread, {gpu}</h3>
          <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888]">Dated GPU-hour rental prices for this hardware. They are not monthly serving totals because throughput evidence is missing.</p>
        </div>

        <div className="flex flex-col gap-4 w-full px-6 py-20 border-b border-dashed border-[#333]">
          <div className="flex items-center gap-4">
            <div className="w-[120px] text-[10px] md:text-[11px] lg:text-[12px] text-[#888] leading-tight">Cheapest: AWS, US East (N. Virginia)</div>
            <div className="h-4 bg-[#76b900] flex-1"></div>
            <div className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] font-medium">$0.526</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-[120px] text-[10px] md:text-[11px] lg:text-[12px] text-[#888] leading-tight">Cheapest: Microsoft Azure, East US 2</div>
            <div className="h-4 bg-[#76b900] flex-1"></div>
            <div className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] font-medium">$0.526</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-6 border-b border-dashed border-[#333]">
          <span className="text-[9px] md:text-[10px] lg:text-[11px] font-medium text-[#C8C7BA]">Source:</span>
          <a href="https://pricing.us-east-1.amazonaws.com/offers/v1.0/aws/AmazonEC2/20260806171752/us-east-1/index.csv" target="_blank" rel="noopener noreferrer" className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888] hover:text-[#aaa] cursor-pointer underline decoration-[#444] underline-offset-4 w-fit">
            AWS, US East (N. Virginia), on demand, captured 2026-09-27
          </a>
          <a href="https://prices.azure.com/api/retail/prices?currencyCode=%27USD%27&$filter=serviceName%20eq%20%27Virtual%20Machines%27%20and%20armRegionName%20eq%20%27eastus2%27%20and%20armSkuName%20eq%20%27Standard_NC4as_T4_v3%27%20and%20productName%20eq%20%27Virtual%20Machines%20NCasT4%20v3%20Series%27%20and%20skuName%20eq%20%27NC4as%20T4%20v3%27%20and%20priceType%20eq%20%27Consumption%27" target="_blank" rel="noopener noreferrer" className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888] hover:text-[#aaa] cursor-pointer underline decoration-[#444] underline-offset-4 w-fit">
            Microsoft Azure, East US 2, on demand, captured 2026-09-27
          </a>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <button
            onClick={() => setShowChartMeaning(!showChartMeaning)}
            className="text-[13px] md:text-[14px] lg:text-[15px] text-[#C8C7BA] font-medium flex items-center gap-2 hover:text-[#C8C7BA] transition-colors w-fit"
          >
            <Plus
              size={16}
              strokeWidth={4}
              className={`text-[#76b900] transition-transform duration-300 ease-in-out ${showChartMeaning ? 'rotate-45' : 'rotate-0'}`}
            />
            What this chart means
          </button>

          {showChartMeaning && (
            <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#C8C7BA] max-w-2xl pl-6">
              These are GPU-hour rental prices only. A monthly serving total requires throughput evidence and remains absent.
            </p>
          )}
        </div>
      </div>

      {/* vLLM deployment starting point */}
      <div className="border border-dashed border-[#333] flex flex-col mb-12">
        <div className="p-6 border-b border-dashed border-[#333] flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="text-[#888] mt-1"><SquareTerminal size={16} /></div>
            <div className="flex flex-col gap-1">
              <h3 className="text-[14px] md:text-[15px] lg:text-[16px] font-medium text-[#C8C7BA]">vLLM deployment starting point</h3>
              <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888]">This line starts the selected vLLM shape. It is not a throughput reproduction claim.</p>
            </div>
          </div>
          <button className="text-[10px] md:text-[11px] lg:text-[12px] text-[#888] border border-dashed border-[#333] bg-transparent rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-[#222] transition-colors shrink-0">
            <Copy size={12} /> Copy command
          </button>
        </div>

        <div className="p-6 overflow-x-auto bg-[#0a0a0a]">
          <code className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] whitespace-nowrap font-mono">
            vllm serve 'Qwen/{model}' --dtype float16 --tensor-parallel-size 1 --max-model-len 8192 --gpu-memory-utilization 0.9
          </code>
        </div>
      </div>

      <div className="border border-dashed border-[#333] mb-12 p-4 flex flex-col gap-4">
        <button
          onClick={() => setShowOptimization(!showOptimization)}
          className="text-[12px] md:text-[13px] lg:text-[14px] text-[#888] hover:text-[#C8C7BA] font-medium flex items-center gap-2 transition-colors w-fit"
        >
          <span className="text-[9px] md:text-[10px]">{showOptimization ? '▼' : '▶'}</span> Optimization evidence
        </button>

        {showOptimization && (
          <div className="border border-dashed border-[#333] p-6 flex flex-col gap-2 bg-[#111111]">
            <div className="flex items-center gap-3">
              <Activity size={20} className="text-[#888]" />
              <h4 className="text-base md:text-[17px] lg:text-[18px] font-medium text-[#C8C7BA]">Not measured on this config yet</h4>
            </div>
            <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#d1ad75] pl-8">
              No site-wide multiplier is applied.
            </p>
          </div>
        )}
      </div>

      {/* Sources and caveats */}
      <div className="border border-dashed border-[#333] mb-24 bg-[#111111]">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <HardDrive size={20} className="text-[#888]" />
            <div className="flex flex-col gap-1">
              <h3 className="text-base md:text-[17px] lg:text-[18px] font-medium text-[#C8C7BA]">Sources and caveats</h3>
              <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888]">12 sources, 6 caveats</p>
            </div>
          </div>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="text-[10px] md:text-[11px] lg:text-[12px] text-[#C8C7BA] border border-[#333] rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-[#222] transition-colors shrink-0"
          >
            {showEvidence ? 'Hide evidence' : 'Show evidence'} {showEvidence ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showEvidence && (
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-dashed border-[#333]">
            {/* Provenance */}
            <div className="p-8 border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col gap-6">
              <h4 className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#C8C7BA]">Provenance</h4>
              <div className="flex flex-col gap-5">
                {[
                  { title: "Hugging Face model API revision sha", url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/commit/7ae557604adf67be50417f59c2c2f167def9a775" },
                  { title: "Hugging Face model API safetensors.total", url: "#" },
                  { title: "config.json:max_position_embeddings", url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/7ae557604adf67be50417f59c2c2f167def9a775/config.json" },
                  { title: "config.json:architectures[0]", url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/7ae557604adf67be50417f59c2c2f167def9a775/config.json" },
                  { title: "NVIDIA T4 product specification", url: "https://www.nvidia.com/en-us/data-center/tesla-t4/" },
                  { title: "Hugging Face config.json transformer shape", url: "https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct/blob/7ae557604adf67be50417f59c2c2f167def9a775/config.json" },
                  { title: "HOROS Engine feasibility runtime-overhead policy", url: "#" },
                  { title: "Decode and prefill ceilings derived from GPU memory bandwidth, dense compute, and model parameters", url: "https://www.nvidia.com/en-us/data-center/tesla-t4/" },
                  { title: "vLLM serve CLI documentation", url: "https://docs.vllm.ai/en/latest/cli/serve/" },
                  { title: "NVIDIA L4 product specification", url: "https://www.nvidia.com/en-us/data-center/l4/" },
                  { title: "NVIDIA A10 datasheet", url: "https://www.nvidia.com/content/dam/en-zz/Solutions/Data-Center/a10/pdf/a10-datasheet.pdf" },
                  { title: "NVIDIA L40S product specification", url: "https://www.nvidia.com/en-us/data-center/l40s/" }
                ].map((source, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <a href={source.url} target={source.url !== "#" ? "_blank" : undefined} rel={source.url !== "#" ? "noopener noreferrer" : undefined} className="text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] underline decoration-[#C8C7BA] underline-offset-4 w-fit">{source.title}</a>
                    <div className="flex items-center gap-1.5 text-[10px] md:text-[11px] lg:text-[12px] text-[#888]">
                      <Calendar size={12} className="text-[#888]" /> As of {i === 6 ? '2026-09-28' : '2026-09-27'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caveats */}
            <div className="p-8 flex flex-col gap-6">
              <h4 className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-[#C8C7BA]">Caveats</h4>
              <div className="flex flex-col gap-5">
                {[
                  "Served context is 8192 tokens. It is a serving-capacity decision and is not inferred from average input or output tokens.",
                  "KV cache uses the exact transformer-shape formula with 24 layers, 2 KV heads, and head dimension 64.",
                  "Runtime overhead adds 0.2 GB to the total memory requirement. This approximate 15% policy allowance covers CUDA context, activations, and vLLM overhead. Deployment-time profiling, including CUDA graph capture and allocator behavior, can differ.",
                  "Single-stream physics ceiling, not batched serving capacity. Batching changes aggregate throughput, so this concurrency-1 model cannot establish a minimum replica count or monthly rent. A measured serving benchmark matching the workload is required.",
                  "Compute prefill ceiling: 65,785 tokens/sec. Bandwidth decode ceiling: 323 tokens/sec.",
                  "the workload settings has no GPU provider selector. The calculation uses the lowest supplied on-demand rate for T4: AWS, US East (N. Virginia) at $0.526/GPU-hour."
                ].map((caveat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-[#76b900] text-[11px] md:text-[12px] lg:text-[13px] leading-tight font-mono">+</span>
                    <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888] leading-relaxed -mt-0.5">{caveat}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Share section */}
      <div className="border border-dashed border-[#333] grid grid-cols-1 md:grid-cols-2 mb-24">
        {/* Left Column */}
        <div className="border-b md:border-b-0 md:border-r border-dashed border-[#333] flex flex-col">
          <div className="p-8 flex flex-col gap-6">
            <button className="border border-dashed border-[#333] px-4 py-2 rounded-sm flex items-center gap-2 text-[11px] md:text-[12px] lg:text-[13px] text-[#C8C7BA] hover:bg-[#222] w-fit bg-transparent">
              <Copy size={14} /> Copy link
            </button>

            <div className="flex flex-col gap-2 mt-2">
              <div className="flex items-start gap-3">
                <TriangleAlert size={20} className="text-[#888] shrink-0 mt-0.5" />
                <h3 className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">Share this calculation</h3>
              </div>
              <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#888] pl-[32px]">
                Embed code appears only when the calculator can publish a sourced cost for a fitting configuration.
              </p>
            </div>

            <div className="mt-4 bg-[#262625] border border-dashed border-[#333] p-4 flex flex-col gap-2">
              <button
                onClick={() => setShowBadge(!showBadge)}
                className="text-[12px] md:text-[13px] lg:text-[14px] text-[#C8C7BA] font-medium flex items-center gap-2 hover:text-[#C8C7BA] transition-colors w-fit"
              >
                <span className="text-[9px] md:text-[10px]">{showBadge ? '▼' : '▶'}</span> Badge unavailable for this configuration
              </button>
              {showBadge && (
                <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#888] leading-relaxed mt-1">
                  The calculator does not have a complete throughput source for this workload, so it withheld the cost and does not generate embed code.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col">
          <div className="p-8 border-b border-dashed border-[#333] flex flex-col gap-2">
            <div className="flex items-start gap-3">
              <Bot size={20} className="text-[#888] shrink-0 mt-1" />
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-[19px] lg:text-[20px] font-medium text-[#C8C7BA]">Use it from an agent or script</h3>
                <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#888]">
                  GET the current inputs, or inspect the descriptor for accepted parameters and response fields.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 border-b border-dashed border-[#333] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[9px] md:text-[10px] lg:text-[11px] font-medium text-[#888] uppercase tracking-wider">Endpoint</span>
              <button className="border border-dashed border-[#333] px-3 py-1.5 rounded-sm flex items-center gap-2 text-[10px] md:text-[11px] lg:text-[12px] text-[#C8C7BA] hover:bg-[#222] bg-transparent">
                <Copy size={14} /> Copy API request
              </button>
            </div>
            <div className="text-[12px] md:text-[13px] lg:text-[14px] font-mono">
              <span className="text-[#C8C7BA]">GET </span>
              <span className="text-[#C8C7BA]">https://horos.com/api/calc</span>
            </div>
            <div className="text-[11px] md:text-[12px] lg:text-[13px] font-mono text-[#888] break-all leading-relaxed">
              https://horos.com/api/calc?hfId=Qwen%2FQwen2.5-0.5B-Instruct&amp;gpuId=T4&amp;gpuCount=1&amp;requestsPerDay=50000&amp;avgInputTokens=500&amp;avgOutputTokens=500&amp;utilization=0.3&amp;quantization=fp16&amp;servedContextTokens=8192
            </div>
          </div>

          <div className="p-8 border-b border-dashed border-[#333] flex flex-col gap-4">
            <span className="text-[9px] md:text-[10px] lg:text-[11px] font-medium text-[#888] uppercase tracking-wider">Canonical result</span>
            <div className="flex items-start justify-between gap-4 group cursor-pointer">
              <span className="text-[12px] md:text-[13px] lg:text-[14px] font-mono text-[#C8C7BA] group-hover:text-[#C8C7BA] transition-colors break-all">
                https://horos.com/calc/qwen-2.5-0.5b/t4/50k-req-day
              </span>
              <ExternalLink size={16} className="text-[#888] group-hover:text-[#C8C7BA] transition-colors shrink-0 mt-0.5" />
            </div>
          </div>

          <div className="p-8 flex flex-col gap-4">
            <span className="text-[9px] md:text-[10px] lg:text-[11px] font-medium text-[#888] uppercase tracking-wider">Descriptor</span>
            <div className="flex items-start justify-between gap-4 group cursor-pointer">
              <span className="text-[12px] md:text-[13px] lg:text-[14px] font-mono text-[#C8C7BA] group-hover:text-[#C8C7BA] transition-colors break-all">
                https://horos.com/api/calc/schema
              </span>
              <ExternalLink size={16} className="text-[#888] group-hover:text-[#C8C7BA] transition-colors shrink-0 mt-0.5" />
            </div>
            <div className="text-[11px] md:text-[12px] lg:text-[13px] text-[#888]">
              28 GPU ids, 7 quantizations
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 pt-8">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-[12px] md:text-[13px] lg:text-[14px] text-[#888] font-medium flex items-center gap-2 hover:text-[#C8C7BA] transition-colors"
        >
          <span className="text-[9px] md:text-[10px]">{showConfig ? '▼' : '▶'}</span> Configuration details
        </button>

        {showConfig && (
          <div className="mt-4 border border-dashed border-[#333] bg-[#1a1a1a] grid grid-cols-1 md:grid-cols-2">
            <div className="p-6 border-b md:border-b border-dashed border-[#333] md:border-r">
              <div className="flex flex-col gap-1">
                <Box className="text-[#888] mb-1" size={16} />
                <span className="text-[#888] text-[9px] md:text-[10px] lg:text-[11px] font-medium tracking-wider uppercase">Model</span>
                <span className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium">Qwen/{model}</span>
              </div>
            </div>
            <div className="p-6 border-b border-dashed border-[#333]">
              <div className="flex flex-col gap-1">
                <Boxes className="text-[#888] mb-1" size={16} />
                <span className="text-[#888] text-[9px] md:text-[10px] lg:text-[11px] font-medium tracking-wider uppercase">GPU</span>
                <span className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium">{gpu}</span>
              </div>
            </div>

            <div className="p-6 border-b border-dashed border-[#333] md:border-r">
              <div className="flex flex-col gap-1">
                <Link2 className="text-[#888] mb-1" size={16} />
                <span className="text-[#888] text-[9px] md:text-[10px] lg:text-[11px] font-medium tracking-wider uppercase">Requests / Day</span>
                <span className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium">50,000</span>
              </div>
            </div>
            <div className="p-6 border-b border-dashed border-[#333]">
              <div className="flex flex-col gap-1">
                <Layers className="text-[#888] mb-1" size={16} />
                <span className="text-[#888] text-[9px] md:text-[10px] lg:text-[11px] font-medium tracking-wider uppercase">GPU Count</span>
                <span className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium">1</span>
              </div>
            </div>

            <div className="p-6 border-b md:border-b-0 border-dashed border-[#333] md:border-r">
              <div className="flex flex-col gap-1">
                <Binary className="text-[#888] mb-1" size={16} />
                <span className="text-[#888] text-[9px] md:text-[10px] lg:text-[11px] font-medium tracking-wider uppercase">Quantization</span>
                <span className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium">FP16</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex flex-col gap-1">
                <Activity className="text-[#888] mb-1" size={16} />
                <span className="text-[#888] text-[9px] md:text-[10px] lg:text-[11px] font-medium tracking-wider uppercase">Tokens/Request</span>
                <span className="text-[#C8C7BA] text-[12px] md:text-[13px] lg:text-[14px] font-medium">500 in, 500 out</span>
              </div>
            </div>
          </div>
        )}

        {showConfig && (
          <div className="mt-8 flex items-center gap-4">
            <button className="flex items-center gap-2 border border-[#333] rounded-sm px-3 py-1.5 hover:bg-[#1a1a1a]">
              <BarChart2 size={14} className="text-[#76b900]" />
              <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#C8C7BA]">Charts use cited evidence</span>
            </button>
            <button className="flex items-center gap-2 border border-[#333] rounded-sm px-3 py-1.5 hover:bg-[#1a1a1a]">
              <Gauge size={14} className="text-[#76b900]" />
              <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#C8C7BA]">Utilization defaults to 30%</span>
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
