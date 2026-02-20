import React from 'react';

interface ScanGoPanelProps {
  onStartScan: () => void;
  activeCustomer: string;
  isWalkIn: boolean;
  level?: 1 | 2;
}

const ScanGoPanel: React.FC<ScanGoPanelProps> = ({ onStartScan, activeCustomer, isWalkIn, level = 1 }) => {
  const hasMember = !isWalkIn && activeCustomer !== 'Walk-in Customer';

  return (
    <div className="p-3 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm space-y-2 relative overflow-hidden">
      {/* Visual background indicator for Clearance Level */}
      <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl opacity-10 -mr-8 -mt-8 rounded-full ${level === 2 ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
      
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center gap-1.5">
           <h4 className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Unified Terminal</h4>
           <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border ${level === 2 ? 'border-indigo-500/30 text-indigo-500' : 'border-emerald-500/30 text-emerald-500'}`}>
             LVL {level}
           </span>
        </div>
        <div className="flex items-center gap-1">
           <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[8px] font-black text-emerald-500 uppercase">Coherent</span>
        </div>
      </div>

      <button 
        onClick={onStartScan}
        className="w-full p-3 bg-indigo-500 text-white rounded-2xl flex items-center gap-3 group hover:bg-indigo-600 transition-all active:scale-[0.97] shadow-lg shadow-indigo-500/20"
      >
        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform shrink-0">📸</div>
        <div className="text-left leading-tight">
           <p className="text-[8px] font-black uppercase tracking-wider opacity-70">Tap to Start</p>
           <p className="text-[11px] font-black uppercase">Scan ID / Item</p>
        </div>
      </button>

      <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-100 dark:border-white/5">
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${hasMember ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-200 dark:bg-white/5 text-slate-400'}`}>
           {hasMember ? '🪪' : '👤'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black text-slate-700 dark:text-slate-200 truncate uppercase">
             {hasMember ? activeCustomer : 'Cash Account'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScanGoPanel;