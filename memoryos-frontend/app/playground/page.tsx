import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PlaygroundSection } from "@/components/developer-console/sections/playground-section";
import { isClerkEnabled } from "@/lib/clerk";

export default async function PlaygroundPage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();

    if (!userId) {
      redirect("/developer-console/sign-in");
    }
  }

  return <PlaygroundSection />;
}
