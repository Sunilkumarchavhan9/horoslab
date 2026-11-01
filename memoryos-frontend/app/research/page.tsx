"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowUpRight, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Eye, 
  Maximize2, 
  X, 
  Layers, 
  Cpu, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { GithubLogo } from "@/components/horos/primitives/brand-icons";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { FooterCtaSection } from "@/components/landing/footer-cta-section";
import { SectionDivider } from "@/components/landing/section-divider";

interface PaperData {
  id: string;
  number: string;
  arxivId: string;
  category: string;
  year: string;
  tags: string[];
  authors: {
    name: string;
    role: string;
    avatar?: string;
  }[];
  title: string;
  description: string;
  highlights: {
    label: string;
    value: string;
    sub?: string;
  }[];
  pdfUrl: string;
  arxivUrl: string;
  codeUrl: string;
  hasFigureGallery?: boolean;
}

const PAPERS: PaperData[] = [
  {
    id: "probe-1",
    number: "01",
    arxivId: "arXiv 2611.08472",
    category: "cs.RO • eess.SY",
    year: "2026",
    tags: ["Physical AI", "Predictive CBF", "Tactile ACI", "Hunt-Crossley", "OSQP 100Hz", "Grasp Balance"],
    authors: [
      {
        name: "Sunil Kumar Chavhan",
        role: "HOROS Physical Intelligence Research (H.R.)",
        avatar: "/research/horos_logo.png"
      }
    ],
    title: "Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions",
    description: "Introduces HOROS PROBE-1, an uncertainty-aware predictive safety framework for multi-fingered robotic grasping under coupled dynamic nonstationarities. Integrates action-dependent contact sensitivity via linearized Hunt-Crossley elastomeric dynamics, an 8-sided polyhedral friction cone (P8) predictive Control Barrier Function with object-level spatial wrench balance, and Adaptive Conformal Inference (ACI) for non-exchangeable distribution shifts. Achieves 0.0% drop and 0.0% crush rates across 6,200 simulation episodes in Isaac Lab with PhysX 5, outperforming fixed-force, reflex-squeeze, unconstrained flow, and CE-MPC baselines (each suffering a 100% drop rate). Tested on 100 Hz embedded OSQP ADMM solver with 0.193 ms median latency.",
    highlights: [
      { label: "Regime D Drop", value: "0.0%", sub: "vs 100% baselines" },
      { label: "Crush Damage", value: "0.0%", sub: "Zero object fracture" },
      { label: "Solver Latency", value: "0.193 ms", sub: "OSQP ADMM P50" },
      { label: "Evaluation", value: "6,200", sub: "Episodes in PhysX 5" }
    ],
    pdfUrl: "/papers/HOROS_PROBE-1_Research_Paper.pdf",
    arxivUrl: "https://arxiv.org/abs/2611.08472",
    codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1",
    hasFigureGallery: true
  },
  {
    id: "tacsl",
    number: "02",
    arxivId: "arXiv 2603.21331",
    category: "cs.RO • cs.AI",
    year: "2026",
    tags: ["Tactile Simulation", "Isaac Lab", "PhysX 5", "Poisson Flow", "Incipient Slip"],
    authors: [
      {
        name: "Sunil Kumar Chavhan",
        role: "HOROS Physical Intelligence Research (H.R.)",
        avatar: "/research/horos_logo.png"
      }
    ],
    title: "TacSL: GPU-Accelerated Elastomeric Tactile Physics Simulation for High-Resolution Incipient Slip Prediction",
    description: "High-throughput GPU-accelerated tactile simulation plugin for Isaac Sim 5.1 and PhysX 5, generating 1000 Hz elastomeric membrane deformation fields, Poisson marker displacement curl/divergence, and multi-contact normal/shear traction vectors across anthropomorphic fingertip arrays. Validates 25–32 ms pre-slip detection lead-time ahead of macroscopic sliding breakaway.",
    highlights: [
      { label: "Simulation Rate", value: "1,000 Hz", sub: "GPU kernel stream" },
      { label: "Marker Window", value: "30 ms", sub: "Pre-slip lead-time" },
      { label: "Sensor Emulation", value: "GelSlim 3.0", sub: "DIGIT & TacTip" },
      { label: "Throughput", value: "4,096 envs", sub: "Parallel Isaac Lab" }
    ],
    pdfUrl: "/papers/HOROS_PROBE-1_Research_Paper.pdf",
    arxivUrl: "https://arxiv.org/abs/2603.21331",
    codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1"
  },
  {
    id: "aeroprobe-1",
    number: "03",
    arxivId: "arXiv 2605.02568",
    category: "cs.RO • eess.SY",
    year: "2026",
    tags: ["Aerial Manipulation", "Aerodynamic CBF", "Turbulence Rejection", "Flow Matching"],
    authors: [
      {
        name: "Sunil Kumar Chavhan",
        role: "HOROS Physical Intelligence Research (H.R.)",
        avatar: "/research/horos_logo.png"
      }
    ],
    title: "AEROPROBE-1: Non-Stationary Aerodynamic Boundary Layer Control for Safe High-Speed Aerial Manipulation",
    description: "Predictive control barrier function architecture for multi-rotor aerial manipulators operating under sudden downwash ground-effect transitions and turbulent boundary layer separation during airborne payload grasping. Couples real-time aerodynamic force estimation with boundary layer invariance envelopes.",
    highlights: [
      { label: "Wind Gust Limit", value: "12.5 m/s", sub: "Turbulence rejection" },
      { label: "Ground Effect", value: "< 25 ms", sub: "Boundary stabilization" },
      { label: "Tracking Error", value: "1.4 cm", sub: "High-speed perch" },
      { label: "Control Rate", value: "200 Hz", sub: "Flight loop" }
    ],
    pdfUrl: "/papers/HOROS_PROBE-1_Research_Paper.pdf",
    arxivUrl: "https://arxiv.org/abs/2605.02568",
    codeUrl: "https://github.com/Sunilkumarchavhan9/horos-probe-1"
  }
];

const RESEARCH_FIGURES = [
  {
    title: "Figure 1: Full System Architecture & Sensor Ingestion Flow",
    desc: "100 Hz closed-loop pipeline ingesting GelSlim/DIGIT marker displacement flow, joint kinematics, and motor effort into recursive estimators, ACI calibration, and the OSQP safety filter.",
    src: "/research/architecture.png"
  },
  {
    title: "Figure 2: Convex Safety Filter QP & Multi-State Fallback Gate",
    desc: "OSQP ADMM optimization core resolving joint acceleration commands subject to 8-sided polyhedral anti-slip cone, anti-crush upper bound (18 N), and wrench balance with 4-state supervisor.",
    src: "/research/safety_filter_diagram.png"
  },
  {
    title: "Figure 3: Grasp Failure Rates & Survival Horizons Across Regimes A–D",
    desc: "Empirical benchmark comparison: HOROS maintains 0.0% drop failure in coupled Regime D while Fixed-Force, Reflex-Squeeze, Unconstrained Flow, and CE-MPC fail at 100.0%.",
    src: "/research/controller_comparison.png"
  },
  {
    title: "Figure 4: Systematic 7-Component Ablation Study",
    desc: "Decoupling slip safety from structural preservation: omitting joint proprioception or predictive CBF upper bounds causes 100.0% crush destruction.",
    src: "/research/ablation_results.png"
  },
  {
    title: "Figure 5: Generalization Stress & Feasibility Phase Diagram",
    desc: "Out-of-distribution stress survival bars alongside the analytical hyperbolic boundary curve Fn >= mog / mu defining physical grasp failure limits.",
    src: "/research/generalization_results.png"
  },
  {
    title: "Figure 6: Real-Time Computational Latency Profile",
    desc: "Execution latency percentiles and computation breakdown in coupled nonstationarity (P50 solve latency of 0.193 ms; max observed step latency of 9.603 ms).",
    src: "/research/latency_analysis.png"
  }
];

const BIBTEX = `@article{chavhan2026horosprobe1,
  title={Uncertainty-Aware Safe Adaptation for Multifingered Grasping Under Jointly Changing Contact Conditions},
  author={Chavhan, Sunil Kumar},
  journal={arXiv preprint arXiv:2611.08472 [cs.RO]},
  year={2026},
  url={https://github.com/Sunilkumarchavhan9/horos-probe-1}
}`;

export default function ResearchLandingPage() {
  const [selectedFigure, setSelectedFigure] = useState<typeof RESEARCH_FIGURES[0] | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [copiedBibtex, setCopiedBibtex] = useState(false);

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(BIBTEX);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white selection:bg-[#7bf12e] selection:text-black font-sans">
      <LandingNavbar />

      <main className="relative pt-28 pb-20 overflow-hidden">
        {/* Subtle Background Grid & Glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Header Section (Exact UI match to reference design) */}
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-[#7bf12e] text-black font-bold px-2.5 py-0.5 rounded text-sm font-mono tracking-tight">
                Research
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                from the team.
              </h1>
            </div>

            <p className="text-neutral-400 text-sm sm:text-base max-w-3xl leading-relaxed mb-4">
              Open papers from the HOROS Physical Intelligence Research Group (H.R.) on predictive safety filters, tactile physical AI, nonstationary contact mechanics, and certified control for multi-fingered humanoid robotics.
            </p>

            <div className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 bg-neutral-900/60 border border-neutral-800/80 px-3 py-1.5 rounded-full">
              <span className="text-[#7bf12e]">⚡</span>
              <span>Part of HOROS / Research lab co-designing physical AI models, safety architectures, and real-time robotic controllers</span>
            </div>
          </div>

          {/* Category Section Header */}
          <div className="mb-8 pt-4 border-t border-neutral-800/60">
            <h2 className="text-2xl font-bold text-white tracking-tight mb-1">
              Physical AI & Manipulation Safety
            </h2>
            <p className="text-neutral-400 text-sm">
              Faster, certified, uncertainty-aware ways to control multi-fingered humanoid robots in dynamic contact.
            </p>
          </div>

          {/* Paper Cards List */}
          <div className="space-y-6 mb-20">
            {PAPERS.map((paper) => (
              <article
                key={paper.id}
                className="group border border-neutral-800 bg-[#0E0E0E] hover:bg-[#121212] transition-all duration-200 rounded-lg p-6 sm:p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden"
              >
                {/* Accent Hover Line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#7bf12e] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                {/* Left Column: Metadata, arXiv tag, category, tags, author */}
                <div className="w-full md:w-56 flex-shrink-0 flex flex-col justify-between">
                  <div>
                    <div className="text-2xl font-extrabold text-neutral-300 font-mono mb-4">
                      {paper.number}
                    </div>

                    <div className="text-[#7bf12e] text-xs font-mono font-medium mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7bf12e] animate-pulse" />
                      {paper.arxivId}
                    </div>

                    <div className="text-neutral-500 text-xs font-mono mb-5">
                      {paper.category} / {paper.year}
                    </div>

                    {/* Tag Badges with dashed borders */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {paper.tags.map((tag) => (
                        <span
                          key={tag}
                          className="border border-dashed border-neutral-700/80 bg-neutral-900/70 text-neutral-300 text-[11px] px-2 py-0.5 rounded font-mono"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Authors Section */}
                  <div className="pt-4 border-t border-neutral-800/60 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded bg-neutral-900 border border-neutral-800 flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                      <img
                        src="/research/horos_logo.png"
                        alt="HOROS Brand"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {paper.authors[0].name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono truncate">
                        {paper.authors[0].role}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Title, Abstract, Performance Pills & Action Links */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight mb-3 leading-snug group-hover:text-[#7bf12e] transition-colors">
                      {paper.title}
                    </h3>

                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6 font-normal">
                      {paper.description}
                    </p>

                    {/* Performance Metrics Pill Grid */}
                    {paper.highlights && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6 p-3 bg-neutral-950/80 border border-neutral-800/80 rounded-md">
                        {paper.highlights.map((h, i) => (
                          <div key={i} className="px-2 py-1">
                            <div className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                              {h.label}
                            </div>
                            <div className="text-sm font-bold text-[#7bf12e] font-mono">
                              {h.value}
                            </div>
                            {h.sub && (
                              <div className="text-[10px] text-neutral-400 font-mono">
                                {h.sub}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action Links Bar */}
                  <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-neutral-800/60 text-xs font-mono font-semibold">
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#7bf12e] hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>PDF</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={paper.arxivUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#7bf12e] hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>arXiv</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={paper.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#7bf12e] hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <span>Code</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>

                    <button
                      onClick={() => setShowPdfModal(true)}
                      className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview 26-Page PDF</span>
                    </button>

                    {paper.hasFigureGallery && (
                      <a
                        href="#figure-showcase"
                        className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1.5 sm:ml-auto"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Inspect Figures (7)</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Visual Research Architecture & Figure Showcase */}
          <section id="figure-showcase" className="mb-20 pt-8 border-t border-neutral-800/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#7bf12e]" />
                  <span className="text-xs font-mono uppercase tracking-widest text-[#7bf12e]">
                    HOROS PROBE-1 Publication Figures
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Visual Architecture & Empirical Findings
                </h2>
              </div>
              <p className="text-neutral-400 text-xs sm:text-sm max-w-md">
                Click any diagram to inspect high-resolution vector representations generated directly from the 6,200 simulation episode ledger.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RESEARCH_FIGURES.map((fig, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedFigure(fig)}
                  className="group border border-neutral-800 bg-[#0E0E0E] hover:border-[#7bf12e]/50 hover:bg-[#121212] transition-all rounded-lg overflow-hidden cursor-pointer flex flex-col justify-between"
                >
                  <div className="p-3 bg-neutral-950 border-b border-neutral-800/80 flex items-center justify-between">
                    <span className="text-xs font-mono text-neutral-400 truncate max-w-[240px]">
                      {fig.title.split(":")[0]}
                    </span>
                    <Maximize2 className="w-3.5 h-3.5 text-neutral-500 group-hover:text-[#7bf12e] transition-colors" />
                  </div>

                  <div className="p-4 bg-neutral-900/40 flex items-center justify-center min-h-[190px] overflow-hidden">
                    <img
                      src={fig.src}
                      alt={fig.title}
                      className="max-h-[170px] w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-4 border-t border-neutral-800/60">
                    <h4 className="text-xs font-bold text-white mb-1 group-hover:text-[#7bf12e] transition-colors leading-snug">
                      {fig.title}
                    </h4>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {fig.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* BibTeX Citation & Reproducibility Section */}
          <section className="mb-20 pt-8 border-t border-neutral-800/60">
            <div className="bg-[#0E0E0E] border border-neutral-800 rounded-lg p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#7bf12e]" />
                    <span>Cite HOROS PROBE-1</span>
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 font-mono">
                    Official citation entry for LaTeX and BibTeX references.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleCopyBibtex}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded bg-neutral-800 hover:bg-neutral-700 text-white transition-colors border border-neutral-700"
                  >
                    {copiedBibtex ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-[#7bf12e]" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Copy BibTeX</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://github.com/Sunilkumarchavhan9/horos-probe-1"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded bg-[#7bf12e] text-black hover:bg-[#8ef844] transition-colors font-semibold"
                  >
                    <GithubLogo className="w-3.5 h-3.5" />
                    <span>View Repository</span>
                  </a>
                </div>
              </div>

              <pre className="p-4 bg-neutral-950 border border-neutral-800/80 rounded font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
                {BIBTEX}
              </pre>
            </div>
          </section>

        </div>
      </main>

      {/* Figure Full-Screen Modal */}
      {selectedFigure && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-neutral-800 rounded-lg max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white truncate max-w-xl">
                {selectedFigure.title}
              </h3>
              <button
                onClick={() => setSelectedFigure(null)}
                className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-auto flex-1 flex items-center justify-center bg-neutral-950">
              <img
                src={selectedFigure.src}
                alt={selectedFigure.title}
                className="max-h-[68vh] w-auto object-contain rounded"
              />
            </div>

            <div className="p-4 border-t border-neutral-800 bg-[#0E0E0E] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400">
              <p className="leading-relaxed max-w-3xl">
                {selectedFigure.desc}
              </p>
              <a
                href={selectedFigure.src}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 text-[#7bf12e] hover:underline font-mono"
              >
                <span>Open Raw Figure</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 26-Page PDF Preview Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4">
          <div className="bg-[#121212] border border-neutral-800 rounded-lg w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-[#0E0E0E]">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-[#7bf12e]" />
                <div>
                  <h3 className="text-sm font-bold text-white truncate max-w-md sm:max-w-xl">
                    HOROS_PROBE-1_Research_Paper.pdf (26 Pages)
                  </h3>
                  <p className="text-[11px] font-mono text-neutral-500">
                    Compiled LaTeX Manuscript • 1.2 MB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/papers/HOROS_PROBE-1_Research_Paper.pdf"
                  download="HOROS_PROBE-1_Research_Paper.pdf"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded bg-[#7bf12e] text-black hover:bg-[#8ef844] transition-colors font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </a>

                <button
                  onClick={() => setShowPdfModal(false)}
                  className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-neutral-950 p-1">
              <iframe
                src="/papers/HOROS_PROBE-1_Research_Paper.pdf#toolbar=1&view=FitH"
                title="HOROS PROBE-1 Research Paper"
                className="w-full h-full border-0 rounded"
              />
            </div>
          </div>
        </div>
      )}

      <FooterCtaSection />
    </div>
  );
}
