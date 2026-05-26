import dynamic from "next/dynamic";
import Link from "next/link";

const OrganizationListPanel = dynamic(
  () =>
    import("./organization-list-panel").then((mod) => ({
      default: mod.OrganizationListPanel,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="py-8 text-center text-sm text-[#9ca5b0]">Loading organization picker…</p>
    ),
  },
);

export default function ChooseOrganizationPage() {
  return (
    <main className="min-h-screen bg-[#0a0b0d] px-6 py-10 text-white sm:px-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Choose your organization</h1>
        <p className="mt-3 text-sm text-[#9ca5b0] sm:text-base">
          Complete sign-in by selecting an organization, or create one and continue to the developer console.
        </p>

        <div className="mt-8 rounded-xl border border-[#2a2a2a] bg-[#0f1114] p-4 sm:p-6">
          <OrganizationListPanel />
        </div>

        <div className="mt-6">
          <Link href="/developer-console/sign-in" className="text-sm text-[#c9defd] underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
