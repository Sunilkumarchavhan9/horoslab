export type NavAsciiVariant =
  | "pulse"
  | "bloom"
  | "grid"
  | "stack"
  | "orbit"
  | "fork"
  | "gauge"
  | "brief"
  | "rocket"
  | "wallet"
  | "mesh"
  | "blocks"
  | "plug"
  | "console";

const LABEL_VARIANTS: Record<string, NavAsciiVariant> = {
  "Core Engine": "pulse",
  "Company Brain": "bloom",
  "Developer Experience": "grid",
  "API Reference": "orbit",
  "Client SDKs": "fork",
  "Context Stack": "stack",
  "Benchmarks": "gauge",
  "Case Studies": "brief",
  "Starter (Free)": "rocket",
  "Personal App": "blocks",
  Plugins: "plug",
  "Developer Console": "console",
};

export function getNavAsciiVariant(label: string): NavAsciiVariant {
  if (LABEL_VARIANTS[label]) return LABEL_VARIANTS[label];
  if (label.startsWith("Pro (")) return "wallet";
  if (label.startsWith("Scale (")) return "mesh";
  return "grid";
}
