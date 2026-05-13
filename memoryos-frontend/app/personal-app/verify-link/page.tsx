import { EmailLinkVerification } from "@/components/auth/email-link-verification";

export const dynamic = "force-dynamic";

export default function PersonalAppVerifyLinkPage() {
  return (
    <EmailLinkVerification
      completeUrl="/personal-app"
      signInUrl="/personal-app/sign-in"
      surface="dark"
    />
  );
}
