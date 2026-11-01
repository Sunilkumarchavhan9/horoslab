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
  authors: Author[];
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
        authors: [
          {
            name: "Sunil Kumar Chavhan",
            avatar: "https://github.com/Sunilkumarchavhan9.png",
          },
          {
            name: "HOROS Physical Intelligence",
            isHoros: true,
          },
        ],
        title: "HOROS PROBE-1: Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions",
        description: "An uncertainty-aware physical intelligence model for multifingered humanoid robotic hands facing nonstationary friction collapses, fluid pouring, and dynamic payload sloshing. Integrates linearized Hunt-Crossley elastomeric contact models with an 8-sided polyhedral predictive Control Barrier Function (p-CBF) and Adaptive Conformal Inference (ACI), delivering 0.0% drops and 0.0% crush damage across 6,200 Isaac Lab manipulation episodes at 0.193 ms solver latency.",
        pdfUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1/blob/main/arxiv_submission/probe1_arxiv_source.zip",
        codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
      },
    ],
  },
];

export default function ResearchPage() {
  const [activeHoverId, setActiveHoverId] = useState<string | null>("probe-1");

  return (
    <div className="min-h-screen bg-[#151515] text-[#F0EFE2] font-sans selection:bg-[#75bf00] selection:text-black flex flex-col relative overflow-x-hidden">
      {/* GLOBAL VERTICAL DASHED LINES (Standard HOROS Layout Grid) */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="w-full h-full grid grid-cols-[14%_72%_14%] md:grid-cols-[calc(14%_+_120px)_calc(72%_-_240px)_calc(14%_+_120px)] lg:grid-cols-[calc(18%_+_120px)_calc(64%_-_240px)_calc(18%_+_120px)]">
          {/* Left margin with two vertical dashed lines */}
          <div className="relative border-r border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 right-[120px] border-l border-dashed border-[#333] hidden md:block" />
          </div>
          {/* Center content */}
          <div />
          {/* Right margin with two vertical dashed lines */}
          <div className="relative border-l border-dashed border-[#333]">
            <div className="absolute top-0 bottom-0 left-[120px] border-l border-dashed border-[#333] hidden md:block" />
          </div>
        </div>
      </div>

      <div className="relative z-[100]">
        <LandingNavbar dark />
      </div>

      {/* Main Content Area - Strictly bounded to center grid column with generous side gaps from dashed lines */}
      <main className="flex-grow flex flex-col w-full relative z-10 pt-28 sm:pt-36 pb-24 sm:pb-32">
        <div className="w-full grid grid-cols-[14%_72%_14%] md:grid-cols-[calc(14%_+_120px)_calc(72%_-_240px)_calc(14%_+_120px)] lg:grid-cols-[calc(18%_+_120px)_calc(64%_-_240px)_calc(18%_+_120px)] relative z-10">
          <div />
          <div className="min-w-0 px-6 sm:px-8 md:px-10 lg:px-12 xl:px-16">
            {/* Header Hero Section */}
            <div className="mb-14 sm:mb-16">
              <h1 className="text-3xl sm:text-4xl lg:text-[46px] font-medium tracking-tight text-[#F0EFE2] leading-tight flex items-center flex-wrap gap-2.5">
                <span className="bg-[#a3e635] text-black font-semibold px-2.5 py-0.5 rounded-none inline-block">
                  Research
                </span>
                <span>from HOROS Lab.</span>
              </h1>

              <p className="mt-3.5 text-[#C8C7BA] text-[14.5px] sm:text-[15.5px] max-w-2xl leading-relaxed font-sans">
                Open research papers and physical intelligence foundation models from HOROS Lab for certified safe control, dexterous manipulation, and next-generation humanoid robots.
              </p>

              <div className="mt-3.5 flex items-center gap-2 text-[12px] sm:text-[12.5px] text-[#A0A098] font-mono">
                <HorosIcon className="w-3.5 h-3.5 text-[#a3e635] shrink-0" />
                <span>HOROS Lab / Physical intelligence research group building foundation models and safe control for humanoid robotics</span>
              </div>
            </div>

            {/* Categories Section */}
            <div className="space-y-14 sm:space-y-16">
              {RESEARCH_DATA.map((category) => (
                <section key={category.title} className="relative">
                  {/* Category Header */}
                  <div className="mb-5 sm:mb-6">
                    <h2 className="text-2xl sm:text-[26px] font-medium tracking-tight text-[#F0EFE2]">
                      {category.title}
                    </h2>
                    <p className="mt-1.5 text-[#A0A098] text-[13.5px] font-sans">
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
                          className={`group grid grid-cols-1 md:grid-cols-[56px_200px_1fr] border-b border-dashed border-[#333] last:border-b-0 transition-colors duration-200 ${
                            isHovered ? "bg-[#1c1c1c]" : "hover:bg-[#1a1a1a]"
                          }`}
                        >
                          {/* Column 1: Index Number */}
                          <div className="px-3 py-4 sm:px-4 sm:py-6 flex items-start md:border-r border-dashed border-[#333]">
                            <span className="font-mono text-base font-bold text-[#F0EFE2]">
                              {paper.index}
                            </span>
                          </div>

                          {/* Column 2: Metadata (arXiv, Category, Tags, Authors) */}
                          <div className="p-4 sm:p-5 md:p-6 flex flex-col justify-between gap-4 border-t md:border-t-0 md:border-r border-dashed border-[#333]">
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

                            {/* Authors Row */}
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
                          </div>

                          {/* Column 3: Title, Description, and Actions */}
                          <div className="p-4 sm:p-6 md:p-7 flex flex-col justify-between border-t md:border-t-0">
                            <div>
                              <h3 className="text-[#F0EFE2] font-medium text-[16px] sm:text-[17px] md:text-[18px] leading-snug group-hover:text-white transition-colors">
                                {paper.title}
                              </h3>
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
          <div />
        </div>
      </main>

      <div className="relative z-10">
        <FooterCtaSection />
      </div>
    </div>
  );
}
