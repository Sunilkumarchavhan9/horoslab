// OpenHands runtime origin resolver removed.
// Previously this returned a configured runtime origin. Since OpenHands
// is removed from the codebase, return an empty string so callers can
// detect absence and behave accordingly.
export function resolveOpenHandsRuntimeOrigin(): string {
  return "";
}
