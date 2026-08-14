"use client";

import { createElement, type ComponentType } from "react";
import { McpBrandIcon } from "@/components/continuity-lab/brand-icons/mcp-brand-registry";
import {
  CloudflareHdIcon,
  DatadogHdIcon,
  FigmaHdIcon,
  GitLabHdIcon,
  SentryHdIcon,
  StripeHdIcon,
} from "@/components/continuity-lab/brand-icons/hd-icons";
import {
  BitbucketBrandIcon,
  GitHubBrandIcon,
  JiraBrandIcon,
  LinearBrandIcon,
  MicrosoftTeamsBrandIcon,
  NotionBrandIcon,
  SlackBrandIcon,
} from "@/components/continuity-lab/connector-brand-icons";
import { Reveal } from "./motion";
import { cn } from "@/lib/utils";

type IconProps = { className?: string };

type BrandEntry =
  | {
      label: string;
      kind: "component";
      Icon: ComponentType<IconProps>;
      className?: string;
    }
  | { label: string; kind: "mcp"; id: string; className?: string };

const ICON_CLASS = "h-7 w-7 shrink-0 opacity-90";

/** Real marks MemoryOS ships or integrates with — inline SVG brand components only. */
const BRANDS: BrandEntry[] = [
  { label: "MCP", kind: "mcp", id: "modelcontextprotocol", className: "text-[#111827]" },
  { label: "Cursor", kind: "mcp", id: "cursor", className: "text-[#111827]" },
  { label: "VS Code", kind: "mcp", id: "visualstudiocode" },
  { label: "OpenAI", kind: "mcp", id: "openai", className: "text-[#111827]" },
  { label: "Anthropic", kind: "mcp", id: "anthropic", className: "text-[#111827]" },
  { label: "LangGraph", kind: "mcp", id: "langgraph" },
  { label: "GitHub", kind: "component", Icon: GitHubBrandIcon, className: "text-[#111827]" },
  { label: "Slack", kind: "component", Icon: SlackBrandIcon },
  { label: "Jira", kind: "component", Icon: JiraBrandIcon },
  { label: "GitLab", kind: "component", Icon: GitLabHdIcon },
  { label: "Linear", kind: "component", Icon: LinearBrandIcon },
  { label: "Notion", kind: "component", Icon: NotionBrandIcon },
  { label: "Bitbucket", kind: "component", Icon: BitbucketBrandIcon },
  { label: "Microsoft Teams", kind: "component", Icon: MicrosoftTeamsBrandIcon },
  { label: "Datadog", kind: "component", Icon: DatadogHdIcon },
  { label: "Figma", kind: "component", Icon: FigmaHdIcon },
  { label: "Sentry", kind: "component", Icon: SentryHdIcon },
  { label: "Stripe", kind: "component", Icon: StripeHdIcon },
  { label: "Cloudflare", kind: "component", Icon: CloudflareHdIcon },
  { label: "Docker", kind: "mcp", id: "docker" },
  { label: "Vercel", kind: "mcp", id: "vercel", className: "text-[#111827]" },
  { label: "Kubernetes", kind: "mcp", id: "kubernetes" },
];

function BrandMark({ entry }: { entry: BrandEntry }) {
  if (entry.kind === "mcp") {
    return (
      <McpBrandIcon
        id={entry.id}
        className={cn(ICON_CLASS, entry.className)}
      />
    );
  }

  return createElement(entry.Icon, {
    className: cn(ICON_CLASS, entry.className),
  });
}

function MarqueeRow({ rowKey, ariaHidden = false }: { rowKey: string; ariaHidden?: boolean }) {
  return (
    <div
      className="flex shrink-0 min-w-max items-center gap-8 pr-8 md:gap-10 md:pr-10 animate-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none"
      aria-hidden={ariaHidden || undefined}
    >
      {BRANDS.map((entry) => (
        <span
          key={`${rowKey}-${entry.label}`}
          className="inline-flex h-10 min-w-10 items-center justify-center"
          title={entry.label}
        >
          <BrandMark entry={entry} />
          <span className="sr-only">{entry.label}</span>
        </span>
      ))}
    </div>
  );
}

const MARQUEE_MASK =
  "linear-gradient(to right, transparent, black 8%, black 92%, transparent)";

export function AvailableAcrossStrip() {
  return (
    <section
      aria-labelledby="available-across-heading"
      className="relative left-1/2 right-1/2 -mx-[50vw] w-screen border-y border-[var(--landing-border)] bg-[var(--landing-bg)] py-11 md:py-12"
    >
      <Reveal className="mx-auto flex w-full flex-col items-center px-6 text-center">
        <p
          id="available-across-heading"
          className="font-sans text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--landing-subtle)]"
        >
          AVAILABLE ACROSS
        </p>

        <div
          className="group relative mt-8 flex w-full overflow-hidden"
          style={{
            maskImage: MARQUEE_MASK,
            WebkitMaskImage: MARQUEE_MASK,
          }}
        >
          <MarqueeRow rowKey="a" />
          <MarqueeRow rowKey="b" ariaHidden />
        </div>
      </Reveal>
    </section>
  );
}
