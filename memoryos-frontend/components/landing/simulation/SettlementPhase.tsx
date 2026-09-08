import { motion } from 'framer-motion';
import { Database, CheckCircle2, FileKey, Scale, ArrowLeft, Lightbulb } from 'lucide-react';

export function SettlementPhase({ state }: { state: any }) {
  const progress = state.context.progress;

  if (progress < 0.75) return null;

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-end justify-center p-12 pr-32 pointer-events-none">
      
      {/* EVIDENCE LEDGER (Flowing in from execution) */}
      <motion.div 
        className="absolute top-20 right-80 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: progress > 0.75 ? 1 : 0, y: progress > 0.75 ? 0 : 20 }}
      >
        <div className="bg-slate-800 text-[#F0EFE2] px-4 py-1.5 rounded-full font-bold text-[10px] tracking-widest flex items-center gap-2 border border-slate-700">
          <Database size={12} className="text-slate-400" />
          evidence-ledger-042
        </div>
        <div className="bg-white border border-slate-200 rounded p-2 text-[9px] font-mono text-slate-500 shadow-sm">
          <div>Proof: 0x8f2a...9c11</div>
          <div>Signer: Auditor Node</div>
        </div>
      </motion.div>

      {/* SETTLEMENT CHAMBER */}
      <motion.div 
        className="bg-white border border-slate-200 rounded-md shadow-2xl w-[380px] overflow-hidden relative z-20"
        initial={{ opacity: 0, scale: 0.9, x: 40 }}
        animate={{ opacity: progress > 0.85 ? 1 : 0, scale: progress > 0.85 ? 1 : 0.9, x: progress > 0.85 ? 0 : 40 }}
      >
        <div className="bg-slate-900 text-[#F0EFE2] px-5 py-4 flex flex-col gap-1 items-center border-b border-slate-800">
          <Scale size={24} className="text-[#0015FF] mb-1" />
          <span className="font-bold tracking-widest text-sm uppercase">Decision Chamber</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">SETTLEMENT_042</span>
        </div>

        <div className="p-6 flex flex-col gap-3 font-sans text-xs">
          <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Mission satisfaction</span><span className="font-bold text-slate-900 text-sm">97%</span></div>
          <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Constitution compliance</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase">Pass</span></div>
          <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Independent evidence</span><span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px] uppercase">Sufficient</span></div>
          
          <div className="h-px w-full bg-slate-100 my-1" />
          
          <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Authority violations</span><span className="font-bold text-slate-900">0</span></div>
          <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Unresolved assumptions</span><span className="font-bold text-slate-900">0</span></div>
          <div className="flex justify-between items-center"><span className="text-slate-500 font-medium">Settlement confidence</span><span className="font-bold text-emerald-500">96.4%</span></div>
          
          <div className="mt-4 pt-4 border-t border-slate-200 flex flex-col items-center gap-2">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Final Decision</span>
            <div className="bg-emerald-500 text-[#F0EFE2] px-8 py-2 rounded font-black tracking-widest uppercase text-sm shadow-md flex items-center gap-2">
              <CheckCircle2 size={16} /> RELEASED
            </div>
          </div>
        </div>
      </motion.div>

      {/* OUTCOME CERTIFICATE */}
      <motion.div 
        className="absolute bottom-32 right-12 bg-[#fafafa] border border-slate-200 rounded p-4 w-[280px] shadow-sm flex flex-col gap-2 z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: progress > 0.9 ? 1 : 0, y: progress > 0.9 ? 0 : 20 }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><FileKey size={12} /> Outcome Certificate</span>
        </div>
        <div className="text-[9px] font-mono text-slate-600 flex flex-col gap-1">
          <div className="flex justify-between"><span>Mission ID:</span><span className="text-slate-900">MISSION_001</span></div>
          <div className="flex justify-between"><span>Inst Run:</span><span className="text-slate-900">run-042</span></div>
          <div className="flex justify-between"><span>Const Ver:</span><span className="text-slate-900">v1.0</span></div>
          <div className="flex justify-between"><span>Root:</span><span className="text-slate-900">0x3f...e8a2</span></div>
          <div className="flex justify-between text-[#0015FF] font-bold mt-1 pt-1 border-t border-slate-200">
            <span>Result:</span><span>RELEASED</span>
          </div>
        </div>
      </motion.div>

      {/* LEARNING LOOP (Flowing backward) */}
      <motion.div 
        className="absolute bottom-16 left-1/3 bg-blue-50 border border-blue-200 rounded-md p-3 w-[300px] flex gap-3 shadow-md z-30"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: progress > 0.95 ? 1 : 0, x: progress > 0.95 ? 0 : 100 }}
      >
        <div className="bg-blue-100 p-2 rounded h-fit text-blue-600">
          <ArrowLeft size={16} />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1"><Lightbulb size={10} /> Institutional Learning</span>
          <span className="text-[11px] font-sans text-slate-700 leading-tight">Proposing <strong>constitution-v1.1</strong>: Tighten risk thresholds for transactions &gt; $4k based on execution latency.</span>
        </div>
      </motion.div>

    </div>
  );
}


