"use client";

import React, { useState } from "react";
import { X, Check, Edit2, ShieldCheck, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
  dark?: boolean;
}

export function AddFundsModal({ isOpen, onClose, onSuccess, dark = true }: AddFundsModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>("100");
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customAmountText, setCustomAmountText] = useState<string>("100");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentAmountNumber = isCustom
    ? parseFloat(customAmountText) || 0
    : parseFloat(selectedPreset) || 0;

  const handleCheckout = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSuccess) onSuccess(currentAmountNumber);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div
        className={cn(
          "w-full max-w-4xl border p-6 shadow-2xl rounded-xs relative text-left font-sans animate-in zoom-in-95 duration-150",
          dark ? "border-[#2e2e2e] bg-[#121212] text-[#F0EFE2]" : "border-[#c9cec4] bg-white text-[#171a17]"
        )}
      >
        {/* Modal Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 text-[#C8C7BA] hover:text-[#F0EFE2] transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 border-b border-[#242424] pb-5">
          <h2 className="text-xl font-bold text-[#F0EFE2] tracking-tight">Add funds</h2>
          <p className="text-xs text-[#90988c] max-w-3xl leading-relaxed">
            A one-time top-up, not a subscription change. Funds cover optimization, the agent, and per-million-token inference. No subscription. Top-ups stay valid for one year.
          </p>
          <p className="text-xs text-[#75bf00] font-mono font-medium pt-1">
            Choosing a specific GPU unlocks at $50 in lifetime credit purchases.
          </p>
        </div>

        {/* 2-Column Split Body */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          {/* Left Column: Top Up Your Balance */}
          <div className="border border-[#222222] bg-[#161616] p-5 rounded-xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-[#F0EFE2]">Top up your balance</h3>
              <p className="text-xs text-[#788274] leading-relaxed">
                One balance for the whole workspace, with no subscription. Add funds whenever you need them and spend as you go.
              </p>
            </div>

            {/* AMOUNT Grid */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-mono uppercase text-[#788274] tracking-wider block">
                AMOUNT
              </label>

              <div className="grid grid-cols-3 gap-2.5">
                {["10", "25", "50", "100", "250", "500"].map((amt) => {
                  const isSelected = !isCustom && selectedPreset === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setIsCustom(false);
                        setSelectedPreset(amt);
                      }}
                      className={cn(
                        "py-2.5 font-bold font-mono text-sm rounded-xs border transition-all cursor-pointer text-center",
                        isSelected
                          ? "border-[#75bf00] bg-[#1a2910] text-[#75bf00] shadow-[0_0_12px_rgba(117,191,0,0.15)]"
                          : "border-[#2a2a2a] bg-[#1c1c1c] text-[#F0EFE2] hover:border-[#444] hover:bg-[#222]"
                      )}
                    >
                      ${amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Toggle Button */}
              <button
                type="button"
                onClick={() => setIsCustom(!isCustom)}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2 font-mono text-xs rounded-xs border transition-colors cursor-pointer",
                  isCustom
                    ? "border-[#75bf00] bg-[#1a2910] text-[#75bf00] font-bold"
                    : "border-[#2a2a2a] bg-[#1c1c1c] text-[#a0a0a0] hover:text-[#F0EFE2] hover:border-[#444]"
                )}
              >
                <Edit2 size={12} />
                <span>Custom amount</span>
              </button>

              {/* Custom Input Field */}
              {isCustom && (
                <div className="space-y-1 pt-1 animate-in fade-in duration-100">
                  <div className="relative border border-[#75bf00] bg-[#121212] rounded-xs flex items-center px-3 py-2">
                    <span className="font-mono text-sm font-bold text-[#75bf00] mr-2">$</span>
                    <input
                      autoFocus
                      type="number"
                      value={customAmountText}
                      onChange={(e) => setCustomAmountText(e.target.value)}
                      className="w-full bg-transparent font-mono text-sm text-[#F0EFE2] outline-none"
                      placeholder="100"
                    />
                  </div>
                  <p className="text-[11px] text-[#788274] font-mono">
                    Adds ${currentAmountNumber} to your balance.
                  </p>
                </div>
              )}
            </div>

            {/* What your balance covers */}
            <div className="border-t border-[#262626] pt-4 space-y-2 text-xs">
              <span className="font-bold text-[#F0EFE2] block">What your balance covers</span>
              <ul className="space-y-1.5 text-[#a0a89d]">
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#75bf00] shrink-0" />
                  <span>Optimization runs and benchmarking</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#75bf00] shrink-0" />
                  <span>The agent, plans, and runbooks</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={13} className="text-[#75bf00] shrink-0" />
                  <span>Per-million-token inference on deployed endpoints</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column: Payment & Stripe Checkout */}
          <div className="border border-[#222222] bg-[#161616] p-5 rounded-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-[#F0EFE2]">Payment</h3>
                <p className="text-xs text-[#788274] leading-relaxed">
                  Card, billing details, and confirmation on Stripe&apos;s secure checkout page. You come straight back here after paying.
                </p>
              </div>

              <div className="border-t border-b border-[#262626] py-3 flex items-center justify-between font-mono text-sm">
                <span className="text-[#F0EFE2] font-medium">One-time top-up</span>
                <span className="font-bold text-[#F0EFE2] text-base">${currentAmountNumber}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                disabled={isSubmitting || currentAmountNumber <= 0}
                onClick={handleCheckout}
                className="w-full flex items-center justify-center gap-2 bg-[#75bf00] hover:bg-[#86dc00] text-black font-bold text-xs py-3 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Connecting to Stripe checkout…</span>
                ) : (
                  <>
                    <span>Continue to secure checkout</span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#666]">
                <ShieldCheck size={12} className="text-[#75bf00]" />
                <span>Secure checkout via Stripe.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
