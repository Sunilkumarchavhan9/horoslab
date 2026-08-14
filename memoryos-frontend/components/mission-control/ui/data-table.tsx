import React, { useState } from "react";
import { useReactTable, getCoreRowModel, flexRender, ColumnDef } from "@tanstack/react-table";
import { ChevronRight, ChevronDown } from "lucide-react";

export function DataTable<TData, TValue>({
 columns,
 data,
}: {
 columns: ColumnDef<TData, TValue>[];
 data: TData[];
}) {
 const table = useReactTable({
 data,
 columns,
 getCoreRowModel: getCoreRowModel(),
 });

 return (
 <div className="w-full border border-border rounded-[6px] overflow-hidden bg-card">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-sm">
 <thead className="bg-muted/50 border-b border-border">
 {table.getHeaderGroups().map((headerGroup) => (
 <tr key={headerGroup.id}>
 {headerGroup.headers.map((header) => (
 <th key={header.id} className="px-6 py-2.5 text-[11px] font-semibold text-foreground/60 uppercase tracking-wider">
 {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
 </th>
 ))}
 </tr>
 ))}
 </thead>
 <tbody className="divide-y divide-black/5">
 {table.getRowModel().rows.map((row) => (
 <tr key={row.id} className="hover:bg-muted/50 transition-colors">
 {row.getVisibleCells().map((cell) => (
 <td key={cell.id} className="px-6 py-3 text-[13px] text-foreground">
 {flexRender(cell.column.columnDef.cell, cell.getContext())}
 </td>
 ))}
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
