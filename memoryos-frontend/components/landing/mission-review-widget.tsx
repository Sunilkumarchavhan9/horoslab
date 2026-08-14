"use client";
import React from "react";
import { Plus, ChevronDown } from "lucide-react";

export function MissionReviewWidget() {
  const segments = 28; // Number of pills in a row

  return (
    <div className="w-full max-w-[420px] flex flex-col gap-3 font-sans relative z-30">
      {/* Header Card */}
      <div className="bg-white rounded-md p-4 flex items-center shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/50">
        <div className="w-10 h-10 bg-[#f1f5f9] rounded-md flex items-center justify-center mr-4">
          <div className="w-3 h-3 rounded-full border-[2.5px] border-white bg-[#cbd5e1] shadow-sm"></div>
        </div>
        <div className="flex-1">
          <h3 className="text-[15px] font-bold text-slate-900 leading-tight mb-0.5">Institution Review</h3>
          <p className="text-[11px] text-slate-500 font-medium">Fitness against reality metrics.</p>
        </div>
        <button className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 text-[11px] font-bold px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors shadow-sm">
          Add new <Plus size={14} className="text-slate-500" />
        </button>
      </div>

      {/* Chart Card */}
      <div className="bg-white rounded-md p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/50 pb-6 relative">
        <div className="flex items-center justify-between mb-8">
          <h4 className="text-[13px] font-bold text-slate-800">Institution Variances</h4>
          <div className="flex items-center gap-1.5 border border-slate-200 px-2 py-1 rounded-md text-[11px] font-bold text-slate-600 cursor-pointer hover:bg-slate-50">
            6 month <ChevronDown size={14} className="text-slate-400" />
          </div>
        </div>

        {/* Chart Area */}
        <div className="relative w-full h-[100px]">
          {/* Background Grid Lines */}
          <div className="absolute top-[10%] left-0 w-full border-t border-dashed border-slate-200/80"></div>
          <div className="absolute top-[50%] left-0 w-full border-t border-dashed border-slate-200/80"></div>
          <div className="absolute top-[90%] left-0 w-full border-t border-dashed border-slate-200/80"></div>

          {/* SVG Chart */}
          <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 300 100">
            {/* Purple Line */}
            <path
              d="M 0 35 C 30 25, 40 70, 70 85 C 100 100, 150 70, 200 85 C 240 95, 270 80, 300 65"
              fill="none"
              stroke="#a855f7" 
              strokeWidth="2.5"
              className="opacity-70"
            />
            {/* Green Line */}
            <path
              d="M 0 45 C 30 20, 50 85, 80 75 C 110 60, 140 20, 170 25 C 210 30, 250 35, 280 60 C 290 70, 300 50, 300 50"
              fill="none"
              stroke="#2dd4bf" 
              strokeWidth="2.5"
              className="opacity-70"
            />
            {/* Blue Line */}
            <path
              d="M 0 65 C 25 70, 40 30, 70 15 C 100 0, 110 45, 130 50 C 150 55, 180 30, 240 30 C 270 30, 280 65, 300 75"
              fill="none"
              stroke="#3b82f6" 
              strokeWidth="2.5"
            />
            
            {/* Data Points */}
            <circle cx="130" cy="50" r="4" fill="#3b82f6" className="drop-shadow-sm" />
            <circle cx="170" cy="85" r="4" fill="#a855f7" className="drop-shadow-sm" />
            <circle cx="210" cy="30" r="4" fill="#2dd4bf" className="drop-shadow-sm" />
          </svg>

          {/* Tooltip Overlay */}
          <div className="absolute top-[10px] left-[100px] bg-white rounded-md p-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 z-10 min-w-[140px] flex gap-4 pointer-events-none">
            {/* Prediction Delta */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 bg-blue-500 rounded-[2px]"></div>
                <span className="text-[9px] font-bold text-blue-500">Outcome Delta</span>
              </div>
              <div className="text-[13px] font-extrabold text-slate-900">$24,980.00</div>
            </div>
            
            {/* Confirmed Failure */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 bg-purple-500 rounded-[2px]"></div>
                <span className="text-[9px] font-bold text-purple-500">Confirmed Failure</span>
              </div>
              <div className="text-[13px] font-extrabold text-slate-900">$836.00</div>
            </div>
          </div>
        </div>

        {/* X-Axis Labels */}
        <div className="flex items-center justify-between px-4 mt-3 text-[11px] font-bold text-slate-400">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
        </div>
      </div>

      {/* Progress Bars */}
      <ProgressRow title="Settlement Accuracy" percent={87} colorClass="bg-blue-500" textClass="text-blue-500" totalSegments={segments} />
      <ProgressRow title="Failure Resolution" percent={58} colorClass="bg-purple-500" textClass="text-purple-500" totalSegments={segments} />
      <ProgressRow title="Fitness Coverage" percent={76} colorClass="bg-emerald-500" textClass="text-emerald-500" totalSegments={segments} />
    </div>
  );
}

function ProgressRow({ title, percent, colorClass, textClass, totalSegments }: { title: string, percent: number, colorClass: string, textClass: string, totalSegments: number }) {
  const activeCount = Math.round((percent / 100) * totalSegments);

  return (
    <div className="bg-white rounded-md p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100/50">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-[12px] font-bold text-slate-800">{title}</h4>
        <span className={`text-[12px] font-extrabold ${textClass}`}>{percent}%</span>
      </div>
      
      <div className="flex items-center justify-between gap-[2px]">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-5 rounded-[4px] ${i < activeCount ? colorClass : 'bg-slate-100'}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 text-[9px] font-bold text-slate-300">
        <span>0</span>
        <span>20</span>
        <span>40</span>
        <span>60</span>
        <span>80</span>
        <span>100</span>
      </div>
    </div>
  );
}


