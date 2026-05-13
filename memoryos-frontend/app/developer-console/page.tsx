import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DeveloperConsoleExperience } from "@/components/developer-console/console-experience";
import { isClerkEnabled } from "@/lib/clerk";

export const dynamic = "force-dynamic";
 
export default async function DeveloperConsolePage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();

    if (!userId) {
      redirect("/developer-console/sign-in");
    }
  }

  return <DeveloperConsoleExperience />;
}
