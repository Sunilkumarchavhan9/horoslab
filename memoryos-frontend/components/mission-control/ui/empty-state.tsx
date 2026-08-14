import React from "react";

export function EmptyState({ 
 icon, 
 title, 
 description, 
 action 
}: { 
 icon?: React.ReactNode; 
 title: string; 
 description: string;
 action?: React.ReactNode;
}) {
 return (
 <div className="w-full flex flex-col items-center justify-center p-8 text-center border border-border border-dashed rounded-[6px] bg-muted/50">
 {icon && <div className="mb-4 text-foreground/40">{icon}</div>}
 <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
 <p className="text-xs text-muted-foreground max-w-[250px] mb-4">{description}</p>
 {action && <div>{action}</div>}
 </div>
 );
}
