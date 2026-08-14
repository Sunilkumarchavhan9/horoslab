"use client";

export type LabOrgSettings = {
  organizationName: string;
  shareDataForEvaluation: boolean;
  shareDataForTraining: boolean;
};

const STORAGE_KEY = "memoryos-lab-org-settings";

const DEFAULTS: LabOrgSettings = {
  organizationName: "",
  shareDataForEvaluation: true,
  shareDataForTraining: false,
};

function mergeParsed(parsed: Partial<LabOrgSettings>): LabOrgSettings {
  return {
    organizationName:
      typeof parsed.organizationName === "string" ? parsed.organizationName : "",
    shareDataForEvaluation:
      typeof parsed.shareDataForEvaluation === "boolean"
        ? parsed.shareDataForEvaluation
        : DEFAULTS.shareDataForEvaluation,
    shareDataForTraining:
      typeof parsed.shareDataForTraining === "boolean"
        ? parsed.shareDataForTraining
        : DEFAULTS.shareDataForTraining,
  };
}

export function readLabOrgSettings(): LabOrgSettings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return mergeParsed(JSON.parse(raw) as Partial<LabOrgSettings>);
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveLabOrgSettings(partial: Partial<LabOrgSettings>): LabOrgSettings {
  const next = { ...readLabOrgSettings(), ...partial };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}
