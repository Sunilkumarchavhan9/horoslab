"use client";
import { SectionDivider } from "@/components/landing/section-divider";


import React, { useState } from "react";
import Link from "next/link";
import { Search, ChevronDown, ArrowRight, ArrowUpRight, Sun, Monitor, Moon, SearchCode, Database, Zap, ArrowRightCircle } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { HorosLogo } from "@/components/horos/primitives/horos-logo";
import { 
  QwenLogo, 
  DeepSeekLogo, 
  NvidiaLogo, 
  OneXLogo,
  HuggingFaceLogo,
  TeslaLogo,
  GithubLogo
} from "@/components/horos/primitives/brand-icons";

import { CAPABILITIES } from "@/lib/capabilities-data";

export default function CapabilitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("catalog");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Compute unique tags dynamically
  const tagCounts = CAPABILITIES.reduce((acc, c) => {
    c.tags.forEach(tagGroup => {
      const splitTags = tagGroup.split(/\s*(?:\/|·)\s*/);
      splitTags.forEach(t => {
        const trimmed = t.trim();
        if (trimmed && trimmed !== "Trending") {
          acc[trimmed] = (acc[trimmed] || 0) + 1;
        }
      });
    });
    return acc;
  }, {} as Record<string, number>);

  const uniqueTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);

  const filteredCapabilities = CAPABILITIES.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeFilter === "all") return true;
    
    // Check if any of the model's split tags match the activeFilter
    return c.tags.some(tagGroup => {
      const splitTags = tagGroup.split(/\s*(?:\/|·)\s*/).map(t => t.trim());
      return splitTags.includes(activeFilter);
    });
  }).sort((a, b) => {
    if (sortOrder === "alpha") {
      return a.name.localeCompare(b.name);
    }
    if (sortOrder === "price-asc" || sortOrder === "price-desc") {
      const priceA = parseFloat(a.metrics.input.replace('$', '')) || 0;
      const priceB = parseFloat(b.metrics.input.replace('$', '')) || 0;
      return sortOrder === "price-asc" ? priceA - priceB : priceB - priceA;
    }
    return 0; // "catalog" defaults to original order
  });

  return (
    <div className="relative min-h-screen bg-[#151515] text-[#F0EFE2] font-sans flex flex-col">
      {/* Background Dashed Lines - Global Layout */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Outer Lines (Mobile & Desktop) */}
        <div className="hidden md:block absolute left-[calc(18%_+_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[14%] lg:left-[18%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="absolute hidden md:block left-[86%] lg:left-[82%] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />
        <div className="hidden md:block absolute left-[calc(82%_-_120px)] top-0 bottom-0 w-[1px] border-l border-dashed border-[#333]" />

        {/* Inner Lines (Desktop Only) */}
        </div>

      <div className="relative z-10 flex flex-col w-full min-h-screen">
        <div className="w-full flex justify-center">
          <div className="w-full">
            <LandingNavbar />
          </div>
        </div>
        
        <main className="flex-grow flex flex-col items-center w-full relative z-10">
          <div className="w-[88%] md:w-[72%] lg:w-[64%] lg:w-[64%] mx-auto flex flex-col border-x border-dashed border-[#333]">
            {/* Header Section */}
            <div className="w-full px-6 md:px-[120px]  py-20 lg:py-28 flex flex-col items-start border-b border-dashed border-[#333]">
              <h1 className="text-4xl md:text-[56px] leading-[1.1] font-semibold tracking-tight text-[#F0EFE2] mb-6">
                Capabilities <span className="bg-[#75bf00] text-[#151515] px-2 py-0.5 ml-1">Graph</span>
              </h1>
              <p className="text-xl md:text-[22px] text-[#A3A39A] max-w-3xl leading-snug">
                <span className="text-[#F0EFE2] font-medium">Built for agents that replay context and decode reality.</span> Agent traffic resends the whole conversation or sensor state on every tool call. Here the repeated part hits cache and bills at the cached input rate.
              </p>
            </div>

            {/* Controls Section */}
            <div className="w-full px-6 md:px-[120px]  py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dashed border-[#333] bg-[#151515]">
              <div className="relative flex-grow max-w-xl">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#75bf00]" />
                <input 
                  type="text" 
                  placeholder="Search models, IDs, or capabilities" 
                  className="w-full bg-transparent border-none text-[14px] text-[#F0EFE2] placeholder-[#666] focus:outline-none focus:ring-0 pl-10 py-3"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex items-center gap-4 text-[13px] text-[#999]">
                
                <div className="relative">
                  <div 
                    className="flex items-center gap-2 border border-dashed border-[#444] px-3 py-1.5 rounded-[4px] cursor-pointer hover:border-[#666] transition-colors"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  >
                    <span className="text-[#F0EFE2]">
                      {sortOrder === "catalog" ? "Catalog order" : 
                       sortOrder === "alpha" ? "Alphabetical (A-Z)" : 
                       sortOrder === "price-asc" ? "Price (Low to High)" : 
                       "Price (High to Low)"}
                    </span>
                    <ChevronDown size={14} className={`text-[#666] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-dashed border-[#333] rounded-[4px] py-2 z-50 shadow-xl flex flex-col">
                      {[
                        { id: "catalog", label: "Catalog order" },
                        { id: "alpha", label: "Alphabetical (A-Z)" },
                        { id: "price-asc", label: "Price (Low to High)" },
                        { id: "price-desc", label: "Price (High to Low)" },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          className={`text-left px-4 py-2 hover:bg-[#222] transition-colors ${sortOrder === opt.id ? "text-[#75bf00] font-medium" : "text-[#A0A0A0]"}`}
                          onClick={() => {
                            setSortOrder(opt.id);
                            setIsDropdownOpen(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span>{filteredCapabilities.length} capabilities</span>
                <button 
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                    setSortOrder("catalog");
                  }}
                  className="hover:text-[#F0EFE2] transition-colors"
                >
                  Reset
                </button>
              </div>
            </div>
            
            {/* Sub-filters */}
            <div className="w-full px-6 md:px-[120px]  py-4 flex flex-wrap items-center gap-x-6 gap-y-3 text-[12px] text-[#999] border-b border-dashed border-[#333] bg-[#151515]">
              <button 
                onClick={() => setActiveFilter("all")}
                className={`transition-colors whitespace-nowrap ${activeFilter === "all" ? "text-[#F0EFE2]" : "hover:text-[#F0EFE2]"}`}
              >
                All Capabilities
              </button>
              
              {uniqueTags.map(([tag, count]) => (
                <button 
                  key={tag}
                  onClick={() => setActiveFilter(tag)}
                  className={`transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeFilter === tag 
                      ? "bg-[#75bf00] text-[#151515] px-2.5 py-1 font-medium rounded-[2px]" 
                      : "hover:text-[#F0EFE2]"
                  }`}
                >
                  {tag} <span className={activeFilter === tag ? "text-[#2a4500] font-bold" : "text-[#555]"}>{count}</span>
                </button>
              ))}
            </div>

            {/* List Section */}
            <div className="w-full flex flex-col pb-32">
              {filteredCapabilities.map((capability, idx) => (
                <Link href={`/capabilities/${capability.id}`} key={capability.id} className="group flex flex-col lg:flex-row items-start lg:items-center justify-between py-8 px-6 md:px-[120px]  border-b border-dashed border-[#333] hover:bg-[#1a1a1a] transition-colors cursor-pointer relative z-10">
                  
                  {/* Left: Identity */}
                  <div className="flex items-start gap-4 flex-1 min-w-[320px]">
                    <div className="mt-1 w-10 h-10 flex items-center justify-center shrink-0">
                      <capability.icon size={28} className="text-[#F0EFE2]" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-[20px] font-semibold text-[#F0EFE2] group-hover:text-[#75bf00] transition-colors">{capability.name}</h3>
                      </div>
                      <div className="text-[13px] text-[#777] mb-2">{capability.id}</div>
                      
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        {capability.tags.map((tag, tIdx) => (
                          <React.Fragment key={tIdx}>
                            {tag === "Trending" ? (
                              <span className="bg-[#2a2a2a] text-[#C8C7BA] text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-[2px]">{tag}</span>
                            ) : (
                              <span className="text-[12px] text-[#888]">{tag}</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right: Metrics */}
                  <div className="flex items-start lg:items-center justify-between w-full lg:w-auto mt-6 lg:mt-0 gap-6 lg:gap-10 shrink-0">
                    
                    {/* Input Tokens */}
                    <div className="flex flex-col items-start lg:items-end w-20">
                      <div className="text-[#F0EFE2] font-semibold text-[18px]"><span className="text-[11px] text-[#777] font-normal mr-0.5">$</span>{capability.metrics.input.replace('$', '')}</div>
                      <div className="text-[10px] text-[#777] text-left lg:text-right leading-tight mt-1">per 1M input<br/>tokens</div>
                    </div>

                    {/* Cached Input */}
                    <div className="flex flex-col items-start lg:items-end w-24">
                      <div className="text-[#F0EFE2] font-semibold text-[18px]"><span className="text-[11px] text-[#777] font-normal mr-0.5">$</span>{capability.metrics.cached.replace('$', '')}</div>
                      <div className="text-[10px] text-[#777] text-left lg:text-right leading-tight mt-1">per 1M cached<br/>input tokens</div>
                    </div>

                    {/* Output Tokens */}
                    <div className="flex flex-col items-start lg:items-end w-24">
                      <div className="text-[#F0EFE2] font-semibold text-[18px]"><span className="text-[11px] text-[#777] font-normal mr-0.5">$</span>{capability.metrics.output.replace('$', '')}</div>
                      <div className="text-[10px] text-[#777] text-left lg:text-right leading-tight mt-1">per 1M output<br/>tokens</div>
                    </div>

                    {/* Cache Hit */}
                    <div className="flex flex-col items-start lg:items-end w-24 relative">
                      <div className="text-[#F0EFE2] font-semibold text-[20px]">{capability.metrics.cacheHit.replace('%', '')}<span className="text-[12px] text-[#777] font-normal ml-0.5">%</span></div>
                      <div className="text-[10px] text-[#777] text-left lg:text-right leading-tight mt-1">cache hit, last<br/>24 hours</div>
                      
                      {/* Effective cost note absolutely positioned underneath across Cache Hit and Speed */}
                      <div className="absolute top-[60px] lg:top-14 right-0 lg:-right-32 text-[10px] text-[#666] whitespace-nowrap">
                        {capability.effectiveCost}
                      </div>
                    </div>

                    {/* Speed */}
                    <div className="flex flex-col items-start lg:items-end w-32 relative">
                      <div className="text-[#F0EFE2] font-semibold text-[20px]">{capability.metrics.speed}</div>
                      <div className="text-[10px] text-[#777] text-left lg:text-right leading-tight mt-1 whitespace-normal max-w-[100px]">{capability.speedLabel}</div>
                    </div>

                    {/* Arrow */}
                    <div className="hidden lg:flex items-center justify-center w-6 text-[#555] group-hover:text-[#F0EFE2] transition-colors ml-2">
                      <ArrowRight size={18} />
                    </div>
                  </div>

                </Link>
              ))}
            </div>
          </div>
        </main>

        {/* Footer Section */}
        <FooterCtaSection />
      </div>
    </div>
  );
}




