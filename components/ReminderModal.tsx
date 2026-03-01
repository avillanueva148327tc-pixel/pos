
import React, { useState } from 'react';
import { UtangRecord, ReminderFrequency } from '../types';

interface ReminderModalProps {
  record: UtangRecord;
  onSave: (frequency: ReminderFrequency, nextDate: string, note: string) => void;
  onClose: () => void;
}

const ReminderModal: React.FC<ReminderModalProps> = ({ record, onSave, onClose }) => {
  const [frequency, setFrequency] = useState<ReminderFrequency>(record.reminderFrequency || 'none');
  const [nextDate, setNextDate] = useState(record.nextReminderDate || new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState(record.reminderNote || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(frequency, nextDate, note);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[501] p-4 animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 relative z-10 animate-in slide-in-from-bottom-4">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center text-2xl ring-1 ring-indigo-500/20 shadow-sm">🔔</div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">Set Reminder</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Follow-up: {record.customerName}</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 px-1">Frequency</label>
              <div className="grid grid-cols-2 gap-3">
                {(['none', 'daily', 'weekly', 'monthly'] as ReminderFrequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFrequency(f)}
                    className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      frequency === f 
                        ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20' 
                        : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/5 text-slate-400 hover:border-indigo-500/30'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {frequency !== 'none' && (
              <div className="animate-in slide-in-from-top-2 space-y-6">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Next Follow-up Date</label>
                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-all">
                    <input
                      type="date"
                      className="w-full p-4 bg-transparent text-slate-900 dark:text-white font-black text-xs outline-none uppercase tracking-widest"
                      value={nextDate}
                      onChange={e => setNextDate(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1">Reminder Message</label>
                  <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden focus-within:border-indigo-500/50 transition-all">
                    <textarea
                      className="w-full p-4 bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none min-h-[100px] resize-none placeholder:text-slate-400 dark:placeholder:text-slate-700"
                      placeholder="e.g. Please pay by Friday..."
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/10 flex gap-3">
              <span className="text-lg">💡</span>
              <p className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold leading-relaxed uppercase tracking-wider">
                Notifications will appear on the dashboard when due.
              </p>
            </div>
          </form>
        </div>

        <div className="p-6 md:p-8 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200 dark:border-white/10"
          >
            Discard
          </button>
          <button
            onClick={handleSubmit}
            className="flex-[2] py-4 bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95"
          >
            Save Setting
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderModal;
