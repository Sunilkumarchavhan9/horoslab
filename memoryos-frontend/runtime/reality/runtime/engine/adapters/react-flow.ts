import { EngineAdapter, RealityEngine } from '../index';
import { useEffect } from 'react';

// A hook to be used inside the React Flow context to register it as the active engine
export function useReactFlowAdapter(
 // You would pass React Flow instances here:
 // instance: ReactFlowInstance
) {
 useEffect(() => {
 const adapter: EngineAdapter = {
 focusNode: (id) => {
 // Here we would interact with React Flow instance to center on the node
 console.log('[ReactFlow Adapter] Focusing node:', id);
 },
 zoomToFit: () => {
 // instance.fitView()
 console.log('[ReactFlow Adapter] Zoom to fit');
 },
 highlightPath: (source, target) => {
 console.log('[ReactFlow Adapter] Highlight path:', source, '->', target);
 }
 };

 RealityEngine.registerAdapter(adapter);
 
 return () => {
 // Cleanup logic if needed
 };
 }, []); // dependencies
}
