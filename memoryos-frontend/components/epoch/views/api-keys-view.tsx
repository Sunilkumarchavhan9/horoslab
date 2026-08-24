"use client";

import React, { useState } from "react";
import {
  Key,
  Plus,
  Check,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ApiKeyItem {
  id: string;
  name: string;
  prefix: string;
  maskedKey: string;
  fullSecretKey?: string;
  scope: "workspace" | "deployment";
  deploymentEndpoint?: string;
  expiresIn?: string;
  createdAt: string;
  lastUsedAt: string;
}

interface ApiKeysViewProps {
  dark?: boolean;
  onNavigateToPipelines?: () => void;
  onNavigateToModelApis?: () => void;
}

export function ApiKeysView({
  dark = true,
  onNavigateToPipelines,
  onNavigateToModelApis,
}: ApiKeysViewProps) {
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [revealedKeyIds, setRevealedKeyIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ name: string; secret: string } | null>(null);

  // Form State matching RunInfra Modal 1:1
  const [keyName, setKeyName] = useState("Key 1");
  const [scopeDeploymentOpen, setScopeDeploymentOpen] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState("");
  const [setExpirationDate, setSetExpirationDate] = useState(false);
  const [expiresOption, setExpiresOption] = useState("90 days");
  const [expiresDropdownOpen, setExpiresDropdownOpen] = useState(false);

  const [keys, setKeys] = useState<ApiKeyItem[]>([]);

  const toggleReveal = (id: string) => {
    setRevealedKeyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const handleDeleteKey = (id: string) => {
    if (confirm("Are you sure you want to revoke this API key? This action is immediate and cannot be undone.")) {
      setKeys(keys.filter((k) => k.id !== id));
    }
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = keyName.trim() || `Key ${keys.length + 1}`;
    const randomSecret = `ep_live_${Math.random().toString(36).slice(2, 8)}${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 8)}`;
    const prefix = randomSecret.slice(0, 14);
    const masked = `${prefix}••••••••••••••••${randomSecret.slice(-4)}`;

    const newKeyItem: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: finalName,
      prefix,
      maskedKey: masked,
      fullSecretKey: randomSecret,
      scope: scopeDeploymentOpen && selectedEndpoint ? "deployment" : "workspace",
      deploymentEndpoint: scopeDeploymentOpen ? selectedEndpoint : undefined,
      expiresIn: setExpirationDate ? expiresOption : "Never",
      createdAt: "Just now",
      lastUsedAt: "Never",
    };

    setKeys([newKeyItem, ...keys]);
    setNewlyCreatedKey({ name: finalName, secret: randomSecret });
    setCreateModalOpen(false);
    setKeyName("Key 1");
    setScopeDeploymentOpen(false);
    setSetExpirationDate(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto pb-20 font-sans text-xs text-left">
      {/* 1:1 RunInfra Top Header */}
      <div className="mb-8">
        <h1 className="text-xl font-bold font-mono tracking-tight flex items-center gap-1.5 text-white">
          <span>API</span>
          <span className="bg-[#75bf00] text-black px-2 py-0.5 rounded-xs font-bold inline-block font-sans text-base">
            Keys
          </span>
        </h1>
        <p className="mt-1.5 text-xs text-[#889084] leading-relaxed">
          Authenticate inference requests against your deployed pipelines, and manage the terminals signed in with the RunInfra CLI.
        </p>
      </div>

      {/* One-Time Reveal Banner if Just Created */}
      {newlyCreatedKey && (
        <div className="mb-8 p-4 border border-[#86dc00]/40 bg-[#162010] rounded-xs font-mono text-xs space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#86dc00] font-bold">
              <ShieldCheck size={14} />
              <span>API key created: {newlyCreatedKey.name}</span>
            </div>
            <button
              type="button"
              onClick={() => setNewlyCreatedKey(null)}
              className="text-[#788274] hover:text-white cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
          <p className="text-[11px] text-[#a0a89d]">
            Please copy this key now. <strong className="text-white">It will not be displayed again.</strong>
          </p>
          <div className="flex items-center gap-2 bg-[#0e0e0e] border border-dashed border-[#333] px-3 py-2 rounded-xs">
            <code className="text-[#86dc00] font-bold text-xs select-all flex-1 truncate">
              {newlyCreatedKey.secret}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(newlyCreatedKey.secret, "new-secret")}
              className="flex items-center gap-1 bg-[#86dc00] hover:bg-[#99f200] text-black font-bold px-2.5 py-1 rounded-xs cursor-pointer text-[11px] transition-colors"
            >
              {copiedKeyId === "new-secret" ? (
                <>
                  <Check size={12} />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} />
                  <span>Copy Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: INFERENCE KEYS (Exact 1:1 Pixel Match) */}
      <div className="border-t border-dashed border-[#282828] pt-6 pb-12 space-y-5">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-xs border border-[#333] bg-[#141414] flex items-center justify-center text-[#888] shrink-0">
              <Key size={11} />
            </div>
            <div>
              <div className="font-bold text-white text-xs tracking-tight">Inference keys</div>
              <div className="text-[11px] text-[#788274]">
                {keys.length} {keys.length === 1 ? "key issued." : "keys issued."}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 border border-[#383838] bg-[#141414] hover:bg-[#1f1f1f] text-white px-3 py-1.5 text-xs font-mono rounded-xs transition-colors cursor-pointer"
          >
            <Plus size={11} />
            <span>Create key</span>
          </button>
        </div>

        {/* Content Box */}
        {keys.length === 0 ? (
          /* Empty Box Container */
          <div className="w-full border border-dashed border-[#282828] rounded-xs py-14 px-6 text-center flex flex-col items-center justify-center space-y-2.5 bg-transparent">
            <div className="w-7 h-7 rounded-xs border border-dashed border-[#383838] bg-[#141414] flex items-center justify-center text-[#788274]">
              <Key size={12} />
            </div>
            <div className="space-y-1">
              <div className="font-bold text-white text-xs">No API keys yet</div>
              <p className="text-xs text-[#788274] leading-relaxed max-w-sm mx-auto">
                Issue a key for RunInfra native and compatible inference requests.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 border border-[#383838] bg-[#141414] hover:bg-[#1f1f1f] text-white px-3.5 py-1.5 text-xs font-mono rounded-xs transition-colors cursor-pointer mt-2"
            >
              <Plus size={11} />
              <span>Create your first key</span>
            </button>
          </div>
        ) : (
          /* Keys List */
          <div className="border border-dashed border-[#282828] bg-[#141414] rounded-xs divide-y divide-dashed divide-[#282828] font-mono text-xs">
            {keys.map((k) => {
              const isRevealed = revealedKeyIds.has(k.id);
              const displaySecret = isRevealed && k.fullSecretKey ? k.fullSecretKey : k.maskedKey;

              return (
                <div key={k.id} className="p-3.5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#181818] transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-xs border border-[#3a4a25] bg-[#162010] flex items-center justify-center text-[#86dc00]">
                        <Key size={11} />
                      </div>
                      <span className="font-bold text-white text-xs">{k.name}</span>
                      <span className="text-[10px] text-[#788274] bg-[#202020] px-1.5 py-0.2 rounded-xs">
                        {k.scope === "workspace" ? "Workspace Key" : "Deployment Scoped"}
                      </span>
                      {k.expiresIn && k.expiresIn !== "Never" && (
                        <span className="text-[10px] text-[#f59e0b] bg-[#2a200f] px-1.5 py-0.2 rounded-xs">
                          Expires in {k.expiresIn}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pl-7.5">
                      <code className="text-[#a0a89d] text-[11px] select-all font-mono">
                        {displaySecret}
                      </code>
                      <button
                        type="button"
                        onClick={() => toggleReveal(k.id)}
                        className="text-[#788274] hover:text-white p-0.5 transition-colors cursor-pointer"
                        title={isRevealed ? "Hide Secret" : "Reveal Secret"}
                      >
                        {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(k.fullSecretKey || k.prefix, k.id)}
                        className="text-[#788274] hover:text-white p-0.5 transition-colors cursor-pointer"
                        title="Copy Key"
                      >
                        {copiedKeyId === k.id ? (
                          <Check size={11} className="text-[#86dc00]" />
                        ) : (
                          <Copy size={11} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[#788274]">
                    <div className="text-right">
                      <div className="text-white">Created {k.createdAt}</div>
                      <div className="text-[10px] text-[#555]">Last used {k.lastUsedAt}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteKey(k.id)}
                      className="text-[#788274] hover:text-[#ef4444] p-1.5 rounded transition-colors cursor-pointer"
                      title="Revoke Key"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: TERMINAL SESSIONS (Exact 1:1 Pixel Match) */}
      <div className="border-t border-dashed border-[#282828] pt-6 space-y-5">
        {/* Header Row */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-xs border border-[#333] bg-[#141414] flex items-center justify-center font-mono text-[10px] text-[#888] shrink-0">
            &gt;_
          </div>
          <div>
            <div className="font-bold text-white text-xs tracking-tight">Terminal sessions</div>
            <div className="text-[11px] text-[#788274]">
              Machines signed in with the RunInfra CLI appear here.
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="w-full border border-dashed border-[#282828] rounded-xs py-14 px-6 text-center flex flex-col items-center justify-center space-y-2 bg-transparent">
          <div className="w-7 h-7 rounded-xs border border-dashed border-[#383838] bg-[#141414] flex items-center justify-center font-mono text-xs text-[#788274]">
            &gt;_
          </div>
          <div className="space-y-1">
            <div className="font-bold text-white text-xs">No terminals connected</div>
            <p className="text-xs text-[#788274] leading-relaxed max-w-md mx-auto">
              Run <code className="font-mono px-1.5 py-0.5 bg-[#141414] border border-[#333] text-white rounded-xs text-[11px]">runinfra login</code> on a machine and approve the browser prompt. The session it creates is listed here and can be revoked at any time.
            </p>
          </div>
        </div>
      </div>

      {/* 1:1 REPLICA OF RUNINFRA "CREATE API KEY" MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-100 backdrop-blur-xs">
          <form
            onSubmit={handleCreateKey}
            className="w-full max-w-lg border border-[#282828] bg-[#141414] rounded-sm p-6 text-xs space-y-4 shadow-2xl text-left"
          >
            {/* Modal Header */}
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-white tracking-tight">Create API key</h2>
              <p className="text-xs text-[#90988c] leading-relaxed">
                One workspace key for every eligible hosted model. Create it now, and name it only if you want to.
              </p>
            </div>

            {/* Top Workspace Key Green Info Box */}
            <div className="p-3 bg-[#181a16] border border-[#2b3a1a] rounded-sm flex items-start gap-3">
              <div className="w-6 h-6 rounded-xs border border-[#486326] bg-[#1d2714] flex items-center justify-center text-[#86dc00] shrink-0 mt-0.5">
                <Key size={13} className="text-[#86dc00]" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs">Workspace key</span>
                  <span className="text-[11px] text-[#788274]">No deployment required</span>
                </div>
                <p className="text-[11px] text-[#90988c]">
                  Works with every eligible model on Hosted inference.
                </p>
              </div>
            </div>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-[#788274] tracking-wider uppercase block">
                NAME
              </label>
              <p className="text-[11px] text-[#788274]">Optional. Used for audits and rotation.</p>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key 1"
                className="w-full bg-[#181818] border border-[#333] focus:border-[#75bf00] rounded-xs px-3 py-2 text-white outline-none text-xs font-mono transition-colors"
              />
            </div>

            {/* Collapsible: Scope to a deployment instead */}
            <div className="border-t border-[#242424] pt-3 space-y-2">
              <button
                type="button"
                onClick={() => setScopeDeploymentOpen(!scopeDeploymentOpen)}
                className="flex items-center gap-1 text-[11px] text-[#889084] hover:text-white transition-colors cursor-pointer"
              >
                {scopeDeploymentOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                <span>Scope to a deployment instead</span>
              </button>

              {scopeDeploymentOpen && (
                <div className="space-y-2 pl-4 border-l border-[#282828] mt-2 animate-in fade-in duration-100">
                  <div>
                    <label className="text-[10px] font-mono text-[#788274] tracking-wider uppercase block">
                      DEPLOYMENT ENDPOINT
                    </label>
                    <p className="text-[11px] text-[#788274]">Restricts this key to one verified endpoint.</p>
                  </div>
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="w-full bg-[#181818] border border-[#333] focus:border-[#75bf00] rounded-xs px-3 py-2 text-[#a0a89d] outline-none text-xs font-mono"
                  >
                    <option value="">Select a verified deployment endpoint...</option>
                    <option value="prod-fast-rag-v2">prod-fast-rag-v2 (DeepSeek V4 Flash)</option>
                    <option value="code-generation-ensemble">code-generation-ensemble (90/10 Split)</option>
                    <option value="reasoning-critic-chain">reasoning-critic-chain (Nemotron 3.5)</option>
                  </select>
                  <p className="text-[10px] text-[#666]">
                    No verified deployment endpoints are available. Close this section to create a workspace key.
                  </p>
                </div>
              )}
            </div>

            {/* Checkbox: Set an expiration date */}
            <div className="border-t border-[#242424] pt-3 space-y-2.5">
              <label className="flex items-center gap-2 text-xs text-[#a0a89d] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={setExpirationDate}
                  onChange={(e) => setSetExpirationDate(e.target.checked)}
                  className="accent-[#75bf00] rounded w-3.5 h-3.5 cursor-pointer"
                />
                <Clock size={12} className="text-[#788274]" />
                <span className="text-[#c5ccc0]">Set an expiration date</span>
              </label>

              {/* Expiration Dropdown when checked matching Screenshot 2 */}
              {setExpirationDate && (
                <div className="space-y-1.5 pl-6 animate-in fade-in duration-100 relative">
                  <label className="text-[10px] font-mono text-[#788274] tracking-wider uppercase block">
                    EXPIRES
                  </label>
                  <p className="text-[11px] text-[#788274]">The key stops working after this window.</p>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setExpiresDropdownOpen(!expiresDropdownOpen)}
                      className="w-full bg-[#181818] border border-[#333] hover:border-[#555] rounded-xs px-3 py-2 text-white text-xs font-mono flex items-center justify-between cursor-pointer"
                    >
                      <span className="font-bold">{expiresOption}</span>
                      {expiresDropdownOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>

                    {expiresDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-[#181818] border border-[#333] rounded-xs shadow-2xl z-30 font-mono text-xs divide-y divide-[#242424] overflow-hidden">
                        {["30 days", "60 days", "90 days", "1 year"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setExpiresOption(opt);
                              setExpiresDropdownOpen(false);
                            }}
                            className={cn(
                              "w-full px-3 py-2 text-left flex items-center justify-between transition-colors cursor-pointer",
                              expiresOption === opt
                                ? "bg-[#252525] text-white font-bold"
                                : "text-[#a0a89d] hover:bg-[#202020] hover:text-white"
                            )}
                          >
                            <span>{opt}</span>
                            {expiresOption === opt && <Check size={13} className="text-[#86dc00]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Buttons */}
            <div className="flex justify-end gap-2.5 pt-4">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 border border-[#383838] bg-[#1e1e1e] hover:bg-[#282828] text-white font-medium rounded-xs cursor-pointer text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 bg-[#252525] hover:bg-[#303030] border border-[#3a3a3a] hover:border-[#75bf00] text-white font-medium px-4 py-2 rounded-xs cursor-pointer text-xs transition-colors"
              >
                <Key size={12} />
                <span>Create key</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
