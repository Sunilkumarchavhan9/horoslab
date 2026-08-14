"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { setLabSessionNetworkControls } from "@/lib/continuity-lab/session-storage";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

type ContinuityLabSessionNetworkModalProps = {
  open: boolean;
  sessionId: string;
  initialEnabled: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function ContinuityLabSessionNetworkModal({
  open,
  sessionId,
  initialEnabled,
  onClose,
  onSaved,
}: ContinuityLabSessionNetworkModalProps) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEnabled(initialEnabled);
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, initialEnabled, onClose]);

  function handleSave() {
    setSaving(true);
    setLabSessionNetworkControls(sessionId, enabled);
    setSaving(false);
    onSaved?.();
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close network config"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="network-config-title"
        className="relative z-10 w-full max-w-md border border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#2F2F2F] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6366F1]">
              Sandbox
            </p>
            <h2 id="network-config-title" className="mt-1 text-lg font-semibold text-white">
              Update network config
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center border border-[#3A3A3A] text-white/70 hover:bg-[#141414]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-[12px] leading-relaxed text-white/55">
            Network controls apply to the OpenHands sandbox for this session. MemoryOS stores
            your preference locally; runtime enforcement depends on the Continuity Labs agent
            image.
          </p>

          <label
            className={cn(
              "mt-5 flex cursor-pointer items-center justify-between gap-4 border border-[#2F2F2F] bg-[#111111] px-3 py-3",
            )}
          >
            <span>
              <span className="block text-sm font-medium text-white">
                Enable network controls
              </span>
              <span className="mt-0.5 block text-[11px] text-white/45">
                Restrict outbound traffic when enabled.
              </span>
            </span>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
              aria-label="Enable network controls"
            />
          </label>

          {!enabled ? (
            <p className="mt-4 border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/90">
              Network controls are off. The agent sandbox may use unrestricted outbound network
              access until you enable controls and the runtime applies them.
            </p>
          ) : (
            <p className="mt-4 border border-[#2F2F2F] bg-[#111111] px-3 py-2.5 text-[11px] leading-relaxed text-white/45">
              Controls enabled. Apply may require a new message or sandbox refresh once runtime
              support is available.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-[#2F2F2F] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="border border-[#3A3A3A] px-4 py-2 text-xs font-medium text-white/80 hover:bg-[#141414]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 bg-[#6366F1] px-4 py-2 text-xs font-semibold text-white hover:bg-[#4F46E5] disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
