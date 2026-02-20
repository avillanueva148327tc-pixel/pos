import React, { useState, useEffect } from 'react';

interface LoginScreenProps {
  onLogin: (pin: string) => void;
}

const StoreIcon = () => (
    <svg className="w-5 h-5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6L18 20" />
        <path d="M12 6L12 20" />
        <path d="M6 6L6 20" />
        <path d="M3 20L21 20" />
        <path d="M3 6L21 6" />
        <path d="M14 12L14 13" />
        <path d="M10 12L10 13" />
        <path d="M5 20L5 16C5 14.9 5.9 14 7 14L17 14C18.1 14 19 14.9 19 16L19 20" />
    </svg>
);

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
      const timer = setTimeout(() => handleAuthAttempt(pin), 200);
      return () => clearTimeout(timer);
    }
  }, [pin]);

  const handleAuthAttempt = async (enteredPin: string) => {
    onLogin(enteredPin);
    
    // Simulate failure detection (App.tsx state changes on success)
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
    <div className="min-h-screen w-full bg-[#020617] flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <div className="w-full max-w-[240px] text-center animate-in fade-in zoom-in duration-500">
        
        <div className="relative inline-block mb-4">
          <div className={`absolute inset-0 rounded-full blur-[40px] scale-150 transition-colors duration-700 ${lockoutTime > 0 ? 'bg-rose-500/20' : 'bg-indigo-500/20'}`}></div>
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-2xl relative z-10 border border-white/10 ring-1 ring-white/5">
            <StoreIcon />
          </div>
        </div>

        <div className="mb-4">
          <h1 className="text-white text-lg font-black tracking-tighter uppercase">
            Sari-Sari <span className="text-indigo-400">Pro</span>
          </h1>
          {lockoutTime > 0 ? (
            <p className="text-rose-500 text-[8px] font-black uppercase tracking-[0.2em] animate-pulse">
              Locked: {lockoutTime}s
            </p>
          ) : (
            <p className="text-slate-500 text-[8px] font-black uppercase tracking-[0.3em] opacity-80">
              Authorization
            </p>
          )}
        </div>

        {/* PIN Indicators */}
        <div className={`flex gap-4 justify-center my-6 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map(i => {
            const isActive = pin.length > i;
            const isLatest = pin.length === i + 1 && lastChar !== null;
            return (
              <div 
                key={i} 
                className={`w-3 h-3 rounded-full flex items-center justify-center transition-all duration-300 relative border ${
                  error 
                    ? 'bg-rose-500 border-rose-400 scale-110 shadow-[0_0_10px_rgba(244,63,94,0.6)]' 
                    : isActive 
                      ? 'bg-indigo-500 border-indigo-400 scale-125 shadow-[0_0_8px_rgba(99,102,241,0.6)]' 
                      : 'bg-transparent border-slate-800'
                }`}
              >
                {isLatest && !error && (
                  <span className="text-[7px] font-black text-white animate-in zoom-in-50 fade-in duration-200">
                    {pin[i]}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className={`grid grid-cols-3 gap-2 transition-opacity duration-300 ${lockoutTime > 0 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(btn => (
             <button
              key={btn}
              onClick={() => handleInput(btn)}
              className="aspect-square flex items-center justify-center text-lg font-black rounded-2xl transition-all active:scale-90 bg-slate-900/50 text-white hover:bg-slate-800 border border-white/5 shadow-md"
            >
              {btn}
            </button>
          ))}
          <button 
            onClick={() => setPin('')} 
            className="aspect-square flex items-center justify-center text-[7px] font-black rounded-2xl transition-all active:scale-90 bg-slate-900/20 text-slate-500 hover:bg-white/5 border border-white/5 uppercase tracking-widest"
          >
            Clear
          </button>
          <button 
            onClick={() => handleInput('0')} 
            className="aspect-square flex items-center justify-center text-lg font-black rounded-2xl transition-all active:scale-90 bg-slate-900/50 text-white hover:bg-slate-800 border border-white/5"
          >
            0
          </button>
          <button 
            onClick={handleBackspace} 
            className="aspect-square flex items-center justify-center text-base rounded-2xl transition-all active:scale-90 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white border border-indigo-500/20"
          >
            ⌫
          </button>
        </div>

        <p className="mt-8 text-[7px] font-black text-slate-700 uppercase tracking-[0.4em] opacity-40">
            Vault 3.6.0
        </p>
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

export default LoginScreen;