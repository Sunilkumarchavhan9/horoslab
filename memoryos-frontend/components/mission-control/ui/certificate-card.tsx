import React from "react";
import { Shield, Award, CheckCircle } from "lucide-react";
import { HoverLift } from "./animations";

export type CertificateCardProps = {
 id: string;
 issuer: string;
 subject: string;
 issuedAt: string;
 validUntil: string;
 className?: string;
};

export function CertificateCard({
 id,
 issuer,
 subject,
 issuedAt,
 validUntil,
 className = "",
}: CertificateCardProps) {
 return (
 <HoverLift className={`group relative w-full bg-card border border-border rounded-[6px] overflow-hidden p-6 ${className}`}>
 <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
 <Award className="size-24" />
 </div>
 
 <div className="flex items-start gap-6 relative z-10">
 <div className="p-3 bg-[#0f52ff]/5 border border-[#0f52ff]/10 rounded-[6px] text-[#0f52ff]">
 <Shield className="size-6" />
 </div>
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-1">
 <h4 className="text-[15px] font-semibold text-foreground leading-tight">Verification Certificate</h4>
 <CheckCircle className="size-3.5 text-emerald-500" />
 </div>
 <p className="text-[11px] font-mono text-foreground/40 mb-4">{id}</p>
 
 <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[12px]">
 <div>
 <div className="text-[10px] uppercase font-semibold text-foreground/40 mb-0.5">Subject</div>
 <div className="font-medium text-foreground">{subject}</div>
 </div>
 <div>
 <div className="text-[10px] uppercase font-semibold text-foreground/40 mb-0.5">Issuer</div>
 <div className="font-medium text-foreground">{issuer}</div>
 </div>
 <div>
 <div className="text-[10px] uppercase font-semibold text-foreground/40 mb-0.5">Issued</div>
 <div className="font-medium text-foreground/90">{issuedAt}</div>
 </div>
 <div>
 <div className="text-[10px] uppercase font-semibold text-foreground/40 mb-0.5">Valid Until</div>
 <div className="font-medium text-foreground/90">{validUntil}</div>
 </div>
 </div>
 </div>
 </div>
 </HoverLift>
 );
}
