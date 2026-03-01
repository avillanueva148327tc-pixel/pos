
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Terminal, 
  Package, 
  Users, 
  FileText, 
  TrendingUp, 
  History, 
  Settings,
  Plus,
  LogOut,
  Command
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onAction: (action: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onAction }) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = [
    { id: 'dashboard', label: 'Go to Dashboard', icon: <TrendingUp size={18} />, category: 'Navigation', action: () => onNavigate('dashboard') },
    { id: 'pos', label: 'Open Terminal', icon: <Terminal size={18} />, category: 'Navigation', action: () => onNavigate('pos') },
    { id: 'inventory', label: 'Manage Inventory', icon: <Package size={18} />, category: 'Navigation', action: () => onNavigate('inventory') },
    { id: 'customers', label: 'View Sukis', icon: <Users size={18} />, category: 'Navigation', action: () => onNavigate('customers') },
    { id: 'records', label: 'Debt Records', icon: <FileText size={18} />, category: 'Navigation', action: () => onNavigate('records') },
    { id: 'reports', label: 'Business Insights', icon: <TrendingUp size={18} />, category: 'Navigation', action: () => onNavigate('reports') },
    { id: 'logs', label: 'Audit Trail', icon: <History size={18} />, category: 'Navigation', action: () => onNavigate('logs') },
    { id: 'settings', label: 'System Setup', icon: <Settings size={18} />, category: 'Navigation', action: () => onNavigate('settings') },
    { id: 'add-stock', label: 'Add New Stock', icon: <Plus size={18} />, category: 'Actions', action: () => onAction('add-stock') },
    { id: 'add-suki', label: 'Register New Suki', icon: <Plus size={18} />, category: 'Actions', action: () => onAction('add-suki') },
    { id: 'logout', label: 'Lock Terminal', icon: <LogOut size={18} />, category: 'System', action: () => onAction('logout') },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) || 
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[15vh] p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="w-full max-w-2xl bg-white dark:bg-[#0f172a] rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden relative z-10 animate-in slide-in-from-top-4 duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center gap-4">
          <Search className="text-slate-400" size={20} />
          <input 
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-lg font-bold placeholder:text-slate-400 dark:text-white"
            placeholder="Search commands or navigation..."
          />
          <div className="px-2 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-200 dark:border-white/10">
            ESC to close
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar">
          {filteredCommands.length > 0 ? (
            <div className="space-y-6">
              {['Navigation', 'Actions', 'System'].map(category => {
                const catCmds = filteredCommands.filter(c => c.category === category);
                if (catCmds.length === 0) return null;
                return (
                  <div key={category}>
                    <h4 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{category}</h4>
                    <div className="space-y-1">
                      {catCmds.map(cmd => (
                        <button 
                          key={cmd.id}
                          onClick={() => { cmd.action(); onClose(); }}
                          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all group text-left"
                        >
                          <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            {cmd.icon}
                          </div>
                          <span className="font-bold text-sm">{cmd.label}</span>
                          <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center opacity-30">
              <Command size={48} className="mx-auto mb-4" />
              <p className="text-sm font-black uppercase tracking-widest">No commands found</p>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
           <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                 <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10 text-[9px] font-black">↑↓</kbd>
                 <span className="text-[9px] font-bold text-slate-400 uppercase">Navigate</span>
              </div>
              <div className="flex items-center gap-1.5">
                 <kbd className="px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-white/10 text-[9px] font-black">ENTER</kbd>
                 <span className="text-[9px] font-bold text-slate-400 uppercase">Select</span>
              </div>
           </div>
           <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Sari-Sari Pro Command Hub</p>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default CommandPalette;
