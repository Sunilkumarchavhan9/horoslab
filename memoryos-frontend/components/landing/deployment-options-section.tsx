"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { HorosLogo, ModalLogo, RunPodLogo, K8sFaviconLogo, AMDLogo, AWSLogo, NvidiaLogo, UnitreeLogo } from "../horos/primitives/brand-icons";

// Helper component for the horizontal borders with corner intersection dots
function HorizontalDivider({ position = "top", infinite = false }: { position?: "top" | "bottom", infinite?: boolean }) {
  return (
    <>
      <div
        className={`absolute ${position}-0 ${infinite ? "left-1/2 -translate-x-1/2 w-[100vw]" : "left-0 w-full"} h-[1px] border-t border-dashed border-[#333] pointer-events-none z-0`}
      />
      {/* Corner intersection dots at left-0 and right-0 of the container */}
      <div
        className={`absolute ${position === "top" ? "top-[-2.5px]" : "bottom-[-2.5px]"} left-[-2.5px] w-[5px] h-[5px] bg-[#555] rounded-[1px] z-20 pointer-events-none`}
      />
      <div
        className={`absolute ${position === "top" ? "top-[-2.5px]" : "bottom-[-2.5px]"} right-[-2.5px] w-[5px] h-[5px] bg-[#555] rounded-[1px] z-20 pointer-events-none`}
      />
    </>
  );
}

export function DeploymentOptionsSection() {
  return (
    <section className="relative w-full bg-[#151515] font-sans overflow-hidden flex justify-center">

      {/* Outer Global Lines to match the Hardware section (6% and 94%) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
      </div>

      {/* Main Blueprint Container (aligned with the 120px inward margin on both sides) */}
      <div className="relative z-10 w-[92%] sm:w-[88%] lg:w-[calc(64%_-_240px)] flex flex-col pb-12 lg:pb-16">

        {/* Absolute Bottom Infinite Horizontal Line */}
        <HorizontalDivider position="bottom" infinite={true} />

        {/* Infinite Vertical Borders of the Main Box (These will exactly align with 14% and 86%) */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute left-0 top-[-100vh] bottom-[-100vh] w-[1px] border-l border-dashed border-[#333]" />
          <div className="absolute right-0 top-[-100vh] bottom-[-100vh] w-[1px] border-r border-dashed border-[#333]" />
        </div>

        {/* 1. Header Section */}
        <div className="w-full text-center py-20 relative z-10">
          <HorizontalDivider position="top" infinite={true} />
          <h2 className="text-3xl lg:text-4xl font-medium text-[#F0EFE2] tracking-tight">
            Our cloud, your cloud, or the physical <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-sm inline-block leading-tight">edge</span>
          </h2>
        </div>

        {/* Inner Container for Grid Sections */}
        <div className="relative w-full">
          {/* Fading Blueprint Grid Background (Starts Below Header) */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent_80%)] pointer-events-none opacity-50 z-0" />

          {/* 2. The Constant Section */}
          <div className="w-full p-5 lg:p-10 relative z-10">
            <HorizontalDivider position="top" />

            <div className="text-[#75bf00] text-[10px] font-bold uppercase tracking-widest mb-3">
              The Constant
            </div>
            <div className="text-[#e0e0e0] text-[14px] font-medium">
              Intelligence runs everywhere identically. You own the verified outcomes.
            </div>
          </div>

          {/* 3. The Three Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-dashed divide-[#333] relative z-10">
            <HorizontalDivider position="top" />

            {/* Column 1: Managed */}
            <div className="p-5 lg:p-10 relative group hover:bg-white/[0.03] transition-colors duration-300">
              {/* Inner vertical alignment dashed line */}
              <div className="absolute top-0 bottom-0 left-5 lg:left-10 w-[1px] border-l border-dashed border-[#333] group-hover:border-[#75bf00] transition-colors duration-300" />
              <div className="absolute top-[-2.5px] left-[calc(1.25rem-2.5px)] lg:left-[calc(2.5rem-2.5px)] w-[5px] h-[5px] bg-[#555] group-hover:bg-[#75bf00] rounded-[1px] transition-colors duration-300" />

              <div className="text-[#75bf00] text-[10px] font-bold uppercase tracking-widest mb-8 relative z-10">
                Managed
              </div>
              <div className="mb-6 flex items-center gap-3 text-[#F0EFE2] relative z-10 min-h-[32px]">
                <HorosLogo size={40} />
              </div>
              <h3 className="text-[#F0EFE2] text-lg font-semibold mb-3 relative z-10">
                HOROS Cloud
              </h3>
              <p className="text-[#C8C7BA] text-[13px] leading-relaxed relative z-10">
                A fully managed Reality Intelligence Runtime. HOROS handles node provisioning, container orchestration, and continuous state synchronization. You simply provide the authorized intent, and we scale the capabilities securely, billed purely on verified usage.
              </p>
            </div>

            {/* Column 2: Your Cloud */}
            <div className="p-5 lg:p-10 relative group hover:bg-white/[0.03] transition-colors duration-300">
              {/* Inner vertical alignment dashed line */}
              <div className="absolute top-0 bottom-0 left-5 lg:left-10 w-[1px] border-l border-dashed border-[#333] group-hover:border-[#75bf00] transition-colors duration-300" />
              <div className="absolute top-[-2.5px] left-[calc(1.25rem-2.5px)] lg:left-[calc(2.5rem-2.5px)] w-[5px] h-[5px] bg-[#555] group-hover:bg-[#75bf00] rounded-[1px] transition-colors duration-300" />

              <div className="text-[#75bf00] text-[10px] font-bold uppercase tracking-widest mb-8 relative z-10">
                Your Cloud
              </div>
              <div className="mb-6 flex items-center gap-4 relative z-10">
                <RunPodLogo size={28} />
                <ModalLogo size={28} />
                <img src="https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://vast.ai/&size=256" alt="Vast.ai" width={26} height={26} className="object-contain rounded-xs" />
                <img src="/brand-logos/coreweave.svg" alt="CoreWeave" width={100} height={22} className="object-contain h-6" />
              </div>
              <h3 className="text-[#F0EFE2] text-lg font-semibold mb-3 relative z-10">
                RunPod, Modal, Vast & CoreWeave
              </h3>
              <p className="text-[#C8C7BA] text-[13px] leading-relaxed mb-6 relative z-10">
                Bring your account, your endpoint URL, and your key. The Execution Layer seamlessly bridges to your preferred GPU cloud.
              </p>
              <p className="text-[#666] text-[12px] leading-relaxed mb-6 relative z-10">
                We manage the complexity of deploying models and tools into these environments, orchestrating the nodes and scaling the stack securely within your own infrastructure boundary.
              </p>
              <div className="inline-flex items-center gap-2 relative z-10 border border-dashed border-[#333] px-3 py-1.5 rounded-sm bg-[#111]">
                <div className="w-1.5 h-1.5 rounded-sm bg-[#75bf00]" />
                <span className="text-[#C8C7BA] text-[9px] font-bold uppercase tracking-widest">
                  More clouds coming soon
                </span>
              </div>
            </div>

            {/* Column 3: Your Hardware */}
            <div className="p-5 lg:p-10 relative group hover:bg-white/[0.03] transition-colors duration-300">
              {/* Inner vertical alignment dashed line */}
              <div className="absolute top-0 bottom-0 left-5 lg:left-10 w-[1px] border-l border-dashed border-[#333] group-hover:border-[#75bf00] transition-colors duration-300" />
              <div className="absolute top-[-2.5px] left-[calc(1.25rem-2.5px)] lg:left-[calc(2.5rem-2.5px)] w-[5px] h-[5px] bg-[#555] group-hover:bg-[#75bf00] rounded-[1px] transition-colors duration-300" />

              <div className="text-[#75bf00] text-[10px] font-bold uppercase tracking-widest mb-8 relative z-10">
                Your Hardware
              </div>
              <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 text-[#C8C7BA] relative z-10">
                <K8sFaviconLogo size={28} />
                <AWSLogo size={30} />
                <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg" alt="Azure" width={26} height={26} className="object-contain" />
                <NvidiaLogo size={28} className="text-[#76b900]" />
                <AMDLogo size={32} />
                <UnitreeLogo size={26} />
              </div>
              <h3 className="text-[#F0EFE2] text-lg font-semibold mb-3 relative z-10">
                Local Hardware & Robotics
              </h3>
              <p className="text-[#C8C7BA] text-[13px] leading-relaxed relative z-10">
                The deployment kit runs the exact same intelligence stack on anything you own. We manage the synchronization and state whether you deploy to AWS clusters, Azure confidential compute, NVIDIA edge GPUs, AMD APUs, or physical robots.
              </p>
            </div>

          </div>

          {/* 4. Footer Link */}
          <div className="w-full p-6 lg:p-8 flex items-center justify-center relative z-10 hover:bg-white/[0.04] transition-colors cursor-pointer group">
            <HorizontalDivider position="top" />
            <HorizontalDivider position="bottom" />

            <span className="text-[13px] font-medium text-[#F0EFE2] group-hover:text-[#F0EFE2] transition-colors flex items-center gap-2 relative z-10">
              Read the security page <ArrowRight size={14} className="text-[#75bf00] opacity-80 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </span>
          </div>

        </div>
      </div>
    </section>
  );
}
