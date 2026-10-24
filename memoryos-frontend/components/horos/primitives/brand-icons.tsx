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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d="M9.83 24V5.142H.4Z" fill="#F59E0B" />
      <path d="M23.6 0L14.879 4.59L9.829 24H17.239L23.6 0Z" fill="#30A2FF" />
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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d="M9.83 24V5.142H.4Z" fill="#F59E0B" />
      <path d="M23.6 0L14.879 4.59L9.829 24H17.239L23.6 0Z" fill="#30A2FF" />
    </svg>
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
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", !className && "text-[#10A37F]", className)}
    >
      <path
        fillRule="evenodd"
        d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"
      />
    </svg>
  );
}

// 6b. Official Claude / Anthropic Spark Logo
export function ClaudeLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d="m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z" />
    </svg>
  );
}

// 6c. Official Google Gemini Sparkle Star Logo
export function GeminiLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.58 2.58 1.62 3.81 3.81Z" />
    </svg>
  );
}

// 6d. Official Grok / X Logo
export function GrokLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

// 6e. Official Perplexity AI Logo
export function PerplexityLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
    >
      <path d="M22.3977 7.0896h-2.3106V.0676l-7.5094 6.3542V.1577h-1.1554v6.1966L4.4904 0v7.0896H1.6023v10.3976h2.8882V24l6.932-6.3591v6.2005h1.1554v-6.0469l6.9318 6.1807v-6.4879h2.8882V7.0896zm-3.4657-4.531v4.531h-5.355l5.355-4.531zm-13.2862.0676 4.8691 4.4634H5.6458V2.6262zM2.7576 16.332V8.245h7.8476l-6.1149 6.1147v1.9723H2.7576zm2.8882 5.0404v-3.8852h.0001v-2.6488l5.7763-5.7764v7.0111l-5.7764 5.2993zm12.7086.0248-5.7766-5.1509V9.0618l5.7766 5.7766v6.5588zm2.8882-5.0652h-1.733v-1.9723L13.3948 8.245h7.8478v8.087z" />
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

import { HorosLogo as OriginalHorosLogo } from "./horos-logo";

export function HorosLogo({ className, size = 14, ...props }: any) {
  return <OriginalHorosLogo size={size} className={cn("text-[#75bf00]", className)} {...props} />;
}
export const HorosWordmarkLogo = (props: any) => <OriginalHorosLogo variant="wordmark" {...props} />;

export function K8sFaviconLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" />
    </svg>
  );
}

const getFaviconUrl = (url: string) => `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${url}&size=256`;

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
export function HermesLogo({ className, size = 24 }: BrandIconProps) {
  return (
    <svg
      width={Math.round(size * 1.35)}
      height={Math.round(size * 1.35)}
      viewBox="0 0 60 84"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle", className)}
      aria-hidden="true"
      fill="currentColor"
    >
      <path d="M31.618 38.943c.013 0 .026.017.026.038 0 .039-.03.047-.06.026-.018-.026.008-.06.038-.06zm.686 25.819c-.03.085-.06.184-.073.21-.005.026-.056.171-.103.321-.051.15-.099.304-.111.347-.112.322-.155.459-.172.519-.013.043-.051.15-.081.236-.056.141-.069.223-.03.223.038 0 .077-.056.167-.12.197-.155.87-.6 1.195-.785.283-.167.275-.167.57-.321a2 2 0 0 0 .28-.172c.046-.043.046-.064.03-.184-.04-.197-.095-.741-.138-1.251-.026-.249-.047-.57-.069-.72a42 42 0 0 1-.085-1.642c-.013-.291-.022-.429-.043-.42-.026.013-.167.364-.197.497-.005.03-.06.197-.125.377-.06.18-.137.386-.163.459-.03.073-.085.24-.137.373-.042.128-.107.308-.137.394s-.073.193-.09.236c-.013.043-.051.15-.081.236-.073.235-.249.75-.27.801a8 8 0 0 0-.133.386zm-4.818-24.11c.017-.025 0-.102-.137-.488l-.099-.283c-.012-.051-.064-.167-.098-.274a5 5 0 0 1-.112-.283c-.102-.265-.642-1.367-.758-1.547-.03-.052-.103-.167-.167-.274-.275-.476-.926-1.329-1.363-1.8q-.372-.413-.185 0c.082.171.198.488.253.672.017.082.047.176.06.206.026.06.082.309.137.562.018.111.043.385.047.63.018.433.005.617-.038.617s-.086-.257-.111-.472c-.018-.128-.048-.197-.09-.197-.043 0-.052.035-.095.069l-.081.06-.056-.056c-.064-.056-.077-.081-.266-.561-.068-.18-.137-.33-.15-.33-.043 0-.017.137.047.36.142.428.198.643.21.805l.018.163-.339.317a10 10 0 0 1-.351.318c-.018 0-.099-.163-.099-.197 0-.035-.013-.048-.03-.09l-.103-.296c-.094-.257-.107-.279-.141-.227-.026.038-.009.192.03.36.047.184.017.214-.322.347-.154.064-.223.086-.308.124-.043.017-.125.047-.185.073a4 4 0 0 0-.295.137c-.18.086-.185.094-.185.172.013.192.172.835.228.917.02.038.072.068.102.068.03.009.133.026.223.047.086.018.21.048.274.06.42.09 1 .378 1.102.54.03.048.081.168.111.262s.065.184.073.197c.048.056.048-.094 0-.364-.055-.279-.055-.296-.012-.339.025-.025.055-.047.068-.047.026 0 .133-.043.36-.15a.7.7 0 0 1 .197-.073c.039 0 .133.124.133.18s.013.065.03.099c.051.111.291.878.321 1.028.013.043.03.082.043.082.03 0 .03-.236-.008-.395-.013-.072-.043-.312-.073-.54a6 6 0 0 0-.06-.428 2 2 0 0 1-.03-.18 2 2 0 0 0-.043-.223c-.03-.124.039-.069.163.137.36.587.506.849.626 1.084.073.142.141.253.163.262.013 0 .021-.283.03-.797 0-.442.012-.797.025-.797.039 0 .069.055.15.274.043.12.09.244.112.283.021.038.064.171.098.295.039.125.103.313.142.433s.098.318.137.446c.038.129.073.253.086.279.025.043.073.06.073.025s-.013-.085-.03-.167a11 11 0 0 1-.12-1.041c-.013-.193-.03-.433-.043-.545l-.013-.201.351.351c.21.21.365.348.377.335zm1.05 30.984a2 2 0 0 1-.111-.265c0-.013-.017-.047-.039-.09-.06-.129-.111-.253-.111-.292s-.017-.038-.039-.038c-.094 0-.891.728-1.779 1.607l-.93.934-.308.155c-.172.081-.326.15-.352.15a.5.5 0 0 0-.133.038c-.18.065-.514.112-.758.112s-.433.017-.433.06c0 .073.261.514.643 1.11.141.21.369.57.514.793.137.223.36.561.489.758.253.386.458.755.557 1.016.069.167.206.6.236.729.013.081.051.081.308-.017.086-.035.292-.125.45-.198.163-.081.296-.141.296-.141.013 0 .874-.407.986-.472.043-.025.111-.047.15-.06.03-.012.073-.03.098-.047.018-.012.082-.042.138-.068.051-.017.192-.082.308-.137.112-.056.304-.142.42-.193.335-.15.819-.394 1.059-.544.124-.073.236-.138.24-.138s.043-.025.081-.047c.039-.03.168-.12.292-.197.296-.197.763-.523.874-.613a1 1 0 0 1 .154-.103c.03-.017.069-.038.073-.047.005-.013.129-.099.275-.193.145-.098.27-.184.278-.205.013-.013-.073-.07-.21-.133-.54-.245-1.071-.558-1.38-.819a9 9 0 0 1-.236-.18c-1.225-.866-1.71-1.376-2.104-2.22zM29.818 39.3c.017.042.068.042.081 0 .009-.013 0-.043-.013-.06-.03-.052-.094.008-.068.06m8.628 11.949a2.24 2.24 0 0 0-1.316-.463c-.66-.021-1.08.052-1.496.266-.21.111-.472.295-.583.416-.099.098-.073.141.111.197.073.025.168.06.21.081.116.06.249.056.429-.03.086-.043.266-.107.394-.141.21-.047.283-.06.665-.056.531 0 .681.03 1.054.223.206.111.193.111.793.056.133-.013.184-.03.193-.056.008-.056-.262-.352-.446-.493zm-19.03-20.714c.21-.056.385-.099.608-.137.069-.013.172-.03.236-.043.326-.078 1.269-.159 1.817-.168.699 0 1.8.138 2.366.305.463.128.93.291 1.046.351a.2.2 0 0 0 .068.026c.069 0 1.076.519 1.325.681a13.48 13.48 0 0 1 1.457 1.033c1.174.943 2.366 2.272 3.013 3.373.069.125.15.253.172.292.072.103.548 1.063.75 1.491.184.39.351.806.45 1.089.03.094.111.317.171.497s.124.352.133.395l.086.282c.038.12.085.266.103.335.017.068.047.171.068.236q.057.188.236.955c.116.476.141.617.193.892.017.137.047.278.06.321a.6.6 0 0 1 .025.142c0 .235.163.587.266.587s.39.124.472.193c.141.111.184.21.167.403-.017.192-.069.27-.373.595-.339.36-.429.472-.587.785-.24.484-.193.48.278-.03.438-.48.6-.656.708-.819.072-.111.098-.163.162-.321.043-.116.107-.643.086-.798-.026-.265-.073-.304-.437-.304s-.249-.03-.33-.193c-.043-.094-.047-.163-.047-.321 0-.159.013-.219.073-.322.133-.218.308-.283 1.002-.377.112-.017.292-.043.395-.06.343-.064.686-.111.819-.111s.26.047.338.214c.056.124.06.184.073.437l.013.296-.099.069c-.047.038-.163.094-.236.132a1.2 1.2 0 0 0-.214.138c-.124.11-.111.317.056.78.086.24.193.33.634.514.21.094.472.214.583.266.103.055.21.098.223.098s.039.009.039.017c.008.013.163.095.347.193.18.095.386.206.45.253.116.086.193.103.193.047s-.279-.338-.502-.501c-.283-.21-1.088-.656-1.183-.656s-.407-.176-.471-.236c-.095-.086-.163-.278-.137-.386.017-.107.141-.235.265-.295a.6.6 0 0 1 .125-.047c.06 0 .197-.095.24-.163.055-.095.06-.275.013-.502-.018-.094-.056-.253-.073-.364a17 17 0 0 0-.215-.973.3.3 0 0 1-.017-.103 1 1 0 0 0-.038-.167c-.026-.064-.056-.18-.082-.253-.017-.073-.056-.184-.073-.248-.017-.06-.047-.172-.072-.249a2 2 0 0 0-.07-.223l-.072-.21c-.021-.069-.073-.236-.124-.373a9 9 0 0 1-.15-.428c-.039-.099-.073-.197-.082-.21a.7.7 0 0 1-.055-.133 6 6 0 0 0-.215-.54.3.3 0 0 1-.03-.086c0-.043-.24-.549-.574-1.23a15 15 0 0 0-1.029-1.787l-.167-.266a14 14 0 0 0-.497-.673c-.18-.249-.403-.527-.707-.883-.339-.407-1.38-1.423-1.77-1.732a18 18 0 0 0-.463-.36c-.047-.03-.202-.137-.347-.235-.142-.095-.305-.197-.352-.236-.098-.06-.698-.394-.724-.394 0 0-.086-.039-.184-.086l-.292-.137c-.06-.026-.206-.082-.308-.125-.112-.042-.236-.094-.283-.11-.043-.018-.095-.04-.12-.04a.14.14 0 0 1-.073-.025 5 5 0 0 0-.575-.172c-.043 0-.085-.017-.15-.038a6 6 0 0 0-.634-.137 11.4 11.4 0 0 0-1.684-.112c-.643 0-.978.009-1.273.056-.506.081-.609.103-.712.133-.051.013-.176.038-.266.06-.278.06-.415.098-1.101.296-.352.098-.922.282-1.333.432a1.4 1.4 0 0 1-.236.073.2.2 0 0 0-.081.039.2.2 0 0 1-.09.038c-.043 0-.086.018-.334.133-.056.022-.108.043-.12.043-.013 0-.082.03-.155.06-.248.125-.124.15.215.047zm9.266 7.727c.111-.047.124-.047.167-.013a1 1 0 0 1 .094.15c.073.168.125.133.125-.09 0-.222.004-.124.025-.124.095 0 .33.305.498.652.055.111.124.24.154.291l.056.086.008-.082q.005-.083-.098-.334a7 7 0 0 0-.138-.334.4.4 0 0 1-.03-.12.3.3 0 0 0-.038-.103c-.069-.129-.159-.549-.124-.549.034 0 .24.193.364.352.073.098.154.197.171.214.035.021.043.021.043-.017s-.013-.086-.137-.36a.6.6 0 0 1-.06-.15c0-.013-.039-.086-.073-.172-.111-.248-.137-.321-.141-.458-.013-.125-.005-.163.12-.514.017-.07.055-.18.073-.253.03-.142.081-.168.137-.06a.8.8 0 0 0 .12.15c.278.295 1.153 1.62 1.226 1.873.03.098.308.604.334.604s.017-.056.008-.15c-.017-.18.013-.197.21-.124.155.055.532.248.643.33.112.081.142.034.073-.112-.025-.064-.073-.18-.098-.266a2 2 0 0 0-.09-.214.2.2 0 0 1-.03-.086c0-.038-.099-.248-.223-.488-.099-.18-.15-.21-.352-.184a.66.66 0 0 0-.304.098l-.133.081-.266-.527c-.295-.583-.347-.672-.501-.895a2 2 0 0 1-.103-.168c0-.025-.163-.24-.308-.432-.296-.37-1.008-1.09-1.076-1.09s-.026.048.085.18c.185.22.262.335.24.378-.004.017-.017.039-.03.039s-.111.068-.227.154c-.518.377-.617.441-.643.429-.03-.018-.171-.18-.351-.42-.262-.335-.497-.61-.54-.61s-.056.022 0 .155c.086.184.111.27.223.66.03.103.068.21.081.249.039.081 0 .103-.193.124-.235.03-.415.069-.476.099-.08.043-.124.004-.274-.223-.15-.236-.321-.433-.338-.407-.018.013.025.094.265.514a8 8 0 0 1 .236.429l.06.137-.081.111a9 9 0 0 1-.502.626c-.073.081-.137.167-.137.193s.03.098.069.163c.038.06.111.184.162.274.056.086.138.214.18.291a.7.7 0 0 1 .086.142c0 .013.017.043.039.069.038.034.094.042.608.042h.562l.081.12c.043.06.107.167.142.227.154.296.184.348.214.348q.064.002 0-.253c-.047-.176-.047-.523-.008-.553.012-.004.085-.043.154-.073zm-9.45 1.273c.034.086.09.253.132.373.043.116.103.296.133.403.034.111.064.197.081.193.013 0 .022-.124.03-.296.009-.266.013-.296.048-.291.025.004.06.043.081.085.073.155.056.15.54.138.549-.013 1.333.03 1.41.081.069.047.163.193.33.527.073.142.142.253.155.253.012 0 .017-.081.012-.18-.012-.099-.03-.266-.055-.377a26 26 0 0 0-.266-1.179c-.026-.12-.06-.253-.073-.308a.6.6 0 0 0-.043-.163 2 2 0 0 1-.06-.21l-.081-.262c-.035-.137-.146-.514-.167-.587-.013-.03-.03-.056-.043-.056-.017 0-.026.052-.013.142.004.081.021.248.03.373.013.184-.082.257-.283.21a5 5 0 0 0-.793-.137c-.617-.082-.737-.095-1.007-.103l-.279-.017-.017.12c-.03.244.047.904.137 1.071.013.026.047.116.073.206zm13.865 30.452c.162-.055.458-.197.625-.308.36-.24.892-.784.892-.913s-.03-.18-.069-.33c-.03-.15-.081-.364-.111-.489l-.099-.42a3 3 0 0 1-.043-.248c0-.026-.017-.125-.038-.206a.8.8 0 0 1-.039-.214c0-.142-.047-.15-.236-.03-.085.055-.252.158-.364.227-.111.068-.236.15-.278.18s-.108.068-.138.081a3 3 0 0 0-.355.215c-.42.24-.738.437-.922.561-.244.171-.471.403-.497.502-.043.17.116.642.339.99.098.154.334.347.463.385.235.069.672.082.865.017zM19.004 30.65c.021-.038-.009-.055-.047-.038-.026.008-.039.026-.026.038.017.03.047.03.073 0m-3.883 7.972a.09.09 0 0 0-.039.073c0 .026-.017.06-.038.086-.017.03-.056.12-.086.197-.026.082-.094.257-.141.394s-.103.305-.125.373c-.017.069-.047.155-.06.197a1 1 0 0 0-.038.163c-.013.09-.039.06.386.54.111.125.141.129.445.056.429-.103.947-.184 1.029-.163.06.013.069.022.069.262 0 .36.042.428.098.137.06-.352.069-.377.167-.416a5 5 0 0 1 .305-.09c.111-.03.278-.081.372-.111.403-.138.515-.168.562-.138.03.013.056.043.056.069s.03.103.068.193c.043.081.112.231.154.33a.7.7 0 0 0 .103.18c.009 0 .013-.18-.025-.587a.8.8 0 0 1 0-.215q.018-.045.068 0c.026.026.047.069.047.09 0 .043.082.249.236.575.017.043.056.128.081.193.108.24.133.098.07-.322-.104-.681-.125-.998-.125-2.426 0-1.427-.005-1.388-.03-1.363-.022.013-.052.099-.069.185-.026.094-.06.248-.09.338l-.068.249c-.013.043-.052.15-.086.236-.064.167-.223.664-.304.934-.056.206-.112.253-.305.321a6 6 0 0 1-.518.142l-.296.081a.6.6 0 0 1-.142.026c-.012-.026.022-.249.078-.506.017-.081.038-.18.038-.206s.009-.094.017-.137c.013-.038.052-.188.082-.321.026-.137.098-.416.15-.613.056-.202.094-.39.094-.416-.013-.085-.051-.068-.086.039-.051.128-.248.806-.295.99a2 2 0 0 1-.073.261c-.022.06-.069.253-.112.433a5 5 0 0 1-.09.339c-.03.038-.488-.163-.81-.347q-.641-.361-.711-.305zm25.125 28.567c.017.038.06.03.06-.013s-.013-.039-.026-.047c-.03-.022-.06.03-.039.06zM17.37 36.984c-.013-.013-.03-.026-.043-.026-.026 0-.03.082-.008.112.025.017.068-.056.047-.086zm-4.89 1.762c0 .012.008.025.017.025s.03-.013.043-.025c.004-.013-.005-.026-.026-.026s-.039.013-.039.026zm-.673-2.893c.043-.039.047-.056.03-.069s-.052.004-.082.03c-.081.094-.051.111.052.039m7.513 5.623c.013-.013.013-.039.009-.056-.013-.017-.03-.017-.043-.009-.017.018-.017.035-.009.056.013.017.022.017.043.009m.189 1.35c.038.218.176.793.21.917.017.06.038.129.038.154 0 .026.03.168.073.318.039.141.078.295.09.347.099.347.292.96.352 1.101.008.026.055.15.098.275.043.124.09.252.112.295.013.043.068.163.111.262.167.377.519 1.084.63 1.256.043.06.107.068.36.03.086-.018.223-.035.309-.043.111-.013.146-.03.154-.06.009-.039-.098-.236-.18-.33a16 16 0 0 1-.304-.51c-.052-.086-.103-.172-.124-.193-.018-.017-.03-.043-.03-.056s-.095-.18-.206-.377c-.193-.339-.562-1.063-.562-1.102 0-.038-.064-.141-.137-.304-.073-.154-.18-.403-.236-.544a14 14 0 0 0-.21-.502.6.6 0 0 1-.038-.137.15.15 0 0 0-.039-.09.3.3 0 0 1-.043-.111c-.012-.03-.055-.172-.098-.309-.163-.459-.223-.643-.236-.707a1 1 0 0 0-.047-.142.4.4 0 0 1-.03-.098c0-.043-.129-.484-.154-.532-.035-.064-.069-.055-.069.017s.043.326.124.768l.073.407zm28.292 3.167c.013 0 .03-.013.043-.025.017-.039-.013-.155-.043-.138s-.03.163 0 .163m-11.581-7.74c.026.081.056.167.073.206.017.03.039.072.047.09.026.06.09.055.172-.013.072-.06.085-.06.252-.047.099.012.206.038.24.055.039.017.086.03.112.03a.6.6 0 0 1 .15.056c.06.03.163.081.223.12.137.069.685.591.805.767.052.064.142.197.21.296.13.193.223.291.25.266a2 2 0 0 0-.074-.253c-.111-.309-.184-.587-.184-.673v-.069l.056.069c.21.261.283.364.458.643.292.463.879 1.77 1.256 2.773.073.193.12.304.15.377.039.094.069.171.103.283.017.047.064.167.098.261.138.382.24.673.45 1.312.125.364.228.694.24.72.018.047.052.145.253.78.043.141.086.283.099.309.013.025.069.23.137.445.06.219.142.48.172.57.03.095.102.356.167.57.06.219.128.45.154.519.043.141.176.6.21.741l.06.197c.013.056.043.163.069.236l.133.459c.05.18.12.42.15.544s.09.309.12.42c.038.112.098.309.137.446.043.137.115.386.167.544.043.163.128.442.18.617.086.292.116.378.18.545.008.026.056.167.098.308.043.142.12.373.163.51.052.138.108.296.12.36.022.06.069.21.112.335.064.193.206.656.278.93.013.047.043.167.069.261.03.095.06.232.081.296.013.069.039.176.056.236s.073.261.111.445c.043.185.086.373.1.42.03.116.093.4.14.63.018.112.056.254.073.322.017.073.039.154.039.18s.013.12.03.197c.039.167.107.485.137.665.013.068.043.21.06.308.017.103.056.279.073.394.026.116.056.266.069.33.017.069.038.193.047.275.013.086.038.248.06.364.017.116.047.292.06.386s.03.223.043.283c.012.064.038.197.047.295.128.905.171 1.252.193 1.385a.7.7 0 0 0 .025.18c.03.047.06-.017.06-.15s-.017-.279-.038-.437c-.017-.163-.043-.377-.047-.472-.013-.094-.03-.283-.048-.42-.017-.137-.047-.351-.06-.484-.025-.219-.068-.502-.124-.917-.017-.086-.034-.249-.056-.36-.012-.112-.042-.283-.06-.395l-.055-.36a5 5 0 0 0-.12-.613 1 1 0 0 1-.03-.197.6.6 0 0 0-.026-.141 1 1 0 0 1-.047-.215 14 14 0 0 1-.06-.338c-.026-.099-.047-.253-.069-.334a.6.6 0 0 0-.047-.185.3.3 0 0 1-.017-.103c0-.03-.034-.167-.069-.304-.03-.137-.068-.304-.081-.373-.026-.15-.069-.317-.171-.72l-.12-.446a24 24 0 0 0-.438-1.461c-.064-.18-.141-.437-.184-.583-.047-.142-.09-.283-.103-.309a5 5 0 0 0-.094-.308c-.043-.142-.09-.304-.112-.36-.017-.056-.055-.167-.072-.249-.026-.081-.056-.193-.073-.248-.017-.056-.047-.15-.06-.21-.043-.159-.099-.339-.137-.485l-.198-.668-.068-.236c-.026-.073-.077-.253-.12-.394s-.095-.305-.103-.36c-.017-.056-.056-.198-.099-.322-.038-.124-.09-.304-.12-.394-.021-.094-.081-.266-.111-.377a1.3 1.3 0 0 1-.06-.253c0-.022-.013-.056-.026-.06-.017-.005-.026-.03-.026-.056 0-.039-.115-.429-.18-.613-.012-.043-.038-.111-.047-.163-.025-.12-.09-.308-.141-.471a13 13 0 0 1-.124-.395l-.103-.334a26 26 0 0 1-.215-.656 11 11 0 0 0-.162-.484c-.082-.218-.146-.42-.155-.446-.004-.025-.021-.072-.03-.098a5 5 0 0 1-.098-.274 3 3 0 0 0-.12-.305.4.4 0 0 1-.03-.12.5.5 0 0 0-.043-.133c-.026-.047-.056-.124-.073-.167-.021-.043-.077-.206-.133-.36a5 5 0 0 0-.133-.33 3 3 0 0 1-.073-.184c-.025-.077-.068-.18-.085-.223a.4.4 0 0 1-.03-.112.1.1 0 0 0-.026-.055.6.6 0 0 1-.06-.15c-.026-.069-.081-.193-.111-.275a5 5 0 0 1-.112-.261 2 2 0 0 1-.073-.184c-.017-.043-.043-.099-.06-.137-.098-.24-.278-.652-.296-.686-.012-.026-.03-.069-.047-.103-.038-.086-.193-.437-.265-.583-.03-.069-.12-.261-.198-.42-.231-.497-.317-.673-.514-1.084a4 4 0 0 1-.184-.403c0-.013-.026-.043-.047-.082-.082-.098-.069-.133.03-.081.073.043.167.073.437.163.073.025.154.047.184.06.026.013.107.043.184.073.073.03.155.06.185.072.021.013.094.039.154.06.056.022.171.069.261.112.082.038.215.103.305.133.081.038.184.077.24.103.163.068.223.051.377-.09.15-.138.42-.442.433-.489.017-.051.081 0 .137.103a468 468 0 0 1 1.307 2.644c.03.073.099.227.154.348.048.12.138.317.198.445.055.133.133.296.163.373.03.073.068.163.085.184a.24.24 0 0 1 .039.099.16.16 0 0 0 .038.099.2.2 0 0 1 .039.09c0 .021.013.043.039.043.025 0 .038-.013.025-.056-.017-.099-.171-.515-.364-.999-.103-.261-.21-.527-.236-.596s-.047-.137-.06-.15a1 1 0 0 1-.081-.184 8 8 0 0 0-.227-.561 2 2 0 0 1-.056-.142c0-.004-.039-.086-.073-.171a1.3 1.3 0 0 1-.073-.172c0-.013-.038-.09-.073-.18a1 1 0 0 1-.072-.171c0-.009-.03-.073-.06-.142a.5.5 0 0 1-.06-.137c0-.013-.04-.098-.082-.193-.176-.377-.193-.42-.21-.484-.009-.039-.026-.073-.039-.081-.03-.018-.021-.138.009-.138s.026.013.026.018c0 .012.073.111.171.214.365.407.695.891.977 1.431.099.193.185.36.185.365 0 .013.017.064.042.103.048.072.725 1.59.798 1.778.051.129.098.206.124.18.03-.03-.099-.416-.386-1.118a15 15 0 0 1-.171-.433c-.077-.197-.073-.184-.223-.54a2 2 0 0 1-.111-.283.3.3 0 0 0-.039-.099c-.017-.038-.077-.154-.12-.266a6 6 0 0 0-.099-.248 2.6 2.6 0 0 1-.167-.862c0-.27 0-.244.039-.235.021.004.098.098.167.214.163.283.236.381.274.351.026-.025.017-.055-.124-.462-.069-.202-.142-.506-.124-.528.021-.025.064.017.167.206.064.099.12.184.133.184s.017.013.017.026a.6.6 0 0 0 .081.142c.043.068.116.188.167.265.043.082.129.223.185.309.18.283.42.75.81 1.564.085.176.128.245.15.223.017-.017.013-.06-.013-.15a32 32 0 0 0-.352-.836 8 8 0 0 0-.154-.334 40 40 0 0 0-.758-1.573c-.099-.184-.18-.403-.155-.428.017-.022.039.004.197.24.168.24.296.385.335.36.021-.013.021-.026-.009-.06a.6.6 0 0 1-.081-.172c-.043-.15-.039-.364.03-1.029.055-.574.025-.792-.155-1.045a.4.4 0 0 1-.055-.095.3.3 0 0 0-.069-.098c-.038-.052-.06-.094-.047-.099.013-.013.154.154.279.33.038.056.12.167.171.249.142.193.377.531.459.647.03.051.098.154.154.236.047.073.09.141.09.154s.013.03.03.056a1 1 0 0 1 .103.171l.141.24c.112.18.557 1.093.742 1.543.094.227.596 1.496.638 1.62l.06.155c.017.043.039.085.039.094 0 .017.124.377.171.493.005.026.022.073.03.098s.039.112.069.185c.026.072.06.167.073.21.004.043.03.107.043.15.068.18.347 1.058.497 1.573.124.394.287 1.045.441 1.753.017.102.06.055.06-.073 0-.129-.025-.253-.205-.986a19 19 0 0 0-.292-1.131c-.03-.09-.124-.408-.21-.7-.094-.29-.21-.68-.274-.865a25 25 0 0 0-.386-1.097c-.013-.03-.034-.099-.056-.154a51 51 0 0 0-.544-1.3 2 2 0 0 1-.069-.18c0-.03-.415-.92-.595-1.28-.15-.292-.437-.82-.583-1.055-.262-.433-.913-1.324-1.153-1.586-.167-.18-.579-.643-.819-.93a3 3 0 0 0-.214-.227c-.051-.034-.073.047-.026.099.052.06.437.763.51.917.086.21.107.433.086 1.118a8 8 0 0 1-.026.665c-.008.026-.021.026-.056.008-.03-.012-.047-.038-.047-.047 0-.026-.03-.068-.252-.42-.163-.244-.922-1.209-.978-1.23-.017-.004-.03-.026-.03-.043s-.017-.038-.038-.038c-.043 0-.047.064-.013.102.081.1.171.228.171.24 0 .013.043.082.103.155.056.068.112.15.133.171.013.026.09.137.18.253.082.116.154.214.154.227s.035.056.073.103a.5.5 0 0 1 .073.112c0 .012.043.072.099.15.098.137.12.184.068.184S41.686 35.66 41 34.94c-.274-.287-.502-.515-.514-.515-.06 0 .025.133.445.669.172.218.528.707.588.806.025.043.068.107.085.133.06.072.18.372.163.42-.013.03-.038.038-.103.017-.39-.069-.531-.086-.643-.086h-.124l-.026.142c-.038.17-.073.278-.102.278-.03 0-.198-.197-.588-.686-.308-.398-.428-.514-.428-.428 0 .085.098.171.227.36.124.184.24.364.266.394.184.291.274.441.377.613.111.184.111.206.081.253a6 6 0 0 1-.54.574c-.111.099-.133.103-.236.094-.068-.012-.15-.025-.18-.038a5 5 0 0 0-.21-.06c-.085-.026-.261-.073-.385-.112a6 6 0 0 0-.395-.102l-.295-.069c-.069-.017-.155-.026-.185-.013-.047.013-.072 0-.102-.043-.035-.055-.24-.39-.305-.51a34 34 0 0 0-.476-.75c-.038-.064-.085-.128-.098-.15-.013-.026-.022-.03-.043-.013-.017.017.004.103.081.283.06.142.125.326.15.407.056.215.099.63.099.939.009.231 0 .274-.034.274-.42-.103-.883-.18-1.157-.18-.275 0-.313.005-.24.155.017.038.055.137.085.214zM4.281 4.916c.626.437 1.26 1.093 1.26 1.959v27.61c0 .866-.634 1.522-1.26 1.959a.35.35 0 0 0 .202.639H7.81c.279-.407.643-.9 1.114-1.449a1.92 1.92 0 0 1-.403-1.153V12.305l3.395 15.846c-.244.368-.587.672-.93.908a.35.35 0 0 0 .201.639h5.7q.658-.322 1.347-.617-.013-.014-.03-.022c-.626-.437-1.26-1.093-1.26-1.959V6.468c.158-.669.69-1.188 1.212-1.552a.35.35 0 0 0-.201-.639h-5.053c-.343 0-.485.446-.202.64.626.436 1.26 1.092 1.26 1.958v16.14L9.949 4.278h-5.47c-.342 0-.484.446-.2.64zm35.433 30.757c.013 0 .026-.013.026-.026s-.013-.026-.026-.026c-.017 0-.026.013-.026.026s.005.026.026.026m8.006 9.982q.063.062.056-.086c-.013-.137-.068-.154-.068-.026 0 .129.004.103.012.112M18.533 15.443c0-8.958 2.507-11.337 5.601-11.337 3.095 0 5.602 2.379 5.602 11.337s-2.507 11.336-5.602 11.336c-3.094 0-5.601-2.379-5.601-11.336m3.553 0c0 7.77.917 9.836 2.049 9.836s2.048-2.066 2.048-9.836-.917-9.837-2.049-9.837-2.048 2.066-2.048 9.837m22.574.758a26 26 0 0 0 1.085 2.392c.497 1.015.861 1.688 1.598 2.983 2.165 3.814 3.155 5.829 3.776 7.68.296.883.446 1.53.553 2.32.077.54.082 1.413.013 1.773-.227 1.222-.913 1.736-1.997 1.505-.605-.133-1.102-.433-1.65-.99-.536-.54-1.025-1.277-1.505-2.255-.643-1.298-1.153-2.738-1.8-5.04-.12-.42-.24-.806-.27-.849-.069-.12-.137-.162-.266-.162-.128 0-.12.012-.171.077l-.064.081v7.428l.231.321c.124.172.347.485.484.695.163.244.309.428.416.527.497.458 1.303 1.007 1.869 1.273.111.055.433.214.711.364.883.467 1.556.686 2.319.75.232.026.844.017 1.046-.004a4.6 4.6 0 0 0 2.734-1.346c1.072-1.084 1.599-2.662 1.599-4.77 0-2.11-.043-1.432-.094-1.89-.227-2.23-1.038-4.137-3.986-9.344-2.876-5.075-4.042-7.586-4.445-9.55-.188-.925-.223-2.147-.064-2.755.163-.643.574-.939 1.299-.939.724 0 .964.193 1.435.575.279.214.699.647.982 1.002 1.286 1.595 2.619 4.475 3.317 7.197.107.407.137.484.253.548a.35.35 0 0 0 .364-.017l.069-.051.009-5.572c.004-5.272 0-5.585-.04-5.666-.063-.112-.192-.202-.312-.202-.257 0-.549.15-1.166.617-.621.468-.938.643-1.178.643s-.54-.132-.978-.385a6.4 6.4 0 0 0-1.534-.682c-.484-.146-.729-.184-1.286-.184-1.478 0-2.623.428-3.437 1.273-.965 1.003-1.385 2.541-1.299 4.736.077 1.907.493 3.716 1.372 5.906zM30.366 4.916c.626.437 1.26 1.093 1.26 1.959v15.022c0 2.675 2.298 4.844 4.976 4.844 2.68 0 5.105-2.17 5.105-4.844V6.532c.142-.699.686-1.239 1.226-1.616a.35.35 0 0 0-.202-.639H37.82c-.343 0-.485.442-.202.64.626.436 1.26 1.092 1.26 1.958v16.63c0 .964-.913 1.744-1.877 1.744s-1.744-.78-1.744-1.744V6.625c.107-.746.677-1.316 1.243-1.71a.35.35 0 0 0-.202-.639h-5.743c-.343 0-.484.442-.201.64zm10.625 59.846c-.004-.034-.017-.06-.03-.056-.038.004-.047.073-.03.124.026.056.073 0 .06-.068m-.574 2.104a.14.14 0 0 0 .039-.085c0-.03.008-.06.017-.073.081-.086.45-1.436.45-1.646s-.043-.099-.125.227a28 28 0 0 1-.394 1.393c-.056.15-.047.236.013.184m2.075-2.533c.017-.004.042-.116.068-.278.142-.883.18-1.346.18-2.118.009-1.033-.099-2.468-.18-2.494-.03-.013-.03.026-.017.21.06.831.069 1.217.06 2.276-.013 1.058-.017 1.2-.081 1.675-.073.588-.082.742-.03.725zm-.043.124c-.013 0-.03.013-.039.03 0 .013.013.026.039.026.025 0 .038-.013.03-.026-.005-.017-.017-.03-.03-.03m2.331-23.543c-.013.013-.017.035-.013.056.017.03.095.039.095.009a.13.13 0 0 0-.026-.056c-.021-.026-.03-.03-.056-.009m-4.436 26q-.038 0-.038.072t.038.073q.039-.001.039-.073t-.039-.073m4.38-26.085c.03.034.04.025.04-.043 0-.03-.014-.06-.027-.06-.03 0-.038.077-.013.103m-1.2 2.023c0 .025.005.047.026.047.022 0 .026-.026.026-.047s-.013-.047-.026-.047c-.017 0-.026.025-.026.047m.57-.472c0 .026.005.047.026.047.022 0 .026-.017.026-.038 0-.022-.013-.043-.026-.047q-.026-.007-.026.038M8.68 40.314c.047-.124.484-.977.557-1.114.03-.064.125-.206.197-.322.073-.115.15-.24.172-.278a4 4 0 0 1 .248-.377c.009-.005.048-.073.099-.15.33-.519.861-1.205 1.337-1.715.33-.347.386-.463.137-.261-.261.214-.78.69-1.453 1.35-.377.364-.891.861-1.144 1.101-.253.249-.459.46-.459.472a.3.3 0 0 1-.047.086 3 3 0 0 0-.15.278l-.163.322c-.038.06-.102.227-.162.373-.056.141-.125.308-.15.373q-.109.272-.043.274c.043 0 .094-.06.154-.163.081-.137.051.111-.039.321-.03.069-.072.215-.072.24 0 .052.047.013.192-.137.155-.163.21-.171.138-.03a.5.5 0 0 0-.039.12.1.1 0 0 1-.026.056 1 1 0 0 0-.073.184c-.111.317-.222.609-.274.729-.013.026-.06.163-.103.296-.043.137-.094.282-.111.334-.107.296-.253.861-.253.973s.051.068.111-.103c.12-.33.193-.506.21-.532a.1.1 0 0 0 .026-.068c0-.026.034-.107.069-.184.073-.142.445-.948.557-1.196.03-.077.081-.189.111-.253a1 1 0 0 0 .056-.133c0-.013.163-.377.266-.621.043-.082.094-.193.12-.249zm2.987-4.32a.03.03 0 0 0 .026-.026c0-.013-.013-.03-.026-.038-.017-.005-.025 0-.025.025s.004.039.025.039m4.775 24.499c0-.03-.291-.184-.338-.184s-.065-.013-.1-.039a1 1 0 0 0-.18-.06l-.21-.06c-.085-.03-.098-.03-.273.047-.099.043-.193.09-.198.112-.03.042.129.171.275.223.124.047.218.047.797.012q.226-.02.227-.047zm-.866.578c.056 0 .099-.025.163-.085.142-.142.099-.236-.068-.124a.5.5 0 0 1-.133.06c-.022 0-.039.025-.039.072s.009.073.073.073zm8.907 18.55a2 2 0 0 0 .133-.317c0-.137-.193-.038-.51.262-.305.282-1.046 1.183-1.41 1.701-.052.073-.125.184-.172.249-.043.068-.116.193-.167.283l-.065.124h.25l.402-.433c.921-.986 1.363-1.517 1.543-1.869zm7.243-1.564c.24-.291 1.744-1.787 2.109-2.104.103-.09.205-.172.274-.283-.497-.133-1.316.531-1.714.758-.639.365-1.286.729-1.925 1.093-1.281.729-2.559 1.475-3.793 2.28q-.027.021-.043.005c-.017-.013.069-.18.133-.253.026-.026.094-.124.15-.223.077-.137.103-.193.103-.291 0-.1-.013-.12-.039-.12-.073 0-.278.137-.544.36s-.446.407-.917.951c-.124.141-.33.364-.446.501-.42.468-.784.875-.934 1.055l-.112.137h4.333l.193-.223c.125-.15.639-.673 1.136-1.17a11.8 11.8 0 0 0 1.466-1.736c.098-.15.343-.458.57-.737M13.818 53.155l.081-.068-.068-.043c-.034-.026-.103-.082-.154-.12l-.082-.073-.017-.652h-.111a.31.31 0 0 0-.283.198c-.043.085-.047.141-.047.433.004.557.06 1.032.15 1.225.012.043.047.125.072.18a.7.7 0 0 0 .125.193l.085.09.21-.013c.172-.013.228-.025.348-.09.197-.111.214-.141.124-.197-.163-.098-.364-.433-.463-.754-.06-.197-.056-.236.03-.309m-.789 2.087c-.017.24.013.275.112.125.056-.082.308-.304.458-.395.039-.025.069-.055.069-.072 0-.056-.09-.043-.214.025l-.103.069-.039-.09c-.038-.082-.141-.159-.18-.133-.03.03-.081.279-.098.476zm1.42 4.69c.06.192.406.552.406.42s-.056-.095-.124-.185c-.133-.167-.197-.296-.223-.407a.13.13 0 0 0-.056-.069q-.089-.018-.004.24M48.71 73.003c.038-.133 0-.167-.052-.047-.021.051-.034.098-.03.107q.038.082.082-.06m-.528-11.945c.176 2.974 1.149 5.37.785 9.335-.056.621-.052.591-.099 1.195-.013.138-.163 1.055-.15 1.149.004.043.094-.176.107-.231.146-.613.21-1.106.274-1.608.078-.6.172-1.376.18-2.048.018-1.552-.098-2.43-.33-3.725-.197-1.127-.62-2.833-.762-4.067zm.395 12.348c.012.004.034 0 .047-.009.03-.026.047-.146.013-.141-.035.004-.09.137-.06.15m5.606-3.536c.098.977.12 1.624.081 2.477-.026.6-.056 1.277-.158 1.942-.172 1.14-.66 2.67-1.072 3.373-.304.634-.784 1.225-1.509 1.851-.184.159-.373.3-.553.433-.334.249-.651.48-.844.776-.115.18-.141.428-.133.711 0 1.068.125 1.428-.403 1.428h-36.44a.625.625 0 0 1-.625-.605l-.013-.321a.64.64 0 0 1 .176-.455c.064-.068.484-.39.694-.604.583-.604.977-1.217 1.385-2.156a4.5 4.5 0 0 1-.515.305c-.3.15-.484.214-.861.308h-.009c-.283.064-.433.073-1.007.073s-.724-.004-1.037-.09c-.146-.038-.313-.094-.382-.116-.013 0-.025-.008-.038-.012l-.052-.018c-.017-.004-.038-.013-.056-.017a2 2 0 0 1-.42-.18 3.7 3.7 0 0 1-1.071-.823 3.5 3.5 0 0 1-.686-1.144v-.013a4 4 0 0 1-.18-.801l-.03-.009a.7.7 0 0 1-.347-.094c-.034-.013-.107-.043-.266-.099a7 7 0 0 1-.544-.201l-.043-.018c-.038-.017-.068-.034-.081-.038-.077-.026-.172-.073-.313-.141-.716-.356-1.483-.896-1.955-1.385a7.5 7.5 0 0 1-.681-.814c-.189-.262-.57-1.072-.677-1.397-.15-.455-.292-1.06-.326-1.406v-.009c0-.017-.009-.081-.03-.244-.009-.056-.03-.223-.034-.904-.005-.755.017-.84.034-.91 0-.012.009-.025.013-.038a1 1 0 0 0 .026-.077.66.66 0 0 1 .291-.326v-.021c0-.797.009-.909.12-1.492.073-.368.291-1.054.489-1.328 0 0 .008-.009.008-.013.034-.069.073-.137.124-.214.03-.052.112-.18.176-.262 0-.004.099-.128.189-.257 0 0 .004-.009.008-.009.116-.158.309-.39.45-.548.06-.069.146-.163.223-.245.107-.11.275-.282.553-.282.279 0 .193.021.283.068q.02.01.034.017l.06.039a.63.63 0 0 1 .21.737 4 4 0 0 1-.184.416v.009a3.2 3.2 0 0 0-.343.998c-.038.21-.047 1.106-.008 1.32.12.686.291 1.072.63 1.415.261.257.411.351.72.454.055.013.265.038.544.038s.326-.012.351-.02h.005c.248-.057.497-.245.724-.545.193-.257.519-1.016.656-1.608.013-.055.043-.192.064-.304a2.36 2.36 0 0 0 .069-.322c.013-.08.043-.235.073-.364.081-.428.107-.565.128-.715.004-.043.022-.172.047-.27 0-.022.013-.086.022-.155.013-.107.043-.338.077-.535.047-.348.077-.579.12-.926.013-.142.026-.249.051-.343.018-.116.065-.489.099-.814.026-.258.086-.755.111-.995l.009-.055v-.022c.026-.171.081-.66.12-1.089v-.008c.03-.292.073-.69.137-1.264v-.013c.022-.176.039-.33.039-.369 0-.103.017-.313.034-.467v-.026c.017-.107.043-.36.06-.566 0-.047.008-.09.013-.133.017-.222.043-.484.056-.642l.008-.069.034-.399c0-.047.009-.09.009-.133.008-.107.026-.282.043-.467.013-.107.021-.222.03-.321v-.009c.038-.364.068-.647.09-.87-.142-.008-.352-.051-.844-.214q-.009.001-.018-.004l-.188-.065c-.013 0-.026-.008-.035-.013-.548-.15-1.461-.668-1.933-1.041a4 4 0 0 1-.158-.12q-.026-.018-.039-.03l.017.013a4.6 4.6 0 0 1-.467-.433c-.283-.27-.673-.694-.844-.96a8 8 0 0 1-.484-.849c-.048-.094-.103-.214-.146-.304a1.4 1.4 0 0 1-.103-.244c-.004-.017-.017-.047-.03-.078v-.012a7.2 7.2 0 0 1-.386-1.376v-.004c-.103-.592-.107-.759-.107-1.775s.009-1.093.06-1.474c.034-.223.069-.454.077-.54.009-.052.03-.219.073-.347.004-.06.022-.155.069-.382.038-.18.081-.368.12-.514.051-.202.115-.459.163-.587.124-.42.282-.888.351-1.08 0-.009.004-.013.009-.022.03-.077.051-.141.064-.176a.7.7 0 0 1 .111-.295c0-.009.009-.022.013-.035.15-.454.883-1.937 1.269-2.605.231-.412.66-1.063.887-1.376 0 0 .004-.009.009-.009.055-.073.111-.15.145-.193l.026-.034c.18-.253.724-.853 1.102-1.234.557-.566.99-.956 1.641-1.488a39 39 0 0 1 1.59-1.191 18 18 0 0 1 1.089-.72c.103-.069.206-.133.279-.18l.09-.056c.681-.471 2.923-1.62 4.14-2.117.184-.077.501-.215.583-.249.09-.043.274-.107.308-.12l.215-.077a3 3 0 0 1 .347-.133q.058-.019.111-.043c.043-.017.103-.038.129-.047.043-.017.077-.03.116-.043.012-.004.034-.013.042-.013a.2.2 0 0 1 .052-.017c.026-.008.15-.047.355-.115.28-.1.49-.168.716-.232.035-.013.077-.021.155-.043q.071-.022.15-.043h.008l.116-.03c.137-.038.214-.06.446-.12q.057-.017.115-.03c.039-.008.095-.025.112-.03.008 0 .021-.008.03-.008.12-.034.201-.052.27-.056A33.738 33.738 0 0 1 25 28.026q.06-.011.146-.03c.069-.013.15-.03.206-.043q.011.001.03-.004c.09-.017.214-.043.265-.056h.013c.283-.06 1.329-.227 1.68-.257.198-.017.519-.055.84-.094.25-.034 1.033-.047 1.192-.047h.411c.73 0 1.248.034 1.728.115q.013-.001.025.005c.065.013.142.021.163.021.12 0 .322.035.382.047.038.009.09.018.141.026l.257.047h.013c.48.086.647.12 1.183.249.429.098.54.128 1.072.283l.102.03h.01c.732.223.895.278.968.308l.141.047c.034.013.069.022.103.035a5 5 0 0 1 .377.133q.046.02.189.072l.163.065c.21.077.343.133.698.287h.005c.831.369 1.637.81 2.387 1.311.069.043.137.09.197.129.039.026.086.056.103.069q.006.001.013.008c.205.129.801.583 1.183.904.583.48 1.431 1.282 1.753 1.655.081.094.201.231.308.351q.059.07.112.129c.223.253.733.904.853 1.089l.021.034.064.094a8 8 0 0 1 .39.562c.009.012.013.025.022.038.021.043.133.236.266.463.355.609.475.827.788 1.47.317.635.377.78.497 1.076l.009.026q-.001.006.004.013a9 9 0 0 0 .129.313c.004.012.013.025.017.038q.027.063.056.146a13.32 13.32 0 0 0 .48 1.187c0 .004 0 .009.008.013.03.077.125.313.227.583v.008c.168.45.215.583.228.613q.017.046.03.099a7 7 0 0 0 .115.313q.024.067.047.133a7 7 0 0 1 .125.364.3.3 0 0 1 .021.051c.06.168.33 1.063.382 1.333.004.026.017.073.021.095.009.021.013.042.021.064l.065.227c0 .013.008.026.008.039.013.064.043.175.06.235v.013q.008.014.009.022 0 .018.009.038c.02.09.038.163.042.245.039.124.082.32.146.617 0 .008 0 .021.004.03.017.102.047.257.065.334.004.03.017.073.025.12.017.077.039.167.052.236v.008c.008.052.026.129.038.202q.019.078.03.15c.026.107.052.248.056.351a15 15 0 0 0 .086.373c.043.219.06.304.06.386v.013c.017.068.047.21.073.334v.026q.02.117.073.368c.064.313.102.536.115.635v.025c.009.009.009.017.013.03.017.086.047.266.12.626.026.116.047.232.056.287.008.039.038.189.077.352v.017c.039.18.086.403.111.51 0 .013.005.021.009.034.013.077.034.172.051.236.009.026.013.06.022.099.013.047.026.11.038.154 0 .013.009.026.009.043.034.18.051.24.056.257 0 .013.008.026.013.043q.011.059.03.133c.013.064.03.141.043.188 0 .017.008.034.012.052.013.068.039.175.056.24l.009.03c0 .017.008.034.012.047 0 .021.013.073.026.111q.013.066.026.124l.081.356c.022.095.043.193.06.275.039.145.103.424.146.634.009.034.021.09.03.12.021.051.056.146.081.321.022.116.043.227.125.549.017.06.056.206.073.326.008.034.025.09.03.115v.009c.017.06.051.188.077.309v.008l.056.236q.001.012.008.026l.009.025c.021.077.043.15.051.232.009.047.039.193.086.381.077.322.107.45.158.643l.043.176c.026.094.056.201.069.253v.012c.008.04.047.19.197.755.017.069.056.193.077.274.013.047.026.103.043.15a2 2 0 0 1 .03.112c.004.017.013.038.013.055 0 .013.013.052.017.073q.015.058.03.116c.021.073.043.15.06.218.021.073.056.185.077.262 0 .013.009.026.009.038.008.04.017.073.021.09l.026.07c.021.06.043.14.056.192l.012.06c0 .017.018.069.06.21q.002.012.009.03.012.05.03.107c.026.099.056.197.073.283.021.077.038.129.043.142a.4.4 0 0 1 .021.072c0 .013.013.043.017.065.013.038.026.085.039.133v.004c.026.09.073.266.107.398.043.133.077.27.094.335l.005.021c0 .013.017.056.025.082.013.038.022.077.035.115.008.039.021.077.03.125.012.055.03.115.042.158.01.026.013.052.022.082.021.072.043.15.06.201.026.099.051.184.06.274v.017c.3.952.51 1.946.716 2.91l.09.43c.244 1.14.428 2.3.553 3.552zm-.63.068a32 32 0 0 0-.545-3.484c-.235-1.089-.458-2.22-.792-3.288a1 1 0 0 1-.03-.154 1 1 0 0 0-.04-.154c-.016-.069-.055-.193-.08-.279-.026-.085-.056-.214-.073-.283s-.047-.163-.06-.21-.048-.197-.09-.334c-.039-.137-.086-.322-.112-.407-.026-.086-.056-.184-.06-.21a3 3 0 0 1-.068-.223c-.018-.099-.069-.266-.099-.386a3 3 0 0 1-.081-.296c-.013-.047-.03-.111-.043-.15a1.4 1.4 0 0 1-.069-.222c-.026-.086-.06-.21-.081-.275-.013-.06-.043-.163-.06-.223-.013-.06-.043-.162-.056-.222-.017-.06-.047-.185-.073-.275-.026-.085-.06-.214-.081-.283a52 52 0 0 1-.206-.78c-.013-.047-.043-.163-.069-.248-.081-.322-.102-.416-.205-.832a5 5 0 0 1-.099-.463.7.7 0 0 0-.038-.15c-.018-.055-.048-.193-.073-.304a8 8 0 0 0-.069-.274c-.013-.043-.038-.125-.047-.185s-.039-.184-.06-.274a8 8 0 0 1-.137-.604 1 1 0 0 0-.043-.185 1 1 0 0 1-.06-.222c-.047-.236-.112-.51-.142-.618-.047-.214-.124-.544-.15-.655-.012-.069-.042-.185-.055-.262-.017-.073-.056-.214-.073-.321-.026-.099-.056-.253-.073-.335a3 3 0 0 1-.073-.321c-.026-.09-.047-.21-.06-.262a3 3 0 0 1-.06-.282c-.026-.112-.073-.339-.111-.519a6 6 0 0 1-.086-.394c-.009-.043-.026-.155-.047-.262-.086-.428-.12-.613-.133-.681-.013-.073-.047-.305-.12-.643-.017-.09-.056-.274-.073-.394a8 8 0 0 0-.068-.309.7.7 0 0 1-.018-.15c0-.03-.025-.154-.047-.274-.094-.386-.098-.42-.098-.476a1 1 0 0 0-.043-.24c-.017-.099-.056-.266-.073-.373-.017-.099-.056-.261-.073-.347l-.069-.36a10 10 0 0 0-.141-.596.5.5 0 0 1-.017-.124 1 1 0 0 0-.039-.172c-.017-.068-.055-.197-.073-.283a7 7 0 0 1-.068-.248 1.3 1.3 0 0 1-.047-.184 19 19 0 0 0-.36-1.252c-.013-.017-.03-.081-.047-.137-.013-.056-.082-.24-.142-.42-.069-.18-.133-.347-.137-.386-.026-.06-.124-.33-.236-.63a25 25 0 0 0-.223-.57c-.017-.043-.081-.193-.137-.334-.124-.339-.24-.626-.313-.785a2 2 0 0 1-.055-.141c0-.013-.026-.06-.047-.12-.026-.06-.086-.206-.138-.334-.124-.305-.171-.429-.488-1.059a17 17 0 0 0-.767-1.431c-.142-.24-.275-.472-.292-.51a8 8 0 0 0-.347-.498 2 2 0 0 1-.112-.167 17 17 0 0 0-.797-1.016c-.124-.141-.308-.36-.42-.484-.291-.339-1.131-1.132-1.684-1.586-.386-.321-.947-.75-1.115-.853-.042-.026-.184-.124-.321-.21a15 15 0 0 0-2.297-1.26c-.347-.15-.476-.206-.673-.279a11 11 0 0 1-.39-.154 3 3 0 0 0-.305-.103c-.124-.043-.252-.085-.282-.098-.056-.026-.352-.12-.922-.292-.617-.18-.698-.205-1.14-.304a15 15 0 0 0-1.153-.24c-.12-.017-.304-.056-.407-.073a3 3 0 0 0-.279-.038c-.043 0-.18-.013-.291-.039-.519-.086-1.085-.12-2.032-.103-.51.009-1.007.026-1.114.043-.334.043-.664.081-.866.099-.33.03-1.346.192-1.607.248a6 6 0 0 1-.296.06c-.111.026-.274.056-.36.073a36.585 36.585 0 0 0-1.852.42c-.068.017-.15.039-.17.039a1 1 0 0 0-.164.038c-.055.017-.18.047-.265.073-.292.073-.335.086-.558.15-.124.039-.261.073-.295.086-.223.06-.429.133-.695.223-.167.055-.338.111-.386.124l-.137.047c-.03.013-.154.056-.274.099-.124.043-.261.09-.296.111-.043.017-.163.06-.261.099-.103.038-.223.081-.262.098-.081.039-.407.18-.604.262-1.209.493-3.39 1.616-4.025 2.053-.042.03-.214.137-.385.248-.446.279-.853.545-1.055.695a6 6 0 0 1-.278.197c-.206.141-1.114.823-1.286.973-.643.527-1.059.904-1.599 1.448-.407.416-.904.973-1.041 1.166a5 5 0 0 1-.18.24c-.21.283-.626.917-.849 1.312-.403.698-1.097 2.121-1.221 2.494a.7.7 0 0 1-.082.18c-.013.013-.017.039-.017.056s-.043.163-.098.304c-.073.21-.228.669-.348 1.063-.025.06-.111.39-.15.544-.073.296-.171.755-.171.806s-.013.086-.026.125a1 1 0 0 0-.047.24 17 17 0 0 1-.081.548c-.048.339-.056.459-.056 1.385s.008 1.131.098 1.671c.082.45.185.832.352 1.26.03.073.056.15.056.154 0 .013.094.206.205.433.172.352.266.51.446.785.124.193.463.574.754.853.185.184.36.347.378.36l.21.163c.458.364 1.311.831 1.731.938.039.013.155.047.262.086.39.133.664.206.72.18.025-.009.017-.017-.013-.03-.137-.056-.446-.291-.626-.471-.103-.12-.261-.305-.339-.42a8 8 0 0 1-.544-.978 5 5 0 0 1-.09-.223c-.026-.06-.056-.137-.068-.163a7 7 0 0 1-.198-.548c-.055-.154-.06-.253-.017-.253.017-.009.082.103.155.24.291.57.754 1.166 1.285 1.646.339.309.879.737.939.737s.043.026.073.06l.068.056-.017.308c-.013.305-.047.712-.141 1.603-.026.266-.06.622-.073.78-.013.163-.03.408-.043.545s-.043.45-.06.707c-.026.253-.056.587-.081.741-.017.155-.03.335-.03.395s-.018.261-.043.446c-.06.56-.103.964-.137 1.26-.039.394-.095.921-.125 1.127-.025.21-.09.767-.12 1.041-.038.352-.098.875-.111.909a1.3 1.3 0 0 0-.039.253c-.043.364-.072.6-.124.956-.03.184-.06.415-.073.514-.013.103-.03.206-.038.227-.009.017-.026.12-.039.21a16 16 0 0 1-.137.754c-.026.12-.056.275-.069.348a6 6 0 0 1-.072.347c-.026.12-.056.253-.07.308-.14.639-.496 1.492-.766 1.852-.317.416-.686.681-1.085.771-.253.06-1.015.043-1.23-.03-.416-.137-.643-.282-.973-.608-.433-.437-.664-.939-.805-1.753-.048-.283-.043-1.26.012-1.547.099-.49.168-.7.395-1.158.098-.205.171-.373.163-.377-.026-.017-.532.557-.725.819-.085.124-.18.248-.197.274-.068.09-.236.36-.236.377s-.03.056-.06.099c-.111.154-.313.728-.385 1.084-.103.54-.112.617-.112 1.376s.013.909.099 1.273c.111.45.163.583.364.99.253.519.596.96.999 1.299.291.24.403.317.737.475.36.18.463.21.96.318.459.098.951.072 1.599-.069.24-.06.891-.339 1.187-.514.227-.138.274-.168.36-.223a6.45 6.45 0 0 0 1.954-2.152c.142-.24.249-.458.313-.613.03-.068.069-.12.086-.12.047 0 .047-.013.008.249-.068.399-.214 1.007-.265 1.054-.013.013-.017.043-.017.069a.4.4 0 0 1-.043.137 1 1 0 0 0-.069.167 10 10 0 0 1-.518.977c-.24.373-.365.527-.729.892-.656.651-1.187.964-1.942 1.144-.24.06-1.041.06-1.285.009-.275-.06-.862-.24-.922-.279-.03-.013-.068-.03-.086-.03-.038 0-.574-.261-.797-.39-.321-.18-.501-.321-.818-.626-.43-.415-.67-.737-.91-1.213a4 4 0 0 1-.248-.625 5.7 5.7 0 0 1-.223-.986 2 2 0 0 0-.047-.274c-.013-.047-.017-.133-.025-.185a.7.7 0 0 0-.018-.15q-.018-.044-.038.013c-.026.099-.017 1.38.013 1.56.013.086.03.215.038.283.03.296.163.862.296 1.273.099.296.459 1.042.596 1.23.15.21.45.57.617.737.433.446 1.149.948 1.787 1.26.125.06.227.112.236.112s.081.03.167.073c.086.038.317.124.51.184.184.069.352.133.364.141.013.013.056.018.086.018s.099.013.137.025c.043.013.142.043.215.06.21.056.21.06.248.386.026.266.082.527.163.767.24.682.776 1.282 1.449 1.62.197.099.253.125.334.142.026.013.09.03.154.056.056.017.21.068.348.103.227.06.261.068.874.068s.656-.008.866-.056c.33-.081.471-.133.728-.261.793-.394 1.543-1.157 1.95-1.963.163-.322.249-.377.193-.133-.047.261-.141.664-.21.947-.073.309-.291.99-.403 1.26-.501 1.252-.964 1.998-1.675 2.735-.223.223-.463.458-.545.527l-.068.069v.325h36.195s-.008-.205-.008-.321v.008c-.052-.531-.09-1.088.201-1.534.373-.574 1.003-.896 1.513-1.337.544-.472 1.059-1.02 1.363-1.676.364-.6.84-2.075 1.003-3.176.094-.621.124-1.252.15-1.877.038-.819.017-1.44-.077-2.383zM22.63 67.128c-.124.017-.351.047-.51.073-.163.02-.399.055-.523.077-.133.025-.309.047-.394.06-.09.013-.279.038-.42.06-.497.073-.66.09-.952.111-.167.013-.42.039-.57.047a7.6 7.6 0 0 1-1.598-.043c-.168-.025-.545-.154-.656-.227a3 3 0 0 0-.163-.09c-.163-.09-.489-.42-.634-.643a6 6 0 0 1-.305-.488c0-.013-.038-.069-.073-.137a6 6 0 0 1-.227-.403l-.278-.502c-.905-1.628-1.179-2.156-1.659-3.197-.167-.364-.364-.866-.416-1.063-.013-.043-.038-.103-.047-.15a4 4 0 0 1-.15-.497 5 5 0 0 0-.086-.322 6 6 0 0 1-.09-.445c-.025-.125-.055-.305-.072-.395-.043-.227-.043-1.629 0-1.907.047-.347.085-.639.09-.844.012-.21.047-.292.072-.172.086.433.172.635.378.909.141.197.45.514.711.741.261.223.407.42.472.639.08.266.038.57-.103.767-.317.437-.352.531-.292.784a1 1 0 0 0 .06.215c.013.025.043.111.073.184.094.223.18.364.42.686.18.24.223.317.193.33-.043.03-.12.008-.197-.06-.03-.039-.069-.06-.082-.06-.03 0-.013.141.039.24.047.111.15.51.15.626s.206.433.54.724c.137.12.253.214.266.214s.055.03.098.073c.09.081.163.09.21.039.039-.047-.017-.142-.154-.223-.047-.039-.09-.069-.09-.082 0-.017.124-.055.36-.098.103-.026.15-.043.42-.167.262-.12.322-.223.094-.15-.291.09-.501.12-.818.102-.339-.008-.403-.03-.532-.154a.54.54 0 0 1-.167-.386c0-.145.009-.137.124-.274.142-.171.228-.214.498-.248.098-.013.274-.043.385-.073.168-.043.249-.047.519-.043.291.013.416.026.943.133.197.038.428.098.446.12.03.03-.013.09-.069.09-.133 0-.54.21-.54.274s.026.03.214-.026c.438-.137.643-.21.712-.261a.5.5 0 0 1 .163-.073c.043-.009.133-.026.192-.043l.103-.026v-.132c0-.112-.012-.142-.072-.21-.086-.086-.133-.09-.198-.018-.043.043-.068.047-.18.039-.21-.026-.415-.103-.844-.339-.026-.013-.069-.038-.086-.047a8 8 0 0 1-.351-.206c-.497-.295-.673-.372-1.132-.501-.223-.06-.574-.013-.698.099-.069.06-.133.03-.215-.103a8 8 0 0 0-.265-.339c-.133-.15-.185-.227-.172-.261a1.287 1.287 0 0 1 .129-.296c.141-.253.163-.317.171-.561.009-.223.009-.24-.081-.408-.103-.214-.21-.347-.617-.724-.348-.322-.45-.45-.652-.793-.184-.309-.266-.574-.248-.823.012-.141.025-.206.072-.279.06-.098.36-.347.588-.497.167-.12.484-.394.6-.531a6 6 0 0 0 .402-.583c.138-.21.33-.634.39-.853l.07-.223c.016-.043.038-.227.042-.428.009-.309.009-.373-.043-.532a2.4 2.4 0 0 0-.291-.604c-.12-.184-.502-.562-.686-.686-.086-.047-.206-.133-.274-.171-.292-.18-.708-.296-.708-.198 0 .099.009.039.018.039s.098.056.192.133c.095.069.236.154.322.197.081.039.163.082.184.09.017.013.142.086.275.163.18.099.278.18.39.304.085.094.154.18.154.197 0 .047-.069.039-.167-.025-.168-.103-.673-.249-.948-.275-.18-.017-.6.056-.655.103a.1.1 0 0 1-.06.026.3.3 0 0 0-.112.06l-.073.06.155-.06c.223-.086.638-.103.896-.047.098.026.227.047.282.06.168.038.318.081.459.137a1 1 0 0 0 .193.047c.03 0 .085.03.141.111.043.06.082.133.082.15 0 .018.013.048.025.06.026.03.09.283.12.416.009.056 0 .099-.017.103-.013.013-.111-.068-.227-.18a3.4 3.4 0 0 0-.596-.497 2.2 2.2 0 0 0-.497-.206c-.12-.038-.574-.03-.668.013-.15.06-.42.163-.502.18-.098.026-.206-.137-.463-.699-.073-.154-.15-.402-.133-.441.018-.047.365-.253.527-.304.07-.017.142-.047.172-.06.056-.026.167-.043.42-.06.167-.017.39.008.656.073.184.042.223.017.137-.099-.082-.099-.197-.184-.446-.304-.141-.069-.163-.086-.137-.12a.14.14 0 0 1 .081-.047c.03-.013.086-.03.133-.048.099-.042.266-.098.446-.15.082-.025.184-.055.236-.072.227-.086.643-.185 1.097-.262.086-.013.163-.03.167-.043.013-.013-.038-.103-.111-.214-.283-.429-.643-1.14-.952-1.882-.103-.261-.248-.673-.248-.728 0-.056.008-.047.017-.047.026 0 .103.085.103.111s.038.086.085.163c.043.068.086.133.086.137 0 .013.291.446.429.63.403.57 1.294 1.436 1.727 1.676.154.09.274.099.428.043.09-.03.275-.082.476-.137.06-.017.24-.06.879-.21.459-.112.493-.12.518-.09.018.017-.012.06-.085.137a5 5 0 0 0-.527.595c-.18.25-.339.665-.262.665s.09-.03.18-.073a.8.8 0 0 1 .197-.073c.047 0 .33-.154.407-.227.03-.026.1-.073.155-.112.055-.038.171-.12.266-.18.265-.18.304-.205.454-.29.373-.211.883-.451.964-.451.082 0 .06-.017.086-.039a.3.3 0 0 1 .12-.038.2.2 0 0 0 .081-.017.2.2 0 0 1 .099-.039c.098-.017.403-.124.6-.214.081-.039.214-.082.296-.099.206-.038.167-.073.707.66.06.082.124.137.167.15.039.009.322 0 .63-.017.317-.017.853-.038 1.196-.047.634-.013 1.967.009 2.104.039.056.012.086.008.133-.03.06-.043.06-.056.069-.635.008-.33.017-.613.026-.634.017-.056.072.06.111.223.013.073.043.193.06.261.099.33.15.54.171.669.018.15.09.206.296.223.296.03.896.12 1.26.193.253.047.519.133.57.171.017.013.043.09.06.171.043.215.06 3.12.017 3.584-.012.184-.038.445-.042.583-.026.304-.099.93-.112.955a2 2 0 0 0-.038.262c-.03.261-.069.54-.138.917-.025.124-.047.296-.06.386-.012.085-.038.214-.047.283-.013.068-.043.227-.06.36-.026.133-.06.304-.081.39-.022.085-.03.18-.03.214a1 1 0 0 1-.026.167 3 3 0 0 0-.047.24c-.017.137-.099.527-.163.853a5 5 0 0 0-.073.36c-.017.103-.055.274-.073.386s-.042.227-.047.274a6 6 0 0 1-.085.493 3 3 0 0 0-.06.321c-.043.262-.1.558-.142.768-.013.068-.038.192-.047.274-.03.21-.086.583-.133.853a8 8 0 0 0-.069.42c-.012.099-.03.193-.038.206a1 1 0 0 0-.039.21c-.025.261-.09.698-.111.754-.013.043-.017.111-.082.686-.012.124-.038.291-.047.373a7 7 0 0 0-.06.484c-.025.193-.055.489-.081.656-.026.227-.039.57-.03 1.294 0 1.059 0 1.119.15 1.86.038.206.06.395.056.429-.009.026-.198.214-.429.416l-.639.587c-.124.115-.24.214-.265.214s-.086-.09-.185-.291A11 11 0 0 0 25.287 69c-.475-.635-.977-1.213-1.272-1.453-.51-.416-.78-.498-1.376-.403zm-6.849-9.807c-.039-.094-.21-.261-.36-.338-.12-.069-.476-.155-.574-.137-.043.008-.026.017.072.068.283.142.575.386.823.681.043.056.06.06.082.04.026-.044.008-.207-.043-.31zm.081 4.303c-.038-.03-.085-.055-.111-.055-.06 0-.163.133-.21.278-.043.112-.043.133 0 .21a.35.35 0 0 0 .081.125c.048.042.069.025.12-.125a.8.8 0 0 1 .099-.197c.094-.111.099-.167.026-.236zm8.435-11.542c.026 0 .043-.008.039-.013-.013-.013-.03-.013-.047-.008q-.026.018.013.017zm-1.68 3.54c.009-.047.03-.055.163-.06.137-.012.154 0 .291.09.168.108.215.099.15-.043l-.042-.094.068-.056c.073-.068.193-.068.433 0 .073.026.163.048.193.056.081.026.069-.03-.047-.154-.056-.056-.09-.12-.086-.137.013-.047.54-.056.647-.009.047.017.099.03.103.026.026-.094-.124-.205-.18-.142-.073-.163-.103-.095-.154.039-.03.124-.043.317-.056.275-.017.377-.047.24-.081a1 1 0 0 1-.133-.04.4.4 0 0 0-.12-.025q-.056.002-.055-.047c0-.073.085-.099.364-.099.253-.008.351-.017.373-.068.009-.03-.103-.069-.274-.09-.069-.009-.12-.026-.12-.039 0-.043.098-.047.347-.038.214.017.248.013.261-.026.026-.06-.03-.086-.214-.086-.347 0-.386-.098-.047-.12.141-.008.205-.025.205-.043 0-.038.048-.06.125-.06s.15-.047.214-.09c.043-.025-.086-.055-.236-.055s-.18-.013-.18-.026.039-.043.09-.073c.048-.026.133-.073.18-.103.082-.047.33-.141.609-.236.111-.038.21-.09.21-.132s-.154-.013-.338-.013c-.348 0-.476-.017-.476-.06s.03-.039.068-.047c.12-.048.305-.15.373-.206.073-.06.073-.056-.253.056-.214.073-.488.102-.518.055-.009-.012-.048-.03-.099-.042-.12-.018-.24-.086-.227-.12.013-.043.111-.056.15-.018.03.03.141.039.141.009s-.111-.124-.261-.197a10 10 0 0 1-.394-.193c-.137-.069-.433-.214-.656-.334a9 9 0 0 0-.57-.283c-.09-.039-.184-.073-.206-.086a.2.2 0 0 0-.081-.026c-.039 0-.163-.047-.296-.111a.4.4 0 0 0-.133-.039.24.24 0 0 1-.103-.026c-.021-.012-.12-.03-.214-.047-.557-.085-.707-.102-.836-.12-.15-.017-.206-.06-.124-.09.026-.008.184-.025.36-.038.309-.026.394-.013.831.081.142.03.532.154.643.206.039.017.125.047.184.073.112.043.253.103.33.141a.1.1 0 0 0 .06.017c.013 0 .125.048.24.103.125.056.228.112.24.112.01.008.018 0 .018-.013s-.047-.043-.103-.069a1.5 1.5 0 0 1-.21-.12.5.5 0 0 0-.133-.068.6.6 0 0 1-.171-.073c-.133-.06-.185-.09-.416-.193a.6.6 0 0 1-.137-.06.4.4 0 0 0-.086-.017.3.3 0 0 1-.099-.03 1 1 0 0 0-.193-.073 3 3 0 0 1-.222-.073c-.172-.056-.322-.073-.768-.086a4 4 0 0 0-1.054.086c-.527.103-.639.154-.874.394-.416.438-.639.738-.609.819.03.052.176.013.364-.103.12-.073.172-.09.228-.086.047.013.068.009.081-.025.013-.069.386-.292.42-.253.013.013.017.03.013.03a1.516 1.516 0 0 0-.3.236.9.9 0 0 1-.184.141c-.03.009-.048.03-.048.047a.5.5 0 0 1-.111.15.5.5 0 0 0-.094.125c.025.025.098.012.133-.026.03-.043.124-.043.137 0 .013.03-.056.081-.322.248-.235.15-.133.142.172-.008.073-.039.137-.056.15-.047.017.017 0 .047-.193.282q-.23.277-.172.335c.013.013.048 0 .086-.03a.2.2 0 0 1 .082-.047c.012 0 .06-.039.102-.073.048-.043.099-.06.112-.056a.6.6 0 0 1-.03.18c-.043.142-.043.154-.009.223.047.09.069.09.086.008.047-.184.227-.488.39-.65.193-.198.472-.421.596-.485.043-.026.103-.056.124-.082.047-.043.081 0 .047.06a2.6 2.6 0 0 0-.18.455c-.12.531-.085.643.18.754.056.026.12.056.133.069.013.012-.017.06-.081.12l-.103.09.038.085c.103.249.51.673.75.785.15.068.18.073.438.073.257 0 .304-.01.415-.056.167-.073.463-.317.639-.51.12-.137.249-.373.253-.437 0-.018-.056-.073-.124-.138-.18-.15-.163-.205.081-.261.069-.017.167-.12.167-.172 0-.05-.03-.08-.068-.15q-.133-.27.12-.14c.042.03.192.102.321.17.124.07.322.185.433.262l.197.137-.009.124c-.008.193-.154.476-.338.66-.36.339-.724.528-1.449.738-.236.068-.484.09-.934.09-.673 0-1.059-.069-1.603-.296-.296-.12-.459-.133-.626-.039-.103.069-.154.163-.06.125a1.1 1.1 0 0 1 .394-.048c.048.013.163.056.253.1.193.098.206.132.12.273-.073.133-.03.155.112.06a.44.44 0 0 1 .214-.072h.09l.009.132.013.125.102-.086c.06-.047.12-.09.125-.09.038 0 .081.06.081.124 0 .065.009.082.017.099.017.026.03.026.06-.013.124-.15.15-.163.197-.154.039.008.056.03.069.085.03.142.06.155.18.039.167-.167.24-.142.322.099a.07.07 0 0 0 .06.042c.047 0 .055-.013.085-.154.013-.043.039-.073.082-.081.073-.017.12 0 .265.124.086.069.095.069.137.026.03-.026.056-.069.056-.09zm-2.833-1.29c.039.073.099.06.099-.017 0-.098-.047-.236-.086-.223s-.047.18-.013.24m13.891 25.412 1.153-1.046c.909-.728 2.096-1.487 3.27-1.701-1.187.218-2.366.544-3.459 1.067-1.092.519-2.1 1.239-2.875 2.169-.6.72-1.05 1.547-1.462 2.387-.201.416-.399.836-.579 1.26l1.406.039c.047 0 .099 0 .137-.03.035-.03.048-.073.056-.116.189-.78.54-1.47.922-2.169.407-.745.878-1.226 1.431-1.86m9.52-1.53c-1.968-.561-3.995-.707-5.748.206-1.175.608-2.268 1.478-3.176 2.439-.793.835-1.577 1.903-1.77 3.064h15.365l-.137-.69c-.416-2.28-2.349-4.393-4.53-5.015zm5.018 2.966c-.291-.686-.72-1.282-1.187-1.86-.309-.382-.694-.716-1.08-1.02-.776-.609-1.697-1.05-2.683-1.17-.099-.013-.249-.03-.334-.043-.407-.069-.592-.077-1.128-.103a20 20 0 0 1-.724-.039c-.154-.012-.223.013-.137.06.026.013.116.03.206.039.433.043.968.116 1.388.214 2.988.699 5.23 2.979 5.825 6.018.026.133.09.493.12.647h.412c-.138-.943-.305-1.856-.678-2.739zM15.528 60.71c0-.038-.137-.072-.171-.047-.017.009-.026.03-.026.047s.026.039.099.039c.072 0 .098-.013.098-.038m-.476 10.073c-.017.004-.038.038-.047.068-.004.039-.051.167-.081.296-.154.54-.249.836-.335 1.063-.03.073-.06.167-.072.197a.6.6 0 0 1-.047.111 2 2 0 0 0-.073.193 6.4 6.4 0 0 1-.429.862c-.043.073-.124.21-.18.296a5.3 5.3 0 0 1-1.042 1.2 3.5 3.5 0 0 1-.977.501c-.433.133-.797.172-1.53.184a7 7 0 0 0-.668.026c-.018.026.124.279.227.407.107.129.377.347.531.429.24.133.463.167.973.171.262 0 .514-.013.57-.025.407-.103.647-.219.947-.438.185-.141.352-.304.626-.612.309-.343.72-1.06.909-1.59.051-.133.103-.28.124-.322a.5.5 0 0 0 .039-.124c0-.026.008-.056.017-.069a.3.3 0 0 0 .047-.124c.047-.21.129-.502.167-.605.017-.068.039-.15.039-.18s.012-.094.025-.137c.069-.18.168-.784.262-1.645.013-.116.013-.15-.017-.133zm-2.597-31.966c-.03 0-.056.04-.039.06.03.026.06.013.06-.025 0-.039-.012-.039-.025-.039zm7.496 10.823c.009-.017-.012-.03-.043-.03s-.051.017-.047.038c0 .047.073.043.09-.008m-7.504-8.487c.025-.081.055-.163.072-.193.018-.025.039-.06.039-.085 0-.069.15-.227.266-.279a6 6 0 0 1 .283-.103c.094-.034.227-.094.304-.137a.5.5 0 0 1 .15-.068c.008.004 0 .06-.013.124-.086.381-.094.463-.047.463s.043-.043.073-.099c.025-.056.06-.094.073-.086.012.013.025.275.025.652 0 .707.022.776.112.39.03-.124.073-.283.098-.36.017-.073.048-.171.06-.223a2 2 0 0 1 .073-.223c.026-.073.06-.167.073-.21.017-.073.206-.596.249-.694l.072-.21c.03-.086.065-.172.073-.184a.1.1 0 0 0 .026-.073.16.16 0 0 1 .039-.099.2.2 0 0 0 .038-.086c0-.021.026-.111.06-.197.035-.085.082-.206.103-.261.017-.056.069-.167.103-.253.038-.086.073-.163.073-.171 0-.01.03-.095.073-.193.043-.095.085-.198.098-.223.103-.275.626-1.355.823-1.745.21-.394.197-.368.172-.394-.017-.017-.15.137-.502.609-.694.921-.878 1.2-1.35 1.993-.274.454-.489.767-.621.917a3 3 0 0 1-.583.463c-.073.047-.155.09-.172.103-.026.012-.12.068-.21.124s-.171.098-.18.098c-.017 0-.004-.124.026-.205l.081-.193c.15-.39.656-1.402 1.072-2.122.296-.531.086-.343-.33.292a8 8 0 0 0-.249.394c-.03.052-.094.154-.15.236-.047.081-.098.163-.103.184-.013.017-.034.069-.055.099a4 4 0 0 0-.125.21c-.081.145-.15.265-.265.445a.5.5 0 0 0-.056.112c0 .013-.064.137-.137.274a7 7 0 0 0-.137.266c0 .013-.043.103-.099.214-.056.112-.12.249-.15.309a6 6 0 0 1-.137.304c-.047.107-.086.197-.082.219 0 .017.129.025.403.025h.403l.047-.141zm7.277 8.654c.017 0 .039-.013.039-.026s.013-.026.038-.026.039-.017.039-.038c0-.047-.043-.043-.099.013-.064.06-.064.072-.013.072zm1.89 31.348c-.038.013-.154.021-.253.03-.184.017-.192.017-.265.124-.142.197-.296.433-.365.544l-.038.069h.72l.073-.206c.081-.218.128-.347.18-.45.043-.09.025-.124-.047-.111zm-1.397-31.421c.017.03.064.03.111 0 .026-.017.026-.03.009-.047-.03-.039-.141.013-.12.047m-5.979-3.677c0 .021.013.038.026.03.013 0 .026-.018.026-.03s-.013-.026-.026-.03c-.013-.009-.026.008-.026.03m5.782 3.784c-.039-.038-.043-.038-.086 0-.026.022-.051.043-.056.043-.012 0-.085.047-.171.103-.081.056-.176.124-.206.141-.098.069-.163.133-.163.167 0 .035.005.035.095-.008.038-.017.163-.099.265-.172l.279-.192c.073-.043.081-.056.043-.086zm-8.19-9.562c.038-.086.098-.223.136-.296.112-.253.352-.754.395-.844.055-.107.073-.206.043-.21-.018-.009-.103.111-.193.261l-.167.266-.322.013c-.266.017-.334.03-.446.081a.5.5 0 0 1-.15.06c-.051 0-.025-.094.073-.252.052-.09.099-.18.099-.18 0-.013.291-.532.317-.57a1 1 0 0 0 .086-.138c.098-.171.63-1.041.767-1.243.056-.081-.013-.072-.086.009-.068.086-.54.699-.613.806-.043.06-.12.163-.295.42-.069.094-.163.231-.21.295-.133.198-.142.206-.283.142a.7.7 0 0 0-.193-.056c-.086 0-.137-.038-.112-.09.013-.043.112-.197.227-.364.026-.043.142-.219.262-.394.111-.18.223-.348.249-.386.12-.154.308-.45.308-.472 0-.094-.253.15-.484.459-.052.069-.107.141-.12.163a8 8 0 0 0-.532.724l-.141.215-.163-.018c-.094-.008-.261-.012-.373-.017H9.7l-.12.163a4 4 0 0 0-.137.184 1 1 0 0 0-.073.137c-.034.06-.068.13-.081.15-.017.03-.193.39-.322.67-.013.016-.043.085-.073.15-.03.063-.068.128-.081.153a.2.2 0 0 0-.017.069c0 .013-.039.09-.073.18-.111.249-.206.502-.21.574 0 .043.013.047.15.056.081.004.283.017.459.03.308.026.42.017.42-.03s.017-.056.047-.09c.085-.124.107-.056.025.09-.068.137-.128.296-.248.651l-.073.236c-.03.107-.176.575-.206.682-.013.051-.034.141-.055.21-.15.518-.275 1.08-.253 1.136.021.042.068.021.068-.018 0-.038.262-.934.309-1.071.026-.056.056-.137.073-.18a.5.5 0 0 0 .038-.124c0-.026.013-.06.039-.09a.2.2 0 0 0 .038-.09c0-.022.013-.082.03-.125s.073-.167.112-.278c.184-.48.634-1.423.729-1.543.08-.107.08.115-.013.463-.052.197-.06.373-.026.373s.056-.04.086-.082c.064-.073.068-.073.098-.038.017.025.039.154.047.338.026.437.043.467.197.21.125-.197.322-.416.365-.403.017.005.034.039.043.069.004.064-.039.411-.103.806-.069.39-.026.415.103.06.073-.193.141-.373.205-.532.043-.111.082-.223.082-.253s.008-.06.017-.068c.017 0 .039-.047.047-.09a7 7 0 0 1 .292-.729c.047-.124.124-.296.167-.386zm9.219 40.932c0-.018-.018-.035-.043-.043-.086-.039-.185-.013-.322.073-.291.192-1.234.672-1.316.672-.081 0-.012 0-.021.009h1.11l.069-.09c.047-.069.192-.236.308-.364.116-.129.215-.249.215-.262zm-.943-31.46c-.056.013-.069.039-.039.06.03.03.073.017.103-.017.034-.043.004-.06-.069-.043z" />
      <path d="M53.455.004H6.545A6.544 6.544 0 0 0 0 6.55v70.805A6.544 6.544 0 0 0 6.545 83.9h46.91A6.544 6.544 0 0 0 60 77.354V6.544A6.544 6.544 0 0 0 53.455 0zM13.064 81.872h-6.52a4.524 4.524 0 0 1-4.517-4.518V6.544a4.524 4.524 0 0 1 4.518-4.517h46.91a4.524 4.524 0 0 1 4.518 4.518V77.35a4.524 4.524 0 0 1-4.518 4.517H13.064z" />
    </svg>
  );
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
  return (
    <img
      src="/brand-logos/physical_intelligence.png"
      width={size}
      height={size}
      className={cn("rounded-[2px] object-contain invert shrink-0 inline-block align-middle", className)}
      alt="Physical Intelligence"
    />
  );
}

export function OpenVLALogo({ className, size = 24 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/openvla.png"
      width={size}
      height={size}
      className={cn("rounded-full object-contain shrink-0 inline-block align-middle", className)}
      alt="OpenVLA"
    />
  );
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

export function BosonAILogo({ className, size = 14 }: BrandIconProps) {
  return <img src="https://cdn-avatars.huggingface.co/v1/production/uploads/64fa072a52e82dd432460767/H6frSQWSUBjT9RfAsZwmU.png" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Boson AI" />;
}

export function PipecatLogo({ className, size = 14 }: BrandIconProps) {
  return <img src="https://cdn-avatars.huggingface.co/v1/production/uploads/64529e7d0a19adf0445eea5f/zK07ZNxEozdIL0w_1mnGL.png" width={size} height={size} className={cn("rounded-[2px] object-contain", className)} alt="Pipecat" />;
}

export function OpenGVLabLogo({ className, size = 14 }: BrandIconProps) {
  return (
    <img
      src="https://cdn-avatars.huggingface.co/v1/production/uploads/64006c09330a45b03605bba3/FvdxiTkTqH8rKDOzGZGUE.jpeg"
      width={size}
      height={size}
      className={cn("rounded-[2px] object-cover shrink-0 inline-block align-middle", className)}
      alt="OpenGVLab"
    />
  );
}

export function Ai2Logo({ className, size = 14 }: BrandIconProps) {
  return (
    <img
      src="https://cdn-avatars.huggingface.co/v1/production/uploads/652db071b62cf1f8463221e2/CxxwFiaomTa1MCX_B7-pT.png"
      width={size}
      height={size}
      className={cn("rounded-[2px] object-cover shrink-0 inline-block align-middle", className)}
      alt="Ai2"
    />
  );
}

export function TencentLogo({ className, size = 22 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/tencent.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Tencent"
    />
  );
}

export function OverworldLogo({ className, size = 22 }: BrandIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 30 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 inline-block align-middle text-[#52c4cb]", className)}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.711 0C2.64799 1.38573 4.30275 2.08624 5.76503 2.08624C7.16061 2.08624 7.74763 1.80679 10.1181 1.21794L10.6167 1.09606C13.3748 0.40097 15.098 0.0463183 16.7147 0.0463183C20.4413 0.0463424 23.888 1.31118 26.0663 3.87089C28.0733 6.22609 29.07 9.22082 29.07 12.837V12.844L29.0695 12.8513C28.9068 15.32 28.4447 17.3961 28.2309 18.1346L28.2294 18.1393L28.2279 18.1437C25.7031 25.6106 19.3259 28.3118 16.0174 28.6804L16.0097 28.6813L16.0018 28.6815C13.8669 28.7669 12.3715 28.4751 11.1153 27.7549C9.86537 27.0382 8.87647 25.9101 7.73131 24.3792C5.63036 21.5706 5.23971 18.5476 5.90611 15.335H2.7379C2.06876 15.5025 1.27936 15.9952 0.367985 16.8496L0 17.1948V16.1414L0.0386341 16.0853C1.25538 14.321 3.19768 13.4554 5.8139 13.4554H6.40943C7.15254 11.2352 8.42816 9.1255 10.2312 7.12619C9.57313 7.2158 8.73572 7.31509 8.24017 7.31509C6.38443 7.31508 4.88124 6.90091 3.75306 6.04934C2.53417 5.12929 2.07643 3.49714 1.96714 2.40428L1.711 0ZM24.6868 7.88884C22.9812 5.86209 20.3731 5.08998 17.9309 5.31316C16.7384 5.42215 16.1355 5.48886 15.646 5.5742C15.1569 5.65947 14.7803 5.76372 14.053 5.94176L14.0479 5.94304L14.043 5.94454L12.8385 6.30078L12.799 6.34027C10.8355 8.30636 8.83812 10.467 8.43142 13.2223C7.94599 16.5113 9.10047 19.3712 11.1004 21.4439C12.5419 22.9379 13.8461 23.765 15.0931 24.1807C16.3406 24.5965 17.5122 24.5942 18.6742 24.4601C19.8274 24.327 20.7438 24.1492 21.627 23.7959C22.5109 23.4422 23.3497 22.9176 24.3559 22.1053L24.3619 22.1004L24.3675 22.0953C26.5886 20.0299 28.4647 15.1362 26.4059 10.4833L26.4023 10.475L26.3978 10.4669C26.0595 9.84801 25.2291 8.53329 24.6868 7.88884ZM5.9535 16.3305C5.95124 16.3466 5.9493 16.3627 5.9471 16.3787C5.94983 16.3588 5.95239 16.3389 5.95521 16.319L5.9535 16.3305Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function NousResearchLogo({ className, size = 22 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/nousresearch.png"
      width={size}
      height={size}
      className={cn("rounded-sm object-cover shrink-0 inline-block align-middle", className)}
      alt="Nous Research"
    />
  );
}

export function BrowserUseLogo({ className, size = 22 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/browseruse.png"
      width={size}
      height={size}
      className={cn("rounded-sm object-cover shrink-0 inline-block align-middle", className)}
      alt="Browser Use"
    />
  );
}

export function XLangLogo({ className, size = 22 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/xlang.png"
      width={size}
      height={size}
      className={cn("rounded-sm object-cover shrink-0 inline-block align-middle", className)}
      alt="xLang AI"
    />
  );
}

export function MeituanLogo({ className, size = 22 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/meituan.png"
      width={size}
      height={size}
      className={cn("rounded-sm object-cover shrink-0 inline-block align-middle", className)}
      alt="Meituan"
    />
  );
}

export function SWEBenchLogo({ className, size = 22 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/swebench.png"
      width={size}
      height={size}
      className={cn("rounded-sm object-cover shrink-0 inline-block align-middle", className)}
      alt="SWE-bench"
    />
  );
}

export function LeRobotLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/lerobot.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-cover shrink-0 inline-block align-middle", className)}
      alt="LeRobot"
    />
  );
}

export function OpenDriveLabLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/opendrivelab.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-cover shrink-0 inline-block align-middle", className)}
      alt="OpenDriveLab"
    />
  );
}

export function RailBerkeleyLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/rail_berkeley.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-cover shrink-0 inline-block align-middle", className)}
      alt="UC Berkeley RAIL"
    />
  );
}

export function DepthAnythingLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/depth_anything.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-cover shrink-0 inline-block align-middle", className)}
      alt="Depth Anything"
    />
  );
}

export function FigureLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/figure.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Figure AI"
    />
  );
}

export function BostonDynamicsLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/bostondynamics.jpg"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Boston Dynamics"
    />
  );
}

export function UnitreeLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/unitree.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Unitree"
    />
  );
}

export function WindsurfLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/windsurf.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Windsurf"
    />
  );
}

export function DevinLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/devin.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Devin"
    />
  );
}

export function CopilotLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={cn("shrink-0 inline-block align-middle text-[#F0EFE2]", className)}>
      <path d="M23.922 16.997C23.061 18.492 18.063 22.02 12 22.02 5.937 22.02.939 18.492.078 16.997A.641.641 0 0 1 0 16.741v-2.869a.883.883 0 0 1 .053-.22c.372-.935 1.347-2.292 2.605-2.656.167-.429.414-1.055.644-1.517a10.098 10.098 0 0 1-.052-1.086c0-1.331.282-2.499 1.132-3.368.397-.406.89-.717 1.474-.952C7.255 2.937 9.248 1.98 11.978 1.98c2.731 0 4.767.957 6.166 2.093.584.235 1.077.546 1.474.952.85.869 1.132 2.037 1.132 3.368 0 .368-.014.733-.052 1.086.23.462.477 1.088.644 1.517 1.258.364 2.233 1.721 2.605 2.656a.841.841 0 0 1 .053.22v2.869a.641.641 0 0 1-.078.256Zm-11.75-5.992h-.344a4.359 4.359 0 0 1-.355.508c-.77.947-1.918 1.492-3.508 1.492-1.725 0-2.989-.359-3.782-1.259a2.137 2.137 0 0 1-.085-.104L4 11.746v6.585c1.435.779 4.514 2.179 8 2.179 3.486 0 6.565-1.4 8-2.179v-6.585l-.098-.104s-.033.045-.085.104c-.793.9-2.057 1.259-3.782 1.259-1.59 0-2.738-.545-3.508-1.492a4.359 4.359 0 0 1-.355-.508Zm2.328 3.25c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm-5 0c.549 0 1 .451 1 1v2c0 .549-.451 1-1 1-.549 0-1-.451-1-1v-2c0-.549.451-1 1-1Zm3.313-6.185c.136 1.057.403 1.913.878 2.497.442.544 1.134.938 2.344.938 1.573 0 2.292-.337 2.657-.751.384-.435.558-1.15.558-2.361 0-1.14-.243-1.847-.705-2.319-.477-.488-1.319-.862-2.824-1.025-1.487-.161-2.192.138-2.533.529-.269.307-.437.808-.438 1.578v.021c0 .265.021.562.063.893Zm-1.626 0c.042-.331.063-.628.063-.894v-.02c-.001-.77-.169-1.271-.438-1.578-.341-.391-1.046-.69-2.533-.529-1.505.163-2.347.537-2.824 1.025-.462.472-.705 1.179-.705 2.319 0 1.211.175 1.926.558 2.361.365.414 1.084.751 2.657.751 1.21 0 1.902-.394 2.344-.938.475-.584.742-1.44.878-2.497Z" />
    </svg>
  );
}

export function GroqLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/groq.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Groq"
    />
  );
}

export function CoreWeaveLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/coreweave.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="CoreWeave"
    />
  );
}

export function LambdaLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/lambda.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Lambda Labs"
    />
  );
}

export function CerebrasLogo({ className, size = 20 }: BrandIconProps) {
  return (
    <img
      src="/brand-logos/cerebras.png"
      width={size}
      height={size}
      className={cn("rounded-[3px] object-contain shrink-0 inline-block align-middle", className)}
      alt="Cerebras"
    />
  );
}
