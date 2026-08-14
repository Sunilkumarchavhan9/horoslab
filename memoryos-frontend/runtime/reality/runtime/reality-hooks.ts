import { useRealityStore } from './reality-store';
import { RealityViewMode } from './reality-types';

export function useRealitySelection() {
 const selectedNodeId = useRealityStore((state) => state.selectedNodeId);
 const selectNode = useRealityStore((state) => state.selectNode);
 return { selectedNodeId, selectNode };
}

export function useRealityView() {
 const currentView = useRealityStore((state) => state.currentView);
 const setView = useRealityStore((state) => state.setView);
 return { currentView, setView };
}

export function useRealitySearch() {
 const searchQuery = useRealityStore((state) => state.searchQuery);
 const setSearchQuery = useRealityStore((state) => state.setSearchQuery);
 return { searchQuery, setSearchQuery };
}

export function useRealityFilters() {
 const filters = useRealityStore((state) => state.filters);
 const setFilter = useRealityStore((state) => state.setFilter);
 return { filters, setFilter };
}
