import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { isClerkEnabled } from "./lib/clerk";

const isDeveloperProtectedRoute = createRouteMatcher([
  "/playground",
]);

const isPersonalProtectedRoute = createRouteMatcher([
  "/personal-app",
  "/personal-app/(.*)",
]);

const isPublicAuthRoute = createRouteMatcher([
  "/",
  "/sign-up",
  "/sign-up/(.*)",
  "/thank-you",
  "/thank-you/(.*)",
  "/auth/sign-in",
  "/auth/sign-up",
  "/auth/verify-link",
  "/personal-app/sign-in",
  "/personal-app/sign-up",
  "/personal-app/verify-link",
  "/sso-callback",
  "/sso-callback/(.*)",
  "/sso-callback-developer",
  "/sso-callback-developer/(.*)",
  "/sso-callback-developer-sign-up",
  "/sso-callback-developer-sign-up/(.*)",
  "/sso-callback-personal",
  "/sso-callback-personal/(.*)",
]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  const developerSignInUrl = new URL("/auth/sign-in", req.url).toString();
  const personalSignInUrl = new URL("/personal-app/sign-in", req.url).toString();

  if (isPublicAuthRoute(req)) {
    return;
  }

  if (isDeveloperProtectedRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: developerSignInUrl,
      unauthorizedUrl: developerSignInUrl,
    });
    return;
  }

  if (isPersonalProtectedRoute(req)) {
    await auth.protect({
      unauthenticatedUrl: personalSignInUrl,
      unauthorizedUrl: personalSignInUrl,
    });
  }
});

export default function proxy(req: NextRequest, event: NextFetchEvent) {
  // OAuth callbacks from older sessions can still target the retired console
  // root. Keep those sessions useful by landing in the current console while
  // preserving callback status query parameters.
  if (req.nextUrl.pathname === "/developer-console") {
    const url = req.nextUrl.clone();
    url.pathname = "/mission-control";
    return NextResponse.redirect(url);
  }

  if (!isClerkEnabled()) {
    return NextResponse.next();
  }

  return protectedMiddleware(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
