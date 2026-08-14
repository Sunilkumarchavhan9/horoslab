export function isPrismaDatabaseUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;

  const maybeCode =
    "code" in error && typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";
  const maybeMessage =
    "message" in error && typeof (error as { message?: unknown }).message === "string"
      ? (error as { message: string }).message
      : "";

  return (
    maybeCode === "P1001" ||
    maybeCode === "P6001" ||
    maybeMessage.includes("Can't reach database server") ||
    maybeMessage.includes("Error validating datasource `db`") ||
    maybeMessage.includes("must start with the protocol `prisma://`") ||
    maybeMessage.includes("must start with the protocol `prisma+postgres://`")
  );
}

export function hasPrismaCompatibleDatasourceUrl(): boolean {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  return (
    url.startsWith("postgresql://") ||
    url.startsWith("postgres://") ||
    url.startsWith("prisma://") ||
    url.startsWith("prisma+postgres://")
  );
}

export function hasPrismaConnectorDatasourceUrl(): boolean {
  return hasPrismaCompatibleDatasourceUrl();
}

export function getPrismaConnectorDatasourceWarning(): string | null {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url) {
    return "DATABASE_URL is not set for connector access.";
  }
  if (hasPrismaCompatibleDatasourceUrl()) {
    return null;
  }
  return (
    "Connector queries require DATABASE_URL to start with postgresql://, postgres://, prisma://, or prisma+postgres://. " +
    "Current connector datasource is not Prisma-compatible."
  );
}
