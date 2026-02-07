
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

  // Group by date for nicer display
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
      case 'inventory': return 'Inventory Item';
      case 'customer': return 'Customer Profile';
      case 'record': return 'Transaction';
      default: return 'Item';
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500/10 rounded-2xl flex items-center justify-center text-2xl">
              ♻️
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Recycle Bin</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                {recycleBin.length} Items Deleted
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition">✕</button>
        </div>

        {/* Filters */}
        <div className="flex p-2 bg-[#1e293b] gap-2 px-8 overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'inventory', label: 'Inventory' },
            { id: 'customer', label: 'Customers' },
            { id: 'record', label: 'Transactions' },
          ].map(f => (
            <button 
              key={f.id} 
              onClick={() => setFilter(f.id as any)}
              className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === f.id ? 'bg-[#6366f1] text-white shadow-lg' : 'bg-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-3 custom-scrollbar bg-[#020617]">
          {sortedItems.length === 0 ? (
            <div className="text-center py-20 opacity-50 flex flex-col items-center">
              <span className="text-6xl mb-4 opacity-50 grayscale">🗑️</span>
              <p className="text-xs font-black text-slate-500 uppercase">Recycle Bin is Empty</p>
              <p className="text-[10px] text-slate-600 mt-2 max-w-xs leading-relaxed">
                Items you delete will appear here. You can restore them or permanently delete them.
              </p>
            </div>
          ) : (
            sortedItems.map(item => (
              <div key={item.id} className="p-4 bg-[#1e293b] rounded-2xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-white/10 transition">
                 <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-[#0f172a] rounded-xl flex items-center justify-center text-lg shrink-0 border border-white/5">
                       {getIcon(item.type)}
                    </div>
                    <div>
                       <p className="font-bold text-xs text-white uppercase">{item.originalName}</p>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase bg-[#0f172a] px-2 py-0.5 rounded-md border border-white/5">
                            {getLabel(item.type)}
                          </span>
                          <span className="text-[9px] text-slate-500">
                            Deleted: {new Date(item.deletedAt).toLocaleDateString()}
                          </span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex gap-2 justify-end">
                    <button 
                      onClick={() => onRestore(item)}
                      className="px-4 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-white transition flex items-center gap-2"
                    >
                      <span>↩</span> Restore
                    </button>
                    <button 
                      onClick={() => { if(window.confirm('Permanently delete this item? This cannot be undone.')) onPermanentDelete(item.id) }}
                      className="px-4 py-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-rose-500 hover:text-white transition flex items-center gap-2"
                    >
                      <span>✕</span> Delete
                    </button>
                 </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {recycleBin.length > 0 && (
          <div className="p-6 bg-[#0f172a] border-t border-white/5 flex justify-end">
             <button 
               onClick={() => { if(window.confirm('Are you sure you want to empty the Recycle Bin? All items will be permanently lost.')) onEmptyBin() }}
               className="px-6 py-3 bg-rose-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition shadow-lg shadow-rose-500/20"
             >
               Empty Bin ({recycleBin.length})
             </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecycleBinModal;
