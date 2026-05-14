import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

const isDeveloperProtectedRoute = createRouteMatcher([
  "/developer-console",
  "/developer-console/(.*)",
  "/playground",
]);

const isPersonalProtectedRoute = createRouteMatcher([
  "/personal-app",
  "/personal-app/(.*)",
]);

const isPublicAuthRoute = createRouteMatcher([
  "/",
  "/sign-up",
  "/developer-console/sign-in",
  "/developer-console/choose-organization",
  "/developer-console/verify-link",
  "/personal-app/sign-in",
  "/personal-app/sign-up",
  "/personal-app/verify-link",
  "/sso-callback",
  "/sso-callback/(.*)",
  "/sso-callback-developer",
  "/sso-callback-developer/(.*)",
  "/sso-callback-personal",
  "/sso-callback-personal/(.*)",
]);

const isMemoryTokenRoute = createRouteMatcher(["/api/memory/token"]);

const protectedMiddleware = clerkMiddleware(async (auth, req) => {
  const developerSignInUrl = new URL("/developer-console/sign-in", req.url).toString();
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
  return protectedMiddleware(req, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
