"use client";

import { useEffect } from "react";
import { useInstitutionStore } from "../store";
import { GlobalInstitutionRegistry } from "../InstitutionRegistry";
import { InstitutionToolbar } from "./InstitutionToolbar";
import { InstitutionInspector } from "./InstitutionInspector";

interface InstitutionWorkspaceProps {
 activeSection: string; // e.g. "institutions-overview"
}

export function InstitutionWorkspace({ activeSection }: InstitutionWorkspaceProps) {
 const { currentView, setView } = useInstitutionStore();

 // Sync sidebar clicks -> Zustand store
 useEffect(() => {
 // strip "institutions-" prefix to get the view id
 const mappedView = activeSection.replace("institutions-", "");
 const registered = GlobalInstitutionRegistry.get(mappedView);
 if (registered && currentView !== mappedView) {
 setView(mappedView);
 }
 }, [activeSection, currentView, setView]);

 const viewDefinition = GlobalInstitutionRegistry.get(currentView);

 return (
 <div className="w-full h-full flex flex-col bg-card overflow-hidden">
 <InstitutionToolbar />
 <div className="flex-1 flex overflow-hidden">
 <div className="flex-1 overflow-y-auto">
 {viewDefinition ? (
 <viewDefinition.component />
 ) : (
 <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
 <p>View '{currentView}' not registered in InstitutionRegistry.</p>
 </div>
 )}
 </div>
 <InstitutionInspector />
 </div>
 </div>
 );
}
