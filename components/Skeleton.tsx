import React from 'react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-white/5 rounded-xl ${className}`} />
);

export const DashboardSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-6 animate-in fade-in duration-700 pb-24">
    <Skeleton className="md:col-span-4 lg:col-span-4 h-[320px] rounded-[2.5rem]" />
    <Skeleton className="md:col-span-2 lg:col-span-2 h-[320px] rounded-[2.5rem]" />
    <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-4">
      <Skeleton className="h-[140px] rounded-[2rem]" />
      <Skeleton className="h-[140px] rounded-[2rem]" />
      <Skeleton className="h-[140px] rounded-[2rem]" />
      <Skeleton className="h-[140px] rounded-[2rem]" />
    </div>
    <Skeleton className="md:col-span-2 lg:col-span-4 h-[300px] rounded-[2.5rem]" />
    <Skeleton className="md:col-span-2 lg:col-span-2 h-[300px] rounded-[2.5rem]" />
  </div>
);

export const TableSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex gap-3 mb-6">
      <Skeleton className="w-32 h-12" />
      <Skeleton className="w-40 h-12" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-3xl" />
      ))}
    </div>
  </div>
);

export const SplashScreen: React.FC = () => (
  <div className="fixed inset-0 bg-slate-50 dark:bg-[#020617] flex flex-col items-center justify-center z-[1000] overflow-hidden">
    {/* Background Glows */}
    <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-50">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px]"></div>
    </div>

    <div className="relative group">
      <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>
      <div className="w-24 h-24 border-[3px] border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin relative z-10"></div>
      <div className="absolute inset-0 flex items-center justify-center z-20">
        <div className="w-12 h-12 bg-indigo-500 rounded-2xl shadow-2xl shadow-indigo-500/50 flex items-center justify-center text-white font-black text-sm transform hover:scale-110 transition-transform duration-300">
          SP
        </div>
      </div>
    </div>

    <div className="mt-12 text-center relative z-10">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
        Sari-Sari <span className="text-indigo-500">Pro</span>
        <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded text-[8px] font-black tracking-widest">V2.5</span>
      </h2>
      <div className="mt-4 flex flex-col items-center gap-3">
        <div className="w-48 h-1 bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 w-1/3 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">
          Synchronizing Database...
        </p>
      </div>
    </div>

    <style dangerouslySetInnerHTML={{ __html: `
      @keyframes loading {
        0% { transform: translateX(-100%); }
        50% { transform: translateX(100%); }
        100% { transform: translateX(-100%); }
      }
    `}} />
  </div>
);
