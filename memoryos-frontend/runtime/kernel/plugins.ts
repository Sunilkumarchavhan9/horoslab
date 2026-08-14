export interface RuntimePlugin {
 id: string;
 runtime: string; // The ID of the runtime this plugin targets
 install(): Promise<void>;
 uninstall(): Promise<void>;
}

class KernelPluginManager {
 private plugins: Map<string, RuntimePlugin[]> = new Map();

 register(plugin: RuntimePlugin) {
 if (!this.plugins.has(plugin.runtime)) {
 this.plugins.set(plugin.runtime, []);
 }
 this.plugins.get(plugin.runtime)!.push(plugin);
 }

 getForRuntime(runtimeId: string): RuntimePlugin[] {
 return this.plugins.get(runtimeId) || [];
 }
}

export const GlobalPluginManager = new KernelPluginManager();
