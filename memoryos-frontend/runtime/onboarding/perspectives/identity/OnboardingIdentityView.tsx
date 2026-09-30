"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useOnboardingStore } from "../../store";
import Image from "next/image";
import { BrainWaves } from "@/components/ui/brain-waves";

export function OnboardingIdentityView() {
  const { institutionName, institutionPurpose, setInstitutionDetails, setStep } = useOnboardingStore();

  const [localName, setLocalName] = useState(institutionName);
  const [localPurpose, setLocalPurpose] = useState(institutionPurpose);

  const handleNext = () => {
    if (localName.trim().length > 0) {
      setInstitutionDetails(localName, localPurpose);
      setStep('team');
    }
  };

  return (
    <div className="flex w-full h-full animate-in fade-in duration-700 bg-[#e8e8e8]">
      {/* Left side: Image */}
      <div className="hidden md:flex flex-col w-1/2 h-full relative border-r border-slate-300 bg-[#0c1875]">
        <img
          src="/images/sv1.png"
          alt="Dhyra Temple"
          className="w-full h-full object-contain object-top absolute inset-0 z-0"
        />

        {/* Bottom area for Brain Waves and Card */}
        <div className="absolute bottom-0 left-0 w-full h-[45%] flex items-end p-8 overflow-hidden z-10">
          <BrainWaves />

        </div>
      </div>

      {/* Right side: Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col justify-center px-12 lg:px-24 bg-[#e8e8e8] relative">
        {/* CSS Noise Texture Overlay for the right side */}
        <div
          className="absolute inset-0 opacity-[0.35] pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        ></div>

        <div className="relative z-10 max-w-xl w-full mx-auto">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 mb-6">
            Initialize Dhyra workspace
          </h1>
          <p className="text-slate-800 text-[15px] mb-12 font-medium leading-relaxed max-w-sm">
            Define the identity and genome of your Dhyra workspace. This establishes the foundation for Mission Control, agents, and policies.
          </p>

          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-bold text-slate-800">
                Dhyra Workspace Name
              </label>
              <input
                type="text"
                value={localName}
                onChange={(e) => setLocalName(e.target.value)}
                className="w-full bg-white border border-slate-400 rounded-sm px-4 py-3 text-[15px] focus:outline-none focus:border-slate-500 transition-all text-slate-900 shadow-sm"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[14px] font-bold text-slate-800">
                Workspace Genome (Optional)
              </label>
              <textarea
                value={localPurpose}
                onChange={(e) => setLocalPurpose(e.target.value)}
                className="w-full bg-white border border-slate-400 rounded-sm px-4 py-3 text-[15px] h-32 resize-none focus:outline-none focus:border-slate-500 transition-all text-slate-900 shadow-sm"
              />
            </div>
          </div>

          <div className="flex justify-end mt-16">
            <button
              onClick={handleNext}
              disabled={localName.trim().length === 0}
              className="flex items-center justify-center gap-4 bg-white text-slate-900 border border-slate-400 font-bold px-4 py-2 hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm min-w-[200px]"
            >
              Continue to Mission Control
              <ArrowRight className="size-5 text-slate-400" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
