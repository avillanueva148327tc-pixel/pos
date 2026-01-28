
import React, { useState } from 'react';

interface LoginScreenProps {
  onLogin: (pin: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [pin, setPin] = useState('');

  const handleInput = (num: string) => {
    if (pin.length < 4) setPin(prev => prev + num);
  };

  const handleClear = () => setPin('');

  const handleSubmit = () => {
    if (pin.length === 4) {
      onLogin(pin);
      setPin('');
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <div className="w-full max-w-[280px] text-center animate-in">
        
        {/* Store Icon Container */}
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110"></div>
          <div className="w-16 h-16 bg-primary rounded-[1.75rem] flex items-center justify-center text-3xl shadow-xl shadow-primary/30 relative z-10 border border-white/10">
            🏪
          </div>
        </div>

        {/* Branding */}
        <div className="mb-1">
          <h1 className="text-white text-2xl font-black tracking-tighter leading-none mb-1.5">
            Sari-Sari <span className="text-primary-light">Debt Pro</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.25em] opacity-80">
            Enter your 4-digit PIN to begin
          </p>
        </div>

        {/* PIN Dots Indicators */}
        <div className="flex gap-3.5 justify-center mt-6 mb-8">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i} 
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                pin.length > i 
                  ? 'bg-primary scale-110 shadow-[0_0_12px_rgba(99,102,241,0.8)]' 
                  : 'bg-white/10 border border-white/5'
              }`} 
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2.5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map(btn => (
            <button
              key={btn}
              onClick={() => {
                if (btn === 'C') handleClear();
                else if (btn === '✓') handleSubmit();
                else handleInput(btn);
              }}
              className={`aspect-square flex items-center justify-center text-xl font-black rounded-xl transition-all active:scale-90 ${
                btn === '✓' 
                  ? 'bg-primary text-white shadow-lg shadow-primary/40 hover:bg-primary-dark' 
                  : btn === 'C' 
                    ? 'bg-white/5 text-rose-500 hover:bg-rose-500/10' 
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
        
        {/* Footer Text */}
        <div className="mt-8 space-y-1 opacity-20">
          <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-400">
            Authorized Personnel Only
          </p>
          <div className="flex items-center justify-center gap-1">
            <span className="w-0.5 h-0.5 rounded-full bg-primary animate-pulse"></span>
            <p className="text-[6px] font-bold text-slate-500 tracking-widest uppercase">Secure Node v2.8.1</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
