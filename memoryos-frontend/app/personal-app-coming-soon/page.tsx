export default function PersonalAppComingSoonPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="mx-auto max-w-2xl rounded-md border border-[#c9d8ee] bg-[#f8fbff] p-8 md:p-10">
        <p className="font-mono text-[12px] tracking-[0.2em] text-[#4a6283]">PERSONAL APP</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-slate-900 md:text-4xl">
          Page Coming Soon
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-[#5d6f87]">
          We are actively building the Personal App experience. Please check back soon.
        </p>
        <div className="mt-8">
          <a
            href="/"
            className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-[14px] font-medium text-[#F0EFE2] transition hover:bg-blue-700"
          >
            Back To Home
          </a>
        </div>
      </div>
    </main>
  );
}
