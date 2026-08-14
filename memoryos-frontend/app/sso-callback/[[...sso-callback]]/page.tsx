import { OAuthCallbackHandler } from "@/components/auth/oauth-callback-handler";

export default function SSOCallbackPage() {
  return (
    <OAuthCallbackHandler
      completeUrl="/mission-control"
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      continueSignUpUrl="/auth/sign-up"
      surface="dark"
    />
  );
}
