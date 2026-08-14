"use client";

import React, { useEffect } from "react";
import { useDeveloperStore, DeveloperView } from "../store";
import {
  Code2, 
  TerminalSquare, 
  Key, 
  Webhook, 
  Activity, 
  ShieldCheck, 
  Blocks,
  PanelRightClose,
  PanelRightOpen,
  Play,
  BookOpen,
  FileCode2,
  CheckCircle2
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { DeveloperSdkView } from "../perspectives/sdk/DeveloperSdkView";
import { DeveloperMcpView } from "../perspectives/mcp/DeveloperMcpView";
import { DeveloperApiKeysView } from "../perspectives/keys/DeveloperApiKeysView";
import { DeveloperCliView } from "../perspectives/cli/DeveloperCliView";
import { DeveloperEdgeRuntimeView } from "../perspectives/edge-runtime/DeveloperEdgeRuntimeView";
import { ApiExplorerView } from "../perspectives/api-explorer/ApiExplorerView";
import { DeveloperWebhooksView } from "../perspectives/webhooks/DeveloperWebhooksView";
import { DeveloperWatcherView } from "../perspectives/watcher/DeveloperWatcherView";
import { DeveloperVerifiersView } from "../perspectives/verifiers/DeveloperVerifiersView";
import { DeveloperExtensionsView } from "../perspectives/extensions/DeveloperExtensionsView";
import { DeveloperIntegrationsView } from "../perspectives/integrations/DeveloperIntegrationsView";

export function DeveloperWorkspace({ activeSection = "runtime-api", workspaceId }: { activeSection?: string; workspaceId?: string | null }) {
  const { currentView, setCurrentView } = useDeveloperStore();

  useEffect(() => {
    if (activeSection.startsWith("runtime-")) {
      const view = activeSection.replace("runtime-", "");
      if (view === "api-keys") {
        setCurrentView("keys");
      } else {
        setCurrentView(view as DeveloperView);
      }
    }
  }, [activeSection, setCurrentView]);

  const renderView = () => {
    switch (currentView) {
      case 'api': return <ApiExplorerView workspaceId={workspaceId} />;
      case 'sdk': return <DeveloperSdkView workspaceId={workspaceId} />;
      case 'mcp': return <DeveloperMcpView workspaceId={workspaceId} />;
      case 'keys': return <DeveloperApiKeysView workspaceId={workspaceId} />;
      case 'cli': return <DeveloperCliView workspaceId={workspaceId} />;
      case 'edge-runtime': return <DeveloperEdgeRuntimeView workspaceId={workspaceId} />;
      case 'integrations': return <DeveloperIntegrationsView workspaceId={workspaceId} />;
      case 'webhooks': return <DeveloperWebhooksView workspaceId={workspaceId} />;
      case 'watcher': return <DeveloperWatcherView />;
      case 'verifiers': return <DeveloperVerifiersView />;
      case 'extensions': return <DeveloperExtensionsView />;
      default: return null;
    }
  };

  return (
    <div className="flex h-full w-full bg-background overflow-hidden font-sans">
      
      {/* Developer Canvas */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        
        {/* Canvas Header */}
        <div className="h-12 border-b border-border/50 bg-muted/20 flex items-center justify-between px-4 shrink-0">
           <div className="flex items-center gap-2">
              <span className="text-[12px] font-mono text-muted-foreground">~/developer/</span>
              <span className="text-[12px] font-mono text-emerald-400 font-bold">{currentView}</span>
           </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden relative">
           {renderView()}
        </div>

      </div>
    </div>
  );
}
