import React from 'react';
import { UtangRecord } from '../types';
import { Bell, CheckCircle } from 'lucide-react';

interface NotificationsModalProps {
  records: UtangRecord[];
  onClose: () => void;
  onAcknowledge: (record: UtangRecord) => void;
  onNavigateToRecord: (record: UtangRecord) => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({ records, onClose, onAcknowledge, onNavigateToRecord }) => {
  const today = new Date().toISOString().split('T')[0];
  const dueReminders = records.filter(r => 
    !r.isPaid && 
    r.reminderFrequency && 
    r.reminderFrequency !== 'none' && 
    r.nextReminderDate && 
    r.nextReminderDate <= today
  );

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[80vh] relative z-10 animate-in slide-in-from-bottom-4">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#1e293b]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center ring-1 ring-indigo-500/20">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm text-slate-900 dark:text-white">Notifications</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dueReminders.length} Pending Reminders</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 hover:bg-rose-500 hover:text-white transition-all">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-white dark:bg-[#020617]/40">
          {dueReminders.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center opacity-20">
              <CheckCircle size={48} className="mb-4 text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">All caught up!</p>
            </div>
          ) : (
            dueReminders.map(record => (
              <div key={record.id} className="p-5 bg-white dark:bg-[#1e293b]/50 rounded-[1.5rem] border border-slate-200 dark:border-white/10 shadow-sm group hover:border-indigo-500/30 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">{record.customerName}</h4>
                    <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1">Due: {record.nextReminderDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-indigo-500 text-sm">₱{(record.totalAmount - record.paidAmount).toLocaleString()}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Balance</p>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-100 dark:border-white/5 mb-5">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic">"{record.reminderNote || `Follow up on debt collection for ${record.product}`}"</p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => { onClose(); onNavigateToRecord(record); }}
                    className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => onAcknowledge(record)}
                    className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsModal;
