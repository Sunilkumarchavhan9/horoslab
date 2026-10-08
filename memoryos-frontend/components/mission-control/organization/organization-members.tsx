"use client";

import React, { useState } from "react";
import { Users, UserPlus, Search, MoreHorizontal, Shield, Clock, ShieldCheck, Mail, MonitorSmartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationLayout, OrganizationHeader, StatusBadge } from "./organization-shared-components";

// --- Mock Data ---
const MEMBERS = [
 { id: "mem_1", name: "Sunil Kumar", email: "sunil@horos.ai", role: "Platform Admin", team: "Engineering", status: "Online", lastActive: "Just now", institutions: 3, missions: 18 },
 { id: "mem_2", name: "Alice Chen", email: "alice@horos.ai", role: "Engineer", team: "Engineering", status: "Offline", lastActive: "2 hours ago", institutions: 1, missions: 42 },
 { id: "mem_3", name: "Bob Smith", email: "bob@horos.ai", role: "Viewer", team: "Product", status: "Online", lastActive: "5 mins ago", institutions: 0, missions: 0 },
 { id: "mem_4", name: "Charlie Davis", email: "charlie@horos.ai", role: "Finance", team: "Operations", status: "Invited", lastActive: "Never", institutions: 0, missions: 0 }
];

export function OrganizationMembers() {
 const [selectedMember, setSelectedMember] = useState(MEMBERS[0]);

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[900px]">
 <div className="flex items-start justify-between mb-8">
 <OrganizationHeader 
 title="Members" 
 description="Manage human access to this workspace. Organization roles dictate UI access, while AI runtime authority is managed in Governance."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-[#F0EFE2] dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <UserPlus className="size-4" />
 Invite Members
 </button>
 </div>

 <div className="grid grid-cols-4 gap-6 mb-8">
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Total Members</span>
 <div className="text-[24px] font-semibold text-foreground dark:text-[#F0EFE2] mt-1">42</div>
 </div>
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Invited</span>
 <div className="text-[24px] font-semibold text-foreground dark:text-[#F0EFE2] mt-1">3</div>
 </div>
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Admins</span>
 <div className="text-[24px] font-semibold text-foreground dark:text-[#F0EFE2] mt-1">4</div>
 </div>
 <div className="p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Guests</span>
 <div className="text-[24px] font-semibold text-foreground dark:text-[#F0EFE2] mt-1">12</div>
 </div>
 </div>

 <div className="flex items-center gap-2 mb-4">
 <div className="relative flex-1 max-w-[300px]">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
 <input 
 type="text" 
 placeholder="Search by name or email..." 
 className="w-full pl-9 pr-4 py-1.5 bg-card dark:bg-[#111] border border-border dark:border-white/10 rounded-md text-[13px] outline-none focus:border-[#0f52ff]"
 />
 </div>
 </div>

 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-muted/50 dark:bg-[#050505] border-b border-border dark:border-white/10">
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Name</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Role</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Team</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground">Status</th>
 <th className="px-6 py-3 text-[12px] font-medium text-muted-foreground dark:text-muted-foreground text-right"></th>
 </tr>
 </thead>
 <tbody>
 {MEMBERS.map((member) => (
 <tr 
 key={member.id} 
 onClick={() => setSelectedMember(member)}
 className={cn(
 "border-b border-border dark:border-white/5 last:border-0 cursor-pointer transition-colors",
 selectedMember.id === member.id ? "bg-muted dark:bg-white/10" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50"
 )}
 >
 <td className="px-6 py-3">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-gradient-to-br from-[#0f52ff] to-[#60a5fa] flex items-center justify-center text-[#F0EFE2] text-[12px] font-bold shrink-0">
 {member.name.charAt(0)}
 </div>
 <div className="flex flex-col min-w-0">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2] truncate">{member.name}</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground truncate">{member.email}</span>
 </div>
 </div>
 </td>
 <td className="px-6 py-3">
 <span className="text-[13px] text-foreground/80 dark:text-[#C8C7BA]">{member.role}</span>
 </td>
 <td className="px-6 py-3">
 <span className="text-[13px] text-foreground/80 dark:text-[#C8C7BA]">{member.team}</span>
 </td>
 <td className="px-6 py-3">
 <StatusBadge status={member.status} />
 </td>
 <td className="px-6 py-3 text-right">
 <button className="p-1.5 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-[#F0EFE2] transition-colors rounded">
 <MoreHorizontal className="size-4" />
 </button>
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
 <Users className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Member Profile</span>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col items-center gap-3 text-center">
 <div className="size-16 rounded-full bg-gradient-to-br from-[#0f52ff] to-[#60a5fa] flex items-center justify-center text-[#F0EFE2] text-[24px] font-bold ">
 {selectedMember.name.charAt(0)}
 </div>
 <div className="flex flex-col gap-1">
 <h3 className="text-[16px] font-semibold text-foreground dark:text-[#F0EFE2]">{selectedMember.name}</h3>
 <span className="text-[12px] text-muted-foreground dark:text-muted-foreground flex items-center justify-center gap-1">
 <Mail className="size-3" /> {selectedMember.email}
 </span>
 </div>
 <StatusBadge status={selectedMember.status} />
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Access & Activity</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px]">
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2">
 <span className="text-muted-foreground">Workspace Role</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2] flex items-center gap-1.5"><Shield className="size-3.5"/> {selectedMember.role}</span>
 </div>
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2 pt-2">
 <span className="text-muted-foreground">Institutions</span>
 <span className="font-mono text-foreground dark:text-[#F0EFE2]">{selectedMember.institutions}</span>
 </div>
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2 pt-2">
 <span className="text-muted-foreground">Missions Invoked</span>
 <span className="font-mono text-foreground dark:text-[#F0EFE2]">{selectedMember.missions}</span>
 </div>
 <div className="flex justify-between pt-2">
 <span className="text-muted-foreground">Last Active</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2] flex items-center gap-1.5"><Clock className="size-3"/> {selectedMember.lastActive}</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Active Sessions</span>
 <div className="flex flex-col gap-3">
 <div className="flex items-start gap-3">
 <MonitorSmartphone className="size-4 text-muted-foreground mt-0.5" />
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Mac OS • Chrome</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">San Francisco, US • Current session</span>
 </div>
 </div>
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
