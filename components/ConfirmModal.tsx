
import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

const InfoIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const DangerIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isDanger = true
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-white/10">
        <div className="p-8 pb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${isDanger ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-500' : 'bg-primary/10 text-primary'}`}>
             {isDanger ? <DangerIcon /> : <InfoIcon />}
          </div>
          <h3 className="text-xl font-extrabold mb-2 text-slate-900 dark:text-white">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-4 rounded-xl font-bold text-xs uppercase tracking-widest text-white transition shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
              isDanger 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' 
                : 'bg-primary hover:bg-primary-dark shadow-primary/30'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
