"use client";

import React, { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Search, Bell, Settings, FileText, User, ChevronRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

// --- CommandPalette & SearchBar ---
export function CommandPalette({ open, setOpen }: { open: boolean, setOpen: (open: boolean) => void }) {
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [setOpen]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-black/10 overflow-hidden" onClick={e => e.stopPropagation()}>
        <Command className="w-full" loop>
          <div className="flex items-center border-b border-black/10 px-3 py-2">
            <Search className="size-5 text-black/40 mr-2" />
            <Command.Input
              autoFocus
              className="w-full bg-transparent border-none outline-none text-[15px] placeholder:text-black/30"
              placeholder="Search components, missions, or agents..."
            />
            <Button variant="ghost" size="icon" className="h-6 w-6 ml-2" onClick={() => setOpen(false)}>
              <span className="text-[10px] text-black/50 border border-black/10 rounded px-1">ESC</span>
            </Button>
          </div>
          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-smooth">
            <Command.Empty className="py-6 text-center text-sm text-black/40">No results found.</Command.Empty>

            <Command.Group heading="Suggestions" className="text-xs font-medium text-black/40 px-2 py-1.5">
              <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-black/5 cursor-pointer text-sm text-[#111] aria-selected:bg-black/5">
                <FileText className="size-4 text-black/40" /> Active Missions
              </Command.Item>
              <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-black/5 cursor-pointer text-sm text-[#111] aria-selected:bg-black/5">
                <Settings className="size-4 text-black/40" /> Settings
              </Command.Item>
            </Command.Group>

            <Command.Group heading="Agents" className="text-xs font-medium text-black/40 px-2 py-1.5 mt-2">
              <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-black/5 cursor-pointer text-sm text-[#111] aria-selected:bg-black/5">
                <User className="size-4 text-black/40" /> Research Agent alpha-09
              </Command.Item>
              <Command.Item className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-black/5 cursor-pointer text-sm text-[#111] aria-selected:bg-black/5">
                <User className="size-4 text-black/40" /> Code Reviewer sys-4
              </Command.Item>
            </Command.Group>
          </Command.List>
        </Command>
      </div>
      {/* Background click to close */}
      <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
    </div>
  );
}

export function SearchBar({ onOpenCommandPalette }: { onOpenCommandPalette?: () => void }) {
  return (
    <div
      onClick={onOpenCommandPalette}
      className="flex items-center gap-2 px-3 py-1.5 bg-black/5 hover:bg-black/10 transition-colors rounded-[6px] border border-black/10 cursor-text w-64 group"
    >
      <Search className="size-3.5 text-black/40 group-hover:text-black/60 transition-colors" />
      <span className="text-[13px] text-black/40 flex-1 select-none group-hover:text-black/60 transition-colors">Search...</span>
      <div className="flex items-center gap-0.5 text-[10px] font-medium text-black/40 bg-white border border-black/10 rounded-sm px-1.5 py-0.5 shadow-sm">
        <span className="text-xs">⌘</span><span>K</span>
      </div>
    </div>
  );
}

// --- NotificationPanel ---
export function NotificationPanel({ notifications }: { notifications: { id: string, title: string, desc: string, isRead: boolean, time: string }[] }) {
  return (
    <div className="w-[320px] bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden flex flex-col max-h-[400px]">
      <div className="px-4 py-3 border-b border-black/5 flex items-center justify-between bg-black/[0.02]">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-black/60" />
          <span className="font-medium text-sm text-[#111]">Notifications</span>
        </div>
        <span className="text-[11px] font-medium text-black/50 bg-black/5 px-2 py-0.5 rounded-full">
          {notifications.filter(n => !n.isRead).length} new
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-black/40">No new notifications</div>
        ) : (
          <div className="divide-y divide-black/5">
            {notifications.map((n) => (
              <div key={n.id} className={`p-4 hover:bg-black/[0.02] transition-colors cursor-pointer relative ${!n.isRead ? 'bg-blue-50/30' : ''}`}>
                {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#0f52ff]" />}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className={`text-[13px] ${!n.isRead ? 'font-medium text-[#111]' : 'font-medium text-[#333]'}`}>{n.title}</h4>
                  <span className="text-[10px] text-black/40 whitespace-nowrap">{n.time}</span>
                </div>
                <p className="text-[12px] text-black/60 leading-relaxed line-clamp-2">{n.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-2 border-t border-black/5 bg-black/[0.01]">
        <Button variant="ghost" className="w-full text-[12px] h-8 text-black/60 hover:text-[#111]">
          Mark all as read
        </Button>
      </div>
    </div>
  );
}

// --- SplitPane / ResizablePanel (Simplified Showcase Version) ---
export function SplitPaneShowcase() {
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const container = document.getElementById("split-pane-container");
      if (container) {
        const rect = container.getBoundingClientRect();
        const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
        if (newWidth > 20 && newWidth < 80) {
          setLeftWidth(newWidth);
        }
      }
    };
    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div
      id="split-pane-container"
      className="w-full h-[300px] border border-black/10 rounded-[6px] overflow-hidden flex bg-black/5 relative"
    >
      <div style={{ width: `${leftWidth}%` }} className="h-full bg-white flex flex-col">
        <div className="h-10 border-b border-black/5 flex items-center px-4 font-medium text-xs text-[#111]">
          Explorer
        </div>
        <div className="p-4 text-xs text-black/40">
          Left Panel Content
        </div>
      </div>

      {/* Resizer Handle */}
      <div
        className={`w-1 h-full cursor-col-resize relative z-10 flex items-center justify-center group ${isDragging ? 'bg-[#0f52ff]' : 'bg-transparent hover:bg-black/20'} transition-colors`}
        onMouseDown={() => setIsDragging(true)}
      >
        <div className={`w-1 h-8 rounded-full ${isDragging ? 'bg-white' : 'bg-black/20 group-hover:bg-white'} transition-colors`} />
      </div>

      <div style={{ width: `${100 - leftWidth}%` }} className="h-full bg-[#fafafa] flex flex-col">
        <div className="h-10 border-b border-black/5 flex items-center px-4 font-medium text-xs text-[#111]">
          Editor
        </div>
        <div className="p-4 text-xs text-black/40">
          Right Panel Content
        </div>
      </div>
    </div>
  );
}
