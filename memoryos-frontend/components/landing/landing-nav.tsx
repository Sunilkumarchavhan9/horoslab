import { MemoryStarLogo } from "./memory-star-logo";
import { PLAN_CATALOG } from "@/lib/plan-catalog";
import { LandingNavDropdown, LandingNavLoginDropdown } from "./landing-nav-dropdown";

const PERSONAL_APP_COMING_SOON_HREF = "/personal-app-coming-soon";

const LOGIN_ITEMS = [
  {
    label: "Developer Console",
    description: "API keys, usage limits, and documentation",
    href: "/developer-console/sign-in",
  },
  {
    label: "Personal App",
    description: "Page coming soon. We are actively building this.",
    href: PERSONAL_APP_COMING_SOON_HREF,
  },
] as const;

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

function LoginChevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <header className="relative z-50 border-b border-[#c9d8ee] bg-white">
      <div className="relative z-50 grid items-center gap-4 px-5 py-3 lg:h-[78px] lg:grid-cols-[auto_1fr_auto] lg:px-7 lg:py-0">
        <div className="flex items-center">
          <MemoryStarLogo />
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6 text-[15px] text-[#101827] lg:gap-8">
          <LandingNavDropdown
            label="Platform"
            columns={3}
            items={[
              { label: "Core Engine", description: "High-performance memory ingestion and indexing", href: "#what-we-do" },
              { label: "Company Brain", description: "From scattered knowledge to executable agent skills", href: "#company-brain-thesis" },
              { label: "Developer Experience", description: "Next-generation observability and control planes", href: "#developer-experience" },
            ]}
          />
          <LandingNavDropdown
            label="Integrate"
            columns={3}
            items={[
              { label: "API Reference", description: "Complete documentation for REST and GraphQL endpoints", href: "#developer-experience" },
              { label: "Client SDKs", description: "Native libraries for TypeScript, Python, and Go", href: "#developer-experience" },
              { label: "Context Stack", description: "Connect your existing agents and swarms easily", href: "#context-stack" },
            ]}
          />
          <LandingNavDropdown
            label="Proof"
            columns={2}
            items={[
              { label: "Benchmarks", description: "See our zero-miss-rate test results in action", href: "#benchmarks" },
              { label: "Case Studies", description: "Learn how top teams scale with MemoryOS", href: "#benchmarks" },
            ]}
          />
          <LandingNavDropdown
            label="Pricing"
            columns={3}
            items={[
              { label: "Starter (Free)", description: "For individual developers validating workflows", href: "/developer-console/sign-in?plan=starter" },
              { label: `Pro ($${PLAN_CATALOG.Pro.monthlyPriceUsd}/mo)`, description: "For active builders running multi-agent workflows", href: "/developer-console/sign-in?plan=pro" },
              { label: `Scale ($${PLAN_CATALOG.Scale.monthlyPriceUsd}/mo)`, description: "For teams running shared company memory", href: "/developer-console/sign-in?plan=scale" },
            ]}
          />
          <LandingNavDropdown
            label="Build"
            columns={2}
            items={[
              { label: "Personal App", description: "Personal memory workspace (coming soon)", href: PERSONAL_APP_COMING_SOON_HREF },
              { label: "Plugins", description: "Extend agent workflows with integrations", href: "#developer-experience" },
            ]}
          />
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
            href="https://x.com/memoryostm"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-blue-600 xl:inline-flex"
          >
            <XIcon />
            <span>0</span>
          </a>
          <a
            href="https://discord.gg/JtwaRJaeR"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 transition hover:text-blue-600 xl:inline-flex"
          >
            <DiscordIcon />
            <span>0</span>
          </a>

          <LandingNavLoginDropdown items={LOGIN_ITEMS}>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-[#bfd1ee] bg-white px-5 py-2.5 text-[14px] font-medium transition hover:border-[#9db8e3] hover:text-blue-600"
            >
              Login
              <LoginChevron />
            </button>
          </LandingNavLoginDropdown>

          <a
            href="/developer-console/sign-in"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-blue-700 lg:hidden"
          >
            Start
          </a>
        </div>
      </div>
    </header>
  );
}
