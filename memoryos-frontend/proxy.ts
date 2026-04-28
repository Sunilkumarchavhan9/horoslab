import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isDeveloperProtectedRoute = createRouteMatcher([
  "/developer-console",
  "/developer-console/(.*)",
]);

const isPersonalProtectedRoute = createRouteMatcher([
  "/personal-app",
  "/personal-app/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const developerSignInUrl = new URL("/developer-console/sign-in", req.url).toString();
  const personalSignInUrl = new URL("/personal-app/sign-in", req.url).toString();
  const isSignInRoute =
    pathname.startsWith("/developer-console/sign-in") ||
    pathname.startsWith("/personal-app/sign-in") ||
    pathname.startsWith("/personal-app/sign-up");
  const isCallbackRoute =
    pathname.startsWith("/sso-callback") ||
    pathname.startsWith("/sso-callback-developer") ||
    pathname.startsWith("/sso-callback-personal");
  const isEmailVerifyRoute =
    pathname.startsWith("/developer-console/verify-link") ||
    pathname.startsWith("/personal-app/verify-link");

  if (isSignInRoute || isCallbackRoute || isEmailVerifyRoute) {
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

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
