"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  DEFAULT_OPENROUTER_MODEL,
  loadCompanyModelSnapshot,
  OPENROUTER_MODEL_OPTIONS,
  resolveCompanyModelFormState,
} from "@/lib/continuity-lab/company-model";
import { patchRuntimeLlmModel } from "@/lib/continuity-lab/openhands-api";
import { cn } from "@/lib/utils";

type ContinuityLabModelSelectorProps = {
  compact?: boolean;
  className?: string;
  onModelChange?: (model: string) => void;
};

export function ContinuityLabModelSelector({
  compact = false,
  className,
  onModelChange,
}: ContinuityLabModelSelectorProps) {
  const [model, setModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await loadCompanyModelSnapshot();
      const formState = resolveCompanyModelFormState(snapshot.model || DEFAULT_OPENROUTER_MODEL);
      setModel(formState.model);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleChange(next: string) {
    setModel(next);
    setSaving(true);
    try {
      await patchRuntimeLlmModel(next);
      onModelChange?.(next);
    } finally {
      setSaving(false);
    }
  }

  const label = OPENROUTER_MODEL_OPTIONS.find((o) => o.value === model)?.label ?? model;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {!compact ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#F0EFE2]/45">
          Model
        </span>
      ) : null}
      <div className="relative">
        <select
          value={model}
          disabled={loading || saving}
          onChange={(e) => void handleChange(e.target.value)}
          className={cn(
            "appearance-none border border-[#3A3A3A] bg-[#111111] pr-8 text-[#F0EFE2] focus:border-[#6366F1] focus:outline-none",
            compact ? "h-8 min-w-[10rem] px-2 text-[11px]" : "h-9 min-w-[12rem] px-3 text-xs",
          )}
          aria-label="Agent model"
        >
          {OPENROUTER_MODEL_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {saving ? (
          <Loader2 className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 animate-spin text-[#F0EFE2]/50" />
        ) : null}
      </div>
      {!compact ? (
        <span className="hidden max-w-[8rem] truncate text-[10px] text-[#F0EFE2]/35 sm:inline">
          {label}
        </span>
      ) : null}
    </div>
  );
}
