
import React, { useMemo } from 'react';
import { 
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, 
  XAxis, YAxis, Tooltip, CartesianGrid 
} from 'recharts';
import { UtangRecord, InventoryItem } from '../types';
import { AnalyticsService } from '../services/analyticsService';

interface ReportsTabProps {
  records: UtangRecord[];
  inventory: InventoryItem[];
}

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const ReportsTab: React.FC<ReportsTabProps> = ({ records, inventory }) => {
  // Use "Stored Procedure" style service calls for data preparation
  const chartData = useMemo(() => AnalyticsService.getSalesVsDebtStats(records), [records]);
  const categoryData = useMemo(() => AnalyticsService.getCategoryPerformance(inventory), [inventory]);

  // Calculate Aggregates for Summary Cards
  const summary = useMemo(() => {
    const sales7Days = chartData.reduce((acc, curr) => acc + curr.sales, 0);
    const debt7Days = chartData.reduce((acc, curr) => acc + curr.debt, 0);
    const topCategory = categoryData.length > 0 ? categoryData[0] : { name: 'N/A', value: 0 };
    return { sales7Days, debt7Days, topCategory };
  }, [chartData, categoryData]);

  // Custom Tooltip for Charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur border border-white/10 p-3 rounded-xl shadow-xl text-xs">
          <p className="font-black text-slate-300 mb-2 uppercase tracking-wider">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-white font-bold">{entry.name}: </span>
              <span className="text-white font-mono">₱{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-[#6366f1] to-indigo-600 p-5 rounded-3xl text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
           <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">7-Day Sales</p>
           <h3 className="text-3xl font-black tracking-tighter">₱{summary.sales7Days.toLocaleString()}</h3>
           <p className="text-[9px] mt-2 font-bold opacity-60">Cash Inflow</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">7-Day Debt</p>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">₱{summary.debt7Days.toLocaleString()}</h3>
              </div>
              <div className="w-10 h-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                ⚠️
              </div>
           </div>
           <p className="text-[9px] mt-2 font-bold text-amber-500">Unpaid Credit Issued</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
           <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Top Category</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[150px]">{summary.topCategory.name}</h3>
              </div>
              <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                🏆
              </div>
           </div>
           <p className="text-[9px] mt-2 font-bold text-slate-500">Valued at ₱{summary.topCategory.value.toLocaleString()}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Area Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-4xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <h3 className="text-lg font-black flex items-center gap-2 dark:text-white">
               <span className="p-2 bg-primary/10 text-primary rounded-xl text-sm">📊</span>
               Sales vs. Debt Trend
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#6366f1]"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Debt</span>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" strokeOpacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 9, fontWeight: 700, fill: '#94a3b8'}} 
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="Sales" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorSales)" 
                  strokeWidth={3} 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="debt" 
                  name="Debt" 
                  stroke="#f59e0b" 
                  fillOpacity={1} 
                  fill="url(#colorDebt)" 
                  strokeWidth={3} 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-4xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col">
          <h3 className="text-lg font-black flex items-center gap-2 mb-6 dark:text-white">
             <span className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-sm">📦</span>
             Inventory Distribution
          </h3>
          <div className="flex-1 min-h-[200px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={categoryData} 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={60} 
                  outerRadius={80} 
                  paddingAngle={5} 
                  dataKey="value"
                  stroke="none"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Total Value</p>
                  <p className="text-xl font-black text-slate-900 dark:text-white">
                    ₱{(categoryData.reduce((a, b) => a + b.value, 0) / 1000).toFixed(1)}k
                  </p>
               </div>
            </div>
          </div>
          
          <div className="mt-6 space-y-3">
             {categoryData.slice(0, 4).map((cat, i) => (
               <div key={i} className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase truncate max-w-[100px]">{cat.name}</span>
                 </div>
                 <span className="text-[10px] font-black text-slate-900 dark:text-white">₱{cat.value.toLocaleString()}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
