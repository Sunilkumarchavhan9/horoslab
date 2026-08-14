"use client";

import { useInstitutionStore } from "../store";

export function InstitutionToolbar() {
 const { currentView } = useInstitutionStore();

 return (
 <div className="h-14 border-b border-border bg-card flex items-center px-6 shrink-0 justify-between">
 <div className="flex items-center gap-4">
 <h2 className="text-[13px] font-semibold text-foreground capitalize">
 {currentView.replace("-", " ")}
 </h2>
 </div>
 </div>
 );
}
