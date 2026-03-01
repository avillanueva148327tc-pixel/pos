
import React from 'react';
import { UtangRecord } from '../types';
import { Calendar, AlertCircle, Clock, ChevronRight } from 'lucide-react';

interface DebtRemindersListProps {
  records: UtangRecord[];
  onSelectRecord: (record: UtangRecord) => void;
}

const DebtRemindersList: React.FC<DebtRemindersListProps> = ({ records, onSelectRecord }) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const reminders = records
    .filter(r => !r.isPaid && r.dueDate)
    .map(r => {
      const dueDate = new Date(r.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { ...r, diff };
    })
    .sort((a, b) => a.diff - b.diff);

  if (reminders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 opacity-20">
        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
          <Calendar size={32} className="text-slate-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">No Pending Collections</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[450px] pr-4 no-scrollbar">
      {reminders.map(r => (
        <button
          key={r.id}
          onClick={() => onSelectRecord(r)}
          className={`w-full p-6 rounded-[2.5rem] border transition-all duration-500 flex items-center justify-between group relative overflow-hidden ${
            r.diff < 0 
              ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/30' 
              : r.diff === 0 
                ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/30'
                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 hover:border-indigo-500/30'
          }`}
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:scale-110 ${
              r.diff < 0 ? 'bg-rose-500 text-white shadow-rose-500/20' : r.diff === 0 ? 'bg-amber-500 text-white shadow-amber-500/20' : 'bg-indigo-600 text-white shadow-indigo-500/20'
            }`}>
              {r.diff < 0 ? <AlertCircle size={24} /> : r.diff === 0 ? <Clock size={24} /> : <Calendar size={24} />}
            </div>
            <div className="text-left space-y-1">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white truncate max-w-[160px]">{r.customerName}</h4>
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${r.diff < 0 ? 'bg-rose-500' : r.diff === 0 ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                <p className={`text-[9px] font-black uppercase tracking-widest ${r.diff < 0 ? 'text-rose-500' : r.diff === 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                  {r.diff < 0 ? `${Math.abs(r.diff)} Days Overdue` : r.diff === 0 ? 'Due Today' : `Due in ${r.diff} Days`}
                </p>
              </div>
            </div>
          </div>
          <div className="text-right flex items-center gap-6 relative z-10">
            <div className="space-y-1">
              <p className="text-lg font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">₱{(r.totalAmount - r.paidAmount).toLocaleString()}</p>
              <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Balance Due</p>
            </div>
            <div className="w-10 h-10 bg-white dark:bg-white/5 rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-300 group-hover:text-indigo-500 group-hover:border-indigo-500/30 transition-all shadow-lg">
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default DebtRemindersList;
