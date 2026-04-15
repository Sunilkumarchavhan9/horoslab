import { EmailLinkVerification } from "@/components/auth/email-link-verification";

export default function DeveloperConsoleVerifyLinkPage() {
  return (
    <EmailLinkVerification
      completeUrl="/developer-console"
      signInUrl="/developer-console/sign-in"
      surface="dark"
    />
  );
}
