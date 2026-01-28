
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <h3 className="text-xl font-bold mb-1">Partial Payment</h3>
          <p className="text-xs text-slate-500 mb-6 uppercase font-black tracking-widest">Customer: {record.customerName}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Debt</p>
              <p className="text-lg font-black">₱{record.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
              <p className="text-[10px] text-indigo-400 font-bold uppercase mb-1">Balance</p>
              <p className="text-lg font-black text-indigo-600">₱{remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Payment Amount (₱)</label>
              <input
                autoFocus
                type="number"
                step="0.01"
                max={remainingBalance}
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-black focus:ring-2 focus:ring-primary outline-none transition"
                value={payAmount}
                onChange={e => setPayAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex gap-2">
              {[10, 20, 50, 100, 200, 500].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPayAmount(Math.min(val, remainingBalance))}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-[10px] font-black hover:bg-slate-200 transition"
                >
                  ₱{val}
                </button>
              ))}
            </div>
          </form>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={payAmount <= 0}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
          >
            Confirm Pay
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartialPayModal;
