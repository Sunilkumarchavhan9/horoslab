import type { LucideIcon } from "lucide-react";
import {
  Activity,
  BrainCircuit,
  Code2,
  CreditCard,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  Network,
  Orbit,
  Play,
  PlugZap,
  Settings,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

/** Semantic Lucide mapping — one icon per nav purpose, no generic fallbacks in UI. */
const NAV_ICON_MAP: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  "Connected Intelligence Sources": PlugZap,
  "Memory Graph": Network,
  "Runtime Activity": Activity,
  "Agent Activity Timeline": Orbit,
  "Memory Evolution Timeline": GitBranch,
  Governance: ShieldCheck,
  "Security + Governance": ShieldCheck,
  "Continuity Lab": BrainCircuit,
  Playground: Play,
  Team: UsersRound,
  Billing: CreditCard,
  Settings,
  "API Keys": KeyRound,
  "Integrations & SDK": Code2,

  // Legacy aliases (bookmarks only)
  "Command Center": LayoutDashboard,
  Frameworks: Code2,
  Plugins: Code2,
  Adapters: Code2,
  "Data Sources": PlugZap,
  Connectors: PlugZap,
  Integrations: Code2,
  Imports: PlugZap,
  "Ingestion Control Center": PlugZap,
  "API Requests": Activity,
  Requests: Activity,
  "Agent Flight Recorder": Orbit,
  "Memory Vault": Network,
  Memories: Network,
  "Memory Store": Network,
  "Company Brain": Sparkles,
};

const DEFAULT_ICON = LayoutDashboard;

export function osNavIcon(item: string): LucideIcon {
  return NAV_ICON_MAP[item] ?? DEFAULT_ICON;
}

export function osNavIconForResolved(item: string): LucideIcon {
  return NAV_ICON_MAP[item] ?? DEFAULT_ICON;
}
