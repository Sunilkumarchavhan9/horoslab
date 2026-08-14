import React from "react";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items }: { items: { label: string, href?: string }[] }) {
 return (
 <nav className="flex items-center text-[12px] font-medium text-foreground/50">
 {items.map((item, index) => (
 <React.Fragment key={index}>
 {index > 0 && <ChevronRight className="size-3.5 mx-1.5 opacity-50" />}
 {item.href ? (
 <a href={item.href} className="hover:text-foreground transition-colors">{item.label}</a>
 ) : (
 <span className="text-foreground">{item.label}</span>
 )}
 </React.Fragment>
 ))}
 </nav>
 );
}
