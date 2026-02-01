
import React from 'react';
import { InventoryItem } from '../types';

interface ExpiryAlertBannerProps {
  expiringItems: InventoryItem[];
  lowStockItems?: InventoryItem[];
  threshold: number;
  onViewDetails: () => void;
  onDismiss: () => void;
}

const ExpiryAlertBanner: React.FC<ExpiryAlertBannerProps> = ({ 
  expiringItems, 
  lowStockItems = [], 
  threshold, 
  onViewDetails, 
  onDismiss 
}) => {
  const hasExpiry = expiringItems.length > 0;
  const hasLowStock = lowStockItems.length > 0;

  if (!hasExpiry && !hasLowStock) {
    // Show "All Good" message if notification center is opened but empty
    return (
      <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
        <div className="bg-emerald-500/10 rounded-3xl border border-emerald-500/20 p-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-2xl text-emerald-500">
                ✨
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-emerald-500">All Good!</h4>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  No expiring items or stock warnings found.
                </p>
              </div>
           </div>
           <button onClick={onDismiss} className="px-4 py-2 hover:bg-emerald-500/10 rounded-xl transition text-emerald-500 font-black text-xs uppercase">
              Close
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 duration-500 space-y-4">
      <div className="flex justify-end">
         <button onClick={onDismiss} className="text-xs font-black uppercase text-slate-400 hover:text-white transition bg-white/5 px-3 py-1 rounded-lg">Close Notifications ✕</button>
      </div>

      {hasExpiry && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-1 shadow-lg shadow-amber-500/20">
          <div className="bg-white/10 backdrop-blur-md rounded-[22px] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-pulse">
                ⚠️
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider">Expiry Warning</h4>
                <p className="text-[11px] font-bold opacity-90">
                  {expiringItems.length} {expiringItems.length === 1 ? 'item is' : 'items are'} expiring within {threshold} days!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onViewDetails}
                className="flex-1 md:flex-none px-6 py-2.5 bg-white text-orange-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-50 transition active:scale-95 shadow-sm"
              >
                View Inventory
              </button>
            </div>
          </div>
          
          {/* Scrolling List for Expiry */}
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
            {expiringItems.map(item => (
              <div key={item.id} className="shrink-0 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full flex items-center gap-2">
                <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase truncate max-w-[100px]">{item.name}</span>
                <span className="text-[8px] font-bold text-amber-500 uppercase">{item.expiryDate?.split('-').slice(1).join('/')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasLowStock && (
        <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-3xl p-1 shadow-lg shadow-rose-500/20">
          <div className="bg-white/10 backdrop-blur-md rounded-[22px] px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                📉
              </div>
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider">Low Stock Alert</h4>
                <p className="text-[11px] font-bold opacity-90">
                  {lowStockItems.length} products need restocking immediately.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button 
                onClick={onViewDetails}
                className="flex-1 md:flex-none px-6 py-2.5 bg-white text-rose-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 transition active:scale-95 shadow-sm"
              >
                Restock Now
              </button>
            </div>
          </div>
          
          {/* Scrolling List for Low Stock */}
          <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
            {lowStockItems.slice(0, 10).map(item => (
              <div key={item.id} className="shrink-0 px-3 py-1.5 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-full flex items-center gap-2">
                <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 uppercase truncate max-w-[100px]">{item.name}</span>
                <span className="text-[8px] font-bold text-rose-200 uppercase bg-rose-500/40 px-1.5 rounded">{item.stock} left</span>
              </div>
            ))}
            {lowStockItems.length > 10 && (
               <span className="text-[9px] text-white/70 self-center px-2">+{lowStockItems.length - 10} more</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpiryAlertBanner;
