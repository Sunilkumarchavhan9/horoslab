import { create } from 'zustand';

export interface Selection {
 id: string;
 type: string;
}

export interface MissionState {
 // Global View Mode
 currentView: string;
 selection: Selection | null;
 isInspectorOpen: boolean;
 
 // Workspace Filters & Search
 searchQuery: string;
 timeRange: string;
 filters: Record<string, boolean>;
}

export interface MissionActions {
 setView: (view: string) => void;
 setSelection: (selection: Selection | null) => void;
 toggleInspector: () => void;
 setSearchQuery: (query: string) => void;
 setTimeRange: (range: string) => void;
 setFilter: (key: string, value: boolean) => void;
}

export const useMissionStore = create<MissionState & MissionActions>((set) => ({
 // State
 currentView: 'overview',
 selection: null,
 isInspectorOpen: true,
 searchQuery: '',
 timeRange: 'live',
 filters: {
 healthy: true,
 warning: true,
 critical: true
 },

 // Actions
 setView: (view: string) => set({ currentView: view }),
 setSelection: (selection: Selection | null) => set({ selection }),
 toggleInspector: () => set((state) => ({ isInspectorOpen: !state.isInspectorOpen })),
 setSearchQuery: (query: string) => set({ searchQuery: query }),
 setTimeRange: (range: string) => set({ timeRange: range }),
 setFilter: (key: string, value: boolean) => 
 set((state) => ({ filters: { ...state.filters, [key]: value } })),
}));
