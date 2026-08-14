import { create } from 'zustand';

export interface ExecutionState {
 currentView: string;
 selectedEntity: string | null;
}

export interface ExecutionActions {
 setView: (view: string) => void;
 selectEntity: (id: string | null) => void;
}

export const useExecutionStore = create<ExecutionState & ExecutionActions>((set) => ({
 currentView: 'planner',
 selectedEntity: null,
 
 setView: (view) => set({ currentView: view }),
 selectEntity: (id) => set({ selectedEntity: id })
}));
