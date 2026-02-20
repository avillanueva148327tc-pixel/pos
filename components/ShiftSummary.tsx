import React from 'react';

interface ScanGoPanelProps {
  onScanItem: () => void;
  onScanSuki: () => void;
  cartCount: number;
}

const ScanGoPanel: React.FC<ScanGoPanelProps> = ({ onScanItem, onScanSuki, cartCount }) => {
  return (
    <div className="p-5 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-slate-200 dark:border-white/5 shadow-sm space-y-4">
      <div className="flex justify-between items-center px-1">
        <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Scan & Go</h4>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-full">
           <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[8px] font-black text-emerald-500 uppercase">Live Database</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button 
          onClick={onScanItem}
          className="w-full p-4 bg-indigo-500 text-white rounded-2xl flex items-center justify-between group hover:bg-indigo-600 transition-all active:scale-[0.98] shadow-lg shadow-indigo-500/20"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📦</div>
             <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Inventory</p>
                <p className="text-xs font-black uppercase">Scan Product</p>
             </div>
          </div>
          <span className="text-lg opacity-40">📸</span>
        </button>

        <button 
          onClick={onScanSuki}
          className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 text-slate-800 dark:text-white rounded-2xl flex items-center justify-between group hover:border-indigo-500/50 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-indigo-500/5 text-indigo-500 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🪪</div>
             <div className="text-left">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suki Base</p>
                <p className="text-xs font-black uppercase">Scan Suki ID</p>
             </div>
          </div>
          <span className="text-lg opacity-20 grayscale">📸</span>
        </button>
      </div>

      <div className="pt-2">
         <p className="text-[9px] text-center text-slate-400 font-bold uppercase leading-relaxed px-4">
            Scanning a Suki ID while a transaction is active will automatically assign the ledger.
         </p>
      </div>
    </div>
  );
};

export default ScanGoPanel;