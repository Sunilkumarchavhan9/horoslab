import { Runtime } from './runtime';

class KernelLifecycleManager {
 private runtimes: Map<string, Runtime> = new Map();

 async registerRuntime(runtime: Runtime) {
 if (this.runtimes.has(runtime.id)) return;
 
 this.runtimes.set(runtime.id, runtime);
 
 // Lifecycle Boot
 await runtime.initialize();
 runtime.registerCommands();
 runtime.registerEvents();
 
 // Note: activate() is called when the user actually enters that runtime workspace
 }

 async unregisterRuntime(id: string) {
 const runtime = this.runtimes.get(id);
 if (runtime) {
 await runtime.destroy();
 this.runtimes.delete(id);
 }
 }

 getRuntime(id: string): Runtime | undefined {
 return this.runtimes.get(id);
 }
}

export const GlobalLifecycleManager = new KernelLifecycleManager();
