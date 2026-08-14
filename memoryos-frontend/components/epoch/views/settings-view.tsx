"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Bell,
  CreditCard,
  BarChart3,
  Key,
  Cloud,
  Shield,
  Trash2,
  Check,
  ExternalLink,
  Lock,
  Server,
  Layers,
  Layout,
  PanelLeft,
  Box,
  Plus,
  Terminal,
  Clock,
  Sparkles,
  TrendingUp,
  Inbox,
  Zap,
} from "lucide-react";
import { EpochBadge } from "../ui/epoch-badge";
import { EpochButton } from "../ui/epoch-button";
import { cn } from "@/lib/utils";

interface SettingsViewProps {
  initialTab?: "workspace" | "notifications" | "billing" | "cost" | "keys" | "clouds" | "security";
  onBack?: () => void;
  balanceUsd?: number;
  displayLayout?: "top_bar" | "sidebar";
  onDisplayNavChange?: (layout: "top_bar" | "sidebar") => void;
  dark?: boolean;
}

export function SettingsView({
  initialTab = "workspace",
  onBack,
  balanceUsd = 10.0,
  displayLayout = "top_bar",
  onDisplayNavChange,
  dark = true,
}: SettingsViewProps) {
  const [activeTab, setActiveTab] = useState<
    "workspace" | "notifications" | "billing" | "cost" | "keys" | "clouds" | "security"
  >(initialTab);

  const [workspaceName, setWorkspaceName] = useState("Personal");
  const [displayNav, setDisplayNav] = useState<"top_bar" | "sidebar">(displayLayout);
  const [costPeriod, setCostPeriod] = useState<"7D" | "30D" | "90D">("30D");

  const [createdKeys, setCreatedKeys] = useState<
    Array<{ id: string; name: string; key: string; created: string }>
  >([]);
  const [newKeyModalOpen, setNewKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  const [runpodKey, setRunpodKey] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [hfConnected, setHfConnected] = useState(true);
  const [runpodConnected, setRunpodConnected] = useState(false);

  const tabs = [
    { id: "workspace", label: "Workspace", icon: <Building2 size={13} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={13} /> },
    { id: "billing", label: "Billing", icon: <CreditCard size={13} /> },
    { id: "cost", label: "Cost", icon: <BarChart3 size={13} /> },
    { id: "keys", label: "API Keys", icon: <Key size={13} /> },
    { id: "clouds", label: "Clouds", icon: <Cloud size={13} /> },
    { id: "security", label: "Security", icon: <Shield size={13} /> },
  ];

  function handleCreateKey() {
    if (!newKeyName.trim()) return;
    const newK = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      key: `ep_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`,
      created: "Just now",
    };
    setCreatedKeys([newK, ...createdKeys]);
    setNewKeyName("");
    setNewKeyModalOpen(false);
  }

  return (
    <div className="space-y-6">
      {/* Subnav row */}
      <div className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-b pb-3",
        dark ? "border-[#2e2e2e]" : "border-[#d8ddd3]"
      )}>
        <div className="flex items-center gap-4 flex-wrap">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                dark ? "text-[#889084] hover:text-white" : "text-[#525a4d] hover:text-[#171a17]"
              )}
            >
              <ArrowLeft size={13} />
              <span>Back</span>
            </button>
          )}

          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 transition-colors relative",
                  activeTab === tab.id
                    ? dark ? "text-white font-semibold" : "text-[#171a17] font-semibold"
                    : dark ? "text-[#889084] hover:text-white" : "text-[#6b7367] hover:text-[#171a17]"
                )}
              >
                <span className={activeTab === tab.id ? "text-[#75bf00]" : "text-current"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#75bf00]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TAB: Workspace */}
      {activeTab === "workspace" && (
        <div className="space-y-6 max-w-[840px]">
          <div>
            <h1 className={cn("text-2xl font-semibold", dark ? "text-white" : "text-[#171a17]")}>
              <span className="bg-[#75bf00] px-2 py-0.5 text-black inline-block font-medium rounded-xs">
                Workspace
              </span>
            </h1>
          </div>

          <div className={cn(
            "divide-y divide-dashed border-t border-dashed",
            dark ? "divide-[#282828] border-[#282828]" : "divide-[#d8ddd3] border-[#d8ddd3]"
          )}>
            {/* Workspace Name */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 flex items-center gap-2 text-xs font-semibold", dark ? "text-white" : "text-[#171a17]")}>
                <span className="font-mono text-sm">T</span>
                <span>Workspace Name</span>
              </div>
              <div className="md:col-span-8 flex items-center gap-2">
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className={cn(
                    "w-full max-w-sm border px-3 py-1.5 text-xs font-mono outline-none rounded-xs",
                    dark ? "border-[#383838] bg-[#202020] text-white focus:border-[#75bf00]" : "border-[#c9cec4] bg-white text-[#171a17] focus:border-[#75bf00]"
                  )}
                />
                <button
                  type="button"
                  className={cn(
                    "border px-3 py-1.5 text-xs font-medium rounded-xs transition-colors",
                    dark ? "border-[#383838] bg-[#252525] text-white hover:bg-[#303030]" : "border-[#c9cec4] bg-[#f5f7f3] text-[#2a3028] hover:border-[#171a17]"
                  )}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#889084]" : "text-[#687063]")}>
                <div className={cn("font-semibold flex items-center gap-1.5", dark ? "text-white" : "text-[#171a17]")}>
                  <span>ⓘ</span>
                  <span>Details</span>
                </div>
                <p>Read-only workspace metadata.</p>
              </div>
              <div className="md:col-span-8 space-y-3 font-mono text-xs">
                <div className={cn(
                  "flex items-center justify-between border p-2.5 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#788274]")}>Slug</span>
                  <span className={dark ? "text-white" : "text-[#171a17]"}>personal-68198f3db28e4ed5a2b179c96c8c505e</span>
                </div>
                <div className={cn(
                  "flex items-center justify-between border p-2.5 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#788274]")}>Type</span>
                  <span className={cn("flex items-center gap-1", dark ? "text-white" : "text-[#171a17]")}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                    <span>Personal</span>
                  </span>
                </div>
                <div className={cn(
                  "flex items-center justify-between border p-2.5 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#788274]")}>Role</span>
                  <span className={dark ? "text-white" : "text-[#171a17]"}>Owner</span>
                </div>
              </div>
            </div>

            {/* Display Navigation Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#889084]" : "text-[#687063]")}>
                <div className={cn("font-semibold flex items-center gap-1.5", dark ? "text-white" : "text-[#171a17]")}>
                  <Layout size={14} />
                  <span>Display</span>
                </div>
                <p>Choose where the dashboard navigation lives. Personal preference, stored on this device.</p>
              </div>
              <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDisplayNav("top_bar");
                    onDisplayNavChange?.("top_bar");
                  }}
                  className={cn(
                    "flex items-start gap-3 border p-3 text-left transition-all rounded-xs",
                    displayNav === "top_bar"
                      ? dark
                        ? "border-[#75bf00] bg-[#1a2416] ring-1 ring-[#75bf00]"
                        : "border-[#75bf00] bg-[#f9fdf5] ring-1 ring-[#75bf00]"
                      : dark
                      ? "border-[#2e2e2e] bg-[#202020] hover:border-[#444]"
                      : "border-[#d8ddd3] bg-white hover:border-[#a8b0a2]"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center border rounded-xs",
                    displayNav === "top_bar"
                      ? "border-[#75bf00] bg-transparent text-[#75bf00]"
                      : dark
                      ? "border-[#383838] bg-[#1a1a1a] text-[#888]"
                      : "border-[#d8ddd3] bg-white text-[#687063]"
                  )}>
                    <span className={cn("h-2 w-2 rounded-full", displayNav === "top_bar" ? "bg-[#75bf00]" : "bg-transparent")} />
                  </div>
                  <div>
                    <div className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>Top bar</div>
                    <div className={cn("text-[11px] mt-0.5", dark ? "text-[#889084]" : "text-[#687063]")}>
                      Horizontal navbar with tab strip below.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDisplayNav("sidebar");
                    onDisplayNavChange?.("sidebar");
                  }}
                  className={cn(
                    "flex items-start gap-3 border p-3 text-left transition-all rounded-xs",
                    displayNav === "sidebar"
                      ? dark
                        ? "border-[#75bf00] bg-[#1a2416] ring-1 ring-[#75bf00]"
                        : "border-[#75bf00] bg-[#f9fdf5] ring-1 ring-[#75bf00]"
                      : dark
                      ? "border-[#2e2e2e] bg-[#202020] hover:border-[#444]"
                      : "border-[#d8ddd3] bg-white hover:border-[#a8b0a2]"
                  )}
                >
                  <div className={cn(
                    "flex h-6 w-6 items-center justify-center border rounded-xs",
                    displayNav === "sidebar"
                      ? "border-[#75bf00] bg-transparent text-[#75bf00]"
                      : dark
                      ? "border-[#383838] bg-[#1a1a1a] text-[#888]"
                      : "border-[#d8ddd3] bg-white text-[#687063]"
                  )}>
                    <PanelLeft size={13} />
                  </div>
                  <div>
                    <div className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>Sidebar</div>
                    <div className={cn("text-[11px] mt-0.5", dark ? "text-[#889084]" : "text-[#687063]")}>
                      Vertical rail on the left with recent pipelines.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Danger zone */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#f87171]" : "text-[#b91c1c]")}>
                <div className="font-semibold flex items-center gap-1.5">
                  <Trash2 size={13} />
                  <span>Danger zone</span>
                </div>
                <p className={dark ? "text-[#fca5a5]/80" : "text-[#991b1b]"}>Permanently delete your account, workspace, and all data.</p>
              </div>
              <div className={cn(
                "md:col-span-8 flex items-center justify-between border p-3 text-xs rounded-xs",
                dark ? "border-[#7f1d1d]/50 bg-[#201010]" : "border-[#fca5a5] bg-[#fffbfb]"
              )}>
                <div>
                  <div className={cn("font-semibold", dark ? "text-[#fca5a5]" : "text-[#991b1b]")}>Delete account</div>
                  <div className={cn("text-[11px]", dark ? "text-[#f87171]/70" : "text-[#7f1d1d]")}>
                    Any active subscription is canceled immediately and your remaining balance is forfeited. This cannot be undone.
                  </div>
                </div>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1 border px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors",
                    dark ? "border-[#7f1d1d] bg-[#331414] text-[#fca5a5] hover:bg-[#441a1a]" : "border-[#fca5a5] bg-white text-[#b91c1c] hover:bg-[#fef2f2]"
                  )}
                >
                  <Trash2 size={12} />
                  <span>Delete account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: API Keys */}
      {activeTab === "keys" && (
        <div className="space-y-6 max-w-[840px]">
          <div>
            <h1 className={cn("text-2xl font-semibold", dark ? "text-white" : "text-[#171a17]")}>
              API{" "}
              <span className="bg-[#75bf00] px-2 py-0.5 text-black inline-block font-medium rounded-xs">
                Keys
              </span>
            </h1>
            <p className={cn("mt-1 text-xs", dark ? "text-[#889084]" : "text-[#687063]")}>
              Authenticate inference requests against your deployed pipelines, and manage the terminals signed in with the RunInfra CLI.
            </p>
          </div>

          <div className={cn(
            "divide-y divide-dashed border-t border-dashed",
            dark ? "divide-[#282828] border-[#282828]" : "divide-[#d8ddd3] border-[#d8ddd3]"
          )}>
            {/* Active Keys Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#889084]" : "text-[#687063]")}>
                <div className={cn("font-semibold flex items-center gap-1.5", dark ? "text-white" : "text-[#171a17]")}>
                  <Key size={13} />
                  <span>Active keys</span>
                </div>
                <p>{createdKeys.length} keys issued.</p>
              </div>

              <div className="md:col-span-8 space-y-3">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setNewKeyModalOpen(true)}
                    className={cn(
                      "flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium rounded-xs transition-colors",
                      dark ? "border-[#383838] bg-[#202020] text-white hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white text-[#171a17] hover:border-[#171a17]"
                    )}
                  >
                    <Plus size={12} />
                    <span>Create key</span>
                  </button>
                </div>

                {createdKeys.length > 0 ? (
                  <div className={cn(
                    "border divide-y rounded-xs",
                    dark ? "border-[#2e2e2e] bg-[#202020] divide-[#282828]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
                  )}>
                    {createdKeys.map((k) => (
                      <div key={k.id} className="p-3 text-xs flex items-center justify-between">
                        <div>
                          <div className={cn("font-semibold", dark ? "text-white" : "text-[#171a17]")}>{k.name}</div>
                          <div className="font-mono text-[11px] text-[#788274]">{k.key}</div>
                        </div>
                        <span className="text-[10px] text-[#888] font-mono">{k.created}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={cn(
                    "border border-dashed p-8 text-center space-y-3 rounded-xs",
                    dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#c9cec4] bg-[#fafbfa]"
                  )}>
                    <div className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center border rounded-xs",
                      dark ? "border-[#383838] bg-[#1a1a1a] text-[#888]" : "border-[#d8ddd3] bg-white text-[#788274]"
                    )}>
                      <Key size={16} />
                    </div>
                    <div className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>No API keys yet</div>
                    <p className={cn("text-xs", dark ? "text-[#889084]" : "text-[#687063]")}>
                      Issue a key for RunInfra native and compatible inference requests.
                    </p>
                    <button
                      type="button"
                      onClick={() => setNewKeyModalOpen(true)}
                      className={cn(
                        "inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-medium rounded-xs transition-colors",
                        dark ? "border-[#383838] bg-[#252525] text-white hover:border-[#75bf00]" : "border-[#d8ddd3] bg-white text-[#171a17]"
                      )}
                    >
                      <Plus size={12} />
                      <span>Create your first key</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Connected Terminals Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#889084]" : "text-[#687063]")}>
                <div className={cn("font-semibold flex items-center gap-1.5 font-mono", dark ? "text-white" : "text-[#171a17]")}>
                  <span>&gt;_</span>
                  <span className="font-sans">Connected terminals</span>
                </div>
                <p>Machines signed in with the RunInfra CLI appear here.</p>
              </div>

              <div className="md:col-span-8">
                <div className={cn(
                  "border border-dashed p-8 text-center space-y-2 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#c9cec4] bg-[#fafbfa]"
                )}>
                  <div className={cn(
                    "mx-auto flex h-9 w-9 items-center justify-center border font-mono text-sm rounded-xs",
                    dark ? "border-[#383838] bg-[#1a1a1a] text-[#888]" : "border-[#d8ddd3] bg-white text-[#788274]"
                  )}>
                    &gt;_
                  </div>
                  <div className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>No terminals connected</div>
                  <p className={cn("text-xs max-w-sm mx-auto", dark ? "text-[#889084]" : "text-[#687063]")}>
                    Run <code className={cn("font-mono px-1.5 py-0.5 border rounded-xs", dark ? "border-[#383838] bg-[#1a1a1a] text-[#a3e635]" : "border-[#d8ddd3] bg-white text-[#171a17]")}>epoch login</code> on a machine and approve the browser prompt. The session it creates is listed here and can be revoked at any time.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Cost */}
      {activeTab === "cost" && (
        <div className="space-y-6 max-w-[840px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className={cn("text-2xl font-semibold", dark ? "text-white" : "text-[#171a17]")}>
                <span className="bg-[#75bf00] px-2 py-0.5 text-black inline-block font-medium rounded-xs">
                  Cost
                </span>
              </h1>
              <p className={cn("mt-1 text-xs", dark ? "text-[#889084]" : "text-[#687063]")}>
                Spend, balance, optimization compute, and credit activity
              </p>
            </div>
          </div>

          <div className={cn(
            "divide-y divide-dashed border-t border-dashed",
            dark ? "divide-[#282828] border-[#282828]" : "divide-[#d8ddd3] border-[#d8ddd3]"
          )}>
            {/* Cost Usage Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#889084]" : "text-[#687063]")}>
                <div className={cn("font-semibold flex items-center gap-1.5", dark ? "text-white" : "text-[#171a17]")}>
                  <BarChart3 size={13} />
                  <span>Cost Usage</span>
                </div>
                <p>Workspace spend, request volume, average request cost, and current day spend rate.</p>
              </div>

              <div className="md:col-span-8 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-4 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-[#788274] font-sans block">Avg cost</span>
                      <span className={cn("font-bold", dark ? "text-white" : "text-[#171a17]")}>$0.0000</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#788274] font-sans block">Today rate</span>
                      <span className={cn("font-bold", dark ? "text-white" : "text-[#171a17]")}>$0.00/hr</span>
                    </div>
                  </div>

                  <div className={cn(
                    "flex items-center border divide-x text-xs font-mono rounded-xs",
                    dark ? "border-[#383838] bg-[#202020] divide-[#2e2e2e]" : "border-[#d8ddd3] bg-white divide-[#edf0eb]"
                  )}>
                    {(["7D", "30D", "90D"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setCostPeriod(p)}
                        className={cn(
                          "px-2.5 py-1 transition-colors",
                          costPeriod === p
                            ? "bg-[#75bf00] text-black font-bold"
                            : dark
                            ? "text-[#889084] hover:text-white"
                            : "text-[#687063] hover:bg-[#f8faf6]"
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2 Charts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={cn("border rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
                    <div className={cn("flex items-center justify-between border-b px-3 py-1.5 text-xs", dark ? "border-[#282828] bg-[#1a1a1a]" : "border-[#edf0eb] bg-[#fafbfa]")}>
                      <span className={cn("font-semibold", dark ? "text-white" : "text-[#171a17]")}>Spend over time</span>
                      <span className="font-mono text-[10px] text-[#788274]">USD</span>
                    </div>
                    <div className="p-6 text-center text-xs text-[#889083] font-mono min-h-[110px] flex flex-col items-center justify-center">
                      <span className="font-bold">no usage</span>
                      <span className="text-[10px] text-[#888] mt-1">No spend in this period</span>
                    </div>
                  </div>

                  <div className={cn("border rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
                    <div className={cn("flex items-center justify-between border-b px-3 py-1.5 text-xs", dark ? "border-[#282828] bg-[#1a1a1a]" : "border-[#edf0eb] bg-[#fafbfa]")}>
                      <span className={cn("font-semibold", dark ? "text-white" : "text-[#171a17]")}>Requests over time</span>
                      <span className="font-mono text-[10px] text-[#788274]">Daily UTC</span>
                    </div>
                    <div className="p-6 text-center text-xs text-[#889083] font-mono min-h-[110px] flex flex-col items-center justify-center">
                      <span className="font-bold">no usage</span>
                      <span className="text-[10px] text-[#888] mt-1">No requests in this period</span>
                    </div>
                  </div>
                </div>

                {/* Credits Remaining Card */}
                <div className={cn(
                  "border p-4 space-y-3 rounded-xs",
                  dark ? "border-[#75bf00]/40 bg-[#162916]" : "border-[#b9de78] bg-[#fbfdf9]"
                )}>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-mono text-base font-bold", dark ? "text-[#a3e635]" : "text-[#2d5800]")}>
                      ${balanceUsd.toFixed(2)} free balance remaining
                    </span>
                  </div>
                  <p className={cn("text-xs leading-relaxed", dark ? "text-[#d1e7c5]" : "text-[#525a4d]")}>
                    Your free balance funds optimization runs, the agent, and runbooks. Every charge and refund appears in Credit Activity below.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Clouds */}
      {activeTab === "clouds" && (
        <div className="space-y-6 max-w-[840px]">
          <div>
            <h1 className={cn("text-2xl font-semibold", dark ? "text-white" : "text-[#171a17]")}>
              Connected{" "}
              <span className="bg-[#75bf00] px-2 py-0.5 text-black inline-block font-medium rounded-xs">
                clouds
              </span>
            </h1>
            <p className={cn("mt-1 text-xs", dark ? "text-[#889084]" : "text-[#687063]")}>
              Deploy to GPU clouds you own and pay for directly. Keys are encrypted and never shown in the clear.
            </p>
          </div>

          <div className="space-y-4">
            <div className={cn("border p-4 space-y-3 rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-6 w-6 items-center justify-center border rounded-xs", dark ? "border-[#383838] bg-[#1a1a1a] text-white" : "border-[#d8ddd3] bg-[#fafbfa] text-[#171a17]")}>
                    <Box size={13} />
                  </div>
                  <span className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>RunPod</span>
                  <span className={cn("border px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-xs", dark ? "border-[#383838] bg-[#1a1a1a] text-[#888]" : "border-[#d8ddd3] bg-[#fafbfa] text-[#687063]")}>
                    THIRD-PARTY CLOUD
                  </span>
                </div>
                {runpodConnected ? <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-bold px-2 py-0.5 rounded-xs">Connected</span> : null}
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] text-[#788274] block">
                  Paste a RunPod API key to deploy on your own account
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={runpodKey}
                    onChange={(e) => setRunpodKey(e.target.value)}
                    placeholder="rpa_..."
                    className={cn(
                      "w-full border px-3 py-1.5 font-mono text-xs outline-none rounded-xs",
                      dark ? "border-[#383838] bg-[#1a1a1a] text-white focus:border-[#75bf00]" : "border-[#c9cec4] bg-[#fafbfa] text-[#171a17] focus:border-[#75bf00]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => { if (runpodKey) setRunpodConnected(true); }}
                    className={cn(
                      "shrink-0 border px-3 py-1.5 text-xs rounded-xs transition-colors",
                      dark ? "border-[#383838] bg-[#252525] text-white hover:border-[#75bf00]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#2a3028] hover:border-[#171a17]"
                    )}
                  >
                    Connect RunPod
                  </button>
                </div>
              </div>
            </div>

            <div className={cn("border p-4 space-y-3 rounded-xs", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("flex h-6 w-6 items-center justify-center border rounded-xs", dark ? "border-[#383838] bg-[#1a1a1a]" : "border-[#d8ddd3] bg-[#fafbfa]")}>
                    🤗
                  </div>
                  <span className={cn("font-semibold text-xs", dark ? "text-white" : "text-[#171a17]")}>Hugging Face</span>
                  <span className={cn("border px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-xs", dark ? "border-[#75bf00]/40 bg-[#162916] text-[#a3e635]" : "border-[#b9de78] bg-[#f2fbe6] text-[#2d5800]")}>
                    ACCOUNT LINK
                  </span>
                </div>
                {hfConnected ? <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-bold px-2 py-0.5 rounded-xs">Token Active</span> : null}
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-[11px] text-[#788274] block">
                  Paste a Hugging Face access token so Epoch can pull gated models your account already has access to.
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    placeholder="hf_..."
                    className={cn(
                      "w-full border px-3 py-1.5 font-mono text-xs outline-none rounded-xs",
                      dark ? "border-[#383838] bg-[#1a1a1a] text-white focus:border-[#75bf00]" : "border-[#c9cec4] bg-[#fafbfa] text-[#171a17] focus:border-[#75bf00]"
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => { if (hfToken) setHfConnected(true); }}
                    className={cn(
                      "shrink-0 border px-3 py-1.5 text-xs rounded-xs transition-colors",
                      dark ? "border-[#383838] bg-[#252525] text-white hover:border-[#75bf00]" : "border-[#d8ddd3] bg-[#f5f7f3] text-[#2a3028] hover:border-[#171a17]"
                    )}
                  >
                    Connect Hugging Face
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Security */}
      {activeTab === "security" && (
        <div className="space-y-6 max-w-[840px]">
          <div>
            <h1 className={cn("text-2xl font-semibold", dark ? "text-white" : "text-[#171a17]")}>
              <span className="bg-[#75bf00] px-2 py-0.5 text-black inline-block font-medium rounded-xs">
                Security
              </span>
            </h1>
            <p className={cn("mt-1 text-xs", dark ? "text-[#889084]" : "text-[#687063]")}>
              Authentication, access controls, and audit logging.
            </p>
          </div>

          <div className={cn(
            "divide-y divide-dashed border-t border-dashed",
            dark ? "divide-[#282828] border-[#282828]" : "divide-[#d8ddd3] border-[#d8ddd3]"
          )}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 flex items-center gap-2 text-xs font-semibold", dark ? "text-white" : "text-[#171a17]")}>
                <Lock size={13} />
                <span>Authentication</span>
              </div>
              <div className={cn(
                "md:col-span-8 flex items-center justify-between border p-3 text-xs rounded-xs",
                dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-white"
              )}>
                <div>
                  <div className={cn("font-semibold", dark ? "text-white" : "text-[#171a17]")}>Authentication</div>
                  <div className={cn("text-[11px]", dark ? "text-[#889084]" : "text-[#687063]")}>
                    Email and password or OAuth (Google, GitHub)
                  </div>
                </div>
                <span className={cn(
                  "px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs",
                  dark ? "border border-[#75bf00]/40 bg-[#162916] text-[#a3e635]" : "border border-[#b9de78] bg-[#f2fbe6] text-[#2d5800]"
                )}>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Notifications */}
      {activeTab === "notifications" && (
        <div className="space-y-6 max-w-[840px]">
          <div>
            <h1 className={cn("text-2xl font-semibold", dark ? "text-white" : "text-[#171a17]")}>
              <span className="bg-[#75bf00] px-2 py-0.5 text-black inline-block font-medium rounded-xs">
                Notifications
              </span>
            </h1>
            <p className={cn("mt-1 text-xs", dark ? "text-[#889084]" : "text-[#687063]")}>
              Alerts for finished benchmark sweeps, budget thresholds, and deployment health.
            </p>
          </div>

          <div className={cn("border p-4 rounded-xs text-xs space-y-3", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
            <div className="flex items-center justify-between">
              <div>
                <div className={cn("font-semibold", dark ? "text-white" : "text-[#171a17]")}>Optimization Completion Emails</div>
                <div className="text-[11px] text-[#788274]">Receive an email when a pipeline finishes benchmarking.</div>
              </div>
              <span className={cn("px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs", dark ? "border border-[#75bf00]/40 bg-[#162916] text-[#a3e635]" : "border border-[#b9de78] bg-[#f2fbe6] text-[#2d5800]")}>
                Enabled
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Billing */}
      {activeTab === "billing" && (
        <div className="space-y-6 max-w-[840px]">
          <div>
            <h1 className={cn("text-2xl font-semibold", dark ? "text-white" : "text-[#171a17]")}>
              <span className="bg-[#75bf00] px-2 py-0.5 text-black inline-block font-medium rounded-xs">
                Billing
              </span>
            </h1>
            <p className={cn("mt-1 text-xs", dark ? "text-[#889084]" : "text-[#687063]")}>
              Manage payment methods, invoices, and plan subscriptions.
            </p>
          </div>

          <div className={cn("border p-4 rounded-xs text-xs space-y-3", dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#d8ddd3] bg-white")}>
            <div className="flex items-center justify-between">
              <div>
                <div className={cn("font-semibold", dark ? "text-white" : "text-[#171a17]")}>Current Plan: Free Tier</div>
                <div className="text-[11px] text-[#788274]">$10.00 free credits included.</div>
              </div>
              <button
                type="button"
                className="bg-[#75bf00] text-black px-3 py-1 font-bold text-xs rounded-xs"
              >
                Upgrade to Core
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {newKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4">
          <div className={cn(
            "w-full max-w-md border p-5 shadow-2xl space-y-4 text-xs rounded-xs",
            dark ? "border-[#383838] bg-[#181818] text-white" : "border-[#a8b0a2] bg-white text-[#171a17]"
          )}>
            <div>
              <h3 className={cn("text-sm font-semibold", dark ? "text-white" : "text-[#171a17]")}>Create API Key</h3>
              <p className="text-xs text-[#788274] mt-0.5">
                Issue a secret token for automated inference pipelines and CLI workers.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-[#788274] block font-medium">Key Name / Description</label>
              <input
                autoFocus
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. production-inference-client"
                className={cn(
                  "w-full border px-3 py-2 outline-none rounded-xs",
                  dark ? "border-[#383838] bg-[#202020] text-white focus:border-[#75bf00]" : "border-[#c9cec4] bg-[#fafbfa] text-[#171a17] focus:border-[#75bf00]"
                )}
              />
            </div>

            <div className={cn("flex justify-end gap-2 pt-2 border-t", dark ? "border-[#282828]" : "border-[#edf0eb]")}>
              <button
                type="button"
                onClick={() => setNewKeyModalOpen(false)}
                className={cn(
                  "border px-3 py-1.5 text-xs rounded-xs transition-colors",
                  dark ? "border-[#383838] bg-[#252525] text-white" : "border-[#d8ddd3] bg-white text-[#555]"
                )}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateKey}
                className="bg-[#75bf00] text-black font-semibold px-3 py-1.5 text-xs rounded-xs"
              >
                Create Key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
