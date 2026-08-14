export type RealityViewMode = 
 | 'overview' 
 | 'topology' 
 | 'connections' 
 | 'sources' 
 | 'stream' 
 | 'impact' 
 | 'watcher' 
 | 'decisions';

export interface RealityNode {
 id: string;
 type: string;
 label: string;
 [key: string]: any;
}

export interface RealityState {
 // Global Selection & View Mode
 currentView: RealityViewMode;
 selectedNodeId: string | null;
 
 // Workspace Filters & Search
 searchQuery: string;
 timeRange: string;
 filters: Record<string, boolean>;
 
 // Graph & Engine State (Zoom/Pan controlled by engine, but high-level here)
 zoomLevel: number;
}

export interface RealityActions {
 setView: (view: RealityViewMode) => void;
 selectNode: (id: string | null) => void;
 setSearchQuery: (query: string) => void;
 setTimeRange: (range: string) => void;
 setFilter: (key: string, value: boolean) => void;
 setZoom: (zoom: number) => void;
}

export type RealityStore = RealityState & RealityActions;
