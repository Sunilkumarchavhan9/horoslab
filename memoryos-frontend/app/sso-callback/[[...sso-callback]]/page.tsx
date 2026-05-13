import { OAuthCallbackHandler } from "@/components/auth/oauth-callback-handler";

export default function SSOCallbackPage() {
  return (
    <OAuthCallbackHandler
      completeUrl="/developer-console"
      signInUrl="/developer-console/sign-in"
      signUpUrl="/sign-up"
      continueSignUpUrl="/sign-up"
      surface="dark"
    />
  );
}
