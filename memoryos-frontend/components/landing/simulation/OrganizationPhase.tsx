import { motion } from 'framer-motion';
import { Users, Activity, Lock, Database, Zap, FileSearch, ShieldCheck } from 'lucide-react';

export function OrganizationPhase({ state }: { state: any }) {
  const progress = state.context.progress;

  if (progress < 0.25 || progress > 0.5) return null;

  const roles = [
    { id: 'gov', name: 'Mission Governor', icon: ShieldCheck, color: 'text-blue-500', cap: 'Oversight' },
    { id: 'ana', name: 'Dispute Analyst', icon: FileSearch, color: 'text-purple-500', cap: 'Claim Parsing' },
    { id: 'pol', name: 'Policy Guardian', icon: Lock, color: 'text-indigo-500', cap: 'Constraint Check' },
    { id: 'rsk', name: 'Risk Assessor', icon: Activity, color: 'text-rose-500', cap: 'Fraud Detection' },
    { id: 'pln', name: 'Execution Planner', icon: Zap, color: 'text-amber-500', cap: 'Workflow Gen' },
    { id: 'exe', name: 'Refund Executor', icon: Users, color: 'text-emerald-500', cap: 'Stripe API' },
    { id: 'aud', name: 'Independent Auditor', icon: Database, color: 'text-slate-500', cap: 'Evidence Seal' },
  ];

  return (
    <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-12 pointer-events-none">
      
      {/* ORGANIZATION TOPOLOGY */}
      <motion.div 
        className="flex flex-col items-center w-full max-w-5xl relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: progress > 0.25 ? 1 : 0 }}
      >
        <div className="bg-slate-800 text-[#F0EFE2] px-5 py-2 rounded-full font-bold text-xs tracking-widest flex items-center gap-2 mb-8 shadow-md border border-slate-700 z-10">
          <Users size={14} className="text-blue-400" />
          organization-v1.0
        </div>

        {/* Roles Grid */}
        <div className="flex flex-wrap justify-center gap-6 mb-16">
          {roles.map((role, i) => (
            <motion.div 
              key={role.id}
              className="bg-white border border-slate-200 rounded-md p-4 shadow-sm flex flex-col items-center w-[130px] relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: progress > 0.26 + (i * 0.01) ? 1 : 0, scale: progress > 0.26 + (i * 0.01) ? 1 : 0.9, y: progress > 0.26 + (i * 0.01) ? 0 : 20 }}
            >
              <div className="mb-2">
                <role.icon size={20} className={role.color} />
              </div>
              <span className="text-[10px] font-bold text-slate-800 text-center uppercase tracking-wider mb-2 leading-tight h-6">
                {role.name}
              </span>

              {/* Bound Capability / Agent Injection */}
              <motion.div 
                className="w-full bg-slate-50 border border-slate-100 rounded p-1.5 flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: progress > 0.32 ? 1 : 0, y: progress > 0.32 ? 0 : 10 }}
                transition={{ delay: i * 0.05 }}
              >
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-widest">Bound Cap</span>
                <span className="text-[9px] font-mono text-slate-700">{role.cap}</span>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* INSTITUTION CORE (3 Authority Rings) */}
        <motion.div 
          className="relative flex items-center justify-center w-64 h-64"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: progress > 0.35 ? 1 : 0, scale: progress > 0.35 ? 1 : 0.8 }}
        >
          {/* Ring 1: Constitutional */}
          <motion.div 
            className="absolute inset-0 rounded-full border border-slate-200"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] font-bold text-slate-400 tracking-widest uppercase">Constitutional</div>
          </motion.div>
          
          {/* Ring 2: Role */}
          <motion.div 
            className="absolute inset-4 rounded-full border border-slate-300 border-dashed"
            initial={{ rotate: 360 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -left-5 top-1/2 -translate-y-1/2 bg-white px-2 py-0.5 text-[9px] font-bold text-slate-400 tracking-widest uppercase rotate-[-90deg]">Role Bounds</div>
          </motion.div>
          
          {/* Ring 3: Action-Specific */}
          <motion.div 
            className="absolute inset-10 rounded-full border border-slate-200"
          >
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-white px-2 text-[9px] font-bold text-slate-400 tracking-widest uppercase">Action Perms</div>
          </motion.div>

          {/* Central Core */}
          <div className="absolute bg-slate-900 text-[#F0EFE2] w-24 h-24 rounded-full flex flex-col items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.1)] z-10 border border-slate-700">
            <Activity size={20} className="text-emerald-400 mb-1" />
            <span className="text-[10px] font-bold tracking-widest text-center leading-tight">
              institution<br/>run-042
            </span>
          </div>

        </motion.div>
        
      </motion.div>
    </div>
  );
}


