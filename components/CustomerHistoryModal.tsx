
import React, { useMemo } from 'react';
import { Customer, UtangRecord } from '../types';

interface CustomerHistoryModalProps {
  customer: Customer | { name: string; isWalkIn: boolean };
  records: UtangRecord[];
  onClose: () => void;
  onViewRecord: (record: UtangRecord) => void;
  onDelete?: () => void;
  isAdmin?: boolean;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({ 
  customer, 
  records, 
  onClose, 
  onViewRecord,
  onDelete,
  isAdmin 
}) => {
  const isWalkIn = 'isWalkIn' in customer && customer.isWalkIn;
  const name = customer.name;

  // Filter records for this customer
  const history = useMemo(() => {
    return records
      .filter(r => r.customerName.toLowerCase() === name.toLowerCase())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, name]);

  const stats = useMemo(() => {
    const totalSpent = history.reduce((sum, r) => sum + r.totalAmount, 0);
    const totalDebt = history.filter(r => !r.isPaid).reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0);
    const paidCount = history.filter(r => r.isPaid).length;
    return { totalSpent, totalDebt, paidCount };
  }, [history]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[130] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/10">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a] shrink-0">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isWalkIn ? 'bg-indigo-500/10 text-indigo-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
               {isWalkIn ? '🚶' : '👤'}
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white uppercase">{name}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {isWalkIn ? 'Aggregated History' : `Member ID: ${'id' in customer ? customer.id.slice(0, 6) : ''}`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition">✕</button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-[#1e293b] shrink-0 border-b border-white/5">
           <div className="p-4 bg-[#0f172a] rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Spent</p>
              <p className="text-lg font-black text-white">₱{stats.totalSpent.toLocaleString()}</p>
           </div>
           <div className="p-4 bg-[#0f172a] rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Debt</p>
              <p className={`text-lg font-black ${stats.totalDebt > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                 ₱{stats.totalDebt.toLocaleString()}
              </p>
           </div>
           <div className="hidden md:block p-4 bg-[#0f172a] rounded-2xl border border-white/5">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Transactions</p>
              <p className="text-lg font-black text-indigo-400">{history.length}</p>
           </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#020617]">
          {history.length === 0 ? (
            <div className="text-center py-12 opacity-50">
               <p className="text-xs font-bold text-slate-500 uppercase">No history records found.</p>
            </div>
          ) : (
            history.map(record => (
              <div 
                key={record.id} 
                onClick={() => onViewRecord(record)}
                className="flex justify-between items-center p-4 bg-[#1e293b] rounded-2xl border border-white/5 hover:border-[#6366f1]/50 cursor-pointer transition group"
              >
                 <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                       <span className={`w-2 h-2 rounded-full ${record.isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                       <p className="font-bold text-xs text-white truncate">{new Date(record.date).toLocaleString()}</p>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase truncate group-hover:text-slate-300 transition">
                       {record.quantity} Items • {record.product}
                    </p>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-sm text-white">₱{record.totalAmount.toFixed(2)}</p>
                    {!record.isPaid && (
                       <p className="text-[8px] font-black text-amber-500 uppercase bg-amber-500/10 px-1.5 py-0.5 rounded mt-1 inline-block">
                          Bal: ₱{(record.totalAmount - record.paidAmount).toFixed(2)}
                       </p>
                    )}
                 </div>
                 <div className="ml-3 text-slate-500 group-hover:text-white transition">›</div>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {!isWalkIn && isAdmin && onDelete && (
           <div className="p-6 bg-[#0f172a] border-t border-white/5">
              <button 
                onClick={onDelete}
                disabled={stats.totalDebt > 0}
                className="w-full py-4 border border-rose-500/20 text-rose-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {stats.totalDebt > 0 ? 'Cannot Delete (Clear Debt First)' : 'Delete Customer Profile'}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default CustomerHistoryModal;
