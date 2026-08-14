"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { SimpleIcon } from "simple-icons";

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
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#0081FB]", className)}
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path
        d="M3.5 4.5L10.8 19.5H13.2L7.2 4.5H3.5Z"
        fill="#F59E0B"
      />
      <path
        d="M13.5 4.5L8.5 14.5L10.8 19.5L20.5 4.5H16.2L12.5 12.5L14.8 4.5H13.5Z"
        fill="#38BDF8"
      />
    </svg>
  );
}

// 3. Official Qwen Logo (Alibaba Tongyi Qwen)
export function QwenLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#8B5CF6]", className)}
    >
      <path
        fillRule="evenodd"
        d="M12.604 1.34c.393.69.784 1.382 1.174 2.075a.18.18 0 00.157.091h5.552c.174 0 .322.11.446.327l1.454 2.57c.19.337.24.478.024.837-.26.43-.513.864-.76 1.3l-.367.658c-.106.196-.223.28-.04.512l2.652 4.637c.172.301.111.494-.043.77-.437.785-.882 1.564-1.335 2.34-.159.272-.352.375-.68.37-.777-.016-1.552-.01-2.327.016a.099.099 0 00-.081.05 575.097 575.097 0 01-2.705 4.74c-.169.293-.38.363-.725.364-.997.003-2.002.004-3.017.002a.537.537 0 01-.465-.271l-1.335-2.323a.09.09 0 00-.083-.049H4.982c-.285.03-.553-.001-.805-.092l-1.603-2.77a.543.543 0 01-.002-.54l1.207-2.12a.198.198 0 000-.197 550.951 550.951 0 01-1.875-3.272l-.79-1.395c-.16-.31-.173-.496.095-.965.465-.813.927-1.625 1.387-2.436.132-.234.304-.334.584-.335a338.3 338.3 0 012.589-.001.124.124 0 00.107-.063l2.806-4.895a.488.488 0 01.422-.246c.524-.001 1.053 0 1.583-.006L11.704 1c.341-.003.724.032.9.34zm-3.432.403a.06.06 0 00-.052.03L6.254 6.788a.157.157 0 01-.135.078H3.253c-.056 0-.07.025-.041.074l5.81 10.156c.025.042.013.062-.034.063l-2.795.015a.218.218 0 00-.2.116l-1.32 2.31c-.044.078-.021.118.068.118l5.716.008c.046 0 .08.02.104.061l1.403 2.454c.046.081.092.082.139 0l5.006-8.76.783-1.382a.055.055 0 01.096 0l1.424 2.53a.122.122 0 00.107.062l2.763-.02a.04.04 0 00.035-.02.041.041 0 000-.04l-2.9-5.086a.108.108 0 010-.113l.293-.507 1.12-1.977c.024-.041.012-.062-.035-.062H9.2c-.059 0-.073-.026-.043-.077l1.434-2.505a.107.107 0 000-.114L9.225 1.774a.06.06 0 00-.053-.031zm6.29 8.02c.046 0 .058.02.034.06l-.832 1.465-2.613 4.585a.056.056 0 01-.05.029.058.058 0 01-.05-.029L8.498 9.841c-.02-.034-.01-.052.028-.054l.216-.012 6.722-.012z"
      />
    </svg>
  );
}

// 4. Official SGLang Logo (Connected Multi-Node Cluster)
export function SGLangLogo({ className, size = 13 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <circle cx="6" cy="14" r="3" fill="#EA580C" />
      <circle cx="12" cy="7" r="3.2" fill="#F97316" />
      <circle cx="18" cy="13" r="2.8" fill="#FB923C" />
      <circle cx="12" cy="18" r="2" fill="#F97316" />
      <line x1="8.5" y1="12" x2="10" y2="9.5" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="14" y1="9.5" x2="16" y2="11.5" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="8.5" y1="15" x2="10.5" y2="17" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="13.5" y1="17" x2="16" y2="14.5" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#10A37F]", className)}
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
      className={cn("shrink-0 inline-block align-middle text-white", className)}
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

// 9. Official NVIDIA Logo (Official Simple Icons / NVIDIA Brand Vector)
export function NvidiaLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#76B900]", className)}
    >
      <path
        d="M8.948 8.798v-1.43a6.7 6.7 0 0 1 .424-.018c3.922-.124 6.493 3.374 6.493 3.374s-2.774 3.851-5.75 3.851c-.398 0-.787-.062-1.158-.185v-4.346c1.528.185 1.837.857 2.747 2.385l2.04-1.714s-1.492-1.952-4-1.952a6.016 6.016 0 0 0-.796.035m0-4.735v2.138l.424-.027c5.45-.185 9.01 4.47 9.01 4.47s-4.08 4.964-8.33 4.964c-.37 0-.733-.035-1.095-.097v1.325c.3.035.61.062.91.062 3.957 0 6.82-2.023 9.593-4.408.459.371 2.34 1.263 2.73 1.652-2.633 2.208-8.772 3.984-12.253 3.984-.335 0-.653-.018-.971-.053v1.864H24V4.063zm0 10.326v1.131c-3.657-.654-4.673-4.46-4.673-4.46s1.758-1.944 4.673-2.262v1.237H8.94c-1.528-.186-2.73 1.245-2.73 1.245s.68 2.412 2.739 3.11M2.456 10.9s2.164-3.197 6.5-3.533V6.201C4.153 6.59 0 10.653 0 10.653s2.35 6.802 8.948 7.42v-1.237c-4.84-.6-6.492-5.936-6.492-5.936z"
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

/** Render a verified Simple Icons vector without loading an external image. */
export function SimpleBrandLogo({ icon, className, size = 14 }: BrandIconProps & { icon: SimpleIcon }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label={icon.title}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d={icon.path} fill={`#${icon.hex}`} />
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
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#4D6BFE]", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M55.6128,3.4712c-.5953-.2917-.8517.2642-1.1998.5466-.1191.0911-.2198.2095-.3206.3188-.8701.9292-1.8867,1.5398-3.2148,1.4668-1.9417-.1094-3.5995.5012-5.065,1.9863-.3114-1.8313-1.3463-2.9248-2.9217-3.6262-.8242-.3645-1.6577-.729-2.2348-1.5217-.403-.5647-.5129-1.1934-.7144-1.813-.1283-.3735-.2565-.7563-.687-.8201-.4671-.0728-.6503.3188-.8335.647-.7327,1.3394-1.0166,2.8154-.9892,4.3096.0641,3.3621,1.4838,6.0406,4.3047,7.9449.3206.2187.403.4372.3023.7563-.1924.656-.4214,1.2937-.6228,1.9497-.1283.4192-.3207.5103-.7694.3279-1.5479-.6467-2.8852-1.6035-4.0667-2.7605-2.0058-1.9407-3.8193-4.0818-6.0815-5.7583-.5312-.3918-1.0625-.7561-1.6121-1.1025-2.3081-2.2412.3023-4.0818.9068-4.3003.6319-.2278.2198-1.0115-1.8227-1.0022-2.0425.009-3.9109.6924-6.2922,1.6035-.348.1367-.7145.2368-1.09.3188-2.1615-.4099-4.4055-.5012-6.7502-.2368-4.4147.4919-7.9408,2.5784-10.5328,6.1409C.1914,13.1289-.5413,17.9941.3563,23.0691c.9434,5.3481,3.6727,9.7761,7.8676,13.2385,4.3506,3.5896,9.3606,5.3481,15.0758,5.011,3.4713-.2004,7.3364-.665,11.6961-4.355,1.099.5467,2.2531.7652,4.1674.9292,1.4746.1367,2.8943-.0728,3.9933-.3005,1.7219-.3645,1.6029-1.959.9801-2.2505-5.0466-2.3506-3.9385-1.394-4.9459-2.1685,2.5645-3.0339,6.4297-6.1865,7.9409-16.4001.119-.8108.0183-1.3211,0-1.9771-.0092-.4008.0824-.5556.5404-.6013,1.2639-.1458,2.4912-.4919,3.6178-1.1115,3.2698-1.7857,4.5886-4.7195,4.9-8.2364.0459-.5376-.0091-1.0935-.577-1.3757ZM27.119,35.123c-4.8909-3.8447-7.263-5.1113-8.2431-5.0566-.9159.0547-.751,1.1025-.5496,1.7859.2107.6741.4855,1.1389.8701,1.731.2656.3918.4489.9748-.2655,1.4123-1.5754.9749-4.314-.3281-4.4423-.3918-3.1872-1.877-5.8525-4.3553-7.7302-7.7444-1.8135-3.262-2.8667-6.7605-3.0408-10.4961-.0458-.9019.2198-1.221,1.1174-1.3848,1.1815-.2187,2.3997-.2644,3.5812-.0913,4.9918.729,9.2415,2.9612,12.8043,6.4963,2.0333,2.0135,3.572,4.419,5.1566,6.7696,1.6852,2.4963,3.4987,4.8745,5.8068,6.8242.8151.6833,1.4654,1.2026,2.0882,1.5854-1.8775.2095-5.01.2552-7.1532-1.4397ZM29.4637,20.0442c0-.4009.3206-.7197.7237-.7197.0916,0,.174.018.2473.0453.1008.0366.1924.0913.2656.1731.1283.1277.2015.3098.2015.5012,0,.4009-.3205.7197-.7234.7197s-.7145-.3188-.7145-.7197ZM36.7452,23.7798c-.4671.1914-.9342.3552-1.383.3735-.6961.0364-1.4563-.2461-1.8684-.5923-.6411-.5376-1.0991-.8381-1.2914-1.7766-.0825-.4009-.0367-1.0205.0367-1.3757.1648-.7654-.0184-1.2573-.5587-1.7039-.4397-.3645-.9984-.4646-1.6121-.4646-.229,0-.4395-.1003-.5953-.1823-.2565-.1275-.467-.4464-.2656-.8382.0641-.1274.3756-.4373.4489-.4919.8335-.4739,1.7952-.3189,2.6836.0364.8244.3371,1.4472.9567,2.3447,1.8313.9159,1.0568"
      />
    </svg>
  );
}
