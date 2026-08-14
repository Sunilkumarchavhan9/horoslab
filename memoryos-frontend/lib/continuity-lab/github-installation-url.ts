const DEFAULT_MEMORYOS_GITHUB_APP_SLUG = "memoryostm";

function isGitHubInstallationSettingsUrl(value: string): boolean {
  return /^https:\/\/github\.com\/settings\/installations\/\d+\/?$/.test(value);
}

function normalizeGitHubAppSlug(value: string): string | null {
  const slug = value.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(slug)) {
    return null;
  }
  return slug;
}

export function resolveGitHubInstallationUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_GITHUB_APP_INSTALLATION_URL ??
    process.env.NEXT_PUBLIC_MEMORYOS_GITHUB_INSTALLATION_URL;
  const trimmed = configured?.trim();

  if (trimmed && isGitHubInstallationSettingsUrl(trimmed)) {
    return trimmed;
  }

  const configuredSlug =
    process.env.NEXT_PUBLIC_GITHUB_APP_SLUG ??
    process.env.NEXT_PUBLIC_MEMORYOS_GITHUB_APP_SLUG;
  const slug =
    normalizeGitHubAppSlug(configuredSlug ?? "") ??
    DEFAULT_MEMORYOS_GITHUB_APP_SLUG;

  return `https://github.com/apps/${slug}/installations/new`;
}
