"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "../store";
import { OnboardingIdentityView } from "../perspectives/identity/OnboardingIdentityView";
import { OnboardingTeamView } from "../perspectives/team/OnboardingTeamView";
import { OnboardingConnectorsView } from "../perspectives/connectors/OnboardingConnectorsView";
import { OnboardingSyncView } from "../perspectives/sync/OnboardingSyncView";

export function OnboardingWorkspace() {
  const router = useRouter();
  const { currentStep } = useOnboardingStore();

  useEffect(() => {
    if (currentStep === 'complete') {
      router.push('/mission-control');
    }
  }, [currentStep, router]);

  return (
    <div className="flex h-screen w-full bg-background animate-in fade-in duration-700">
      <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        
        {/* Subtle Background Effects */}
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex items-center justify-center">
            <div className="w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-[120px]" />
        </div>

        {/* Form Container */}
        <div className={currentStep === 'identity' ? "w-full h-full z-10 relative" : "w-full max-w-2xl z-10 relative"}>
          
          {currentStep === 'identity' && <OnboardingIdentityView />}
          {currentStep === 'team' && <OnboardingTeamView />}
          {currentStep === 'connectors' && (
            <React.Suspense fallback={null}>
              <OnboardingConnectorsView />
            </React.Suspense>
          )}
          {currentStep === 'sync' && <OnboardingSyncView />}

        </div>
      </div>
    </div>
  );
}
