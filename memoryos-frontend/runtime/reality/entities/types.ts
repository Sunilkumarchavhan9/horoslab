export type RealityEntityType = 
 | 'repository'
 | 'service'
 | 'database'
 | 'api'
 | 'institution'
 | 'mission'
 | 'agent'
 | 'evidence'
 | 'decision'
 | 'connection'
 | 'source'
 | 'channel'
 | 'version'
 | 'breaking_change'
 | 'warning'
 | 'unknown';

export interface RealityEntity {
 id: string;
 type: RealityEntityType;
 title: string;
 subtitle?: string;
 status?: 'healthy' | 'warning' | 'error' | 'offline' | 'unknown';
 health?: number;
 metadata?: Record<string, unknown>;
}

export interface Repository extends RealityEntity {
 type: 'repository';
 provider: string;
 language: string;
 visibility: 'public' | 'private' | 'internal';
 lastCommit?: string;
 branches?: number;
}

export interface Service extends RealityEntity {
 type: 'service';
 uptime?: string;
 endpoints?: number;
 latency?: string;
}

export interface Mission extends RealityEntity {
 type: 'mission';
 runtime: string;
 state: 'planning' | 'executing' | 'completed' | 'failed';
 assignedWorkers?: number;
 progress?: number;
}

export interface Database extends RealityEntity {
 type: 'database';
 engine: string;
 size?: string;
}

export interface Connection extends RealityEntity {
 type: 'connection';
 volume?: string;
}

// ... other specific entities can be added as needed
