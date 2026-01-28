import React, { useState } from 'react';
import { SecurityService } from '../services/securityService';

interface AdminPINModalProps {
  onVerify: () => void;
  onCancel: () => void;
  adminPinHash: string;
  title?: string;
  subtitle?: string;
}

const AdminPINModal: React.FC<AdminPINModalProps> = ({ 
  onVerify, onCancel, adminPinHash, 
  title = "Admin Authorization", 
  subtitle = "Enter Admin PIN to confirm action" 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleInput = async (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        const inputHash = await SecurityService.hashPin(newPin);
        if (inputHash === adminPinHash) {
          onVerify();
        } else {
          setError(true);
          setTimeout(() => { setPin(''); setError(false); }, 1000);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[500] p-6">
      <div className="w-full max-w-xs text-center space-y-8 animate-in zoom-in duration-200">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-rose-500 rounded-3xl mx-auto flex items-center justify-center text-2xl shadow-xl border border-white/10">🛡️</div>
          <h2 className="text-white text-xl font-black uppercase tracking-widest">{title}</h2>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{subtitle}</p>
        </div>

        <div className="flex gap-4 justify-center">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 border-rose-500 transition-all duration-300 ${pin.length > i ? 'bg-rose-500 scale-125 shadow-lg shadow-rose-500/50' : 'bg-transparent'} ${error ? 'animate-bounce border-red-500 bg-red-500' : ''}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✕'].map(btn => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') setPin('');
                else if (btn === '✕') onCancel();
                else handleInput(btn);
              }}
              className={`h-16 flex items-center justify-center text-xl font-black rounded-2xl transition active:scale-90 ${
                btn === '✕' ? 'bg-white/5 text-slate-400' : 'bg-slate-900 text-slate-100 hover:bg-slate-800 border border-white/5'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPINModal;