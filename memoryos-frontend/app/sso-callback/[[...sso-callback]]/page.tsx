import { OAuthCallbackHandler } from "@/components/auth/oauth-callback-handler";

export default function SSOCallbackPage() {
  return (
    <OAuthCallbackHandler
      completeUrl="/thank-you"
      signInUrl="/sign-up"
      signUpUrl="/sign-up"
      continueSignUpUrl="/sign-up"
      accountExistsRedirectUrl="/thank-you"
      surface="dark"
    />
  );
}
