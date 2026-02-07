
import React, { useState, useMemo } from 'react';
import { ShiftRecord, CashMovement, UserRole } from '../types';

interface ShiftModalProps {
  activeShift: ShiftRecord | null;
  shiftHistory: ShiftRecord[];
  onOpenShift: (startingCash: number) => void;
  onCloseShift: (actualCash: number, note: string) => void;
  onAddMovement: (type: 'in' | 'out', amount: number, reason: string) => void;
  onClose: () => void;
  userRole: UserRole;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ 
  activeShift, 
  shiftHistory, 
  onOpenShift, 
  onCloseShift, 
  onAddMovement, 
  onClose,
  userRole 
}) => {
  const [tab, setTab] = useState<'current' | 'history'>('current');
  
  // Open Shift State
  const [startingCash, setStartingCash] = useState<string>('');
  
  // Cash Movement State
  const [moveType, setMoveType] = useState<'in' | 'out' | null>(null);
  const [moveAmount, setMoveAmount] = useState<string>('');
  const [moveReason, setMoveReason] = useState<string>('');

  // Close Shift State
  const [isClosing, setIsClosing] = useState(false);
  const [actualCash, setActualCash] = useState<string>('');
  const [closeNote, setCloseNote] = useState<string>('');

  // Calculations for Active Shift
  const shiftTotals = useMemo(() => {
    if (!activeShift) return { added: 0, removed: 0, expected: 0 };
    const added = activeShift.movements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0);
    const removed = activeShift.movements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0);
    const expected = activeShift.startingCash + activeShift.cashSales + added - removed;
    return { added, removed, expected };
  }, [activeShift]);

  const handleOpen = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenShift(parseFloat(startingCash) || 0);
  };

  const handleMovementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (moveType && moveAmount) {
      onAddMovement(moveType, parseFloat(moveAmount), moveReason || (moveType === 'in' ? 'Cash Added' : 'Expense'));
      setMoveType(null);
      setMoveAmount('');
      setMoveReason('');
    }
  };

  const handleCloseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCloseShift(parseFloat(actualCash) || 0, closeNote);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Cash Register</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Shift Management</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="flex bg-[#1e293b] rounded-xl p-1 border border-white/5">
                <button onClick={() => setTab('current')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${tab === 'current' ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-400'}`}>Current</button>
                <button onClick={() => setTab('history')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition ${tab === 'history' ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-400'}`}>History</button>
             </div>
             <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition ml-2">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#020617]">
          
          {tab === 'history' && (
             <div className="space-y-4">
               {shiftHistory.length === 0 ? (
                 <div className="text-center py-10 opacity-50">
                   <p className="text-xs font-bold text-slate-500 uppercase">No closed shifts history.</p>
                 </div>
               ) : (
                 shiftHistory.slice().reverse().map(shift => (
                   <div key={shift.id} className="p-4 bg-[#1e293b] rounded-2xl border border-white/5">
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{new Date(shift.openedAt).toLocaleDateString()} • {new Date(shift.openedAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                            <p className="text-xs font-bold text-white mt-1">Opened by {shift.openedBy}</p>
                         </div>
                         <div className="text-right">
                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${shift.status === 'closed' ? 'bg-slate-700 text-slate-300' : 'bg-emerald-500 text-white'}`}>
                              {shift.status}
                            </span>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-white/5">
                         <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">Start Cash</p>
                            <p className="text-xs font-black text-white">₱{shift.startingCash.toLocaleString()}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-bold text-slate-500 uppercase">Sales</p>
                            <p className="text-xs font-black text-emerald-400">+₱{shift.cashSales.toLocaleString()}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-bold text-slate-500 uppercase">Expected</p>
                            <p className="text-xs font-black text-white">₱{shift.expectedTotal.toLocaleString()}</p>
                         </div>
                      </div>

                      {shift.status === 'closed' && (
                        <div className="flex justify-between items-center mt-3 pt-1">
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Discrepancy</p>
                           <p className={`text-xs font-black ${(shift.discrepancy || 0) < 0 ? 'text-rose-500' : (shift.discrepancy || 0) > 0 ? 'text-emerald-500' : 'text-slate-300'}`}>
                             {shift.discrepancy === 0 ? 'Perfect Match' : `₱${(shift.discrepancy || 0).toLocaleString()}`}
                           </p>
                        </div>
                      )}
                   </div>
                 ))
               )}
             </div>
          )}

          {tab === 'current' && !activeShift && (
             <div className="flex flex-col items-center justify-center h-full py-10 space-y-6">
                <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center text-4xl shadow-xl">💤</div>
                <div className="text-center">
                   <h3 className="text-xl font-black text-white uppercase">Register Closed</h3>
                   <p className="text-xs text-slate-400 mt-1">Open a new shift to start tracking cash.</p>
                </div>
                <form onSubmit={handleOpen} className="w-full max-w-xs space-y-4">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Starting Cash Amount</label>
                      <div className="relative">
                         <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₱</span>
                         <input 
                           autoFocus
                           type="number" 
                           step="any"
                           value={startingCash}
                           onChange={e => setStartingCash(e.target.value)}
                           className="w-full pl-8 pr-4 py-4 bg-[#1e293b] border border-white/5 rounded-2xl font-black text-lg text-white outline-none focus:border-[#6366f1] transition"
                           placeholder="0.00"
                         />
                      </div>
                   </div>
                   <button type="submit" className="w-full py-4 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition">
                      Open Register
                   </button>
                </form>
             </div>
          )}

          {tab === 'current' && activeShift && (
             <div className="space-y-6">
                {/* Dashboard Card */}
                <div className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-6 rounded-[2.5rem] border border-white/5 relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                   
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 relative z-10">EXPECTED CASH IN DRAWER</p>
                   <h2 className="text-4xl font-black text-white tracking-tighter relative z-10">₱{shiftTotals.expected.toLocaleString(undefined, {minimumFractionDigits: 2})}</h2>
                   
                   <div className="grid grid-cols-2 gap-4 mt-6 relative z-10">
                      <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                         <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">OPENING</p>
                         <p className="text-sm font-black text-slate-300">₱{activeShift.startingCash.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                         <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">SALES (CASH)</p>
                         <p className="text-sm font-black text-emerald-400">+₱{activeShift.cashSales.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                         <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">ADDED</p>
                         <p className="text-sm font-black text-indigo-300">+₱{shiftTotals.added.toLocaleString()}</p>
                      </div>
                      <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                         <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest mb-1">REMOVED</p>
                         <p className="text-sm font-black text-rose-300">-₱{shiftTotals.removed.toLocaleString()}</p>
                      </div>
                   </div>
                </div>

                {/* Actions */}
                {!isClosing && !moveType && (
                   <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setMoveType('in')} className="py-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 transition">
                         + Add Cash
                      </button>
                      <button onClick={() => setMoveType('out')} className="py-4 bg-[#1e293b] border border-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 transition">
                         - Remove / Expense
                      </button>
                      <button onClick={() => setIsClosing(true)} className="col-span-2 py-4 bg-white/5 border border-white/5 text-slate-300 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition">
                         End Shift & Close Register
                      </button>
                   </div>
                )}

                {/* Cash Movement Form */}
                {moveType && (
                   <form onSubmit={handleMovementSubmit} className="bg-[#1e293b] p-4 rounded-3xl border border-white/5 space-y-4 animate-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center">
                         <h4 className="text-sm font-black text-white uppercase">{moveType === 'in' ? 'Add Cash to Drawer' : 'Remove Cash from Drawer'}</h4>
                         <button type="button" onClick={() => setMoveType(null)} className="text-xs text-slate-500 hover:text-white">Cancel</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                            <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Amount</label>
                            <input 
                              autoFocus 
                              type="number" 
                              step="any"
                              required
                              value={moveAmount}
                              onChange={e => setMoveAmount(e.target.value)}
                              className="w-full p-3 bg-[#0f172a] rounded-xl border border-white/10 text-white font-bold text-sm outline-none focus:border-[#6366f1]" 
                              placeholder="0.00"
                            />
                         </div>
                         <div>
                            <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Reason</label>
                            <input 
                              type="text" 
                              value={moveReason}
                              onChange={e => setMoveReason(e.target.value)}
                              className="w-full p-3 bg-[#0f172a] rounded-xl border border-white/10 text-white font-bold text-sm outline-none focus:border-[#6366f1]" 
                              placeholder={moveType === 'in' ? "Replenish Change" : "Lunch / Supplies"}
                            />
                         </div>
                      </div>
                      <button className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest text-white shadow-lg ${moveType === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}>
                         Confirm {moveType === 'in' ? 'Deposit' : 'Withdrawal'}
                      </button>
                   </form>
                )}

                {/* Closing Form */}
                {isClosing && (
                   <form onSubmit={handleCloseSubmit} className="bg-[#1e293b] p-6 rounded-3xl border border-white/5 space-y-6 animate-in slide-in-from-bottom-2">
                      <div>
                         <h4 className="text-lg font-black text-white uppercase tracking-tight">Closing Reconciliation</h4>
                         <p className="text-[10px] text-slate-400 mt-1 font-medium">Count the actual physical cash in the drawer.</p>
                      </div>
                      
                      <div className="bg-[#0f172a] p-4 rounded-2xl border border-white/5 text-center">
                         <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">EXPECTED SYSTEM COUNT</p>
                         <p className="text-2xl font-black text-slate-300">₱{shiftTotals.expected.toLocaleString()}</p>
                      </div>

                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">ACTUAL CASH COUNT</label>
                         <input 
                           autoFocus 
                           type="number" 
                           step="any"
                           required
                           value={actualCash}
                           onChange={e => setActualCash(e.target.value)}
                           className="w-full p-4 bg-[#0f172a] rounded-2xl border border-white/10 text-white font-black text-xl outline-none focus:border-[#6366f1] text-center" 
                           placeholder="0.00"
                         />
                      </div>

                      {actualCash && (
                         <div className={`p-3 rounded-xl text-center border ${
                            (parseFloat(actualCash) - shiftTotals.expected) === 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                            (parseFloat(actualCash) - shiftTotals.expected) < 0 ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                            'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                         }`}>
                            <p className="text-[9px] font-black uppercase tracking-widest">
                               {(parseFloat(actualCash) - shiftTotals.expected) === 0 ? 'PERFECT MATCH' :
                                (parseFloat(actualCash) - shiftTotals.expected) < 0 ? 'SHORTAGE (KULANG)' : 'OVERAGE (SOBRA)'}
                            </p>
                            <p className="text-lg font-black mt-1">
                               {(parseFloat(actualCash) - shiftTotals.expected) > 0 ? '+' : ''}
                               ₱{(parseFloat(actualCash) - shiftTotals.expected).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </p>
                         </div>
                      )}

                      <div>
                         <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">NOTES (OPTIONAL)</label>
                         <input 
                           type="text" 
                           value={closeNote}
                           onChange={e => setCloseNote(e.target.value)}
                           className="w-full p-3 bg-[#0f172a] rounded-xl border border-white/10 text-white font-bold text-xs outline-none focus:border-[#6366f1]" 
                           placeholder="Explain discrepancy..."
                         />
                      </div>

                      <div className="flex gap-3">
                         <button type="button" onClick={() => setIsClosing(false)} className="flex-1 py-3 bg-white/5 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-white transition">Cancel</button>
                         <button type="submit" className="flex-[2] py-3 bg-[#6366f1] rounded-xl text-[10px] font-black uppercase text-white shadow-lg hover:bg-indigo-500 transition">Confirm Close</button>
                      </div>
                   </form>
                )}

                {/* Recent Movements List */}
                {activeShift.movements.length > 0 && (
                   <div className="pt-4 border-t border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">SESSION ACTIVITY</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                         {activeShift.movements.slice().reverse().map(m => (
                            <div key={m.id} className="flex justify-between items-center text-xs p-2 bg-[#1e293b] rounded-lg border border-white/5">
                               <div>
                                  <span className={`font-black uppercase mr-2 ${m.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>{m.type === 'in' ? 'IN' : 'OUT'}</span>
                                  <span className="text-slate-300">{m.reason}</span>
                               </div>
                               <span className="font-bold text-white">₱{m.amount.toLocaleString()}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                )}
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
