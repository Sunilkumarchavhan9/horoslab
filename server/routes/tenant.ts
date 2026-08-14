import type { Request } from "express";
import type { TenantScope } from "../../lib/auth/orgScope";

export function tenantFromRequest(req: Request): TenantScope {
  return {
    userId: req.authUserId,
    ...(req.authOrgId ? { orgId: req.authOrgId } : {}),
  };
}
