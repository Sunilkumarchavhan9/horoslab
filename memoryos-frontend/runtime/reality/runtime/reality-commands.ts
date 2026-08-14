import { useRealityStore } from './reality-store';
import { realityEngine } from './reality-engine';
import { RealityViewMode } from './reality-types';

export interface RealityCommand {
 id: string;
 title: string;
 subtitle?: string;
 shortcut?: string[];
 action: () => void;
}

export function useRealityCommands(): RealityCommand[] {
 const setView = useRealityStore((state) => state.setView);
 const selectNode = useRealityStore((state) => state.selectNode);

 return [
 {
 id: 'go_overview',
 title: 'Go to Overview',
 subtitle: 'Reality Workspace',
 shortcut: ['G', 'O'],
 action: () => setView('overview')
 },
 {
 id: 'go_graph',
 title: 'Go to Reality Graph',
 subtitle: 'Reality Workspace',
 shortcut: ['G', 'G'],
 action: () => setView('topology')
 },
 {
 id: 'go_connections',
 title: 'Go to Connections',
 subtitle: 'Reality Workspace',
 shortcut: ['G', 'C'],
 action: () => setView('connections')
 },
 {
 id: 'find_github',
 title: 'Focus GitHub Connection',
 subtitle: 'Find Service',
 action: () => {
 setView('topology');
 selectNode('github');
 setTimeout(() => realityEngine.focusNode('github'), 100);
 }
 }
 ];
}
