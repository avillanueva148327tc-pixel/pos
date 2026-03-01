import React, { useState } from 'react';

interface InputModalProps {
  isOpen: boolean;
  title: string;
  label: string;
  defaultValue: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

const InputModal: React.FC<InputModalProps> = ({ isOpen, title, label, defaultValue, onConfirm, onCancel }) => {
  const [value, setValue] = useState(defaultValue);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-[600] p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10">
        <div className="p-8">
          <h3 className="text-xl font-black text-white uppercase tracking-tight mb-6">{title}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">{label}</label>
              <div className="bg-[#1e293b] border border-slate-700 rounded-2xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all h-14">
                <input 
                  autoFocus
                  className="w-full h-full px-4 bg-transparent text-white font-bold text-xs outline-none"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && onConfirm(value)}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-[#0f172a] border-t border-white/5 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-4 bg-white/5 text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition">Cancel</button>
          <button onClick={() => onConfirm(value)} className="flex-1 py-4 bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;
