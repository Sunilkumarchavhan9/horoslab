"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Github, Sparkles } from "lucide-react";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";

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
        arxivUrl: "https://arxiv.org/submit",
        category: "cs.RO · eess.SY",
        year: "2026",
        tags: ["p-CBF", "Tactile Shear", "ACI Calibration", "OSQP Core"],
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
        description: "Introduces an uncertainty-aware predictive safety framework for multi-fingered grasping under nonstationary friction collapses, fluid pouring, and sloshing dynamics. Combines linearized Hunt-Crossley dynamics with an 8-sided polyhedral p-CBF and Adaptive Conformal Inference, achieving 0.0% drops and 0.0% crush damage in coupled nonstationary regimes.",
        pdfUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1/blob/main/arxiv_submission/probe1_arxiv_source.zip",
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
        description: "Establishes high-frequency elastomeric marker tracking and contact shear decoupling algorithms for multifingered hands, enabling closed-loop slip reflexing and invariant tracking during sub-step contact nonstationarities.",
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
    <div className="min-h-screen bg-[#0c0c0e] text-white selection:bg-[#a3e635] selection:text-black font-sans relative overflow-x-hidden">
      {/* Background Subtle Grid Texture */}
      <div className="pointer-events-none fixed inset-0 z-0 flex justify-center opacity-40">
        <div className="w-full max-w-6xl h-full flex justify-between border-x border-neutral-800/40">
          <div className="w-1/4 h-full border-r border-dashed border-neutral-800/30 hidden md:block" />
          <div className="w-1/4 h-full border-r border-dashed border-neutral-800/30 hidden md:block" />
          <div className="w-1/4 h-full border-r border-dashed border-neutral-800/30 hidden md:block" />
        </div>
      </div>

      <LandingNavbar dark />

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32">
        {/* Header Hero Section */}
        <div className="max-w-4xl mb-20 sm:mb-24">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white flex items-center flex-wrap gap-2.5">
            <span className="bg-[#a3e635] text-black font-semibold px-2.5 py-0.5 rounded-[4px] inline-block">
              Research
            </span>
            <span>from the team.</span>
          </h1>

          <p className="mt-5 text-neutral-400 text-base sm:text-lg leading-relaxed font-normal max-w-2xl">
            Open papers from the HOROS team on uncertainty-aware safe manipulation, tactile physics, predictive barrier control, and the architectures behind production AI infrastructure.
          </p>

          <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-neutral-500 font-mono">
            <span className="text-neutral-400">✦</span>
            <span>Part of HOROS / Physical Intelligence & AI Infrastructure Research lab co-designing models and contact physics</span>
          </div>
        </div>

        {/* Categories & Paper List */}
        <div className="space-y-20 sm:space-y-24">
          {RESEARCH_DATA.map((category) => (
            <section key={category.title} className="relative">
              {/* Category Title & Subtitle */}
              <div className="mb-8 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                  {category.title}
                </h2>
                <p className="mt-2 text-neutral-400 text-sm sm:text-base font-normal">
                  {category.subtitle}
                </p>
              </div>

              {/* Papers Grid Rows */}
              <div className="border-t border-neutral-800/90 divide-y divide-neutral-800/90">
                {category.papers.map((paper) => {
                  const isHovered = hoveredPaperId === paper.id;

                  return (
                    <article
                      key={paper.id}
                      onMouseEnter={() => setHoveredPaperId(paper.id)}
                      onMouseLeave={() => setHoveredPaperId(null)}
                      className={`group relative py-7 sm:py-9 px-4 sm:px-6 transition-all duration-200 ${
                        isHovered
                          ? "bg-[#141416] border-y border-neutral-700/70"
                          : "bg-transparent hover:bg-[#141416]/50"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-8">
                        {/* Column 1: Index Number */}
                        <div className="w-12 sm:w-16 shrink-0">
                          <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight">
                            {paper.index}
                          </span>
                        </div>

                        {/* Column 2: Metadata (arXiv, Category, Tags, Authors) */}
                        <div className="w-full lg:w-64 shrink-0 flex flex-col gap-3.5">
                          {/* arXiv link and subject/year */}
                          <div>
                            <Link
                              href={paper.arxivUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-mono text-xs font-medium inline-flex items-center gap-1 transition-colors"
                            >
                              <span>{paper.arxivId}</span>
                            </Link>
                            <div className="text-neutral-500 font-mono text-xs mt-0.5">
                              {paper.category} / {paper.year}
                            </div>
                          </div>

                          {/* Dotted/Dashed Badges/Tags */}
                          <div className="flex flex-wrap gap-1.5">
                            {paper.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded border border-dashed border-neutral-700/80 bg-neutral-900/60 text-neutral-300 font-mono text-[11px]"
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
                                  <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-neutral-300 shrink-0">
                                    <Github className="w-3.5 h-3.5" />
                                  </div>
                                ) : author.avatar ? (
                                  <img
                                    src={author.avatar}
                                    alt={author.name}
                                    className="w-6 h-6 rounded-full object-cover border border-neutral-700/80 shrink-0 bg-neutral-800"
                                    onError={(e) => {
                                      // Fallback if image fails to load
                                      (e.target as HTMLElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-neutral-800 border border-neutral-700/80 flex items-center justify-center text-[10px] text-neutral-300 font-medium shrink-0">
                                    {author.name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-xs text-neutral-300 font-medium tracking-tight">
                                  {author.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Column 3: Title, Description, and Actions */}
                        <div className="flex-1 flex flex-col justify-between pt-0.5">
                          <div>
                            <h3 className="text-white font-medium text-base sm:text-lg leading-snug group-hover:text-white transition-colors">
                              {paper.title}
                            </h3>
                            <p className="text-neutral-400 text-sm leading-relaxed mt-3 mb-6 font-normal">
                              {paper.description}
                            </p>
                          </div>

                          {/* Action Links */}
                          <div className="flex items-center gap-6 font-mono text-xs">
                            <Link
                              href={paper.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-medium inline-flex items-center gap-1 group/link transition-colors"
                            >
                              <span>PDF</span>
                              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </Link>
                            <Link
                              href={paper.arxivUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-medium inline-flex items-center gap-1 group/link transition-colors"
                            >
                              <span>arXiv</span>
                              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </Link>
                            <Link
                              href={paper.codeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#a3e635] hover:text-[#bef264] font-medium inline-flex items-center gap-1 group/link transition-colors"
                            >
                              <span>Code</span>
                              <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </Link>
                          </div>
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
