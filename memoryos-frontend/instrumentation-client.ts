import * as Sentry from "@sentry/browser";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.NODE_ENV,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    replaysSessionSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_SAMPLE_RATE ?? 0),
    replaysOnErrorSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ON_ERROR_SAMPLE_RATE ?? 1),
  });
}

export function onRouterTransitionStart(_href: string, _navigationType: string) {
  // Keep Sentry's optional navigation hook present without importing @sentry/nextjs
  // in the client bootstrap path. Error capture remains active via @sentry/browser.
}
