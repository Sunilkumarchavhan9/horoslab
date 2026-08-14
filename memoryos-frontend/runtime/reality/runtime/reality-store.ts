import { create } from 'zustand';
import { RealityStore, RealityViewMode } from './reality-types';

export const useRealityStore = create<RealityStore>((set) => ({
 // Initial State
 currentView: 'overview',
 selectedNodeId: null,
 
 searchQuery: '',
 timeRange: '24h',
 filters: {},
 zoomLevel: 1,

 // Actions
 setView: (view: RealityViewMode) => set({ currentView: view }),
 
 selectNode: (id: string | null) => set({ selectedNodeId: id }),
 
 setSearchQuery: (query: string) => set({ searchQuery: query }),
 
 setTimeRange: (range: string) => set({ timeRange: range }),
 
 setFilter: (key: string, value: boolean) => set((state) => ({
 filters: { ...state.filters, [key]: value }
 })),
 
 setZoom: (zoom: number) => set({ zoomLevel: zoom }),
}));
