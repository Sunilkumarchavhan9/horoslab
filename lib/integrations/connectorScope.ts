import {
  connectorStorageId,
  connectorUserFilter,
  normalizeOrgId,
  resolveRequestOrgId,
} from "../auth/orgScope";

export { connectorStorageId, connectorUserFilter, normalizeOrgId, resolveRequestOrgId };

export type ConnectorTenantScope = {
  userId: string;
  orgId?: string;
};

export function resolveConnectorOrgId(explicitOrgId?: string): string | undefined {
  return resolveRequestOrgId(explicitOrgId);
}

export function connectorIdFor(userId: string, type: string, orgId?: string): string {
  return connectorStorageId(userId, type, resolveConnectorOrgId(orgId));
}
