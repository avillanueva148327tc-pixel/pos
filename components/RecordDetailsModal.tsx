
import React, { useMemo } from 'react';
import { UtangRecord, UtangItem } from '../types';

interface RecordDetailsModalProps {
  record: UtangRecord;
  onClose: () => void;
  onAction: (type: 'receipt' | 'partial' | 'payFull' | 'reminder' | 'delete' | 'edit' | 'customize', record: UtangRecord) => void;
  isAdmin?: boolean;
}

const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({ record, onClose, onAction, isAdmin = false }) => {
  const balance = Math.max(0, parseFloat((record.totalAmount - record.paidAmount).toFixed(2)));

  // New Grouping Logic: Group items into "sessions" based on timestamp proximity
  const groupedItems = useMemo(() => {
    if (!record.items || record.items.length === 0) return [];

    const sortedItems = [...record.items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const groups: { date: Date; items: UtangItem[] }[] = [];
    if (sortedItems.length === 0) return [];

    let currentGroup: { date: Date; items: UtangItem[] } = {
      date: new Date(sortedItems[0].date),
      items: [sortedItems[0]],
    };
    groups.push(currentGroup);

    const SESSION_GAP_SECONDS = 60; // Group items added within 1 minute of each other

    for (let i = 1; i < sortedItems.length; i++) {
      const currentItem = sortedItems[i];
      const prevItemDate = new Date(currentGroup.items[currentGroup.items.length - 1].date);
      const currentItemDate = new Date(currentItem.date);
      const diffInSeconds = (currentItemDate.getTime() - prevItemDate.getTime()) / 1000;

      if (diffInSeconds < SESSION_GAP_SECONDS) {
        currentGroup.items.push(currentItem);
      } else {
        currentGroup = { date: currentItemDate, items: [currentItem] };
        groups.push(currentGroup);
      }
    }
    
    return groups.sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first
  }, [record.items]);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[120] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/10 ring-1 ring-white/5">
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-2xl font-black tracking-tight text-white">{record.isPaid ? 'Payment Receipt' : 'Statement of Account'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ref: {record.id.slice(0, 8).toUpperCase()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => onAction('edit', record)}
                className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-500/20 transition active:scale-95"
                title="Edit Transaction"
              >
                ✏️
              </button>
            )}
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 font-bold text-xl transition">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4">
             <div className="p-5 bg-[#1e293b] rounded-3xl border border-white/5">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                <p className="font-extrabold truncate uppercase text-sm text-white">{record.customerName}</p>
             </div>
             <div className="p-5 bg-[#1e293b] rounded-3xl border border-white/5 text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Account Status</p>
                <p className={`font-black text-xs uppercase ${record.isPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {record.isPaid ? '✓ Fully Settled' : 'Pending Payment'}
                </p>
             </div>
          </div>

          <div className="space-y-6">
             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Receipt Catalog</h5>
             <div className="space-y-4">
                {groupedItems.map((group, groupIndex) => (
                  <div key={groupIndex} className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 animate-in fade-in duration-300">
                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-white/10">
                      <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {new Date(group.date).toLocaleString('en-US', { 
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true 
                        })}
                      </p>
                      <p className="text-[9px] font-bold text-slate-500 uppercase">
                        Subtotal: <span className="text-white font-black">₱{group.items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="space-y-2">
                      {group.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="flex justify-between items-center px-2 py-1">
                          <div className="flex-1 min-w-0 pr-4">
                            <p className="font-extrabold text-xs uppercase truncate text-white">{item.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">₱{item.price.toFixed(2)} x {item.quantity} {item.unit || 'pc'}</p>
                          </div>
                          <p className="font-black text-sm text-white tabular-nums">₱{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
          </div>

          <div className="p-8 bg-[#020617] text-white rounded-[2rem] space-y-6 shadow-2xl relative overflow-hidden shrink-0 mt-4 border border-white/5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366f1]/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="grid grid-cols-2 gap-y-6 relative z-10">
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Accumulated Debt</p>
                <p className="text-2xl font-black tracking-tighter text-white">₱{record.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Payments Made</p>
                <p className="text-2xl font-black text-emerald-400 tracking-tighter">₱{record.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              
              <div className="col-span-2 pt-4 border-t border-white/5">
                <div className="flex justify-between items-end">
                   <div>
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Remaining Balance</p>
                     <p className={`text-4xl font-black tracking-tighter ${balance > 0 ? 'text-rose-400' : 'text-emerald-500'}`}>
                       ₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                     </p>
                   </div>
                   <div className="text-right">
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Repayment</p>
                     <p className="text-xs font-bold text-slate-400">
                        {Math.floor((record.paidAmount / record.totalAmount) * 100)}% Complete
                     </p>
                   </div>
                </div>
              </div>
            </div>

            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden relative z-10">
               <div className="h-full bg-[#6366f1] transition-all duration-700" style={{ width: `${(record.paidAmount / record.totalAmount) * 100}%` }}></div>
            </div>
          </div>
        </div>

        <div className="p-8 border-t border-white/5 flex flex-wrap gap-3 shrink-0 bg-[#0f172a]">
          {!record.isPaid && (
            <>
              <button onClick={() => onAction('payFull', record)} className="flex-[2] py-4 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 transition hover:scale-[1.02] active:scale-95">Settle Full Balance</button>
              <button onClick={() => onAction('partial', record)} className="flex-1 py-4 bg-[#1e293b] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition hover:bg-slate-700 active:scale-95 border border-white/5">Partial Pay</button>
              <button onClick={() => onAction('reminder', record)} className="flex-1 py-4 bg-indigo-500/10 text-indigo-400 rounded-2xl font-black uppercase text-[10px] tracking-widest transition hover:bg-indigo-500/20 active:scale-95 border border-indigo-500/20">🔔 Reminder</button>
            </>
          )}
          
          <div className="flex gap-2 flex-[1.5]">
             <button onClick={() => onAction('receipt', record)} className="flex-1 px-4 py-4 bg-[#1e293b] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-700 transition flex items-center justify-center gap-2 active:scale-95 border border-white/5">
                🖨️ Print
             </button>
             {isAdmin && (
                <button onClick={() => onAction('customize', record)} className="flex-1 px-4 py-4 bg-indigo-500/10 text-indigo-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition active:scale-95 flex items-center justify-center gap-2 border border-indigo-500/20">
                    🎨 Design
                </button>
             )}
          </div>
          
          {isAdmin && <button onClick={() => onAction('delete', record)} className="px-6 py-4 bg-rose-500/10 text-rose-500 rounded-2xl text-xl hover:bg-rose-500 hover:text-white transition active:scale-95 border border-rose-500/20">🗑️</button>}
        </div>
      </div>
    </div>
  );
};

export default RecordDetailsModal;
