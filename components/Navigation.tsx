import React from 'react';
import { 
  LayoutDashboard, 
  Terminal, 
  Package, 
  Users, 
  FileText, 
  TrendingUp, 
  History, 
  Settings,
  Zap
} from 'lucide-react';

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { id: 'pos', label: 'Terminal', icon: <Terminal size={20} /> },
  { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
  { id: 'customers', label: 'Sukis', icon: <Users size={20} /> },
  { id: 'records', label: 'Debts', icon: <FileText size={20} /> },
  { id: 'reports', label: 'Insights', icon: <TrendingUp size={20} /> },
  { id: 'logs', label: 'Audit', icon: <History size={20} /> },
  { id: 'settings', label: 'Setup', icon: <Settings size={20} /> },
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
}) => {
  return (
    <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-[#020617] border-r border-slate-200 dark:border-white/5 p-6 shrink-0 relative overflow-hidden">
      {/* Decorative Background Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -ml-16 -mt-16"></div>
      
      <div className="flex items-center gap-4 mb-12 p-2 relative z-10">
        <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] shadow-2xl shadow-indigo-500/40 flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500">
          <Terminal className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">SARI-SARI</h1>
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1">Pro Terminal</p>
        </div>
      </div>

      <nav className="flex flex-col gap-2 flex-1 relative z-10">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] mb-4 px-4">Main Registry</p>
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.15em] transition-all duration-500 relative group ${
              activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-[0_15px_30px_rgba(79,70,229,0.3)] translate-x-2' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:translate-x-1'
            }`}
          >
            <div className={`transition-transform duration-500 ${activeTab === item.id ? 'scale-110' : 'group-hover:scale-110'}`}>
              {item.icon}
            </div>
            {item.label}
            {activeTab === item.id && (
              <div className="absolute right-4 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_10px_white]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-8 border-t border-slate-100 dark:border-white/5 relative z-10">
         <button 
           onClick={() => setActiveTab('pos')}
           className="w-full group flex px-6 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] bg-indigo-600 text-white transition-all duration-500 items-center justify-center gap-4 hover:bg-indigo-500 hover:shadow-[0_20px_40px_rgba(79,70,229,0.4)] hover:-translate-y-1 active:scale-95"
         >
           <Zap size={16} className="group-hover:animate-pulse" />
           Quick Terminal
         </button>
         <p className="text-center text-[9px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.4em] mt-6 opacity-50">
           System v3.6.2
         </p>
      </div>
    </aside>
  );
};

export const MobileNavigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-[#020617]/95 backdrop-blur-2xl border-t border-slate-200 dark:border-white/5 p-4 flex justify-around z-50 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]">
      {navItems.slice(0, 5).map(item => (
        <button 
          key={item.id} 
          onClick={() => setActiveTab(item.id)} 
          className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-500 ${
            activeTab === item.id 
              ? 'text-indigo-600 bg-indigo-600/10 shadow-inner' 
              : 'text-slate-400'
          }`}
        >
          <div className={`transition-all duration-500 ${activeTab === item.id ? 'scale-125 -translate-y-1' : ''}`}>
            {item.icon}
          </div>
          {activeTab === item.id && (
            <div className="w-1 h-1 rounded-full bg-indigo-600 mt-1 animate-in zoom-in"></div>
          )}
        </button>
      ))}
    </nav>
  );
};
