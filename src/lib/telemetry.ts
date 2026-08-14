// Minimal telemetry shim used during rollout.
// In production, replace with real telemetry/metrics backend.

export function telemetryEvent(name: string, payload: Record<string, any> = {}) {
  // Keep payload small and non-sensitive in telemetry
  try {
    // eslint-disable-next-line no-console
    console.log(`[telemetry] ${name}`, JSON.stringify(payload));
  } catch (e) {
    // noop
  }
}

export default { telemetryEvent };
