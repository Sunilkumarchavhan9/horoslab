"use client";

import React, { useState } from "react";
import Link from "next/link";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";

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
    title: "Physical intelligence & Safe Control",
    subtitle: "Certified barrier invariance, tactile shear nonstationarity, and real-time safe grasp adaptation.",
    papers: [
      {
        id: "probe-1",
        index: "01",
        arxivId: "arXiv 2611.05810",
        arxivUrl: "https://arxiv.org/abs/2611.05810",
        category: "cs.RO · eess.SY",
        year: "2026",
        tags: ["p-CBF", "Tactile Shear", "ACI", "OSQP"],
        authors: [
          {
            name: "Sunil Kumar Chavhan",
            avatar: "https://github.com/Sunilkumarchavhan9.png",
          },
          {
            name: "HOROS Lab",
            avatar: "/horos-icon.png",
          },
        ],
        title: "HOROS PROBE-1: Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions",
        description: "Uncertainty-aware predictive safety framework for multi-fingered robotic grasping under nonstationary contact physics, fluid shifts, and abrupt friction collapses, certified by discrete-time p-CBF barriers and adaptive conformal inference.",
        pdfUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1/raw/main/arxiv_submission/probe1_arxiv_source.zip",
        codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
      },
      {
        id: "tacsl",
        index: "02",
        arxivId: "arXiv 2610.04182",
        arxivUrl: "https://arxiv.org/abs/2610.04182",
        category: "cs.RO",
        year: "2026",
        tags: ["Tactile Ingestion", "Elastomeric Shear", "Isaac Lab"],
        authors: [
          {
            name: "Sunil Kumar Chavhan",
            avatar: "https://github.com/Sunilkumarchavhan9.png",
          },
          {
            name: "HOROS Lab",
            avatar: "/horos-icon.png",
          },
        ],
        title: "TacSL: Decoupled Multi-Contact Ingestion and Elastomeric Tactile Dynamics for Dexterous Foundation Policies",
        description: "High-frequency elastomeric marker tracking and contact shear decoupling algorithms for multifingered hands, enabling closed-loop slip reflexing during sub-step contact nonstationarities.",
        pdfUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
        codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
      },
    ],
  },
  {
    title: "Compute efficiency",
    subtitle: "Faster, leaner, more memory-bounded ways to run models on existing hardware.",
    papers: [
      {
        id: "automegakernel",
        index: "01",
        arxivId: "arXiv 2606.09682",
        arxivUrl: "https://arxiv.org/abs/2606.09682",
        category: "cs.LG",
        year: "2026",
        tags: ["Megakernels", "CUDA", "Agents"],
        authors: [
          {
            name: "Jaber Jaber",
            isGithub: true,
          },
          {
            name: "Osama Jaber",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          },
        ],
        title: "AutoMegaKernel: A Statically-Checked Agent Harness for Self-Retargeting Megakernel Synthesis",
        description: "Compiles a Llama-family model into one persistent CUDA megakernel with no hand-written CUDA, statically certifies every agent-proposed schedule deadlock-free and race-free before launch, and self-improves the kernel through an unattended agent loop.",
        pdfUrl: "https://arxiv.org/abs/2606.09682",
        codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
      },
      {
        id: "autokernel",
        index: "02",
        arxivId: "arXiv 2603.21331",
        arxivUrl: "https://arxiv.org/abs/2603.21331",
        category: "cs.LG",
        year: "2026",
        tags: ["GPU", "Kernel Optimization", "Agents"],
        authors: [
          {
            name: "Jaber Jaber",
            isGithub: true,
          },
          {
            name: "Osama Jaber",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          },
        ],
        title: "AutoKernel: Autonomous GPU Kernel Optimization via Iterative Agent-Driven Search",
        description: "Autonomous GPU kernel optimization via iterative agent-driven search, using LLM agents to explore the kernel design space and validate candidates on real hardware.",
        pdfUrl: "https://arxiv.org/abs/2603.21331",
        codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
      },
      {
        id: "streamindex",
        index: "03",
        arxivId: "arXiv 2605.02568",
        arxivUrl: "https://arxiv.org/abs/2605.02568",
        category: "cs.LG",
        year: "2026",
        tags: ["Sparse Attention", "Streaming Top-k", "Triton"],
        authors: [
          {
            name: "Jaber Jaber",
            isGithub: true,
          },
          {
            name: "Osama Jaber",
            avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          },
        ],
        title: "StreamIndex: Memory-Bounded Compressed Sparse Attention via Streaming Top-k",
        description: "A memory-bounded sparse attention mechanism that selects top-k keys in a single streaming pass over the sequence, fused as a Triton kernel for production inference workloads.",
        pdfUrl: "https://arxiv.org/abs/2605.02568",
        codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
      },
    ],
  },
];

export default function ResearchPage() {
  const [hoveredPaperId, setHoveredPaperId] = useState<string | null>("autokernel");

  return (
    <div className="min-h-screen bg-[#181818] text-[#F0EFE2] font-sans relative selection:bg-[#75bf00] selection:text-black">
      {/* Global Vertical Dashed Grid Guide Lines spanning top to bottom */}
      <div className="pointer-events-none fixed inset-0 flex justify-center z-0">
        <div className="w-full max-w-6xl h-full flex justify-between border-x border-dashed border-[#2d2d2d]">
          {/* Dashed vertical column guides matching card grid */}
          <div className="w-[80px] sm:w-[90px] h-full border-r border-dashed border-[#2d2d2d] hidden md:block" />
          <div className="w-[230px] sm:w-[260px] h-full border-r border-dashed border-[#2d2d2d] hidden md:block" />
          <div className="flex-1 h-full hidden md:block" />
        </div>
      </div>

      <LandingNavbar dark />

      <main className="relative z-10 max-w-6xl mx-auto border-x border-dashed border-[#2d2d2d] pt-32 pb-24 sm:pt-40 sm:pb-32 bg-[#181818]">
        {/* Header Hero Section */}
        <div className="px-6 sm:px-10 mb-16 sm:mb-20">
          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-[#F0EFE2] flex items-center flex-wrap gap-2.5">
            <span className="bg-[#75bf00] text-black font-semibold px-2.5 py-0.5 rounded-[3px] inline-block">
              Research
            </span>
            <span>from the team.</span>
          </h1>

          <p className="mt-4 text-[#C8C7BA] text-sm sm:text-base leading-relaxed font-normal max-w-2xl">
            Open papers from the RunInfra team on attention efficiency, LLM inference, kernel optimization, and the architectures behind production AI infrastructure.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-[#888888] font-mono">
            <span className="text-[#C8C7BA]">🎵</span>
            <span>Part of RightNow / Research lab co-designing models and hardware</span>
          </div>
        </div>

        {/* Categories & Paper List */}
        <div className="space-y-16 sm:space-y-20">
          {RESEARCH_DATA.map((category) => (
            <section key={category.title} className="relative">
              {/* Category Title & Subtitle */}
              <div className="px-6 sm:px-10 mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-[#F0EFE2]">
                  {category.title}
                </h2>
                <p className="mt-1.5 text-[#C8C7BA] text-xs sm:text-sm font-normal">
                  {category.subtitle}
                </p>
              </div>

              {/* Papers Grid with Explicit Vertical Dashed Lines */}
              <div className="w-full border-t border-dashed border-[#2d2d2d] bg-[#141414]">
                {category.papers.map((paper) => {
                  const isHovered = hoveredPaperId === paper.id;

                  return (
                    <article
                      key={paper.id}
                      onMouseEnter={() => setHoveredPaperId(paper.id)}
                      onMouseLeave={() => setHoveredPaperId(null)}
                      className={`grid grid-cols-1 md:grid-cols-[80px_230px_1fr] border-b border-dashed border-[#2d2d2d] transition-colors duration-150 ${
                        isHovered ? "bg-[#1f1f1f]" : "bg-[#141414] hover:bg-[#1a1a1a]"
                      }`}
                    >
                      {/* Column 1: Index Number with Right Dashed Border */}
                      <div className="py-7 px-5 md:px-6 md:border-r border-dashed border-[#2d2d2d] flex items-start">
                        <span className="font-mono text-xl sm:text-2xl font-bold text-[#F0EFE2] tracking-tight">
                          {paper.index}
                        </span>
                      </div>

                      {/* Column 2: Metadata (arXiv, Category, Tags, Authors) with Right Dashed Border */}
                      <div className="py-7 px-5 md:px-6 md:border-r border-dashed border-[#2d2d2d] flex flex-col gap-3.5">
                        {/* arXiv link and subject/year */}
                        <div>
                          <Link
                            href={paper.arxivUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#75bf00] hover:text-[#92ea00] font-mono text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                          >
                            <span>{paper.arxivId}</span>
                          </Link>
                          <div className="text-[#888888] font-mono text-[11px] mt-0.5">
                            {paper.category} / {paper.year}
                          </div>
                        </div>

                        {/* Dashed Tags */}
                        <div className="flex flex-wrap gap-1.5">
                          {paper.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded border border-dashed border-[#3a3a3a] bg-[#1a1a1a] text-[#C8C7BA] font-mono text-[11px]"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Authors Row */}
                        <div className="flex flex-col gap-2 pt-1">
                          {paper.authors.map((author, aIdx) => (
                            <div key={aIdx} className="flex items-center gap-2">
                              {author.isGithub ? (
                                <div className="w-5 h-5 rounded-full bg-[#242424] border border-[#333333] flex items-center justify-center text-[#F0EFE2] shrink-0">
                                  <GithubIcon className="w-3 h-3" />
                                </div>
                              ) : author.avatar ? (
                                <img
                                  src={author.avatar}
                                  alt={author.name}
                                  className="w-5 h-5 rounded-full object-cover border border-[#333333] shrink-0 bg-[#242424]"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-5 h-5 rounded-full bg-[#242424] border border-[#333333] flex items-center justify-center text-[9px] text-[#F0EFE2] font-medium shrink-0">
                                  {author.name.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span className="text-xs text-[#F0EFE2] font-medium tracking-tight">
                                {author.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Column 3: Title, Description, and Actions */}
                      <div className="py-7 px-6 sm:px-8 flex flex-col justify-between">
                        <div>
                          <h3 className="text-[#F0EFE2] font-medium text-base sm:text-lg leading-snug">
                            {paper.title}
                          </h3>
                          <p className="text-[#C8C7BA] text-sm leading-relaxed mt-2.5 mb-5 font-normal">
                            {paper.description}
                          </p>
                        </div>

                        {/* Action Links */}
                        <div className="flex items-center gap-5 font-mono text-xs">
                          <Link
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#75bf00] hover:text-[#92ea00] font-semibold inline-flex items-center gap-1 group/link transition-colors"
                          >
                            <span>PDF</span>
                            <span className="text-[10px] transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">↗</span>
                          </Link>
                          <Link
                            href={paper.arxivUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#75bf00] hover:text-[#92ea00] font-semibold inline-flex items-center gap-1 group/link transition-colors"
                          >
                            <span>arXiv</span>
                            <span className="text-[10px] transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">↗</span>
                          </Link>
                          <Link
                            href={paper.codeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#75bf00] hover:text-[#92ea00] font-semibold inline-flex items-center gap-1 group/link transition-colors"
                          >
                            <span>Code</span>
                            <span className="text-[10px] transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">↗</span>
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
      </main>

      <FooterCtaSection />
    </div>
  );
}
