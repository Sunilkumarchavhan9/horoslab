import { CloudCog, PackageOpen, Webhook } from "lucide-react";
import Image from "next/image";
import {
  siDatadog,
  siGithub,
  siGithubactions,
  siGnubash,
  siKubernetes,
  siModelcontextprotocol,
  siNvidia,
  siOpenapiinitiative,
  siOpentelemetry,
  siPrometheus,
  siSentry,
  siTypescript,
  siVllm,
} from "simple-icons";

export type DeveloperBrand =
  | "github"
  | "github-actions"
  | "openapi"
  | "typescript"
  | "cli"
  | "mcp"
  | "webhook"
  | "artifact"
  | "opentelemetry"
  | "prometheus"
  | "sentry"
  | "datadog"
  | "cloudwatch"
  | "aws"
  | "kubernetes"
  | "vllm"
  | "nvidia";

const SIMPLE_MARKS = {
  github: siGithub,
  "github-actions": siGithubactions,
  openapi: siOpenapiinitiative,
  typescript: siTypescript,
  cli: siGnubash,
  mcp: siModelcontextprotocol,
  opentelemetry: siOpentelemetry,
  prometheus: siPrometheus,
  sentry: siSentry,
  datadog: siDatadog,
  kubernetes: siKubernetes,
  vllm: siVllm,
  nvidia: siNvidia,
} as const;

export function DeveloperBrandMark({ brand, className = "h-3.5 w-3.5" }: { brand: DeveloperBrand; className?: string }) {
  if (brand === "aws") {
    return <Image src="/connector-icons/aws.ico" alt="" width={16} height={16} className={className} aria-hidden="true" />;
  }
  if (brand === "cloudwatch") return <CloudCog className={`${className} text-[#8c4fff]`} strokeWidth={2} aria-hidden="true" />;
  if (brand === "webhook") return <Webhook className={`${className} text-[#2f6fbc]`} strokeWidth={2} aria-hidden="true" />;
  if (brand === "artifact") return <PackageOpen className={`${className} text-[#b56a1b]`} strokeWidth={2} aria-hidden="true" />;

  const icon = SIMPLE_MARKS[brand];
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d={icon.path} fill={`#${icon.hex}`} />
    </svg>
  );
}
