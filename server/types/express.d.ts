declare module "express-serve-static-core" {
  interface Request {
    authUserId: string;
    /** Clerk org id from `x-memoryos-org-id` when present. */
    authOrgId?: string;
    authApiKeyId?: string;
    authApiKeyMode?: "full" | "scoped";
    authApiKeyEndpoints?: string[];
    authApiKeyContentTag?: string;
    requestId?: string;
  }
}

export {};
