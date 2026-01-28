
import React, { useState } from 'react';
import { UtangRecord, ReminderFrequency } from '../types';

interface ReminderModalProps {
  record: UtangRecord;
  onSave: (frequency: ReminderFrequency, nextDate: string) => void;
  onClose: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ record, onSave, onClose }) => {
  const [frequency, setFrequency] = useState<ReminderFrequency>(record.reminderFrequency || 'none');
  const [nextDate, setNextDate] = useState(record.nextReminderDate || new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(frequency, nextDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl flex items-center justify-center text-xl">🔔</div>
            <div>
              <h3 className="text-xl font-bold">Set Reminder</h3>
              <p className="text-xs text-slate-500 font-medium">Follow-up for {record.customerName}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Frequency</label>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'daily', 'weekly', 'monthly'] as ReminderFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`px-4 py-3 rounded-xl text-xs font-bold capitalize transition border-2 ${
                      frequency === f 
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                        : 'bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {frequency !== 'none' && (
              <div className="animate-in slide-in-from-top-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Next Follow-up Date</label>
                <input
                  type="date"
                  className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-primary outline-none transition"
                  value={nextDate}
                  onChange={e => setNextDate(e.target.value)}
                />
              </div>
            )}
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 flex gap-3">
              <span className="text-lg">💡</span>
              <p className="text-[10px] text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                You will receive an in-app notification on the dashboard when it's time to collect from this customer.
              </p>
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
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            Save Setting
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
