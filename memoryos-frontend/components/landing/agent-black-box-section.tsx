"use client";

import {
   Package, Database, AlertTriangle, ShieldCheck, Play, FileEdit, CheckSquare, Save, Sparkles, User, Link as LinkIcon, MoreVertical, Clock, CheckCircle
} from "lucide-react";

const timelineEvents = [
   {
      time: '10:31', title: 'Package created', actor: 'System', status: 'Success', proof: 'pkg_09a8.json',
      icon: Package, iconColor: 'text-[#F0EFE2]',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', badgeIcon: CheckCircle, color: 'emerald'
   },
   {
      time: '10:32', title: 'Memory injected', actor: 'Memory Engine', status: 'Success', proof: 'mem_ctx_1.log',
      icon: Database, iconColor: 'text-[#F0EFE2]',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', badgeIcon: CheckCircle, color: 'emerald'
   },
   {
      time: '10:32', title: 'Risk detected', actor: 'Security Guard', status: 'Warning', proof: 'risk_eval.md',
      icon: AlertTriangle, iconColor: 'text-amber-400',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20', badgeIcon: AlertTriangle, color: 'amber'
   },
   {
      time: '10:33', title: 'Policy checked', actor: 'Compliance Engine', status: 'Passed', proof: 'policy_pass.log',
      icon: ShieldCheck, iconColor: 'text-emerald-400',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', badgeIcon: CheckCircle, color: 'emerald'
   },
   {
      time: '10:34', title: 'Agent started', actor: 'Agent Core', status: 'Running', proof: 'run_992.log',
      icon: Play, iconColor: 'text-blue-400',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20', badgeIcon: Play, color: 'blue'
   },
   {
      time: '10:38', title: 'File changed', actor: 'Agent Core', status: 'Modified', proof: 'diff_881.patch',
      icon: FileEdit, iconColor: 'text-indigo-400',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', badgeIcon: FileEdit, color: 'indigo'
   },
   {
      time: '10:41', title: 'Test recommended', actor: 'QA Engine', status: 'Info', proof: 'test_plan.md',
      icon: CheckSquare, iconColor: 'text-blue-400',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20', badgeIcon: CheckSquare, color: 'blue'
   },
   {
      time: '10:45', title: 'Outcome saved', actor: 'System', status: 'Success', proof: 'outcome.json',
      icon: Save, iconColor: 'text-[#F0EFE2]',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', badgeIcon: CheckCircle, color: 'emerald'
   },
   {
      time: '10:46', title: 'Future instruction created', actor: 'Memory Engine', status: 'Success', proof: 'instruction_add.txt',
      icon: Sparkles, iconColor: 'text-amber-400',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', badgeIcon: CheckCircle, color: 'emerald'
   },
];

const colorMap: Record<string, any> = {
   emerald: { dot: 'bg-emerald-400', wire: 'stroke-[#333]' },
   amber: { dot: 'bg-amber-400', wire: 'stroke-[#333]' },
   blue: { dot: 'bg-blue-400', wire: 'stroke-[#333]' },
   indigo: { dot: 'bg-indigo-400', wire: 'stroke-[#333]' }
};

// Scattered organic layout configuration
const desktopLayout = [
   { x: 40, y: 60, inDot: null, outDot: 'right' },
   { x: 480, y: 140, inDot: 'left', outDot: 'right' },
   { x: 880, y: 50, inDot: 'left', outDot: 'right' },
   { x: 940, y: 380, inDot: 'right', outDot: 'left' },
   { x: 500, y: 460, inDot: 'right', outDot: 'left' },
   { x: 80, y: 360, inDot: 'right', outDot: 'left' },
   { x: 180, y: 700, inDot: 'left', outDot: 'right' },
   { x: 620, y: 780, inDot: 'left', outDot: 'right' },
   { x: 920, y: 640, inDot: 'left', outDot: null },
];

const getDotX = (x: number, dotPos: string | null) => x + (dotPos === 'right' ? 315.5 : 4.5);

export function AgentBlackBoxSection() {
   return (
      <section className="w-full relative py-20 md:py-32 overflow-hidden font-sans bg-[#151515] border-y border-dashed border-[#333]">

         {/* Blueprint Grid Background */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#222_1px,transparent_1px),linear-gradient(to_bottom,#222_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:linear-gradient(to_bottom,white,transparent_80%)] pointer-events-none opacity-50 z-0" />

         <div className="max-w-[1100px] mx-auto px-6 relative z-10 mb-16">
            <div className="flex flex-col gap-6 max-w-4xl mx-auto text-center items-center">
               <h2 className="text-4xl md:text-[52px] font-medium text-[#F0EFE2] tracking-tight leading-[1.1] drop-shadow-sm">
                  Every agent run becomes explainable.
               </h2>
               <p className="text-lg md:text-[20px] text-[#C8C7BA] font-medium leading-relaxed max-w-2xl drop-shadow-sm">
                  A flight-recorder timeline for AI agents. Every memory injection, risk check, policy decision, files change, test recommendation, and outcome is recorded with proof.
               </p>
            </div>
         </div>

         {/* Canvas Container (Desktop Scattered) */}
         <div className="w-full max-w-[1350px] mx-auto relative h-[1100px] mb-10 hidden md:block">
            <div className="w-full h-full relative z-10">
               {timelineEvents.map((event, i) => {
                  const l = desktopLayout[i];
                  const nextL = desktopLayout[i + 1];
                  const isLast = i === timelineEvents.length - 1;
                  const c = colorMap[event.color];
                  const Icon = event.icon;
                  const BadgeIcon = event.badgeIcon;

                  let wirePath = "";
                  if (!isLast && nextL && l.outDot && nextL.inDot) {
                     const dx = getDotX(nextL.x, nextL.inDot) - getDotX(l.x, l.outDot);
                     const dy = nextL.y - l.y;
                     const cp1x = l.outDot === 'right' ? 120 : -120;
                     const cp2x = dx + (nextL.inDot === 'right' ? 120 : -120);
                     wirePath = `M 0 0 C ${cp1x} 0, ${cp2x} ${dy}, ${dx} ${dy}`;
                  }

                  return (
                     <div key={i}
                        className="absolute w-[320px] bg-[#1a1a1a] rounded-[16px] border border-[#333] flex flex-col z-10 group hover:border-[#555] transition-all"
                        style={{ top: `${l.y}px`, left: `${l.x}px` }}
                     >
                        <div className="p-5 pb-4">
                           <div className="flex justify-between items-start mb-3">
                              <div className={`flex items-center gap-1.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium px-2 py-1 rounded-md border ${event.badgeColor}`}>
                                 <BadgeIcon size={10} className="shrink-0" /> {event.status}
                              </div>
                              <MoreVertical size={16} className="text-[#666] cursor-pointer hover:text-[#999] transition-colors" />
                           </div>

                           <div className="flex items-center gap-2 text-[#F0EFE2] font-medium text-[13px] md:text-[14px] lg:text-[15px] mb-1">
                              <Icon size={16} className={event.iconColor} /> {event.title}
                           </div>
                           <div className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] leading-snug mb-5">
                              Actor: <span className="font-medium text-[#F0EFE2]">{event.actor}</span>
                           </div>

                           <div>
                              <div className="text-[10px] md:text-[11px] lg:text-[12px] font-medium text-[#888] mb-2">Proof Artifact</div>
                              <div className="border border-dashed border-[#333] rounded-[8px] px-3 py-2.5 text-[11px] md:text-[12px] lg:text-[13px] text-[#75bf00] bg-[#111] relative flex items-center gap-2 cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                                 <LinkIcon size={14} className="text-[#666] shrink-0" />
                                 <span className="hover:underline underline-offset-2 truncate">{event.proof}</span>

                                 {/* Inbound Dot */}
                                 {l.inDot && (
                                    <div className={`absolute top-1/2 -translate-y-1/2 w-[11px] h-[11px] bg-[#111] border-[2px] border-[#555] rounded-full z-20 ${l.inDot === 'right' ? 'right-[-21px]' : 'left-[-21px]'}`} />
                                 )}

                                 {/* Outbound Dot & Wire */}
                                 {l.outDot && (
                                    <>
                                       <div className={`absolute top-1/2 -translate-y-1/2 w-[11px] h-[11px] bg-[#111] border-[2px] border-[#555] rounded-full z-20 ${l.outDot === 'right' ? 'right-[-21px]' : 'left-[-21px]'}`} />

                                       {!isLast && wirePath && (
                                          <div className={`absolute top-1/2 -translate-y-1/2 w-[11px] h-[11px] z-0 ${l.outDot === 'right' ? 'right-[-21px]' : 'left-[-21px]'}`}>
                                             <svg
                                                className="absolute top-[5px] left-[5px] overflow-visible pointer-events-none"
                                                width="1" height="1"
                                             >
                                                <path
                                                   d={wirePath}
                                                   className={`fill-none stroke-[2.5px] ${c.wire} stroke-dashed`}
                                                   strokeDasharray="4 4"
                                                />
                                             </svg>
                                          </div>
                                       )}
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>

                        <div className="p-3 border-t border-dashed border-[#333] flex items-center bg-[#111] rounded-b-[16px]">
                           <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium text-[#C8C7BA] bg-[#1a1a1a] border border-[#333] px-2 py-1 rounded-md font-mono tracking-tight">
                              <Clock size={12} className="text-[#666]" /> {event.time}
                           </div>
                        </div>
                     </div>
                  )
               })}
            </div>
         </div>

         {/* Mobile Timeline Container */}
         <div className="flex flex-col gap-6 w-full max-w-md mx-auto md:hidden relative z-10 px-4 mb-10">
            <div className="absolute left-[40px] top-10 bottom-10 w-[1px] border-l border-dashed border-[#333] z-0" />

            {timelineEvents.map((event, i) => {
               const Icon = event.icon;
               const BadgeIcon = event.badgeIcon;
               const c = colorMap[event.color];

               return (
                  <div key={i} className="relative pl-[36px] w-full">
                     <div className="w-full bg-[#1a1a1a] rounded-[16px] border border-[#333] flex flex-col relative z-10">
                        <div className="p-5 pb-4">
                           <div className="flex justify-between items-start mb-3">
                              <div className={`flex items-center gap-1.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium px-2 py-1 rounded-md border ${event.badgeColor}`}>
                                 <BadgeIcon size={10} className="shrink-0" /> {event.status}
                              </div>
                              <MoreVertical size={16} className="text-[#666] cursor-pointer" />
                           </div>

                           <div className="flex items-center gap-2 text-[#F0EFE2] font-medium text-[13px] md:text-[14px] lg:text-[15px] mb-1">
                              <Icon size={16} className={event.iconColor} /> {event.title}
                           </div>
                           <div className="text-[#C8C7BA] text-[11px] md:text-[12px] lg:text-[13px] leading-snug mb-5">
                              Actor: <span className="font-medium text-[#F0EFE2]">{event.actor}</span>
                           </div>

                           <div>
                              <div className="text-[10px] md:text-[11px] lg:text-[12px] font-medium text-[#888] mb-2">Proof Artifact</div>
                              <div className="border border-dashed border-[#333] rounded-[8px] px-3 py-2.5 text-[11px] md:text-[12px] lg:text-[13px] text-[#75bf00] bg-[#111] relative flex items-center gap-2 cursor-pointer hover:bg-[#1a1a1a]">
                                 <LinkIcon size={14} className="text-[#666] shrink-0" />
                                 <span className="truncate">{event.proof}</span>

                                 <div className="absolute left-[-21px] top-1/2 -translate-y-1/2 w-[11px] h-[11px] bg-[#111] border-[2px] border-[#555] rounded-full z-20" />
                              </div>
                           </div>
                        </div>

                        <div className="p-3 border-t border-dashed border-[#333] flex items-center bg-[#111] rounded-b-[16px]">
                           <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] lg:text-[11px] font-medium text-[#C8C7BA] bg-[#1a1a1a] border border-[#333] px-2 py-1 rounded-md font-mono tracking-tight">
                              <Clock size={12} className="text-[#666]" /> {event.time}
                           </div>
                        </div>
                     </div>
                  </div>
               )
            })}
         </div>

      </section>
   );
}
