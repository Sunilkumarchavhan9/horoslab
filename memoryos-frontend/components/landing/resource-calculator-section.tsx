"use client";

import React, { useState, useRef, useEffect } from "react";
import { Calculator, Gauge, ChevronDown, ChevronRight, Cpu, RefreshCw, BarChart2, Shield, Download, Heart, ExternalLink, X, Plus } from "lucide-react";
import { HuggingFaceLogo, HorosLogo, QwenLogo, OpenAILogo, MetaLogo, MistralLogo, AnthropicLogo, GoogleLogo, MicrosoftLogo, DeepSeekLogo, NvidiaLogo, BAAILogo } from "@/components/horos/primitives/brand-icons";
import { useRouter } from "next/navigation";

function getModelBrandLogo(modelId: string) {
  if (!modelId) return HuggingFaceLogo;
  const id = modelId.toLowerCase();
  if (id.includes("qwen")) return QwenLogo;
  if (id.includes("llama") || id.includes("meta")) return MetaLogo;
  if (id.includes("mistral") || id.includes("mixtral")) return MistralLogo;
  if (id.includes("gpt") || id.includes("openai")) return OpenAILogo;
  if (id.includes("claude") || id.includes("anthropic")) return AnthropicLogo;
  if (id.includes("gemma") || id.includes("google")) return GoogleLogo;
  if (id.includes("microsoft") || id.includes("phi")) return MicrosoftLogo;
  if (id.includes("deepseek")) return DeepSeekLogo;
  if (id.includes("nvidia")) return NvidiaLogo;
  if (id.includes("bge") || id.includes("baai")) return BAAILogo;
  return HuggingFaceLogo;
}

function CustomDropdown({ value, onChange, options, icon: Icon }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#151515] border ${isOpen ? 'border-solid border-[#76b900]' : 'border-dashed border-[#333]'} rounded-[2px] py-2.5 ${Icon ? 'pl-9' : 'pl-3'} pr-10 text-[13px] text-[#F0EFE2] flex items-center justify-between focus:outline-none transition-colors text-left`}
      >
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={14} className="text-[#666]" />
          </div>
        )}
        <span className="truncate">{value}</span>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={14} className="text-[#666]" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-[#151515] border border-[#333] rounded-[2px] z-50 max-h-[300px] overflow-y-auto shadow-2xl py-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#444 #151515' }}>
          {options.map((option: string) => (
            <div
              key={option}
              onClick={() => { onChange(option); setIsOpen(false); }}
              className="px-3 py-2 text-[13px] cursor-pointer hover:bg-[#94C1F6] hover:text-[#151515] text-[#F0EFE2] transition-colors"
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModelDropdown({ value, onChange }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [models, setModels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchModels = async () => {
      setIsLoading(true);
      try {
        const query = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        const res = await fetch(`https://huggingface.co/api/models?limit=20&sort=downloads&direction=-1${query}`);
        const data = await res.json();
        
        const formattedModels = data.map((m: any) => ({
          name: m.id,
          desc: [m.library_name, m.pipeline_tag].filter(Boolean).join(", ") || "model",
          downloads: m.downloads >= 1000000 ? (m.downloads / 1000000).toFixed(1) + 'M' : m.downloads >= 1000 ? (m.downloads / 1000).toFixed(1) + 'K' : (m.downloads || 0).toString(),
          likes: m.likes >= 1000000 ? (m.likes / 1000000).toFixed(1) + 'M' : m.likes >= 1000 ? (m.likes / 1000).toFixed(1) + 'K' : (m.likes || 0).toString(),
        }));
        setModels(formattedModels);
      } catch (error) {
        console.error("Failed to fetch models", error);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(() => {
      if (isOpen) fetchModels();
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, isOpen]);

  const SelectedLogo = getModelBrandLogo(value);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-[#151515] border ${isOpen ? 'border-solid border-[#76b900]' : 'border-dashed border-[#333]'} rounded-[2px] py-2.5 pl-9 pr-10 text-[13px] text-[#F0EFE2] flex items-center justify-between focus:outline-none transition-colors text-left`}
      >
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <SelectedLogo size={14} />
        </div>
        <span className="truncate font-medium">{value}</span>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown size={14} className="text-[#666]" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 w-[480px] bg-[#151515] border border-[#333] rounded-[2px] z-50 shadow-2xl flex flex-col">
          <div className="p-3 border-b border-[#333]">
            <div className="relative flex items-center">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <HuggingFaceLogo size={14} />
               </div>
               <input 
                 autoFocus
                 type="text" 
                 placeholder="Search Hugging Face models or paste a repo id..."
                 className="w-full bg-[#202020] border border-[#333] rounded-[2px] py-2.5 pl-9 pr-3 text-[13px] text-[#F0EFE2] focus:outline-none focus:border-[#555]"
                 value={searchQuery}
                 onChange={e => setSearchQuery(e.target.value)}
               />
            </div>
          </div>
          
          <div className="p-3">
             <div className="text-[11px] font-bold text-[#888] flex items-center gap-1.5 mb-2 uppercase tracking-wider">
               <HuggingFaceLogo size={12} /> {searchQuery ? 'Search Results' : 'Popular on HuggingFace'} <span className="text-[#555] font-normal lowercase tracking-normal">{models.length}</span>
               {isLoading && <RefreshCw size={10} className="animate-spin text-[#666] ml-2" />}
             </div>
             <div className="max-h-[300px] overflow-y-auto flex flex-col gap-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#444 #151515' }}>
               {models.map(model => {
                 const BrandLogo = getModelBrandLogo(model.name);
                 return (
                 <div
                   key={model.name}
                   onClick={() => { onChange(model.name); setIsOpen(false); }}
                   className="flex items-center justify-between p-2 rounded-[2px] cursor-pointer hover:bg-[#202020] transition-colors"
                 >
                   <div className="flex items-start gap-3 overflow-hidden">
                     <BrandLogo size={18} className="mt-0.5 shrink-0" />
                     <div className="flex flex-col overflow-hidden">
                       <span className="text-[13px] font-bold text-[#F0EFE2] truncate">{model.name}</span>
                       <span className="text-[11px] text-[#888] truncate">{model.desc}</span>
                     </div>
                   </div>
                   <div className="flex items-center gap-2 shrink-0 ml-4">
                     <div className="flex items-center gap-1 text-[#888] border border-[#333] rounded-[2px] px-1.5 py-0.5 text-[10px]">
                       <Download size={10} /> {model.downloads}
                     </div>
                     <div className="flex items-center gap-1 text-[#888] border border-[#333] rounded-[2px] px-1.5 py-0.5 text-[10px]">
                       <Heart size={10} /> {model.likes}
                     </div>
                     <ExternalLink size={12} className="text-[#666] hover:text-[#ccc]" />
                   </div>
                 </div>
               )})}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

const GPU_OPTIONS = [
  "NVIDIA T4 16 GB", "NVIDIA L4 24 GB", "AWS NVIDIA A10G 24 GB", "NVIDIA L40S 48 GB",
  "NVIDIA A100 SXM 40 GB", "NVIDIA A100 SXM 80 GB", "NVIDIA H100 SXM 80 GB",
  "NVIDIA H200 141 GB", "NVIDIA B200 180 GB", "NVIDIA B300", "NVIDIA H100 PCIe 80 GB",
  "NVIDIA H100 NVL 94 GB", "NVIDIA A100 PCIe 40 GB", "NVIDIA A100 PCIe 80 GB",
  "NVIDIA A10 24 GB", "NVIDIA A40 48 GB", "NVIDIA L40 48 GB", "NVIDIA RTX A4000 16 GB",
  "NVIDIA RTX A5000 24 GB", "NVIDIA RTX A6000 48 GB", "NVIDIA RTX 4000 Ada 20 GB",
  "NVIDIA RTX 6000 Ada 48 GB", "NVIDIA GeForce RTX 4090 24 GB", "NVIDIA GeForce RTX 5090 32 GB",
  "NVIDIA RTX PRO 6000 Blackwell Server Edition 96 GB", "AMD Instinct MI300X",
  "AMD Instinct MI325X", "AMD Instinct MI355X"
];

const QUANT_OPTIONS = ["Choose a format", "FP16", "BF16", "FP8", "INT8", "INT4", "NVFP4", "MXFP4"];

export function ResourceCalculatorSection() {
  const router = useRouter();
  const [activeUtilization, setActiveUtilization] = useState("30%");
  const [activeModel, setActiveModel] = useState("Qwen/Qwen2.5-1.5B-Instruct");
  const [activeGpu, setActiveGpu] = useState("NVIDIA A100 SXM 80 GB");
  const [activeQuant, setActiveQuant] = useState("Choose a format");
  const [activeGpuCount, setActiveGpuCount] = useState("1");
  const [activeRequests, setActiveRequests] = useState("10000");
  const [activeInput, setActiveInput] = useState("512");
  const [activeOutput, setActiveOutput] = useState("128");
  const [activeContext, setActiveContext] = useState("8192");

  const handleCalculate = () => {
    const params = new URLSearchParams({
      model: activeModel,
      gpu: activeGpu,
      requests: activeRequests,
      quant: activeQuant,
      util: activeUtilization,
      input: activeInput,
      output: activeOutput,
      units: activeGpuCount,
      context: activeContext,
    });
    router.push(`/economics/calc?${params.toString()}`);
  };

  return (
    <section id="economics-cost" className="w-full relative z-10 text-sans">
      
      {/* Static Header - Inside Constrained Container */}
      <div className="w-[88%] md:w-[calc(64%_-_240px)] mx-auto border-x border-dashed border-[#333] relative z-10 bg-[#151515]">
        <div className="px-6 lg:px-8 py-16 md:py-24">
          <div className="flex flex-col lg:flex-row justify-between gap-12 lg:gap-8">
            <div className="flex flex-col max-w-xl">
              <h2 className="text-4xl md:text-5xl font-semibold text-[#F0EFE2] tracking-tight leading-tight mb-6">
                See what your model actually <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-[2px] leading-none inline-block">costs</span> to serve.
              </h2>
              <p className="text-[14px] md:text-[15px] text-[#ccc] leading-relaxed">
                Start with a Hugging Face model, GPU, and real traffic shape. The result keeps fit, utilization, idle capacity, provider dates, and every caveat visible.
              </p>
            </div>
            
            <div className="grid grid-cols-2 border border-dashed border-[#333] w-full lg:w-[420px] shrink-0 bg-[#151515]">
              <div className="p-5 flex flex-col gap-3 border-r border-b border-dashed border-[#333]">
                <Cpu size={16} className="text-[#888]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#888] font-bold tracking-wider mb-1">FIRST</span>
                  <span className="text-[13px] text-[#F0EFE2] font-medium">Check memory fit</span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3 border-b border-dashed border-[#333]">
                <Gauge size={16} className="text-[#888]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#888] font-bold tracking-wider mb-1">THEN</span>
                  <span className="text-[13px] text-[#F0EFE2] font-medium">Price real utilization</span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3 border-r border-dashed border-[#333]">
                <BarChart2 size={16} className="text-[#888]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#888] font-bold tracking-wider mb-1">COMPARE</span>
                  <span className="text-[13px] text-[#F0EFE2] font-medium">API and GPU economics</span>
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <Shield size={16} className="text-[#888]" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#888] font-bold tracking-wider mb-1">TRUST</span>
                  <span className="text-[13px] text-[#F0EFE2] font-medium">Keep the honest loss</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-width Divider & Logo between Header and Form */}
      <div className="w-full relative z-20">
        <div className="absolute left-0 right-0 top-0 border-t border-dashed border-[#333]" />
        
        {/* Crosses at intersections */}
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
        <div className="hidden md:block absolute left-[calc(14%_+_120px)] lg:left-[calc(18%_+_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>
        <div className="hidden md:block absolute left-[calc(86%_-_120px)] lg:left-[calc(82%_-_120px)] text-[#F0CC94] font-mono text-[10px] leading-none transform -translate-x-[45%] -translate-y-[52%]">+</div>

        {/* Center Logo Divider on the horizontal line */}
        <div className="absolute left-1/2 top-0 -translate-y-1/2 -translate-x-1/2 z-20 bg-[#151515] p-2 hidden md:block">
          <HorosLogo variant="icon" size="sm" className="w-5 h-auto text-[#F0EFE2]" />
        </div>
      </div>

      <div className="w-[88%] lg:w-[calc(64%_-_240px)] mx-auto border-x border-dashed border-[#333] relative z-10 bg-[#151515]">
        
        {/* Main Calculator Area */}
        <div className="px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8">
            
            {/* Left Panel: Configure Workload */}
            <div className="border border-dashed border-[#333] flex flex-col bg-[#151515]">
              <div className="p-6 md:p-8 border-b border-dashed border-[#333]">
                <div className="flex items-start gap-3">
                  <Calculator size={18} className="text-[#76b900] mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-medium text-[#F0EFE2]">Configure the workload</h3>
                    <p className="text-[12px] text-[#777]">Every field becomes part of the shareable result URL.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 flex flex-col gap-6 md:gap-8 text-[13px]">
                
                {/* Row 1: Hugging Face model */}
                <div className="flex flex-col gap-3 relative z-30">
                  <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                    <HuggingFaceLogo size={12} className="text-[#FFD21E]" /> Hugging Face model
                  </label>
                  <ModelDropdown value={activeModel} onChange={setActiveModel} />
                </div>

                {/* Row 2: GPU and GPU count */}
                <div className="grid grid-cols-2 gap-6 relative z-20">
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                      <Cpu size={12} /> GPU
                    </label>
                    <CustomDropdown value={activeGpu} onChange={setActiveGpu} options={GPU_OPTIONS} />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                      <Cpu size={12} /> GPU count
                    </label>
                    <input type="text" value={activeGpuCount} onChange={(e) => setActiveGpuCount(e.target.value)} className="w-full bg-[#151515] border border-dashed border-[#333] rounded-[2px] py-2.5 px-3 text-[13px] text-[#F0EFE2] focus:outline-none focus:border-solid focus:border-[#76b900] transition-colors" />
                  </div>
                </div>

                {/* Row 3: Requests per day and Quantization */}
                <div className="grid grid-cols-2 gap-6 relative z-10">
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                      <RefreshCw size={12} /> Requests per day
                    </label>
                    <input type="text" value={activeRequests} onChange={(e) => setActiveRequests(e.target.value)} className="w-full bg-[#151515] border border-dashed border-[#333] rounded-[2px] py-2.5 px-3 text-[13px] text-[#F0EFE2] focus:outline-none focus:border-solid focus:border-[#76b900] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                      <BarChart2 size={12} /> Quantization
                    </label>
                    <CustomDropdown value={activeQuant} onChange={setActiveQuant} options={QUANT_OPTIONS} />
                  </div>
                </div>

                {/* Row 4: Average Input/Output tokens */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                      <span className="text-[10px]">↓</span> Average input tokens
                    </label>
                    <input type="text" value={activeInput} onChange={(e) => setActiveInput(e.target.value)} className="w-full bg-[#151515] border border-dashed border-[#333] rounded-[2px] py-2.5 px-3 text-[13px] text-[#F0EFE2] focus:outline-none focus:border-solid focus:border-[#76b900] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                      <span className="text-[10px]">↑</span> Average output tokens
                    </label>
                    <input type="text" value={activeOutput} onChange={(e) => setActiveOutput(e.target.value)} className="w-full bg-[#151515] border border-dashed border-[#333] rounded-[2px] py-2.5 px-3 text-[13px] text-[#F0EFE2] focus:outline-none focus:border-solid focus:border-[#76b900] transition-colors" />
                  </div>
                </div>

                {/* Row 5: Maximum served context */}
                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-semibold text-[#ccc] flex items-center gap-1.5">
                    <span className="text-[10px]">↗</span> Maximum served context
                  </label>
                  <input type="text" value={activeContext} onChange={(e) => setActiveContext(e.target.value)} className="w-full bg-[#151515] border border-dashed border-[#333] rounded-[2px] py-2.5 px-3 text-[13px] text-[#F0EFE2] focus:outline-none focus:border-solid focus:border-[#76b900] transition-colors" />
                  <p className="text-[10px] text-[#777] leading-tight">Maximum combined prompt and generated tokens accepted by the server. This is capacity, not average request length.</p>
                </div>
              </div>
              
              <div className="p-6 md:p-8 border-t border-dashed border-[#333]">
                <button onClick={handleCalculate} className="group bg-[#76b900] hover:bg-[#86dc00] text-black font-semibold text-[13px] px-4 py-2.5 flex items-center gap-2 transition-colors rounded-[2px] w-fit">
                  <Calculator size={14} /> Calculate this config <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
                </button>
              </div>
            </div>

            {/* Right Panel: Utilization */}
            <div className="border border-dashed border-[#333] flex flex-col h-fit bg-[#151515]">
              <div className="p-6 md:p-8 border-b border-dashed border-[#333]">
                <div className="flex items-start gap-3">
                  <Gauge size={18} className="text-[#76b900] mt-0.5" />
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[16px] font-medium text-[#F0EFE2]">Utilization assumption</h3>
                    <p className="text-[12px] text-[#777]">The honest default is 30%, not a sales-friendly 90%.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 md:p-8 flex flex-col gap-8">
                <p className="text-[13px] text-[#ccc] leading-relaxed">
                  Derived utilization and idle share appear only after the engine has a throughput source. They are never shown as zero or as empty numeric placeholders.
                </p>
                
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[12px] text-[#ccc] font-medium">Utilization assumption</span>
                    <span className="text-[28px] text-[#F0EFE2] font-semibold leading-none">{activeUtilization}</span>
                  </div>
                  
                  <div className="grid grid-cols-4 border border-dashed border-[#333] rounded-[2px] overflow-hidden">
                    {["10%", "30%", "60%", "90%"].map((percent) => (
                      <button
                        key={percent}
                        onClick={() => setActiveUtilization(percent)}
                        className={`py-2.5 text-[12px] font-medium transition-colors ${
                          activeUtilization === percent
                            ? "bg-[#76b900] text-black"
                            : "text-[#888] hover:text-[#ccc] border-l border-dashed border-[#333] first:border-l-0"
                        }`}
                      >
                        {percent}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <p className="text-[12px] text-[#888] leading-relaxed">
                    A steady production service with real peaks and troughs.
                  </p>
                  <p className="text-[12px] text-[#888] leading-relaxed">
                    At this level about <span className="text-[#ccc] font-semibold">70%</span> of every rented GPU hour sits idle, and it is billed at the same rate as a busy one.
                  </p>
                </div>
              </div>
            </div>

          </div>
          <BrowseResultsAccordion />
        </div>

      </div>
      <div className="w-full border-b border-dashed border-[#333]"></div>
    </section>
  );
}



const BROWSE_MODELS = [
  "Qwen2.5-0.5B-Instruct",
  "Qwen2.5-7B-Instruct",
  "Qwen2.5-14B-Instruct",
  "Qwen2.5-32B-Instruct",
  "Mistral-7B-Instruct-v0.3",
  "Phi-3.5-mini-instruct",
  "Qwen3-30B-A3B-Instruct-2507",
  "Mixtral-8x7B-Instruct-v0.1",
  "Llama-3.1-8B-Instruct",
  "Llama-3.3-70B-Instruct",
  "gemma-2-9b-it"
];

const GPU_RESULTS = [
  { name: "NVIDIA T4 16 GB", avail: 14.4 },
  { name: "NVIDIA L4 24 GB", avail: 21.6 },
  { name: "AWS NVIDIA A10G 24 GB", avail: 21.6 },
  { name: "NVIDIA L40S 48 GB", avail: 43.2 },
  { name: "NVIDIA A100 SXM 40 GB", avail: 36.0 },
  { name: "NVIDIA A100 SXM 80 GB", avail: 72.0 },
  { name: "NVIDIA H100 SXM 80 GB", avail: 72.0 },
  { name: "NVIDIA H200 141 GB", avail: 126.9 },
  { name: "NVIDIA B200 180 GB", avail: 162.0 },
  { name: "NVIDIA B300", avail: 72.0 },
  { name: "NVIDIA H100 PCIe 80 GB", avail: 72.0 },
  { name: "NVIDIA H100 NVL 94 GB", avail: 84.6 },
  { name: "NVIDIA A100 PCIe 40 GB", avail: 36.0 },
  { name: "NVIDIA A100 PCIe 80 GB", avail: 72.0 },
  { name: "NVIDIA A10 24 GB", avail: 21.6 },
  { name: "NVIDIA A40 48 GB", avail: 43.2 },
  { name: "NVIDIA L40 48 GB", avail: 43.2 },
  { name: "NVIDIA RTX A4000 16 GB", avail: 14.4 },
  { name: "NVIDIA RTX A5000 24 GB", avail: 21.6 },
  { name: "NVIDIA RTX A6000 48 GB", avail: 43.2 },
  { name: "NVIDIA RTX 4000 Ada 20 GB", avail: 18.0 },
  { name: "NVIDIA RTX 6000 Ada 48 GB", avail: 43.2 },
  { name: "NVIDIA GeForce RTX 4090 24 GB", avail: 21.6 },
  { name: "NVIDIA GeForce RTX 5090 32 GB", avail: 28.8 },
  { name: "NVIDIA RTX PRO 6000 Blackwell Server Edition 96 GB", avail: 86.4 },
  { name: "AMD Instinct MI300X", avail: 172.8 },
  { name: "AMD Instinct MI325X", avail: 230.4 }
];

function BrowseResultsAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [isMainOpen, setIsMainOpen] = useState(false);

  return (
    <div className="mt-16 w-full border-t border-b border-dashed border-[#333] bg-[#151515]">
      {isMainOpen ? (
        <div 
          className="p-6 md:p-8 flex justify-between items-start border-b border-dashed border-[#333] cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          onClick={() => setIsMainOpen(false)}
        >
          <div className="flex flex-col gap-2">
            <h3 className="text-[15px] font-medium text-[#F0EFE2]">Browse model and GPU results</h3>
            <p className="text-[13px] text-[#ccc]">
              50,000 requests/day, 500 input and 500 output tokens, FP16. Memory fit is modelled. Monthly cost requires matching measured serving capacity.
            </p>
          </div>
          <button className="text-[#76b900] hover:text-[#86dc00] transition-colors text-[18px] leading-none mb-1">
            ×
          </button>
        </div>
      ) : (
        <div 
          className="p-6 md:p-8 flex justify-between items-center cursor-pointer hover:bg-[#1a1a1a] transition-colors"
          onClick={() => setIsMainOpen(true)}
        >
          <span className="text-[15px] font-medium text-[#F0EFE2]">Browse model and GPU results</span>
          <button className="text-[#76b900] hover:text-[#86dc00] transition-colors text-[16px] leading-none mb-0.5">
            +
          </button>
        </div>
      )}

      {/* Accordion List */}
      {isMainOpen && (
      <div className="flex flex-col">
        {BROWSE_MODELS.map((model, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={model} className="border-b border-dashed border-[#333] last:border-b-0">
              <div 
                className="py-3 px-6 md:px-8 flex justify-between items-center cursor-pointer hover:bg-[#1a1a1a] transition-colors"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
              >
                <span className="text-[13px] font-medium text-[#F0EFE2]">{model}</span>
                <button className="text-[#76b900] hover:text-[#86dc00] transition-colors text-[16px] leading-none mb-0.5">
                  {isOpen ? "×" : "+"}
                </button>
              </div>
              
              {isOpen && (
                <div className="p-6 md:p-8 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                  {GPU_RESULTS.map((gpu) => {
                    const requiredGB = model.includes("0.5B") ? 1.3 : (model.includes("7B") || model.includes("8B") || model.includes("9B") ? 14.5 : (model.includes("14B") ? 28.0 : (model.includes("30B") || model.includes("32B") ? 64.0 : 140.0)));
                    return (
                      <div key={gpu.name} className="flex flex-col">
                        <span className="text-[12px] font-medium text-[#ccc] inline-block border-b border-[#444] pb-[3px] w-fit">
                          {gpu.name}: {requiredGB} GB required, {gpu.avail.toFixed(1)} GB available
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    )}
    </div>
  );
}

