
import React from 'react';
import { InventoryItem } from '../types';

interface ExpiryAlertBannerProps {
  expiringItems: InventoryItem[];
  threshold: number;
  onViewDetails: () => void;
  onDismiss: () => void;
}

const ExpiryAlertBanner: React.FC<ExpiryAlertBannerProps> = ({ expiringItems, threshold, onViewDetails, onDismiss }) => {
  if (expiringItems.length === 0) return null;

  return (
    <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
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
              Take Action
            </button>
            <button 
              onClick={onDismiss}
              className="px-3 py-2.5 hover:bg-white/10 rounded-xl transition text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      
      {/* Mini Scrolling List for more than 1 item */}
      {expiringItems.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          {expiringItems.map(item => (
            <div key={item.id} className="shrink-0 px-3 py-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-full flex items-center gap-2">
              <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase truncate max-w-[100px]">{item.name}</span>
              <span className="text-[8px] font-bold text-amber-500 uppercase">{item.expiryDate?.split('-').slice(1).join('/')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpiryAlertBanner;
