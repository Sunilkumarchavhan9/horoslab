import { Runtime } from '../../kernel/runtime';
import { GlobalCommandRegistry } from '../../kernel/commands';

// Import perspectives to trigger their side-effect registrations
import '../perspectives/overview/RealityOverview';
import '../perspectives/topology/RealityGraphMode';
import '../perspectives/entities/RealityEntitiesMode';
import '../perspectives/connections/RealityConnectionsMode';
import '../perspectives/sources/RealitySourcesMode';
import '../perspectives/stream/RealityStreamMode';
import '../perspectives/impact/RealityImpactMode';
import '../perspectives/watcher/RealityApiWatcherMode';
import '../perspectives/decisions/RealityDecisionMode';
import '../perspectives/query/RealityQueryMode';
class RealityRuntimeImpl implements Runtime {
 id = 'reality';

 async initialize(): Promise<void> {
 console.log('[Reality Runtime] Initializing...');
 this.registerPerspectives();
 this.registerCommands();
 this.registerEvents();
 }

 async destroy(): Promise<void> {
 console.log('[Reality Runtime] Destroying...');
 }

 activate(): void {
 console.log('[Reality Runtime] Activated.');
 }

 deactivate(): void {
 console.log('[Reality Runtime] Deactivated.');
 }

 registerCommands(): void {
 GlobalCommandRegistry.register({
 id: 'reality.focus',
 title: 'Focus Repository',
 visibility: 'runtime_specific',
 runtimeId: this.id,
 handler: () => console.log('Focus Repo Cmd triggered'),
 });
 }

 registerEvents(): void {
 // Register reality-specific event bindings here
 }

 private registerPerspectives(): void {
 // Perspectives are typically self-registering in their files, 
 // but the runtime could force load them here if dynamic loading is used.
 }
}

export const RealityRuntime = new RealityRuntimeImpl();
