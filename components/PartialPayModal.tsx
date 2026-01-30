
import React, { useState } from 'react';
import { UtangRecord } from '../types';

interface PartialPayModalProps {
  record: UtangRecord;
  onPay: (amount: number) => void;
  onClose: () => void;
}

const PartialPayModal: React.FC<PartialPayModalProps> = ({ record, onPay, onClose }) => {
  // Use high-precision rounding for the balance
  const remainingBalance = Math.round((record.totalAmount - record.paidAmount + Number.EPSILON) * 100) / 100;
  const [payAmount, setPayAmount] = useState<number>(remainingBalance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) return;
    // Cap at remaining balance to prevent accidental overpayment
    const finalAmount = Math.min(payAmount, remainingBalance);
    onPay(finalAmount);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[110] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-8">
          <h3 className="text-xl font-black mb-1 text-white">Partial Payment</h3>
          <p className="text-xs text-slate-400 mb-8 uppercase font-black tracking-widest">Customer: {record.customerName}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-4 bg-[#1e293b] rounded-2xl border border-white/5">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Debt</p>
              <p className="text-lg font-black text-white">₱{record.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
              <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Balance</p>
              <p className="text-lg font-black text-indigo-400">₱{remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Payment Amount (₱)</label>
              <input
                autoFocus
                type="number"
                step="0.01"
                max={remainingBalance}
                className="w-full p-5 bg-[#1e293b] border border-slate-700 rounded-2xl text-2xl font-black text-white focus:ring-2 focus:ring-[#6366f1] outline-none transition"
                value={payAmount}
                onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {[10, 20, 50, 100, 200, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPayAmount(Math.min(val, remainingBalance))}
                  className="flex-1 min-w-[30%] py-3 rounded-xl bg-white/5 border border-white/5 text-white text-[10px] font-black hover:bg-white/10 transition uppercase"
                >
                  ₱{val}
                </button>
              ))}
            </div>
          </form>
        </div>

        <div className="p-6 bg-[#020617] border-t border-white/5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-4 rounded-2xl border border-white/10 font-black text-slate-400 hover:bg-white/5 transition uppercase text-[10px] tracking-widest"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={payAmount <= 0}
            className="flex-1 px-4 py-4 rounded-2xl bg-[#6366f1] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
          >
            Confirm Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialPayModal;
