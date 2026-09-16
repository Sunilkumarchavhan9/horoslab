"use client";

import React, { useEffect, useRef, useState } from "react";

interface ResultInspectionSectionProps {
  onOpenSignIn?: () => void;
  dark?: boolean;
}

// 8 Dedicated Precision-Machined Brushed Stainless Steel / Silver-Metal Vector Icons with Restrained Neon Green (#75bf00) Highlights
const ICONS = {
  reality: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-reality" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3D3F" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="50%" stopColor="#F3F4F4" />
          <stop offset="65%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#404345" />
        </linearGradient>
      </defs>
      {/* Base Machined Steel Body */}
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="url(#steel-reality)" strokeWidth="1.6" />
      <path d="M4 5V12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12V5" stroke="url(#steel-reality)" strokeWidth="1.6" />
      <path d="M4 12V19C4 20.6569 7.58172 22 12 22C16.4183 22 20 20.6569 20 19V12" stroke="url(#steel-reality)" strokeWidth="1.6" />
      {/* Precision Edge Highlight */}
      <ellipse cx="12" cy="5" rx="8" ry="3" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.45" />
      <path d="M4 5V12C4 13.6569 7.58172 15 12 15C16.4183 15 20 13.6569 20 12V5" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.35" />
      <path d="M4 12V19C4 20.6569 7.58172 22 12 22C16.4183 22 20 20.6569 20 19V12" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.35" />
      {/* Restrained Semantic Lime Accent */}
      <line x1="8" y1="9" x2="16" y2="9" stroke="#75bf00" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="16" x2="16" y2="16" stroke="#75bf00" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  capability: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-cap" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#404345" />
          <stop offset="22%" stopColor="#777B7D" />
          <stop offset="48%" stopColor="#F3F4F4" />
          <stop offset="60%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#3A3D3F" />
        </linearGradient>
      </defs>
      {/* Outer Chip Frame */}
      <rect x="5" y="5" width="14" height="14" rx="2" stroke="url(#steel-cap)" strokeWidth="1.6" />
      <rect x="5" y="5" width="14" height="14" rx="2" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
      {/* Restrained Silicon Green Core */}
      <rect x="9" y="9" width="6" height="6" fill="#75bf00" rx="1" />
      {/* Lead Pins with Restrained Green Accent */}
      <path d="M9 2V5M15 2V5M9 19V22M15 19V22M2 9H5M2 15H5M19 9H22M19 15H22" stroke="#75bf00" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  experiment: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-exp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3D3F" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="50%" stopColor="#F3F4F4" />
          <stop offset="68%" stopColor="#C8CCCE" />
          <stop offset="88%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#404345" />
        </linearGradient>
      </defs>
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="url(#steel-exp)" strokeWidth="1.6" />
      <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
      <path d="M14 2V8H20" stroke="url(#steel-exp)" strokeWidth="1.6" />
      {/* Green Technical Chart Bars */}
      <path d="M8 17V14M12 17V11M16 17V13" stroke="#75bf00" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  policy: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-pol" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#404345" />
          <stop offset="28%" stopColor="#777B7D" />
          <stop offset="52%" stopColor="#F3F4F4" />
          <stop offset="68%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#3A3D3F" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#steel-pol)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
      <path d="M6 12H7.5M16.5 12H18M12 6V7.5" stroke="url(#steel-pol)" strokeWidth="1.3" strokeLinecap="round" />
      {/* Clock Hands with Green Accent */}
      <path d="M12 7V12L15.5 15.5" stroke="#75bf00" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="#75bf00" />
    </svg>
  ),
  execution: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-exe" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3D3F" />
          <stop offset="24%" stopColor="#777B7D" />
          <stop offset="48%" stopColor="#F3F4F4" />
          <stop offset="64%" stopColor="#C8CCCE" />
          <stop offset="84%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#404345" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#steel-exe)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
      <path d="M12 12L5.6 18.4" stroke="url(#steel-exe)" strokeWidth="1.5" />
      <path d="M12 12L5.6 5.6" stroke="url(#steel-exe)" strokeWidth="1.5" />
      {/* Active Green Sector */}
      <path d="M12 3V12H21" stroke="#75bf00" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  evidence: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-evi" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#404345" />
          <stop offset="26%" stopColor="#777B7D" />
          <stop offset="50%" stopColor="#F3F4F4" />
          <stop offset="66%" stopColor="#C8CCCE" />
          <stop offset="86%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#3A3D3F" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="url(#steel-evi)" strokeWidth="1.6" />
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
      {/* Verifiable Green Core */}
      <circle cx="12" cy="12" r="3" stroke="#75bf00" strokeWidth="1.6" />
      <path d="M6 9.5V14.5M18 9.5V14.5" stroke="#75bf00" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  verifier: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-ver" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3D3F" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="49%" stopColor="#F3F4F4" />
          <stop offset="65%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#404345" />
        </linearGradient>
      </defs>
      <path
        d="M12 2L14.8 6.5L20 5.2L19.2 10.5L24 13L19.2 15.5L20 20.8L14.8 19.5L12 24L9.2 19.5L4 20.8L4.8 15.5L0 13L4.8 10.5L4 5.2L9.2 6.5L12 2Z"
        stroke="url(#steel-ver)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 2L14.8 6.5L20 5.2L19.2 10.5L24 13L19.2 15.5L20 20.8L14.8 19.5L12 24L9.2 19.5L4 20.8L4.8 15.5L0 13L4.8 10.5L4 5.2L9.2 6.5L12 2Z"
        stroke="#ffffff"
        strokeWidth="0.5"
        strokeOpacity="0.4"
        strokeLinejoin="round"
      />
      {/* Verified Green Core */}
      <circle cx="12" cy="13" r="3" fill="#75bf00" />
    </svg>
  ),
  teaching: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-tea" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#404345" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="50%" stopColor="#F3F4F4" />
          <stop offset="66%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#3A3D3F" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="9" stroke="url(#steel-tea)" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="9" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" />
      <path d="M3 12H21" stroke="url(#steel-tea)" strokeWidth="1.5" />
      <path d="M12 3C14.5 6 15.5 9 15.5 12C15.5 15 14.5 18 12 21C9.5 18 8.5 15 8.5 12C8.5 9 9.5 6 12 3Z" stroke="url(#steel-tea)" strokeWidth="1.5" />
      {/* Intelligence Kernel Green Accent */}
      <rect x="9.5" y="10" width="5" height="4" fill="#75bf00" rx="0.5" />
    </svg>
  ),
  diagnosis: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-diag" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#404345" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="50%" stopColor="#F3F4F4" />
          <stop offset="66%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#3A3D3F" />
        </linearGradient>
      </defs>
      <path d="M3 12H6L9 4L15 20L18 12H21" stroke="url(#steel-diag)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12H6L9 4L15 20L18 12H21" stroke="#ffffff" strokeWidth="0.5" strokeOpacity="0.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2" fill="#75bf00" />
    </svg>
  ),
  datacenter: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-dc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3A3D3F" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="49%" stopColor="#F3F4F4" />
          <stop offset="65%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#404345" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="18" height="6" rx="1" stroke="url(#steel-dc)" strokeWidth="1.5" />
      <rect x="3" y="11" width="18" height="6" rx="1" stroke="url(#steel-dc)" strokeWidth="1.5" />
      <path d="M7 6H11M7 14H11M17 6H17.01M17 14H17.01" stroke="url(#steel-dc)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 20H21" stroke="url(#steel-dc)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="6" r="1" fill="#75bf00" />
      <circle cx="17" cy="14" r="1" fill="#75bf00" />
    </svg>
  ),
  prediction: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-pred" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#404345" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="50%" stopColor="#F3F4F4" />
          <stop offset="66%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#3A3D3F" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="8" stroke="url(#steel-pred)" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="12" cy="12" r="3" stroke="url(#steel-pred)" strokeWidth="1.5" />
      <path d="M12 4V2M12 22V20M4 12H2M22 12H20" stroke="url(#steel-pred)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="8" r="1.5" fill="#75bf00" />
    </svg>
  ),
  repair: (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="steel-rep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#404345" />
          <stop offset="25%" stopColor="#777B7D" />
          <stop offset="50%" stopColor="#F3F4F4" />
          <stop offset="66%" stopColor="#C8CCCE" />
          <stop offset="85%" stopColor="#85898B" />
          <stop offset="100%" stopColor="#3A3D3F" />
        </linearGradient>
      </defs>
      <path d="M16 18L22 12L16 6" stroke="url(#steel-rep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 6L2 12L8 18" stroke="url(#steel-rep)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 4L10 20" stroke="url(#steel-rep)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="1.5" fill="#75bf00" />
    </svg>
  ),
};

export interface DeliverableDetail {
  categoryTag: string;
  headline: string;
  subhead: string;
  metrics: { label: string; before: string; after: string }[];
  included: string[];
  files: string[];
}

export interface PillarCard {
  id: string;
  label: string;
  title: string;
  description: string;
  category: "compute" | "physical" | "sre" | "software";
  icon: React.ReactNode;
  deliverableDetails: DeliverableDetail;
}

const PILLARS_ROW_1: PillarCard[] = [
  {
    id: "reality",
    label: "WORLD STATE",
    title: "Decoded, not guessed",
    description: "Versioned physical & system state, telemetry provenance, and causal predictions.",
    category: "physical",
    icon: ICONS.reality,
    deliverableDetails: {
      categoryTag: "DECODE REALITY",
      headline: "VERIFIED WORLD STATE",
      subhead: "Cluster-Prod Ground Truth Reconstruction & Telemetry Lineage",
      metrics: [
        { label: "Entity Resolution", before: "Unsynchronized", after: "100% Deterministic" },
        { label: "Cross-Source Validity", before: "4 Discrepancies", after: "0 Conflicts (Reconciled)" },
        { label: "State Freshness", before: "180s Lag", after: "< 24ms Realtime" },
      ],
      included: [
        "Immutable World-State Graph snapshot (JSON/Arrow)",
        "Verifiable sensor and telemetry provenance hashes",
        "Spatial bounding boxes and physical relationship matrix",
        "Automated continuous state drift detector",
      ],
      files: [
        "world-state/snapshot-v12.json",
        "provenance/merkle-tree.sig",
        "telemetry/cross-validated-metrics.arrow",
        "verifier/ground-truth-rules.json",
      ],
    },
  },
  {
    id: "capability",
    label: "SERVING STACK",
    title: "Discovered per mission",
    description: "Serving configs, pinned runtime versions, model revisions, and K8s manifests.",
    category: "compute",
    icon: ICONS.capability,
    deliverableDetails: {
      categoryTag: "OPTIMIZE",
      headline: "OPTIMIZED SERVING STACK",
      subhead: "Qwen3-32B · vLLM Engine · NVIDIA H100 SXM5",
      metrics: [
        { label: "P99 Response Latency", before: "184ms", after: "139ms (-24.5%)" },
        { label: "Serving Throughput", before: "401 tok/s", after: "518 tok/s (+29.2%)" },
        { label: "Infrastructure Cost", before: "$182,000/mo", after: "$125,580/mo (-31.0%)" },
      ],
      included: [
        "Validated vLLM / TensorRT-LLM serving parameters",
        "Pinned model revision (Commit SHA + Artifact Digest)",
        "Production-ready Kubernetes Deployment & Service YAMLs",
        "Automated canary test harness and zero-downtime rollback",
      ],
      files: [
        "serving/vllm-config.json",
        "kubernetes/deployment.yaml",
        "benchmarks/throughput-receipt.json",
        "rollback/canary-fallback.yaml",
      ],
    },
  },
  {
    id: "experiment",
    label: "WORKLOAD BENCHMARK",
    title: "Tested on real traffic",
    description: "Empirical TTFT, P99 latency, tokens/sec, and cost per successful outcome.",
    category: "compute",
    icon: ICONS.experiment,
    deliverableDetails: {
      categoryTag: "EXPERIMENT",
      headline: "EMPIRICAL BENCHMARK RECEIPT",
      subhead: "Multi-Candidate Stress Run under Production Traffic",
      metrics: [
        { label: "Time To First Token (TTFT)", before: "112ms", after: "38ms (Winner)" },
        { label: "Cost Per 1K Successes", before: "$0.048", after: "$0.019 (-60.4%)" },
        { label: "VRAM Peak Headroom", before: "96.2%", after: "74.8% (Stable)" },
      ],
      included: [
        "Empirical Pareto frontier curves (Latency vs Cost)",
        "Raw token distribution and tail latency histograms",
        "Hardware performance counters (GPU/NVLink/PCIe)",
        "Deterministic replay script with seeded workloads",
      ],
      files: [
        "receipts/pareto-frontier.json",
        "metrics/tail-latency-p99.csv",
        "traces/gpu-perf-counters.trace",
        "replay/seed-workload.bin",
      ],
    },
  },
  {
    id: "policy",
    label: "GOVERNANCE CONTRACT",
    title: "Bounded by authority",
    description: "Deterministic spend caps, data residency rules, and reversible safety gates.",
    category: "software",
    icon: ICONS.policy,
    deliverableDetails: {
      categoryTag: "AUTONOMOUS POLICY",
      headline: "BOUNDED AUTHORITY CONTRACT",
      subhead: "Verifiable Spend & Environment Authority Envelope",
      metrics: [
        { label: "Max Spend Authorized", before: "Unrestricted", after: "$250.00 / Run (Capped)" },
        { label: "Data Residency Guard", before: "Global", after: "US-East-1 Only (Enforced)" },
        { label: "Human Approval Gates", before: "Manual", after: "Autonomous L4 (Bounded)" },
      ],
      included: [
        "Digitally signed authority token",
        "Granular credential scope and RBAC boundary",
        "Reversibility guarantee matrix for all mutation steps",
        "Audit-ready compliance evidence log",
      ],
      files: [
        "policy/authority-contract.json",
        "security/scoped-credentials.jwt",
        "compliance/audit-evidence.json",
        "safety/reversibility-proof.sig",
      ],
    },
  },
];

const PILLARS_ROW_2: PillarCard[] = [
  {
    id: "execution",
    label: "DEPLOYMENT KIT",
    title: "Run it or export it",
    description: "One-click deploy to Cloud, Kubernetes, Bare-Metal, Edge, or Robotics.",
    category: "compute",
    icon: ICONS.execution,
    deliverableDetails: {
      categoryTag: "DEPLOY",
      headline: "PRODUCTION DEPLOYMENT KIT",
      subhead: "Cross-Platform Execution Target Orchestration",
      metrics: [
        { label: "Deployment Duration", before: "45 mins", after: "2m 14s" },
        { label: "Target Availability", before: "99.0%", after: "99.99%" },
        { label: "Cold Start Recovery", before: "18s", after: "850ms" },
      ],
      included: [
        "Automated Helm chart & Terraform/OpenTofu definitions",
        "Container image digests with pinned CUDA drivers",
        "Live health check probes and readiness validation",
        "Instant roll-forward / zero-downtime rollback hooks",
      ],
      files: [
        "deployment/helm-values.yaml",
        "terraform/cluster-target.tf",
        "docker/Dockerfile.release",
        "scripts/instant-deploy.sh",
      ],
    },
  },
  {
    id: "evidence",
    label: "EVIDENCE BUNDLE",
    title: "Verifiably proven",
    description: "Tamper-proof execution traces, sensor measurements, and billing receipts.",
    category: "compute",
    icon: ICONS.evidence,
    deliverableDetails: {
      categoryTag: "EVIDENCE",
      headline: "TAMPER-PROOF EVIDENCE BUNDLE",
      subhead: "Verifiably Audited Execution & Telemetry Signatures",
      metrics: [
        { label: "Signature Verification", before: "Unsigned", after: "SHA-256 / Ed25519 Valid" },
        { label: "Telemetry Chain Integrity", before: "Intermittent", after: "100% Proven" },
        { label: "Billing Proof Correlation", before: "Estimated", after: "Reconciled to Penny" },
      ],
      included: [
        "Complete provenance audit bundle with hash trees",
        "Raw OpenTelemetry traces with nanosecond timestamps",
        "Cloud billing invoice line-item verification receipts",
        "Sensor input & hardware counter audit logs",
      ],
      files: [
        "evidence/bundle-manifest.json",
        "signatures/ed25519-chain.sig",
        "traces/otel-execution-trace.pb",
        "billing/invoice-reconciliation.json",
      ],
    },
  },
  {
    id: "verifier",
    label: "INDEPENDENT VERIFIER",
    title: "Verified, not assumed",
    description: "External verifier audits, telemetry cross-validation, and claim verdicts.",
    category: "software",
    icon: ICONS.verifier,
    deliverableDetails: {
      categoryTag: "EVALUATE",
      headline: "INDEPENDENT VERIFICATION SCORECARD",
      subhead: "Third-Party & Multi-Agent Quality Evaluation",
      metrics: [
        { label: "Groundedness Score", before: "84.1%", after: "99.8%" },
        { label: "Hallucination Rate", before: "6.8%", after: "< 0.02%" },
        { label: "Claim Verification Verdict", before: "Unproven", after: "VERIFIED" },
      ],
      included: [
        "External evaluator audit scorecard across 1,000 test cases",
        "Domain-specific regression test results and safety checks",
        "Deterministic output format consistency verification",
        "Post-deployment continuous verification contract",
      ],
      files: [
        "verifier/scorecard-full.json",
        "tests/golden-dataset-eval.csv",
        "claims/formal-verification.proof",
        "verifier/continuous-probe.py",
      ],
    },
  },
  {
    id: "teaching",
    label: "COMPOUNDED LESSONS",
    title: "Learned from reality",
    description: "Adapted LoRA weights, failure lessons, and evolving reality dynamics.",
    category: "software",
    icon: ICONS.teaching,
    deliverableDetails: {
      categoryTag: "TEACH",
      headline: "COMPOUNDED INTELLIGENCE ASSET",
      subhead: "Adapted Capability Weights & Reusable Experience Rules",
      metrics: [
        { label: "Task Success Rate", before: "64.2%", after: "94.8% (+30.6%)" },
        { label: "Edge Case Generalization", before: "51.0%", after: "88.4%" },
        { label: "Subsequent Mission Speed", before: "14 mins", after: "42 seconds (Cached)" },
      ],
      included: [
        "Adapted LoRA fine-tuning weights and skill definitions",
        "Verified experience records (Context + Action + Consequence)",
        "System dynamics rules compiled into memory graph",
        "Self-improving prompt adaptations and routing policies",
      ],
      files: [
        "weights/adapter-lora-v4.safetensors",
        "experience/lesson-records.json",
        "skills/dynamic-routing-rule.ts",
        "memory/knowledge-graph-delta.json",
      ],
    },
  },
];

const PILLARS_ROW_3: PillarCard[] = [
  {
    id: "diagnosis",
    label: "ROOT CAUSE SRE",
    title: "Traced to the hardware",
    description: "PCIe bottleneck tracing, GPU throttling proofs, and automated remediation kit.",
    category: "sre",
    icon: ICONS.diagnosis,
    deliverableDetails: {
      categoryTag: "DIAGNOSE",
      headline: "VERIFIED ROOT-CAUSE DIAGNOSIS",
      subhead: "PCIe Gen5 Contention & NVLink Interconnect Throttling",
      metrics: [
        { label: "PCIe Bandwidth Drop", before: "64 GB/s", after: "28.4 GB/s (Identified)" },
        { label: "GPU Throttle Duration", before: "18.2%", after: "0.0% (Remediated)" },
        { label: "Inference Latency Spike", before: "+142ms", after: "Resolved" },
      ],
      included: [
        "Kernel trace analysis & GPU performance counters",
        "PCIe link configuration override script",
        "Kubernetes daemonset remediation patch",
        "Automated continuous monitor trigger",
      ],
      files: [
        "remediation/pcie-tune.sh",
        "telemetry/gpu-trace-dump.json",
        "k8s/node-affinity-patch.yaml",
        "verifier/health-check.py",
      ],
    },
  },
  {
    id: "datacenter",
    label: "FACILITY POWER",
    title: "Optimized for megawatts",
    description: "PUE minimization, liquid-cooling scheduling, and megawatt capacity policy.",
    category: "sre",
    icon: ICONS.datacenter,
    deliverableDetails: {
      categoryTag: "DATA CENTER",
      headline: "DATA CENTER POWER & COOLING POLICY",
      subhead: "Cluster Megawatt Load Balancing & Thermal Redistribution",
      metrics: [
        { label: "Facility PUE", before: "1.34", after: "1.12" },
        { label: "Peak MW Power Consumption", before: "4.8 MW", after: "3.9 MW (-18.7%)" },
        { label: "Inference Throughput", before: "99.4%", after: "100% (Maintained)" },
      ],
      included: [
        "Facility thermal map & coolant flow policy",
        "Dynamic workload placement schedule",
        "Power capping controller daemon",
        "Megawatt energy verification receipt",
      ],
      files: [
        "policy/cooling-schedule.json",
        "power/load-balancer.yaml",
        "telemetry/pue-monitor.prom",
        "verification/energy-audit.json",
      ],
    },
  },
  {
    id: "prediction",
    label: "WORLD DYNAMICS",
    title: "Fused across sensors",
    description: "Multi-camera object forecasting, LiDAR temporal trajectories, and safety envelopes.",
    category: "physical",
    icon: ICONS.prediction,
    deliverableDetails: {
      categoryTag: "DECODE REALITY",
      headline: "VERIFIED WORLD STATE & DYNAMICS",
      subhead: "Vehicle-07 Multi-Modal Sensor Fusion & Trajectory Prediction",
      metrics: [
        { label: "Spatial Perception Accuracy", before: "76.4%", after: "98.2%" },
        { label: "Occlusion Recovery Time", before: "420ms", after: "48ms" },
        { label: "Safety Margin Confidence", before: "91.0%", after: "99.94%" },
      ],
      included: [
        "Versioned World-State schema (3D Bounding Boxes)",
        "LiDAR & Camera fusion model weights",
        "Dynamic trajectory prediction engine",
        "Safety envelope & collision avoidance rules",
      ],
      files: [
        "world/state-snapshot-v4.json",
        "models/sensor-fusion-trt.onnx",
        "safety/boundary-policy.json",
        "provenance/sensor-hashes.sig",
      ],
    },
  },
  {
    id: "repair",
    label: "CODE REPAIR",
    title: "Patched and verified",
    description: "Regression isolation, security vulnerability fixes, and verified pull requests.",
    category: "software",
    icon: ICONS.repair,
    deliverableDetails: {
      categoryTag: "REPAIR",
      headline: "VERIFIED SOFTWARE REMEDIATION",
      subhead: "Enterprise SSO & Token Invalidation Vulnerability Patch",
      metrics: [
        { label: "Vulnerability Severity", before: "High (CVE-2026-X)", after: "Resolved" },
        { label: "Unit & Integration Tests", before: "184/184", after: "202/202 (Passing)" },
        { label: "CI Pipeline Runtime", before: "4m 12s", after: "3m 48s" },
      ],
      included: [
        "Automated Git pull request with passing test suite",
        "Security audit proof & token revocation verifier",
        "Canary deployment configuration",
        "Automated rollback trigger manifest",
      ],
      files: [
        "patches/auth-sso-fix.diff",
        "tests/security-regression.spec.ts",
        "ci/canary-workflow.yaml",
        "verification/audit-receipt.json",
      ],
    },
  },
];

// Outer Margin Lines (6% and 94%) extend all the way up through the header above top line
const OUTER_VERTICAL_POSITIONS = ["6%", "94%"];

// Inner Margin Lines (14% and 86%) stop at top monogram line
const INNER_MARGIN_POSITIONS = ["14%", "86%"];

// Header Top Line Dot Marker Positions (all 4 margin lines: 6%, 14%, 86%, 94%)
const HEADER_TOP_DOT_POSITIONS = ["6%", "14%", "86%", "94%"];

// Exact 100% Mathematically Aligned Vertical Grid Positions:
// Left Margin (14%) | Card 1 (18% -> 32%) | Card 2 (18% -> 50%) | Card 3 (18% -> 68%) | Card 4 (18% -> 86%) | Right Margin (14%)
const ALL_VERTICAL_POSITIONS = ["6%", "14%", "32%", "50%", "68%", "86%", "94%"];

export function ResultInspectionSection({ onOpenSignIn, dark = true }: ResultInspectionSectionProps) {


  return (
    <section className="relative w-full bg-[#151515] text-[#F0EFE2] font-sans overflow-hidden select-none">
      <div className="relative z-10 w-full pt-8 pb-16 border-b border-dashed border-[#333333] transition-colors overflow-hidden group/header">

        <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-0">
          {OUTER_VERTICAL_POSITIONS.map((pos, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-r border-dashed border-[#333333]"
              style={{ left: pos }}
            />
          ))}
        </div>

        <div className="absolute top-[48px] bottom-0 left-0 right-0 pointer-events-none z-0">
          {INNER_MARGIN_POSITIONS.map((pos, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-r border-dashed border-[#333333]"
              style={{ left: pos }}
            />
          ))}
        </div>

        <div className="relative w-full mb-12 z-10">
          <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[#333333] -translate-y-1/2" />

          <div className="absolute inset-0 pointer-events-none z-10">
            {HEADER_TOP_DOT_POSITIONS.map((pos, idx) => (
              <span
                key={idx}
                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
                style={{ left: pos }}
              />
            ))}
          </div>

          <div className="relative z-20 flex justify-center">
            <div className="bg-[#151515] px-3 flex items-center justify-center">
              <svg
                width="32"
                height="20"
                viewBox="0 0 64 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-5"
              >
                <path
                  d="M53.6688 3.16846H59.9748C60.473 3.16846 60.9508 3.46054 61.3031 3.98044C61.6553 4.50034 61.8532 5.20548 61.8532 5.94073V15.2477C61.8532 15.9829 61.6553 16.6881 61.3031 17.208C60.9508 17.7279 60.473 18.0199 59.9748 18.0199H53.6688C53.1706 18.0199 52.6928 17.7279 52.3405 17.208C51.9882 16.6881 51.7903 15.9829 51.7903 15.2477V5.94073C51.7903 5.20548 51.9882 4.50034 52.3405 3.98044C52.6928 3.46054 53.1706 3.16846 53.6688 3.16846Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M22.2725 20.9902H32.3354V33.0694C32.3354 33.8047 32.1375 34.5098 31.7852 35.0297C31.433 35.5496 30.9552 35.8417 30.457 35.8417H24.1509C23.6527 35.8417 23.175 35.5496 22.8227 35.0297C22.4704 34.5098 22.2725 33.8047 22.2725 33.0694V20.9902Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M14.7589 6.13867H21.065C21.5632 6.13867 22.0409 6.43075 22.3932 6.95065C22.7455 7.47056 22.9434 8.1757 22.9434 8.91095V20.9902H14.7589C14.2607 20.9902 13.7829 20.6981 13.4307 20.1782C13.0784 19.6583 12.8805 18.9531 12.8805 18.2179V8.91095C12.8805 8.1757 13.0784 7.47056 13.4307 6.95065C13.7829 6.43075 14.2607 6.13867 14.7589 6.13867Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M41.7274 20H49.9119C50.4101 20 50.8879 20.2921 51.2401 20.812C51.5924 21.3319 51.7903 22.037 51.7903 22.7723V32.0792C51.7903 32.8145 51.5924 33.5196 51.2401 34.0395C50.8879 34.5594 50.4101 34.8515 49.9119 34.8515H43.6058C43.1076 34.8515 42.6299 34.5594 42.2776 34.0395C41.9253 33.5196 41.7274 32.8145 41.7274 32.0792V20Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M4.02514 21.9805H10.3312C10.8294 21.9805 11.3072 22.2725 11.6594 22.7924C12.0117 23.3124 12.2096 24.0175 12.2096 24.7527V34.0597C12.2096 34.7949 12.0117 35.5001 11.6594 36.02C11.3072 36.5399 10.8294 36.832 10.3312 36.832H4.02514C3.52695 36.832 3.04917 36.5399 2.6969 36.02C2.34463 35.5001 2.14673 34.7949 2.14673 34.0597V24.7527C2.14673 24.0175 2.34463 23.3124 2.6969 22.7924C3.04917 22.2725 3.52695 21.9805 4.02514 21.9805Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M33.543 6.13867H39.849C40.3472 6.13867 40.825 6.43075 41.1773 6.95065C41.5295 7.47056 41.7274 8.1757 41.7274 8.91095V20.9902H31.6646V8.91095C31.6646 8.1757 31.8625 7.47056 32.2147 6.95065C32.567 6.43075 33.0448 6.13867 33.543 6.13867Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M22.9434 18.2178C22.9434 20.297 23.319 20.9901 24.8218 20.9901H22.9434V18.2178Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M31.6645 18.2178C31.6645 20.297 31.2889 20.9901 29.7861 20.9901H31.6645V18.2178Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M22.2725 23.7625C22.2725 21.6833 21.8968 20.9902 20.3941 20.9902H22.2725V23.7625Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M41.7275 23.7625C41.7275 21.6833 41.3518 20.9902 39.8491 20.9902H41.7275V23.7625Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M32.3354 23.7625C32.3354 21.6833 32.7111 20.9902 34.2138 20.9902H32.3354V23.7625Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
                <path
                  d="M41.7274 17.228C41.7274 19.3072 42.1031 20.0003 43.6058 20.0003H41.7274V17.228Z"
                  fill="white"
                  className="group-hover/header:fill-[#75bf00] transition-colors"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          className="relative max-w-4xl mx-auto text-center px-4 z-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-normal tracking-tight leading-[1.12] mb-3.5 text-[#F0EFE2]">
            Decode reality into a{" "}
            <span className="inline-block bg-[#75bf00] text-black px-2.5 py-0.5 rounded-[3px] font-medium tracking-tight shadow-[0_0_20px_rgba(117,191,0,0.35)]">
              unified
            </span>{" "}
            execution layer.
          </h2>

          <p className="text-xs sm:text-sm text-[#C8C7BA] font-sans pt-1 max-w-xl mx-auto leading-relaxed">
            Epoch connects models, runtimes, telemetry, cameras, and physical world state into a single verifiable reality graph.
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <span
              key={idx}
              className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
              style={{ left: pos }}
            />
          ))}
        </div>
      </div>

      {/* ROW 1: 4 EPOCH CANONICAL REALITY ARCHITECTURE CARDS */}
      <div className="relative z-10 w-full border-b border-dashed border-[#333333]">
        <div className="absolute inset-0 pointer-events-none z-0">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-r border-dashed border-[#333333]"
              style={{ left: pos }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full grid grid-cols-[14%_repeat(4,18%)_14%]">
          <div className="min-h-[220px]" />

          {PILLARS_ROW_1.map((item) => (
            <div
              key={item.id}
              className="p-6 sm:p-8 min-h-[220px] flex flex-col justify-between transition-all duration-300 group/card"
            >
              <div className="mb-6 text-[#F0EFE2]">
                {item.icon}
              </div>
              <div className="space-y-1 mt-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777] font-semibold group-hover/card:text-[#75bf00] transition-colors">
                  {item.label}
                </div>
                <div className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] tracking-tight leading-snug">
                  {item.title}
                </div>
              </div>
            </div>
          ))}

          <div className="min-h-[220px]" />
        </div>

        <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <span
              key={idx}
              className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
              style={{ left: pos }}
            />
          ))}
        </div>
      </div>

      {/* ROW 2: 4 EPOCH CANONICAL REALITY ARCHITECTURE CARDS + EPOCH WATERMARK */}
      <div className="relative z-10 w-full border-b border-dashed border-[#333333]">
        <div className="absolute inset-0 pointer-events-none z-0">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-r border-dashed border-[#333333]"
              style={{ left: pos }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full grid grid-cols-[14%_repeat(4,18%)_14%]">
          <div className="relative min-h-[220px]">
            <span className="absolute bottom-2 right-2.5 text-[9px] font-mono tracking-[0.25em] text-[#555555] font-semibold select-none pointer-events-none uppercase">
              EPOCH
            </span>
          </div>

          {PILLARS_ROW_2.map((item) => (
            <div
              key={item.id}
              className="p-6 sm:p-8 min-h-[220px] flex flex-col justify-between transition-all duration-300 group/card"
            >
              <div className="mb-6 text-[#F0EFE2]">
                {item.icon}
              </div>
              <div className="space-y-1 mt-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777] font-semibold group-hover/card:text-[#75bf00] transition-colors">
                  {item.label}
                </div>
                <div className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] tracking-tight leading-snug">
                  {item.title}
                </div>
              </div>
            </div>
          ))}

          <div className="min-h-[220px]" />
        </div>

        <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <span
              key={idx}
              className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
              style={{ left: pos }}
            />
          ))}
        </div>
      </div>

      {/* ROW 3: 4 EXTENDED CANONICAL OUTCOME CARDS (DIAGNOSE, DATA CENTER, WORLD MODEL, REPAIR) */}
      <div className="relative z-10 w-full border-b border-dashed border-[#333333]">
        <div className="absolute inset-0 pointer-events-none z-0">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-r border-dashed border-[#333333]"
              style={{ left: pos }}
            />
          ))}
        </div>

        <div className="relative z-10 w-full grid grid-cols-[14%_repeat(4,18%)_14%]">
          <div className="relative min-h-[220px]">
            <span className="absolute bottom-2 right-2.5 text-[9px] font-mono tracking-[0.25em] text-[#444444] font-semibold select-none pointer-events-none uppercase">
              DELIVERABLE
            </span>
          </div>

          {PILLARS_ROW_3.map((item) => (
            <div
              key={item.id}
              className="p-6 sm:p-8 min-h-[220px] flex flex-col justify-between transition-all duration-300 group/card"
            >
              <div className="mb-6 text-[#F0EFE2]">
                {item.icon}
              </div>
              <div className="space-y-1 mt-4">
                <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#777777] font-semibold group-hover/card:text-[#75bf00] transition-colors">
                  {item.label}
                </div>
                <div className="text-[14px] sm:text-[15px] font-medium text-[#F0EFE2] tracking-tight leading-snug">
                  {item.title}
                </div>
              </div>
            </div>
          ))}

          <div className="min-h-[220px]" />
        </div>

        <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <span
              key={idx}
              className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
              style={{ left: pos }}
            />
          ))}
        </div>
      </div>

      {/* BOTTOM DASHED MARGIN ROW */}
      <div className="relative z-10 w-full border-b border-dashed border-[#333333] min-h-[80px]">
        <div className="absolute inset-0 pointer-events-none z-0">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <div
              key={idx}
              className="absolute top-0 bottom-0 border-r border-dashed border-[#333333]"
              style={{ left: pos }}
            />
          ))}
        </div>

        <div className="absolute bottom-0 inset-x-0 pointer-events-none z-10">
          {ALL_VERTICAL_POSITIONS.map((pos, idx) => (
            <span
              key={idx}
              className="absolute bottom-0 -translate-x-1/2 translate-y-1/2 w-[3px] h-[3px] bg-[#666666] select-none"
              style={{ left: pos }}
            />
          ))}
        </div>
      </div>

    </section>
  );
}
