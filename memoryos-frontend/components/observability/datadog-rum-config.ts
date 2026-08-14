/** Whether Datadog RUM public env vars are present (inlined at build time). */
export function isDatadogRumConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN &&
      process.env.NEXT_PUBLIC_DD_APPLICATION_ID,
  );
}

/** Production-only: skip RUM in local dev to avoid optional chunk/HMR timeouts. */
export function shouldMountDatadogRum(): boolean {
  if (process.env.NODE_ENV === "development") return false;
  return isDatadogRumConfigured();
}
