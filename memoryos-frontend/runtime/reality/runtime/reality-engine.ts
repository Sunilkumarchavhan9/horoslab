import { RealityNode } from './reality-types';

/**
 * RealityEngine
 * 
 * An abstraction layer over the graph rendering engine (e.g. React Flow).
 * This allows us to interact with the graph programmatically from outside
 * the React Flow context (e.g., from a command palette or an event).
 */
export class RealityEngine {
 private focusNodeCallback?: (nodeId: string) => void;
 private zoomToFitCallback?: () => void;
 private highlightPathCallback?: (sourceId: string, targetId: string) => void;

 registerFocusNode(cb: (nodeId: string) => void) {
 this.focusNodeCallback = cb;
 }

 registerZoomToFit(cb: () => void) {
 this.zoomToFitCallback = cb;
 }

 registerHighlightPath(cb: (sourceId: string, targetId: string) => void) {
 this.highlightPathCallback = cb;
 }

 focusNode(nodeId: string) {
 if (this.focusNodeCallback) this.focusNodeCallback(nodeId);
 }

 zoomToFit() {
 if (this.zoomToFitCallback) this.zoomToFitCallback();
 }

 highlightPath(sourceId: string, targetId: string) {
 if (this.highlightPathCallback) this.highlightPathCallback(sourceId, targetId);
 }
}

export const realityEngine = new RealityEngine();
