import { RuntimeEvent } from './events';

type EventCallback = (event: RuntimeEvent) => void;

class KernelRuntimeBus {
 private listeners: Map<string | '*', Set<EventCallback>> = new Map();

 constructor() {
 this.listeners.set('*', new Set());
 }

 subscribe(type: string | '*', callback: EventCallback) {
 if (!this.listeners.has(type)) {
 this.listeners.set(type, new Set());
 }
 this.listeners.get(type)!.add(callback);
 return () => this.unsubscribe(type, callback);
 }

 unsubscribe(type: string | '*', callback: EventCallback) {
 this.listeners.get(type)?.delete(callback);
 }

 publish(event: RuntimeEvent) {
 this.listeners.get(event.type)?.forEach(cb => cb(event));
 this.listeners.get('*')?.forEach(cb => cb(event));
 }
}

export const RuntimeBus = new KernelRuntimeBus();
