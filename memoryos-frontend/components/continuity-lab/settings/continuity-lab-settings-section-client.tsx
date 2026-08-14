"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import type { SettingsSectionId } from "@/lib/continuity-lab/settings-nav";

const ContinuityLabSettingsSection = dynamic(
  () =>
    import("@/components/continuity-lab/settings/continuity-lab-settings-sections").then(
      (m) => m.ContinuityLabSettingsSection,
    ),
  { ssr: false, loading: () => null },
);

export function ContinuityLabSettingsSectionClient({
  sectionId,
}: {
  sectionId: SettingsSectionId;
}) {
  return (
    <Suspense fallback={null}>
      <ContinuityLabSettingsSection sectionId={sectionId} />
    </Suspense>
  );
}
