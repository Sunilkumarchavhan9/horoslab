import type {
  RecentAutomation,
  SavedAutomation,
} from "@/lib/continuity-lab/automation-storage";

export const AUTOMATIONS_CHANGED_EVENT = "memoryos:automations-changed";

export type AutomationsChangedDetail = {
  orgId?: string;
  automation?: SavedAutomation;
  automationId?: string;
  automations?: SavedAutomation[];
  recentAutomations?: RecentAutomation[];
  updatedAt?: string;
  reason?: string;
};

export function broadcastAutomationsChanged(detail: AutomationsChangedDetail = {}): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<AutomationsChangedDetail>(AUTOMATIONS_CHANGED_EVENT, { detail }),
  );
}
