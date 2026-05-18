"use client";

import { Reveal } from "./motion";
import {
  DeveloperExperienceCard,
  type DeveloperExperienceFeature,
} from "./developer-experience-card";

const FEATURES: DeveloperExperienceFeature[] = [
  {
    num: "01",
    tab: "AGENT MEMORY",
    heading: "Persistent context for coding agents",
    description:
      "Preferences, project state, bug history, and prior decisions stay available across sessions.",
    bullets: [
      "List unresolved bugs and continue last decision thread",
      "Retrieve prior architecture decisions to avoid drift",
      "Inject latest bug fix context automatically",
    ],
  },
  {
    num: "02",
    tab: "TEAM MEMORY",
    heading: "Shared workspace intelligence",
    description:
      "MemoryOS stores project-level memory so teams and agents can resume work with the same context model.",
    bullets: [
      "Resume current sprint from continuity contract",
      "Load MemoryOS retrieval + trust diagnostics",
      "Generate plan from prior decisions and open risks",
    ],
  },
  {
    num: "03",
    tab: "TRUST LAYER",
    heading: "Every memory is inspectable",
    description:
      "Explain, timeline, and revisions turn memory recall into something developers can verify and debug.",
    bullets: [
      "Inspect timeline of all memory events",
      "Trace revisions to previous execution contexts",
      "Full explainability for diagnostic debugging",
    ],
  },
  {
    num: "04",
    tab: "CONTROL SURFACE",
    heading: "Control plane, APIs, and policies",
    description:
      "Search, archive, review, and govern memory through the MemoryOS control plane and unified API surface.",
    bullets: [
      "Write memory: /process + status + archive",
      "Recover context: /retrieve + /continue + /resume",
      "Inspect trust: /timeline + /revisions + /explain",
    ],
  },
];

export function DeveloperExperienceSection() {
  return (
    <section id="developer-experience" className="border-t border-[#c9d8ee] bg-white">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="px-6 py-16 lg:px-12 lg:py-20">
            <h2 className="max-w-4xl text-[40px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-900 md:text-[56px]">
              Your agents are smart.
              <br />
              Their memory should be too.
            </h2>
            <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-[#516882] md:text-[18px]">
              Continuity infrastructure for real coding sessions. MemoryOS is designed for developer
              workflows where preference, project state, bug history, and prior decisions need to
              survive across threads, tools, and model sessions.
            </p>
          </div>
        </Reveal>

        <div className="border-t border-[#e8f0fc] px-6 pb-20 pt-12 lg:px-12 lg:pb-28 lg:pt-16">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
            {FEATURES.map((feature, index) => (
              <DeveloperExperienceCard key={feature.num} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
