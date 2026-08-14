// A simple event bus for real-time fabric updates
export type RealityEventType = 
 | 'NODE_STATE_CHANGED'
 | 'SYSTEM_OFFLINE'
 | 'MISSION_CREATED'
 | 'WORKER_ASSIGNED';

export interface RealityEvent {
 type: RealityEventType;
 payload: any;
 timestamp: number;
}

type EventCallback = (event: RealityEvent) => void;

class RealityEventBus {
 private listeners: Map<RealityEventType, Set<EventCallback>> = new Map();

 subscribe(type: RealityEventType, callback: EventCallback) {
 if (!this.listeners.has(type)) {
 this.listeners.set(type, new Set());
 }
 this.listeners.get(type)!.add(callback);
 return () => this.unsubscribe(type, callback);
 }

 unsubscribe(type: RealityEventType, callback: EventCallback) {
 this.listeners.get(type)?.delete(callback);
 }

 publish(type: RealityEventType, payload: any) {
 const event: RealityEvent = { type, payload, timestamp: Date.now() };
 this.listeners.get(type)?.forEach(cb => cb(event));
 
 // Global wildcard listener could be added here if needed
 }
}

export const realityEvents = new RealityEventBus();
