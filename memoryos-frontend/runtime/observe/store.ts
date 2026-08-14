import { create } from 'zustand';

export type ObserveView = 'runtime' | 'timeline' | 'analytics' | 'performance';

interface ObserveState {
  currentView: ObserveView;
  selectedContextId: string | null;
  setCurrentView: (view: ObserveView) => void;
  setSelectedContextId: (id: string | null) => void;
}

export const useObserveStore = create<ObserveState>((set) => ({
  currentView: 'runtime',
  selectedContextId: null,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedContextId: (id) => set({ selectedContextId: id }),
}));
