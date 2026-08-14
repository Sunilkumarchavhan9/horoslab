"use client";

import { useEffect } from "react";
import { GlobalLifecycleManager } from "../../runtime/kernel/lifecycle";
import { RealityRuntime } from "../../runtime/reality/runtime/RealityRuntime";
import { MissionRuntime } from "../../runtime/missions/runtime/MissionRuntime";

export function KernelProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // In the future, dynamically discover or explicitly register runtimes here
    GlobalLifecycleManager.registerRuntime(RealityRuntime).catch(console.error);
    GlobalLifecycleManager.registerRuntime(MissionRuntime).catch(console.error);

    return () => {
      GlobalLifecycleManager.unregisterRuntime(RealityRuntime.id).catch(console.error);
      GlobalLifecycleManager.unregisterRuntime(MissionRuntime.id).catch(console.error);
    };
  }, []);

  return <>{children}</>;
}
