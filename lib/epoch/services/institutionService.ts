import {
  archiveEpochInstitution,
  cloneEpochInstitution,
  createEpochInstitution,
  createEpochTemplate,
  getEpochInstitution,
  listEpochInstitutions,
  listEpochInstitutionVersions,
  listEpochTemplates,
  type CreateEpochInstitutionInput,
  type CreateEpochTemplateInput,
  type UpdateEpochInstitutionInput,
  updateEpochInstitution,
} from "../epochStore";

export type InstitutionServiceSummary = Awaited<ReturnType<typeof summarizeInstitutionService>>;

export async function summarizeInstitutionService(workspaceId: string) {
  const [institutions, templates] = await Promise.all([
    listEpochInstitutions({ workspaceId }),
    listEpochTemplates({ workspaceId }),
  ]);

  const versions = await Promise.all(
    institutions.map(async (institution) => listEpochInstitutionVersions({ workspaceId, institutionId: institution.id })),
  );

  return {
    workspaceId,
    counts: {
      institutions: institutions.length,
      templates: templates.length,
      versions: versions.reduce((total, items) => total + items.length, 0),
    },
    recent: {
      institutions: institutions.slice(0, 10),
      templates: templates.slice(0, 10),
    },
  };
}

export async function createInstitution(input: CreateEpochInstitutionInput) {
  return createEpochInstitution(input);
}

export async function updateInstitution(
  workspaceId: string,
  institutionId: string,
  input: UpdateEpochInstitutionInput,
) {
  return updateEpochInstitution(workspaceId, institutionId, input);
}

export async function archiveInstitution(workspaceId: string, institutionId: string) {
  return archiveEpochInstitution(workspaceId, institutionId);
}

export async function cloneInstitution(
  workspaceId: string,
  institutionId: string,
  input: { userId: string; orgId?: string; name?: string; version?: string },
) {
  return cloneEpochInstitution(workspaceId, institutionId, input);
}

export async function createTemplate(input: CreateEpochTemplateInput) {
  return createEpochTemplate(input);
}

export async function getInstitution(workspaceId: string, institutionId: string) {
  return getEpochInstitution(workspaceId, institutionId);
}

export async function listInstitutionVersions(workspaceId: string, institutionId: string) {
  return listEpochInstitutionVersions({ workspaceId, institutionId });
}
