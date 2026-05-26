declare module "express-serve-static-core" {
  interface Request {
    authUserId: string;
    authApiKeyId?: string;
    requestId?: string;
  }
}

export {};
