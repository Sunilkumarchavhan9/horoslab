import React from "react";
import {
 Table as ShadcnTable,
 TableHeader,
 TableBody,
 TableFooter,
 TableHead,
 TableRow,
 TableCell,
 TableCaption,
} from "@/components/ui/table";

export function Table({ children, className }: { children: React.ReactNode, className?: string }) {
 return <ShadcnTable className={className}>{children}</ShadcnTable>;
}

export {
 TableHeader,
 TableBody,
 TableFooter,
 TableHead,
 TableRow,
 TableCell,
 TableCaption,
};
