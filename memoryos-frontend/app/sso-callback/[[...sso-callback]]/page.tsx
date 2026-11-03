import { OAuthCallbackHandler } from "@/components/auth/oauth-callback-handler";

export default function SSOCallbackPage() {
  return (
    <OAuthCallbackHandler
      completeUrl="/?signed_up=true"
      signInUrl="/"
      signUpUrl="/"
      continueSignUpUrl="/"
      accountExistsRedirectUrl="/?signed_up=true"
      surface="dark"
    />
  );
}
