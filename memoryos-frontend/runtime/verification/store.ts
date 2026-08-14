import { create } from 'zustand';

export type VerificationView = 'runs' | 'outcomes' | 'assurance' | 'certificates' | 'challenges' | 'graph';

interface VerificationState {
  currentView: VerificationView;
  setView: (view: VerificationView) => void;
  selectedRunId: string | null;
  setSelectedRunId: (id: string | null) => void;
}

export const useVerificationStore = create<VerificationState>((set) => ({
  currentView: 'runs',
  setView: (view) => set({ currentView: view }),
  selectedRunId: null,
  setSelectedRunId: (id) => set({ selectedRunId: id }),
}));
