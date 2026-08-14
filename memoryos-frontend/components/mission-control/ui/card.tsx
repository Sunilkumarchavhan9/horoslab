import React from "react";
import { Card as ShadcnCard, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

export function Card({ children, className }: { children: React.ReactNode, className?: string }) {
 return <ShadcnCard className={className}>{children}</ShadcnCard>;
}

export { CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
