import React from "react";
import { Button } from "@/components/ui/button";
import { Pencil, AlertCircle } from "lucide-react";

export function AccountProfile() {
 return (
 <div className="w-full flex flex-col pt-2 font-sans pb-12 max-w-3xl">
 <div className="flex items-center gap-2 mb-5 px-2 text-[14px]">
 <span className="text-muted-foreground font-medium">Manage account</span>
 <span className="text-[#aaa]">&gt;</span>
 <span className="text-foreground font-semibold">Profile</span>
 </div>

 <div className="px-2 space-y-6">
 {/* Profile Card */}
 <div className="bg-card border border-border rounded-md p-6 ">
 <div className="flex items-start gap-6">
 <div className="size-20 bg-muted rounded-full flex items-center justify-center text-2xl font-medium text-foreground/50 shrink-0">
 V
 </div>
 
 <div className="flex flex-col space-y-6 w-full mt-1">
 <div>
 <label className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest mb-1 block">Name</label>
 <div className="text-[15px] font-medium text-foreground">Vegito</div>
 </div>
 
 <div>
 <label className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest mb-1 block">Email</label>
 <div className="flex items-center gap-6">
 <div className="text-[15px] text-foreground/80">chavhansunilkumar753@gmail.com</div>
 <button className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
 <Pencil className="size-3.5" /> CHANGE
 </button>
 </div>
 </div>

 <div>
 <label className="text-[11px] font-semibold text-foreground/40 uppercase tracking-widest mb-1 block">Organization</label>
 <div className="flex items-center gap-2">
 <div className="text-[15px] font-medium text-foreground">Vegito</div>
 <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-foreground/60 lowercase">owner</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Export Data Card */}
 <div className="bg-card border border-border rounded-md p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h3 className="text-[15px] font-bold text-foreground mb-1">Export organization data</h3>
 <p className="text-[14px] text-foreground/60">Documents and memories with their container tags, as JSON. Emailed as a link (valid 6 hours).</p>
 </div>
 <Button variant="outline" className="shrink-0 h-9 px-6 font-semibold text-[13px] border-black/20 hover:bg-accent">
 EXPORT
 </Button>
 </div>

 {/* Danger Zone */}
 <div className="bg-red-50/30 border border-red-500/30 rounded-md ">
 <div className="p-6 border-b border-red-500/20">
 <div className="flex items-center gap-2 text-red-500 font-bold text-[15px]">
 <AlertCircle className="size-5" />
 Danger Zone
 </div>
 </div>
 
 <div className="p-6 flex flex-col gap-6">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-red-500/10">
 <div>
 <h4 className="text-[14px] font-bold text-foreground mb-1">Reset Organization Data</h4>
 <p className="text-[13px] text-foreground/60">Remove all documents, memories, connections, and org settings. Billing and members are kept.</p>
 </div>
 <Button className="shrink-0 h-9 px-6 font-semibold text-[13px] bg-red-500 hover:bg-red-600 text-[#F0EFE2] ">
 RESET
 </Button>
 </div>
 
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div>
 <h4 className="text-[14px] font-bold text-foreground mb-1">Delete Organization</h4>
 <p className="text-[13px] text-foreground/60">Permanently delete this organization and all its data.</p>
 </div>
 <Button className="shrink-0 h-9 px-6 font-semibold text-[13px] bg-red-500 hover:bg-red-600 text-[#F0EFE2] ">
 DELETE
 </Button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
