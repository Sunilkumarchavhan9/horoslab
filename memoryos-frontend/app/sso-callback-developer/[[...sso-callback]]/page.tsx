import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackDeveloperPage() {
  return (
    <>
      <div id="clerk-captcha" className="min-h-[70px] w-full" aria-hidden="true" />
      <AuthenticateWithRedirectCallback
        signInUrl="/developer-console/sign-in"
        signUpUrl="/sign-up"
        continueSignUpUrl="/sign-up"
      />
    </>
  );
}
