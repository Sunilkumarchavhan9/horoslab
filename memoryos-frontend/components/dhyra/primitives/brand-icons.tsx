"use client";

import React from "react";

const MINIMAX_LOGO_URL = "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://minimaxi.com/&size=256";
const INCLUSION_AI_LOGO_URL = "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.inclusion-ai.org/&size=256";
const XIAOMI_LOGO_URL = "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.mi.com&size=256";
const POOLSIDE_LOGO_URL = "https://openrouter.ai/images/icons/poolside-logomark-solid-color.svg";
const UPSTAGE_LOGO_URL = "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://www.upstage.ai/&size=256";

export function MiniMaxLogo({ size = 24 }: { size?: number }) {
  return (
    <img
      src={MINIMAX_LOGO_URL}
      alt="MiniMax"
      width={size}
      height={size}
      className="rounded-[20%] object-contain"
      referrerPolicy="no-referrer"
    />
  );
}

export function InclusionAILogo({ size = 24 }: { size?: number }) {
  return (
    <img
      src={INCLUSION_AI_LOGO_URL}
      alt="InclusionAI"
      width={size}
      height={size}
      className="rounded-[20%] object-contain"
      referrerPolicy="no-referrer"
    />
  );
}

export function XiaomiLogo({ size = 24 }: { size?: number }) {
  return (
    <img
      src={XIAOMI_LOGO_URL}
      alt="Xiaomi"
      width={size}
      height={size}
      className="rounded-[20%] object-contain"
      referrerPolicy="no-referrer"
    />
  );
}

export function PoolsideLogo({ size = 24 }: { size?: number }) {
  return (
    <img
      src={POOLSIDE_LOGO_URL}
      alt="Poolside"
      width={size}
      height={size}
      className="rounded-[20%] object-contain"
      referrerPolicy="no-referrer"
    />
  );
}

export function UpstageLogo({ size = 24 }: { size?: number }) {
  return (
    <img
      src={UPSTAGE_LOGO_URL}
      alt="Upstage"
      width={size}
      height={size}
      className="rounded-[20%] object-contain"
      referrerPolicy="no-referrer"
    />
  );
}
import { cn } from "@/lib/utils";

interface BrandIconProps {
  className?: string;
  size?: number;
}

// 1. Official Meta (Llama) Logo
export function MetaLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#0081FB"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        fillRule="evenodd"
        d="M6.897 4c1.915 0 3.516.932 5.43 3.376l.282-.373c.19-.246.383-.484.58-.71l.313-.35C14.588 4.788 15.792 4 17.225 4c1.273 0 2.469.557 3.491 1.516l.218.213c1.73 1.765 2.917 4.71 3.053 8.026l.011.392.002.25c0 1.501-.28 2.759-.818 3.7l-.14.23-.108.153c-.301.42-.664.758-1.086 1.009l-.265.142-.087.04a3.493 3.493 0 01-.302.118 4.117 4.117 0 01-1.33.208c-.524 0-.996-.067-1.438-.215-.614-.204-1.163-.56-1.726-1.116l-.227-.235c-.753-.812-1.534-1.976-2.493-3.586l-1.43-2.41-.544-.895-1.766 3.13-.343.592C7.597 19.156 6.227 20 4.356 20c-1.21 0-2.205-.42-2.936-1.182l-.168-.184c-.484-.573-.837-1.311-1.043-2.189l-.067-.32a8.69 8.69 0 01-.136-1.288L0 14.468c.002-.745.06-1.49.174-2.23l.1-.573c.298-1.53.828-2.958 1.536-4.157l.209-.34c1.177-1.83 2.789-3.053 4.615-3.16L6.897 4zm-.033 2.615l-.201.01c-.83.083-1.606.673-2.252 1.577l-.138.199-.01.018c-.67 1.017-1.185 2.378-1.456 3.845l-.004.022a12.591 12.591 0 00-.207 2.254l.002.188c.004.18.017.36.04.54l.043.291c.092.503.257.908.486 1.208l.117.137c.303.323.698.492 1.17.492 1.1 0 1.796-.676 3.696-3.641l2.175-3.4.454-.701-.139-.198C9.11 7.3 8.084 6.616 6.864 6.616zm10.196-.552l-.176.007c-.635.048-1.223.359-1.82.933l-.196.198c-.439.462-.887 1.064-1.367 1.807l.266.398c.18.274.362.56.55.858l.293.475 1.396 2.335.695 1.114c.583.926 1.03 1.6 1.408 2.082l.213.262c.282.326.529.54.777.673l.102.05c.227.1.457.138.718.138.176.002.35-.023.518-.073.338-.104.61-.32.813-.637l.095-.163.077-.162c.194-.459.29-1.06.29-1.785l-.006-.449c-.08-2.871-.938-5.372-2.2-6.798l-.176-.189c-.67-.683-1.444-1.074-2.27-1.074z"
      />
    </svg>
  );
}

// 2. Official vLLM Logo (Amber Left Wing + Blue Right Wing)
export function VLLMLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src="https://docs.vllm.ai/projects/vllm-omni/en/latest/source/logos/vllm-logo-only-light.ico"
      alt="vLLM"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
}

// 3. Official Qwen Logo (Alibaba Tongyi Qwen)
export function QwenLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#8B5CF6"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        fillRule="evenodd"
        d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z"
      />
    </svg>
  );
}

// Official vLLM Omni Logo
export function VLLMOmniLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src="https://docs.vllm.ai/projects/vllm-omni/en/latest/source/logos/vllm-logo-only-light.ico"
      alt="vLLM-Omni"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
}

// 4. Official SGLang Logo
export function SGLangLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src="https://raw.githubusercontent.com/sgl-project/sglang/main/assets/logo.png"
      alt="SGLang"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
}

// 5. Official BAAI / BGE Red Square Logo with Bold White 'B'
export function BAAILogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle rounded-xs overflow-hidden", className)}
    >
      <rect width="24" height="24" rx="4" fill="#EF4444" />
      <path
        d="M7 5.5H13.2C15.4 5.5 17.2 6.8 17.2 8.9C17.2 10.2 16.4 11.2 15.2 11.8C16.8 12.3 17.8 13.6 17.8 15.2C17.8 17.6 15.8 18.5 13.2 18.5H7V5.5ZM10.2 10.4H12.8C13.8 10.4 14.5 9.8 14.5 8.9C14.5 8 13.8 7.4 12.8 7.4H10.2V10.4ZM10.2 16.6H13.2C14.2 16.6 15 15.9 15 14.9C15 13.9 14.2 13.2 13.2 13.2H10.2V16.6Z"
        fill="white"
      />
    </svg>
  );
}

// 6. Official OpenAI / Whisper Logo
export function OpenAILogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#10A37F"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        fillRule="evenodd"
        d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"
      />
    </svg>
  );
}

// 7. Official Black Forest Labs / FLUX Delta Logo
export function FluxLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#F0EFE2]", className)}
    >
      <path d="M0 20.683L12.01 2.5 24 20.683h-2.233L12.009 5.878 3.471 18.806h12.122l1.239 1.877H0z" />
      <path d="M8.069 16.724l2.073-3.115 2.074 3.115H8.069zM18.24 20.683l-5.668-8.707h2.177l5.686 8.707h-2.196zM19.74 11.676l2.13-3.19 2.13 3.19h-4.26z" />
    </svg>
  );
}

// 8. Official Hugging Face Diffusers Matrix Logo
export function DiffusersLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <circle cx="5" cy="5" r="2.2" fill="#CBD5E1" />
      <circle cx="12" cy="5" r="2.2" fill="#CBD5E1" />
      <circle cx="19" cy="5" r="2.2" fill="#CBD5E1" />
      <circle cx="5" cy="12" r="2.2" fill="#CBD5E1" />
      <circle cx="12" cy="12" r="2.2" fill="#FFFFFF" />
      <circle cx="19" cy="12" r="2.2" fill="#CBD5E1" />
      <circle cx="5" cy="19" r="2.2" fill="#CBD5E1" />
      <circle cx="12" cy="19" r="2.2" fill="#CBD5E1" />
      <circle cx="19" cy="19" r="2.2" fill="#CBD5E1" />
    </svg>
  );
}

// 9. Official NVIDIA Logo
export function NvidiaLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="#76B900"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z"
      />
    </svg>
  );
}

// 9b. Official GitHub Logo
export function GithubLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// 10. Official Hugging Face Logo
export function HuggingFaceLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <img
      src="https://huggingface.co/front/assets/huggingface_logo-noborder.svg"
      alt="Hugging Face"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle", className)}
    />
  );
}

export function GoogleLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <img
      src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
      alt="Google"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle", className)}
    />
  );
}

export interface SimpleBrandIconData {
  title?: string;
  path: string;
  hex?: string;
}

/** Render a verified Simple Icons vector without loading an external image. */
export function SimpleBrandLogo({ icon, className, size = 14 }: BrandIconProps & { icon: SimpleBrandIconData }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label={icon.title || "Brand Logo"}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d={icon.path} fill={icon.hex ? `#${icon.hex}` : "currentColor"} />
    </svg>
  );
}

/** Deterministic identity for HF users/orgs that do not publish a verified logo. */
export function AuthorMonogram({ label, className, size = 16 }: BrandIconProps & { label: string }) {
  const normalized = label.trim() || "HF";
  const initials = normalized
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || normalized.slice(0, 2).toUpperCase();
  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) hash = (hash * 31 + normalized.charCodeAt(index)) | 0;
  const colors = ["#38BDF8", "#A78BFA", "#34D399", "#F59E0B", "#F472B6", "#FB7185"];
  const color = colors[Math.abs(hash) % colors.length];
  return (
    <span
      aria-label={`${normalized} author`}
      title={normalized}
      className={cn("shrink-0 inline-flex items-center justify-center rounded-[3px] font-mono font-bold leading-none", className)}
      style={{ width: size, height: size, color, backgroundColor: `${color}22`, border: `1px solid ${color}66`, fontSize: Math.max(8, Math.round(size * 0.48)) }}
    >
      {initials}
    </span>
  );
}

// 11. Official DeepSeek Brand Logo (Official Blue Whale Vector)
export function DeepSeekLogo({ className, size = 18 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * (42 / 56))}
      viewBox="0 0 57 42"
      fill="#4D6BFE"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M55.6128,3.4712c-.5953-.2917-.8517.2642-1.1998.5466-.1191.0911-.2198.2095-.3206.3188-.8701.9292-1.8867,1.5398-3.2148,1.4668-1.9417-.1094-3.5995.5012-5.065,1.9863-.3114-1.8313-1.3463-2.9248-2.9217-3.6262-.8242-.3645-1.6577-.729-2.2348-1.5217-.403-.5647-.5129-1.1934-.7144-1.813-.1283-.3735-.2565-.7563-.687-.8201-.4671-.0728-.6503.3188-.8335.647-.7327,1.3394-1.0166,2.8154-.9892,4.3096.0641,3.3621,1.4838,6.0406,4.3047,7.9449.3206.2187.403.4372.3023.7563-.1924.656-.4214,1.2937-.6228,1.9497-.1283.4192-.3207.5103-.7694.3279-1.5479-.6467-2.8852-1.6035-4.0667-2.7605-2.0058-1.9407-3.8193-4.0818-6.0815-5.7583-.5312-.3918-1.0625-.7561-1.6121-1.1025-2.3081-2.2412.3023-4.0818.9068-4.3003.6319-.2278.2198-1.0115-1.8227-1.0022-2.0425.009-3.9109.6924-6.2922,1.6035-.348.1367-.7145.2368-1.09.3188-2.1615-.4099-4.4055-.5012-6.7502-.2368-4.4147.4919-7.9408,2.5784-10.5328,6.1409C.1914,13.1289-.5413,17.9941.3563,23.0691c.9434,5.3481,3.6727,9.7761,7.8676,13.2385,4.3506,3.5896,9.3606,5.3481,15.0758,5.011,3.4713-.2004,7.3364-.665,11.6961-4.355,1.099.5467,2.2531.7652,4.1674.9292,1.4746.1367,2.8943-.0728,3.9933-.3005,1.7219-.3645,1.6029-1.959.9801-2.2505-5.0466-2.3506-3.9385-1.394-4.9459-2.1685,2.5645-3.0339,6.4297-6.1865,7.9409-16.4001.119-.8108.0183-1.3211,0-1.9771-.0092-.4008.0824-.5556.5404-.6013,1.2639-.1458,2.4912-.4919,3.6178-1.1115,3.2698-1.7857,4.5886-4.7195,4.9-8.2364.0459-.5376-.0091-1.0935-.577-1.3757ZM27.119,35.123c-4.8909-3.8447-7.263-5.1113-8.2431-5.0566-.9159.0547-.751,1.1025-.5496,1.7859.2107.6741.4855,1.1389.8701,1.731.2656.3918.4489.9748-.2655,1.4123-1.5754.9749-4.314-.3281-4.4423-.3918-3.1872-1.877-5.8525-4.3553-7.7302-7.7444-1.8135-3.262-2.8667-6.7605-3.0408-10.4961-.0458-.9019.2198-1.221,1.1174-1.3848,1.1815-.2187,2.3997-.2644,3.5812-.0913,4.9918.729,9.2415,2.9612,12.8043,6.4963,2.0333,2.0135,3.572,4.419,5.1566,6.7696,1.6852,2.4963,3.4987,4.8745,5.8068,6.8242.8151.6833,1.4654,1.2026,2.0882,1.5854-1.8775.2095-5.01.2552-7.1532-1.4397ZM29.4637,20.0442c0-.4009.3206-.7197.7237-.7197.0916,0,.174.018.2473.0453.1008.0366.1924.0913.2656.1731.1283.1277.2015.3098.2015.5012,0,.4009-.3205.7197-.7234.7197s-.7145-.3188-.7145-.7197ZM36.7452,23.7798c-.4671.1914-.9342.3552-1.383.3735-.6961.0364-1.4563-.2461-1.8684-.5923-.6411-.5376-1.0991-.8381-1.2914-1.7766-.0825-.4009-.0367-1.0205.0367-1.3757.1648-.7654-.0184-1.2573-.5587-1.7039-.4397-.3645-.9984-.4646-1.6121-.4646-.229,0-.4395-.1003-.5953-.1823-.2565-.1275-.467-.4464-.2656-.8382.0641-.1274.3756-.4373.4489-.4919.8335-.4739,1.7952-.3189,2.6836.0364.8244.3371,1.4472.9567,2.3447,1.8313.9159,1.0568"
      />
    </svg>
  );
}

// 12. Official Hugging Face TEI (Text Embeddings Inference) Logo
export function TEILogo({ className, size = 14 }: BrandIconProps) {
  return (
    <span className={cn("inline-flex items-center shrink-0", className)}>
      <HuggingFaceLogo size={size} />
    </span>
  );
}

// 13. Official ChatGLM / Zhipu AI (GLM) Brand Logo (Source: https://z-cdn.chatglm.cn/z-blog/z-icon.svg)
export function GLMLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 30"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        fill="#2D2D2D"
        stroke="#FFFFFF"
        strokeWidth="0.6317"
        strokeMiterlimit="10"
        d="M24.51 28.51H5.49c-2.21 0-4-1.79-4-4V5.49c0-2.21 1.79-4 4-4h19.03c2.21 0 4 1.79 4 4v19.03c0 2.21-1.79 4-4 4z"
      />
      <g fill="#FFFFFF">
        <path d="M15.47 7.1l-1.3 1.85c-0.2 0.29-0.54 0.47-0.9 0.47h-7.1V7.09C6.16 7.1 15.47 7.1 15.47 7.1z" />
        <polygon points="24.3 7.1 13.14 22.91 5.7 22.91 16.86 7.1" />
        <path d="M14.53 22.91l1.31-1.86c0.2-0.29 0.54-0.47 0.9-0.47h7.09v2.33H14.53z" />
      </g>
    </svg>
  );
}

// 14. Mistral AI's current pixel-cat emblem.
// Geometry and gradient colors match the current Mistral AI logo asset.
export function MistralLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 129 91"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
      aria-hidden="true"
    >
      <rect x="18.292" y="0" width="18.293" height="18.123" fill="#FFD800" />
      <rect x="91.473" y="0" width="18.293" height="18.123" fill="#FFD800" />
      <rect x="18.292" y="18.121" width="36.586" height="18.123" fill="#FFAF00" />
      <rect x="73.181" y="18.121" width="36.586" height="18.123" fill="#FFAF00" />
      <rect x="18.292" y="36.243" width="91.476" height="18.122" fill="#FF8205" />
      <rect x="18.292" y="54.37" width="18.293" height="18.123" fill="#FA500F" />
      <rect x="54.883" y="54.37" width="18.293" height="18.123" fill="#F82004" />
      <rect x="91.473" y="54.37" width="18.293" height="18.123" fill="#FA500F" />
      <rect x="0" y="72.504" width="54.89" height="18.123" fill="#E10500" />
      <rect x="73.181" y="72.504" width="54.89" height="18.123" fill="#C4001D" />
    </svg>
  );
}

// 15. Anthropic / Claude Logo
export function AnthropicLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#D97706]", className)}
    >
      <path d="M13.827 3.518h3.916L24 20.482h-3.916l-1.92-4.524H11.53l-1.92 4.524H5.694zm-1.077 8.528l1.79-4.22 1.79 4.22zM0 20.482l5.447-16.964h3.916L3.916 20.482z" />
    </svg>
  );
}

// 16. Apple Logo
export function AppleLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#F0EFE2]", className)}
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.71-.93 2.73 1 .08 2.03-.49 2.65-1.23" />
    </svg>
  );
}

// 17. AMD Logo
export function AMDLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#ED1C24]", className)}
    >
      <path d="M0 0v24h24V0H0zm21.564 21.564H2.436V2.436h19.128v19.128zM9.73 7.154H7.154v9.692h2.576V7.154zm7.116 0h-4.54v9.692h2.576v-7.116h1.964V7.154z" />
    </svg>
  );
}

// 18. Intel Logo
export function IntelLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#0071C5]", className)}
    >
      <path d="M10.233 8.358v7.284H8.625V8.358h1.608zm5.142 0v7.284h-1.608V8.358h1.608zm-7.983 0v7.284H5.783V8.358h1.61z" />
    </svg>
  );
}

// 19. Official Kimi / Moonshot AI Brand Logo
const KIMI_ICON_URL = "https://imgs.search.brave.com/juHCv_BqGWFAUr-XDkiSQceOh9PYpEGaUR_hl3WVSNg/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvYWYyNjdmY2Jk/NTEyMjlhNWQ4OTk5/ZTNiNjI4YzJjYTE0/Zjg2NzBmNTgxZWFi/YTU3MDlmZTI2NzYx/Zjk4MTE4ZC9wbGF0/Zm9ybS5raW1pLmFp/Lw";

export function KimiLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src={KIMI_ICON_URL}
      alt="Kimi AI"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle rounded-xs object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}

// 20. Official GitHub Octocat Logo
export function GitHubLogo({ className, size = 15 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#F0EFE2]", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

// 21. Official Amazon AWS Logo (Smile Arrow)
export function AWSLogo({ className, size = 16 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#FF9900]", className)}
    >
      <path d="M16.942 16.488a8.88 8.88 0 0 1-5.184 1.596c-3.156 0-5.748-1.524-7.536-4.044-.228-.324-.012-.66.336-.456 2.496 1.464 5.376 2.34 8.352 2.34 1.86 0 3.912-.396 5.808-1.236.432-.192.744.204.224.6l-2 .2zm1.26-1.524c-.216-.276-.984-.132-1.896.252-.456.192-.48.42-.096.6 1.308.6 2.34-.144 2.34-.144s.096-1.008-.348-.708zm-7.668-5.388c-.648-.444-1.392-.66-2.22-.66-1.524 0-2.616.792-2.616 2.196 0 1.344.972 2.052 2.376 2.052.924 0 1.776-.408 2.46-1.128v.936c0 .408.276.684.696.684.42 0 .696-.276.696-.684V9.672c0-1.836-1.296-2.82-3.444-2.82-1.788 0-3.156.888-3.432 2.292-.048.24.132.408.372.408.192 0 .336-.12.384-.312.264-1.008 1.272-1.608 2.676-1.608 1.488 0 2.292.672 2.292 1.848v.492zm-2.064 3.012c-.936 0-1.608-.492-1.608-1.32 0-.804.648-1.32 1.608-1.32.78 0 1.44.3 1.956.864v.936c-.516.54-1.176.84-1.956.84z" />
    </svg>
  );
}

// 22. Official Kubernetes Helm Logo
export function KubernetesLogo({ className, size = 15 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#326CE5]", className)}
    >
      <path d="M12.003 0a2.44 2.44 0 0 0-.649.092l-8.49 2.502a2.454 2.454 0 0 0-1.74 2.34v9.066c0 1.022.637 1.93 1.603 2.288l8.49 3.619a2.47 2.47 0 0 0 1.77 0l8.49-3.619a2.454 2.454 0 0 0 1.603-2.288V4.934a2.454 2.454 0 0 0-1.74-2.34L12.89.092A2.44 2.44 0 0 0 12.003 0zm.01 2.05l7.986 2.353a.4.4 0 0 1 .284.382v8.528a.4.4 0 0 1-.262.374l-7.986 3.404a.4.4 0 0 1-.288 0l-7.986-3.404a.4.4 0 0 1-.262-.374V4.785a.4.4 0 0 1 .284-.382L11.725 2.05a.4.4 0 0 1 .288 0z" />
    </svg>
  );
}

// 23. Official Qdrant Vector Database Logo
export function QdrantLogo({ className, size = 15 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#DC2626]", className)}
    >
      <circle cx="12" cy="12" r="10" fill="#DC2626" />
      <circle cx="12" cy="12" r="5" fill="#FFFFFF" />
      <polyline points="2 17 12 22 22 17" />
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

// Custom added logos for Embeddings Page
export function JinaLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src="https://cdn-avatars.huggingface.co/v1/production/uploads/603763514de52ff951d89793/wD54VbAHHyHop3uYlJKl4.png"
      alt="Jina AI"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle rounded-xs object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
}

export function MixedbreadLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src="https://cdn-avatars.huggingface.co/v1/production/uploads/643ee0870d1194da249bd7fe/voYdYlFgQH5vyMwyMNluZ.png"
      alt="Mixedbread"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle rounded-[20%] object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
}

export function SnowflakeLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src="https://cdn-avatars.huggingface.co/v1/production/uploads/64dc52cf858f8a41c12fc819/O9-MWzRjWzbNP_DQlMb-7.png"
      alt="Snowflake"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle rounded-[20%] object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
}

export function NomicLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <img
      src="https://cdn-avatars.huggingface.co/v1/production/uploads/641f01fe6d51620635e118e9/wy0ax27ok1-uHWoUAHSEs.png"
      alt="Nomic AI"
      width={size}
      height={size}
      className={cn("shrink-0 inline-block align-middle rounded-[20%] object-contain", className)}
      referrerPolicy="no-referrer"
    />
  );
}

export function MicrosoftLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle rounded-xs", className)}
    >
      <rect x="1" y="1" width="10.5" height="10.5" fill="#F25022" />
      <rect x="12.5" y="1" width="10.5" height="10.5" fill="#7FBA00" />
      <rect x="1" y="12.5" width="10.5" height="10.5" fill="#00A4EF" />
      <rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#FFB900" />
    </svg>
  );
}

export function OneXLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M4 4h4v16H4V4zm6 0h4v7h2V4h4v16h-4v-7h-2v7h-4V4z" />
    </svg>
  );
}

export function TeslaLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 4.6c2.7 0 5.4.5 7.8 1.4L21 2c-2.7-1-5.7-1.5-9-1.5S5.7 1 3 2l1.2 4c2.4-.9 5.1-1.4 7.8-1.4zM12 7c-1.5 0-3 .2-4.4.6l.8 3.5c1.1-.3 2.3-.5 3.6-.5s2.5.2 3.6.5l.8-3.5C15 7.2 13.5 7 12 7zm0 5.8c-1.1 0-2.1.2-3.1.5l1.6 7.7h3l1.6-7.7c-1-.3-2-.5-3.1-.5z" />
    </svg>
  );
}

export function RunPodLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  );
}

import { DhyraLogo as OriginalDhyraLogo } from "./dhyra-logo";

export const DhyraLogo = (props: any) => <OriginalDhyraLogo {...props} />;
export const DhyraWordmarkLogo = (props: any) => <OriginalDhyraLogo variant="wordmark" {...props} />;

export function K8sFaviconLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
    </svg>
  );
}

const getFaviconUrl = (url: string) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=256`;

// Missing Integration Logos
export function ClaudeLogo({ className, size = 24 }: BrandIconProps) {
  return <img src="https://imgs.search.brave.com/GWjaTV9oDpq1Je9ium8eyNBhR4UvPfZUchUjSllz4rI/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvOTczMzdhMjk1/MjZkMGQ0YWFmNzE1/NjZhM2U4MDQzMjc5/OThlZDkyNTlhOGVh/Zjg4Mzk2MTIxOGFh/ZjkxYjdmYy9jbGF1/ZGUuYWkv" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Claude" />;
}

export function PiLogo({ className, size = 24 }: BrandIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 800 800" 
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path fill="#fff" fillRule="evenodd" d="
        M165.29 165.29
        H517.36
        V400
        H400
        V517.36
        H282.65
        V634.72
        H165.29
        Z
        M282.65 282.65
        V400
        H400
        V282.65
        Z
      "/>
      <path fill="#fff" d="M517.36 400 H634.72 V634.72 H517.36 Z"/>
    </svg>
  );
}
export function AiderLogo({ className, size = 24 }: BrandIconProps) {
  return <img src="https://imgs.search.brave.com/YXH3gT6RewEP7XjeYr3WV9JuLpcR7qYXFdF0eJL0RTg/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvMTA5ZjNhOGYy/NDg0NmI2YmQ5MTZh/ZDRiNThiNTY5N2Nm/ZjJhNzZiZjM1YjEw/ZWI0MGIwZDVlNmRl/YTc2YjJjMC9haWRl/ci5jaGF0Lw" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Aider" />;
}
export function ContinueLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://continue.dev/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Continue" />;
}
export function ClineLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://cline.bot/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Cline" />;
}
export function ZedLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://zed.dev/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Zed" />;
}
export function CursorLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://cursor.com/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Cursor" />;
}
export function GrokLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://x.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Grok" />;
}
export function HermesLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://nousresearch.com/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Hermes" />;
}
export function GooseLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://block.github.io/goose/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Goose" />;
}

// Fallbacks for the rest:
export function OpenCodeLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://github.com/features/copilot")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="OpenCode" />;
}
export function KiloCodeLogo({ className, size = 24 }: BrandIconProps) {
  return <img src="https://avatars.githubusercontent.com/u/201822503?s=60&v=4" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Kilo Code" />;
}
export function DroidLogo({ className, size = 24 }: BrandIconProps) {
  return <img src="https://imgs.search.brave.com/xW0NrxpSMeg101jtp7pbV5dw_YhIl8e0eo1dCSmxXOM/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvMGJiMzliMTU0/ZGMyZTVmNDdiNTJj/MTY5ZWUyY2ViNTU3/MGU5ZjY2YmFjMTFh/ZDJlYjk4OTA0N2U5/OGY3YjBjYS9kb2Nz/LmZhY3RvcnkuYWkv" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Droid" />;
}
export function OpenClawLogo({ className, size = 24 }: BrandIconProps) {
  return <img src="https://imgs.search.brave.com/9HABCLLoPhAIRPZxDlSujum0p8IyKqkzzkbLURSbgmI/rs:fit:32:32:1:0/g:ce/aHR0cDovL2Zhdmlj/b25zLnNlYXJjaC5i/cmF2ZS5jb20vaWNv/bnMvYzcxZjgxYjg2/NGEyNmM3ZGY2N2Q2/YjVkY2NmYzBlMGY5/NWVkZGViMjQ5MTRk/MzY3YmJkOWRkY2Y4/ZDVlOGZmMS9vcGVu/Y2xhdy5haS8" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="OpenClaw" />;
}
export function CrushLogo({ className, size = 24 }: BrandIconProps) {
  return <div style={{width: size, height: size}} className={cn("bg-[#1a1a1a] border border-[#333] text-[#aaa] font-mono text-[10px] flex items-center justify-center rounded-[4px]", className)}>{">_"}</div>;
}
export function FxLogo({ className, size = 24 }: BrandIconProps) {
  return <div style={{width: size, height: size}} className={cn("bg-[#1a1a1a] border border-[#333] text-[#aaa] font-mono text-[10px] flex items-center justify-center rounded-[4px]", className)}>{"fx"}</div>;
}

// Compute Providers
export function AnyscaleLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://www.anyscale.com/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Anyscale" />;
}
export function PrimeIntellectLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://www.primeintellect.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Prime Intellect" />;
}
export function BasetenLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://www.baseten.co/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Baseten" />;
}
export function TogetherAILogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://www.together.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Together AI" />;
}
export function FireworksAILogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://fireworks.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Fireworks AI" />;
}

// Robotics / Physical Intelligence
export function PhysicalIntelligenceLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://www.physicalintelligence.company/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Physical Intelligence" />;
}
export function SkildAILogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://skild.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Skild AI" />;
}
export function DexterityLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://www.dexterity.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Dexterity" />;
}
export function CovariantLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://covariant.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Covariant" />;
}
export function GeminiRoboticsLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://www.gemini.com/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Gemini Robotics" />;
}
export function TelekinesisLogo({ className, size = 24 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://telekinesis.ai/")} width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Telekinesis" />;
}

export function ModalLogo({ className, size = 14 }: BrandIconProps) {
  return <img src={getFaviconUrl("https://modal.com/")} width={size} height={size} className={cn("rounded-[2px] object-contain bg-white", className)} alt="Modal" />;
}

export function OpenTelemetryLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  );
}

export function OrnithLogo({ className, size = 14 }: BrandIconProps) {
  return <img src="https://ornith.ai/assets/webp/header-logo-Bjk6zmTF.webp" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Ornith" />;
}
