import { applyRuntimeUiEventToStore } from "@/lib/continuity-lab/event-adapter";

/**
 * Legacy fixture controls are intentionally no-op for parity shipping.
 * Runtime state must come from backend events only.
 */
export function startFixtureStream() {
  applyRuntimeUiEventToStore({
    kind: "desktop_status",
    payload: {
      status: "idle",
      runtimeMessage: "Fixture mode disabled. Connect to live runtime.",
    },
  });
}

export function stopFixtureStream() {
  // no-op
}
