import React from 'react';

const Icon = ({ path, className = 'w-6 h-6' }: { path: string, className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const DashboardIcon = () => <Icon path="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />;
const InventoryIcon = () => <Icon path="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />;
const CustomersIcon = () => <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />;
const RecordsIcon = () => <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />;
const ReportsIcon = () => <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
const SettingsIcon = () => <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />;
const LogsIcon = () => <Icon path="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />;

export const navItems = [
  { id: 'pos', label: 'Terminal', icon: <DashboardIcon /> },
  { id: 'inventory', label: 'Inventory', icon: <InventoryIcon /> },
  { id: 'customers', label: 'Sukis', icon: <CustomersIcon /> },
  { id: 'records', label: 'Debts', icon: <RecordsIcon /> },
  { id: 'reports', label: 'Insights', icon: <ReportsIcon /> },
  { id: 'logs', label: 'Audit Trail', icon: <LogsIcon /> },
  { id: 'settings', label: 'Setup', icon: <SettingsIcon /> },
];

interface NavigationProps {
  activeTab: string;
  setActiveTab: (id: string) => void;
  isMobile?: boolean;
  activeShift?: any;
  onOpenShiftModal?: () => void;
}

export const DesktopSidebar: React.FC<NavigationProps> = ({ 
  activeTab, 
  setActiveTab, 
  activeShift, 
  onOpenShiftModal 
}) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-white/10 p-4 shrink-0">
      <div className="flex items-center gap-2 mb-8 p-2">
        <span className="w-8 h-8 bg-indigo-500 rounded-lg shadow-lg shadow-indigo-500/20"></span>
        <h1 className="text-lg font-black tracking-tighter text-slate-900 dark:text-white">SARI-SARI <span className="text-indigo-500">PRO</span></h1>
      </div>
      <nav className="flex flex-col gap-1.5 flex-1">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all relative ${activeTab === item.id ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/30 translate-x-1' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-white/5">
         <button onClick={() => { setActiveTab('pos'); }}
           className="w-full flex px-3 py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-indigo-500/30 bg-indigo-500/5 text-indigo-500 transition items-center justify-center gap-3 hover:bg-indigo-500 hover:text-white active:scale-95 shadow-lg shadow-indigo-500/10">
           <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse group-hover:bg-white"></div>
           Scan & Go Terminal
         </button>
      </div>
    </aside>
  );
};

export const MobileNavigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#0f172a]/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 p-2.5 flex justify-around z-40 shadow-2xl">
      {navItems.map(item => (
        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all ${activeTab === item.id ? 'text-indigo-500 bg-indigo-500/5' : 'text-slate-400'}`}>
          <div className={`transition-all duration-300 ${activeTab === item.id ? 'scale-110' : ''}`}>{item.icon}</div>
        </button>
      ))}
    </nav>
  );
};