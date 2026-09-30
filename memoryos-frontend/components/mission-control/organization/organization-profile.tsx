"use client";

import React from "react";
import { Building2, Globe, Shield, Activity, Edit2, ShieldCheck, Mail, Database, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationLayout, OrganizationHeader, SectionTitle, StatusBadge } from "./organization-shared-components";

// --- Mock Data ---
const ORG_META = {
 name: "Dhyra Inc.",
 plan: "Enterprise",
 created: "Jan 12, 2026",
 members: 42,
 institutions: 12,
 missions: 524,
 health: "98.4%",
 industry: "Artificial Intelligence",
 timezone: "UTC-8 (Pacific Time)",
 country: "United States"
};

const DOMAINS = [
 { id: "dhyra.ai", status: "Verified", sso: "Enforced" },
 { id: "dhyra-corp.com", status: "Pending TXT", sso: "Optional" }
];

export function OrganizationProfile() {

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[800px]">
 <OrganizationHeader 
 title="Organization Profile" 
 description="Manage your organization's identity, verified domains, and baseline security requirements."
 />

 {/* Organization Overview Card */}
 <div className="mb-10 p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <div className="flex items-start justify-between mb-8">
 <div className="flex items-center gap-6">
 <div className="size-16 rounded-md border border-border dark:border-white/10 bg-muted/50 dark:bg-[#050505] flex items-center justify-center">
 <Building2 className="size-8 text-foreground dark:text-[#F0EFE2]" />
 </div>
 <div className="flex flex-col">
 <div className="flex items-center gap-2 mb-1">
 <h2 className="text-[20px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight">{ORG_META.name}</h2>
 <span className="px-2 py-0.5 rounded-md bg-[#0f52ff]/10 text-[#0f52ff] text-[11px] font-mono font-medium uppercase tracking-wider">
 {ORG_META.plan}
 </span>
 </div>
 <span className="text-[13px] text-muted-foreground dark:text-muted-foreground">Created {ORG_META.created}</span>
 </div>
 </div>
 <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-accent dark:hover:bg-card/5">
 <Edit2 className="size-4" />
 </button>
 </div>

 <div className="grid grid-cols-4 gap-6 pt-6 border-t border-border dark:border-white/5">
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Members</span>
 <span className="text-[18px] font-semibold text-foreground dark:text-[#F0EFE2]">{ORG_META.members}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Institutions</span>
 <span className="text-[18px] font-semibold text-foreground dark:text-[#F0EFE2]">{ORG_META.institutions}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Missions</span>
 <span className="text-[18px] font-semibold text-foreground dark:text-[#F0EFE2]">{ORG_META.missions}</span>
 </div>
 <div className="flex flex-col gap-1">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Avg Health</span>
 <span className="text-[18px] font-semibold text-emerald-600">{ORG_META.health}</span>
 </div>
 </div>
 </div>

 {/* General Settings */}
 <div className="mb-10">
 <SectionTitle title="General" description="Basic information about your organization." />
 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111] text-[13px]">
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/5">
 <span className="font-medium text-foreground dark:text-[#F0EFE2] w-1/3">Name</span>
 <span className="text-muted-foreground dark:text-muted-foreground w-1/2">{ORG_META.name}</span>
 <button className="text-[#0f52ff] hover:underline font-medium">Edit</button>
 </div>
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/5">
 <span className="font-medium text-foreground dark:text-[#F0EFE2] w-1/3">Industry</span>
 <span className="text-muted-foreground dark:text-muted-foreground w-1/2">{ORG_META.industry}</span>
 <button className="text-[#0f52ff] hover:underline font-medium">Edit</button>
 </div>
 <div className="flex items-center justify-between p-6 border-b border-border dark:border-white/5">
 <span className="font-medium text-foreground dark:text-[#F0EFE2] w-1/3">Timezone</span>
 <span className="text-muted-foreground dark:text-muted-foreground w-1/2">{ORG_META.timezone}</span>
 <button className="text-[#0f52ff] hover:underline font-medium">Edit</button>
 </div>
 <div className="flex items-center justify-between p-6">
 <span className="font-medium text-foreground dark:text-[#F0EFE2] w-1/3">Country</span>
 <span className="text-muted-foreground dark:text-muted-foreground w-1/2">{ORG_META.country}</span>
 <button className="text-[#0f52ff] hover:underline font-medium">Edit</button>
 </div>
 </div>
 </div>

 {/* Domains */}
 <div className="mb-10">
 <SectionTitle title="Verified Domains" description="Domains associated with this workspace. Required for SAML SSO." />
 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 {DOMAINS.map((domain, idx) => (
 <div key={domain.id} className={cn("flex items-center justify-between p-6", idx !== DOMAINS.length - 1 && "border-b border-border dark:border-white/5")}>
 <div className="flex items-center gap-3 w-1/3">
 <Globe className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">{domain.id}</span>
 </div>
 <div className="flex items-center justify-between w-1/2 pr-4">
 <StatusBadge status={domain.status} />
 <span className="text-[12px] text-muted-foreground">{domain.sso}</span>
 </div>
 <button className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded">
 <Edit2 className="size-3.5" />
 </button>
 </div>
 ))}
 <div className="p-3 bg-muted/50 dark:bg-[#050505] border-t border-border dark:border-white/5 flex justify-end">
 <button className="px-3 py-1.5 bg-card dark:bg-[#1a1a1a] border border-border dark:border-white/10 rounded text-[12px] font-medium text-foreground dark:text-[#F0EFE2] hover:bg-muted/50 dark:hover:bg-[#222] transition-colors">
 Add Domain
 </button>
 </div>
 </div>
 </div>

 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Building2 className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Workspace Metadata</span>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Security Posture</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px]">
 <div className="flex items-center gap-2 text-emerald-600 mb-2">
 <ShieldCheck className="size-4" />
 <span className="font-medium">Highly Secure</span>
 </div>
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2 mt-2">
 <span className="text-muted-foreground">2FA Required</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">Yes</span>
 </div>
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2 pt-2">
 <span className="text-muted-foreground">SAML SSO</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">Enforced</span>
 </div>
 <div className="flex justify-between pt-2">
 <span className="text-muted-foreground">Audit Log</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">Enabled</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Quick Links</span>
 <div className="flex flex-col gap-2">
 <button className="flex items-center gap-2 text-[13px] text-foreground/80 dark:text-[#C8C7BA] hover:text-[#0f52ff] dark:hover:text-[#0f52ff] transition-colors p-2 -ml-2 rounded hover:bg-accent dark:hover:bg-card/5">
 <Mail className="size-4" /> Support Contact
 </button>
 <button className="flex items-center gap-2 text-[13px] text-foreground/80 dark:text-[#C8C7BA] hover:text-[#0f52ff] dark:hover:text-[#0f52ff] transition-colors p-2 -ml-2 rounded hover:bg-accent dark:hover:bg-card/5">
 <Database className="size-4" /> Data Residency
 </button>
 <button className="flex items-center gap-2 text-[13px] text-foreground/80 dark:text-[#C8C7BA] hover:text-[#0f52ff] dark:hover:text-[#0f52ff] transition-colors p-2 -ml-2 rounded hover:bg-accent dark:hover:bg-card/5">
 <MapPin className="size-4" /> Billing Address
 </button>
 </div>
 </div>

 </div>
 </div>
 );

 return (
 <OrganizationLayout inspector={renderInspector()}>
 {renderMain()}
 </OrganizationLayout>
 );
}
