export const CONNECTIONS_SETTINGS_PATH = "/continuity-lab/settings/connections";

export const CUSTOM_MCP_NEW_PATH =
  "/continuity-lab/settings/connections/mcp/new";

export type ConnectionsSettingsTab = "mcps" | "integrations";

export function connectionsSettingsHref(options?: {
  tab?: ConnectionsSettingsTab;
  suggest?: boolean;
  returnTo?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.tab) params.set("tab", options.tab);
  if (options?.suggest) params.set("suggest", "1");
  if (options?.returnTo) params.set("returnTo", options.returnTo);
  const q = params.toString();
  return q ? `${CONNECTIONS_SETTINGS_PATH}?${q}` : CONNECTIONS_SETTINGS_PATH;
}

export function connectionsMcpsHref(returnTo?: string): string {
  return connectionsSettingsHref({ tab: "mcps", returnTo });
}

export function customMcpSetupHref(options?: {
  template?: string;
  returnTo?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.template) params.set("template", options.template);
  if (options?.returnTo) params.set("returnTo", options.returnTo);
  const q = params.toString();
  return q ? `${CUSTOM_MCP_NEW_PATH}?${q}` : CUSTOM_MCP_NEW_PATH;
}
