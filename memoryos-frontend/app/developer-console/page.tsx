import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isClerkEnabled } from "@/lib/clerk";

export default async function DeveloperConsolePage() {
  if (isClerkEnabled()) {
    const { userId } = await auth();

    if (!userId) {
      redirect("/developer-console/sign-in");
    }
  }

  return (
    <main className="min-h-screen bg-white px-8 py-16">
      <div className="mx-auto max-w-4xl border border-[#c9d8ee] p-10">
        <p className="font-mono text-[12px] tracking-[0.2em] text-[#2166f3]">DEVELOPER CONSOLE</p>
        <h1 className="mt-4 text-[40px] font-semibold tracking-[-0.04em] text-slate-900">
          Developer console shell
        </h1>
        <p className="mt-4 max-w-2xl text-[18px] leading-8 text-[#5d6f86]">
          Clerk auth is wired. This route is ready to become the API keys, usage, billing, and
          workspace control surface for MemoryOS.
        </p>
      </div>
    </main>
  );
}
