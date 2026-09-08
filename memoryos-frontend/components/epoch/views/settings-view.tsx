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
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { EpochBadge } from "../ui/epoch-badge";
import { EpochButton } from "../ui/epoch-button";
import { cn } from "@/lib/utils";
import { ApiKeysView } from "./api-keys-view";
import { FinOpsCostView } from "./finops-cost-view";
import { RealityConnectionsView } from "./reality-connections-view";

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
                dark ? "text-[#889084] hover:text-[#F0EFE2]" : "text-[#525a4d] hover:text-[#171a17]"
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
                    ? dark ? "text-[#F0EFE2] font-semibold" : "text-[#171a17] font-semibold"
                    : dark ? "text-[#889084] hover:text-[#F0EFE2]" : "text-[#6b7367] hover:text-[#171a17]"
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
            <h1 className={cn("text-2xl font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
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
              <div className={cn("md:col-span-4 flex items-center gap-2 text-xs font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                <span className="font-mono text-sm">T</span>
                <span>Workspace Name</span>
              </div>
              <div className="md:col-span-8 flex items-center gap-2">
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className={cn(
                    "w-full max-w-sm border px-3 py-1.5 text-xs font-mono outline-none rounded-xs",
                    dark ? "border-[#383838] bg-[#202020] text-[#F0EFE2] focus:border-[#75bf00]" : "border-[#c9cec4] bg-white text-[#171a17] focus:border-[#75bf00]"
                  )}
                />
                <button
                  type="button"
                  className={cn(
                    "border px-3 py-1.5 text-xs font-medium rounded-xs transition-colors",
                    dark ? "border-[#383838] bg-[#252525] text-[#F0EFE2] hover:bg-[#303030]" : "border-[#c9cec4] bg-[#f5f7f3] text-[#2a3028] hover:border-[#171a17]"
                  )}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#889084]" : "text-[#687063]")}>
                <div className={cn("font-semibold flex items-center gap-1.5", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
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
                  <span className={dark ? "text-[#F0EFE2]" : "text-[#171a17]"}>personal-68198f3db28e4ed5a2b179c96c8c505e</span>
                </div>
                <div className={cn(
                  "flex items-center justify-between border p-2.5 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#788274]")}>Type</span>
                  <span className={cn("flex items-center gap-1", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                    <span className="h-1.5 w-1.5 rounded-full bg-[#75bf00]" />
                    <span>Personal</span>
                  </span>
                </div>
                <div className={cn(
                  "flex items-center justify-between border p-2.5 rounded-xs",
                  dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-[#fafbfa]"
                )}>
                  <span className={cn("font-sans", dark ? "text-[#889084]" : "text-[#788274]")}>Role</span>
                  <span className={dark ? "text-[#F0EFE2]" : "text-[#171a17]"}>Owner</span>
                </div>
              </div>
            </div>

            {/* Display Navigation Layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-5">
              <div className={cn("md:col-span-4 text-xs space-y-1", dark ? "text-[#889084]" : "text-[#687063]")}>
                <div className={cn("font-semibold flex items-center gap-1.5", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
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
                        ? "border-[#383838] bg-[#1a1a1a] text-[#C8C7BA]"
                        : "border-[#d8ddd3] bg-white text-[#687063]"
                  )}>
                    <span className={cn("h-2 w-2 rounded-full", displayNav === "top_bar" ? "bg-[#75bf00]" : "bg-transparent")} />
                  </div>
                  <div>
                    <div className={cn("font-semibold text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Top bar</div>
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
                        ? "border-[#383838] bg-[#1a1a1a] text-[#C8C7BA]"
                        : "border-[#d8ddd3] bg-white text-[#687063]"
                  )}>
                    <PanelLeft size={13} />
                  </div>
                  <div>
                    <div className={cn("font-semibold text-xs", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Sidebar</div>
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
        <ApiKeysView
          dark={dark}
          onNavigateToPipelines={() => {
            if (onBack) onBack();
          }}
          onNavigateToModelApis={() => {
            if (onBack) onBack();
          }}
        />
      )}

      {/* TAB: Billing / Cost */}
      {(activeTab === "billing" || activeTab === "cost") && (
        <FinOpsCostView
          dark={dark}
          balanceUsd={balanceUsd}
          onNavigateToPipelines={() => {
            if (onBack) onBack();
          }}
          onNavigateToAnalytics={() => {
            if (onBack) onBack();
          }}
        />
      )}

      {/* TAB: Clouds - Exact Reference Screenshot Layout */}
      {activeTab === "clouds" && (
        <div className="space-y-6 max-w-[900px]">
          {/* Header Title & Subtitle */}
          <div>
            <h1 className="text-xl md:text-2xl font-mono font-bold text-[#F0EFE2] flex items-center gap-2">
              Connected{" "}
              <span className="bg-[#75bf00] px-2 py-0.5 text-black font-bold rounded-xs">
                clouds
              </span>
            </h1>
            <p className="mt-1.5 text-xs text-[#889284] font-mono leading-relaxed max-w-2xl">
              Deploy to GPU clouds you own and pay for directly. Keys are encrypted and never shown in the clear. Prefer to run it fully yourself?
              <br />
              Export the optimized package from any finished session.
            </p>
          </div>

          {/* Banner Notice Box */}
          <div className="border border-[#704d0c] bg-[#291e0a] p-3.5 rounded-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#f5d060] font-mono">
            <div className="flex items-start gap-2.5">
              <AlertCircle size={15} className="text-[#e6b800] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">
                Deploying to your own cloud unlocks at $50 in lifetime credits. You can connect a cloud now, then add funds to deploy on it.
              </p>
            </div>
            <button
              type="button"
              className="shrink-0 border border-[#8f6a1e] bg-[#3d2c0d] hover:bg-[#4d3811] text-[#fce8a6] font-mono text-xs font-bold px-3 py-1.5 rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>Add funds</span>
              <ArrowUpRight size={12} />
            </button>
          </div>

          {/* Connected Cards Stack */}
          <div className="space-y-5 font-mono">
            {/* 1. RunPod Card */}
            <div className="border border-dashed border-[#333333] bg-[#141414] p-4 space-y-3.5 rounded-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center border border-[#383838] bg-[#181818] text-[#a3e635] rounded-xs">
                    <Box size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#F0EFE2]">RunPod</span>
                      <span className="border border-[#383838] bg-[#181818] text-[#889284] px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-xs">
                        THIRD-PARTY CLOUD
                      </span>
                    </div>
                    <p className="text-[11px] text-[#788274] mt-0.5">
                      Epoch deploys to GPUs you rent directly from RunPod.{" "}
                      <a href="#docs" className="text-[#75bf00] hover:underline">Read the docs.</a>
                    </p>
                  </div>
                </div>
                {runpodConnected && (
                  <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-bold px-2 py-0.5 rounded-xs">
                    Connected
                  </span>
                )}
              </div>

              {/* Inner Dashed Input Container */}
              <div className="border border-dashed border-[#333333] bg-[#181818] p-3.5 space-y-2.5 rounded-xs">
                <label className="text-[11px] text-[#788274] block">
                  Paste a RunPod API key to deploy on your own account.
                </label>
                <a href="#create-key" className="text-[11px] text-[#889284] hover:text-[#F0EFE2] flex items-center gap-1 font-bold">
                  &gt; CREATE A KEY
                </a>

                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Key size={13} className="absolute left-3 top-2.5 text-[#666]" />
                    <input
                      value={runpodKey}
                      onChange={(e) => setRunpodKey(e.target.value)}
                      placeholder="rpa_..."
                      className="w-full border border-dashed border-[#383838] bg-[#121212] pl-8 pr-3 py-1.5 font-mono text-xs text-[#F0EFE2] outline-none rounded-xs focus:border-[#75bf00]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (runpodKey) setRunpodConnected(true); }}
                    className="shrink-0 border border-dashed border-[#383838] bg-[#222222] hover:bg-[#282828] text-[#889284] hover:text-[#F0EFE2] text-xs px-3.5 py-1.5 rounded-xs transition-colors cursor-pointer"
                  >
                    Connect RunPod
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Modal Card */}
            <div className="border border-dashed border-[#333333] bg-[#141414] p-4 space-y-3.5 rounded-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center border border-[#383838] bg-[#181818] text-[#a3e635] font-bold text-sm rounded-xs">
                  M
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#F0EFE2]">Modal</span>
                    <span className="border border-[#383838] bg-[#181818] text-[#889284] px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-xs">
                      THIRD-PARTY CLOUD
                    </span>
                  </div>
                  <p className="text-[11px] text-[#788274] mt-0.5">
                    Epoch routes inference to a Modal gateway you deploy in your account.{" "}
                    <a href="#docs" className="text-[#75bf00] hover:underline">Read the docs.</a>
                  </p>
                </div>
              </div>

              {/* Info Notice Box */}
              <div className="border border-[#333333] bg-[#181818] p-3 rounded-xs text-xs text-[#a0a89d] flex gap-2.5 items-start">
                <AlertCircle size={14} className="text-[#889284] shrink-0 mt-0.5" />
                <p className="leading-relaxed text-[11px]">
                  New Modal connections are paused. Optimized Modal serving is delivered through the deployment kit&apos;s Modal target, so you deploy it with your own Modal token. Existing connected gateways keep working. Open any pipeline&apos;s Deploy tab to get the kit.
                </p>
              </div>
            </div>

            {/* 3. Hugging Face Card */}
            <div className="border border-dashed border-[#333333] bg-[#141414] p-4 space-y-3.5 rounded-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center border border-[#383838] bg-[#181818] text-base rounded-xs">
                    🤗
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#F0EFE2]">Hugging Face</span>
                      <span className="border border-[#383838] bg-[#181818] text-[#889284] px-1.5 py-0.2 text-[9px] font-mono uppercase rounded-xs">
                        ACCOUNT LINK
                      </span>
                    </div>
                    <p className="text-[11px] text-[#788274] mt-0.5">
                      Epoch uses your Hugging Face account to pull gated models you already have access to.
                    </p>
                  </div>
                </div>
                {hfConnected && (
                  <span className="border border-[#75bf00]/40 bg-[#162916] text-[#a3e635] text-[10px] font-bold px-2 py-0.5 rounded-xs">
                    Token Active
                  </span>
                )}
              </div>

              {/* Inner Dashed Input Container */}
              <div className="border border-dashed border-[#333333] bg-[#181818] p-3.5 space-y-2.5 rounded-xs">
                <label className="text-[11px] text-[#788274] block">
                  Paste a Hugging Face access token so Epoch can pull gated models your account already has access to.
                </label>
                <a href="#create-token" className="text-[11px] text-[#889284] hover:text-[#F0EFE2] flex items-center gap-1 font-bold">
                  &gt; CREATE A TOKEN
                </a>

                <div className="flex items-center gap-2 pt-1">
                  <div className="relative flex-1">
                    <Key size={13} className="absolute left-3 top-2.5 text-[#666]" />
                    <input
                      value={hfToken}
                      onChange={(e) => setHfToken(e.target.value)}
                      placeholder="hf_..."
                      className="w-full border border-dashed border-[#383838] bg-[#121212] pl-8 pr-3 py-1.5 font-mono text-xs text-[#F0EFE2] outline-none rounded-xs focus:border-[#75bf00]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { if (hfToken) setHfConnected(true); }}
                    className="shrink-0 border border-dashed border-[#383838] bg-[#222222] hover:bg-[#282828] text-[#889284] hover:text-[#F0EFE2] text-xs px-3.5 py-1.5 rounded-xs transition-colors cursor-pointer"
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
            <h1 className={cn("text-2xl font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
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
              <div className={cn("md:col-span-4 flex items-center gap-2 text-xs font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
                <Lock size={13} />
                <span>Authentication</span>
              </div>
              <div className={cn(
                "md:col-span-8 flex items-center justify-between border p-3 text-xs rounded-xs",
                dark ? "border-[#2e2e2e] bg-[#202020]" : "border-[#edf0eb] bg-white"
              )}>
                <div>
                  <div className={cn("font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Authentication</div>
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
            <h1 className={cn("text-2xl font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
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
                <div className={cn("font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Optimization Completion Emails</div>
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
            <h1 className={cn("text-2xl font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>
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
                <div className={cn("font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Current Plan: Free Tier</div>
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
            dark ? "border-[#383838] bg-[#181818] text-[#F0EFE2]" : "border-[#a8b0a2] bg-white text-[#171a17]"
          )}>
            <div>
              <h3 className={cn("text-sm font-semibold", dark ? "text-[#F0EFE2]" : "text-[#171a17]")}>Create API Key</h3>
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
                  dark ? "border-[#383838] bg-[#202020] text-[#F0EFE2] focus:border-[#75bf00]" : "border-[#c9cec4] bg-[#fafbfa] text-[#171a17] focus:border-[#75bf00]"
                )}
              />
            </div>

            <div className={cn("flex justify-end gap-2 pt-2 border-t", dark ? "border-[#282828]" : "border-[#edf0eb]")}>
              <button
                type="button"
                onClick={() => setNewKeyModalOpen(false)}
                className={cn(
                  "border px-3 py-1.5 text-xs rounded-xs transition-colors",
                  dark ? "border-[#383838] bg-[#252525] text-[#F0EFE2]" : "border-[#d8ddd3] bg-white text-[#555]"
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
