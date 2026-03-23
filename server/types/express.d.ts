declare module "express-serve-static-core" {
  interface Request {
    authUserId: string;
    requestId?: string;
  }
}

export {};
