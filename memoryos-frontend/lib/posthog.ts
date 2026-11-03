import posthog from "posthog-js";

export function isPostHogEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function trackSignup(email: string, provider: string, name?: string) {
  if (typeof window === "undefined") return;

  try {
    if (posthog.__loaded) {
      posthog.identify(email, {
        email,
        name: name || undefined,
        signup_provider: provider,
        signup_time: new Date().toISOString(),
        plan: "early_access",
      });

      posthog.capture("user_signed_up", {
        email,
        provider,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn("[PostHog] trackSignup failed:", err);
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    if (posthog.__loaded) {
      posthog.capture(eventName, properties);
    }
  } catch (err) {
    console.warn(`[PostHog] trackEvent (${eventName}) failed:`, err);
  }
}

