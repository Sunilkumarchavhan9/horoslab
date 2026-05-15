export function CompanyBrainThesisSection() {
  return (
    <section className="border-b border-[#c9d8ee] bg-[#f8fbff] px-5 py-8 lg:px-7">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-[#356acc]">COMPANY BRAIN THESIS</p>
          <h2 className="mt-2 max-w-[780px] text-3xl font-semibold leading-[1.05] tracking-[-0.04em] text-slate-900 md:text-4xl">
            Models are ready. Company knowledge is the bottleneck.
          </h2>
          <p className="mt-4 max-w-[780px] text-[16px] leading-[1.55] text-[#516882]">
            MemoryOS turns scattered company knowledge into a living, executable skills layer for agents.
            We ingest context from real systems, structure it as decisions and policies, and make it safe to execute with governance.
          </p>
        </div>

        <div className="border border-[#c9d8ee] bg-white p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a7f9a]">What MemoryOS Is</p>
          <ul className="mt-3 space-y-2 text-[14px] text-[#2f4968]">
            <li>- Living map of incidents, decisions, workflows, and constraints</li>
            <li>- Evidence-backed skills generated from real company signals</li>
            <li>- Policy-gated execution with approvals and audit trail</li>
          </ul>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.18em] text-[#6a7f9a]">What It Is Not</p>
          <ul className="mt-3 space-y-2 text-[14px] text-[#2f4968]">
            <li>- Not a simple document chatbot</li>
            <li>- Not keyword search over static files</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

