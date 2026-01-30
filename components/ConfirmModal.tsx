
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200 border border-slate-200 dark:border-white/10">
        <div className="p-8 pb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-4 ${isDanger ? 'bg-rose-100 text-rose-500' : 'bg-indigo-100 text-indigo-500'}`}>
             {isDanger ? '⚠️' : 'ℹ️'}
          </div>
          <h3 className="text-xl font-black mb-2 text-slate-900 dark:text-white">{title}</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-4 rounded-xl font-black text-xs uppercase tracking-widest text-white transition shadow-lg hover:scale-[1.02] active:scale-[0.98] ${
              isDanger 
                ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/30' 
                : 'bg-[#6366f1] hover:bg-indigo-600 shadow-indigo-500/30'
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
