import React, { useState, useMemo } from 'react';
import { InventoryItem, BatchRecord, UserRole } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';

interface AddBatchModalProps {
  inventory: InventoryItem[];
  onAddBatch: (batch: Omit<BatchRecord, 'id'>) => void;
  onClose: () => void;
  onCreateNewItem: (name: string) => void;
  userRole?: UserRole;
}

const AddBatchModal: React.FC<AddBatchModalProps> = ({ inventory, onAddBatch, onClose, onCreateNewItem, userRole = 'cashier' }) => {
  const [items, setItems] = useState<{ productId?: string; name: string; quantity: number; costPerUnit: number; currentStock?: number; type: 'stock' | 'expense' }[]>([]);
  const [note, setNote] = useState('');
  const [totalCostOverride, setTotalCostOverride] = useState<string>('');
  const [productSearch, setProductSearch] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const isAdmin = userRole === 'admin';

  // Calculate total from items
  const calculatedTotal = useMemo(() => items.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0), [items]);
  
  // Use override if provided, otherwise calculated
  const finalTotalCost = totalCostOverride ? parseFloat(totalCostOverride) : calculatedTotal;

  const filteredInventory = useMemo(() => {
    if (!productSearch) return inventory.slice(0, 10);
    return inventory.filter(i => 
      i.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      (i.barcode && i.barcode.includes(productSearch))
    ).slice(0, 10);
  }, [inventory, productSearch]);

  const handleAddInventoryItem = (product: InventoryItem) => {
    const existing = items.findIndex(i => i.productId === product.id);
    if (existing >= 0) {
      const newItems = [...items];
      newItems[existing].quantity += 1;
      setItems(newItems);
    } else {
      setItems([...items, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        costPerUnit: product.originalPrice || 0,
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
      quantity: 1,
      costPerUnit: 0,
      type: 'expense'
    }]);
    setProductSearch('');
  };

  const updateItem = (index: number, field: string, value: number) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
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
    now.setFullYear(y, m - 1, d);
    
    const timestamp = now.toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    });

    onAddBatch({
      date: timestamp,
      note: note || 'Restock / Purchase',
      totalCost: finalTotalCost,
      items: items.map(i => ({
        productId: i.type === 'stock' ? i.productId : undefined,
        name: i.name,
        quantity: i.quantity,
        costPerUnit: i.costPerUnit
      }))
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in">
        <div className="bg-[#0f172a] w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row">
          
          {/* Left: Input Form */}
          <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col border-b md:border-b-0 md:border-r border-white/5 bg-[#1e293b]">
             <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Log Expense / Stock In</h2>
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-1">Record Purchases</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10">✕</button>
             </div>

             <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar">
                
                {/* Date & Note */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Date Bought</label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Batch Note / Store</label>
                    <input placeholder="e.g. Puregold, Public Market" value={note} onChange={e => setNote(e.target.value)} className="w-full mt-1 bg-[#0f172a] border border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:border-emerald-500" />
                  </div>
                </div>

                {/* Total Cost Override - ADMIN ONLY */}
                {isAdmin && (
                  <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                     <div className="flex justify-between items-center mb-2">
                       <label className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Total Receipt Amount</label>
                       <span className="text-[9px] text-slate-400">Sum of Items: ₱{calculatedTotal.toLocaleString()}</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-emerald-500">₱</span>
                        <input 
                          type="number" 
                          step="any"
                          placeholder={calculatedTotal > 0 ? calculatedTotal.toString() : "0.00"}
                          value={totalCostOverride} 
                          onChange={e => setTotalCostOverride(e.target.value)} 
                          className="w-full bg-transparent text-3xl font-black text-white outline-none placeholder:text-white/20" 
                        />
                     </div>
                     <p className="text-[9px] text-slate-500 mt-2">Enter the actual amount paid if items are estimates. This amount is recorded as the expense.</p>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-2">
                   <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchased Items ({items.length})</h3>
                   {items.length === 0 ? (
                     <div className="p-8 text-center border-2 border-dashed border-white/5 rounded-2xl">
                       <p className="text-xs text-slate-500 font-bold uppercase">List is empty</p>
                       <p className="text-[10px] text-slate-600 mt-1">Select products from the right to stock up.</p>
                     </div>
                   ) : (
                     items.map((item, idx) => (
                       <div key={idx} className={`p-3 rounded-xl border flex flex-col gap-2 ${item.type === 'expense' ? 'bg-amber-900/10 border-amber-500/20' : 'bg-[#0f172a] border-white/5'}`}>
                          <div className="flex justify-between items-center">
                             <div className="flex-1 min-w-0 pr-2 flex items-center gap-2">
                                {item.type === 'expense' && <span className="text-amber-500 text-[10px]" title="Expense Only">⚠️</span>}
                                <div>
                                  <span className="text-xs font-bold text-white truncate block">{item.name}</span>
                                  {item.type === 'stock' && (
                                    <span className="text-[9px] text-emerald-400 font-mono">
                                      Stock: {item.currentStock || 0} → <b className="text-white">{(item.currentStock || 0) + item.quantity}</b>
                                    </span>
                                  )}
                                  {item.type === 'expense' && <span className="text-[9px] text-amber-500 font-mono">Expense Record Only</span>}
                                </div>
                             </div>
                             <button onClick={() => removeItem(idx)} className="text-rose-500 text-[10px] font-black uppercase shrink-0 hover:bg-rose-500/10 p-1.5 rounded">Remove</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                             <div className="flex items-center gap-2 bg-[#1e293b] rounded-lg px-2 py-1 border border-white/5">
                               <span className="text-[9px] text-slate-500 font-bold uppercase">Qty</span>
                               <input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value))} className="w-full bg-transparent text-xs font-bold text-white outline-none text-right" />
                             </div>
                             {isAdmin && (
                               <div className="flex items-center gap-2 bg-[#1e293b] rounded-lg px-2 py-1 border border-white/5">
                                 <span className="text-[9px] text-slate-500 font-bold uppercase">Cost Each</span>
                                 <input type="number" value={item.costPerUnit} onChange={e => updateItem(idx, 'costPerUnit', parseFloat(e.target.value))} className="w-full bg-transparent text-xs font-bold text-white outline-none text-right" placeholder="0.00" />
                               </div>
                             )}
                          </div>
                       </div>
                     ))
                   )}
                </div>
             </div>

             <div className="mt-6 pt-6 border-t border-white/5">
                <button onClick={handleSubmit} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-500 transition active:scale-95 shadow-lg shadow-emerald-900/20">
                  Confirm Transaction
                </button>
             </div>
          </div>

          {/* Right: Product Catalog */}
          <div className="w-full md:w-5/12 p-6 md:p-8 bg-[#020617] flex flex-col">
             <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                   <input 
                     placeholder="Search item..." 
                     className="w-full h-12 bg-[#1e293b] rounded-xl px-4 pl-10 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
                     value={productSearch}
                     onChange={e => setProductSearch(e.target.value)}
                   />
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                </div>
                <button onClick={() => setShowScanner(true)} className="w-12 h-12 rounded-xl bg-[#1e293b] text-white flex items-center justify-center hover:bg-emerald-600 transition">📸</button>
             </div>

             <div className="flex-1 overflow-y-auto content-start mb-4">
                <div className="grid grid-cols-1 gap-2">
                  {/* Create New / Custom Options when searching */}
                  {productSearch && (
                    <div className="grid grid-cols-2 gap-2 mb-4 animate-in fade-in">
                       <button onClick={() => onCreateNewItem(productSearch)} className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-left hover:bg-indigo-500/20 transition group">
                          <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">New Inventory Item</p>
                          <p className="text-xs font-bold text-white">Create "{productSearch}"</p>
                       </button>
                       <button onClick={handleAddExpenseItem} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-left hover:bg-amber-500/20 transition group">
                          <p className="text-[9px] font-black text-amber-400 uppercase mb-1">One-off Expense</p>
                          <p className="text-xs font-bold text-white">Log "{productSearch}"</p>
                       </button>
                    </div>
                  )}

                  {filteredInventory.map(item => (
                    <button 
                      key={item.id} 
                      onClick={() => handleAddInventoryItem(item)}
                      className="p-3 bg-[#1e293b] rounded-xl border border-white/5 flex items-center gap-3 hover:border-emerald-500/50 transition active:scale-[0.98] group text-left"
                    >
                       <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform">
                          {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover rounded-lg" /> : '📦'}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-xs font-black text-white uppercase truncate">{item.name}</p>
                         <div className="flex justify-between items-center mt-0.5">
                            <p className="text-[9px] text-slate-500">Stock: {item.stock}</p>
                            {isAdmin && <p className="text-[9px] font-bold text-emerald-500">Cost: ₱{item.originalPrice?.toFixed(2) || '?'}</p>}
                         </div>
                       </div>
                       <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white text-xs group-hover:bg-emerald-500 transition">+</div>
                    </button>
                  ))}
                  
                  {filteredInventory.length === 0 && !productSearch && (
                     <div className="text-center py-10 opacity-30">
                        <p className="text-xs font-bold">No items found</p>
                     </div>
                  )}
                </div>
             </div>
             
             <div className="p-4 bg-slate-900 rounded-2xl border border-white/5 text-center">
                <p className="text-[9px] text-slate-500 font-bold mb-2">QUICK ACTIONS</p>
                <div className="flex gap-2 justify-center">
                   <button onClick={() => onCreateNewItem('')} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-white uppercase transition border border-white/5">
                     + New Product
                   </button>
                   <button onClick={() => { setProductSearch('Transport'); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black text-white uppercase transition border border-white/5">
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