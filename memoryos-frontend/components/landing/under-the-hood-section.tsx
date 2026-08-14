"use client";

import { Reveal } from "./motion";
import { 
  Key, ArrowRight, Bot, Search, Sparkles, Brain, Compass, Star, X, Box, Check, 
  CheckCircle2, LayoutTemplate, Tag, MapPin, BarChart3, Clock, Download, 
  ExternalLink, Activity, Plus, Settings, Eye, MousePointerClick, MoreHorizontal,
  ChevronDown
} from "lucide-react";

export function UnderTheHoodSection() {
  return (
    <section className="w-full bg-[#FAFAFA] relative py-24 md:py-32 overflow-hidden border-b border-slate-200">
      <div className="max-w-[1300px] mx-auto px-6 relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col gap-6 max-w-5xl mb-16">
          <div className="flex items-center gap-2 bg-white border border-slate-200 shadow-sm rounded-full px-3.5 py-1.5 w-fit">
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[13px] font-semibold text-slate-700">Key features</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            <h2 className="text-3xl md:text-[44px] font-semibold text-slate-900 tracking-tight leading-[1.15]">
              Turn AI search insights into new customers with memoryos™
            </h2>
            <p className="text-lg md:text-[20px] text-slate-500 font-medium leading-relaxed pt-2 lg:pt-4">
              Identify the prompts that matter, monitor your rankings, and act before your competitors do.
            </p>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
           
           {/* ---------------------------------------------------- */}
           {/* Card 1: Set up Prompts */}
           <div className="xl:col-span-7 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden group">
              <div className="max-w-[400px] mb-8 relative z-10">
                 <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Set up Prompts</h3>
                 <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                   Prompts are the foundation of your AI search strategy. Uncover and organize the prompts that matter most for your AI search strategy.
                 </p>
              </div>
              
              <div className="flex-1 w-full bg-[#F8F9FA] rounded-[24px] border border-slate-100 shadow-inner overflow-hidden relative min-h-[300px] p-6 flex flex-col items-center justify-center">
                 {/* Decorative Top Bar */}
                 <div className="w-full flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                       <LayoutTemplate className="w-4 h-4 text-slate-400" />
                       <span className="text-[13px] font-semibold text-slate-600">Tracked Prompts</span>
                    </div>
                    <div className="flex gap-2">
                       <div className="bg-white border border-slate-200 rounded-full px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Add Prompts</div>
                       <div className="bg-slate-900 rounded-full px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1"><Settings className="w-3 h-3" /> Action</div>
                    </div>
                 </div>

                 {/* Fake Table */}
                 <div className="w-full flex flex-col gap-4">
                    <div className="grid grid-cols-12 gap-4 border-b border-slate-200 pb-2 px-2">
                       <div className="col-span-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Prompt</div>
                       <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Visibility</div>
                       <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Clicks</div>
                       <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Est. Volume</div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 items-center bg-white rounded-md p-3 shadow-sm border border-slate-100">
                       <div className="col-span-6 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                          <span className="text-[12px] font-semibold text-slate-700 truncate">Best AI sales CRM 2024</span>
                       </div>
                       <div className="col-span-2 flex justify-center"><div className="bg-emerald-50 text-emerald-600 font-bold text-[11px] px-2 py-0.5 rounded-md">80%</div></div>
                       <div className="col-span-2 text-[12px] font-semibold text-slate-600 text-center">2,400</div>
                       <div className="col-span-2 flex justify-center"><div className="bg-blue-50 text-[#0015FF] font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">High</div></div>
                    </div>
                    <div className="grid grid-cols-12 gap-4 items-center bg-white/50 rounded-md p-3 border border-slate-100/50">
                       <div className="col-span-6 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                          <span className="text-[12px] font-semibold text-slate-500 truncate">CRM for fast growing companies</span>
                       </div>
                       <div className="col-span-2 flex justify-center"><div className="bg-slate-50 text-slate-600 font-bold text-[11px] px-2 py-0.5 rounded-md">64%</div></div>
                       <div className="col-span-2 text-[12px] font-semibold text-slate-500 text-center">1,200</div>
                       <div className="col-span-2 flex justify-center"><div className="bg-amber-50 text-amber-600 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Medium</div></div>
                    </div>
                 </div>

                 {/* Floating Detail Card */}
                 <div className="absolute -bottom-4 right-4 bg-white/95 backdrop-blur-xl rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.12)] border border-slate-100 p-5 w-[420px] z-20 group-hover:-translate-y-4 transition-transform duration-500">
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <h4 className="text-[14px] font-bold text-slate-800 leading-tight">What are the best CRMs for fast growing companies?</h4>
                         <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 mt-1"><Tag className="w-3 h-3" /> 2 Unique Tags • US IP address • Rising Position</span>
                       </div>
                       <div className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0"><MoreHorizontal className="w-3 h-3 text-slate-400" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                       <div className="bg-slate-50 rounded-md p-3 border border-slate-100/50">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tags</div>
                          <div className="flex gap-1 flex-wrap">
                             <div className="bg-orange-100 text-orange-700 text-[9px] font-bold px-1.5 py-0.5 rounded">Problem aware</div>
                             <div className="bg-blue-100 text-[#0015FF]/90 text-[9px] font-bold px-1.5 py-0.5 rounded">Mid-market</div>
                          </div>
                       </div>
                       <div className="bg-slate-50 rounded-md p-3 border border-slate-100/50">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</div>
                          <div className="flex items-center gap-1.5 mt-1">
                             <span className="text-[14px]">🇺🇸</span> <span className="text-[11px] font-bold text-slate-700">US</span>
                          </div>
                       </div>
                       <div className="bg-slate-50 rounded-md p-3 border border-slate-100/50">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Estimated Volume</div>
                          <div className="mt-1 flex items-center gap-1">
                            <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px] font-bold text-slate-700">Medium Volume</span>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* ---------------------------------------------------- */}
           {/* Card 2: Use Data to Pick Winners */}
           <div className="xl:col-span-5 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden group">
              <div className="relative z-10 mb-8">
                 <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Use Data to Pick Winners</h3>
                 <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                   Leverage AI-suggested prompts and search volumes to focus on the biggest opportunities.
                 </p>
              </div>

              <div className="flex-1 w-full bg-[#FAFAFA] rounded-[24px] overflow-hidden relative flex flex-col items-center justify-center -rotate-6 scale-110 group-hover:rotate-0 group-hover:scale-100 transition-all duration-700 p-8">
                 <div className="w-[320px] absolute top-[40px] left-[20px] bg-white rounded-[20px] shadow-sm border border-slate-100/50 p-4 -rotate-3 opacity-60">
                    <div className="flex items-center gap-2 mb-2">
                       <Sparkles className="w-4 h-4 text-purple-500" />
                       <span className="text-[12px] font-semibold text-slate-700">Suggested Prompts (14)</span>
                    </div>
                 </div>

                 <div className="w-[340px] bg-white rounded-[20px] shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-slate-100 p-5 relative z-10">
                    <h4 className="text-[14px] font-bold text-slate-800 leading-snug mb-4 pr-4">
                      Best CRM software with intuitive user interfaces and customizable workflows
                    </h4>
                    <div className="flex justify-between items-end">
                       <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Volume</span>
                          <span className="bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider w-fit">High Volume</span>
                       </div>
                       <div className="flex gap-1.5">
                          <span className="bg-purple-50 text-purple-600 font-bold text-[9px] px-2 py-0.5 rounded">Solution Aware</span>
                          <span className="bg-blue-50 text-[#0015FF] font-bold text-[9px] px-2 py-0.5 rounded">Feature</span>
                       </div>
                    </div>
                 </div>

                 <div className="w-[320px] bg-white/60 backdrop-blur-sm rounded-[20px] shadow-sm border border-slate-100 p-4 relative -mt-4 -z-10 translate-x-4 rotate-2">
                    <h4 className="text-[13px] font-bold text-slate-500 leading-snug mb-3">
                      What are the top CRM systems that provide driven insights and automation?
                    </h4>
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Estimated Volume</span>
                        <span className="bg-amber-50/50 text-amber-500 font-bold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider w-fit">Medium Volume</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* ---------------------------------------------------- */}
           {/* Card 3: Add Brands */}
           <div className="xl:col-span-4 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden group">
              <div className="relative z-10 mb-8">
                 <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Add Brands</h3>
                 <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                   See how you rank against the players that matter in your market.
                 </p>
              </div>

              <div className="flex-1 w-full bg-gradient-to-br from-pink-50/50 to-purple-50/50 rounded-[24px] relative flex flex-col items-center justify-center p-6 overflow-hidden">
                 
                 <div className="w-[260px] bg-white rounded-[20px] shadow-lg border border-slate-100 p-4 relative z-10 group-hover:-translate-y-2 transition-transform duration-500">
                    <div className="flex items-center gap-2 mb-4">
                       <div className="flex -space-x-1">
                          <div className="w-5 h-5 rounded bg-[#0015FF]"></div>
                          <div className="w-5 h-5 rounded bg-orange-500"></div>
                       </div>
                       <span className="text-[13px] font-semibold text-slate-700">Brands <span className="text-slate-400">(5)</span></span>
                    </div>

                    <div className="flex flex-col gap-3">
                       {/* Brand 1 */}
                       <div className="bg-white rounded-md border border-slate-100 shadow-sm p-3 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-md bg-[#FF3D57] flex items-center justify-center shrink-0"><Activity className="w-4 h-4 text-white" /></div>
                             <div className="flex flex-col">
                               <span className="text-[12px] font-bold text-slate-800">Monday <span className="text-emerald-500 text-[10px]">+3</span></span>
                               <span className="text-[10px] font-semibold text-slate-400">monday.com</span>
                             </div>
                          </div>
                          <div className="bg-slate-900 hover:bg-slate-800 cursor-pointer text-white rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"><Plus className="w-3 h-3" /> Start</div>
                       </div>
                       {/* Brand 2 */}
                       <div className="bg-[#F8F9FA] rounded-md border border-slate-200 p-3 flex justify-between items-center relative -ml-4 w-[calc(100%+16px)] shadow-md z-20">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-md bg-[#00AA55] flex items-center justify-center shrink-0"><LayoutTemplate className="w-4 h-4 text-white" /></div>
                             <div className="flex flex-col">
                               <span className="text-[12px] font-bold text-slate-800">Pipedrive <span className="text-emerald-500 text-[10px]">+2</span></span>
                               <span className="text-[10px] font-semibold text-slate-400">pipedrive.com</span>
                             </div>
                          </div>
                          <div className="bg-white text-slate-700 border border-slate-200 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm"><Check className="w-3 h-3 text-emerald-500" /> Tracking</div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* ---------------------------------------------------- */}
           {/* Card 4: Choose AI Models & Recent Chats */}
           <div className="xl:col-span-8 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden group">
              <div className="relative z-10 mb-8 max-w-md">
                 <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Choose AI Models</h3>
                 <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                   Track rankings across the models that drive the most traffic and visibility.
                 </p>
              </div>

              <div className="flex-1 w-full bg-[#FAFAFA] rounded-[24px] border border-slate-100 shadow-inner flex flex-col md:flex-row gap-6 p-6">
                 
                 {/* Models List */}
                 <div className="w-full md:w-[240px] bg-white rounded-md shadow-sm border border-slate-100 p-4 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5"><Box className="w-4 h-4 text-slate-400" /> Models</span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase">Set Freq: Daily <ChevronDown className="w-3 h-3 inline" /></span>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                       <label className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-md cursor-pointer">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded bg-[#0015FF] text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>
                             <span className="text-[12.5px] font-medium text-slate-700">ChatGPT</span>
                          </div>
                          <Bot className="w-4 h-4 text-slate-400" />
                       </label>
                       <label className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-md cursor-pointer">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded bg-[#0015FF] text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>
                             <span className="text-[12.5px] font-medium text-slate-700">AI Overviews</span>
                          </div>
                          <Search className="w-4 h-4 text-slate-400" />
                       </label>
                       <label className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-md cursor-pointer">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded bg-[#0015FF] text-white flex items-center justify-center"><Check className="w-3 h-3" /></div>
                             <span className="text-[12.5px] font-medium text-slate-700">Claude</span>
                          </div>
                          <Sparkles className="w-4 h-4 text-amber-500" />
                       </label>
                       <label className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-md cursor-pointer opacity-60">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded border border-slate-300"></div>
                             <span className="text-[12.5px] font-medium text-slate-700">DeepSeek R1</span>
                          </div>
                          <Brain className="w-4 h-4 text-slate-400" />
                       </label>
                       <label className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-md cursor-pointer opacity-60">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded border border-slate-300"></div>
                             <span className="text-[12.5px] font-medium text-slate-700">Perplexity</span>
                          </div>
                          <Compass className="w-4 h-4 text-slate-400" />
                       </label>
                       <label className="flex items-center justify-between hover:bg-slate-50 p-1.5 rounded-md cursor-pointer opacity-60">
                          <div className="flex items-center gap-3">
                             <div className="w-4 h-4 rounded border border-slate-300"></div>
                             <span className="text-[12.5px] font-medium text-slate-700">Gemini</span>
                          </div>
                          <Star className="w-4 h-4 text-slate-400" />
                       </label>
                    </div>
                 </div>

                 {/* Recent Chats List */}
                 <div className="flex-1 bg-white rounded-md shadow-sm border border-slate-100 p-4">
                    <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                       <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> Recent Chats</span>
                       <div className="bg-slate-50 border border-slate-200 rounded-md px-2 py-1 text-[10px] font-semibold text-slate-500 flex items-center gap-1 cursor-pointer hover:bg-slate-100 transition-colors"><Download className="w-3 h-3" /> Export</div>
                    </div>

                    <div className="flex flex-col gap-4">
                       <div className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5"><Search className="w-3 h-3 text-slate-500" /></div>
                          <div className="flex flex-col gap-1.5 w-full">
                             <span className="text-[13px] font-medium text-slate-800 leading-tight">What's the best way to structure a CRM for a fast-growing startup?</span>
                             <span className="text-[11px] text-slate-400 line-clamp-1">A good starting point is to keep things simple. Organize...</span>
                             <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center"><Bot className="w-2.5 h-2.5 text-slate-500" /></div>
                                  <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center"><Search className="w-2.5 h-2.5 text-slate-500" /></div>
                                  <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center"><Sparkles className="w-2.5 h-2.5 text-slate-500" /></div>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400">1d ago</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex gap-3">
                          <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0 mt-0.5"><Star className="w-3 h-3 text-orange-500" /></div>
                          <div className="flex flex-col gap-1.5 w-full">
                             <span className="text-[13px] font-medium text-slate-800 leading-tight">Which CRM platforms offer the best customer support and training resources for new users?</span>
                             <div className="flex justify-between items-center mt-1">
                                <div className="flex items-center gap-1">
                                  <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center"><Bot className="w-2.5 h-2.5 text-slate-500" /></div>
                                  <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center"><Sparkles className="w-2.5 h-2.5 text-slate-500" /></div>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400">2d ago</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>

              </div>
           </div>

           {/* ---------------------------------------------------- */}
           {/* Card 5: Find Key Sources */}
           <div className="xl:col-span-6 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden group">
              <div className="relative z-10 mb-8 max-w-sm">
                 <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Find Key Sources</h3>
                 <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                   Spot the citations shaping your visibility and refine your GEO strategy.
                 </p>
              </div>

              <div className="flex-1 w-full bg-[#FAFAFA] rounded-[24px] border border-slate-100 shadow-inner p-6 relative flex flex-col">
                 <div className="flex justify-between items-center mb-6">
                    <div className="bg-white border border-slate-200 rounded-md flex items-center px-3 py-1.5 w-48 shadow-sm">
                       <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                       <span className="text-[11px] font-medium text-slate-400">Search Sources</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-md px-3 py-1.5 text-[11px] font-semibold text-slate-600 flex items-center gap-2 shadow-sm cursor-pointer">
                       All Types <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                 </div>

                 {/* Table */}
                 <div className="w-full">
                    <div className="grid grid-cols-12 gap-2 border-b border-slate-200 pb-2 mb-3">
                       <div className="col-span-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Domain</div>
                       <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Type</div>
                       <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Used</div>
                       <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Avg. Citations</div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                       <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4 flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center text-white text-[8px] font-bold">R</div> <span className="text-[12px] font-semibold text-slate-700">reddit.com</span></div>
                          <div className="col-span-3"><span className="bg-blue-50 text-[#0015FF] font-bold text-[9px] px-1.5 py-0.5 rounded">UGC</span></div>
                          <div className="col-span-2 text-[12px] font-semibold text-slate-500 text-center">32%</div>
                          <div className="col-span-3 text-[12px] font-semibold text-slate-700 text-center">3.2</div>
                       </div>
                       <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4 flex items-center gap-2"><div className="w-4 h-4 rounded bg-slate-900 flex items-center justify-center text-white text-[8px] font-bold">A</div> <span className="text-[12px] font-semibold text-slate-700">attio.com</span></div>
                          <div className="col-span-3"><span className="bg-emerald-50 text-emerald-600 font-bold text-[9px] px-1.5 py-0.5 rounded">You</span></div>
                          <div className="col-span-2 text-[12px] font-semibold text-slate-500 text-center">43%</div>
                          <div className="col-span-3 text-[12px] font-semibold text-slate-700 text-center">5.2</div>
                       </div>
                       <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4 flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[8px] font-bold">W</div> <span className="text-[12px] font-semibold text-slate-700">wikipedia.org</span></div>
                          <div className="col-span-3"><span className="bg-purple-50 text-purple-600 font-bold text-[9px] px-1.5 py-0.5 rounded">Reference</span></div>
                          <div className="col-span-2 text-[12px] font-semibold text-slate-500 text-center">31%</div>
                          <div className="col-span-3 text-[12px] font-semibold text-slate-700 text-center">1.4</div>
                       </div>
                       <div className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-4 flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-[8px] font-bold">H</div> <span className="text-[12px] font-semibold text-slate-700">hubspot.com</span></div>
                          <div className="col-span-3"><span className="bg-rose-50 text-rose-600 font-bold text-[9px] px-1.5 py-0.5 rounded">Competitor</span></div>
                          <div className="col-span-2 text-[12px] font-semibold text-slate-500 text-center">39%</div>
                          <div className="col-span-3 text-[12px] font-semibold text-slate-700 text-center">1.1</div>
                       </div>
                    </div>
                 </div>

                 {/* Floating Recommendation Pill */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-full px-4 py-2 text-[11px] font-bold tracking-wider flex items-center gap-2 shadow-xl shadow-slate-900/20 group-hover:-translate-y-2 transition-transform cursor-pointer whitespace-nowrap z-20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> You have 5 strategy recommendations
                 </div>
              </div>
           </div>

           {/* ---------------------------------------------------- */}
           {/* Card 6: Act on Insights */}
           <div className="xl:col-span-6 bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col relative overflow-hidden group">
              <div className="relative z-10 mb-8 max-w-sm">
                 <h3 className="text-[22px] font-bold text-slate-900 mb-3 tracking-tight">Act on Insights</h3>
                 <p className="text-[15px] text-slate-500 font-medium leading-relaxed">
                   Use recommendations to capture high-impact opportunities and boost your ranking.
                 </p>
              </div>

              <div className="flex-1 flex flex-col gap-3 relative z-20">
                 {/* Faded Top Item */}
                 <div className="bg-slate-50 rounded-md p-4 border border-slate-100/50 flex justify-between items-center opacity-50">
                    <div className="flex flex-col gap-1">
                       <span className="text-[13px] font-bold text-slate-700">The review websites G2 is regularly cited</span>
                       <span className="text-[11px] text-slate-500">Make sure you have a profile with reviews</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0"><ArrowRight className="w-3.5 h-3.5 text-slate-400" /></div>
                 </div>
                 
                 {/* Item 2 */}
                 <div className="bg-white rounded-md p-4 border border-slate-100 shadow-sm flex justify-between items-center hover:-translate-y-1 transition-transform cursor-pointer">
                    <div className="flex flex-col gap-1">
                       <span className="text-[13px] font-bold text-slate-800">LinkedIn is a common source</span>
                       <span className="text-[11px] text-slate-500">Consider joining the conversation</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><ArrowRight className="w-3.5 h-3.5 text-slate-600" /></div>
                 </div>

                 {/* Active Dark Item */}
                 <div className="bg-slate-900 rounded-md p-4 border border-slate-800 shadow-lg shadow-slate-900/20 flex justify-between items-center hover:scale-[1.02] transition-transform cursor-pointer z-10 -mx-2">
                    <div className="flex flex-col gap-1">
                       <span className="text-[13px] font-bold text-white">Join r/CRM subreddit discussions</span>
                       <span className="text-[11px] text-slate-400">Discussions show frequently in sources.</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0"><ArrowRight className="w-3.5 h-3.5 text-white" /></div>
                 </div>

                 {/* Item 4 */}
                 <div className="bg-white rounded-md p-4 border border-slate-100 shadow-sm flex justify-between items-center hover:-translate-y-1 transition-transform cursor-pointer">
                    <div className="flex flex-col gap-1">
                       <span className="text-[13px] font-bold text-slate-800">Articles from NYT regularly show up in...</span>
                       <span className="text-[11px] text-slate-500">Consider placing a story via digital PR</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0"><ArrowRight className="w-3.5 h-3.5 text-slate-600" /></div>
                 </div>
                 
                 {/* Bottom Fade out */}
                 <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-30"></div>
              </div>
           </div>

        </div>
      </div>
    </section>
  );
}


