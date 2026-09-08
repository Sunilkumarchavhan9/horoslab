import React from "react";

export function ControlCharts() {
  return (
    <div className="w-full h-full flex flex-row gap-6 p-6 bg-white border border-slate-100 rounded-md shadow-sm font-sans mb-6">
      
      {/* 1. Stacked Bar Chart (Budget Allocation) */}
      <div className="flex flex-col w-[120px] shrink-0 border-r border-slate-100 pr-6">
        <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-4">Budget Allocation</h4>
        
        <div className="flex flex-row items-end h-[160px] gap-4">
          {/* Y Axis */}
          <div className="flex flex-col justify-between h-full text-[10px] text-slate-400 font-mono pb-4">
            <span>850</span>
            <span>600</span>
            <span>350</span>
            <span>100</span>
            <span>0</span>
          </div>

          {/* The Stacked Bar */}
          <div className="flex flex-col w-12 h-full justify-end group">
            {/* Experiment Budget (100) */}
            <div className="w-full bg-blue-300 h-[12%] flex items-center justify-center text-[#F0EFE2] text-[10px] font-bold opacity-90 group-hover:opacity-100 transition-opacity">
              100
            </div>
            {/* Subject Scope (250) */}
            <div className="w-full bg-blue-500 h-[29%] flex items-center justify-center text-[#F0EFE2] text-[10px] font-bold opacity-90 group-hover:opacity-100 transition-opacity">
              250
            </div>
            {/* Parameter Authority (500) */}
            <div className="w-full bg-blue-700 h-[59%] flex items-center justify-center text-[#F0EFE2] text-[11px] font-bold shadow-inner">
              500
            </div>
            {/* X Axis Label */}
            <div className="text-center text-[10px] font-bold text-slate-500 mt-2">MAX</div>
          </div>
        </div>
      </div>

      {/* Right Side: Scatter and Combo Charts */}
      <div className="flex flex-col flex-1 gap-6">
        
        {/* 2. Scatter Plot (Subject Scope / Repositories) */}
        <div className="flex flex-col h-1/2">
          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Subject Scope Heatmap</h4>
          <div className="flex-1 relative flex items-end ml-4">
            {/* Y Axis */}
            <div className="absolute -left-6 top-0 bottom-6 flex flex-col justify-between text-[8px] text-slate-400 font-mono">
              <span>30</span>
              <span>20</span>
              <span>10</span>
              <span>0</span>
            </div>
            
            {/* Grid Area */}
            <div className="w-full h-full pb-5 relative">
              {/* Vertical Grid Lines */}
              <div className="absolute inset-0 flex justify-between px-2 pb-5">
                <div className="h-full w-[1px] bg-slate-100"></div>
                <div className="h-full w-[1px] bg-slate-100"></div>
                <div className="h-full w-[1px] bg-slate-100"></div>
                <div className="h-full w-[1px] bg-slate-100"></div>
                <div className="h-full w-[1px] bg-slate-100"></div>
              </div>
              
              {/* Scatter Points */}
              <div className="absolute w-2 h-2 rounded-full bg-blue-800 bottom-[10%] left-[5%]"></div>
              <div className="absolute w-2 h-2 rounded-full bg-blue-500 bottom-[15%] left-[5%] opacity-70"></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-300 bottom-[50%] left-[5%]"></div>
              
              <div className="absolute w-2 h-2 rounded-full bg-blue-800 bottom-[20%] left-[25%]"></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-blue-400 bottom-[35%] left-[25%]"></div>
              
              <div className="absolute w-2 h-2 rounded-full bg-blue-800 bottom-[30%] left-[50%]"></div>
              <div className="absolute w-2 h-2 rounded-full bg-blue-600 bottom-[40%] left-[50%]"></div>
              <div className="absolute w-2 h-2 rounded-full bg-blue-400 bottom-[55%] left-[50%] opacity-80"></div>
              
              <div className="absolute w-2 h-2 rounded-full bg-blue-700 bottom-[65%] left-[75%]"></div>
              <div className="absolute w-1.5 h-1.5 rounded-full bg-slate-400 bottom-[40%] left-[75%]"></div>
              
              <div className="absolute w-2 h-2 rounded-full bg-blue-800 bottom-[90%] left-[95%]"></div>
              <div className="absolute w-2 h-2 rounded-full bg-blue-500 bottom-[80%] left-[95%]"></div>
              
              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1 text-[8px] text-slate-400 font-mono">
                <span>0</span>
                <span>3</span>
                <span>6</span>
                <span>9</span>
                <span>12</span>
              </div>
            </div>
            
            {/* Legend */}
            <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-center gap-1 text-[7px] font-bold text-slate-500">
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-800"></div> Env</div>
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Repo</div>
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> PR</div>
              <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div> API</div>
            </div>
          </div>
        </div>

        {/* 3. Bar + Line Combo Chart (Token Usage / Velocity) */}
        <div className="flex flex-col h-1/2">
          <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">Token Velocity</h4>
          <div className="flex-1 relative flex items-end ml-4">
            {/* Y Axis */}
            <div className="absolute -left-6 top-0 bottom-5 flex flex-col justify-between text-[8px] text-slate-400 font-mono">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
            </div>
            
            {/* Chart Area */}
            <div className="w-full h-[60px] pb-4 relative flex items-end justify-between px-4">
              {/* Bars */}
              <div className="w-6 bg-blue-400 h-[30%]"></div>
              <div className="w-6 bg-blue-400 h-[25%]"></div>
              <div className="w-6 bg-blue-400 h-[70%]"></div>
              <div className="w-6 bg-blue-400 h-[80%]"></div>
              
              {/* Line overlay (SVG) */}
              <svg className="absolute inset-0 w-full h-[44px] bottom-4 z-10 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 10 75 L 37 50 L 63 45 L 90 5" fill="none" stroke="#1e3a8a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>

              {/* X Axis Labels */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-5 text-[9px] font-bold text-slate-500">
                <span>A</span>
                <span>B</span>
                <span>C</span>
                <span>D</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


