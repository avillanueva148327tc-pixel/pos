
import React, { useState, useMemo, useEffect } from 'react';
import { InventoryItem, UserRole } from '../types';

interface StockAdjustModalProps {
  item: InventoryItem;
  onAdjust: (id: string, newStock: number, newItemsPerPack?: number) => void;
  onClose: () => void;
  userRole?: UserRole;
}

type AdjustMode = 'incremental' | 'packs' | 'absolute';

const StockAdjustModal: React.FC<StockAdjustModalProps> = ({ item, onAdjust, onClose, userRole = 'cashier' }) => {
  const [mode, setMode] = useState<AdjustMode>('incremental');
  const [adjustment, setAdjustment] = useState<number>(0);
  const [manualValue, setManualValue] = useState<string>('');
  
  // Pack Logic - Defaults to item configuration from the product registry
  // IMPORTANT: Ensure fallback is 1 if item.itemsPerPack is undefined/null/0
  const [itemsPerPack, setItemsPerPack] = useState<number>(item.itemsPerPack && item.itemsPerPack > 0 ? item.itemsPerPack : 1);
  const [packCount, setPackCount] = useState<number>(1);

  const isAdmin = userRole === 'admin';

  // Synchronize itemsPerPack if it changes or on load
  useEffect(() => {
    if (item.itemsPerPack && item.itemsPerPack > 0) {
      setItemsPerPack(item.itemsPerPack);
    }
  }, [item.itemsPerPack]);

  const newStock = useMemo(() => {
    if (mode === 'absolute') {
      return Math.max(0, parseFloat(manualValue) || 0);
    }
    
    if (mode === 'packs') {
      // Calculate total pieces to add
      const packTotal = itemsPerPack * packCount;
      return Math.max(0, item.stock + packTotal);
    }
    
    const adj = manualValue ? (parseFloat(manualValue) || 0) : adjustment;
    return Math.max(0, item.stock + adj);
  }, [item.stock, adjustment, mode, manualValue, itemsPerPack, packCount]);

  const handleQuickAdjust = (val: number) => {
    setMode('incremental');
    setAdjustment(prev => prev + val);
    setManualValue('');
  };

  const handleManualChange = (val: string) => {
    setManualValue(val);
    setAdjustment(0);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdjust(item.id, newStock, itemsPerPack);
    onClose();
  };

  const availableModes: AdjustMode[] = isAdmin 
    ? ['incremental', 'packs', 'absolute'] 
    : ['incremental', 'packs'];

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-lg flex items-center justify-center z-[110] p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] shadow-3xl overflow-hidden animate-in zoom-in duration-300 flex flex-col border border-slate-200 dark:border-white/10">
        
        {/* Metric Overview Header */}
        <div className="p-8 bg-[#0f172a] text-white relative">
          <div className="relative z-10 flex justify-between items-start mb-10">
            <div>
              <h3 className="text-2xl font-black tracking-tighter uppercase leading-none">PAN</h3>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mt-2 leading-tight">
                STOCK ADJUSTMENT<br/>INTERFACE
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">LIVE COUNT</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black tracking-tighter">{item.stock}</span>
                <span className="text-[10px] font-black opacity-30 uppercase">{item.unit}</span>
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-[2.5rem] border border-white/5">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">PROJECTED</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-3xl font-black tracking-tighter transition-colors ${newStock !== item.stock ? 'text-primary-light' : 'text-white'}`}>
                  {newStock}
                </span>
                <span className="text-[10px] font-black opacity-30 uppercase">{item.unit}</span>
              </div>
            </div>
          </div>
        </div>

        <form id="stock-adjust-form" onSubmit={handleSubmit} className="p-8 space-y-8 bg-white dark:bg-[#020617]">
          {/* Tabs Navigation */}
          <div className="flex p-1.5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl relative border border-slate-100 dark:border-white/5">
            {availableModes.map((m) => (
              <button 
                key={m}
                type="button"
                onClick={() => { setMode(m); setManualValue(''); setAdjustment(0); }}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 ${mode === m ? 'text-primary' : 'text-slate-400'}`}
              >
                {m === 'incremental' ? 'MANUAL' : m === 'packs' ? 'PACKS' : 'TOTAL'}
              </button>
            ))}
            <div 
              className="absolute h-[calc(100%-12px)] top-[6px] bg-white dark:bg-slate-800 rounded-xl shadow-md transition-all duration-300 ease-out"
              style={{ 
                width: `calc(${100 / availableModes.length}% - 8px)`,
                left: mode === 'incremental' ? '6px' : mode === 'packs' ? `calc(${100 / availableModes.length}% + 2px)` : '66.666%',
              }}
            />
          </div>

          <div className="min-h-[220px]">
            {mode === 'packs' && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">UNITS PER PACK</label>
                    <input 
                      type="number" 
                      step="any"
                      className="w-full h-16 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-xl font-black outline-none focus:border-primary transition"
                      value={itemsPerPack}
                      onChange={e => setItemsPerPack(Math.max(1, parseFloat(e.target.value) || 0))}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">ADD PACKS</label>
                    <input 
                      type="number"
                      step="any"
                      className="w-full h-16 px-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-xl font-black outline-none focus:border-primary transition"
                      value={packCount}
                      onChange={e => setPackCount(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="p-6 bg-primary/5 rounded-[2.5rem] border border-dashed border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📦</span>
                    <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">BATCH ADDITION</p>
                      <p className="text-[8px] font-bold text-primary/60 uppercase">{itemsPerPack} units × {packCount} packs</p>
                    </div>
                  </div>
                  <p className="text-2xl font-black text-primary tracking-tighter">+{ (itemsPerPack * packCount).toLocaleString() }</p>
                </div>
              </div>
            )}

            {mode === 'incremental' && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-3 gap-3">
                  {[1, 5, 12, 24, 50, 100].map(val => (
                    <button 
                      type="button"
                      key={val} 
                      onClick={() => handleQuickAdjust(val)} 
                      className="h-16 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-2xl font-black text-[13px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
                    >
                      +{val}
                    </button>
                  ))}
                </div>
                
                <div className="relative">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl">±</div>
                  <input 
                    className="w-full h-16 pl-14 pr-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-2xl font-black outline-none focus:border-primary transition shadow-inner placeholder:text-slate-400 placeholder:font-black" 
                    placeholder="Enter Delta"
                    type="number"
                    step="any"
                    value={manualValue || (adjustment !== 0 ? adjustment : '')}
                    onChange={e => handleManualChange(e.target.value)}
                  />
                </div>
              </div>
            )}

            {mode === 'absolute' && isAdmin && (
              <div className="space-y-6 animate-in slide-in-from-top-2">
                <div className="p-10 bg-amber-50 dark:bg-amber-900/10 rounded-[2.5rem] border border-amber-200 dark:border-amber-800/30 text-center">
                  <label className="block text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-6">FINAL COUNT OVERRIDE</label>
                  <input 
                    autoFocus
                    className="w-full bg-transparent text-center font-black text-7xl outline-none text-amber-600 tracking-tighter"
                    type="number"
                    step="any"
                    value={manualValue}
                    onChange={e => handleManualChange(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        <div className="p-6 bg-white dark:bg-[#020617] border-t border-slate-100 dark:border-white/5">
          <button 
            type="submit"
            form="stock-adjust-form"
            className="w-full h-16 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-[#6366f1]/30 hover:bg-[#4f46e5] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            <span>UPDATE PHYSICAL COUNT</span>
            <span className="text-lg opacity-40">⚙️</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StockAdjustModal;
