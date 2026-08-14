import type { RepoSkillsRulesSummary } from "@/lib/continuity-lab/lab-skills-rules-settings-api";
import type { LabSkillsRulesSettings } from "@/lib/continuity-lab/lab-skills-rules-settings-storage";

export const LAB_SKILLS_RULES_SETTINGS_CHANGED_EVENT =
  "memoryos:lab-skills-rules-settings-changed";

export type LabSkillsRulesSettingsChangedDetail = {
  settings: LabSkillsRulesSettings;
  orgId?: string;
  updatedAt?: string;
  repos?: RepoSkillsRulesSummary[];
  githubConnected?: boolean;
};

export function broadcastLabSkillsRulesSettingsChanged(
  detail: LabSkillsRulesSettingsChangedDetail,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LabSkillsRulesSettingsChangedDetail>(LAB_SKILLS_RULES_SETTINGS_CHANGED_EVENT, {
      detail,
    }),
  );
}
