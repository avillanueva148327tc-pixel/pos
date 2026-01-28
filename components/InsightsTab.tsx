
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-4xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-black flex items-center gap-2">
               <span className="p-2 bg-primary/10 text-primary rounded-xl text-sm">📊</span>
               Sales vs. Debt Flow
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Cash Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">Debt Created</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700}} dy={10} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px'}} />
                <Area type="monotone" dataKey="sales" name="Sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                <Area type="monotone" dataKey="debt" name="Debt" stroke="#f59e0b" strokeDasharray="4 4" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 rounded-4xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex flex-col">
          <h3 className="text-lg font-black flex items-center gap-2 mb-6">
             <span className="p-2 bg-indigo-500/10 text-indigo-500 rounded-xl text-sm">💰</span>
             Category Value
          </h3>
          <div className="flex-1 min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{fontSize: '10px', borderRadius: '12px'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
             {categoryData.slice(0, 4).map((cat, i) => (
               <div key={i} className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                 <span className="text-[8px] font-bold text-slate-500 uppercase truncate">{cat.name}</span>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsTab;
