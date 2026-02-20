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

const Stats: React.FC<StatsProps> = ({ stats, userRole = 'cashier' }) => {
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
    { label: 'Month Net Profit', value: `₱${stats.monthlyNetProfit.toLocaleString()}`, color: stats.monthlyNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', icon: <ProfitIcon />, iconBg: 'bg-emerald-500/10', subValue: 'Realized Income', adminOnly: true },
    { label: 'Unpaid Credits', value: `₱${stats.unpaidTotal.toLocaleString()}`, color: 'text-rose-400', icon: <DebtIcon />, iconBg: 'bg-rose-500/10', subValue: `${stats.activeDebtors} Active Debtors`, adminOnly: false },
    { label: 'Stock Assets', value: `₱${stats.totalInvestmentValue.toLocaleString()}`, color: 'text-blue-400', icon: <AssetsIcon />, iconBg: 'bg-blue-500/10', subValue: 'Capital Invested', adminOnly: true },
    { label: 'Debt Exposure', value: `${stats.debtRatio.toFixed(1)}%`, color: stats.debtRatio > 30 ? 'text-rose-400' : 'text-indigo-400', icon: <RatioIcon />, iconBg: 'bg-indigo-500/10', subValue: 'Debt vs Inventory', adminOnly: true },
    { label: 'Sales Today', value: `₱${stats.dailySales.toLocaleString()}`, color: 'text-primary-light', icon: <SalesIcon />, iconBg: 'bg-primary/10', subValue: 'Cash Inflow', adminOnly: false },
    { label: 'Potential Yield', value: `₱${stats.potentialProfit.toLocaleString()}`, color: 'text-cyan-400', icon: <YieldIcon />, iconBg: 'bg-cyan-500/10', subValue: `Est. ${marginPercent.toFixed(0)}% Margin`, adminOnly: true },
  ];

  const visibleStats = allStatItems.filter(item => isAdmin || !item.adminOnly);

  return (
    <section>
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1 bg-indigo-500 rounded-full shadow-[0_0_12px] shadow-indigo-500/50"></div>
          <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Health</h2>
        </div>
        
        <button 
          onClick={toggleBlur} 
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 text-slate-400 hover:text-indigo-500 transition active:scale-95 shadow-sm"
          title={isBlurred ? "Show Values" : "Hide Values"}
        >
           {isBlurred ? <EyeIcon /> : <LockIcon />}
        </button>
      </div>

      <div className={`grid grid-cols-2 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        {visibleStats.map((item, idx) => (
          <div key={idx} className="p-5 rounded-3xl bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/5 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1 hover:border-indigo-500/20 group relative overflow-hidden shadow-sm">
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500 pointer-events-none ${item.iconBg} opacity-30`}></div>
            
            <div className="relative z-10">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all ${item.iconBg} ${item.color}`}>
                  {item.icon}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                <div className="relative">
                    <p className={`text-xl md:text-2xl font-black truncate tracking-tighter ${item.color} transition-all duration-300 ${isBlurred ? 'blur-md opacity-40 select-none' : 'blur-0 opacity-100'}`}>
                        {item.value}
                    </p>
                </div>
                {item.subValue && (
                  <p className={`text-[8px] font-black text-slate-500 uppercase tracking-widest mt-2 transition-all duration-300 ${isBlurred ? 'blur-[2px] select-none' : ''}`}>
                      {item.subValue}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Stats;