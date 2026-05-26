import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ContinuityLabPageClient } from "@/components/developer-console/continuity-lab-page-client";
import { isClerkEnabled } from "@/lib/clerk";

export default async function DeveloperConsoleContinuityLabPage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();

    if (!userId) {
      redirect("/developer-console/sign-in");
    }
  }

  return <ContinuityLabPageClient />;
}
