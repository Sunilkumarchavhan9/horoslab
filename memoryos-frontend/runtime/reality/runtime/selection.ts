import { RealityEntityType } from '../entities/types';

export interface Selection {
 type: RealityEntityType;
 id: string;
 sourceView: string; // e.g. 'topology', 'impact', 'connections'
}

// Global selection state interface.
// This will be merged into the main store, or we can isolate it.
// To follow the OS paradigm, Selection is a core primitive.
export interface SelectionState {
 currentSelection: Selection | null;
 selectEntity: (type: RealityEntityType, id: string, sourceView: string) => void;
 clearSelection: () => void;
}
