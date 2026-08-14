"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { DeveloperBrandMark, type DeveloperBrand } from "./developer-brand-mark";

type IntegrationRun = {
  title: string;
  brand: DeveloperBrand;
  steps: string[];
};

const RUNS: IntegrationRun[] = [
  { title: "GitHub: verify release", brand: "github", steps: ["Pull request #842 merged", "Evidence bundle created", "Awaiting deployment lease"] },
  { title: "CI/CD: run assurance", brand: "github-actions", steps: ["Build pipeline completed", "Release policy evaluated", "Deployment gate opened"] },
  { title: "OpenTelemetry: collect traces", brand: "opentelemetry", steps: ["Trace window captured", "Service graph resolved", "Evidence normalized"] },
  { title: "Prometheus: inspect metrics", brand: "prometheus", steps: ["Production signals loaded", "Thresholds evaluated", "No critical drift found"] },
  { title: "Sentry: investigate errors", brand: "sentry", steps: ["Regression grouped", "Suspect commit identified", "Mission proposed"] },
  { title: "Datadog: trace anomaly", brand: "datadog", steps: ["Service regression detected", "Causal timeline assembled", "Mission proposed"] },
  { title: "CloudWatch: verify health", brand: "cloudwatch", steps: ["Log streams attached", "Alarm history compared", "Outcome confirmed"] },
  { title: "AWS: lease production", brand: "aws", steps: ["IAM scope constrained", "Budget approved", "Lease expires in 14m"] },
  { title: "Kubernetes: execute change", brand: "kubernetes", steps: ["Namespace selected", "Rollback snapshot ready", "Canary progressing"] },
  { title: "vLLM: tune inference", brand: "vllm", steps: ["Runtime profile loaded", "Batch policy simulated", "Candidate ready"] },
  { title: "GPU telemetry: settle impact", brand: "nvidia", steps: ["Utilization compared", "Cost delta measured", "Settlement recorded"] },
];

export function BackgroundAgentCards() {
  const reducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(3);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % RUNS.length);
    }, 2800);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);

  return (
    <div className="relative h-[510px] overflow-hidden bg-[#fbfdff] shadow-[inset_0_0_0_1px_rgba(195,211,229,.65)] sm:h-[570px] lg:h-[650px]">
      <div className="grid h-full grid-cols-2 gap-2 p-2 sm:grid-cols-3 lg:grid-cols-5 lg:gap-3 lg:p-0">
        {RUNS.map(({ title, brand, steps }, index) => {
          const active = activeIndex === index;
          return (
          <motion.button
            type="button"
            key={title}
            onClick={() => setActiveIndex(index)}
            onFocus={() => setActiveIndex(index)}
            className={`relative min-h-[180px] overflow-hidden border bg-white px-5 py-5 text-left lg:min-h-[205px] lg:px-6 lg:py-6 ${
              active
                ? "z-10 border-[#748aa5] text-[#13243a] shadow-[0_18px_50px_rgba(40,75,119,0.12)]"
                : "border-[#e2e9f1] text-[#9aa7b6]"
            }`}
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: active ? 1 : 0.28, y: 0, scale: active ? 1 : 0.995 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45, delay: Math.min(index * 0.012, 0.1) }}
            style={{ borderRadius: 14 }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <DeveloperBrandMark brand={brand} className={`h-4 w-4 shrink-0 ${active ? "opacity-100" : "grayscale opacity-70"}`} />
              <h3 className="truncate text-[12px] font-medium tracking-[-0.01em] lg:text-[13px]">{title}</h3>
              {active && <span className="ml-auto flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.12em] text-[#356acc]"><span className="h-1.5 w-1.5 animate-pulse bg-[#356acc]" />Live</span>}
            </div>
            <ul className="mt-5 space-y-3.5 lg:mt-6">
              {steps.map((step) => (
                <li key={step} className="flex items-center gap-2.5 text-[10px] leading-none lg:text-[11px]">
                  <span className={`h-1 w-1 shrink-0 ${active ? "bg-[#7f8da0]" : "bg-[#c7ced6]"}`} />
                  <span className="truncate">{step}</span>
                  <span aria-hidden="true" className="ml-auto text-[11px] text-[#c0c8d0]">›</span>
                </li>
              ))}
            </ul>
            {active && !reducedMotion && (
              <motion.span
                className="pointer-events-none absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-[#eaf3ff]/60 to-transparent"
                initial={{ left: "-30%" }}
                animate={{ left: "120%" }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 1 }}
              />
            )}
          </motion.button>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,.3),transparent_12%,transparent_88%,rgba(255,255,255,.3))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[44%] bg-gradient-to-t from-[#fbfdff] via-[#fbfdff]/92 to-transparent" />
    </div>
  );
}
