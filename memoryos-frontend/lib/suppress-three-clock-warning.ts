/**
 * Suppresses the THREE.Clock deprecation warning that is emitted by
 * @react-three/fiber and @react-three/postprocessing internally.
 *
 * three.js r183 deprecated THREE.Clock in favour of THREE.Timer, but r3f v9
 * still creates a THREE.Clock internally for its render loop — we can't avoid
 * that until r3f ships its own update.  Rather than patching the global
 * console.warn, we use three's own official escape hatch: setConsoleFunction.
 * This intercepts only THREE's internal log calls and lets us filter the one
 * noisy message while forwarding everything else unchanged.
 *
 * Import this module ONCE, before any @react-three/* import in your app, e.g.:
 *
 *   import "@/lib/suppress-three-clock-warning";
 */

import { setConsoleFunction } from "three";

setConsoleFunction((level: string, message: string, ...rest: unknown[]) => {
  // Drop only the Clock deprecation notice – everything else is forwarded.
  if (
    level === "warn" &&
    typeof message === "string" &&
    message.includes("THREE.Clock")
  ) {
    return;
  }

  const fn = (console as unknown as Record<string, (...a: unknown[]) => void>)[
    level
  ];
  if (typeof fn === "function") {
    fn(message, ...rest);
  }
});
