import React, { useState } from 'react';
import { Stats as StatsType, UserRole } from '../types';

const Icon = ({ path, className = '' }: { path: string; className?: string }) => (
  <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);
const EyeIcon = () => <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />;
const LockIcon = () => <Icon path="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />;
const ProfitIcon = () => <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />;
const DebtIcon = () => <Icon path="M9 8h6m-5 4h.01M18 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
const AssetsIcon = () => <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />;
const YieldIcon = () => <Icon path="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />;
const SalesIcon = () => <Icon path="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />;
const RatioIcon = () => <Icon path="M9 19V5h6v14H9z" />;

interface StatsProps {
  stats: StatsType;
  userRole?: UserRole;
}

const Stats = React.memo(({ stats, userRole = 'cashier' }: StatsProps) => {
  const [isBlurred, setIsBlurred] = useState(() => localStorage.getItem('financial_blur') === 'true');
  const isAdmin = userRole === 'admin';

  const toggleBlur = () => {
    const newVal = !isBlurred;
    setIsBlurred(newVal);
    localStorage.setItem('financial_blur', String(newVal));
  };

  const marginPercent = stats.totalInventoryValue > 0 
    ? (stats.potentialProfit / stats.totalInventoryValue) * 100 
    : 0;

  const allStatItems = [
    { label: 'Net Profit', value: `₱${stats.monthlyNetProfit.toLocaleString()}`, color: stats.monthlyNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: <ProfitIcon />, iconBg: 'bg-emerald-500/10', subValue: 'Realized Income', adminOnly: true },
    { label: 'Unpaid Credits', value: `₱${stats.unpaidTotal.toLocaleString()}`, color: 'text-rose-400', icon: <DebtIcon />, iconBg: 'bg-rose-500/10', subValue: `${stats.activeDebtors} Active Debtors`, adminOnly: false },
    { label: 'Stock Assets', value: `₱${stats.totalInvestmentValue.toLocaleString()}`, color: 'text-blue-400', icon: <AssetsIcon />, iconBg: 'bg-blue-500/10', subValue: 'Capital Invested', adminOnly: true },
    { label: 'Exposure', value: `${stats.debtRatio.toFixed(1)}%`, color: stats.debtRatio > 30 ? 'text-rose-400' : 'text-indigo-400', icon: <RatioIcon />, iconBg: 'bg-indigo-500/10', subValue: 'Debt Ratio', adminOnly: true },
    { label: 'Sales Today', value: `₱${stats.dailySales.toLocaleString()}`, color: 'text-white', icon: <SalesIcon />, iconBg: 'bg-white/10', subValue: 'Cash Inflow', adminOnly: false },
    { label: 'Yield', value: `₱${stats.potentialProfit.toLocaleString()}`, color: 'text-cyan-400', icon: <YieldIcon />, iconBg: 'bg-cyan-500/10', subValue: `${marginPercent.toFixed(0)}% Margin`, adminOnly: true },
  ];

  const visibleStats = allStatItems.filter(item => isAdmin || !item.adminOnly);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="h-8 w-[2px] bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>
          <div>
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none">Operational Health</h2>
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-1">Real-time metrics</p>
          </div>
        </div>
        
        <button 
          onClick={toggleBlur} 
          className="group relative w-10 h-10 flex items-center justify-center rounded-2xl bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/5 text-slate-400 hover:text-indigo-500 transition-all duration-300 active:scale-90 shadow-sm overflow-hidden"
          title={isBlurred ? "Show Values" : "Hide Values"}
        >
           <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors"></div>
           <div className="relative z-10 transition-transform group-hover:scale-110">
             {isBlurred ? <EyeIcon /> : <LockIcon />}
           </div>
        </button>
      </div>

      <div className={`grid grid-cols-2 ${isAdmin ? 'lg:grid-cols-3' : 'sm:grid-cols-2'} gap-6`}>
        {visibleStats.map((item, idx) => (
          <div key={idx} className="group relative p-8 rounded-[2.5rem] bg-white dark:bg-[#1c1c1e] border border-slate-200 dark:border-white/5 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 hover:border-indigo-500/30 overflow-hidden shadow-sm">
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700 pointer-events-none ${item.iconBg} opacity-20`}></div>
            <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-[50px] -ml-12 -mb-12 group-hover:scale-150 transition-transform duration-700 pointer-events-none ${item.iconBg} opacity-10`}></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-center justify-between mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${item.iconBg} ${item.color} border border-white/5 shadow-inner`}>
                  {item.icon}
                </div>
                <div className="h-1 w-8 bg-slate-100 dark:bg-white/5 rounded-full"></div>
              </div>

              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2 group-hover:text-indigo-400 transition-colors">{item.label}</p>
                <div className="relative">
                    <p className={`text-3xl font-black truncate tracking-tighter leading-none ${item.color} transition-all duration-500 ${isBlurred ? 'blur-xl opacity-30 select-none scale-95' : 'blur-0 opacity-100 scale-100'}`}>
                        {item.value}
                    </p>
                </div>
                {item.subValue && (
                  <div className="flex items-center gap-2 mt-4">
                    <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                    <p className={`text-[8px] font-black text-slate-500 uppercase tracking-widest transition-all duration-500 ${isBlurred ? 'blur-[3px] select-none opacity-50' : 'opacity-100'}`}>
                        {item.subValue}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

export default Stats;