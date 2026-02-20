import React, { useState, useEffect } from 'react';
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
  title = "ADMIN AUTH", 
  subtitle = "Clearance Required" 
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [lastChar, setLastChar] = useState<string | null>(null);

  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => setLockoutTime(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleInput = async (num: string) => {
    if (pin.length < 4 && !error && lockoutTime === 0) {
      const newPin = pin + num;
      setPin(newPin);
      setLastChar(num);
      setTimeout(() => setLastChar(null), 400);
      
      if ('vibrate' in navigator) navigator.vibrate(10);

      if (newPin.length === 4) {
        const inputHash = await SecurityService.hashPin(newPin);
        if (inputHash === adminPinHash) {
          onVerify();
        } else {
          setError(true);
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          
          if (newAttempts >= 3) {
            setLockoutTime(30);
            setAttempts(0);
          }

          if ('vibrate' in navigator) navigator.vibrate([80, 40, 80]);
          setTimeout(() => { 
            setPin(''); 
            setError(false); 
          }, 600);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center z-[500] p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-[240px] text-center space-y-4 animate-in zoom-in duration-200">
        <div className="space-y-2">
          <div className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center text-xl shadow-2xl border-2 relative overflow-hidden transition-colors duration-500 ${lockoutTime > 0 ? 'bg-rose-500/10 border-rose-500/30' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
             <div className={`absolute inset-0 blur-xl animate-pulse ${lockoutTime > 0 ? 'bg-rose-500/20' : 'bg-indigo-500/20'}`}></div>
             {lockoutTime > 0 ? '🚫' : '🔐'}
          </div>
          <div className="space-y-0.5">
            <h2 className="text-white text-sm font-black uppercase tracking-widest">{lockoutTime > 0 ? 'LOCKED' : title}</h2>
            <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">
              {lockoutTime > 0 ? `Retry in ${lockoutTime}s` : subtitle}
            </p>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className={`flex gap-4 justify-center py-2 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => {
             const isActive = pin.length > i;
             const isLatest = pin.length === i + 1 && lastChar !== null;
             return (
              <div key={i} className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 border ${
                  error
                    ? 'bg-rose-500 border-rose-400 scale-110 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                    : isActive 
                      ? 'bg-indigo-500 border-indigo-400 scale-125 shadow-[0_0_8px_rgba(99,102,241,0.6)]' 
                      : 'bg-white/5 border-white/10'
                }`} 
              >
                {isLatest && !error && <span className="text-[7px] font-black text-white">{pin[i]}</span>}
              </div>
             );
          })}
        </div>

        <div className={`grid grid-cols-3 gap-2 transition-all duration-300 ${lockoutTime > 0 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✕'].map(btn => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') setPin('');
                else if (btn === '✕') onCancel();
                else handleInput(btn);
              }}
              className={`h-11 flex items-center justify-center text-base font-black rounded-xl transition active:scale-90 ${
                btn === '✕' ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white' : 
                btn === 'C' ? 'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5' :
                'bg-slate-900/60 text-slate-100 hover:bg-slate-800 border border-white/5 shadow-md'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
      <style>{`
         @keyframes shake {
           0%, 100% { transform: translateX(0); }
           25% { transform: translateX(-4px); }
           75% { transform: translateX(4px); }
         }
         .animate-shake {
           animation: shake 0.3s cubic-bezier(.36,.07,.19,.97) both;
         }
      `}</style>
    </div>
  );
};

export default AdminPINModal;