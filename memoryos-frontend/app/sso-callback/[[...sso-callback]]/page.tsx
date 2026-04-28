import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <>
      <div id="clerk-captcha" className="min-h-[70px] w-full" aria-hidden="true" />
      <AuthenticateWithRedirectCallback />
    </>
  );
}
