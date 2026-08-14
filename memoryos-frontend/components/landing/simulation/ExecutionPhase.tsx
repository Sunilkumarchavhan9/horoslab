import { motion } from 'framer-motion';
import { GitBranch, AlertOctagon, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export function ExecutionPhase({ state }: { state: any }) {
  const progress = state.context.progress;

  if (progress < 0.4 || progress > 0.8) return null;

  const causalNodes = [
    { id: '1', title: 'Refund Approved', expected: 'Approval = true', observed: 'Approval = true', div: '0%', conf: '99%', src: 'Gov-Agent' },
    { id: '2', title: 'Stripe API Called', expected: '200 OK', observed: '200 OK', div: '0%', conf: '100%', src: 'Stripe-Hook' },
    { id: '3', title: 'Ledger Updated', expected: 'Bal: -$5,000', observed: 'Bal: -$5,000', div: '0%', conf: '100%', src: 'Internal-DB' },
    { id: '4', title: 'Customer Notified', expected: 'Email Sent', observed: 'Email Sent', div: '0%', conf: '95%', src: 'SendGrid' },
    { id: '5', title: 'Dispute Resolved', expected: 'State = Closed', observed: 'State = Closed', div: '0%', conf: '98%', src: 'CRM' },
  ];

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12 pointer-events-none">
      
      {/* COUNTERFACTUAL BRANCH (Visible early in execution) */}
      <motion.div 
        className="absolute top-20 flex gap-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: progress > 0.45 && progress < 0.6 ? 1 : 0, y: progress > 0.45 ? 0 : -20 }}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-2">
            <GitBranch size={12} /> Counterfactual Splitting
          </div>
          <div className="flex gap-8">
            {/* Rejected Branch */}
            <motion.div 
              className="bg-rose-50 border border-rose-200 rounded-md p-4 w-[240px] shadow-sm relative opacity-40 grayscale filter"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border border-rose-200">
                Execute Ungoverned
              </div>
              <div className="mt-2 space-y-1 text-xs font-sans">
                <div className="flex justify-between"><span className="text-rose-500 font-bold">Policy Violations</span><span className="text-rose-900 font-bold">1 (C-02)</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Predicted Risk</span><span className="text-rose-600 font-medium">CRITICAL</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expected Delay</span><span className="text-slate-900 font-medium">0ms</span></div>
              </div>
            </motion.div>

            {/* Selected Branch */}
            <motion.div 
              className="bg-white border-2 border-emerald-400 rounded-md p-4 w-[240px] shadow-lg relative"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded text-[9px] font-bold tracking-widest uppercase border border-emerald-200">
                Request Approval
              </div>
              <div className="mt-2 space-y-1 text-xs font-sans">
                <div className="flex justify-between"><span className="text-emerald-500 font-bold">Policy Violations</span><span className="text-emerald-700 font-bold">0</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Predicted Risk</span><span className="text-emerald-600 font-medium">LOW</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expected Delay</span><span className="text-slate-900 font-medium">+15m</span></div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* CAUSAL EXECUTION CHAIN */}
      <motion.div 
        className="flex gap-4 mt-32 w-full max-w-6xl overflow-visible relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: progress > 0.6 ? 1 : 0 }}
      >
        {causalNodes.map((node, i) => (
          <motion.div 
            key={node.id}
            className="flex-1 bg-white border border-slate-200 rounded-md p-3 shadow-sm relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: progress > 0.62 + (i * 0.03) ? 1 : 0, x: progress > 0.62 + (i * 0.03) ? 0 : -20 }}
          >
            <div className="font-bold text-xs text-slate-800 mb-2 whitespace-nowrap overflow-hidden text-ellipsis">{node.title}</div>
            <div className="space-y-1">
              <div className="flex justify-between text-[9px] font-sans"><span className="text-slate-400">Exp:</span><span className="text-slate-700">{node.expected}</span></div>
              <div className="flex justify-between text-[9px] font-sans"><span className="text-slate-400">Obs:</span><span className="text-emerald-600 font-bold">{node.observed}</span></div>
              <div className="flex justify-between text-[9px] font-sans"><span className="text-slate-400">Div:</span><span className="text-slate-700">{node.div}</span></div>
              <div className="flex justify-between text-[9px] font-sans"><span className="text-slate-400">Conf:</span><span className="text-slate-700">{node.conf}</span></div>
              <div className="flex justify-between text-[9px] font-sans"><span className="text-slate-400">Src:</span><span className="text-blue-500 font-medium">{node.src}</span></div>
            </div>

            {/* Connecting Arrows */}
            {i < causalNodes.length - 1 && (
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 text-slate-300">
                <ArrowRight size={14} />
              </div>
            )}
          </motion.div>
        ))}

        {/* HIDDEN ASSUMPTIONS (Floating above/below) */}
        <motion.div 
          className="absolute -top-12 left-[30%] bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-full text-[10px] font-sans font-medium flex items-center gap-1.5 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: progress > 0.68 ? 1 : 0, y: progress > 0.68 ? 0 : 10 }}
        >
          <AlertOctagon size={12} /> Assumption: API limits not exceeded
        </motion.div>

        <motion.div 
          className="absolute -bottom-12 left-[60%] bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-sans font-medium flex items-center gap-1.5 shadow-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: progress > 0.72 ? 1 : 0, y: progress > 0.72 ? 0 : -10 }}
        >
          <CheckCircle2 size={12} /> Verified: User in target cohort
        </motion.div>
      </motion.div>

    </div>
  );
}


