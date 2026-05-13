import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RunDemoSection } from "@/components/developer-console/sections/run-demo-section";
import { isClerkEnabled } from "@/lib/clerk";

export default async function DeveloperConsoleContinuityLabPage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();

    if (!userId) {
      redirect("/developer-console/sign-in");
    }
  }

  return <RunDemoSection />;
}
