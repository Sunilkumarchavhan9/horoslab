"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import {
  readAskMemoryPreferences,
  saveAskMemoryPreferences,
} from "@/lib/continuity-lab/ask-memory-preferences";

type ContinuityLabAskMemoryTogglesProps = {
  className?: string;
  disabled?: boolean;
};

export function ContinuityLabAskMemoryToggles({
  className,
  disabled,
}: ContinuityLabAskMemoryTogglesProps) {
  const [prefs, setPrefs] = useState(readAskMemoryPreferences);

  useEffect(() => {
    setPrefs(readAskMemoryPreferences());
  }, []);

  function update(partial: Partial<typeof prefs>) {
    const next = saveAskMemoryPreferences(partial);
    setPrefs(next);
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#F0EFE2]/55",
        className,
      )}
    >
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title="Prepend resume brief into the prompt before sending"
      >
        <input
          type="checkbox"
          checked={prefs.injectResumeBrief}
          disabled={disabled}
          onChange={(e) => update({ injectResumeBrief: e.target.checked })}
          className="size-3.5 rounded border-[#3A3A3A] accent-[#6366F1]"
        />
        <span>Inject resume brief</span>
      </label>
      <label
        className={cn(
          "inline-flex cursor-pointer items-center gap-2",
          disabled && "cursor-not-allowed opacity-50",
        )}
        title="Load operational brief and company memory when starting a session"
      >
        <input
          type="checkbox"
          checked={prefs.useCompanyMemory}
          disabled={disabled}
          onChange={(e) => update({ useCompanyMemory: e.target.checked })}
          className="size-3.5 rounded border-[#3A3A3A] accent-[#6366F1]"
        />
        <span>Use company memory</span>
      </label>
    </div>
  );
}

export function readAskMemoryPrefsForSession() {
  return readAskMemoryPreferences();
}
