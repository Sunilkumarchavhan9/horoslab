"use client";

import React, { useEffect } from "react";
import { useAgentStore } from "../store";
import { AgentInspector } from "./AgentInspector";

// We'll import these as we build them
import { AgentsRegistryView } from "../perspectives/registry/AgentsRegistryView";
import { AgentsCapabilitiesView } from "../perspectives/capabilities/AgentsCapabilitiesView";
import { AgentsRunningView } from "../perspectives/running/AgentsRunningView";
import { AgentsLeasesView } from "../perspectives/leases/AgentsLeasesView";
import { AgentsActivityView } from "../perspectives/activity/AgentsActivityView";

export function AgentWorkspace({ activeSection }: { activeSection: string }) {
 const { currentView, setView } = useAgentStore();

 useEffect(() => {
 if (activeSection.startsWith("agents-")) {
 const viewName = activeSection.replace("agents-", "");
 setView(viewName);
 }
 }, [activeSection, setView]);

 return (
 <div className="flex w-full h-full bg-card font-sans overflow-hidden">
 
 {/* Main Canvas Area */}
 <div className="flex-1 overflow-y-auto relative">
 {currentView === 'registry' && <AgentsRegistryView />}
 {currentView === 'capabilities' && <AgentsCapabilitiesView />}
 {currentView === 'running' && <AgentsRunningView />}
 {currentView === 'leases' && <AgentsLeasesView />}
 {currentView === 'activity' && <AgentsActivityView />}
 </div>

 {/* Contextual Inspector */}
 <AgentInspector />
 </div>
 );
}
