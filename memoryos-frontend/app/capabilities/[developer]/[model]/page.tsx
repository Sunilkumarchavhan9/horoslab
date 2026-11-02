import { SectionDivider } from "@/components/landing/section-divider";

import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2, FileText, ChevronRight, ChevronDown, Copy, Check, Link as LinkIcon, Type, ShieldCheck, Package } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { CAPABILITIES } from "@/lib/capabilities-data";
import { HorosLogo } from "@/components/horos/primitives/horos-logo";
import { NvidiaLogo } from "@/components/horos/primitives/brand-icons";
import { FullSpecAccordion } from "@/components/horos/capabilities/full-spec-accordion";
import { CodeExamples } from "@/components/horos/capabilities/code-examples";

interface PageProps {
  params: Promise<{
    developer: string;
    model: string;
  }>;
}

export default async function CapabilityDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const decodedDeveloper = decodeURIComponent(resolvedParams.developer);
  const decodedModel = decodeURIComponent(resolvedParams.model);
  const devLower = decodedDeveloper.toLowerCase();
  const modelLower = decodedModel.toLowerCase();
  const capability = CAPABILITIES.find(
    c =>
      (c.developer.toLowerCase() === devLower && c.name.toLowerCase() === modelLower) ||
      c.id.toLowerCase() === modelLower ||
      c.name.toLowerCase() === modelLower
  );

  if (!capability) {
    notFound();
  }

  return (
    <div className="relative min-h-screen bg-[#151515] text-[#C8C7BA] font-sans flex flex-col">
      {/* Background Dashed Lines - Global Layout */}
      {/* 4 Adaptive Vertical Guidelines (2 on Left, 2 on Right) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Left Outer Line */}
        <div className="hidden md:block absolute left-[4%] lg:left-[5%] xl:left-[7%] 2xl:left-[10%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#262626]" />
        {/* Left Inner Line */}
        <div className="absolute left-[3%] md:left-[8%] lg:left-[10%] xl:left-[14%] 2xl:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        {/* Right Inner Line */}
        <div className="absolute right-[3%] md:right-[8%] lg:right-[10%] xl:right-[14%] 2xl:right-[18%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#333]" />
        {/* Right Outer Line */}
        <div className="hidden md:block absolute right-[4%] lg:right-[5%] xl:right-[7%] 2xl:right-[10%] top-0 bottom-0 w-[1px] border-r border-dashed border-[#262626]" />
            </div>

      <div className="relative z-10 flex flex-col w-full min-h-screen">
        <div className="w-full flex justify-center">
          <div className="w-full">
            <LandingNavbar />
          </div>
        </div>

        <main className="flex-grow flex flex-col w-full relative z-10">
          
          {/* Header Section */}
          <div className="w-full relative">
            <SectionDivider position="top" />
            <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 flex flex-col items-start border-x border-dashed border-[#333]">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-[10px] md:text-[11px] lg:text-[12px] text-[#777] mb-12">
                <Link href="/capabilities" className="hover:text-[#C8C7BA] transition-colors">Capability Graph</Link>
                <span>/</span>
                <span className="hover:text-[#C8C7BA] transition-colors cursor-pointer">{capability.developer}</span>
                <span>/</span>
                <span className="text-[#C8C7BA]">{capability.name}</span>
              </div>

              <div className="w-full flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 w-full">
                  
                  {/* Left: Identity */}
                  <div className="flex items-center gap-5">
                    <div className="w-[68px] h-[68px] bg-[#111] border border-[#333] flex items-center justify-center rounded-[2px] shrink-0">
                      <capability.icon size={36} className="text-[#C8C7BA]" />
                    </div>
                    <div className="flex flex-col">
                      <h1 className="text-4xl md:text-[42px] font-medium text-[#C8C7BA] tracking-tight mb-2 leading-none">{capability.name}</h1>
                      <div className="flex items-center gap-4 text-[11px] md:text-[12px] lg:text-[13px] text-[#888]">
                        <span>{capability.providerSlug}/{capability.id}</span>
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#C8C7BA] transition-colors">
                          <Copy size={12} className="text-[#666]" />
                        </div>
                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#C8C7BA] transition-colors">
                          <Share2 size={12} className="text-[#666]" />
                          <span>Share</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-6 shrink-0 mt-2 md:mt-0">
                    <button className="bg-[#76b900] hover:bg-[#86d900] text-[#111] font-medium px-5 py-2 transition-colors flex items-center gap-2 text-[12px] md:text-[13px] lg:text-[14px]">
                      Get API key <ChevronRight size={16} />
                    </button>
                    <Link href="#" className="text-[11px] md:text-[12px] lg:text-[13px] text-[#999] hover:text-[#C8C7BA] underline underline-offset-4 transition-colors">
                      Chat Completions API reference
                    </Link>
                  </div>
                </div>

                <p className="text-[#aaa] text-[12px] md:text-[13px] lg:text-[14px] leading-relaxed max-w-[95%] mt-2">
                  {capability.description}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="w-full relative">
            <SectionDivider position="top" />
            <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 border-x border-dashed border-[#333]">
              <div className="flex justify-between items-end mb-6">
                <h2 className="text-[18px] md:text-[20px] lg:text-[22px] font-medium text-[#C8C7BA]">Pricing</h2>
                <span className="text-[10px] md:text-[11px] lg:text-[12px] text-[#777]">USD, pay per token</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 border border-dashed border-[#333] divide-y md:divide-y-0 md:divide-x divide-dashed divide-[#333] bg-[#202020]">
                <div className="p-8 flex flex-col">
                  <div className="flex items-start gap-1 mb-2">
                    <span className="text-[14px] md:text-[15px] lg:text-[16px] text-[#888] font-medium mt-2">$</span>
                    <span className="text-[44px] font-medium text-[#C8C7BA] tracking-tight leading-none">{capability.metrics.input.replace('$', '')}</span>
                  </div>
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777]">per 1M input tokens</span>
                </div>
                <div className="p-8 flex flex-col">
                  <div className="flex items-start gap-1 mb-2">
                    <span className="text-[14px] md:text-[15px] lg:text-[16px] text-[#888] font-medium mt-2">$</span>
                    <span className="text-[44px] font-medium text-[#C8C7BA] tracking-tight leading-none">{capability.metrics.cached.replace('$', '')}</span>
                  </div>
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777]">per 1M cached input tokens</span>
                </div>
                <div className="p-8 flex flex-col">
                  <div className="flex items-start gap-1 mb-2">
                    <span className="text-[14px] md:text-[15px] lg:text-[16px] text-[#888] font-medium mt-2">$</span>
                    <span className="text-[44px] font-medium text-[#C8C7BA] tracking-tight leading-none">{capability.metrics.output.replace('$', '')}</span>
                  </div>
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777]">per 1M output tokens</span>
                </div>
              </div>
            </div>
          </div>

          {/* Measured Performance Section */}
          <div className="w-full relative">
            <SectionDivider position="top" />
            <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 border-x border-dashed border-[#333]">
              <div className="flex justify-between items-baseline mb-6">
                <h2 className="text-[18px] md:text-[20px] lg:text-[22px] font-medium text-[#C8C7BA]">Measured performance</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 border border-dashed border-[#333] divide-y md:divide-y-0 md:divide-x divide-dashed divide-[#333] bg-[#202020]">
                <div className="p-8 flex flex-col">
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777] mb-4">Output speed</span>
                  <div className="text-[44px] font-medium text-[#C8C7BA] tracking-tight leading-none mb-2">{capability.metrics.speed}</div>
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777]">{capability.speedLabel}</span>
                </div>
                <div className="p-8 flex flex-col">
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777] mb-4">Time to first token</span>
                  <div className="text-[44px] font-medium text-[#C8C7BA] tracking-tight leading-none mb-2">{capability.metrics.timeToFirst}</div>
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777]">milliseconds to first reasoning token</span>
                </div>
                <div className="p-8 flex flex-col relative">
                  <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777] mb-4">Cache hit rate</span>
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-[44px] font-medium text-[#C8C7BA] tracking-tight leading-none">{capability.metrics.cacheHit}</span>
                    <span className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777]">last 24 hours</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Specs & Capacity Section */}
          <div className="w-full relative">
            <SectionDivider position="top" />
            <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 border-x border-dashed border-[#333]">
              <div className="border border-dashed border-[#333] flex flex-col">
                <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-dashed divide-[#333]">
                  
                  {/* Access */}
                  <div className="p-8 flex flex-col">
                    <h3 className="text-base md:text-[17px] lg:text-[18px] font-medium text-[#C8C7BA] mb-1">Access</h3>
                    <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777] mb-8">Confirm how your client reaches this model.</p>
                    
                    <div className="flex flex-col text-[11px] md:text-[12px] lg:text-[13px]">
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[35%] text-[#777] shrink-0">Provider</span>
                        <div className="w-[65%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <capability.icon size={14} className="mt-[2px] shrink-0" />
                          <span>{capability.developer}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[35%] text-[#777] shrink-0">API compatibility</span>
                        <div className="w-[65%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <LinkIcon size={14} className="text-[#666] mt-[2px] shrink-0" />
                          <span>{capability.specs.apiCompatibility}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[35%] text-[#777] shrink-0">Anthropic compatibility</span>
                        <div className="w-[65%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <LinkIcon size={14} className="text-[#666] mt-[2px] shrink-0" />
                          <span>{capability.specs.anthropicCompatibility}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[35%] text-[#777] shrink-0">Accepted input</span>
                        <div className="w-[65%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <Type size={14} className="text-[#666] mt-[2px] shrink-0" />
                          <span>{capability.specs.acceptedInput}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[35%] text-[#777] shrink-0">Availability</span>
                        <div className="w-[65%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <span>{capability.specs.availability}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[35%] text-[#777] shrink-0">Data retention</span>
                        <div className="w-[65%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <ShieldCheck size={14} className="text-[#666] mt-[2px] shrink-0" />
                          <span>{capability.specs.dataRetention}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Capacity */}
                  <div className="p-8 flex flex-col">
                    <h3 className="text-base md:text-[17px] lg:text-[18px] font-medium text-[#C8C7BA] mb-1">Capacity</h3>
                    <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777] mb-8">Check the limits your workload must fit.</p>
                    
                    <div className="flex flex-col text-[11px] md:text-[12px] lg:text-[13px]">
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[45%] text-[#777] shrink-0">Context window</span>
                        <div className="w-[55%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <Package size={14} className="text-[#666] mt-[2px] shrink-0" />
                          <span>{capability.specs.contextWindow}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[45%] text-[#777] shrink-0">Maximum request size</span>
                        <div className="w-[55%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <Package size={14} className="text-[#666] mt-[2px] shrink-0" />
                          <span>{capability.specs.maxRequestSize}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[45%] text-[#777] shrink-0">Maximum generated output</span>
                        <div className="w-[55%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <FileText size={14} className="text-[#666] mt-[2px] shrink-0" />
                          <span>{capability.specs.maxGeneratedOutput}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Capabilities */}
                  <div className="p-8 flex flex-col">
                    <h3 className="text-base md:text-[17px] lg:text-[18px] font-medium text-[#C8C7BA] mb-1">Capabilities</h3>
                    <p className="text-[11px] md:text-[12px] lg:text-[13px] text-[#777] mb-8">See which request modes the API supports.</p>
                    
                    <div className="flex flex-col text-[11px] md:text-[12px] lg:text-[13px]">
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[45%] text-[#777] shrink-0">Tool calling</span>
                        <div className="w-[55%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <Check size={14} className="text-[#76b900] mt-[2px] shrink-0" />
                          <span>{capability.specs.capabilities.toolCalling}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[45%] text-[#777] shrink-0">JSON mode</span>
                        <div className="w-[55%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <Check size={14} className="text-[#76b900] mt-[2px] shrink-0" />
                          <span>{capability.specs.capabilities.jsonMode}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[45%] text-[#777] shrink-0">Streaming</span>
                        <div className="w-[55%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <Check size={14} className="text-[#76b900] mt-[2px] shrink-0" />
                          <span>{capability.specs.capabilities.streaming}</span>
                        </div>
                      </div>
                      <div className="flex py-3.5 border-b border-dashed border-[#333]">
                        <span className="w-[45%] text-[#777] shrink-0">Precision</span>
                        <div className="w-[55%] text-[#C8C7BA] font-medium flex items-start justify-end gap-2 text-right">
                          <span>{capability.specs.capabilities.precision}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <FullSpecAccordion />
              </div>
            </div>
          </div>

          {/* Code Examples Section */}
          <div className="w-full relative">
            <SectionDivider position="top" />
            <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16 border-x border-dashed border-[#333]">
              <CodeExamples capabilityId={capability.id} />
            </div>
          </div>

        </main>

        <FooterCtaSection />
      </div>
    </div>
  );
}
