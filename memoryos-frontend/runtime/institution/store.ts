import { create } from "zustand";

export interface InstitutionState {
  currentView: string;
  selectedEntity: string | null;
  status: "healthy" | "at_risk" | "remediating";
  activeRiskCount: number;
}

export interface InstitutionActions {
  setView: (view: string) => void;
  selectEntity: (id: string | null) => void;
  setStatus: (status: "healthy" | "at_risk" | "remediating") => void;
  setRiskCount: (count: number) => void;
}

export const useInstitutionStore = create<InstitutionState & InstitutionActions>((set) => ({
  currentView: "identity",
  selectedEntity: null,
  status: "healthy",
  activeRiskCount: 0,
  setView: (view) => set({ currentView: view }),
  selectEntity: (id) => set({ selectedEntity: id }),
  setStatus: (status) => set({ status }),
  setRiskCount: (count) => set({ activeRiskCount: count }),
}));
