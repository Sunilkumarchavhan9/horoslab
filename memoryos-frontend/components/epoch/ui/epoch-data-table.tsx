"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  className?: string;
  align?: "left" | "center" | "right";
}

interface EpochDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  keyExtractor: (row: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
}

export function EpochDataTable<T>({
  columns,
  data,
  onRowClick,
  keyExtractor,
  emptyMessage = "No records found.",
  className,
}: EpochDataTableProps<T>) {
  return (
    <div className={cn("overflow-hidden border border-[#d8ddd3] bg-white", className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-[#e1e4df] bg-[#fafbfa] text-[10px] uppercase tracking-[0.12em] text-[#80887a]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={cn(
                    "whitespace-nowrap px-4 py-3 font-semibold",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0eb]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-xs text-[#788072]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, rowIdx) => (
                <tr
                  key={keyExtractor(row, rowIdx)}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    onRowClick && "cursor-pointer hover:bg-[#f7f9f6]"
                  )}
                >
                  {columns.map((col, colIdx) => {
                    let cellContent: React.ReactNode;
                    if (typeof col.accessor === "function") {
                      cellContent = col.accessor(row);
                    } else if (col.accessor) {
                      cellContent = String(row[col.accessor] ?? "-");
                    } else {
                      cellContent = null;
                    }

                    return (
                      <td
                        key={colIdx}
                        className={cn(
                          "px-4 py-3.5 text-[#1f241d]",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center",
                          col.className
                        )}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
