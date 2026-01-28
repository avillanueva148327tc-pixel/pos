import React from 'react';
import { Stats as StatsType, UserRole } from '../types';
import Stats from './Stats';

interface FinancialPulseModalProps {
  stats: StatsType;
  onClose: () => void;
  userRole?: UserRole;
}

const FinancialPulseModal: React.FC<FinancialPulseModalProps> = ({ stats, onClose, userRole = 'cashier' }) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#1e293b]">
           <div>
             <h3 className="text-xl font-black text-slate-900 dark:text-white">Financial Pulse</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Store Metrics</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition">✕</button>
        </div>
        <div className="p-6 overflow-y-auto bg-[#f8fafc] dark:bg-[#020617]">
           <Stats stats={stats} userRole={userRole} />
        </div>
      </div>
    </div>
  );
};

export default FinancialPulseModal;