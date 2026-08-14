import React from 'react';
import { InstitutionIdentityView } from './perspectives/identity/InstitutionIdentityView';
import { InstitutionGenomeView } from './perspectives/genome/InstitutionGenomeView';
import { InstitutionGovernanceView } from './perspectives/governance/InstitutionGovernanceView';
import { InstitutionHierarchyView } from './perspectives/hierarchy/InstitutionHierarchyView';
import { InstitutionVersionsView } from './perspectives/versions/InstitutionVersionsView';
import { InstitutionProposalsView } from './perspectives/proposals/InstitutionProposalsView';
import { InstitutionEvolutionView } from './perspectives/evolution/InstitutionEvolutionView';
import { InstitutionTemplatesView } from './perspectives/templates/InstitutionTemplatesView';

export interface InstitutionViewDefinition {
 id: string;
 title: string;
 component: React.ComponentType;
}

class InstitutionRegistry {
 private views = new Map<string, InstitutionViewDefinition>();

 register(view: InstitutionViewDefinition) {
 this.views.set(view.id, view);
 }

 get(id: string): InstitutionViewDefinition | undefined {
 return this.views.get(id);
 }

 getAll(): InstitutionViewDefinition[] {
 return Array.from(this.views.values());
 }
}

export const GlobalInstitutionRegistry = new InstitutionRegistry();

// Register the 8 foundational Institution Runtime perspectives
GlobalInstitutionRegistry.register({ id: 'identity', title: 'Identity', component: InstitutionIdentityView });
GlobalInstitutionRegistry.register({ id: 'genome', title: 'Genome', component: InstitutionGenomeView });
GlobalInstitutionRegistry.register({ id: 'governance', title: 'Governance', component: InstitutionGovernanceView });
GlobalInstitutionRegistry.register({ id: 'hierarchy', title: 'Hierarchy', component: InstitutionHierarchyView });
GlobalInstitutionRegistry.register({ id: 'versions', title: 'Versions', component: InstitutionVersionsView });
GlobalInstitutionRegistry.register({ id: 'proposals', title: 'Proposals', component: InstitutionProposalsView });
GlobalInstitutionRegistry.register({ id: 'evolution', title: 'Evolution', component: InstitutionEvolutionView });
GlobalInstitutionRegistry.register({ id: 'templates', title: 'Templates', component: InstitutionTemplatesView });
