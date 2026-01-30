
import React, { useState } from 'react';
import { Stats as StatsType, UserRole } from '../types';

interface StatsProps {
  stats: StatsType;
  userRole?: UserRole;
}

const Stats: React.FC<StatsProps> = ({ stats, userRole = 'cashier' }) => {
  // Initialize state from local storage to persist preference
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

  // New Items for Monthly Profit & Inventory Valuation
  const allStatItems = [
    { 
      label: 'Month Net Profit', 
      value: `₱${stats.monthlyNetProfit.toLocaleString()}`, 
      color: stats.monthlyNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', 
      icon: '💎', 
      bg: 'bg-[#1e293b] border-emerald-500/20',
      subValue: 'Realized Income',
      adminOnly: true
    },
    { 
      label: 'Unpaid Credits', 
      value: `₱${stats.unpaidTotal.toLocaleString()}`, 
      color: 'text-rose-400', 
      icon: '💸', 
      bg: 'bg-[#1e293b] border-rose-500/20',
      subValue: `${stats.activeDebtors} Active Debtors`,
      adminOnly: false
    },
    { 
      label: 'Stock Assets', 
      value: `₱${stats.totalInvestmentValue.toLocaleString()}`, 
      color: 'text-blue-400', 
      icon: '🏭', 
      bg: 'bg-[#1e293b] border-blue-500/20',
      subValue: 'Capital Tied Up',
      adminOnly: true
    },
    { 
      label: 'Potential Yield', 
      value: `₱${stats.potentialProfit.toLocaleString()}`, 
      color: 'text-cyan-400', 
      icon: '📈', 
      bg: 'bg-[#1e293b] border-cyan-500/20',
      subValue: `Est. ${marginPercent.toFixed(0)}% Margin`,
      adminOnly: true
    },
    { 
      label: 'Sales Today', 
      value: `₱${stats.dailySales.toLocaleString()}`, 
      color: 'text-indigo-400', 
      icon: '💰', 
      bg: 'bg-[#1e293b] border-indigo-500/20',
      subValue: 'Cash Inflow',
      adminOnly: false
    },
    { 
      label: 'Month Expenses', 
      value: `₱${stats.monthlyExpenses.toLocaleString()}`, 
      color: 'text-amber-400', 
      icon: '📉', 
      bg: 'bg-[#1e293b] border-amber-500/20',
      subValue: 'Stock Purchases',
      adminOnly: true
    },
  ];

  const visibleStats = allStatItems.filter(item => isAdmin || !item.adminOnly);

  return (
    <section className="mb-6 md:mb-8 px-1">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="h-3 w-1 bg-[#6366f1] rounded-full"></div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Financial Pulse</h2>
        </div>
        
        {/* Privacy Toggle Button */}
        <button 
          onClick={toggleBlur} 
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#1e293b] border border-slate-700 text-slate-400 hover:text-white hover:border-[#6366f1] transition active:scale-95"
          title={isBlurred ? "Show Values" : "Hide Values"}
        >
           {isBlurred ? (
             <span className="text-lg">👁️</span>
           ) : (
             <span className="text-lg">🔒</span>
           )}
        </button>
      </div>

      <div className={`grid grid-cols-2 ${isAdmin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 md:gap-4`}>
        {visibleStats.map((item, idx) => (
          <div key={idx} className={`p-4 md:p-5 rounded-3xl border transition-all duration-300 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 active:scale-95 group ${item.bg} border-white/5`}>
            <div className="flex flex-col h-full justify-between gap-2 md:gap-3">
              <div className="flex justify-between items-start">
                <span className="text-lg md:text-xl grayscale group-hover:grayscale-0 transition-all opacity-80">{item.icon}</span>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{item.label}</p>
                <div className="relative">
                    <p className={`text-sm md:text-lg font-black truncate ${item.color} transition-all duration-300 ${isBlurred ? 'blur-md opacity-40 select-none' : 'blur-0 opacity-100'}`}>
                        {item.value}
                    </p>
                </div>
                {item.subValue && (
                  <p className={`text-[8px] font-bold text-slate-500 uppercase tracking-wider mt-1 transition-all duration-300 ${isBlurred ? 'blur-[2px] select-none' : ''}`}>
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
