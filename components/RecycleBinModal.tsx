
import React, { useState } from 'react';
import { RecycleBinItem } from '../types';

interface RecycleBinModalProps {
  recycleBin: RecycleBinItem[];
  onRestore: (item: RecycleBinItem) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyBin: () => void;
  onClose: () => void;
}

const RecycleBinModal: React.FC<RecycleBinModalProps> = ({ 
  recycleBin, onRestore, onPermanentDelete, onEmptyBin, onClose 
}) => {
  const [filter, setFilter] = useState<'all' | 'inventory' | 'record' | 'customer'>('all');

  const filteredItems = recycleBin.filter(item => filter === 'all' || item.type === filter);
  const sortedItems = [...filteredItems].sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  const getIcon = (type: string) => {
    switch(type) {
      case 'inventory': return '📦';
      case 'customer': return '👤';
      case 'record': return '🧾';
      default: return '🗑️';
    }
  };

  const getLabel = (type: string) => {
    switch(type) {
      case 'inventory': return 'Product';
      case 'customer': return 'Suki Account';
      case 'record': return 'Ledger Entry';
      default: return 'Asset';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a] shrink-0">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-rose-500/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-rose-500/20">
              ♻️
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">Secure Archive</h3>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">
                {recycleBin.length} DELETED SYSTEM ASSETS
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-all border border-white/5 active:scale-90 text-xl">✕</button>
        </div>

        {/* Filters */}
        <div className="flex p-2 bg-[#1e293b] gap-2 px-8 overflow-x-auto no-scrollbar shrink-0 border-b border-white/5">
          {[
            { id: 'all', label: 'ALL ASSETS' },
            { id: 'inventory', label: 'INVENTORY' },
            { id: 'customer', label: 'SUKI BASE' },
            { id: 'record', label: 'LEDGERS' },
          ].map(f => (
            <button 
              key={f.id} 
              onClick={() => setFilter(f.id as any)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 ${
                filter === f.id ? 'bg-[#6366f1] text-white border-[#6366f1] shadow-lg' : 'bg-transparent text-slate-400 border-transparent hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar bg-[#020617] align-content-start">
          {sortedItems.length === 0 ? (
            <div className="text-center py-32 opacity-30 flex flex-col items-center">
              <div className="w-24 h-24 bg-slate-900 rounded-[3rem] border border-white/5 flex items-center justify-center text-6xl mb-6 grayscale">🗑️</div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-[0.4em]">Archive is Empty</p>
            </div>
          ) : (
            sortedItems.map(item => (
              <div key={item.id} className="p-6 bg-[#1e293b]/40 backdrop-blur-sm rounded-[2rem] border border-white/5 flex flex-wrap md:flex-nowrap md:items-center justify-between gap-6 group hover:bg-[#1e293b]/60 hover:border-white/10 transition-all animate-in slide-in-from-bottom-2">
                 <div className="flex-[1_1_300px] flex items-center gap-5">
                    <div className="w-14 h-14 bg-[#0f172a] rounded-[1.2rem] flex items-center justify-center text-2xl shrink-0 border border-white/5 shadow-inner">
                       {getIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                       <p className="font-black text-sm text-white uppercase truncate leading-none mb-2">{item.originalName}</p>
                       <div className="flex items-center gap-3">
                          <span className="text-[8px] font-black text-slate-400 uppercase bg-[#0f172a] px-2.5 py-1 rounded-md border border-white/5 tracking-widest">
                            {getLabel(item.type)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                            EXPUNGED: {new Date(item.deletedAt).toLocaleDateString()}
                          </span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex-[0_0_auto] flex gap-3 ml-auto">
                    <button 
                      onClick={() => onRestore(item)}
                      className="px-6 py-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all active:scale-95"
                    >
                      RESTORE
                    </button>
                    <button 
                      onClick={() => { if(window.confirm('IRREVERSIBLE ACTION: Permanently wipe this asset?')) onPermanentDelete(item.id) }}
                      className="px-6 py-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95"
                    >
                      WIPE DATA
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {recycleBin.length > 0 && (
          <div className="p-8 bg-[#0f172a] border-t border-white/5 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">AUTO-PURGE ENABLED (30 DAYS)</p>
             </div>
             <button 
               onClick={() => { if(window.confirm('DANGER: This will permanently erase ALL deleted assets. Proceed?')) onEmptyBin() }}
               className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-rose-500 transition-all shadow-2xl shadow-rose-900/40 active:scale-95"
             >
               Erase All Records
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBinModal;
