
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
      <div className="bg-slate-900 w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/50 shrink-0">
           <div>
             <h3 className="text-xl font-bold text-white">Financial Pulse</h3>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time Store Metrics</p>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition">✕</button>
        </div>
        <div className="p-6 overflow-y-auto bg-slate-900">
           <Stats stats={stats} userRole={userRole} />
        </div>
      </div>
    </div>
  );
};

export default FinancialPulseModal;
