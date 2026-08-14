"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MemoryOSFullLogo } from "@/components/landing/memoryos-full-logo";
import Dither from "../ui/Dither";

const AppIcons = {
  observability: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-cyan-500 fill-current">
      <path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 14h2v3H7v-3zm4-5h2v8h-2V9zm4 3h2v5h-2v-5z" />
    </svg>
  ),
  terminal: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-green-500 fill-current">
      <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.1.89 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.11-.9-2-2-2zm0 14H4V8h16v10zm-2-1h-6v-2h6v2zM7.5 17l-1.41-1.41L8.67 13l-2.58-2.59L7.5 9l4 4-4 4z" />
    </svg>
  ),
  kubernetes: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-blue-500 fill-current">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-indigo-500 fill-current">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
    </svg>
  ),
  certificate: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-amber-500 fill-current">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
    </svg>
  ),
  git: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-orange-500 fill-current">
      <path d="M15.5 11h-2V7.5C13.5 6.12 12.38 5 11 5S8.5 6.12 8.5 7.5v6C8.5 14.88 9.62 16 11 16c.9 0 1.69-.47 2.13-1.19l1.67 1.05C13.88 17.5 12.56 18 11 18c-2.21 0-4-1.79-4-4V7.5C7 5.01 9.01 3 11.5 3S16 5.01 16 7.5V11zM11 7c-.28 0-.5.22-.5.5v6c0 .28.22.5.5.5s.5-.22.5-.5v-6c0-.28-.22-.5-.5-.5z" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-purple-500 fill-current">
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3 0 .16.03.31.06.46l-4.71 2.36A2.991 2.991 0 005 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.87 0 1.66-.37 2.21-.96l4.9 2.45c-.06.22-.11.45-.11.7 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3c-.93 0-1.77.43-2.32 1.1l-4.81-2.4c.08-.24.13-.5.13-.76s-.05-.52-.13-.76l4.81-2.4A2.992 2.992 0 0016 11zm0-4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM5 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm11 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 text-yellow-500 fill-current">
      <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.07-.12C8.18 11.47 10.5 7.43 14 2h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21z" />
    </svg>
  ),
};

const comparisonRows = [
  {
    prompt: "Why did the checkout service latency spike?",
    genericAi: {
      badge: "Observability Agent",
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-cyan-500 block" />
      ),
      text: `"Here is a dashboard showing a 400% latency increase. Here are 50 correlated errors and log traces."`,
    },
    memoryOs: {
      steps: [
        { icon: AppIcons.network, text: "Gathering telemetry and resolving dependency graph" },
        { icon: AppIcons.observability, text: "Generating hypotheses and searching for evidence" },
        { icon: AppIcons.git, text: "Root cause verified: PR #1042 introduced unindexed queries" },
        { icon: AppIcons.bolt, text: "Creating a mission to patch and routing for approval" },
      ],
      summaryBold: (
        <span>
          Root cause verified and mission created. <strong>Awaiting human approval</strong> for high-risk action.
        </span>
      ),
    },
  },
  {
    prompt: "Deploy the new inference engine configuration to production.",
    genericAi: {
      badge: "Script Agent",
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-slate-500 block" />
      ),
      text: `"I have generated the Kubernetes manifests. Review the code and run kubectl apply."`,
    },
    memoryOs: {
      steps: [
        { icon: AppIcons.shield, text: "Mission created. Capability lease granted for infrastructure change" },
        { icon: AppIcons.terminal, text: "Spec defined, implementation generated, and properties formally checked" },
        { icon: AppIcons.observability, text: "Independent verifier challenges the outcome in a sandboxed execution" },
        { icon: AppIcons.certificate, text: "PASS confirmed. Correctness Certificate issued" },
      ],
      summaryBold: (
        <span>
          <strong>PASS confirmed.</strong> The inference engine has been safely deployed with a cryptographic Correctness Certificate.
        </span>
      ),
    },
  },
  {
    prompt: "Refactor the authentication service to support OAuth2.",
    genericAi: {
      badge: "Coding Copilot",
      icon: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-purple-600">
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16zm-1-11h2v4h-2zm0 6h2v2h-2z" />
        </svg>
      ),
      text: `"Here is a suggested snippet for OAuth2 implementation. Make sure to update your tests."`,
    },
    memoryOs: {
      steps: [
        { icon: AppIcons.kubernetes, text: "Engaging institutional roles: Planner, Architect, Implementer, and Tester" },
        { icon: AppIcons.git, text: "Code rewritten and property tests generated" },
        { icon: AppIcons.shield, text: "Independent Verification role separated from Implementation" },
        { icon: AppIcons.certificate, text: "Merge Decision Certificate generated with full evidence trail" },
      ],
      summaryBold: (
        <span>
          Refactoring complete. <strong>Independent verification confirms 100% correctness</strong> before merging.
        </span>
      ),
    },
  },
  {
    prompt: "We've had three incidents this month from bad database migrations.",
    genericAi: {
      badge: "ChatGPT",
      icon: (
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current text-slate-800">
          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0813 4.779-2.7582a.7947.7947 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4952 4.4952zm-10.12-4.1165a4.4755 4.4755 0 0 1-.5355-3.0039l.142.083 4.779 2.7583a.7947.7947 0 0 0 .7902 0l5.8342-3.369v2.3372a.071.071 0 0 1-.0285.057l-4.8361 2.7963a4.504 4.504 0 0 1-6.1453-1.6589zm-1.0957-10.96a4.4755 4.4755 0 0 1 2.3409-1.9631l-.0047.1637v5.5163a.7947.7947 0 0 0 .3975.6813l5.8342 3.369-2.02 1.1686a.071.071 0 0 1-.0664.0047l-4.8361-2.7963a4.504 4.504 0 0 1-1.6454-6.1444zm16.597 3.0242l-5.8342-3.369 2.02-1.1686a.071.071 0 0 1 .0664-.0047l4.8361 2.7963a4.504 4.504 0 0 1 1.6454 6.1444 4.4755 4.4755 0 0 1-2.3409 1.9631l.0047-.1637V9.0536a.7947.7947 0 0 0-.3975-.6813zm2.502 4.9749l-.142-.083-4.779-2.7583a.7947.7947 0 0 0-.7902 0l-5.8342 3.369V11.5835a.071.071 0 0 1 .0285-.057l4.8361-2.7963a4.504 4.504 0 0 1 6.1453 1.6589 4.4755 4.4755 0 0 1 .5355 3.0039z" />
        </svg>
      ),
      text: `"You should implement stricter PR review policies and add a checklist for database changes."`,
    },
    memoryOs: {
      steps: [
        { icon: AppIcons.network, text: "Measuring fitness drop across trust, time, and human effort" },
        { icon: AppIcons.git, text: "Proposing institutional mutation: inserting 'DB Verifier' role" },
        { icon: AppIcons.observability, text: "Running counterfactual simulations across past 50 migrations" },
        { icon: AppIcons.bolt, text: "Simulation confirms 100% incident prevention" },
      ],
      summaryBold: (
        <span>
          Simulation complete. <strong>Institutional genome mutated</strong> to require independent DB Verification. Rollout recommended.
        </span>
      ),
    },
  },
  {
    prompt: "Give the deployment agent access to the AWS production account to fix the outage.",
    genericAi: {
      badge: "IAM Agent",
      icon: (
        <span className="w-3.5 h-3.5 rounded-full bg-orange-500 block" />
      ),
      text: `"I've granted the 'AdministratorAccess' role to the agent. Don't forget to remove it later."`,
    },
    memoryOs: {
      steps: [
        { icon: AppIcons.shield, text: "Authority bound to mission, not identity. Zero ambient authority" },
        { icon: AppIcons.terminal, text: "Short-lived capability lease granted explicitly for AWS EC2 restart" },
        { icon: AppIcons.kubernetes, text: "Execution contained within an isolated institutional trust boundary" },
        { icon: AppIcons.certificate, text: "Mission complete. Evidence backed audit trail logged" },
      ],
      summaryBold: (
        <span>
          Mission complete. <strong>Capability lease instantly revoked</strong> and immutable evidence recorded.
        </span>
      ),
    },
  },
];

function InViewDither({ waveColor }: { waveColor: [number, number, number] }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "200px 0px" });

  return (
    <div ref={ref} className="w-full h-full">
      {isInView && (
        <Dither
          waveColor={waveColor}
          disableAnimation={false}
          enableMouseInteraction
          mouseRadius={0.3}
          colorNum={4}
          pixelSize={1}
          waveAmplitude={0.75}
          waveFrequency={3.5}
          waveSpeed={0.08}
        />
      )}
    </div>
  );
}

export function PersonalMemorySection() {
  return (
    <div className="w-full bg-white text-[#111]" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
      <div className="w-full mx-auto py-12 md:py-16">
        {/* Main Section Header (Clean, borderless, full width with side padding) */}
        <div className="mb-14 text-center space-y-4 w-full max-w-[1240px] mx-auto px-4 md:px-8">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-6 w-full text-center">
            Agents are workers.<br className="md:hidden" /> <span className="italic font-light">Institutions are the <span className="text-[#0015FF]">runtime.</span></span>
          </h2>
          <p className="text-slate-600 text-[15px] md:text-[17px] max-w-[920px] mx-auto leading-relaxed text-center">
            Epoch turns repeatable agent work into programmable institutions with mission, authority, roles, budgets, policies, communication, evidence contracts, verification, settlement, memory, fitness, and evolution.
          </p>
        </div>

        {/* 3-Column Engineering Dot-Pattern Comparison Grid Container (Full Width #c9d8ee Connection) */}
        <div className="w-full bg-white border-t border-dashed border-[#c9d8ee] divide-y divide-dashed divide-[#c9d8ee]">
          {comparisonRows.map((row, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.04 }}
              className="grid grid-cols-1 lg:grid-cols-12 relative"
            >
              {/* Column 1: "When you ask" (Clean White Background, lg:col-span-3) */}
              <div className="lg:col-span-3 p-6 md:p-8 bg-white border-b lg:border-b-0 lg:border-r border-dashed border-[#c9d8ee] flex flex-col justify-start relative overflow-hidden">
                
                {/* Background Dither (Conditionally mounted via IntersectionObserver to prevent WebGL crashes) */}
                <div className="absolute top-0 left-0 z-0 pointer-events-auto mix-blend-multiply opacity-20" style={{ width: '1080px', height: '1080px' }}>
                  <InViewDither
                    waveColor={
                      idx === 0 ? [0.38823529411764707,0.08627450980392157,0.1411764705882353] :
                      idx === 1 ? [0.023529411764705882,0.7137254901960784,0.8313725490196079] :
                      idx === 2 ? [0.023529411764705882,0.8313725490196079,0.2196078431372549] :
                      idx === 3 ? [0.5686274509803921,0.8313725490196079,0.023529411764705882] :
                      idx === 4 ? [0.8313725490196079,0.5568627450980392,0.023529411764705882] :
                      [0.8313725490196079,0.25098039215686274,0.023529411764705882]
                    }
                  />
                </div>

                <div className="relative z-10">
                  <span className="text-[12px] font-medium text-slate-400 mb-3 block">
                    When you ask
                  </span>
                  <h3 className="text-[18px] md:text-[20px] font-normal text-slate-900 leading-[1.35] tracking-tight">
                    {row.prompt}
                  </h3>
                </div>
              </div>

              {/* Ultra-Fine Dotted Mesh Canvas Area for Columns 2 & 3 */}
              <div className="lg:col-span-9 grid grid-cols-1 lg:grid-cols-12 relative bg-[radial-gradient(#d4d4d8_1px,transparent_1px)] [background-size:8px_8px]">

                {/* Column 2: Generic AI Quote (lg:col-span-6) */}
                <div className="lg:col-span-6 p-6 md:p-10 flex flex-col items-center justify-center relative border-b lg:border-b-0 lg:border-r border-dashed border-[#c9d8ee] pt-10">

                  {/* Floating Trapezoid Notch Badge Tab for Generic AI extending DOWN */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center z-10 w-[180px] h-[28px]">
                    {/* Dither Background Clipped to Trapezoid */}
                    <div 
                      className="absolute inset-0 w-full h-full opacity-40 mix-blend-multiply" 
                      style={{ clipPath: 'polygon(0 0, 25px 0, 38px 28px, 142px 28px, 155px 0, 180px 0)' }}
                    >
                      <InViewDither waveColor={[0.6, 0.7, 0.9]} />
                    </div>
                    {/* Outline SVG */}
                    <svg width="180" height="28" viewBox="0 0 180 28" className="absolute top-0 overflow-visible pointer-events-none">
                      <path
                        d="M 0 0 L 25 0 L 38 28 L 142 28 L 155 0 L 180 0"
                        fill="transparent"
                        stroke="#c9d8ee"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    </svg>
                    <div className="absolute top-1.5 flex items-center justify-center gap-1.5 text-[11px] text-slate-800 font-medium z-10">
                      <span>{row.genericAi.icon}</span>
                      <span>{row.genericAi.badge}</span>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-md p-6 text-center text-[12px] md:text-[13px] text-slate-700 leading-relaxed shadow-[0_2px_12px_rgba(0,0,0,0.03)] w-full max-w-[340px] mt-4">
                    {row.genericAi.text}
                  </div>
                </div>

                {/* Central Floating Calligraphic Warm Copper VS Badge */}
                <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                    <span className="italic text-[#b45309] text-[15px] font-light tracking-wide">
                      vs
                    </span>
                  </div>
                </div>

                {/* Column 3: Official Navbar Logo Badge Tab (lg:col-span-6) */}
                <div className="lg:col-span-6 p-6 md:p-10 flex flex-col items-center justify-center relative pt-10">

                  {/* Floating Trapezoid Notch Badge Tab for Epoch Navbar Logo extending DOWN */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center z-10 w-[180px] h-[28px]">
                    {/* Dither Background Clipped to Trapezoid */}
                    <div 
                      className="absolute inset-0 w-full h-full opacity-40 mix-blend-multiply" 
                      style={{ clipPath: 'polygon(0 0, 25px 0, 38px 28px, 142px 28px, 155px 0, 180px 0)' }}
                    >
                      <InViewDither waveColor={[0.9, 0.7, 0.4]} />
                    </div>
                    {/* Outline SVG */}
                    <svg width="180" height="28" viewBox="0 0 180 28" className="absolute top-0 overflow-visible pointer-events-none">
                      <path
                        d="M 0 0 L 25 0 L 38 28 L 142 28 L 155 0 L 180 0"
                        fill="transparent"
                        stroke="#c9d8ee"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                    </svg>
                    <div className="absolute top-1 flex items-center justify-center z-10">
                      <MemoryOSFullLogo className="h-5 w-auto text-slate-900" />
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200/90 rounded-md p-6 text-[11px] md:text-[12px] text-slate-600 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)] w-full max-w-[360px] mt-4">

                    {/* Live Icon Execution Steps connected by Vertical Timeline Spine */}
                    <div className="relative pl-7 space-y-3.5">
                      {/* Continuous Vertical Timeline Spine Line */}
                      <div className="absolute left-[7px] top-2 bottom-2 w-[3px] bg-slate-200/90 rounded-full" />

                      {row.memoryOs.steps.map((step, sIdx) => (
                        <div key={sIdx} className="flex items-start gap-3 relative z-10 leading-snug">
                          {/* SVG Brand Icon centered on top of spine */}
                          <div className="absolute -left-[23px] top-0.5 bg-white p-0.5 rounded-full shadow-25">
                            {step.icon}
                          </div>
                          <span className="text-slate-500 text-[11px] leading-relaxed">{step.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Summary Rationale */}
                    <div className="pt-3 border-t border-slate-100 text-[11.5px] text-slate-800 leading-relaxed">
                      {row.memoryOs.summaryBold}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}


