"use client";

import React from "react";
import { Download, Heart } from "lucide-react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import {
  QwenLogo,
  MetaLogo,
  NvidiaLogo,
  HuggingFaceLogo,
  DeepSeekLogo,
  KimiLogo,
  MicrosoftLogo,
  GoogleLogo,
  BAAILogo,
  OpenAILogo,
  MistralLogo,
  AuthorMonogram,
} from "@/components/epoch/primitives/brand-icons";

const rawModelList = ["Qwen/Qwen3.8-27B", "Qwen/Qwen3.8-2.4T-A95B", "Qwen/Qwen3.8-27B-FP8", "deepseek-ai/DeepSeek-V4-Pro-0813", "deepseek-ai/DeepSeek-V4-Flash-0731", "zai-org/GLM-5.2", "moonshotai/Kimi-K3", "meta-llama/Llama-4-Maverick", "meta-llama/Llama-4-Scout", "meta-llama/Llama-3.3-70B-Instruct", "meta-llama/Llama-3.1-405B-Instruct", "meta-llama/Llama-3.1-70B-Instruct", "meta-llama/Llama-3.1-8B-Instruct", "mistralai/Mistral-Large-Instruct-2411", "mistralai/Mistral-Small-24B-Instruct-2501", "mistralai/Mixtral-8x22B-Instruct-v0.1", "google/gemma-3-27b-it", "google/gemma-3-12b-it", "google/gemma-3-4b-it", "google/gemma-2-27b-it", "microsoft/Phi-4", "microsoft/Phi-4-mini-instruct", "microsoft/Phi-3.5-MoE-instruct", "microsoft/Phi-3.5-mini-instruct", "nvidia/NVIDIA-Nemotron-3.5-Lightning-30B-A3B-NVFP4", "CohereForAI/aya-expanse-32b", "ibm-granite/granite-3.3-8b-instruct", "tiiuae/Falcon3-10B-Instruct", "01-ai/Yi-1.5-34B-Chat", "internlm/internlm3-8b-instruct", "01-ai/Yi-Coder-9B-Chat", "Qwen/Qwen2.5-Coder-32B-Instruct", "Qwen/Qwen2.5-Coder-14B-Instruct", "Qwen/Qwen2.5-Coder-7B-Instruct", "Qwen/Qwen2.5-Coder-3B-Instruct", "deepseek-ai/DeepSeek-Coder-V2-Instruct", "deepseek-ai/deepseek-coder-33b-instruct", "bigcode/starcoder2-15b", "bigcode/starcoder2-7b", "codellama/CodeLlama-70b-Instruct-hf", "codellama/CodeLlama-34b-Instruct-hf", "codellama/CodeLlama-13b-Instruct-hf", "codellama/CodeLlama-7b-Instruct-hf", "Salesforce/CodeGen2.5-7B-multi", "WizardLM/WizardCoder-Python-34B-V1.0", "TheBloke/CodeNinja-22B-V1.0-GGUF", "HuggingFaceH4/zephyr-7b-beta", "HuggingFaceH4/zephyr-7b-gemma-v0.1", "HuggingFaceH4/zephyr-7b-alpha", "NousResearch/Hermes-3-Llama-3.1-70B", "NousResearch/Hermes-3-Llama-3.1-8B", "teknium/OpenHermes-2.5-Mistral-7B", "openchat/openchat-3.5-0106", "mosaicml/mpt-30b-instruct", "mosaicml/mpt-7b-instruct", "EleutherAI/gpt-neox-20b", "EleutherAI/pythia-12b", "EleutherAI/pythia-6.9b", "EleutherAI/pythia-2.8b", "tiiuae/falcon-180B", "tiiuae/falcon-40b-instruct", "tiiuae/falcon-7b-instruct", "stabilityai/stablelm-zephyr-3b", "stabilityai/stablelm-2-zephyr-1_6b", "databricks/dbrx-instruct", "Qwen/Qwen3.8-9B", "Qwen/Qwen3.8-2B", "Qwen/Qwen3-32B", "Qwen/Qwen3-14B", "Qwen/Qwen3-8B", "Qwen/Qwen3-4B", "Qwen/Qwen3-1.7B", "Qwen/Qwen2.5-72B-Instruct", "Qwen/Qwen2.5-32B-Instruct", "Qwen/Qwen2.5-14B-Instruct", "Qwen/Qwen2.5-7B-Instruct", "Qwen/Qwen2.5-3B-Instruct", "Qwen/Qwen2.5-1.5B-Instruct", "Qwen/Qwen2.5-0.5B-Instruct", "Qwen/QwQ-32B", "Qwen/QVQ-72B-Preview", "Qwen/Qwen2.5-VL-72B-Instruct", "Qwen/Qwen2.5-VL-32B-Instruct", "Qwen/Qwen2.5-VL-7B-Instruct", "Qwen/Qwen2.5-VL-3B-Instruct", "Qwen/Qwen2-VL-72B-Instruct", "Qwen/Qwen2-VL-7B-Instruct", "Qwen/Qwen2-Audio-7B-Instruct", "Qwen/Qwen2.5-Omni-7B", "Qwen/Qwen2.5-Omni-3B", "Qwen/Qwen2.5-Math-72B", "Qwen/Qwen2.5-Math-7B", "deepseek-ai/DeepSeek-R1", "deepseek-ai/DeepSeek-R1-Distill-Qwen-32B", "deepseek-ai/DeepSeek-R1-Distill-Qwen-14B", "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B", "deepseek-ai/DeepSeek-R1-Distill-Llama-70B", "deepseek-ai/DeepSeek-R1-Distill-Llama-8B", "deepseek-ai/DeepSeek-V3", "deepseek-ai/DeepSeek-V2.5", "deepseek-ai/DeepSeek-V2-Lite-Chat", "google/gemma-3-1b-it", "google/gemma-3-270m", "google/gemma-2-9b-it", "google/gemma-2-2b-it", "google/gemma-2-27b", "google/gemma-2-9b", "google/gemma-2-2b", "google/gemma-1.1-7b-it", "google/gemma-1.1-2b-it", "google/gemma-7b-it", "google/gemma-2b-it", "google/gemma-3n-E4B-it", "google/gemma-3n-E2B-it", "microsoft/Phi-4-reasoning-plus", "microsoft/Phi-4-reasoning", "microsoft/Phi-4-multimodal-instruct", "microsoft/Phi-3-medium-4k-instruct", "microsoft/Phi-3-medium-128k-instruct", "microsoft/Phi-3-small-8k-instruct", "microsoft/Phi-3-small-128k-instruct", "microsoft/Phi-3-mini-4k-instruct", "microsoft/Phi-3-mini-128k-instruct", "microsoft/Phi-2", "microsoft/Orca-2-13b", "microsoft/Orca-2-7b", "microsoft/Florence-2-large", "microsoft/Florence-2-base", "mistralai/Mistral-7B-Instruct-v0.3", "mistralai/Mistral-7B-Instruct-v0.2", "mistralai/Mistral-7B-Instruct-v0.1", "mistralai/Mistral-Nemo-Instruct-2407", "mistralai/Mistral-Small-3.1-24B-Instruct-2503", "mistralai/Mistral-Small-3.2-24B-Instruct-2506", "mistralai/Mixtral-8x7B-Instruct-v0.1", "mistralai/Mixtral-8x7B-v0.1", "mistralai/Codestral-22B-v0.1", "mistralai/Mathstral-7B-v0.1", "mistralai/Ministral-8B-Instruct-2410", "mistralai/Ministral-3B-Instruct-2410", "mistralai/Ministral-3-14B-Instruct-2512", "google/medgemma-27b-text-it", "google/medgemma-4b-it", "google/medgemma-1.5-4b-it", "BAAI/bge-m3", "BAAI/bge-large-en-v1.5", "BAAI/bge-base-en-v1.5", "BAAI/bge-small-en-v1.5", "BAAI/bge-reranker-v2-m3", "BAAI/bge-reranker-large", "intfloat/e5-large-v2", "intfloat/e5-base-v2", "intfloat/e5-small-v2", "nomic-ai/nomic-embed-text-v1.5", "nomic-ai/nomic-embed-text-v1", "sentence-transformers/all-MiniLM-L6-v2", "sentence-transformers/all-mpnet-base-v2", "sentence-transformers/paraphrase-multilingual-mpnet-base-v2", "openai/clip-vit-large-patch14", "openai/clip-vit-base-patch32", "openai/whisper-large-v3", "openai/whisper-large-v3-turbo", "openai/whisper-medium", "openai/whisper-small", "openai/whisper-base", "openai/whisper-tiny", "Systran/faster-whisper-large-v3", "distil-whisper/distil-large-v3", "distil-whisper/distil-medium.en", "distil-whisper/distil-small.en", "facebook/wav2vec2-base-960h", "facebook/wav2vec2-large-960h", "facebook/wav2vec2-large-xlsr-53", "nvidia/parakeet-tdt-0.6b-v2", "nvidia/parakeet-tdt-1.1b", "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice", "Qwen/Qwen3-TTS-12Hz-1.7B-Base", "Qwen/Qwen3-TTS-12Hz-0.6B-Base", "hexgrad/Kokoro-82M", "coqui/XTTS-v2", "ResembleAI/chatterbox", "SWivid/F5-TTS", "myshell-ai/MeloTTS-English", "facebook/mms-tts-eng", "facebook/mms-tts-hin", "facebook/mms-tts-tam", "facebook/mms-tts-tel", "suno/bark", "parler-tts/parler-tts-mini-v1", "parler-tts/parler-tts-large-v1", "ylacancelliera/parler-tts-mini-multilingual-v1.1", "fishaudio/fish-speech-1.5", "fishaudio/fish-speech-1", "FunAudioLLM/CosyVoice-300M", "FunAudioLLM/CosyVoice-300M-SFT", "FunAudioLLM/CosyVoice2-0.5B", "FunAudioLLM/CosyVoice2-0.5B-Instruct", "FunAudioLLM/Fun-CosyVoice3.0", "myshell-ai/OpenVoice", "myshell-ai/OpenVoiceV2", "lj1995/VoiceConversionWebUI", "rvc-project/rvc-models", "facebook/musicgen-small", "facebook/musicgen-medium", "facebook/musicgen-large", "facebook/musicgen-melody", "stabilityai/stable-audio-open-1.0", "nvidia/Audio2Face-3D", "facebook/audiogen-medium", "cvssp/audioldm2", "cvssp/audioldm-m-full", "cvssp/audioldm-s-full", "declare-lab/MusicGen", "hkchengrex/MMAudio", "Lightricks/LTX-2.5", "Lightricks/LTX-Video", "Wan-AI/Wan2.2-T2V-A14B", "Wan-AI/Wan2.1-T2V-14B", "Wan-AI/Wan2.1-T2V-1.3B", "Wan-AI/Wan2.1-I2V-14B-720P", "Wan-AI/Wan2.1-I2V-14B-480P", "hunyuanvideo-community/HunyuanVideo", "hunyuanvideo-community/HunyuanVideo-I2V", "THUDM/CogVideoX-5b", "THUDM/CogVideoX-2b", "ali-vilab/VideoCrafter2", "damo-vilab/text-to-video-ms-1.7b", "damo-vilab/modelscope-damo-text-to-video-synthesis", "stabilityai/stable-video-diffusion-img2vid", "stabilityai/stable-video-diffusion-img2vid-xt", "black-forest-labs/FLUX.1-dev", "black-forest-labs/FLUX.1-schnell", "black-forest-labs/FLUX.1-Kontext-dev", "black-forest-labs/FLUX.1-Kontext-max", "stabilityai/stable-diffusion-xl-base-1.0", "stabilityai/stable-diffusion-3.5-large", "stabilityai/stable-diffusion-3.5-medium", "stabilityai/stable-diffusion-2-1", "runwayml/stable-diffusion-v1-5", "stabilityai/sdxl-turbo", "PixArt-alpha/PixArt-Sigma-XL-2-1024-MS", "PixArt-alpha/PixArt-XL-2-1024-MS", "kandinsky-community/kandinsky-3", "kandinsky-community/kandinsky-2-2-decoder", "kandinsky-community/kandinsky-2-2-prior", "stabilityai/stable-cascade", "stabilityai/control-lora", "Tencent-Hunyuan/HunyuanImage-3.0", "Qwen/Qwen-Image", "Qwen/Qwen-Image-Edit", "black-forest-labs/FLUX.1-Fill-dev", "black-forest-labs/FLUX.1-Depth-dev", "black-forest-labs/FLUX.1-Redux-dev", "google/paligemma-3b-mix-224", "google/paligemma2-10b-mix-448", "google/paligemma2-3b-mix-448", "HuggingFaceM4/idefics2-8b", "HuggingFaceM4/idefics3-8b-instruct", "llava-hf/llava-1.5-7b-hf", "llava-hf/llava-v1.6-mistral-7b-hf", "llava-hf/llava-v1.6-34b-hf", "OpenGVLab/InternVL2_5-78B", "OpenGVLab/InternVL2_5-26B", "OpenGVLab/InternVL2_5-8B", "OpenGVLab/InternVL3-78B", "OpenGVLab/InternVL3-38B", "OpenGVLab/InternVL3-14B", "openbmb/MiniCPM-V-2_6", "openbmb/MiniCPM-o-2_6", "Salesforce/blip-image-captioning-base", "Salesforce/blip-image-captioning-large", "Salesforce/blip2-opt-2.7b", "Salesforce/blip2-flan-t5-xl", "microsoft/Florence-2-large-ft", "facebook/sam2-hiera-large", "facebook/sam2-hiera-base-plus", "facebook/sam-vit-huge", "facebook/dinov2-large", "facebook/dinov2-base", "facebook/detr-resnet-50", "facebook/mask2former-swin-large-cityscapes-semantic", "IDEA-Research/grounding-dino-base", "IDEA-Research/grounding-dino-tiny", "DepthAnything/Depth-Anything-V2-Large-hf", "DepthAnything/Depth-Anything-V2-Base-hf", "ultralytics/YOLOv8", "ultralytics/YOLO11", "ultralytics/YOLO-World", "google/tapas-large-finetuned-wtq", "facebook/bart-large-cnn", "google-t5/t5-large", "google-t5/t5-base", "google-t5/t5-small", "google/mt5-large", "google/mt5-base", "google/mt5-small", "facebook/nllb-200-3.3B", "facebook/nllb-200-distilled-600M", "facebook/m2m100_1.2B", "facebook/m2m100_418M", "google/madlad400-3b-mt", "google/madlad400-7b-mt", "facebook/mbart-large-50-many-to-many-mmt", "google/byt5-small", "google/byt5-base", "google/pegasus-xsum", "google/pegasus-large", "google/electra-large-discriminator", "google/electra-base-discriminator", "google/bert-large-uncased", "google/bert-base-uncased", "google/bert-base-multilingual-cased", "FacebookAI/roberta-large", "FacebookAI/roberta-base", "microsoft/deberta-v3-large", "microsoft/deberta-v3-base", "allenai/longformer-large-4096", "allenai/led-large-16384", "allenai/OLMo-2-0325-32B-Instruct", "allenai/OLMo-2-1124-13B-Instruct", "allenai/OLMo-2-1124-7B-Instruct", "allenai/OLMo-2-1124-1B-Instruct", "allenai/OLMo-1.7-7B-Instruct", "allenai/OLMo-1.7-7B", "allenai/Molmo-7B-D-0924", "allenai/Molmo-7B-O-0924", "NousResearch/DeepHermes-3-Llama-3-8B-Preview", "NousResearch/Hermes-3-Llama-3.1-405B", "NousResearch/Hermes-3-Llama-3.1-70B", "NousResearch/Hermes-3-Llama-3.1-8B", "NousResearch/Hermes-2-Pro-Llama-3-8B", "Teknium/OpenHermes-2.5-Mistral-7B", "TheBloke/Mistral-7B-Instruct-v0.2-GGUF", "TheBloke/Llama-2-70B-chat-GGUF", "TheBloke/Mixtral-8x7B-Instruct-v0.1-GGUF", "TheBloke/Qwen-7B-Chat-GGUF", "TheBloke/CodeLlama-34B-Instruct-GGUF", "TheBloke/DeepSeek-Coder-33B-Instruct-GGUF", "TheBloke/Falcon-40B-Instruct-GGUF"];

const getBrandLogo = (name: string) => {
  const lower = name.toLowerCase();

  if (lower.includes("qwen") || lower.includes("qwq") || lower.includes("qvq")) return <QwenLogo size={14} />;
  if (lower.includes("llama") || lower.includes("meta") || lower.includes("facebook") || lower.includes("sam2") || lower.includes("dinov2") || lower.includes("musicgen") || lower.includes("bart")) return <MetaLogo size={14} />;
  if (lower.includes("deepseek")) return <DeepSeekLogo size={14} />;
  if (lower.includes("nvidia") || lower.includes("nemotron") || lower.includes("parakeet") || lower.includes("audio2face")) return <NvidiaLogo size={14} />;
  if (lower.includes("kimi") || lower.includes("moonshot")) return <KimiLogo size={14} />;
  if (lower.includes("microsoft") || lower.includes("phi") || lower.includes("orca") || lower.includes("florence") || lower.includes("deberta")) return <MicrosoftLogo size={14} />;
  if (lower.includes("google") || lower.includes("gemma") || lower.includes("t5") || lower.includes("madlad") || lower.includes("electra") || lower.includes("bert") || lower.includes("pegasus")) return <GoogleLogo size={14} />;
  if (lower.includes("baai") || lower.includes("bge")) return <BAAILogo size={14} />;
  if (lower.includes("openai") || lower.includes("whisper") || lower.includes("clip")) return <OpenAILogo size={14} />;
  if (lower.includes("mistral") || lower.includes("mixtral") || lower.includes("mathstral") || lower.includes("ministral") || lower.includes("codestral")) return <MistralLogo size={14} />;

  // Fallback to Hugging Face logo if we don't have a specific official SVG
  return <HuggingFaceLogo size={14} />;
};

export function LeftFeedStrip() {
  const [categoryIndex, setCategoryIndex] = React.useState(0);
  const categories = [
    "multimodal sensors",
    "camera & LiDAR video",
    "telemetry & traces",
    "K8s & cloud state",
    "HF & model repos",
    "codebase & APIs",
    "database schemas",
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCategoryIndex((prev) => (prev + 1) % categories.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [categories.length]);

  const models = React.useMemo(() => {
    let seed = 12345;
    const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

    // Duplicate the raw list to reach ~500 items
    let duplicated: string[] = [];
    while (duplicated.length < 500) {
      duplicated.push(...rawModelList);
    }
    duplicated = duplicated.slice(0, 500);

    // Shuffle the items deterministically
    for (let i = duplicated.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
    }

    return duplicated.map((fullName, i) => {
      const parts = fullName.split("/");
      const name = parts[parts.length - 1]; // get just the model name

      const sizes = ["1.5B", "7B", "8B", "14B", "32B", "70B", "405B", "1.2T"];
      let size = sizes[Math.floor(random() * sizes.length)];
      // extract size from name if it exists (e.g. 7B, 7b, 72B)
      const sizeMatch = name.match(/(\d+(?:\.\d+)?)[BbTt]/);
      if (sizeMatch) size = sizeMatch[0].toUpperCase();

      const downloads = (random() * 15).toFixed(1) + (random() > 0.6 ? "M" : "k");
      const likes = Math.floor(random() * 900 + 100) + (random() > 0.8 ? "k" : "");

      return {
        name,
        size,
        downloads: downloads.replace(".0", ""),
        likes: likes.toString(),
        icon: getBrandLogo(fullName)
      };
    });
  }, []);

  const feedRef = React.useRef<HTMLDivElement>(null);
  const tlRef = React.useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    if (!feedRef.current) return;
    tlRef.current = gsap.timeline({ repeat: -1 });
    tlRef.current.fromTo(
      feedRef.current,
      { yPercent: 0 },
      { yPercent: -50, duration: 400, ease: "none" }
    );
  }, { scope: feedRef });

  return (
    <aside
      onMouseEnter={() => tlRef.current?.pause()}
      onMouseLeave={() => tlRef.current?.play()}
      className="hidden lg:flex flex-col w-[14vw] border-r border-dashed border-[#333333] bg-[#151515] p-3 mt-20 font-mono text-xs select-none shrink-0 h-[540px] overflow-hidden relative"
    >
      {/* Top Label */}
      <div className="shrink-0 space-y-0.5 pb-2.5 border-b border-dashed border-[#333333] mb-2 text-left z-10 bg-[#151515]">
        <div className="text-[10px] uppercase font-bold text-[#666666] tracking-wider font-mono">
          GOES IN
        </div>
        <div className="font-semibold text-sm text-[#dddddd] font-sans transition-all duration-300">
          {categories[categoryIndex]}
        </div>
        <div className="text-[11px] text-[#666666] leading-tight font-sans">
          unified Input Envelope across all 4 Reality Surfaces
        </div>
      </div>

      {/* Infinite Vertical Scroll List: BOTTOM TO TOP (Upward) */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={feedRef} className="space-y-1">
          {[...models, ...models].map((m, idx) => (
            <div
              key={`${m.name}-${idx}`}
              className="pb-1 border-b border-dashed border-[#1c1c1c] space-y-0.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0">{m.icon}</span>
                <span className="font-sans text-xs text-[#d8d8d8] font-medium truncate">{m.name}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[10px] text-[#666666] pl-5 font-mono">
                <span className="flex items-center gap-0.5"><span className="text-[#555]">.:</span> {m.size}</span>
                <span className="flex items-center gap-0.5"><Download size={9} className="text-[#555]" /> {m.downloads}</span>
                <span className="flex items-center gap-0.5"><Heart size={9} className="text-[#555]" /> {m.likes}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function RightFeedStrip() {
  const [outcomeIndex, setOutcomeIndex] = React.useState(0);
  const outcomes = [
    "verified optimization",
    "world-state package",
    "runnable stack kit",
    "benchmark receipt",
    "remediation patch",
    "adapted model lora",
  ];

  React.useEffect(() => {
    const timer = setInterval(() => {
      setOutcomeIndex((prev) => (prev + 1) % outcomes.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [outcomes.length]);

  const benchmarks = React.useMemo(() => {
    let seed = 54321;
    const random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const hardwarePool = ["H100", "H100 × 2", "H100 × 4", "H100 × 8", "A100 80GB", "A100 × 4", "L40S", "L40S × 8", "B200 × 4", "B300 × 8", "GH200", "TPUv5e", "TPUv4 × 4"];

    let duplicated: string[] = [];
    while (duplicated.length < 500) {
      duplicated.push(...rawModelList);
    }
    duplicated = duplicated.slice(0, 500);

    // Shuffle the items deterministically
    for (let i = duplicated.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [duplicated[i], duplicated[j]] = [duplicated[j], duplicated[i]];
    }

    return duplicated.map((fullName, i) => {
      const parts = fullName.split("/");
      const name = parts[parts.length - 1];
      const hardware = hardwarePool[Math.floor(random() * hardwarePool.length)];

      return {
        name,
        hardware,
        icon: getBrandLogo(fullName)
      };
    });
  }, []);

  const feedRef = React.useRef<HTMLDivElement>(null);
  const tlRef = React.useRef<gsap.core.Timeline | null>(null);

  useGSAP(() => {
    if (!feedRef.current) return;
    tlRef.current = gsap.timeline({ repeat: -1 });
    tlRef.current.fromTo(
      feedRef.current,
      { yPercent: -50 },
      { yPercent: 0, duration: 400, ease: "none" }
    );
  }, { scope: feedRef });

  return (
    <aside
      onMouseEnter={() => tlRef.current?.pause()}
      onMouseLeave={() => tlRef.current?.play()}
      className="hidden lg:flex flex-col w-[14vw] border-l border-dashed border-[#333333] bg-[#151515] p-3 mt-20 font-mono text-xs select-none shrink-0 h-[540px] overflow-hidden relative"
    >
      {/* Top Label */}
      <div className="shrink-0 space-y-0.5 pb-2.5 border-b border-dashed border-[#333333] mb-2 text-left z-10 bg-[#151515]">
        <div className="text-[10px] uppercase font-bold text-[#666666] tracking-wider font-mono">
          COMES OUT
        </div>
        <div className="font-semibold text-sm text-[#dddddd] font-sans transition-all duration-300">
          {outcomes[outcomeIndex]}
        </div>
        <div className="text-[11px] text-[#666666] leading-tight font-sans">
          verified Mission Result deliverable & empirical receipt
        </div>
      </div>

      {/* Infinite Vertical Scroll List: TOP TO DOWN (Downward) */}
      <div className="flex-1 overflow-hidden relative">
        <div ref={feedRef} className="space-y-1">
          {[...benchmarks, ...benchmarks].map((b, idx) => (
            <div
              key={`${b.name}-${idx}`}
              className="pb-1 border-b border-dashed border-[#1c1c1c] space-y-0.5 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <span className="shrink-0">{b.icon}</span>
                <span className="font-sans text-xs text-[#d8d8d8] font-medium truncate">{b.name}</span>
              </div>
              <div className="text-[10px] font-mono text-[#777777] pl-5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-[1px] bg-[#75bf00]/80 inline-block shrink-0" />
                <span>{b.hardware}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
