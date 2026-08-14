export type ConnectorPermissionStatus = "ready" | "needs_scope" | "not_connected" | "not_required" | "locked";
export type ConnectorPermissionVerification = "verified" | "token_present" | "not_required" | "not_connected" | "locked";
export type ConnectorPermissionMode = "oauth2" | "api_key" | "filesystem" | "workspace_api" | "planned";

export type ConnectorPermissionDiagnostics = {
  mode: ConnectorPermissionMode;
  requiredScopes: string[];
  grantedScopes: string[];
  missingScopes: string[];
  tokenStored: boolean;
  workspaceScoped: boolean;
  reconnectRequired: boolean;
  status: ConnectorPermissionStatus;
  scopeVerification: ConnectorPermissionVerification;
};

export function scopeListFromUnknown(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/[,\s]+/)
      .map((scope) => scope.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value
      .map((scope) => (typeof scope === "string" ? scope.trim() : ""))
      .filter(Boolean);
  }
  return [];
}

export function requiredScopesForConnector(type: string): string[] {
  switch (type) {
    case "github":
      return scopeListFromUnknown(process.env.GITHUB_OAUTH_SCOPE || "repo workflow read:org read:user user:email");
    case "slack":
      return ["channels:history", "groups:history", "channels:read", "groups:read"];
    case "linear":
      return scopeListFromUnknown(process.env.LINEAR_OAUTH_SCOPES || "read");
    case "jira":
      return ["offline_access", "read:jira-work", "read:jira-user"];
    case "gmail":
      return ["https://www.googleapis.com/auth/gmail.readonly"];
    case "google_drive":
      return ["https://www.googleapis.com/auth/drive.readonly"];
    case "onedrive":
      return ["Files.Read.All", "User.Read", "offline_access"];
    case "zendesk":
      return ["read"];
    default:
      return [];
  }
}

export function configuredScopesFromConnectorConfig(config: Record<string, unknown>): string[] {
  const candidates = [
    config.grantedScopes,
    config.scopes,
    config.scope,
    config.oauthScopes,
    config.permissions,
  ];
  for (const candidate of candidates) {
    const scopes = scopeListFromUnknown(candidate);
    if (scopes.length > 0) return scopes;
  }
  return [];
}

export function buildConnectorPermissionDiagnostics(input: {
  type: string;
  allowed: boolean;
  config: Record<string, unknown>;
  status: string;
  apiBackedEngineeringSignal: boolean;
  isWorkspaceConnector: boolean;
  orgId?: string;
}): ConnectorPermissionDiagnostics {
  const requiredScopes = requiredScopesForConnector(input.type);
  const grantedScopes = configuredScopesFromConnectorConfig(input.config);
  const tokenStored = typeof input.config.accessToken === "string" && input.config.accessToken.length > 0;
  const connected = input.status === "connected" || input.status === "syncing";
  const mode: ConnectorPermissionMode = input.apiBackedEngineeringSignal
    ? "workspace_api"
    : input.isWorkspaceConnector
      ? "filesystem"
      : input.config.authMode === "api_key"
        ? "api_key"
        : requiredScopes.length > 0
          ? "oauth2"
          : "planned";

  if (!input.allowed) {
    return {
      mode,
      requiredScopes,
      grantedScopes: [],
      missingScopes: requiredScopes,
      tokenStored: false,
      workspaceScoped: Boolean(input.orgId),
      reconnectRequired: false,
      status: "locked",
      scopeVerification: "locked",
    };
  }

  if (input.isWorkspaceConnector && !input.apiBackedEngineeringSignal) {
    return {
      mode,
      requiredScopes: [],
      grantedScopes: [],
      missingScopes: [],
      tokenStored: false,
      workspaceScoped: Boolean(input.orgId),
      reconnectRequired: false,
      status: connected ? "ready" : "not_connected",
      scopeVerification: "not_required",
    };
  }

  if (requiredScopes.length === 0) {
    return {
      mode,
      requiredScopes,
      grantedScopes,
      missingScopes: [],
      tokenStored,
      workspaceScoped: Boolean(input.orgId),
      reconnectRequired: false,
      status: connected || tokenStored ? "ready" : "not_required",
      scopeVerification: "not_required",
    };
  }

  if (!tokenStored) {
    return {
      mode,
      requiredScopes,
      grantedScopes: [],
      missingScopes: requiredScopes,
      tokenStored: false,
      workspaceScoped: Boolean(input.orgId),
      reconnectRequired: true,
      status: "not_connected",
      scopeVerification: "not_connected",
    };
  }

  const missingScopes = grantedScopes.length > 0
    ? requiredScopes.filter((scope) => !grantedScopes.includes(scope))
    : [];

  return {
    mode,
    requiredScopes,
    grantedScopes,
    missingScopes,
    tokenStored,
    workspaceScoped: Boolean(input.orgId),
    reconnectRequired: missingScopes.length > 0,
    status: missingScopes.length > 0 ? "needs_scope" : "ready",
    scopeVerification: grantedScopes.length > 0 ? "verified" : "token_present",
  };
}

export function connectorPermissionBlockerMessage(input: {
  type: string;
  permissions: ConnectorPermissionDiagnostics;
}): string | null {
  if (input.permissions.status === "ready" || input.permissions.status === "not_required") {
    return null;
  }
  if (input.permissions.status === "locked") {
    return `${input.type} sync blocked: connector is not available on the current plan.`;
  }
  if (!input.permissions.tokenStored && input.permissions.requiredScopes.length > 0) {
    return `${input.type} sync blocked: no connector token is stored. Reconnect this source with ${input.permissions.requiredScopes.join(", ")}.`;
  }
  if (input.permissions.missingScopes.length > 0) {
    return `${input.type} sync blocked: missing required scopes ${input.permissions.missingScopes.join(", ")}. Reconnect this source before using it for inheritance.`;
  }
  if (input.permissions.reconnectRequired) {
    return `${input.type} sync blocked: source permissions require reconnection before MemoryOS can trust imported evidence.`;
  }
  return null;
}

export function connectorTypeFromSourceRef(sourceRef: string | null | undefined): string | null {
  if (!sourceRef) return null;
  const prefix = sourceRef.split("://")[0]?.split(":")[0]?.trim().toLowerCase();
  if (!prefix) return null;
  const normalized = prefix.replace(/-/g, "_");
  if (normalized === "docs") return "local_files";
  if (normalized === "github_actions") return "ci_cd_logs";
  if (normalized === "sentry") return "deployment_errors";
  if (normalized === "devin_session" || normalized === "devin") return "devin_chats";
  if (normalized === "codex") return "codex_chats";
  if (normalized === "chatgpt") return "chatgpt_chats";
  return normalized;
}
