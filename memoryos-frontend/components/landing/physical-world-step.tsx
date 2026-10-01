"use client";

import React from "react";
import { Radio, Eye, AlertTriangle, ShieldCheck, Activity, Compass, Navigation } from "lucide-react";

export function PhysicalWorldStep() {
  return (
    <div className="w-full h-full flex flex-col justify-between border border-dashed border-[#333333] p-6 lg:p-8 bg-[#151515] rounded-[1px] font-mono text-sm select-none">
      
      {/* Header Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Live Stream Icon */}
            <div className="flex items-center justify-center w-6 h-6 bg-[#182010] rounded-[1px] border border-[#2e4719] text-[#75bf00]">
              <Radio size={13} strokeWidth={2.2} className="animate-pulse" />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[#F0EFE2] font-medium text-[13px]">Decode reality</span>
              <span className="text-[10px] text-[#C8C7BA] font-mono">· VEHICLE-07</span>
            </div>

            {/* Live Badge */}
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-[1px] border border-[#2a2a2a] bg-[#181818] text-[10px] text-[#A3A3A3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#75bf00] animate-pulse"></span>
              live stream
            </span>
          </div>

          <div className="text-[10px] text-[#A3A3A3] px-2.5 py-0.5 rounded-[1px] bg-[#181818] border border-[#2a2a2a]">
            98 FPS
          </div>
        </div>

        <div className="text-[#C8C7BA] text-[11px] pl-8">
          Ingesting Camera-01, Camera-02, LiDAR-01, and CAN-Bus telemetry.
        </div>
      </div>

      {/* Spatial Detection & World State Box */}
      <div className="p-3.5 rounded-[1px] border border-[#222222] bg-[#141414] space-y-3">
        <div className="flex items-center justify-between text-[9px] text-[#666666] uppercase tracking-wider font-semibold">
          <span className="flex items-center gap-1.5">
            <Compass size={11} className="text-[#75bf00]" />
            SPATIAL RADAR & DETECTED ENTITIES
          </span>
          <span>DEPTH: 98.4% CONF</span>
        </div>

        {/* Entity List */}
        <div className="divide-y divide-[#1c1c1c] text-[11px]">
          
          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping"></span>
              <span className="text-[#F0EFE2] font-medium">pedestrian</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#75bf00] font-semibold">14.2m</span>
              <span className="text-[#555555] text-[10px]">98% conf</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
              <span className="text-[#cccccc]">cyclist</span>
              <span className="text-[10px] text-[#C8C7BA]">parallel northbound</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#F0EFE2] font-medium">21.1m</span>
              <span className="text-[#555555] text-[10px]">94% conf</span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]"></span>
              <span className="text-[#cccccc]">vehicle</span>
              <span className="text-[10px] text-[#C8C7BA]">rel speed -8 km/h</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[#F0EFE2] font-medium">31.4m</span>
              <span className="text-[#555555] text-[10px]">99% conf</span>
            </div>
          </div>

        </div>

        {/* Environmental Parameters */}
        <div className="pt-2 border-t border-[#1f1f1f] flex items-center justify-between text-[10px] text-[#777777]">
          <span>Speed: <strong className="text-[#F0EFE2]">42 km/h</strong></span>
          <span>Road: <strong className="text-[#38BDF8]">wet surface</strong></span>
          <span>Visibility: <strong className="text-[#F0EFE2]">moderate</strong></span>
        </div>

        {/* Predicted Next State */}
        <div className="pt-2 border-t border-[#1f1f1f] flex items-start gap-2 text-[10px]">
          <span className="text-[#666666] font-semibold uppercase tracking-wider mt-0.5 shrink-0">PREDICTED NEXT STATE:</span>
          <span className="text-[#EF4444] bg-[#291414] border border-[#481c1c] px-1.5 py-0.5 rounded-[1px]">
            pedestrian likely enters path in 1.4s
          </span>
        </div>
      </div>

      {/* Uncertainty & Unknowns Warning */}
      <div className="p-2.5 rounded-[1px] bg-[#1a1812] border border-[#3b3118] text-[10px] flex items-center justify-between text-[#F59E0B]">
        <div className="flex items-center gap-2">
          <AlertTriangle size={12} className="shrink-0" />
          <span>Camera-02 partially occluded (Uncertainty: 0.38)</span>
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded-[1px] bg-[#272115] border border-[#524422] text-[#FBBF24]">
          Fallback to LiDAR-01
        </span>
      </div>

      {/* Deliverable & Actuation Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-[#222222]">
        <div className="flex items-center gap-2 text-[10px] text-[#C8C7BA]">
          <ShieldCheck size={12} className="text-[#75bf00]" />
          <span>Deliverable: <strong className="text-[#F0EFE2]">WorldState:v4</strong></span>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-[1px] border border-[#333333] bg-[#1a1a1a] text-[10px] text-[#F0EFE2] hover:bg-[#252525] transition-colors">
            Simulate
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-[1px] border border-[#333333] bg-[#1a1a1a] text-[10px] text-[#F0EFE2] hover:bg-[#252525] transition-colors">
            Recommend
          </button>
          <button className="flex items-center gap-1 px-2.5 py-1 rounded-[1px] border border-[#333333] bg-[#1a1a1a] text-[10px] text-[#F0EFE2] hover:bg-[#252525] transition-colors">
            Continue Observation
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1 rounded-[1px] bg-[#75bf00] text-black font-semibold text-[10px] hover:bg-[#86d900] transition-colors shadow-[0_0_8px_rgba(117,191,0,0.3)]">
            <Navigation size={11} className="fill-black" />
            Act (Brake +0.4g)
          </button>
        </div>
      </div>

    </div>
  );
}
