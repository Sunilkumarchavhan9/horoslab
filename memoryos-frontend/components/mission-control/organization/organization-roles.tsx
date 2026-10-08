"use client";

import React, { useState } from "react";
import { Shield, Plus, Check, X, ShieldAlert, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationLayout, OrganizationHeader } from "./organization-shared-components";

// --- Mock Data ---
const ROLES = [
 { id: "role_admin", name: "Admin", members: 4, type: "System" },
 { id: "role_eng", name: "Engineer", members: 24, type: "System" },
 { id: "role_viewer", name: "Viewer", members: 12, type: "System" },
 { id: "role_finance", name: "Finance", members: 2, type: "Custom" },
 { id: "role_sec", name: "Security", members: 4, type: "Custom" }
];

const PERMISSIONS = [
 { feature: "Organization Settings", admin: "Write", eng: "Read", viewer: "None", finance: "None", sec: "Read" },
 { feature: "Billing & Invoices", admin: "Write", eng: "None", viewer: "None", finance: "Write", sec: "None" },
 { feature: "Member Management", admin: "Write", eng: "None", viewer: "None", finance: "None", sec: "Read" },
 { feature: "API Keys & Webhooks", admin: "Write", eng: "Write", viewer: "Read", finance: "None", sec: "Write" },
 { feature: "Mission Execution", admin: "Write", eng: "Write", viewer: "Read", finance: "None", sec: "Read" },
 { feature: "Institution Setup", admin: "Write", eng: "Write", viewer: "Read", finance: "None", sec: "Read" },
 { feature: "Audit Logs", admin: "Read", eng: "None", viewer: "None", finance: "Read", sec: "Read" },
];

export function OrganizationRoles() {
 const [selectedRole, setSelectedRole] = useState(ROLES[0]);

 const renderPermissionIcon = (perm: string) => {
 if (perm === "Write") return <span className="text-emerald-600 font-medium">Write</span>;
 if (perm === "Read") return <span className="text-[#0f52ff] font-medium">Read</span>;
 return <span className="text-muted-foreground">None</span>;
 };

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[1000px]">
 <div className="flex items-start justify-between mb-8">
 <OrganizationHeader 
 title="Roles & Permissions" 
 description="Manage human access control for the HOROS workspace. Runtime capabilities for AI agents are managed separately under Governance."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-[#F0EFE2] dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <Plus className="size-4" />
 Create Custom Role
 </button>
 </div>

 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111] overflow-x-auto">
 <table className="w-full text-left border-collapse min-w-[800px]">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground w-[200px]">Feature</th>
 <th className="px-6 py-3 text-[12px] font-medium text-foreground dark:text-[#F0EFE2] cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedRole(ROLES[0])}>
 Admin
 </th>
 <th className="px-6 py-3 text-[12px] font-medium text-foreground dark:text-[#F0EFE2] cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedRole(ROLES[1])}>
 Engineer
 </th>
 <th className="px-6 py-3 text-[12px] font-medium text-foreground dark:text-[#F0EFE2] cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedRole(ROLES[2])}>
 Viewer
 </th>
 <th className="px-6 py-3 text-[12px] font-medium text-foreground dark:text-[#F0EFE2] cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedRole(ROLES[3])}>
 Finance
 </th>
 <th className="px-6 py-3 text-[12px] font-medium text-foreground dark:text-[#F0EFE2] cursor-pointer hover:bg-accent transition-colors" onClick={() => setSelectedRole(ROLES[4])}>
 Security
 </th>
 </tr>
 </thead>
 <tbody>
 {PERMISSIONS.map((perm, idx) => (
 <tr key={idx} className="border-b border-border dark:border-white/5 last:border-0 hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50">
 <td className="px-6 py-3 text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">
 {perm.feature}
 </td>
 <td className="px-6 py-3 text-[12px]">
 {renderPermissionIcon(perm.admin)}
 </td>
 <td className="px-6 py-3 text-[12px]">
 {renderPermissionIcon(perm.eng)}
 </td>
 <td className="px-6 py-3 text-[12px]">
 {renderPermissionIcon(perm.viewer)}
 </td>
 <td className="px-6 py-3 text-[12px]">
 {renderPermissionIcon(perm.finance)}
 </td>
 <td className="px-6 py-3 text-[12px]">
 {renderPermissionIcon(perm.sec)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Shield className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">{selectedRole.name} Role</span>
 <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
 <Edit2 className="size-3.5" />
 </button>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Overview</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px]">
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2">
 <span className="text-muted-foreground">Type</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">{selectedRole.type}</span>
 </div>
 <div className="flex justify-between pt-2">
 <span className="text-muted-foreground">Assigned Members</span>
 <span className="font-mono text-foreground dark:text-[#F0EFE2]">{selectedRole.members}</span>
 </div>
 </div>
 </div>

 {selectedRole.type === "System" && (
 <div className="flex flex-col gap-3">
 <div className="p-6 rounded-md border border-[#0f52ff]/20 bg-[#0f52ff]/5 flex items-start gap-3">
 <ShieldAlert className="size-4 text-[#0f52ff] shrink-0 mt-0.5" />
 <p className="text-[12px] text-foreground/80 dark:text-[#C8C7BA] leading-relaxed">
 System roles cannot be modified or deleted. To create granular permissions, create a Custom Role instead.
 </p>
 </div>
 </div>
 )}

 </div>
 </div>
 );

 return (
 <OrganizationLayout inspector={renderInspector()}>
 {renderMain()}
 </OrganizationLayout>
 );
}
