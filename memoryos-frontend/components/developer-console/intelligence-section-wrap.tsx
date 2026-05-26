"use client";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IntelligenceSectionFrame } from "@/components/developer-console/os-intelligence-shell";
import { osNavIcon } from "@/components/developer-console/os-nav-icons";
import { CompanyBrainPillarStrip } from "@/components/developer-console/company-brain-pillar-strip";
import { ProdySectionContext } from "@/components/developer-console/prody-section-context";
import { getSectionBrainMeta } from "@/lib/company-brain";

export function IntelligenceSectionWrap({
  workspaceName,
  sectionLabel,
  title,
  meta,
  children,
  icon,
  showCompanyBrainStrip = true,
}: {
  workspaceName: string;
  sectionLabel: string;
  title?: string;
  meta?: ReactNode;
  children: ReactNode;
  icon?: LucideIcon;
  showCompanyBrainStrip?: boolean;
}) {
  const Icon = icon ?? osNavIcon(sectionLabel);
  const brain = getSectionBrainMeta(sectionLabel);
  return (
    <IntelligenceSectionFrame
      breadcrumbs={["Dashboard", workspaceName, sectionLabel]}
      title={title ?? sectionLabel}
      icon={Icon}
      meta={meta}
    >
      <ProdySectionContext.Provider value={{ embedded: true }}>
        <div className="intel-section-content space-y-5">
          {showCompanyBrainStrip && brain ? (
            <CompanyBrainPillarStrip
              pillars={brain.pillars}
              purpose={brain.purpose}
              executionTier={brain.executionTier}
            />
          ) : null}
          {children}
        </div>
      </ProdySectionContext.Provider>
    </IntelligenceSectionFrame>
  );
}
