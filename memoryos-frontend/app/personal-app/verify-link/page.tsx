import { EmailLinkVerification } from "@/components/auth/email-link-verification";

export default function PersonalAppVerifyLinkPage() {
  return (
    <EmailLinkVerification
      completeUrl="/personal-app"
      signInUrl="/personal-app/sign-in"
      surface="dark"
    />
  );
}
