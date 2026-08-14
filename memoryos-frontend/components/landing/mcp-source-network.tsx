"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { useEffect } from "react";

const CONNECTOR_ASSETS = [
  "amplitude.ico", "asana.svg", "auth0.svg", "aws.ico", "azure-devops.ico", "azure.ico", "bitbucket.svg", "box.svg",
  "buildkite.svg", "chatgpt.svg", "circleci.svg", "claude.svg", "clickup.svg", "cline.png", "cloudflare.svg", "codex.svg",
  "confluence.svg", "continue.ico", "crewai.ico", "cursor.ico", "datadog.svg", "devin.ico", "digitalocean.svg", "discord.svg",
  "docker.svg", "dropbox.svg", "figma.svg", "fly.svg", "framer.svg", "freshdesk.png", "front.ico", "fullstory.png",
  "gcp.svg", "gitguardian.png", "github-actions.svg", "gitlab.svg", "gmail.svg", "google-drive.svg", "grafana.svg", "help-scout.svg",
  "heroku.ico", "honeycomb.ico", "hubspot.svg", "intercom.svg", "jenkins.svg", "kubernetes.svg", "langgraph.ico", "launchdarkly.ico",
  "linear.svg", "logtail.ico", "mastra.png", "microsoft-teams.ico", "mixpanel.svg", "monday.ico", "neon.svg", "netlify.svg",
  "new-relic.svg", "notion.svg", "okta.svg", "onepassword.svg", "openai-agents.png", "opsgenie.ico", "outlook.ico", "pagerduty.svg",
  "planetscale.svg", "posthog.svg", "prometheus.svg", "railway.svg", "render.svg", "salesforce.ico", "semgrep.ico", "sentry.svg",
  "sharepoint.ico", "shortcut.svg", "snyk.svg", "sourcegraph.ico", "statuspage.svg", "supabase.svg", "terraform.svg", "trello.svg",
  "vercel.svg", "vscode.png", "windsurf.ico", "zendesk.svg", "zoom.svg",
] as const;

const SIGNALS = ["events", "deployments", "incidents", "traces", "metrics", "documents", "decisions", "audit logs"] as const;

export type McpSourceCard = {
  id: string;
  asset: string;
  name: string;
  signal: (typeof SIGNALS)[number];
  record: string;
};

export const MCP_SOURCE_CARDS: McpSourceCard[] = Array.from({ length: 200 }, (_, index) => {
  const asset = CONNECTOR_ASSETS[index % CONNECTOR_ASSETS.length];
  const cycle = Math.floor(index / CONNECTOR_ASSETS.length);
  const signal = SIGNALS[(index + cycle * 3) % SIGNALS.length];
  const rawName = asset.replace(/\.(svg|png|ico)$/i, "").replaceAll("-", " ");
  const name = rawName.replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    id: `${asset}-${signal}-${cycle}`,
    asset,
    name,
    signal,
    record: `${(index * 137 + 842).toLocaleString()} ${signal}`,
  };
});

type McpSourceNetworkProps = {
  selectedSourceId: string;
  onSourceSelect: (source: McpSourceCard) => void;
};

export function McpSourceNetwork({ selectedSourceId, onSourceSelect }: McpSourceNetworkProps) {
  const reducedMotion = useReducedMotion();
  const selectedIndex = Math.max(0, MCP_SOURCE_CARDS.findIndex((source) => source.id === selectedSourceId));
  const activeRow = Math.floor(selectedIndex / 8);

  useEffect(() => {
    if (reducedMotion) return;
    const timer = window.setInterval(() => {
      const current = MCP_SOURCE_CARDS.findIndex((source) => source.id === selectedSourceId);
      onSourceSelect(MCP_SOURCE_CARDS[(current + 1) % MCP_SOURCE_CARDS.length]);
    }, 3200);
    return () => window.clearInterval(timer);
  }, [onSourceSelect, reducedMotion, selectedSourceId]);

  return (
    <div className="watchtower-source-wall relative h-[510px] overflow-hidden bg-white shadow-[inset_0_0_0_1px_rgba(214,218,224,.9)] sm:h-[570px] lg:h-[650px]">
      <div className="absolute left-5 top-5 z-20 flex items-center gap-2 border border-white/75 bg-white/60 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.13em] text-[#607995] backdrop-blur-lg" style={{ borderRadius: 999 }}>
        <span className="h-1.5 w-1.5 bg-[#3e82d8]" />200 MCP sources · scanning context
      </div>

      <motion.div
        className="grid grid-cols-4 gap-2 p-2 sm:grid-cols-6 lg:grid-cols-8 lg:gap-3 lg:p-0"
        animate={reducedMotion ? undefined : { y: -(activeRow * 106) }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        {MCP_SOURCE_CARDS.map((source, index) => {
          const active = index === selectedIndex;
          return (
            <motion.button
              key={source.id}
              type="button"
              onClick={() => onSourceSelect(source)}
              className={`relative min-h-[94px] overflow-hidden border bg-white/55 px-3 py-3 text-left backdrop-blur-md transition-colors lg:min-h-[106px] lg:px-4 ${active ? "z-20 border-[#5279aa] bg-white/85 text-[#17283e]" : "border-white/75 text-[#9aa7b5] opacity-35 hover:bg-white/75 hover:opacity-70"}`}
              style={{ borderRadius: 11 }}
              animate={{ scale: active ? 1 : 0.995 }}
            >
              {active && <motion.span layoutId="mcp-source-active" className="absolute inset-x-0 top-0 h-0.5 bg-[#356acc]" />}
              <div className="flex min-w-0 items-center gap-2">
                <Image src={`/connector-icons/${source.asset}`} alt="" width={16} height={16} unoptimized className={`h-4 w-4 shrink-0 object-contain ${active ? "" : "grayscale"}`} />
                <strong className="truncate text-[9px] font-semibold lg:text-[10px]">{source.name}</strong>
                {active && <span className="ml-auto h-1.5 w-1.5 bg-[#4a8cda]" />}
              </div>
              <p className="mt-3 truncate font-mono text-[7px] uppercase tracking-[0.09em]">{source.signal}</p>
              <p className="mt-2 truncate text-[7.5px] text-[#91a0b0]">{source.record}</p>
            </motion.button>
          );
        })}
      </motion.div>

    </div>
  );
}
