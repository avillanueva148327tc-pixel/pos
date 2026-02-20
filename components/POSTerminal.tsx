import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UtangRecord, UtangItem, InventoryItem, Customer, ReceiptTemplate, BranchConfig, QuickPickItem, ShiftRecord, AppSettings } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';
import ConfirmModal from './ConfirmModal';
import { SearchService } from '../services/searchService';
import ScanGoPanel from './ScanGoPanel';

interface POSTerminalProps {
  inventory: InventoryItem[];
  customers: Customer[];
  records: UtangRecord[];
  receiptTemplate: ReceiptTemplate;
  branch: BranchConfig;
  adminPinHash: string;
  quickPicks: QuickPickItem[];
  autoPrintReceipt: boolean;
  activeShift: ShiftRecord | null;
  settings: AppSettings;
  
  transactionItems: UtangItem[];
  customerName: string;
  isWalkIn: boolean;

  setTransactionItems: (items: UtangItem[]) => void;
  setCustomerName: (name: string) => void;
  setIsWalkIn: (isWalkIn: boolean) => void;
  setSettings: (settings: AppSettings) => void;
  
  onProcessTransaction: (record: any) => boolean;
  onUpdateRecord: (id: string, record: Partial<UtangRecord>) => void;
  onAddNewInventory: (details: string | Partial<InventoryItem>) => void;
  onRegisterCustomer: (details: { name?: string; barcode?: string }) => void;
  onUpdateQuickPicks: (picks: QuickPickItem[]) => void;
  onOpenShiftModal: () => void;
}

interface ParkedTransaction {
  id: string;
  customerName: string;
  items: UtangItem[];
  isWalkIn: boolean;
  time: string;
}

const POSTerminal: React.FC<POSTerminalProps> = ({ 
  inventory, customers, records, receiptTemplate, branch, adminPinHash, quickPicks, autoPrintReceipt, activeShift, settings,
  transactionItems, customerName, isWalkIn,
  setTransactionItems, setCustomerName, setIsWalkIn, setSettings,
  onProcessTransaction, onUpdateRecord, onAddNewInventory, onRegisterCustomer, onUpdateQuickPicks, onOpenShiftModal
}) => {
  const [productSearch, setProductSearch] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [productTab, setProductTab] = useState<'quick' | 'top' | 'catalog'>('quick');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [stockWarning, setStockWarning] = useState<{ name: string, stock: number, requested: number } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<any>(null);
  
  // Tendering State
  const [cashTendered, setCashTendered] = useState<string>('');
  const [showCheckoutUI, setShowCheckoutUI] = useState(false);

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [parkedTransactions, setParkedTransactions] = useState<ParkedTransaction[]>([]);
  const [showParkedList, setShowParkedList] = useState(false);
  const customerInputRef = useRef<HTMLDivElement>(null);

  const totalAmount = useMemo(() => transactionItems.reduce((sum, i) => sum + (i.quantity * i.price), 0), [transactionItems]);
  const changeAmount = useMemo(() => {
    const tendered = parseFloat(cashTendered) || 0;
    return Math.max(0, tendered - totalAmount);
  }, [cashTendered, totalAmount]);

  const activeCustomer = useMemo(() => {
    return customers.find(c => c.name === customerName);
  }, [customerName, customers]);

  const customerBalance = useMemo(() => {
    if (isWalkIn || !customerName) return 0;
    return records
      .filter(r => !r.isPaid && r.customerName.toLowerCase() === customerName.toLowerCase())
      .reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0);
  }, [customerName, records, isWalkIn]);

  const creditUtilization = activeCustomer?.creditLimit ? (customerBalance / activeCustomer.creditLimit) * 100 : 0;
  const isCreditCaution = creditUtilization > 80;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (customerInputRef.current && !customerInputRef.current.contains(event.target as Node)) {
            setShowCustomerSuggestions(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [customerInputRef]);

  const handleAddItem = (p: InventoryItem) => {
    const existingIndex = transactionItems.findIndex(i => i.productId === p.id);
    let newItems = [...transactionItems];
    if (existingIndex >= 0) {
      const nextQty = newItems[existingIndex].quantity + 1;
      if (nextQty > p.stock) setStockWarning({ name: p.name, stock: p.stock, requested: nextQty });
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: nextQty };
    } else {
      if (1 > p.stock) setStockWarning({ name: p.name, stock: p.stock, requested: 1 });
      newItems.push({ 
        productId: p.id, name: p.name, quantity: 1, price: p.price, unit: p.unit, date: new Date().toISOString(),
        cost: p.originalPrice
      });
    }
    setTransactionItems(newItems);
  };
  
  const updateQuantity = (index: number, delta: number) => {
    setTransactionItems(transactionItems.map((item, i) => {
      if (i === index) {
        const nextQty = Math.max(0, item.quantity + delta);
        return nextQty === 0 ? null : { ...item, quantity: nextQty };
      }
      return item;
    }).filter(Boolean) as UtangItem[]);
  };

  const handleParkTransaction = () => {
    if (transactionItems.length === 0) return;
    const parked: ParkedTransaction = {
      id: crypto.randomUUID(),
      customerName,
      items: [...transactionItems],
      isWalkIn,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setParkedTransactions([parked, ...parkedTransactions]);
    setTransactionItems([]);
    setCustomerName('Walk-in Customer');
    setIsWalkIn(true);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleFinalizeTransaction = (isPaid: boolean) => {
    const data = {
      customerName,
      product: transactionItems.map(i => i.name).join(', '),
      items: transactionItems,
      quantity: transactionItems.reduce((s, i) => s + i.quantity, 0),
      totalAmount,
      isPaid,
      paidAmount: isPaid ? totalAmount : 0,
      shouldPrint: autoPrintReceipt,
      cashTendered: isPaid ? parseFloat(cashTendered) : 0,
      change: isPaid ? changeAmount : 0
    };

    if (!isPaid && !isWalkIn) {
        const existingRecord = records.find(r => r.customerName === customerName && !r.isPaid);
        if (existingRecord) { setPendingTransaction(data); setShowMergeConfirm(true); return; }
    }

    if (onProcessTransaction(data)) {
       setShowCheckoutUI(false);
       setCashTendered('');
    }
  };

  const handleBarcodeScan = (code: string) : ScanResultStatus => {
    const codeClean = code.trim();
    if (codeClean.toUpperCase().startsWith('CID:')) {
      const id = codeClean.slice(4);
      const foundCustomer = customers.find(c => c.id === id || c.barcode === codeClean);
      if (foundCustomer) {
        setCustomerName(foundCustomer.name);
        setIsWalkIn(false);
        return ScanResultStatus.SUCCESS;
      }
      return ScanResultStatus.NOT_FOUND;
    }
    const foundItem = inventory.find(i => i.barcode === codeClean);
    if (foundItem) {
      handleAddItem(foundItem);
      return ScanResultStatus.SUCCESS;
    }
    return ScanResultStatus.NOT_FOUND;
  };

  const categories = useMemo(() => ['All', ...[...new Set(inventory.map(i => i.category || 'Others'))].sort()], [inventory]);
  const productsToShow = useMemo(() => {
    let list = inventory;
    if (productSearch) {
      list = inventory.filter(i => SearchService.fuzzyMatch(productSearch, i.name) || (i.barcode && i.barcode.toLowerCase().includes(productSearch.toLowerCase())));
    } else if (selectedCategory !== 'All') {
      list = inventory.filter(i => i.category === selectedCategory);
    }
    return list;
  }, [inventory, productSearch, selectedCategory]);

  return (
    <div className="flex flex-wrap lg:flex-nowrap gap-6 h-full items-stretch animate-in fade-in duration-500">
      
      {/* LEFT: SESSION HUB */}
      <div className="flex-[0_0_280px] max-w-full flex flex-col gap-6">
        <ScanGoPanel 
          onStartScan={() => setIsScanning(true)} 
          activeCustomer={customerName}
          isWalkIn={isWalkIn}
        />

        <div className={`bg-white dark:bg-[#1c1c1e] rounded-[2rem] border transition-all duration-300 p-5 shadow-sm ${isCreditCaution ? 'border-rose-500 shadow-lg shadow-rose-500/10' : 'border-slate-200 dark:border-white/10'}`}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member Link</h4>
              {parkedTransactions.length > 0 && (
                <button onClick={() => setShowParkedList(true)} className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg text-[9px] font-black uppercase border border-amber-500/20">
                   🅿️ {parkedTransactions.length}
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button onClick={() => { setIsWalkIn(true); setCustomerName('Walk-in Customer'); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${isWalkIn ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}>Walk-in</button>
                <button onClick={() => { setIsWalkIn(false); if(customerName==='Walk-in Customer') setCustomerName(''); }} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${!isWalkIn ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-500' : 'text-slate-400'}`}>Member</button>
              </div>

              {!isWalkIn && (
                <div className="relative" ref={customerInputRef}>
                  <input value={customerName} onChange={e => { setCustomerName(e.target.value); if(e.target.value) { setCustomerSuggestions(customers.filter(c => SearchService.fuzzyMatch(e.target.value, c.name)).slice(0, 5)); setShowCustomerSuggestions(true); } else setShowCustomerSuggestions(false); }} onFocus={() => customerName && setShowCustomerSuggestions(true)} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-white/10 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Find Member..." />
                  {showCustomerSuggestions && customerSuggestions.length > 0 && (
                    <div className="absolute z-[100] w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl mt-2 overflow-hidden border border-slate-200 dark:border-white/10">
                      {customerSuggestions.map(c => (
                        <button key={c.id} onMouseDown={() => { setCustomerName(c.name); setShowCustomerSuggestions(false); }} className="w-full text-left px-6 py-4 text-xs font-black uppercase hover:bg-indigo-500 hover:text-white transition-colors border-b border-slate-100 dark:border-white/5 last:border-0">{c.name}</button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* CENTER: CART LEDGER */}
      <div className="flex-[1_1_420px] max-w-full bg-[#020617] rounded-[2.5rem] border border-white/10 p-6 flex flex-col shadow-2xl relative overflow-hidden h-full">
        <div className="flex justify-between items-center mb-6 shrink-0 relative z-10">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white">Cart Ledger</h3>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1 truncate max-w-[200px]">{customerName}</p>
          </div>
          <div className="flex gap-2">
            {transactionItems.length > 0 && (
                <button onClick={handleParkTransaction} className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 transition-all flex items-center justify-center">🅿️</button>
            )}
            <button onClick={() => setShowCancelConfirm(true)} className="w-11 h-11 rounded-2xl bg-white/5 text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-white/10">✕</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2 py-2 relative z-10">
          {transactionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full opacity-20">
                <div className="w-20 h-20 rounded-[2.5rem] bg-slate-800 flex items-center justify-center text-4xl mb-4">🛒</div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty Ledger</p>
            </div>
          ) : (
            transactionItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-[#1e293b]/40 backdrop-blur-sm rounded-[1.5rem] border border-white/10 animate-in slide-in-from-right-2 shrink-0">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-xs uppercase truncate text-white">{item.name}</p>
                  <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase">₱{item.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center bg-[#020617] rounded-xl p-1 border border-white/10">
                  <button onClick={() => updateQuantity(idx, -1)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center">-</button>
                  <span className="w-8 text-center font-black text-xs text-white">{item.quantity}</span>
                  <button onClick={() => updateQuantity(idx, 1)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-indigo-500 hover:text-white transition-all flex items-center justify-center">+</button>
                </div>
                <p className="w-20 text-right font-black text-xs text-white">₱{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-6 shrink-0 relative z-10">
           <div className="flex justify-between items-end">
             <div>
               <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Due</p>
               <span className="text-4xl font-black tracking-tighter text-white tabular-nums">₱{totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
             </div>
             <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black text-indigo-400 border border-white/10 uppercase">{transactionItems.length} SKUs</span>
           </div>
           
           <div className="flex gap-3">
             <button disabled={transactionItems.length===0} onClick={() => setShowCheckoutUI(true)} className="flex-1 py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition active:scale-95 disabled:opacity-30">Open Terminal</button>
           </div>
        </div>
      </div>

      {/* RIGHT: EXPLORER */}
      <div className="flex-[1_1_450px] max-w-full flex flex-col gap-4 min-h-0">
        <div className="bg-white dark:bg-[#1c1c1e] rounded-[2rem] border border-slate-200 dark:border-white/10 p-4 shadow-sm shrink-0">
            <div className="flex gap-3">
                <input value={productSearch} onChange={e => {setProductSearch(e.target.value); setProductTab('catalog');}} className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/5 text-xs font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/30" placeholder="Find Product..." />
                <button onClick={() => setIsScanning(true)} className="w-12 h-12 bg-indigo-500 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg active:scale-95 transition-all">📸</button>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
               {categories.map(cat => (
                 <button key={cat} onClick={() => { setSelectedCategory(cat); setProductTab('catalog'); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap border ${selectedCategory === cat ? 'bg-indigo-500 text-white border-indigo-500 shadow-md' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-500'}`}>
                    {cat}
                 </button>
               ))}
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar align-content-start pb-20">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {productsToShow.map(item => (
                    <button key={item.id} onClick={() => handleAddItem(item)} className={`p-3 bg-white dark:bg-[#1c1c1e] rounded-2xl border flex flex-col items-center text-center transition active:scale-[0.95] group shadow-sm border-slate-200 dark:border-white/10 hover:border-indigo-500/50`}>
                        <div className="w-full aspect-square bg-slate-50 dark:bg-slate-900 rounded-xl mb-3 flex items-center justify-center text-2xl relative overflow-hidden">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover"/>:'📦'}
                        </div>
                        <p className="text-[10px] font-black uppercase leading-tight line-clamp-2 h-7 text-slate-800 dark:text-white mb-2">{item.name}</p>
                        <p className="text-[10px] font-black text-indigo-500">₱{item.price.toFixed(2)}</p>
                    </button>
                ))}
            </div>
        </div>
      </div>
      
      {/* CHECKOUT TENDER UI */}
      {showCheckoutUI && (
        <div className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
           <div className="w-full max-w-xl bg-[#0f172a] rounded-[3rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#1e293b]">
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Terminal Protocol</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Settle Transaction</p>
                 </div>
                 <button onClick={() => {setShowCheckoutUI(false); setCashTendered('');}} className="w-10 h-10 rounded-full bg-white/5 text-slate-400 hover:text-white flex items-center justify-center">✕</button>
              </div>

              <div className="p-8 flex-1 space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="p-6 bg-[#020617] rounded-[2rem] border border-white/5">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Grand Total</p>
                        <p className="text-3xl font-black text-white tabular-nums">₱{totalAmount.toFixed(2)}</p>
                    </div>
                    <div className="p-6 bg-[#020617] rounded-[2rem] border border-indigo-500/20">
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-2">Change Due</p>
                        <p className="text-3xl font-black text-indigo-400 tabular-nums">₱{changeAmount.toFixed(2)}</p>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Cash Tendered (Bayad)</label>
                    <div className="relative">
                       <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-600">₱</span>
                       <input 
                         autoFocus
                         type="number"
                         step="any"
                         value={cashTendered}
                         onChange={e => setCashTendered(e.target.value)}
                         className="w-full p-6 pl-14 bg-[#1e293b] border border-slate-700 rounded-[2rem] text-4xl font-black text-white outline-none focus:border-indigo-500 transition-all text-right pr-8"
                         placeholder="0.00"
                       />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                       {[20, 50, 100, 200, 500, 1000].map(val => (
                         <button key={val} onClick={() => setCashTendered(val.toString())} className="py-3 bg-[#020617] border border-white/5 text-slate-400 rounded-xl text-[10px] font-black hover:bg-indigo-500/10 hover:text-white transition uppercase">₱{val}</button>
                       ))}
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-[#1e293b] border-t border-white/5 flex gap-4">
                 {!isWalkIn && (
                   <button onClick={() => handleFinalizeTransaction(false)} className="flex-1 py-5 bg-white/5 border border-white/10 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 hover:text-white transition">Charge Utang</button>
                 )}
                 <button 
                   onClick={() => handleFinalizeTransaction(true)} 
                   disabled={!isWalkIn && (parseFloat(cashTendered) || 0) < totalAmount}
                   className="flex-[2] py-5 bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-indigo-600 transition shadow-indigo-500/20"
                 >
                   Confirm Cash Payment
                 </button>
              </div>
           </div>
        </div>
      )}

      {isScanning && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setIsScanning(false)} isContinuous={true} scanContext="ID OR PRODUCT" />}
      
      {showParkedList && (
        <div className="fixed inset-0 z-[600] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in">
            <div className="w-full max-w-md bg-[#0f172a] rounded-[2.5rem] border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
               <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="text-white font-black uppercase tracking-widest text-sm">Parked Queues</h3>
                  <button onClick={() => setShowParkedList(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
               </div>
               <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                  {parkedTransactions.map(pt => (
                    <div key={pt.id} onClick={() => { setTransactionItems(pt.items); setCustomerName(pt.customerName); setIsWalkIn(pt.isWalkIn); setParkedTransactions(p => p.filter(x => x.id !== pt.id)); setShowParkedList(false); }} className="p-4 bg-[#1e293b] rounded-2xl border border-white/5 cursor-pointer hover:border-indigo-500 transition-all">
                       <p className="text-xs font-black text-white uppercase mb-1">{pt.customerName}</p>
                       <div className="flex justify-between text-[10px] text-slate-500 uppercase">
                          <span>{pt.items.length} Items</span>
                          <span>{pt.time}</span>
                       </div>
                    </div>
                  ))}
               </div>
               <div className="p-6 border-t border-white/5">
                  <button onClick={() => setParkedTransactions([])} className="w-full py-3 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase">Clear All Queues</button>
               </div>
            </div>
        </div>
      )}

      {showCancelConfirm && (
        <ConfirmModal isOpen={true} title="Clear Ledger?" message="Empty all items currently in cart?" confirmLabel="Clear" onConfirm={() => { setTransactionItems([]); setCustomerName('Walk-in Customer'); setIsWalkIn(true); setShowCancelConfirm(false); }} onCancel={() => setShowCancelConfirm(false)} isDanger={true} />
      )}
      {showMergeConfirm && pendingTransaction && (
        <ConfirmModal isOpen={true} title="Ledger Conflict" message={`Member has an active debt. Merge items?`} confirmLabel="Merge" cancelLabel="New" onConfirm={() => { onProcessTransaction(pendingTransaction); setShowMergeConfirm(false); setPendingTransaction(null); setShowCheckoutUI(false); setCashTendered(''); }} onCancel={() => { onProcessTransaction({...pendingTransaction, forceNew: true}); setShowMergeConfirm(false); setPendingTransaction(null); setShowCheckoutUI(false); setCashTendered(''); }} isDanger={false} />
      )}
    </div>
  );
};

export default POSTerminal;