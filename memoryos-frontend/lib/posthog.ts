import posthog from "posthog-js";

export function isPostHogEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);
}

export function trackSignup(
  data:
    | string
    | {
        email: string;
        provider?: string;
        method?: string;
        name?: string;
      },
  fallbackProvider?: string,
  fallbackName?: string
) {
  if (typeof window === "undefined") return;

  try {
    const email = typeof data === "string" ? data : data.email;
    const provider =
      typeof data === "string" ? fallbackProvider || "email" : data.provider || "email";
    const method = typeof data === "object" ? data.method || provider : provider;
    const name = typeof data === "object" ? data.name : fallbackName;

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
      method,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("[PostHog] trackSignup failed:", err);
  }
}

export function trackEvent(eventName: string, properties?: Record<string, any>) {
  if (typeof window === "undefined") return;

  try {
    posthog.capture(eventName, properties);
  } catch (err) {
    console.warn(`[PostHog] trackEvent (${eventName}) failed:`, err);
  }
}
