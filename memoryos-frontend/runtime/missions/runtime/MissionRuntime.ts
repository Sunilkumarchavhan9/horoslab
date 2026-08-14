import { Runtime } from '../../kernel/runtime';
import { GlobalCommandRegistry } from '../../kernel/commands';
import { GlobalMissionRegistry } from './MissionRegistry';

// Import components
import { MissionOverview } from '../perspectives/overview/MissionOverview';
import { MissionPlannerView } from '../perspectives/planner/MissionPlannerView';
import { MissionActiveView } from '../perspectives/active/MissionActiveView';
import { MissionTemplatesView } from '../perspectives/templates/MissionTemplatesView';
import { MissionQueueView } from '../perspectives/queue/MissionQueueView';
import { MissionAutomationView } from '../perspectives/automation/MissionAutomationView';
import { MissionTimelineView } from '../perspectives/timeline/MissionTimelineView';
import { MissionHistoryView } from '../perspectives/history/MissionHistoryView';
import { MissionExecutionView } from '../perspectives/execution/MissionExecutionView';

class MissionRuntimeImpl implements Runtime {
  id = 'missions';

  async initialize(): Promise<void> {
    console.log('[Mission Runtime] Initializing...');
    this.registerPerspectives();
    this.registerCommands();
    this.registerEvents();
  }

  registerPerspectives(): void {
    GlobalMissionRegistry.register({ id: 'overview', title: 'Overview', component: MissionOverview });
    GlobalMissionRegistry.register({ id: 'planner', title: 'Planner', component: MissionPlannerView });
    GlobalMissionRegistry.register({ id: 'active', title: 'Active Missions', component: MissionActiveView });
    GlobalMissionRegistry.register({ id: 'templates', title: 'Mission Templates', component: MissionTemplatesView });
    GlobalMissionRegistry.register({ id: 'queue', title: 'Queue', component: MissionQueueView });
    GlobalMissionRegistry.register({ id: 'automation', title: 'Automation', component: MissionAutomationView });
    GlobalMissionRegistry.register({ id: 'timeline', title: 'Timeline', component: MissionTimelineView });
    GlobalMissionRegistry.register({ id: 'history', title: 'Mission History', component: MissionHistoryView });
    GlobalMissionRegistry.register({ id: 'execution', title: 'Execution', component: MissionExecutionView });
  }

  async destroy(): Promise<void> {
    console.log('[Mission Runtime] Destroying...');
  }

  activate(): void {
    console.log('[Mission Runtime] Activated.');
  }

  deactivate(): void {
    console.log('[Mission Runtime] Deactivated.');
  }

  registerCommands(): void {
    GlobalCommandRegistry.register({
      id: 'missions.create',
      title: 'Create Mission',
      visibility: 'global',
      runtimeId: this.id,
      handler: () => console.log('Create Mission Cmd triggered'),
    });
  }

  registerEvents(): void {
    // Register mission-specific event bindings here
  }
}

export const MissionRuntime = new MissionRuntimeImpl();
