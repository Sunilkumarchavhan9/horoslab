import { HorosSignUpView } from "@/components/auth/horos-sign-up-view";

export const metadata = {
  title: "Sign Up - HOROS Physical Intelligence",
  description:
    "Create your HOROS account with Google, GitHub, or LinkedIn to secure early access to certified physical intelligence and humanoid foundation models.",
};

export default function SignUpPage() {
  return <HorosSignUpView />;
}
