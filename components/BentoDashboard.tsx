
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Package, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Activity,
  Clock,
  Calendar
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { UtangRecord, InventoryItem, Stats as StatsType, ActivityLog, Task } from '../types';
import DebtRemindersList from './DebtRemindersList';
import ActivityTimeline from './ActivityTimeline';
import TaskTracker from './TaskTracker';

interface BentoDashboardProps {
  stats: StatsType;
  records: UtangRecord[];
  inventory: InventoryItem[];
  logs: ActivityLog[];
  tasks: Task[];
  onAddTask: (text: string, priority: Task['priority']) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSelectRecord: (record: UtangRecord) => void;
}

const DashboardCard = React.memo(({ children, className = '', title, icon, badge, badgeColor = 'bg-rose-500' }: { 
  children: React.ReactNode, 
  className?: string, 
  title?: string, 
  icon?: React.ReactNode,
  badge?: string,
  badgeColor?: string
}) => (
  <div className={`bg-white dark:bg-[#0f172a]/50 backdrop-blur-xl rounded-[3.5rem] p-10 border border-slate-200 dark:border-white/5 shadow-2xl flex flex-col min-h-[320px] group/card relative overflow-hidden transition-all duration-700 hover:border-indigo-500/30 ${className}`}>
    {/* Dynamic Background Element */}
    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-[80px] -mr-24 -mt-24 group-hover/card:bg-indigo-500/10 transition-colors duration-1000"></div>
    
    {(title || icon || badge) && (
      <div className="flex justify-between items-center mb-10 shrink-0 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 group-hover/card:text-indigo-500 transition-colors shadow-inner">
            {icon}
          </div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 dark:text-slate-500">
            {title}
          </h3>
        </div>
        {badge && (
          <span className={`px-4 py-2 ${badgeColor} text-white rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20`}>
            {badge}
          </span>
        )}
      </div>
    )}
    <div className="flex-1 flex flex-col relative z-10">
      {children}
    </div>
  </div>
));

const BentoDashboard = React.memo(({ stats, records, inventory, logs, tasks, onAddTask, onToggleTask, onDeleteTask, onSelectRecord }: BentoDashboardProps) => {
  const recentSales = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const daySales = records
        .filter(r => r.date.startsWith(date) && r.isPaid)
        .reduce((sum, r) => sum + r.totalAmount, 0);
      return { date: date.split('-').slice(1).join('/'), amount: daySales };
    });
  }, [records]);

  const debtRiskData = useMemo(() => {
    const totalDebt = records.filter(r => !r.isPaid).reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0);
    const totalStockValue = inventory.reduce((sum, i) => sum + (i.stock * i.price), 0);
    return [
      { name: 'Debt', value: totalDebt, color: '#f43f5e' },
      { name: 'Stock', value: totalStockValue, color: '#10b981' }
    ];
  }, [records, inventory]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-24">
      
      {/* 1. Main Stats Hero - High-Tech Editorial */}
      <div className="md:col-span-4 lg:col-span-4 bg-[#020617] rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl border border-white/5 min-h-[480px] flex flex-col justify-between group/hero">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/10 rounded-full -mr-60 -mt-60 blur-[180px] group-hover/hero:bg-indigo-500/20 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/5 rounded-full -ml-40 -mb-40 blur-[150px]"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"></div>
                <p className="text-[11px] font-black uppercase tracking-[0.6em] text-emerald-500/80">Real-Time Revenue Stream</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Daily Gross Volume</p>
                <h1 className="text-9xl font-black tracking-tighter leading-none group-hover/hero:scale-[1.03] transition-transform duration-1000 origin-left tabular-nums">
                  ₱{stats.dailySales.toLocaleString()}
                </h1>
              </div>
              <div className="flex items-center gap-6 mt-10">
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transactions</p>
                  <p className="text-2xl font-black text-white tabular-nums">{records.filter(r => r.date.startsWith(new Date().toISOString().split('T')[0])).length}</p>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avg. Ticket</p>
                  <p className="text-2xl font-black text-white tabular-nums">₱{(stats.dailySales / (records.filter(r => r.date.startsWith(new Date().toISOString().split('T')[0])).length || 1)).toFixed(0)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-8">
              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3rem] border border-white/10 shadow-3xl group-hover/hero:rotate-[15deg] group-hover/hero:scale-110 transition-all duration-700">
                <TrendingUp size={48} className="text-indigo-400" />
              </div>
              <div className="text-right space-y-1">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">Performance</p>
                <div className="flex items-center gap-2 justify-end">
                  <ArrowUpRight size={20} className="text-emerald-400" />
                  <p className="text-3xl font-black text-emerald-400 tracking-tight">+12.5%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="h-[160px] w-full mt-16 opacity-60 group-hover/hero:opacity-100 transition-opacity duration-1000">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentSales}>
                <defs>
                  <linearGradient id="colorHero" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#6366f1" 
                  fillOpacity={1} 
                  fill="url(#colorHero)" 
                  strokeWidth={6}
                  animationDuration={3000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Liquidity Risk - Technical Data Style */}
      <DashboardCard title="Liquidity Protocol" icon={<Activity size={16} />} className="md:col-span-2 lg:col-span-2 border-rose-500/10">
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-1 mb-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Risk Assessment</p>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Financial Exposure</h4>
          </div>
          <div className="h-[160px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtRiskData}>
                <Bar dataKey="value" radius={[16, 16, 16, 16]} barSize={50}>
                  {debtRiskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.9} />
                  ))}
                </Bar>
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900 border border-white/10 p-3 rounded-2xl text-[10px] font-black uppercase text-white shadow-2xl">
                          ₱{payload[0].value.toLocaleString()}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-10">
            <div className="p-6 bg-rose-500/5 rounded-[2rem] border border-rose-500/10">
              <p className="text-[9px] font-black text-rose-500/60 uppercase tracking-widest mb-1">Liability</p>
              <p className="text-lg font-black text-rose-500 tabular-nums">₱{stats.unpaidTotal.toLocaleString()}</p>
            </div>
            <div className="p-6 bg-emerald-500/5 rounded-[2rem] border border-emerald-500/10">
              <p className="text-[9px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Asset Value</p>
              <p className="text-lg font-black text-emerald-500 tabular-nums">₱{inventory.reduce((s, i) => s + (i.stock * i.price), 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* 3. Quick Stats - Minimalist Bento Grid */}
      <div className="md:col-span-2 lg:col-span-2 grid grid-cols-2 gap-8">
        {[
          { label: 'Active Debtors', value: stats.activeDebtors, icon: <Users size={24} />, color: 'hover:bg-indigo-600', iconColor: 'text-indigo-400' },
          { label: 'Low Stock', value: stats.lowStockCount, icon: <Package size={24} />, color: 'hover:bg-amber-600', iconColor: 'text-amber-400' },
          { label: 'Est. Profit', value: `₱${(stats.potentialProfit / 1000).toFixed(1)}k`, icon: <DollarSign size={24} />, color: 'hover:bg-emerald-600', iconColor: 'text-emerald-400' },
          { label: 'Total SKUs', value: inventory.length, icon: <Activity size={24} />, color: 'hover:bg-slate-800', iconColor: 'text-slate-400' }
        ].map((item, idx) => (
          <div key={idx} className={`p-10 bg-white dark:bg-[#0f172a]/50 backdrop-blur-xl rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-2xl flex flex-col justify-between group ${item.color} transition-all duration-700 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/10 transition-colors"></div>
            <div className={`w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-[1.5rem] flex items-center justify-center ${item.iconColor} group-hover:bg-white group-hover:text-slate-900 transition-all border border-slate-200 dark:border-white/10 relative z-10 shadow-inner`}>
              {item.icon}
            </div>
            <div className="relative z-10">
              <p className="text-5xl font-black text-slate-900 dark:text-white transition-colors tracking-tighter tabular-nums leading-none">{item.value}</p>
              <p className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 group-hover:text-white/60 tracking-[0.4em] mt-4 transition-colors">{item.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Debt Reminders - Clean Editorial List */}
      <DashboardCard title="Collection Queue" icon={<Clock size={16} />} badge="Action Required" badgeColor="bg-amber-500" className="md:col-span-2 lg:col-span-3 min-h-[400px]">
        <DebtRemindersList records={records} onSelectRecord={onSelectRecord} />
      </DashboardCard>

      {/* 5. Daily Protocol - Task Management */}
      <DashboardCard title="Daily Protocol" icon={<Calendar size={16} />} badge={`${tasks.filter(t => !t.completed).length} Pending`} badgeColor="bg-indigo-500" className="md:col-span-2 lg:col-span-3 min-h-[400px]">
        <TaskTracker tasks={tasks} onAddTask={onAddTask} onToggleTask={onToggleTask} onDeleteTask={onDeleteTask} />
      </DashboardCard>

      {/* 6. System Ledger - Activity Feed */}
      <DashboardCard title="System Ledger" icon={<Activity size={16} />} className="md:col-span-4 lg:col-span-6 min-h-[400px]">
        <ActivityTimeline logs={logs} />
      </DashboardCard>

    </div>
  );
});

export default BentoDashboard;
