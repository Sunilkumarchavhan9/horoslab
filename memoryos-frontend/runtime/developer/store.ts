import { create } from 'zustand';

export type DeveloperView = 'api' | 'sdk' | 'mcp' | 'keys' | 'webhooks' | 'watcher' | 'verifiers' | 'extensions' | 'cli' | 'edge-runtime' | 'integrations';

interface DeveloperState {
  currentView: DeveloperView;
  selectedContextId: string | null;
  inspectorOpen: boolean;
  setCurrentView: (view: DeveloperView) => void;
  setSelectedContextId: (id: string | null) => void;
  setInspectorOpen: (open: boolean) => void;
}

export const useDeveloperStore = create<DeveloperState>((set) => ({
  currentView: 'sdk',
  selectedContextId: null,
  inspectorOpen: true,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedContextId: (id) => set({ selectedContextId: id }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
}));
