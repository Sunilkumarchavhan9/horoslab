import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PersonalAppExperience } from "@/components/personal-app/personal-app-experience";
import { isClerkEnabled } from "@/lib/clerk";

export default async function PersonalAppPage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();
    if (!userId) {
      redirect("/personal-app/sign-in");
    }

    return <PersonalAppExperience userId={userId} />;
  }

  return <PersonalAppExperience userId="canopy_demo_user" />;
}
