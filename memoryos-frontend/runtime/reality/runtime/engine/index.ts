export interface EngineAdapter {
 focusNode(id: string): void;
 zoomToFit(): void;
 highlightPath(sourceId: string, targetId: string): void;
}

/**
 * RealityEngine
 * A singleton that manages the active graph engine adapter.
 * This separates the UI from React Flow, WebGL, or Canvas.
 */
class RealityEngineImpl {
 private adapter: EngineAdapter | null = null;

 registerAdapter(adapter: EngineAdapter) {
 this.adapter = adapter;
 }

 focusNode(id: string) {
 this.adapter?.focusNode(id);
 }

 zoomToFit() {
 this.adapter?.zoomToFit();
 }

 highlightPath(sourceId: string, targetId: string) {
 this.adapter?.highlightPath(sourceId, targetId);
 }
}

export const RealityEngine = new RealityEngineImpl();
