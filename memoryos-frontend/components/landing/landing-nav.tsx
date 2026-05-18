import { MemoryStarLogo } from "./memory-star-logo";
import { PLAN_CATALOG } from "@/lib/plan-catalog";
import type { ComponentType } from "react";
import {
  Activity,
  Blocks,
  BookOpenText,
  Brain,
  Briefcase,
  Cable,
  FileCode2,
  Gauge,
  GraduationCap,
  Layers,
  PlugZap,
  Rocket,
  Settings2,
  Users,
  WalletCards,
} from "lucide-react";

const PERSONAL_APP_COMING_SOON_HREF = "/personal-app-coming-soon";

const NAV_ITEM_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "Core Engine": Activity,
  "Developer Experience": Settings2,
  "Personal Memory": Brain,
  "Company Brain": Brain,
  "API Reference": BookOpenText,
  "Client SDKs": FileCode2,
  "Context Stack": Layers,
  "Benchmarks": Gauge,
  "Case Studies": Briefcase,
  "Starter (Free)": Rocket,
  [`Pro ($${PLAN_CATALOG.Pro.monthlyPriceUsd}/mo)`]: WalletCards,
  [`Scale ($${PLAN_CATALOG.Scale.monthlyPriceUsd}/mo)`]: Users,
  "Personal App": Blocks,
  Plugins: PlugZap,
};

const NAV_DROPDOWNS = [
  {
    label: "Platform",
    width: "w-[400px]",
    items: [
      { label: "Core Engine", description: "High-performance memory ingestion and indexing", href: "#what-we-do" },
      { label: "Company Brain", description: "From scattered knowledge to executable agent skills", href: "#company-brain-thesis" },
      { label: "Developer Experience", description: "Next-generation observability and control planes", href: "#developer-experience" },
      { label: "Personal Memory", description: "Dedicated memory graph for individual workflows", href: "#personal-memory" }
    ]
  },
  {
    label: "Integrate",
    width: "w-[400px]",
    items: [
      { label: "API Reference", description: "Complete documentation for REST and GraphQL endpoints", href: "#developer-experience" },
      { label: "Client SDKs", description: "Native libraries for TypeScript, Python, and Go", href: "#developer-experience" },
      { label: "Context Stack", description: "Connect your existing agents and swarms easily", href: "#context-stack" }
    ]
  },
  {
    label: "Proof",
    width: "w-[300px]",
    items: [
      { label: "Benchmarks", description: "See our zero-miss-rate test results in action", href: "#benchmarks" },
      { label: "Case Studies", description: "Learn how top teams scale with MemoryOS", href: "#benchmarks" }
    ]
  },
  {
    label: "Pricing",
    width: "w-[420px]",
    items: [
      { label: "Starter (Free)", description: "For individual developers validating workflows", href: "/developer-console/sign-in?plan=starter" },
      { label: `Pro ($${PLAN_CATALOG.Pro.monthlyPriceUsd}/mo)`, description: "For active builders running multi-agent workflows", href: "/developer-console/sign-in?plan=pro" },
      { label: `Scale ($${PLAN_CATALOG.Scale.monthlyPriceUsd}/mo)`, description: "For teams running shared company memory", href: "/developer-console/sign-in?plan=scale" }
    ]
  },
  {
    label: "Consumer",
    width: "w-[300px]",
    items: [
      { label: "Personal App", description: "Page coming soon. We are actively building this.", href: PERSONAL_APP_COMING_SOON_HREF },
      { label: "Plugins", description: "Extend capabilities with 3rd-party integrations", href: "#developer-experience" }
    ]
  }
];

function NavItemIcon({ label }: { label: string }) {
  const Icon = NAV_ITEM_ICONS[label] ?? Cable;

  return <Icon className="h-[16px] w-[16px] text-[#5d6f87]" aria-hidden="true" />;
}

function GithubIcon() {
  return (
    <svg height="18" width="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
      <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
      <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function LandingNav() {
  return (
    <header className="border-b border-[#c9d8ee] bg-white relative z-50">
      <div className="grid items-center gap-4 px-5 py-3 lg:h-[78px] lg:grid-cols-[auto_1fr_auto] lg:px-7 lg:py-0 relative z-50">
        <div className="flex items-center">
          <MemoryStarLogo />
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-8 text-[15px] text-[#101827]">
          {NAV_DROPDOWNS.map((dropdown) => (
            <div key={dropdown.label} className="group relative py-6 -my-6">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 text-[15px] text-[#101827] transition hover:text-blue-600"
              >
                {dropdown.label}
                <Chevron />
              </button>
              
              {/* Mega Menu Dropdown */}
              <div 
                className={`invisible absolute left-1/2 top-full z-[100] ${dropdown.width} -translate-x-1/2 translate-y-2 rounded-xl border border-[#c9d8ee] bg-white p-3 opacity-0 shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100`}
              >
                <div className="flex flex-col gap-1">
                  {dropdown.items.map((item) => (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block rounded-lg px-4 py-3 transition-colors hover:bg-[#f6f9ff]"
                    >
                      <div className="flex items-center gap-2.5">
                        <NavItemIcon label={item.label} />
                        <p className="text-[14px] font-semibold text-slate-900 group-hover/link:text-blue-600">
                          {item.label}
                        </p>
                      </div>
                      <p className="mt-1 text-[13px] text-[#5d6f87] leading-relaxed">
                        {item.description}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-4 text-[14px] text-[#111827]">
          <a
            href="https://github.com/Sunilkumarchavhan9/MemoryOS"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-blue-600 xl:inline-flex"
          >
            <GithubIcon />
            <span>0</span>
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-blue-600 xl:inline-flex"
          >
            <XIcon />
            <span>0</span>
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-blue-600 xl:inline-flex"
          >
            <DiscordIcon />
            <span>0</span>
          </a>

          <div className="group relative py-6 -my-6">
            <button
              type="button"
              className="inline-flex items-center gap-2 border border-[#bfd1ee] bg-white px-5 py-2.5 text-[14px] font-medium transition hover:border-[#9db8e3] hover:text-blue-600 rounded-md"
            >
              Login
              <Chevron />
            </button>
            <div className="invisible absolute right-0 top-full z-[100] w-[300px] translate-y-2 rounded-xl border border-[#c9d8ee] bg-white p-3 opacity-0 shadow-[0_20px_40px_rgba(15,23,42,0.12)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <a href="/developer-console/sign-in" className="block rounded-lg px-4 py-3 transition-colors hover:bg-[#f6f9ff]">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <GraduationCap className="h-[16px] w-[16px] text-[#5d6f87]" aria-hidden="true" />
                  Developer Console
                </p>
                <p className="mt-1 text-[13px] text-[#5d6f87] leading-relaxed">API keys, usage limits, and documentation</p>
              </a>
              <a href={PERSONAL_APP_COMING_SOON_HREF} className="block mt-1 rounded-lg px-4 py-3 transition-colors hover:bg-[#f6f9ff]">
                <p className="flex items-center gap-2 text-[14px] font-semibold text-slate-900">
                  <Blocks className="h-[16px] w-[16px] text-[#5d6f87]" aria-hidden="true" />
                  Personal App
                </p>
                <p className="mt-1 text-[13px] text-[#5d6f87] leading-relaxed">Page coming soon. We are actively building this.</p>
              </a>
            </div>
          </div>
          <a
            href="/developer-console/sign-in"
            className="inline-flex items-center gap-2 bg-blue-600 px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-blue-700 rounded-md lg:hidden"
          >
            Start
          </a>
        </div>
      </div>

      <div className="hidden h-0 bg-white md:block" />
    </header>
  );
}
