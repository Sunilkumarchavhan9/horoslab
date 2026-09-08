import { motion } from 'framer-motion';
import { Target, FileText, CheckCircle2, Shield, AlertTriangle } from 'lucide-react';

export function MissionPhase({ state }: { state: any }) {
  const isMission = state.matches('mission_arrival');
  const isConstitution = state.matches('constitution_generation');
  const progress = state.context.progress; // 0 to 1

  // Mission only shows up between 0 and 0.25
  if (progress > 0.3) return null;

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-start p-12 pointer-events-none">
      
      {/* MISSION_001 CONTRACT */}
      <motion.div 
        className="w-[480px] bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden flex flex-col mt-4"
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: progress > 0.02 ? 1 : 0, y: progress > 0.02 ? 0 : 20, scale: progress > 0.02 ? 1 : 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="bg-slate-900 text-[#F0EFE2] px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-emerald-400" />
            <span className="font-bold text-sm tracking-widest">MISSION_001</span>
          </div>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest">Received</span>
        </div>
        
        <div className="p-5 flex flex-col gap-4 text-xs font-sans text-slate-600 relative overflow-hidden">
          {/* Natural language fragment collapsing animation */}
          <motion.div 
            className="absolute inset-0 bg-white z-10 p-5 text-slate-400 italic text-sm leading-relaxed"
            initial={{ opacity: 1 }}
            animate={{ opacity: progress > 0.05 ? 0 : 1 }}
          >
            "We need to reduce payment disputes, but absolutely do not block any legitimate customers in the process. Make sure to get approval if the refund is huge."
          </motion.div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objective</span>
            <span className="text-slate-900 font-medium">Reduce payment disputes via automated resolution.</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Success Threshold</span>
              <span className="text-emerald-600 font-mono font-medium">&gt; 95% automated</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Production Metric</span>
              <span className="text-blue-600 font-mono font-medium">Dispute Volume</span>
            </div>
          </div>

          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={12} /> Forbidden Outcomes
            </span>
            <span className="text-slate-800 font-medium">Blocking legitimate customers</span>
            <span className="text-slate-800 font-medium">Refunding without evidence</span>
          </div>
          
          <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settlement Conditions</span>
            <span className="text-slate-900 font-medium">Evidence of policy compliance verified.</span>
          </div>
        </div>
      </motion.div>

      {/* SVG Dependency Edges to Constitution */}
      <motion.svg 
        className="w-[200px] h-[60px] overflow-visible"
        initial={{ opacity: 0 }}
        animate={{ opacity: progress > 0.1 ? 1 : 0 }}
      >
        <path d="M 100 0 L 100 60" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" fill="none" />
      </motion.svg>

      {/* CONSTITUTION DEPENDENCY GRAPH & CLAUSES */}
      <motion.div 
        className="w-full max-w-4xl flex items-start justify-center gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: progress > 0.12 ? 1 : 0, y: progress > 0.12 ? 0 : 20 }}
        transition={{ delay: 0.2 }}
      >
        {/* Left: Sources Graph */}
        <div className="flex flex-col gap-3 w-[200px] text-right mt-10">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Knowledge Sources</div>
          {['Company Policies', 'Privacy Constraints', 'Historical Incidents', 'Approval Limits'].map((source, i) => (
            <motion.div 
              key={source} 
              className="bg-white border border-slate-200 px-3 py-2 rounded shadow-sm text-xs text-slate-600 font-sans"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: progress > 0.14 + (i * 0.02) ? 0 : -20, opacity: progress > 0.14 + (i * 0.02) ? 1 : 0 }}
            >
              {source}
            </motion.div>
          ))}
        </div>

        {/* Center: Constitution Core */}
        <div className="flex flex-col items-center">
          <div className="bg-slate-800 text-[#F0EFE2] px-5 py-2 rounded-full font-bold text-xs tracking-widest flex items-center gap-2 mb-6 shadow-md border border-slate-700 z-10 relative">
            <Shield size={14} className="text-emerald-400" />
            constitution-v1.0
          </div>

          <div className="flex flex-col gap-3 relative w-[380px]">
            {/* Dependency connection lines from sources */}
            <svg className="absolute -left-[60px] top-0 w-[60px] h-full" style={{ zIndex: -1 }}>
              <path d="M 0 20 C 30 20, 30 40, 60 40" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
              <path d="M 0 60 C 30 60, 30 100, 60 100" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
              <path d="M 0 100 C 30 100, 30 160, 60 160" stroke="#e2e8f0" strokeWidth="1.5" fill="none" />
            </svg>

            {[
              { id: 'C-01', text: 'No refund without transaction evidence', type: 'BLOCKING' },
              { id: 'C-02', text: 'Refunds > $5,000 require approval', type: 'ROUTING' },
              { id: 'C-03', text: 'Customer data remains inside secure bounds', type: 'BOUNDARY' },
              { id: 'C-04', text: 'Executor cannot verify its own action', type: 'STRUCTURAL' },
              { id: 'C-05', text: 'Every decision must retain evidence lineage', type: 'AUDIT' },
            ].map((clause, i) => (
              <motion.div 
                key={clause.id}
                className="bg-white border border-slate-200 rounded-md p-3 shadow-sm flex items-center gap-3 relative"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: progress > 0.15 + (i * 0.02) ? 0 : 20, opacity: progress > 0.15 + (i * 0.02) ? 1 : 0 }}
              >
                <div className="w-10 text-[10px] font-bold text-slate-400">{clause.id}</div>
                <div className="flex-1 text-xs font-sans text-slate-800">{clause.text}</div>
                <div className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{clause.type}</div>
              </motion.div>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}


