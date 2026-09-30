"use client";

import { Reveal } from "./motion";
import { MemoryStarLogo } from "./memory-star-logo";
import { NoAmbientAuthorityVisual, MissionScopedAccessVisual } from "./principle-visuals";
import PixelTransition from "../PixelTransition";
import Dither from "../ui/Dither";

const PRINCIPLES = [
  {
    title: "No Ambient Authority",
    description: "Authority is never inherited implicitly. Every human, agent, and institution begins with zero privileges. Every capability must be explicitly granted through institutional policy, eliminating hidden trust paths and ensuring every consequential action has accountable authorization.",
  },
  { 
    title: "Mission-Scoped Access",
    description: "Authority is bound to a mission, not an identity. Capability Leases grant only the precise permissions required to accomplish an approved objective, automatically enforcing least privilege across repositories, infrastructure, APIs, and enterprise systems."
  },
  { 
    title: "Short-Lived Capability Leases",
    description: "Permissions are leased, never owned. Every capability is issued with defined scope, purpose, and expiration, then automatically revoked when the mission completes. Long-lived credentials disappear in favor of temporary, verifiable authority."
  },
  { 
    title: "Instant Revocation",
    description: "Authority remains continuously governed. Institutions can immediately revoke active capability leases, terminate missions, and invalidate execution rights whenever policies change, risks emerge, or verification fails—without waiting for credentials to expire."
  },
  { 
    title: "Evidence-Backed Audit Trail",
    description: "Every authorization, action, decision, verification, and outcome becomes immutable evidence. Dhyra builds an inspectable chain of proof that links who acted, why they acted, what evidence supported the action, and whether reality confirmed the result."
  },
  { 
    title: "Institutional Tenant Isolation",
    description: "Each institution executes inside an isolated trust boundary with dedicated authority, memory, policies, evidence, and execution state. Context, credentials, and decision history cannot cross organizational boundaries without explicit institutional authorization, preserving both security and governance."
  },
  { 
    title: "Sandboxed Execution",
    description: "Every mission executes inside an isolated runtime with dedicated compute, storage, and network boundaries. Agents cannot access external systems, secrets, or resources beyond their approved execution environment, preventing unintended side effects and containing failures by design."
  },
  { 
    title: "Independent Verification",
    description: "Execution and verification are separate responsibilities. Every consequential outcome is challenged by an independent verifier that validates evidence, tests claims, and determines whether the mission reaches PASS, FAIL, or UNKNOWN before any result is trusted. This separation ensures agents never grade their own work."
  },
  { 
    title: "Human Approval for High-Risk Actions",
    description: "High-impact decisions remain under human authority. Changes affecting production infrastructure, financial systems, security policies, customer data, or organizational governance require explicit approval before execution, ensuring critical actions remain accountable and policy compliant."
  },
];

export function ProductSurfacesSection() {
  return (
    <section className="bg-white border-y border-slate-200 text-slate-900 font-sans py-24 relative overflow-hidden">
      <div className="relative mx-auto max-w-[1400px] px-6 lg:px-12 z-10">

        {/* Top Centered Section */}
        <div className="flex flex-col items-center text-center mx-auto max-w-3xl mb-12">
          <Reveal>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-tight text-slate-900 leading-[1.1] mb-6">
              Authority, proof, and trust for autonomous <span className="text-[#0015FF]">organizations.</span>
            </h2>
            <p className="text-[16px] leading-relaxed text-slate-600 max-w-2xl mx-auto">
              Every agent, human, tool, budget, verifier, and policy acts inside a governed institutional boundary.
            </p>
          </Reveal>
        </div>

        {/* Product Surface Feature */}
        <div className="mx-auto w-full max-w-[1200px]">
          <Reveal>
            <div className="relative rounded-[2px] border border-dashed border-slate-200 bg-white p-4 sm:p-6 lg:p-8">
              <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_32px_-8px_rgba(0,0,0,0.08)]">
                <div className="relative w-full overflow-hidden bg-white">
                  <img
                    src="/m5.png"
                    alt="Capabilities Lease surface"
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                    className="pointer-events-none block h-[320px] w-full select-none object-cover object-top md:h-[420px] lg:h-[460px]"
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Principles */}
        <div className="mx-auto w-full max-w-[1200px] mt-14 relative">
          {/* Connector lines spanning the mt-14 margin above */}
          <div className="absolute -top-14 left-[-1px] h-14 w-px border-l border-dashed border-slate-200 hidden lg:block" />
          <div className="absolute -top-14 right-[-1px] h-14 w-px border-r border-dashed border-slate-200 hidden lg:block" />
          <Reveal>
            <div className="grid grid-cols-1 overflow-hidden rounded-[2px] border border-dashed border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-3">
              {PRINCIPLES.map((principle) => (
                <div
                  key={principle.title}
                  className="group min-h-[260px] border-dashed border-slate-200 sm:min-h-[300px] lg:min-h-[340px] lg:border-r lg:border-b"
                >
                  <PixelTransition
                    firstContent={
                      <div className="flex flex-col h-full w-full bg-white px-5 py-5">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400 mt-auto">
                          Principle
                        </div>
                        <div className="mt-4 max-w-[16rem] text-[18px] font-medium leading-snug text-slate-900">
                          {principle.title}
                        </div>
                        {principle.description && (
                          <div className="mt-3 text-[14px] leading-relaxed text-slate-500">
                            {principle.description}
                          </div>
                        )}
                      </div>
                    }
                    secondContent={
                      <div className="relative flex flex-col h-full w-full bg-slate-900 overflow-hidden">
                        <div className="absolute inset-0 z-0">
                          <Dither
                            waveColor={[0.9176470588235294, 0.7019607843137254, 0.03137254901960784]}
                            disableAnimation={false}
                            enableMouseInteraction
                            mouseRadius={0.3}
                            colorNum={14}
                            pixelSize={1}
                            waveAmplitude={0.65}
                            waveFrequency={5.5}
                            waveSpeed={0.11}
                          />
                        </div>
                        <div className="relative z-10 flex flex-col h-full px-5 py-5 pointer-events-none">
                          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#F0EFE2]/50 mt-auto drop-shadow-md">
                            Principle
                          </div>
                          <div className="mt-4 max-w-[16rem] text-[18px] font-medium leading-snug text-[#F0EFE2] drop-shadow-md">
                            {principle.title}
                          </div>
                          {principle.description && (
                            <div className="mt-3 text-[14px] leading-relaxed text-[#F0EFE2]/80 drop-shadow-md">
                              {principle.description}
                            </div>
                          )}
                        </div>
                      </div>
                    }
                    gridSize={8}
                    pixelColor="#ffffff"
                    once={false}
                    animationStepDuration={0.4}
                    className="w-full h-full"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}


