
import React from 'react';
import { ActivityLog } from '../types';
import { Clock, User, Zap, AlertCircle, Info } from 'lucide-react';

interface ActivityTimelineProps {
  logs: ActivityLog[];
}

const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ logs }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle size={18} className="text-rose-500" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-500" />;
      case 'success': return <Zap size={18} className="text-emerald-500" />;
      default: return <Info size={18} className="text-indigo-500" />;
    }
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 opacity-20">
        <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mb-6 shadow-inner">
          <Clock size={32} className="text-slate-400" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">No Activity Recorded</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative before:absolute before:left-7 before:top-2 before:bottom-2 before:w-px before:bg-slate-200 dark:before:bg-white/10 overflow-y-auto max-h-[450px] pr-4 no-scrollbar">
      {logs.slice(0, 15).map((log, idx) => (
        <div key={log.id} className="relative pl-16 animate-in slide-in-from-left-4 group" style={{ animationDelay: `${idx * 50}ms` }}>
          <div className="absolute left-0 top-0 w-14 h-14 rounded-2xl bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-white/10 flex items-center justify-center shadow-xl z-10 group-hover:scale-110 transition-transform duration-500">
            {getIcon(log.type)}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">{log.action}</h4>
              <div className="flex items-center gap-2">
                <Clock size={10} className="text-slate-400" />
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed uppercase tracking-tight">{log.details}</p>
            <div className="flex items-center gap-3 pt-1">
              <div className="px-3 py-1 bg-indigo-500/5 rounded-lg border border-indigo-500/10 flex items-center gap-2">
                <User size={10} className="text-indigo-500" />
                <span className="text-[8px] font-black uppercase text-indigo-500 tracking-[0.2em]">{log.user}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-white/10"></div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityTimeline;
