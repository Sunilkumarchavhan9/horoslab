"use client";

import { broadcastLabDesktopSettingsChanged } from "@/lib/continuity-lab/lab-desktop-settings-events";

export type ModelProviderKeyId = "anthropic" | "openrouter";

export type ModelProviderKeyStatus = {
  configured: boolean;
  masked?: string;
};

export type LabDesktopSettings = {
  disableTelemetry: boolean;
  modelProviderKeys: Partial<Record<ModelProviderKeyId, ModelProviderKeyStatus>>;
};

const STORAGE_KEY = "memoryos-lab-desktop-settings";

const DEFAULTS: LabDesktopSettings = {
  disableTelemetry: false,
  modelProviderKeys: {
    anthropic: { configured: false },
    openrouter: { configured: false },
  },
};

function parseKeyStatus(raw: unknown): ModelProviderKeyStatus {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { configured: false };
  }
  const record = raw as Record<string, unknown>;
  const configured = record.configured === true;
  const masked = typeof record.masked === "string" ? record.masked : undefined;
  return configured ? { configured: true, masked } : { configured: false };
}

function mergeParsed(parsed: Partial<LabDesktopSettings>): LabDesktopSettings {
  const keys = parsed.modelProviderKeys;
  const modelProviderKeys: LabDesktopSettings["modelProviderKeys"] = {
    anthropic: parseKeyStatus(keys?.anthropic),
    openrouter: parseKeyStatus(keys?.openrouter),
  };
  return {
    disableTelemetry:
      typeof parsed.disableTelemetry === "boolean"
        ? parsed.disableTelemetry
        : DEFAULTS.disableTelemetry,
    modelProviderKeys,
  };
}

export function readLabDesktopSettings(): LabDesktopSettings {
  if (typeof window === "undefined") return { ...DEFAULTS, modelProviderKeys: { ...DEFAULTS.modelProviderKeys } };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...DEFAULTS,
        modelProviderKeys: {
          anthropic: { configured: false },
          openrouter: { configured: false },
        },
      };
    }
    return mergeParsed(JSON.parse(raw) as Partial<LabDesktopSettings>);
  } catch {
    return {
      ...DEFAULTS,
      modelProviderKeys: {
        anthropic: { configured: false },
        openrouter: { configured: false },
      },
    };
  }
}

export function saveLabDesktopSettings(
  partial: Partial<LabDesktopSettings>,
  options?: { broadcast?: boolean },
): LabDesktopSettings {
  const next = mergeParsed({ ...readLabDesktopSettings(), ...partial });
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    if (options?.broadcast !== false) {
      broadcastLabDesktopSettingsChanged({ settings: next });
    }
  }
  return next;
}
