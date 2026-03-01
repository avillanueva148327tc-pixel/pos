import React, { useState, useEffect } from 'react';
import { Terminal, Shield, Lock, Zap } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (pin: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
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

  useEffect(() => {
    if (pin.length === 4) {
      const timer = setTimeout(() => handleAuthAttempt(pin), 300);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const handleAuthAttempt = async (enteredPin: string) => {
    onLogin(enteredPin);
    
    const failTimer = setTimeout(() => {
        setError(true);
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLockoutTime(30);
          setAttempts(0);
        }

        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);

        setTimeout(() => {
            setPin('');
            setLastChar(null);
            setError(false);
        }, 600);
    }, 400);
    
    return () => clearTimeout(failTimer);
  };

  const handleInput = (num: string) => {
    if (pin.length < 4 && !error && lockoutTime === 0) {
      setPin(prev => prev + num);
      setLastChar(num);
      if ('vibrate' in navigator) navigator.vibrate(10);
      setTimeout(() => setLastChar(null), 400);
    }
  };

  const handleBackspace = () => {
    if (lockoutTime === 0) {
      setPin(prev => prev.slice(0, -1));
      setLastChar(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center p-6 overflow-hidden select-none relative">
      {/* Immersive Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse-glow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="w-full max-w-[320px] text-center relative z-10 animate-in">
        
        <div className="relative inline-block mb-10">
          <div className={`absolute inset-0 rounded-[2rem] blur-[40px] transition-all duration-1000 ${lockoutTime > 0 ? 'bg-rose-500/30' : 'bg-indigo-500/30'}`}></div>
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center shadow-2xl relative z-10 border border-white/10 ring-1 ring-white/5 group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Terminal className={`text-indigo-400 transition-transform duration-700 ${lockoutTime > 0 ? 'scale-75 opacity-50' : 'group-hover:scale-110'}`} size={32} />
            {lockoutTime > 0 && <Lock className="absolute text-rose-500 animate-bounce" size={20} />}
          </div>
        </div>

        <div className="mb-12 space-y-3">
          <h1 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center justify-center gap-3">
            SARI-SARI <span className="text-indigo-500 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">PRO</span>
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-slate-800"></div>
            {lockoutTime > 0 ? (
              <p className="text-rose-500 text-[10px] font-black uppercase tracking-[0.4em] animate-pulse">
                System Lockout: {lockoutTime}s
              </p>
            ) : (
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em]">
                Secure Authorization
              </p>
            )}
            <div className="h-px w-8 bg-slate-800"></div>
          </div>
        </div>

        {/* PIN Indicators */}
        <div className={`flex gap-6 justify-center mb-16 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => {
            const isActive = pin.length > i;
            const isLatest = pin.length === i + 1 && lastChar !== null;
            return (
              <div 
                key={i} 
                className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-500 relative border-2 ${
                  error 
                    ? 'bg-rose-500 border-rose-400 scale-125 shadow-[0_0_20px_rgba(244,63,94,0.8)]' 
                    : isActive 
                      ? 'bg-indigo-500 border-indigo-400 scale-150 shadow-[0_0_15px_rgba(99,102,241,0.6)]' 
                      : 'bg-transparent border-slate-800'
                }`}
              >
                {isLatest && !error && (
                  <span className="text-[9px] font-black text-white animate-in zoom-in-50 fade-in duration-300">
                    {pin[i]}
                  </span>
                )}
                {isActive && !isLatest && !error && (
                  <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_5px_white]"></div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`grid grid-cols-3 gap-4 transition-all duration-700 ${lockoutTime > 0 ? 'opacity-100 grayscale blur-sm pointer-events-none' : 'opacity-100'}`}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(btn => (
             <button
              key={btn}
              onClick={() => handleInput(btn)}
              className="aspect-square flex flex-col items-center justify-center rounded-[1.5rem] transition-all duration-300 active:scale-90 bg-slate-900/40 text-white hover:bg-slate-800 border border-white/5 shadow-xl group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors"></div>
              <span className="text-2xl font-black relative z-10">{btn}</span>
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mt-1 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">Key</span>
            </button>
          ))}
          <button 
            onClick={() => setPin('')} 
            className="aspect-square flex items-center justify-center text-[10px] font-black rounded-[1.5rem] transition-all active:scale-90 bg-slate-900/20 text-slate-500 hover:bg-rose-500/10 hover:text-rose-500 border border-white/5 uppercase tracking-[0.2em]"
          >
            Reset
          </button>
          <button 
            onClick={() => handleInput('0')} 
            className="aspect-square flex items-center justify-center text-2xl font-black rounded-[1.5rem] transition-all active:scale-90 bg-slate-900/40 text-white hover:bg-slate-800 border border-white/5 shadow-xl"
          >
            0
          </button>
          <button 
            onClick={handleBackspace} 
            className="aspect-square flex items-center justify-center rounded-[1.5rem] transition-all active:scale-90 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/20 shadow-xl"
          >
            <Zap size={24} />
          </button>
        </div>

        <div className="mt-16 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 rounded-full border border-white/5">
              <Shield size={12} className="text-emerald-500" />
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">
                End-to-End Encrypted Session
              </p>
            </div>
            <p className="text-[8px] font-black text-slate-800 uppercase tracking-[0.5em] opacity-40">
                Terminal OS v3.6.2
            </p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
