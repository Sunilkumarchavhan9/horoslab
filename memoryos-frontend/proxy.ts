import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher([
  "/developer-console",
  "/developer-console/(.*)",
  "/personal-app",
  "/personal-app/(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const isSignInRoute =
    pathname.startsWith("/developer-console/sign-in") ||
    pathname.startsWith("/personal-app/sign-in");
  const isCallbackRoute = pathname.startsWith("/sso-callback");
  const isEmailVerifyRoute =
    pathname.startsWith("/developer-console/verify-link") ||
    pathname.startsWith("/personal-app/verify-link");

  if (isProtectedRoute(req) && !isSignInRoute && !isCallbackRoute && !isEmailVerifyRoute) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
