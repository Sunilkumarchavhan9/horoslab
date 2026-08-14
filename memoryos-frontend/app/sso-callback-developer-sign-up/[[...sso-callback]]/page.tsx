import { OAuthCallbackHandler } from "@/components/auth/oauth-callback-handler";

export default function SSOCallbackDeveloperSignUpPage() {
  return (
    <OAuthCallbackHandler
      completeUrl="/mission-control"
      signInUrl="/auth/sign-in"
      signUpUrl="/auth/sign-up"
      continueSignUpUrl="/auth/sign-up"
      accountExistsRedirectUrl="/auth/sign-in"
      errorRedirectUrl="/auth/sign-up"
      surface="dark"
    />
  );
}
