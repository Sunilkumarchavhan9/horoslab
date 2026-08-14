import { create } from 'zustand';
import { GlobalRealityRegistry } from "./RealityRegistry";
import { Selection } from './selection';

export interface RealityState {
 // Global Selection & View Mode
 currentView: string;
 selection: Selection | null;
 
 // Workspace Filters & Search
 searchQuery: string;
 timeRange: string;
 filters: Record<string, boolean>;
 
 // Graph & Engine State
 zoomLevel: number;
}

export interface RealityActions {
 setView: (view: string) => void;
 setSelection: (selection: Selection | null) => void;
 setSearchQuery: (query: string) => void;
 setTimeRange: (range: string) => void;
 setFilter: (key: string, value: boolean) => void;
 setZoom: (zoom: number) => void;
}

export type RealityStore = RealityState & RealityActions;

export const useRealityStore = create<RealityStore>((set) => ({
 // Initial State
 currentView: 'overview',
 selection: null,
 
 searchQuery: '',
 timeRange: '24h',
 filters: {},
 zoomLevel: 1,

 // Actions
 setView: (view: string) => set({ currentView: view }),
 setSelection: (selection: Selection | null) => set({ selection }),
 setSearchQuery: (query: string) => set({ searchQuery: query }),
 setTimeRange: (range: string) => set({ timeRange: range }),
 setFilter: (key: string, value: boolean) => set((state) => ({
 filters: { ...state.filters, [key]: value }
 })),
 setZoom: (zoom: number) => set({ zoomLevel: zoom }),
}));
