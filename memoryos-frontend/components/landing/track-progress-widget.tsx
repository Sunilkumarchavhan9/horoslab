import React from "react";
import { Plus, ChevronDown } from "lucide-react";

export function TrackProgressWidget() {
  return (
    <div className="w-full flex flex-col gap-2.5 rounded-[1.25rem] bg-[#f5f6f8] p-3 shadow-inner border border-slate-200/60 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-1 pt-1 pb-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-slate-200/70 flex items-center justify-center shadow-sm">
            <div className="w-3.5 h-3.5 rounded-full border-[3.5px] border-white bg-slate-300/50 shadow-sm"></div>
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-slate-800 leading-tight">Institution Review</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Fitness against reality metrics.</p>
          </div>
        </div>
        <button className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md text-[12px] font-bold text-slate-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:bg-slate-50 transition-colors">
          Add new <Plus className="w-3.5 h-3.5" strokeWidth={3} />
        </button>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white rounded-md p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h4 className="text-[13px] font-bold text-slate-700">Production Variances</h4>
          <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
            6 month <ChevronDown className="w-3 h-3" strokeWidth={3} />
          </button>
        </div>

        {/* Chart Graphic Simulation */}
        <div className="relative w-full h-[150px]">
          {/* Horizontal Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pt-2 pb-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-px border-b border-dashed border-slate-100"></div>
            ))}
          </div>

          {/* Lines (SVG) */}
          <svg className="absolute inset-0 w-full h-full pb-6 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Green Line */}
            <path d="M 0 50 L 5 45 L 10 50 L 15 30 L 20 60 L 25 70 L 30 65 L 35 45 L 45 40 L 50 42 L 55 45 L 60 30 L 65 35 L 75 35 L 85 45 L 90 60 L 95 65 L 100 55" fill="none" stroke="#34d399" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50" />
            {/* Blue Line */}
            <path d="M 0 60 L 5 65 L 10 40 L 15 80 L 20 50 L 25 20 L 30 15 L 35 30 L 40 40 L 45 35 L 50 45 L 55 40 L 60 70 L 65 80 L 70 85 L 80 85 L 85 90 L 90 85 L 95 65 L 100 70" fill="none" stroke="#60a5fa" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50" />
            {/* Purple Line */}
            <path d="M 0 40 L 5 35 L 10 30 L 15 50 L 20 70 L 25 80 L 30 90 L 35 85 L 40 75 L 45 70 L 50 85 L 55 90 L 60 75 L 65 65 L 70 75 L 75 80 L 80 90 L 85 90 L 90 85 L 95 90 L 100 80" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-60" />
          </svg>

          {/* Tooltips */}
          {/* Blue Tooltip */}
          <div className="absolute top-[35px] left-[45%] transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-[#60a5fa] ring-[3px] ring-white shadow-sm z-10 mb-1.5"></div>
            <div className="bg-white px-2 py-1.5 rounded-[10px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] min-w-[120px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-sm bg-[#60a5fa]"></div>
                <span className="text-[9px] text-[#60a5fa] font-bold">Outcome Delta</span>
              </div>
              <div className="text-[11px] font-extrabold text-slate-800 pl-3.5">$24,980.00</div>
            </div>
          </div>

          {/* Green Tooltip */}
          <div className="absolute top-[50px] left-[70%] transform -translate-x-1/2 flex flex-col items-center">
            <div className="w-2 h-2 rounded-full bg-[#34d399] ring-[3px] ring-white shadow-sm z-10 mb-1.5"></div>
            <div className="bg-white px-2 py-1.5 rounded-[10px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] min-w-[140px]">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-sm bg-[#34d399]"></div>
                <span className="text-[9px] text-[#34d399] font-bold">Reviewed Protection</span>
              </div>
              <div className="text-[11px] font-extrabold text-slate-800 pl-3.5">$1,974.00</div>
            </div>
          </div>

          {/* Purple Tooltip */}
          <div className="absolute bottom-[25px] left-[60%] transform -translate-x-1/2 flex flex-col items-center">
            <div className="bg-white px-2 py-1.5 rounded-[10px] border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.08)] min-w-[110px] mb-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-2 h-2 rounded-sm bg-[#8b5cf6]"></div>
                <span className="text-[9px] text-[#8b5cf6] font-bold">Confirmed Failure</span>
              </div>
              <div className="text-[11px] font-extrabold text-slate-800 pl-3.5">$836.00</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-[#8b5cf6] ring-[3px] ring-white shadow-sm z-10"></div>
          </div>

          {/* X Axis Labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-[10px] font-bold text-slate-400 px-4">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="flex flex-col gap-2.5">
        {/* Prediction Accuracy */}
        <div className="bg-white rounded-md p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[13px] font-bold text-slate-700">Settlement Accuracy</h4>
            <span className="text-[13px] font-bold text-[#3b82f6]">87%</span>
          </div>
          <div className="flex items-center justify-between gap-[3px] w-full relative">
            {[...Array(35)].map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-[22px] rounded-full ${i < 30 ? 'bg-gradient-to-b from-[#60a5fa] to-[#3b82f6] shadow-sm' : 'bg-gradient-to-b from-slate-100 to-slate-200 shadow-inner'}`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-300 font-bold mt-2 px-1">
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>

        {/* Failure Resolution */}
        <div className="bg-white rounded-md p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[13px] font-bold text-slate-700">Failure Resolution</h4>
            <span className="text-[13px] font-bold text-[#8b5cf6]">58%</span>
          </div>
          <div className="flex items-center justify-between gap-[3px] w-full relative">
            {[...Array(35)].map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-[22px] rounded-full ${i < 20 ? 'bg-gradient-to-b from-[#a78bfa] to-[#8b5cf6] shadow-sm' : 'bg-gradient-to-b from-slate-100 to-slate-200 shadow-inner'}`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-300 font-bold mt-2 px-1">
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>

        {/* Protection Coverage */}
        <div className="bg-white rounded-md p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-[13px] font-bold text-slate-700">Fitness Coverage</h4>
            <span className="text-[13px] font-bold text-[#10b981]">76%</span>
          </div>
          <div className="flex items-center justify-between gap-[3px] w-full relative">
            {[...Array(35)].map((_, i) => (
              <div 
                key={i} 
                className={`flex-1 h-[22px] rounded-full ${i < 26 ? 'bg-gradient-to-b from-[#34d399] to-[#10b981] shadow-sm' : 'bg-gradient-to-b from-slate-100 to-slate-200 shadow-inner'}`}
              ></div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-300 font-bold mt-2 px-1">
            <span>0</span>
            <span>20</span>
            <span>40</span>
            <span>60</span>
            <span>80</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
}


