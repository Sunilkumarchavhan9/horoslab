"use client";

import React, { useState } from "react";
import { Settings, Shield, Bell, Check, Key, Link as LinkIcon, Monitor, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationLayout, OrganizationHeader, SectionTitle } from "./organization-shared-components";

export function OrganizationSettings() {
 const [activeTab, setActiveTab] = useState("Authentication");
 
 const TABS = ["General", "Appearance", "Notifications", "Security", "Authentication", "Integrations", "Advanced"];

 const renderAuthentication = () => (
 <div className="flex flex-col gap-8">
 <div>
 <SectionTitle title="Single Sign-On (SSO)" description="Configure enterprise identity providers." />
 <div className="flex flex-col gap-6">
 
 <div className="flex items-center justify-between p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <div className="flex items-center gap-6">
 <div className="size-10 rounded bg-card dark:bg-[#222] flex items-center justify-center font-bold text-[14px]">G</div>
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Google Workspace</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">Enabled for all members</span>
 </div>
 </div>
 <button className="px-3 py-1.5 bg-muted dark:bg-white/10 rounded text-[12px] font-medium text-foreground dark:text-[#F0EFE2] hover:bg-black/10 dark:hover:bg-card/20 transition-colors">
 Configure
 </button>
 </div>

 <div className="flex items-center justify-between p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <div className="flex items-center gap-6">
 <div className="size-10 rounded bg-card dark:bg-[#222] flex items-center justify-center font-bold text-[14px]">GH</div>
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">GitHub</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">Disabled</span>
 </div>
 </div>
 <button className="px-3 py-1.5 border border-border dark:border-white/10 rounded text-[12px] font-medium text-foreground dark:text-[#F0EFE2] hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors">
 Enable
 </button>
 </div>

 <div className="flex items-center justify-between p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <div className="flex items-center gap-6">
 <div className="size-10 rounded bg-card dark:bg-[#222] flex items-center justify-center font-bold text-[14px]">SAML</div>
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Custom SAML 2.0</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">Okta, Azure AD, etc.</span>
 </div>
 </div>
 <button className="px-3 py-1.5 border border-border dark:border-white/10 rounded text-[12px] font-medium text-foreground dark:text-[#F0EFE2] hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors">
 Configure
 </button>
 </div>

 </div>
 </div>

 <div>
 <SectionTitle title="Directory Sync" description="Automatically provision and de-provision users." />
 <div className="flex items-center justify-between p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <div className="flex items-center gap-6">
 <div className="size-10 rounded bg-card dark:bg-[#222] flex items-center justify-center font-bold text-[14px]">SCIM</div>
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">SCIM 2.0</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">Not configured</span>
 </div>
 </div>
 <button className="px-3 py-1.5 border border-border dark:border-white/10 rounded text-[12px] font-medium text-foreground dark:text-[#F0EFE2] hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors">
 Setup SCIM
 </button>
 </div>
 </div>
 </div>
 );

 const renderNotifications = () => (
 <div className="flex flex-col gap-8">
 <div>
 <SectionTitle title="Notification Channels" description="Where should alerts be routed?" />
 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111] text-[13px]">
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/5">
 <span className="font-medium text-foreground dark:text-[#F0EFE2] w-1/3">Email</span>
 <span className="text-muted-foreground dark:text-muted-foreground w-1/2">Daily digest, critical alerts</span>
 <button className="text-[#0f52ff] hover:underline font-medium">Edit</button>
 </div>
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/5">
 <span className="font-medium text-foreground dark:text-[#F0EFE2] w-1/3">Slack</span>
 <span className="text-muted-foreground dark:text-muted-foreground w-1/2">#horos-alerts</span>
 <button className="text-[#0f52ff] hover:underline font-medium">Edit</button>
 </div>
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/5">
 <span className="font-medium text-foreground dark:text-[#F0EFE2] w-1/3">Webhooks</span>
 <span className="text-muted-foreground dark:text-muted-foreground w-1/2">1 endpoint active</span>
 <button className="text-[#0f52ff] hover:underline font-medium">Edit</button>
 </div>
 </div>
 </div>
 </div>
 );

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[1000px]">
 <div className="flex items-start justify-between mb-8">
 <OrganizationHeader 
 title="Organization Settings" 
 description="Workspace-level preferences, notifications, and identity providers."
 />
 </div>

 <div className="flex items-start gap-10">
 
 {/* Left Sidebar Menu */}
 <div className="w-[200px] shrink-0 flex flex-col gap-1 border-r border-border dark:border-white/10 pr-6">
 {TABS.map((tab) => (
 <button 
 key={tab}
 onClick={() => setActiveTab(tab)}
 className={cn(
 "px-3 py-2 rounded-md text-[13px] text-left transition-colors font-medium",
 activeTab === tab 
 ? "bg-muted dark:bg-white/10 text-foreground dark:text-[#F0EFE2]" 
 : "text-muted-foreground dark:text-muted-foreground hover:text-foreground hover:bg-muted/50 dark:hover:text-[#F0EFE2] dark:hover:bg-[#1a1a1a]"
 )}
 >
 {tab}
 </button>
 ))}
 </div>

 {/* Content Area */}
 <div className="flex-1 max-w-[600px]">
 {activeTab === "Authentication" && renderAuthentication()}
 {activeTab === "Notifications" && renderNotifications()}
 {activeTab !== "Authentication" && activeTab !== "Notifications" && (
 <div className="p-8 border border-dashed border-black/20 dark:border-white/20 rounded-md text-center flex flex-col items-center justify-center">
 <Settings className="size-6 text-muted-foreground mb-4" />
 <h3 className="text-[14px] font-medium text-foreground dark:text-[#F0EFE2] mb-2">{activeTab} Settings</h3>
 <p className="text-[13px] text-muted-foreground dark:text-muted-foreground">This settings panel is coming soon.</p>
 </div>
 )}
 </div>

 </div>
 </div>
 );

 return (
 <OrganizationLayout>
 {renderMain()}
 </OrganizationLayout>
 );
}
