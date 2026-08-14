"use client";

import { useRealityStore } from "../runtime/store";
import { GlobalRealityRegistry } from "../runtime/RealityRegistry";

export function RealityCanvas() {
 const { currentView } = useRealityStore();

 const registration = GlobalRealityRegistry.get(currentView);

 if (!registration) {
 return (
 <div className="flex-1 flex items-center justify-center text-muted-foreground dark:text-muted-foreground">
 View "{currentView}" not registered.
 </div>
 );
 }

 const ActiveComponent = registration.component;

 return (
 <div className="flex-1 flex flex-col relative overflow-hidden bg-card dark:bg-[#111] transition-colors">
 <ActiveComponent />
 </div>
 );
}
