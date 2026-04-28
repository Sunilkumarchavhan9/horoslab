import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPersonalPage() {
  return (
    <>
      <div id="clerk-captcha" className="min-h-[70px] w-full" aria-hidden="true" />
      <AuthenticateWithRedirectCallback
        signInUrl="/personal-app/sign-in"
        signUpUrl="/personal-app/sign-up"
        continueSignUpUrl="/personal-app/sign-up"
      />
    </>
  );
}
