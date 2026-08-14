import { RealityEntityType, RealityEntity } from './types';
import { ExternalLink, Target, Search, Copy, Activity, ShieldCheck, Play } from 'lucide-react';
import React from 'react';

export interface EntityAction {
 id: string;
 label: string;
 icon: React.ReactNode;
 handler: (entity: RealityEntity) => void;
 primary?: boolean;
}

// A registry mapping Entity Types to available actions
export const EntityActionRegistry: Partial<Record<RealityEntityType, EntityAction[]>> = {
 repository: [
 { id: 'view_code', label: 'View Source', icon: <ExternalLink className="size-3.5" />, handler: (e) => console.log('View', e.id) },
 { id: 'trace_impact', label: 'Trace Impact', icon: <Activity className="size-3.5" />, handler: (e) => console.log('Trace', e.id) },
 ],
 service: [
 { id: 'view_logs', label: 'View Logs', icon: <Search className="size-3.5" />, handler: (e) => console.log('Logs', e.id) },
 { id: 'restart', label: 'Restart Service', icon: <Play className="size-3.5" />, handler: (e) => console.log('Restart', e.id), primary: true },
 ],
 mission: [
 { id: 'open_mission', label: 'Open Mission Workspace', icon: <Target className="size-3.5" />, handler: (e) => console.log('Open', e.id), primary: true },
 { id: 'view_evidence', label: 'View Evidence', icon: <ShieldCheck className="size-3.5" />, handler: (e) => console.log('Evidence', e.id) },
 ],
};

// Universal actions available on ALL entities
export const UniversalEntityActions: EntityAction[] = [
 { id: 'copy_id', label: 'Copy ID', icon: <Copy className="size-3.5" />, handler: (e) => navigator.clipboard.writeText(e.id) },
];

export function getActionsForEntity(entity: RealityEntity): EntityAction[] {
 const specificActions = EntityActionRegistry[entity.type] || [];
 return [...specificActions, ...UniversalEntityActions];
}
