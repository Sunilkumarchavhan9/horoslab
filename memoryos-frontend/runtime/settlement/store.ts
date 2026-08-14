import { create } from 'zustand';

export type SettlementView = 'results' | 'outcomes' | 'audit' | 'learning' | 'memory-preflight' | 'mission-outcomes' | 'learning-handoff' | 'settlement' | 'certificates';

interface SettlementState {
  currentView: SettlementView;
  selectedSettlementId: string | null;
  setCurrentView: (view: SettlementView) => void;
  setSelectedSettlementId: (id: string | null) => void;
}

export const useSettlementStore = create<SettlementState>((set) => ({
  currentView: 'results',
  selectedSettlementId: null,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedSettlementId: (id) => set({ selectedSettlementId: id }),
}));
