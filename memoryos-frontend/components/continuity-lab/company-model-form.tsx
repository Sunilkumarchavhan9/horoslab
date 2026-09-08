"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_OPENROUTER_MODEL,
  loadCompanyModelSnapshot,
  OPENROUTER_MODEL_OPTIONS,
  resolveCompanyModelFormState,
  resolveEffectiveOpenRouterModel,
  saveCompanyModel,
  type CompanyModelSnapshot,
} from "@/lib/continuity-lab/company-model";

type CompanyModelFormProps = {
  compact?: boolean;
  onSaved?: (snapshot: CompanyModelSnapshot) => void;
};

function tierClass(tier: string) {
  if (tier === "Free") return "border-emerald-400/40 text-emerald-200";
  if (tier === "Premium") return "border-amber-300/40 text-amber-100";
  return "border-sky-300/40 text-sky-100";
}

export function CompanyModelForm({ compact = false, onSaved }: CompanyModelFormProps) {
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<CompanyModelSnapshot | null>(null);
  const [model, setModel] = useState(DEFAULT_OPENROUTER_MODEL);
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [providerName] = useState("MemoryOS Continuity Labs");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [justSavedReady, setJustSavedReady] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await loadCompanyModelSnapshot();
      setSnapshot(next);
      const formState = resolveCompanyModelFormState(next.model);
      setModel(formState.model);
      setCustomModel(formState.customModel);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const effectiveModel = resolveEffectiveOpenRouterModel(model, customModel);
  const modelReady = Boolean(snapshot?.modelReady && effectiveModel);
  const selectedOption = OPENROUTER_MODEL_OPTIONS.find((o) => o.value === model);
  const selectedTier = selectedOption?.tier ?? "Company";

  async function handleSave() {
    setError(null);
    setJustSavedReady(false);
    setSaving(true);
    try {
      const result = await saveCompanyModel({
        apiKey: apiKey || undefined,
        model: effectiveModel,
        providerName,
      });
      if (!result.ok) {
        setError(result.error ?? "Save failed.");
        return;
      }
      setApiKey("");
      setSavedAt(new Date().toLocaleTimeString());
      const next = await loadCompanyModelSnapshot();
      setSnapshot(next);
      setJustSavedReady(result.modelReady);
      onSaved?.(next);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-[#F0EFE2]/50">
        <Loader2 className="size-4 animate-spin" />
        Loading company model…
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", !compact && "md:gap-5")}>
      <div className="flex flex-wrap gap-2">
        <span
          className={cn(
            "border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
            modelReady
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
              : "border-amber-400/40 bg-amber-400/10 text-amber-100",
          )}
        >
          {modelReady ? "MODEL READY" : "Model required"}
        </span>
        <span
          className={cn(
            "border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em]",
            tierClass(selectedTier),
          )}
        >
          {selectedTier}
        </span>
        {savedAt ? (
          <span className="border border-emerald-400/35 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-200">
            Saved {savedAt}
          </span>
        ) : null}
      </div>

      {!compact ? (
        <p className="text-sm leading-relaxed text-[#F0EFE2]/55">
          Paste your OpenRouter key first, then pick a model. One key unlocks free and premium
          models — no repo <code className="text-[#F0EFE2]/75">.env</code> edits required.
        </p>
      ) : null}

      {justSavedReady ? (
        <p className="text-xs leading-relaxed text-emerald-200">
          Company model saved and synced to Continuity Labs runtime. You can start a session now.
        </p>
      ) : null}

      <label className="grid gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F0EFE2]/50">
          OpenRouter API key
        </span>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={
            snapshot?.apiKeySet
              ? "Saved. Paste a new key to rotate."
              : "Paste key from openrouter.ai/keys"
          }
          className="h-10 border border-[#3A3A3A] bg-[#050505] px-3 text-sm text-[#F0EFE2] outline-none focus:border-[#6366F1]"
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F0EFE2]/50">
          Model
        </span>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="h-10 border border-[#3A3A3A] bg-[#050505] px-3 text-sm text-[#F0EFE2] outline-none focus:border-[#6366F1]"
        >
          {OPENROUTER_MODEL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} — {option.tier}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#F0EFE2]/50">
          Custom model id
        </span>
        <input
          value={customModel}
          onChange={(e) => setCustomModel(e.target.value)}
          placeholder="pareto-code or google/gemma-2-9b-it:free"
          className="h-10 border border-[#3A3A3A] bg-[#050505] px-3 text-sm text-[#F0EFE2] outline-none focus:border-[#6366F1]"
        />
        <span className="text-[11px] text-[#F0EFE2]/40">
          Optional — overrides the preset above. Use OpenRouter ids like{" "}
          <code className="text-[#F0EFE2]/55">google/gemma-2-9b-it:free</code>.
        </span>
      </label>

      {error ? (
        <p className="text-xs leading-relaxed text-rose-300" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={
          saving ||
          !effectiveModel.trim() ||
          (!snapshot?.apiKeySet && !apiKey.trim())
        }
        onClick={() => void handleSave()}
        className="inline-flex h-10 items-center justify-center gap-2 bg-[#4338CA] px-4 text-sm font-semibold text-[#F0EFE2] hover:bg-[#4f46e5] disabled:opacity-40"
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving…
          </>
        ) : (
          "Save company model"
        )}
      </button>
    </div>
  );
}
