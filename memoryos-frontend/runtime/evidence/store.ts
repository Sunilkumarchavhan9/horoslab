import { create } from 'zustand';

interface EvidenceState {
  currentView: string;
  setView: (view: string) => void;
}

export const useEvidenceStore = create<EvidenceState>((set) => ({
  currentView: 'artifacts', // default
  setView: (view) => set({ currentView: view }),
}));
