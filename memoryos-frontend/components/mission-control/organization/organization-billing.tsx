"use client";

import React, { useState } from "react";
import { CreditCard, Download, Receipt, ExternalLink, Activity, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { OrganizationLayout, OrganizationHeader, SectionTitle, StatusBadge } from "./organization-shared-components";

// --- Mock Data ---
const INVOICES = [
 { id: "inv_49A8BC2", date: "Jul 1, 2026", amount: "$8,420.00", status: "Paid" },
 { id: "inv_49A8BC1", date: "Jun 1, 2026", amount: "$8,110.00", status: "Paid" },
 { id: "inv_49A8BC0", date: "May 1, 2026", amount: "$7,950.00", status: "Paid" }
];

export function OrganizationBilling() {
 const [selectedInvoice, setSelectedInvoice] = useState(INVOICES[0]);

 const renderMain = () => (
 <div className="flex flex-col w-full max-w-[800px]">
 <div className="flex items-start justify-between mb-8">
 <OrganizationHeader 
 title="Billing & Usage" 
 description="Manage your Epoch subscription, view usage limits, and download invoices."
 />
 <button className="px-6 py-2 bg-[#111] dark:bg-white text-[#F0EFE2] dark:text-black rounded-md text-[13px] font-medium flex items-center gap-2 hover:opacity-90">
 <CreditCard className="size-4" />
 Update Payment Method
 </button>
 </div>

 {/* Subscription Card */}
 <div className="mb-10 p-6 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111]">
 <div className="flex items-start justify-between mb-8">
 <div className="flex flex-col">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Current Plan</span>
 <div className="flex items-center gap-3">
 <h2 className="text-[24px] font-semibold text-foreground dark:text-[#F0EFE2] tracking-tight">Enterprise</h2>
 <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 border border-emerald-200 text-[11px] font-medium uppercase tracking-wider">
 Active
 </span>
 </div>
 <span className="text-[13px] text-muted-foreground dark:text-muted-foreground mt-2">Next billing date: Aug 1, 2026</span>
 </div>
 <div className="text-right">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Monthly Estimate</span>
 <span className="text-[24px] font-semibold text-foreground dark:text-[#F0EFE2]">$8,420.00</span>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-6 pt-6 border-t border-border dark:border-white/5">
 <div className="flex flex-col gap-2">
 <div className="flex justify-between items-end">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Seats</span>
 <span className="text-[12px] font-mono text-muted-foreground">42 / 50</span>
 </div>
 <div className="h-1.5 w-full bg-muted dark:bg-white/10 rounded-full overflow-hidden">
 <div className="h-full bg-[#111] dark:bg-white w-[84%]" />
 </div>
 </div>
 <div className="flex flex-col gap-2">
 <div className="flex justify-between items-end">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Tokens</span>
 <span className="text-[12px] font-mono text-muted-foreground">18M / 50M</span>
 </div>
 <div className="h-1.5 w-full bg-muted dark:bg-white/10 rounded-full overflow-hidden">
 <div className="h-full bg-[#111] dark:bg-white w-[36%]" />
 </div>
 </div>
 <div className="flex flex-col gap-2">
 <div className="flex justify-between items-end">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Storage</span>
 <span className="text-[12px] font-mono text-muted-foreground">4TB / Unlimited</span>
 </div>
 <div className="h-1.5 w-full bg-muted dark:bg-white/10 rounded-full overflow-hidden">
 <div className="h-full bg-[#111] dark:bg-white w-[10%]" />
 </div>
 </div>
 </div>
 </div>

 {/* Payment Method */}
 <div className="mb-10">
 <SectionTitle title="Payment Method" description="Your primary payment method for monthly billing." />
 <div className="p-6 rounded-md border border-border dark:border-white/10 flex items-center justify-between bg-card dark:bg-[#111]">
 <div className="flex items-center gap-6">
 <div className="px-3 py-1.5 bg-card dark:bg-[#222] rounded border border-border dark:border-white/5 text-[12px] font-bold text-foreground/90 dark:text-[#C8C7BA]">
 VISA
 </div>
 <div className="flex flex-col">
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">Visa ending in 4242</span>
 <span className="text-[11px] text-muted-foreground dark:text-muted-foreground">Expires 12/2028</span>
 </div>
 </div>
 <button className="text-[12px] font-medium text-[#0f52ff] hover:underline">Edit</button>
 </div>
 </div>

 {/* Invoices */}
 <div className="mb-10">
 <SectionTitle title="Invoice History" description="Past invoices and receipts." />
 <div className="rounded-md border border-border dark:border-white/10 overflow-hidden bg-card dark:bg-[#111]">
 {INVOICES.map((inv, idx) => (
 <div 
 key={inv.id} 
 onClick={() => setSelectedInvoice(inv)}
 className={cn(
 "flex items-center justify-between p-6 cursor-pointer transition-colors",
 selectedInvoice.id === inv.id ? "bg-muted dark:bg-white/10" : "hover:bg-muted/50/50 dark:hover:bg-[#1a1a1a]/50",
 idx !== INVOICES.length - 1 && "border-b border-border dark:border-white/5"
 )}
 >
 <div className="flex items-center gap-6 w-1/3">
 <Receipt className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">{inv.date}</span>
 </div>
 <div className="w-1/3">
 <span className="text-[13px] font-mono text-muted-foreground">{inv.amount}</span>
 </div>
 <div className="w-1/3 flex items-center justify-between">
 <StatusBadge status={inv.status} />
 <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded">
 <Download className="size-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>

 </div>
 );

 const renderInspector = () => (
 <div className="flex flex-col h-full w-full">
 <div className="flex items-center gap-3 px-6 py-6 border-b border-border dark:border-white/5 bg-muted/50 dark:bg-[#030303]">
 <Receipt className="size-4 text-muted-foreground" />
 <span className="text-[13px] font-medium text-foreground dark:text-[#eee]">Invoice {selectedInvoice.id}</span>
 </div>
 
 <div className="flex-1 p-6 flex flex-col gap-8">
 
 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Summary</span>
 <div className="flex flex-col gap-2 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] p-6 text-[13px]">
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2">
 <span className="text-muted-foreground">Date</span>
 <span className="font-medium text-foreground dark:text-[#F0EFE2]">{selectedInvoice.date}</span>
 </div>
 <div className="flex justify-between border-b border-border dark:border-white/5 pb-2 pt-2">
 <span className="text-muted-foreground">Status</span>
 <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
 <CheckCircle2 className="size-3.5" /> Paid
 </span>
 </div>
 <div className="flex justify-between pt-2">
 <span className="text-muted-foreground">Total</span>
 <span className="font-mono text-foreground dark:text-[#F0EFE2] font-semibold">{selectedInvoice.amount}</span>
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-3">
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Actions</span>
 <div className="flex flex-col gap-2">
 <button className="flex items-center justify-between p-3 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">
 <span className="flex items-center gap-2"><Download className="size-4" /> Download PDF</span>
 <ArrowUpRight className="size-3.5 text-muted-foreground" />
 </button>
 <button className="flex items-center justify-between p-3 rounded-md border border-border dark:border-white/10 bg-card dark:bg-[#111] hover:bg-muted/50 dark:hover:bg-[#1a1a1a] transition-colors text-[13px] font-medium text-foreground dark:text-[#F0EFE2]">
 <span className="flex items-center gap-2"><ExternalLink className="size-4" /> View in Stripe</span>
 <ArrowUpRight className="size-3.5 text-muted-foreground" />
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
