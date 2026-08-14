import { create } from 'zustand';

export type GovernanceView = 'authority' | 'policies' | 'roles' | 'budgets' | 'ledger' | 'approvals' | 'recovery';

interface GovernanceState {
  currentView: GovernanceView;
  selectedContextId: string | null;
  setCurrentView: (view: GovernanceView) => void;
  setSelectedContextId: (id: string | null) => void;
}

export const useGovernanceStore = create<GovernanceState>((set) => ({
  currentView: 'authority',
  selectedContextId: null,
  setCurrentView: (view) => set({ currentView: view }),
  setSelectedContextId: (id) => set({ selectedContextId: id }),
}));
