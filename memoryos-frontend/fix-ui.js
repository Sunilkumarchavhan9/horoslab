const fs = require('fs');
const file = 'components/mission-control/mission-control-workspace.tsx';
let content = fs.readFileSync(file, 'utf8');

const prefix = `<span className="text-black/60">Search AI Gateways</span>`;
const suffix = `) : null}`;

const prefixIdx = content.indexOf(prefix);
const suffixIdx = content.indexOf(suffix, prefixIdx);

const originalCode = `
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 hover:bg-black/5 cursor-pointer text-sm transition-colors group">
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/55 shrink-0"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-black">ais:</span>
                        <span className="text-black/30">—</span>
                        <span className="text-black/60">Search AI Search instances</span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 hover:bg-black/5 cursor-pointer text-sm transition-colors group">
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/55 shrink-0"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-black">containers:</span>
                        <span className="text-black/30">—</span>
                        <span className="text-black/60">Search Container applications</span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center justify-between px-4 py-2 hover:bg-black/5 cursor-pointer text-sm transition-colors group">
                    <div className="flex items-center gap-3">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-black/55 shrink-0"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-black">d1:</span>
                        <span className="text-black/30">—</span>
                        <span className="text-black/60">Search D1 databases</span>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="bg-black/[0.02] border-t border-black/5 px-4 py-2.5 flex items-center gap-6 text-[11px] text-black/40 font-medium">
                  <div className="flex items-center gap-1.5">
                    <kbd className="inline-flex h-4 items-center justify-center rounded-[3px] border border-black/10 bg-white px-1 shadow-sm leading-none pt-[1px]">↑</kbd>
                    <kbd className="inline-flex h-4 items-center justify-center rounded-[3px] border border-black/10 bg-white px-1 shadow-sm leading-none pt-[1px]">↓</kbd>
                    <span>to navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="inline-flex h-4 items-center justify-center rounded-[3px] border border-black/10 bg-white px-1 shadow-sm leading-none pt-[1px]">↵</kbd>
                    <span>to select</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {activeSection === "home" ? (
            <AccountHomeDashboard />
          ) : phase === "idle" ? (
            <div ref={(node) => { sidebarSectionRefs.current.home = node }} className="pt-2">
              <h1 className="text-[32px] font-bold text-center text-black tracking-tight mb-8">
                Time to build something great.
              </h1>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="col-span-1 md:col-span-1 flex" onClick={connectGithub}>
                  <div className="flex items-center justify-between w-full p-2 pr-5 bg-white hover:bg-black/[0.03] border border-black/10 rounded-2xl cursor-pointer transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center size-11 bg-white border border-black/10 rounded-[12px] shadow-sm shrink-0">
                        <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-black">
                          <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                          <path d="M9 18c-4.51 2-5-2-7-2" />
                        </svg>
                        <div className="absolute -top-1 -right-1 size-2.5 bg-white rounded-full border-2 border-white" />
                      </div>
                      <span className="text-[15px] font-medium text-[#0a2540]">
                        {connectStatus === "connecting" ? "Connecting..." : "Connect GitHub"}
                      </span>
                    </div>
                    {connectStatus === "connecting" ? (
                      <Loader2 className="size-4 animate-spin text-black/40" />
                    ) : (
                      <ArrowRight className="size-4 text-black/70" />
                    )}
                  </div>
                  {connectError && <p className="text-xs text-red-500 text-center w-full mt-2 absolute -bottom-6">{connectError}</p>}
                </div>
                
                <div className="col-span-2 border border-black/10 rounded-lg p-5 bg-white flex flex-col justify-center items-center text-black/40 border-dashed">
                  <p className="text-sm font-medium">
                    {githubNeedsReconnect
                      ? "GitHub needs attention before repositories can load."
                      : githubLoadingRepos
                        ? "GitHub is connected. Loading repositories..."
                        : "Connect a repository to view recent missions."}
                  </p>
                </div>
              </div>
            </div>
          ) : phase === "connected" && (
            <div ref={(node) => { sidebarSectionRefs.current.verification = node }} className="pt-2">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold tracking-tight">Verification</h2>
                <Button 
                  size="sm" 
                  className="bg-[#0f52ff] hover:bg-[#0b43d6] text-white font-medium rounded-md px-5 h-9 shadow-[0_2px_0_#0b43d6,inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-none active:translate-y-[2px] transition-all border-none"
                  onClick={startVerification} 
                  disabled={launchStatus === "launching" || !selectedPr}
                >
                  {launchStatus === "launching" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Start Verification
                </Button>
              </div>

              {githubNeedsReconnect ? (
                <div className="mb-8 rounded-xl border border-[#ecd58a] bg-[#fff7e1] px-5 py-4 text-sm text-black flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="font-semibold">GitHub connection needs attention</div>
                    <div className="text-black/70">
                      The GitHub connector reported an error. Reconnect GitHub to restore repository and PR access.
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-[#d4af37] hover:bg-[#c39f2e] text-black font-medium rounded-md px-5 h-9 border-none"
                    onClick={connectGithub}
                    disabled={connectStatus === "connecting"}
                  >
                    {connectStatus === "connecting" ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                    Reconnect GitHub
                  </Button>
                </div>
              ) : githubConnected && liveRepos.length === 0 ? (
                <div className="mb-8 rounded-xl border border-black/10 bg-black/[0.02] px-5 py-4 text-sm text-black/70">
                  GitHub is connected, but no repositories have been synced into the workspace yet.
                  Open Settings → Connections and refresh GitHub if this does not update in a few moments.
                </div>
`;

if (prefixIdx !== -1 && suffixIdx !== -1) {
  const newContent = content.substring(0, prefixIdx + prefix.length) + originalCode + content.substring(suffixIdx);
  fs.writeFileSync(file, newContent);
  console.log("Fixed successfully via splice!");
} else {
  console.log("Indices not found", prefixIdx, suffixIdx);
}
