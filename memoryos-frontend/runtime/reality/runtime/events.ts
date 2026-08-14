// Event Pipeline for Reality Fabric
// Flow: Webhook -> Normalizer -> Event Bus -> Store / Views

export type RealityEventType = 
 | 'NODE_STATE_CHANGED'
 | 'SYSTEM_OFFLINE'
 | 'MISSION_CREATED'
 | 'WORKER_ASSIGNED'
 | 'EVIDENCE_COLLECTED'
 | 'DECISION_MADE';

export interface RealityEvent {
 id: string;
 type: RealityEventType;
 payload: any;
 timestamp: number;
 source: string; // e.g. 'github', 'slack', 'planner'
}

type EventCallback = (event: RealityEvent) => void;

class RealityEventBus {
 private listeners: Map<RealityEventType | '*', Set<EventCallback>> = new Map();

 constructor() {
 this.listeners.set('*', new Set());
 }

 subscribe(type: RealityEventType | '*', callback: EventCallback) {
 if (!this.listeners.has(type)) {
 this.listeners.set(type, new Set());
 }
 this.listeners.get(type)!.add(callback);
 return () => this.unsubscribe(type, callback);
 }

 unsubscribe(type: RealityEventType | '*', callback: EventCallback) {
 this.listeners.get(type)?.delete(callback);
 }

 publish(type: RealityEventType, payload: any, source: string = 'system') {
 const event: RealityEvent = { 
 id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
 type, 
 payload, 
 timestamp: Date.now(),
 source
 };
 
 // Publish to specific listeners
 this.listeners.get(type)?.forEach(cb => cb(event));
 
 // Publish to wildcard listeners (e.g. for Stream mode)
 this.listeners.get('*')?.forEach(cb => cb(event));
 }
}

export const realityEvents = new RealityEventBus();
