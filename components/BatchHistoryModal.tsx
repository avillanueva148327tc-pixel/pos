
import React, { useState } from 'react';
import { BatchRecord, UserRole } from '../types';

interface BatchHistoryModalProps {
  batches: BatchRecord[];
  onClose: () => void;
  userRole?: UserRole;
}

const BatchHistoryModal: React.FC<BatchHistoryModalProps> = ({ batches, onClose, userRole = 'cashier' }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const isAdmin = userRole === 'admin';

  // Sort by date descending (newest first)
  const sortedBatches = [...batches].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/10">
        
        {/* Header */}
        <div className="p-6 md:p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Purchase History</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              {batches.length} Batches Recorded
            </p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition">✕</button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 custom-scrollbar">
          {sortedBatches.length === 0 ? (
            <div className="text-center py-12 opacity-50">
              <span className="text-4xl mb-4 block grayscale">📦</span>
              <p className="text-xs font-black text-slate-500 uppercase">No purchase history found</p>
            </div>
          ) : (
            sortedBatches.map((batch) => (
              <div 
                key={batch.id} 
                className={`bg-[#1e293b] rounded-3xl border transition-all overflow-hidden ${
                  expandedId === batch.id 
                    ? 'border-[#6366f1] shadow-lg ring-1 ring-[#6366f1]/20' 
                    : 'border-white/5 hover:border-white/10'
                }`}
              >
                <div 
                  onClick={() => setExpandedId(expandedId === batch.id ? null : batch.id)}
                  className="p-5 cursor-pointer flex justify-between items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black bg-white/5 text-slate-300 px-2 py-1 rounded-lg uppercase tracking-widest">
                        {new Date(batch.date).toLocaleDateString()}
                      </span>
                      {batch.note && (
                        <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px] uppercase">
                          • {batch.note}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold text-slate-400">{batch.items.length} items</span>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="text-right">
                      <p className="text-lg font-black text-white">₱{batch.totalCost.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                    </div>
                  )}
                </div>

                {expandedId === batch.id && (
                  <div className="px-5 pb-5 pt-0 animate-in slide-in-from-top-2">
                    <div className="h-px bg-white/5 mb-4"></div>
                    <table className="w-full text-[10px]">
                      <thead className="text-slate-500 font-black uppercase tracking-widest text-left">
                        <tr>
                          <th className="pb-2">Item</th>
                          <th className="pb-2 text-right">Qty</th>
                          {isAdmin && <th className="pb-2 text-right">Cost</th>}
                          {isAdmin && <th className="pb-2 text-right">Subtotal</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {batch.items.map((item, idx) => (
                          <tr key={idx} className="text-slate-300 font-medium">
                            <td className="py-2 pr-2 uppercase font-bold">{item.name}</td>
                            <td className="py-2 text-right text-slate-400">{item.quantity}</td>
                            {isAdmin && <td className="py-2 text-right text-slate-400">₱{item.costPerUnit.toFixed(2)}</td>}
                            {isAdmin && <td className="py-2 text-right font-black text-white">₱{(item.quantity * item.costPerUnit).toFixed(2)}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="mt-4 text-[9px] text-slate-500 font-mono text-right uppercase">
                      ID: {batch.id.slice(0, 8)}...
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BatchHistoryModal;
