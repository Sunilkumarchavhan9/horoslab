import { OAuthCallbackHandler } from "@/components/auth/oauth-callback-handler";

export default function SSOCallbackPersonalPage() {
  return (
    <OAuthCallbackHandler
      completeUrl="/personal-app"
      signInUrl="/personal-app/sign-in"
      signUpUrl="/personal-app/sign-up"
      continueSignUpUrl="/personal-app/sign-up"
      surface="light"
    />
  );
}
