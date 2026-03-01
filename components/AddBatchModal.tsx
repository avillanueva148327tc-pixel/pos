import React, { useState, useMemo } from 'react';
import { InventoryItem, BatchRecord, UserRole } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';
import { SearchService } from '../services/searchService';

interface AddBatchModalProps {
  inventory: InventoryItem[];
  onAddBatch: (batch: Omit<BatchRecord, 'id'>) => void;
  onClose: () => void;
  onCreateNewItem: (name: string) => void;
  userRole?: UserRole;
}

type BatchItem = { 
  productId?: string; 
  name: string; 
  quantity: string; 
  costPerUnit: string; 
  currentStock?: number; 
  type: 'stock' | 'expense';
};

const AddBatchModal: React.FC<AddBatchModalProps> = ({ inventory, onAddBatch, onClose, onCreateNewItem, userRole = 'cashier' }) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [note, setNote] = useState('');
  const [totalCostOverride, setTotalCostOverride] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdmin = userRole === 'admin';

  // Calculate total from items
  const calculatedTotal = useMemo(() => items.reduce((sum, item) => sum + ((parseFloat(item.quantity) || 0) * (parseFloat(item.costPerUnit) || 0)), 0), [items]);
  
  // Use override if provided, otherwise calculated
  const finalTotalCost = totalCostOverride ? parseFloat(totalCostOverride) : calculatedTotal;

  const filteredInventory = useMemo(() => {
    if (!productSearch) return inventory.slice(0, 10);
    return inventory.filter(i => 
      SearchService.fuzzyMatch(productSearch, i.name) || 
      (i.barcode && i.barcode.toLowerCase().includes(productSearch.toLowerCase()))
    ).slice(0, 10);
  }, [inventory, productSearch]);

  const handleAddInventoryItem = (product: InventoryItem) => {
    const existing = items.findIndex(i => i.productId === product.id);
    if (existing >= 0) {
      const newItems = [...items];
      newItems[existing].quantity = String((parseFloat(newItems[existing].quantity) || 0) + 1);
      setItems(newItems);
    } else {
      setItems([...items, { 
        productId: product.id, 
        name: product.name, 
        quantity: '1', 
        costPerUnit: String(product.originalPrice || 0),
        currentStock: product.stock,
        type: 'stock'
      }]);
    }
    setProductSearch('');
  };

  const handleAddExpenseItem = () => {
    if (!productSearch) return;
    setItems([...items, {
      name: productSearch,
      quantity: '1',
      costPerUnit: '0',
      type: 'expense'
    }]);
    setProductSearch('');
  };
  
  const handleItemChange = (index: number, field: 'quantity' | 'costPerUnit', value: string) => {
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return; // Prevent invalid characters
    }
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleNumericInput = (value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setter(value);
    }
  };

  const handleBarcodeScan = (code: string) => {
    const found = inventory.find(i => i.barcode === code);
    if (found) {
      handleAddInventoryItem(found);
      return ScanResultStatus.SUCCESS;
    }
    return ScanResultStatus.NOT_FOUND;
  };

  const handleSubmit = () => {
    if (finalTotalCost <= 0 && items.length === 0) return;
    
    // Generate ISO date with current time for accurate history tracking
    const now = new Date();
    const [y, m, d] = date.split('-').map(Number);
    now.setUTCFullYear(y, m - 1, d);
    
    const timestamp = now.toISOString();

    onAddBatch({
      date: timestamp,
      note: note || 'Restock / Purchase',
      totalCost: finalTotalCost,
      items: items.map(i => ({
        productId: i.type === 'stock' ? i.productId : undefined,
        name: i.name,
        quantity: parseFloat(i.quantity) || 0,
        costPerUnit: parseFloat(i.costPerUnit) || 0
      }))
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[150] p-4 animate-in fade-in duration-500">
        <div className="bg-[#0f172a] w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row relative group">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full -mr-32 -mt-32 blur-[120px] group-hover:bg-emerald-500/15 transition-colors duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full -ml-32 -mb-32 blur-[100px]"></div>

          {/* Left: Input Form */}
          <div className="w-full md:w-7/12 p-10 flex flex-col border-b md:border-b-0 md:border-r border-white/5 bg-[#0f172a]/50 backdrop-blur-md relative z-10">
             <div className="flex justify-between items-start mb-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Inventory Acquisition System</p>
                  </div>
                  <h2 className="text-4xl font-black text-white tracking-tighter leading-none">Log Expense</h2>
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
                    <span className="opacity-50">●</span>
                    RECORD PURCHASES & STOCK
                  </p>
                </div>
                <button 
                  onClick={onClose} 
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-white/5 hover:border-rose-500/50 group/close"
                >
                  <span className="text-xl group-hover/close:rotate-90 transition-transform duration-300">✕</span>
                </button>
             </div>

             <div className="space-y-8 flex-1 overflow-y-auto custom-scrollbar pr-2">
                
                {/* Date & Note */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Acquisition Date</label>
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Batch Note / Source</label>
                    <input 
                      placeholder="e.g. Puregold, Public Market" 
                      value={note} 
                      onChange={e => setNote(e.target.value)} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all" 
                    />
                  </div>
                </div>

                {/* Total Cost Override - ADMIN ONLY */}
                {isAdmin && (
                  <div className="bg-emerald-500/5 p-8 rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden group/total">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 group-hover/total:bg-emerald-500/20 transition-colors"></div>
                     <div className="flex justify-between items-center mb-4 relative z-10">
                       <label className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Total Receipt Amount</label>
                       <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">Sum: ₱{calculatedTotal.toLocaleString()}</span>
                     </div>
                     <div className="flex items-center gap-4 relative z-10">
                        <span className="text-3xl font-black text-emerald-500">₱</span>
                        <input 
                          type="text" 
                          inputMode="decimal"
                          placeholder={calculatedTotal > 0 ? calculatedTotal.toString() : "0.00"}
                          value={totalCostOverride} 
                          onChange={e => handleNumericInput(e.target.value, setTotalCostOverride)} 
                          className="w-full bg-transparent text-5xl font-black text-white outline-none placeholder:text-white/10 tracking-tighter" 
                        />
                     </div>
                     <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-4 relative z-10">Enter actual amount paid for accurate expense tracking</p>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between px-1">
                     <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Purchased Items</h3>
                     <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">{items.length} Entries</span>
                   </div>

                   {items.length === 0 ? (
                     <div className="p-12 text-center border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center gap-4 text-slate-600">
                       <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-3xl opacity-20">🛒</div>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.3em]">Acquisition list is empty</p>
                         <p className="text-[8px] font-bold uppercase tracking-widest mt-2 opacity-50">Select products from the catalog to begin</p>
                       </div>
                     </div>
                   ) : (
                     <div className="space-y-3">
                       {items.map((item, idx) => (
                         <div key={idx} className={`group/item p-5 rounded-[2rem] border transition-all duration-300 ${item.type === 'expense' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 'bg-white/5 border-white/5 hover:border-white/10'}`}>
                            <div className="flex justify-between items-start mb-4">
                               <div className="flex-1 min-w-0 pr-4 flex items-center gap-3">
                                  {item.type === 'expense' ? (
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 text-xs">⚠️</div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-xs">📦</div>
                                  )}
                                  <div>
                                    <span className="text-sm font-black text-white uppercase truncate block tracking-tight">{item.name}</span>
                                    {item.type === 'stock' && (
                                      <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Stock:</span>
                                        <span className="text-[9px] text-emerald-400 font-black tabular-nums">{item.currentStock || 0} → {(item.currentStock || 0) + (parseFloat(item.quantity) || 0)}</span>
                                      </div>
                                    )}
                                    {item.type === 'expense' && <span className="text-[9px] text-amber-500 font-black uppercase tracking-widest mt-1 block">Expense Record Only</span>}
                                  </div>
                               </div>
                               <button 
                                 onClick={() => removeItem(idx)} 
                                 className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90"
                               >
                                 ✕
                               </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1.5">
                                 <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">Quantity</label>
                                 <div className="flex items-center gap-3 bg-[#0f172a] rounded-xl px-4 py-2 border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                   <input type="text" inputMode="decimal" value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', e.target.value)} className="w-full bg-transparent text-xs font-black text-white outline-none text-right tabular-nums" />
                                 </div>
                               </div>
                               {isAdmin && (
                                 <div className="space-y-1.5">
                                   <label className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-1">Cost Each (₱)</label>
                                   <div className="flex items-center gap-3 bg-[#0f172a] rounded-xl px-4 py-2 border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                                     <input type="text" inputMode="decimal" value={item.costPerUnit} onChange={e => handleItemChange(idx, 'costPerUnit', e.target.value)} className="w-full bg-transparent text-xs font-black text-white outline-none text-right tabular-nums" placeholder="0.00" />
                                   </div>
                                 </div>
                               )}
                            </div>
                         </div>
                       ))}
                     </div>
                   )}
                </div>
             </div>

             <div className="mt-8 pt-8 border-t border-white/5">
                <button 
                  onClick={handleSubmit} 
                  className="w-full h-20 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-emerald-500/40 hover:bg-emerald-500 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-4 group/submit"
                >
                  <span className="group-hover/submit:translate-x-1 transition-transform">Confirm Transaction</span>
                  <span className="text-xl">→</span>
                </button>
             </div>
          </div>

          {/* Right: Product Catalog */}
          <div className="w-full md:w-5/12 p-10 bg-[#020617]/50 backdrop-blur-xl flex flex-col relative z-10">
             <div className="flex gap-3 mb-8">
                <div className="relative flex-1 group/search">
                   <input 
                     placeholder="Search item..." 
                     className="w-full h-14 bg-white/5 rounded-2xl px-6 pl-12 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all border border-white/5"
                     value={productSearch}
                     onChange={e => setProductSearch(e.target.value)}
                   />
                   <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg opacity-50 group-focus-within/search:opacity-100 transition-opacity">🔍</span>
                </div>
                <button 
                  onClick={() => setShowScanner(true)} 
                  className="w-14 h-14 rounded-2xl bg-white/5 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all border border-white/5 active:scale-90"
                >
                  📸
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar mb-8 pr-2">
                <div className="grid grid-cols-1 gap-3">
                  {/* Create New / Custom Options when searching */}
                  {productSearch && (
                    <div className="grid grid-cols-1 gap-3 mb-6 animate-in slide-in-from-top-4 duration-500">
                       <button onClick={() => onCreateNewItem(productSearch)} className="p-5 bg-indigo-500/10 border border-indigo-500/30 rounded-[1.5rem] text-left hover:bg-indigo-500/20 transition-all group/new">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">New Inventory Item</p>
                          <p className="text-sm font-black text-white group-hover:translate-x-1 transition-transform">Create "{productSearch}"</p>
                       </button>
                       <button onClick={handleAddExpenseItem} className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-[1.5rem] text-left hover:bg-amber-500/20 transition-all group/exp">
                          <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-1">One-off Expense</p>
                          <p className="text-sm font-black text-white group-hover:translate-x-1 transition-transform">Log "{productSearch}"</p>
                       </button>
                    </div>
                  )}

                  {filteredInventory.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => handleAddInventoryItem(item)}
                      className="p-4 bg-white/5 rounded-[1.5rem] border border-white/5 flex items-center gap-4 hover:border-emerald-500/50 hover:bg-white/[0.08] transition-all active:scale-[0.98] group text-left"
                    >
                       <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform border border-white/5 overflow-hidden">
                          {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : '📦'}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-xs font-black text-white uppercase truncate tracking-tight">{item.name}</p>
                         <div className="flex justify-between items-center mt-1">
                            <p className="text-[9px] text-slate-500 font-bold uppercase">Stock: {item.stock}</p>
                            {isAdmin && <p className="text-[9px] font-black text-emerald-500">₱{item.originalPrice?.toFixed(2) || '?'}</p>}
                         </div>
                       </div>
                       <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white text-xs group-hover:bg-emerald-500 group-hover:rotate-90 transition-all">+</div>
                    </button>
                  ))}
                  
                  {filteredInventory.length === 0 && !productSearch && (
                     <div className="text-center py-20 opacity-20">
                        <p className="text-xs font-black uppercase tracking-[0.3em]">No items found</p>
                     </div>
                  )}
                </div>
             </div>
             
             <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em] mb-4">Quick Protocols</p>
                <div className="flex gap-3 justify-center">
                   <button onClick={() => onCreateNewItem('')} className="px-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all border border-white/5 active:scale-95">
                     + New Product
                   </button>
                   <button onClick={() => { setProductSearch('Transport'); }} className="px-5 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all border border-white/5 active:scale-95">
                     + Fare/Gas
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddBatchModal;
