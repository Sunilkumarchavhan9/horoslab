import { create } from 'zustand';

export interface AgentIdentity {
 id: string;
 name: string;
 pool: string;
 skills: { name: string; confidence: number; experience: string }[];
 memory: string;
 trustLevel: string;
 history: string;
}

export interface AgentCapability {
 id: string;
 name: string;
 category: string;
 confidence: number;
 experience: string;
}

export interface AgentLease {
 id: string;
 agentId: string;
 missionId: string;
 authority: string[];
 policies: string[];
 verification: string;
 expiresIn: string;
 status: 'valid' | 'revoked' | 'expired';
}

export interface AgentState {
 currentView: string;
 selectedEntity: string | null;
 registry: AgentIdentity[];
 capabilities: AgentCapability[];
 leases: AgentLease[];
}

export interface AgentActions {
 setView: (view: string) => void;
 selectEntity: (id: string | null) => void;
}

export const useAgentStore = create<AgentState & AgentActions>((set) => ({
 currentView: 'registry',
 selectedEntity: null,
 
 registry: [
 {
 id: 'agt-sec-1',
 name: 'Security Agent #42',
 pool: 'Security Operations',
 skills: [
 { name: 'Repository Scan', confidence: 98, experience: 'Expert' },
 { name: 'Token Rotation', confidence: 100, experience: 'Master' },
 { name: 'Policy Evaluation', confidence: 95, experience: 'Advanced' }
 ],
 memory: 'Shared Pool Memory (Encrypted)',
 trustLevel: 'High (Verified)',
 history: '1,420 missions completed. 0 policy violations.'
 },
 {
 id: 'agt-aud-1',
 name: 'Audit Logger #7',
 pool: 'Compliance',
 skills: [
 { name: 'Event Ingestion', confidence: 100, experience: 'Master' },
 { name: 'Signature Verification', confidence: 99, experience: 'Master' }
 ],
 memory: 'Immutable Ledger (Append-only)',
 trustLevel: 'Maximum (Core)',
 history: '8.4M events logged. 100% uptime.'
 }
 ],

 capabilities: [
 { id: 'cap-scan', name: 'Repository Analysis', category: 'Security', confidence: 98, experience: '14k Repos Scanned' },
 { id: 'cap-rotate', name: 'Token Rotation', category: 'Security', confidence: 100, experience: '8k Tokens Rotated' },
 { id: 'cap-policy', name: 'Policy Evaluation', category: 'Governance', confidence: 95, experience: '45k Commits Evaluated' },
 { id: 'cap-audit', name: 'Cryptographic Auditing', category: 'Compliance', confidence: 99, experience: '1.2M Signatures Verified' }
 ],

 leases: [
 {
 id: 'lse-1029',
 agentId: 'agt-sec-1',
 missionId: 'msn-rotate-github',
 authority: ['Write: GitHub API', 'Read: Secrets Manager'],
 policies: ['CI Protected', 'Require 2FA Context'],
 verification: 'Required (Strict)',
 expiresIn: '12m 45s',
 status: 'valid'
 },
 {
 id: 'lse-1030',
 agentId: 'agt-sec-2',
 missionId: 'msn-scan-deps',
 authority: ['Read: GitHub API'],
 policies: ['Read-Only Access'],
 verification: 'Standard',
 expiresIn: 'Expired',
 status: 'expired'
 }
 ],

 setView: (view) => set({ currentView: view }),
 selectEntity: (id) => set({ selectedEntity: id })
}));
