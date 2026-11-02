"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { HorosIcon } from "@/components/horos/primitives/horos-logo";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function XIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-3 h-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

interface SocialLink {
  platform: "x" | "linkedin" | "github";
  label: string;
  url: string;
}

interface Author {
  name: string;
  avatar?: string;
  isGithub?: boolean;
  isHoros?: boolean;
}

interface Paper {
  id: string;
  index: string;
  arxivId: string;
  arxivUrl: string;
  category: string;
  year: string;
  tags: string[];
  authors?: Author[];
  socials?: SocialLink[];
  title: string;
  description: string;
  pdfUrl: string;
  codeUrl: string;
}

interface ResearchCategory {
  title: string;
  subtitle: string;
  papers: Paper[];
}

const RESEARCH_DATA: ResearchCategory[] = [
  {
    title: "Physical Intelligence & Humanoid Robotics",
    subtitle: "Certified predictive safety filters, nonstationary tactile adaptation, and dexterous manipulation foundation models for humanoid robots.",
    papers: [
      {
        id: "probe-1",
        index: "01",
        arxivId: "arXiv 2611.05810",
        arxivUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
        category: "cs.RO · eess.SY",
        year: "2026",
        tags: [
          "Humanoid Robots",
          "Dexterous Hands",
          "p-CBF Safety",
          "Tactile Shear",
          "ACI Conformal",
          "Isaac Lab",
          "OSQP Core",
        ],
        socials: [
          {
            platform: "x",
            label: "@FrostbytHitsuG",
            url: "https://x.com/FrostbytHitsuG",
          },
          {
            platform: "linkedin",
            label: "LinkedIn",
            url: "https://www.linkedin.com/in/sunil-kumar-chavhan-269195299/",
          },
        ],
        title: "HOROS PROBE-1: Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Nonstationary Contacts",
        description: "An uncertainty-aware physical intelligence model for multifingered humanoid hands facing nonstationary contacts. Couples linearized Hunt-Crossley dynamics with an 8-sided predictive Control Barrier Function (p-CBF) and ACI, delivering 0.0% drops and 0.0% crush damage across 6,200 Isaac Lab episodes.",
        pdfUrl: "/HOROS_PROBE-1_Research_Paper.pdf",
        codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
      },
    ],
  },
];

export default function ResearchPage() {
  const [activeHoverId, setActiveHoverId] = useState<string | null>("probe-1");

  return (
    <div className="min-h-screen bg-[#151515] text-[#F0EFE2] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col relative overflow-x-hidden">
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

      <div className="relative z-[100]">
        <LandingNavbar dark />
      </div>

      {/* Main Content Area - Auto-responsive fluid container across phone, tablet, laptop, and monitor */}
      <main className="flex-grow flex flex-col w-full relative z-10 pt-24 sm:pt-28 md:pt-32 pb-24 sm:pb-32">
        <div className="w-[94%] md:w-[84%] lg:w-[80%] xl:w-[72%] 2xl:w-[64%] 2xl:max-w-7xl mx-auto flex flex-col">
          {/* Header Hero Section */}
          <div className="mb-10 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-medium tracking-tight text-[#F0EFE2] leading-tight flex items-center flex-wrap gap-2 sm:gap-2.5">
              <span className="bg-[#a3e635] text-black font-semibold px-2 py-0.5 rounded-none inline-block">
                Research
              </span>
              <span>from HOROS Lab.</span>
            </h1>

            <p className="mt-3 text-[#C8C7BA] text-[13px] sm:text-[14px] max-w-xl leading-relaxed font-sans">
              Open research papers and physical intelligence foundation models from HOROS Lab for certified safe control, dexterous manipulation, and next-generation humanoid robots.
            </p>

            <div className="mt-3.5 flex items-center gap-2.5 text-[11.5px] sm:text-[12px] text-[#A0A098] font-mono">
              <HorosIcon className="w-5 h-5 text-[#a3e635] shrink-0" />
              <span>HOROS Lab / Physical intelligence for humanoid robots</span>
            </div>
          </div>

          {/* Categories Section */}
          <div className="space-y-12 sm:space-y-16">
            {RESEARCH_DATA.map((category) => (
              <section key={category.title} className="relative">
                {/* Category Header */}
                <div className="mb-4 sm:mb-5">
                  <h2 className="text-xl sm:text-[22px] font-medium tracking-tight text-[#F0EFE2]">
                    {category.title}
                  </h2>
                  <p className="mt-1 text-[#A0A098] text-[13px] font-sans">
                    {category.subtitle}
                  </p>
                </div>

                {/* Papers Grid Container with Dashed Borders */}
                <div className="border border-dashed border-[#333] bg-[#151515]">
                  {category.papers.map((paper) => {
                    const isHovered = activeHoverId === paper.id;

                    return (
                      <article
                        key={paper.id}
                        onMouseEnter={() => setActiveHoverId(paper.id)}
                        onMouseLeave={() => setActiveHoverId(null)}
                        className={`group grid grid-cols-1 md:grid-cols-[48px_180px_1fr] border-b border-dashed border-[#333] last:border-b-0 transition-colors duration-200 ${
                          isHovered ? "bg-[#1c1c1c]" : "hover:bg-[#1a1a1a]"
                        }`}
                      >
                        {/* Column 1: Index Number */}
                        <div className="px-3 py-4 sm:px-4 sm:py-6 flex items-start md:border-r border-dashed border-[#333]">
                          <span className="font-mono text-base font-bold text-[#F0EFE2]">
                            {paper.index}
                          </span>
                        </div>

                        {/* Column 2: Metadata (arXiv, Category, Tags, Social Links) */}
                        <div className="p-4 sm:p-5 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-r border-dashed border-[#333]">
                          <div>
                            <Link
                              href={paper.arxivUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-mono text-[12px] font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{paper.arxivId}</span>
                            </Link>
                            <div className="text-[#777] font-mono text-[11px] mt-0.5">
                              {paper.category} / {paper.year}
                            </div>
                          </div>

                          {/* Dashed Tags Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            {paper.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-none border border-dashed border-[#3d3d3d] bg-transparent text-[#C8C7BA] font-mono text-[10.5px]"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>

                          {/* Social Brand Links */}
                          {paper.socials && (
                            <div className="flex flex-col gap-2 pt-1">
                              {paper.socials.map((social, sIdx) => (
                                <Link
                                  key={sIdx}
                                  href={social.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={social.url}
                                  className="group/social flex items-center gap-2 text-[#C8C7BA] hover:text-[#a3e635] transition-colors"
                                >
                                  <div className="w-4.5 h-4.5 rounded-full bg-[#111] border border-[#333] group-hover/social:border-[#a3e635] flex items-center justify-center text-[#C8C7BA] group-hover/social:text-[#a3e635] shrink-0 transition-colors">
                                    {social.platform === "x" ? (
                                      <XIcon className="w-2.5 h-2.5" />
                                    ) : social.platform === "linkedin" ? (
                                      <LinkedInIcon className="w-2.5 h-2.5" />
                                    ) : (
                                      <GithubIcon className="w-2.5 h-2.5" />
                                    )}
                                  </div>
                                  <span className="text-[12px] text-[#C8C7BA] group-hover/social:text-[#a3e635] font-mono tracking-tight transition-colors">
                                    {social.label}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}

                          {/* Authors Row (Fallback if paper has authors) */}
                          {paper.authors && (
                            <div className="flex flex-col gap-2 pt-1">
                              {paper.authors.map((author, aIdx) => (
                                <div key={aIdx} className="flex items-center gap-2">
                                  {author.isHoros ? (
                                    <div className="w-4.5 h-4.5 rounded-full bg-[#111] border border-[#333] flex items-center justify-center text-[#a3e635] shrink-0">
                                      <HorosIcon className="w-2.5 h-2.5" />
                                    </div>
                                  ) : author.isGithub ? (
                                    <div className="w-4.5 h-4.5 rounded-full bg-neutral-800 border border-[#444] flex items-center justify-center text-[#F0EFE2] shrink-0">
                                      <GithubIcon className="w-3 h-3" />
                                    </div>
                                  ) : author.avatar ? (
                                    <img
                                      src={author.avatar}
                                      alt={author.name}
                                      className="w-4.5 h-4.5 rounded-full object-cover border border-[#444] shrink-0 bg-neutral-800"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = "none";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-4.5 h-4.5 rounded-full bg-neutral-800 border border-[#444] flex items-center justify-center text-[9px] text-[#C8C7BA] font-mono shrink-0">
                                      {author.name.slice(0, 2).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-[12px] text-[#C8C7BA] font-medium tracking-tight">
                                    {author.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Column 3: Title, Description, and Actions */}
                        <div className="p-4 sm:p-5 md:p-6 flex flex-col justify-between border-t md:border-t-0 min-w-0">
                          <div>
                            <Link
                              href={paper.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group/title block"
                            >
                              <h3 className="text-[#F0EFE2] font-medium text-[16px] sm:text-[17px] md:text-[18px] leading-snug group-hover/title:text-[#a3e635] transition-colors">
                                {paper.title}
                              </h3>
                            </Link>
                            <p className="text-[#A0A098] text-[13px] sm:text-[13.5px] leading-relaxed mt-2 mb-5 font-sans font-normal">
                              {paper.description}
                            </p>
                          </div>

                          {/* Action Links */}
                          <div className="flex items-center gap-5 font-mono text-[12px]">
                            <Link
                              href={paper.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-medium inline-flex items-center gap-1 group/link transition-colors"
                            >
                              <span>PDF</span>
                              <ArrowUpRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </Link>
                            <Link
                              href={paper.arxivUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-medium inline-flex items-center gap-1 group/link transition-colors"
                            >
                              <span>arXiv</span>
                              <ArrowUpRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </Link>
                            <Link
                              href={paper.codeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-medium inline-flex items-center gap-1 group/link transition-colors"
                            >
                              <span>Code</span>
                              <ArrowUpRight className="w-3 h-3 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </Link>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <FooterCtaSection />
      </div>
    </div>
  );
}
