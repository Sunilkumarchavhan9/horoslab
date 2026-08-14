"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useRealityStore } from "../runtime/store";
import { RealityToolbar } from "./RealityToolbar";
import { RealityCanvas } from "./RealityCanvas";
import { RealityInspector } from "./RealityInspector";
import { RealityEntityType } from "../entities/types";

export function RealityWorkspace({ activeSection }: { activeSection?: string }) {
  const { currentView, setView, selection, setSelection } = useRealityStore();
  
  // URL Syncing Layer
  const searchParams = useSearchParams();
  const router = useRouter();

  // 1. Sync Active Section -> Store (from sidebar clicks)
  useEffect(() => {
    if (!activeSection) return;
    const viewMap: Record<string, string> = {
      "reality-overview": "overview",
      "reality-graph": "topology",
      "reality-entities": "entities",
      "integrations-connections": "connections",
      "integrations-data-sources": "sources",
      "event-stream": "stream",
      "impact-analysis": "impact",
      "reality-api-watcher": "watcher",
      "decision-graph": "decisions",
    };
    if (viewMap[activeSection] && currentView !== viewMap[activeSection]) {
      setView(viewMap[activeSection]);
    }
  }, [activeSection, setView]);

  // 2. Sync URL -> Store (on load / navigation)
  useEffect(() => {
    const view = searchParams.get('view') as string;
    const entityType = searchParams.get('type') as RealityEntityType;
    const entityId = searchParams.get('id');

    if (view && view !== currentView) {
      setView(view);
    }

    if (entityType && entityId && (!selection || selection.id !== entityId)) {
      setSelection({ type: entityType, id: entityId, sourceView: view || 'topology' });
    }
  }, [searchParams, setView, setSelection]);

  // 3. Sync Store -> URL (on interaction)
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (currentView !== params.get('view')) {
      params.set('view', currentView);
      changed = true;
    }

    if (selection) {
      if (params.get('type') !== selection.type || params.get('id') !== selection.id) {
        params.set('type', selection.type);
        params.set('id', selection.id);
        changed = true;
      }
    } else if (params.has('type') || params.has('id')) {
      params.delete('type');
      params.delete('id');
      changed = true;
    }

    if (changed) {
      // Use replace to avoid filling history with every selection
      router.replace(`?${params.toString()}`);
    }
  }, [currentView, selection, searchParams, router]);

  return (
    <div className="flex flex-col h-full bg-card dark:bg-[#111] text-foreground dark:text-[#eee] transition-colors">
      <RealityToolbar />
      <div className="flex flex-1 overflow-hidden relative">
        <RealityCanvas />
        <RealityInspector />
      </div>
    </div>
  );
}
