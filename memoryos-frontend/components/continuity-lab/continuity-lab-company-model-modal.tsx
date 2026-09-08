"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { CompanyModelForm } from "@/components/continuity-lab/company-model-form";
import { useContinuityLab } from "@/components/continuity-lab/continuity-lab-context";

export function ContinuityLabCompanyModelModal() {
  const { companyModelModalOpen, closeCompanyModelModal, refreshCompanyModel } = useContinuityLab();

  useEffect(() => {
    if (!companyModelModalOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCompanyModelModal();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [companyModelModalOpen, closeCompanyModelModal]);

  if (!companyModelModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70"
        aria-label="Close company model"
        onClick={closeCompanyModelModal}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-model-title"
        className="relative z-10 w-full max-w-lg border border-[#2F2F2F] bg-[#0A0A0A] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#2F2F2F] px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6366F1]">
              Company model
            </p>
            <h2 id="company-model-title" className="mt-1 text-lg font-semibold text-[#F0EFE2]">
              OpenRouter for Continuity Lab
            </h2>
          </div>
          <button
            type="button"
            onClick={closeCompanyModelModal}
            className="inline-flex size-8 shrink-0 items-center justify-center border border-[#3A3A3A] text-[#F0EFE2]/70 hover:bg-[#141414]"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
          <CompanyModelForm
            compact
            onSaved={() => {
              void refreshCompanyModel();
            }}
          />
        </div>
      </div>
    </div>
  );
}
