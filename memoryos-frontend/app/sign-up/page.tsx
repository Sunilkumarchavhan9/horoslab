import { auth } from "@clerk/nextjs/server";
import { SignUp } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { ConsoleAuthShell } from "@/components/auth/console-auth-shell";
import { isClerkEnabled } from "@/lib/clerk";

export default async function SignUpPage() {
  const clerkEnabled = isClerkEnabled();

  if (clerkEnabled) {
    const { userId } = await auth();

    if (userId) {
      redirect("/developer-console");
    }
  }

  return (
    <ConsoleAuthShell
      title="Create your MemoryOS access"
      subtitle="Finish account creation here, then continue directly into the developer console onboarding flow."
      footerLabel="MEMORYOS ACCOUNT SETUP"
    >
      {clerkEnabled ? (
        <div className="overflow-hidden rounded-[20px] border border-[#2b2b2b] bg-[#121212] p-2">
          <SignUp
            routing="path"
            path="/sign-up"
            signInUrl="/developer-console/sign-in"
            fallbackRedirectUrl="/developer-console"
            forceRedirectUrl="/developer-console"
            appearance={{
              variables: {
                colorPrimary: "#2678ff",
                colorBackground: "#121212",
                colorInputBackground: "#0f0f0f",
                colorInputText: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "#a5acb8",
                colorNeutral: "#343434",
                borderRadius: "14px",
                fontFamily: "var(--font-space-grotesk), var(--font-sora), sans-serif",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none",
                card: "w-full border-0 bg-transparent shadow-none",
                headerTitle: "text-white text-[28px] tracking-[-0.04em]",
                headerSubtitle: "text-[#a5acb8]",
                socialButtonsBlockButton:
                  "border border-[#343434] bg-transparent text-white hover:bg-white/5 hover:border-[#4a4a4a]",
                formButtonPrimary:
                  "bg-[#2678ff] text-white hover:bg-[#3d88ff] shadow-none",
                formFieldInput:
                  "bg-[#0f0f0f] border border-[#343434] text-white placeholder:text-[#636c77]",
                footerActionText: "text-[#a5acb8]",
                footerActionLink: "text-[#7ea9ff] hover:text-white",
                identityPreviewText: "text-white",
                formFieldLabel: "text-white",
                dividerLine: "bg-[#2a2a2a]",
                dividerText: "text-[#767d87]",
              },
            }}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-[14px] leading-6 text-[#767d87]">
            Configure Clerk to continue sign-up in the app.
          </p>
        </div>
      )}
    </ConsoleAuthShell>
  );
}
