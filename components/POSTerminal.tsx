import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UtangRecord, UtangItem, InventoryItem, Customer, ReceiptTemplate, BranchConfig, QuickPickItem, ShiftRecord, AppSettings } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';
import ConfirmModal from './ConfirmModal';
import { SearchService } from '../services/searchService';
import ScanGoPanel from './ScanGoPanel';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Pause, 
  Plus, 
  Minus, 
  CreditCard, 
  UserPlus, 
  Camera,
  Zap,
  Flame,
  Grid,
  ChevronRight,
  Calendar,
  Award,
  Users
} from 'lucide-react';

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
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7); // Default 7 days
    return d.toISOString().split('T')[0];
  });

  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [parkedTransactions, setParkedTransactions] = useState<ParkedTransaction[]>([]);
  const [showParkedList, setShowParkedList] = useState(false);
  const customerInputRef = useRef<HTMLDivElement>(null);

  const topProducts = useMemo(() => {
    const counts: Record<string, number> = {};
    records.flatMap(r => r.items).forEach(i => {
      if (i.productId) counts[i.productId] = (counts[i.productId] || 0) + i.quantity;
    });
    return inventory
      .filter(i => counts[i.id])
      .sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0))
      .slice(0, 9);
  }, [records, inventory]);

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

  const handleAddItem = React.useCallback((p: InventoryItem) => {
    const existingIndex = transactionItems.findIndex(i => i.productId === p.id);
    let newItems = [...transactionItems];
    if (existingIndex >= 0) {
      const nextQty = newItems[existingIndex].quantity + 1;
      if (nextQty > p.stock) {
        setStockWarning({ name: p.name, stock: p.stock, requested: nextQty });
        setTimeout(() => setStockWarning(null), 3000);
      }
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: nextQty };
    } else {
      if (1 > p.stock) {
        setStockWarning({ name: p.name, stock: p.stock, requested: 1 });
        setTimeout(() => setStockWarning(null), 3000);
      }
      newItems.push({ 
        productId: p.id, name: p.name, quantity: 1, price: p.price, unit: p.unit, date: new Date().toISOString(),
        cost: p.originalPrice
      });
    }
    setTransactionItems(newItems);
  }, [transactionItems, setTransactionItems]);
  
  const updateQuantity = React.useCallback((index: number, delta: number) => {
    setTransactionItems(transactionItems.map((item, i) => {
      if (i === index) {
        const nextQty = Math.max(0, item.quantity + delta);
        return nextQty === 0 ? null : { ...item, quantity: nextQty };
      }
      return item;
    }).filter(Boolean) as UtangItem[]);
  }, [transactionItems, setTransactionItems]);

  const handleParkTransaction = React.useCallback(() => {
    if (transactionItems.length === 0) return;
    const parked: ParkedTransaction = {
      id: crypto.randomUUID(),
      customerName,
      items: [...transactionItems],
      isWalkIn,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setParkedTransactions(prev => [parked, ...prev]);
    setTransactionItems([]);
    setCustomerName('Walk-in Customer');
    setIsWalkIn(true);
    if ('vibrate' in navigator) navigator.vibrate(50);
  }, [transactionItems, customerName, isWalkIn, setTransactionItems, setCustomerName, setIsWalkIn]);

  const handleFinalizeTransaction = React.useCallback((isPaid: boolean) => {
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
      change: isPaid ? changeAmount : 0,
      dueDate: isPaid ? undefined : dueDate
    };

    if (!isPaid) {
      if (isWalkIn || !customerName || customerName === 'Walk-in Customer') {
        alert("Cannot charge debt to Walk-in customers. Please select a member.");
        return;
      }
      const existingRecord = records.find(r => r.customerName === customerName && !r.isPaid);
      if (existingRecord) { setPendingTransaction(data); setShowMergeConfirm(true); return; }
    }

    if (onProcessTransaction(data)) {
       setShowCheckoutUI(false);
       setCashTendered('');
    }
  }, [customerName, transactionItems, totalAmount, autoPrintReceipt, cashTendered, changeAmount, dueDate, isWalkIn, records, onProcessTransaction]);

  const handleBarcodeScan = React.useCallback((code: string) : ScanResultStatus => {
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
  }, [customers, inventory, handleAddItem, setCustomerName, setIsWalkIn]);

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
    <div className="flex flex-wrap lg:flex-nowrap gap-8 h-full items-stretch animate-in fade-in duration-700">
      
      {/* LEFT: SESSION HUB */}
      <div className="flex-[0_0_320px] max-w-full flex flex-col gap-8 animate-in slide-in-from-left-12 duration-1000">
        <ScanGoPanel 
          onStartScan={() => setIsScanning(true)} 
          activeCustomer={customerName}
          isWalkIn={isWalkIn}
        />

        <div className={`bg-[#0f172a]/60 backdrop-blur-2xl rounded-[3.5rem] border transition-all duration-700 p-10 shadow-2xl relative overflow-hidden group/session ${isCreditCaution ? 'border-rose-500/40 shadow-rose-500/10' : 'border-white/10'}`}>
            {/* Background Glow */}
            <div className={`absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] -mr-20 -mt-20 transition-colors duration-1000 ${isCreditCaution ? 'bg-rose-500/20' : 'bg-indigo-500/15'}`}></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] -ml-16 -mb-16"></div>

            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className={`w-2.5 h-2.5 rounded-full ${isCreditCaution ? 'bg-rose-500 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]'}`}></div>
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.5em]">Identity Hub</h4>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onRegisterCustomer({})} 
                  className="w-12 h-12 bg-white/5 text-indigo-400 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all border border-white/5 active:scale-90 shadow-lg"
                >
                  <UserPlus size={18} />
                </button>
                {parkedTransactions.length > 0 && (
                  <button 
                    onClick={() => setShowParkedList(true)} 
                    className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] font-black uppercase border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all shadow-lg"
                  >
                    <Pause size={12} fill="currentColor" /> {parkedTransactions.length}
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-8 relative z-10">
              <div className="flex p-2 bg-black/20 rounded-[2.5rem] border border-white/5 shadow-inner">
                <button 
                  onClick={() => { setIsWalkIn(true); setCustomerName('Walk-in Customer'); }} 
                  className={`flex-1 py-4 text-[11px] font-black uppercase rounded-[2rem] transition-all duration-500 ${isWalkIn ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Guest
                </button>
                <button 
                  onClick={() => { setIsWalkIn(false); if(customerName==='Walk-in Customer') setCustomerName(''); }} 
                  className={`flex-1 py-4 text-[11px] font-black uppercase rounded-[2rem] transition-all duration-500 ${!isWalkIn ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Member
                </button>
              </div>

              {!isWalkIn && (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700">
                  <div className="relative group/input" ref={customerInputRef}>
                    <input 
                      value={customerName} 
                      onChange={e => { setCustomerName(e.target.value); if(e.target.value) { setCustomerSuggestions(customers.filter(c => SearchService.fuzzyMatch(e.target.value, c.name)).slice(0, 5)); setShowCustomerSuggestions(true); } else setShowCustomerSuggestions(false); }} 
                      onFocus={() => customerName && setShowCustomerSuggestions(true)} 
                      className="w-full h-16 px-8 bg-black/20 rounded-[2rem] border border-white/10 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600 shadow-inner" 
                      placeholder="Search Registry..." 
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors">
                      <Search size={18} />
                    </div>
                    {showCustomerSuggestions && customerSuggestions.length > 0 && (
                      <div className="absolute z-[100] w-full bg-[#1e293b] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] mt-4 overflow-hidden border border-white/10 animate-in slide-in-from-top-4 duration-500">
                        {customerSuggestions.map(c => (
                          <button 
                            key={c.id} 
                            onMouseDown={() => { setCustomerName(c.name); setShowCustomerSuggestions(false); }} 
                            className="w-full text-left px-8 py-6 text-[11px] font-black uppercase text-white hover:bg-indigo-600 transition-all border-b border-white/5 last:border-0 flex justify-between items-center group/item"
                          >
                            <div className="flex flex-col gap-1">
                              <span>{c.name}</span>
                              <span className="text-[8px] opacity-40 tracking-widest">ID: {c.id.slice(0,8)}</span>
                            </div>
                            <span className="opacity-0 group-hover/item:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 text-indigo-300">LINK →</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {activeCustomer && (
                    <div className="p-8 bg-indigo-500/5 rounded-[3rem] border border-white/5 animate-in fade-in slide-in-from-top-6 relative overflow-hidden group/card shadow-2xl">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 group-hover/card:bg-indigo-500/20 transition-all duration-1000 blur-2xl"></div>
                       <div className="flex justify-between items-center mb-8">
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Status</span>
                         <div className={`px-4 py-2 rounded-full text-[9px] font-black uppercase flex items-center gap-2 shadow-2xl border border-white/10 ${
                           activeCustomer.trustLevel === 'gold' ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/30' : 
                           activeCustomer.trustLevel === 'silver' ? 'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-slate-400/30' : 
                           'bg-gradient-to-br from-orange-500 to-orange-700 text-white shadow-orange-600/30'
                         }`}>
                           <Award size={12} fill="currentColor" /> {activeCustomer.trustLevel || 'Bronze'}
                         </div>
                       </div>
                       <div className="flex justify-between items-end relative z-10">
                         <div className="space-y-2">
                           <div className="flex items-baseline gap-2">
                             <p className="text-5xl font-black text-indigo-400 tracking-tighter tabular-nums leading-none drop-shadow-2xl">{activeCustomer.loyaltyPoints || 0}</p>
                             <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Credits</span>
                           </div>
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Accumulated</p>
                         </div>
                         <div className="text-right space-y-2">
                           <p className="text-2xl font-black text-white tabular-nums leading-none tracking-tight">₱{customerBalance.toLocaleString()}</p>
                           <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Liability</p>
                         </div>
                       </div>
                       {isCreditCaution && (
                         <div className="mt-6 p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 flex items-center gap-3 animate-pulse">
                           <Flame size={14} className="text-rose-500" />
                           <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Credit Limit Warning</span>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              )}
            </div>
        </div>
      </div>

      {/* CENTER: CART LEDGER */}
      <div className="flex-[1_1_450px] max-w-full bg-[#0f172a]/40 backdrop-blur-3xl rounded-[4rem] border border-white/10 p-12 flex flex-col shadow-2xl relative overflow-hidden h-full group/ledger">
        {/* Background Glows */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] -ml-48 -mt-48 group-hover/ledger:bg-indigo-500/20 transition-colors duration-1000"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] -mr-48 -mb-48 group-hover/ledger:bg-emerald-500/10 transition-colors duration-1000"></div>

        {stockWarning && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-[100] px-10 py-5 bg-rose-600 text-white rounded-full font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl shadow-rose-600/40 animate-in slide-in-from-top-12 duration-500 flex items-center gap-4">
            <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
            STOCK ALERT: {stockWarning.name} ({stockWarning.stock} REMAINING)
          </div>
        )}
        
        <div className="flex justify-between items-end mb-12 shrink-0 relative z-10">
          <div className="flex items-end gap-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 group-hover/ledger:rotate-6 transition-transform duration-700">
              <ShoppingCart size={32} strokeWidth={2.5} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded text-[8px] font-black uppercase tracking-widest border border-indigo-500/20">Active Session</span>
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
              </div>
              <h3 className="text-5xl font-black uppercase tracking-tighter text-white leading-none">Cart Ledger</h3>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {customerName}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            {transactionItems.length > 0 && (
                <button 
                  onClick={handleParkTransaction} 
                  className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 border border-amber-500/20 transition-all flex items-center justify-center hover:bg-amber-500 hover:text-white shadow-lg shadow-amber-500/0 hover:shadow-amber-500/20 active:scale-90"
                  title="Park Transaction"
                >
                  <Pause size={24} />
                </button>
            )}
            <button 
              onClick={() => setShowCancelConfirm(true)} 
              className="w-16 h-16 rounded-3xl bg-white/5 text-slate-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center border border-white/5 hover:border-rose-600/50 active:scale-90"
              title="Clear Ledger"
            >
              <Trash2 size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-4 py-2 relative z-10">
          {transactionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-700 border-2 border-dashed border-white/5 rounded-[4rem] p-16 text-center space-y-8 group/empty">
                <div className="w-32 h-32 rounded-[4rem] bg-white/5 flex items-center justify-center text-6xl opacity-20 group-hover/empty:scale-110 transition-transform duration-700">🛒</div>
                <div className="space-y-3">
                  <p className="text-[12px] font-black uppercase tracking-[0.6em] text-slate-500">Empty Ledger</p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.3em] opacity-30 max-w-[200px] mx-auto leading-relaxed">System awaiting product input. Scan or select items to populate registry.</p>
                </div>
                <div className="flex gap-2">
                  {[1,2,3].map(i => <div key={i} className="w-1 h-1 rounded-full bg-white/10"></div>)}
                </div>
            </div>
          ) : (
            transactionItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-8 p-8 bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-white/5 hover:border-white/20 transition-all animate-in slide-in-from-right-8 duration-700 shrink-0 shadow-2xl group/item relative overflow-hidden">
                {/* Row Number - Editorial Touch */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[40px] font-black text-white/[0.02] pointer-events-none select-none italic">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>

                <div className="flex-1 min-w-0 relative z-10">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest px-1.5 py-0.5 bg-indigo-500/10 rounded border border-indigo-500/10">{item.unit || 'PC'}</span>
                    <p className="font-black text-base uppercase truncate text-white leading-none tracking-tight group-hover/item:translate-x-2 transition-transform duration-500">{item.name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest tabular-nums font-mono">₱{item.price.toFixed(2)}</p>
                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                    <p className="text-[9px] font-bold text-indigo-400/60 uppercase tracking-widest">Registry Entry</p>
                  </div>
                </div>

                <div className="flex items-center bg-[#020617] rounded-2xl p-2 border border-white/10 shadow-2xl relative z-10">
                  <button onClick={() => updateQuantity(idx, -1)} className="w-11 h-11 rounded-xl text-slate-500 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center active:scale-90 text-lg font-black">-</button>
                  <div className="w-14 flex flex-col items-center">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Qty</span>
                    <span className="font-black text-base text-white tabular-nums leading-none">{item.quantity}</span>
                  </div>
                  <button onClick={() => updateQuantity(idx, 1)} className="w-11 h-11 rounded-xl text-slate-500 hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center active:scale-90 text-lg font-black">+</button>
                </div>

                <div className="w-32 text-right relative z-10">
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Subtotal</p>
                  <p className="font-black text-2xl text-white tabular-nums leading-none tracking-tighter">₱{(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 pt-12 border-t border-white/10 flex flex-col gap-10 shrink-0 relative z-10">
           <div className="flex justify-between items-end">
             <div className="space-y-2">
               <div className="flex items-center gap-3">
                 <p className="text-[11px] font-black uppercase text-slate-500 tracking-[0.5em]">Total Due</p>
                 <div className="h-px w-12 bg-white/10"></div>
               </div>
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-black text-indigo-500/50 tabular-nums">₱</span>
                 <span className="text-7xl font-black tracking-tighter text-white tabular-nums leading-none">{totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>
               </div>
             </div>
             <div className="flex flex-col items-end gap-3">
               <div className="flex gap-1">
                 {[1,2,3,4].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= transactionItems.length ? 'bg-indigo-500' : 'bg-white/5'}`}></div>)}
               </div>
               <span className="px-6 py-2.5 bg-indigo-600/10 rounded-2xl text-[10px] font-black text-indigo-400 border border-indigo-600/20 uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/10">
                 {transactionItems.length} UNIQUE SKUs
               </span>
             </div>
           </div>
           
           <button 
             disabled={transactionItems.length===0} 
             onClick={() => setShowCheckoutUI(true)} 
             className="w-full h-28 bg-indigo-600 text-white rounded-[3rem] font-black uppercase text-[13px] tracking-[0.5em] shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-8 group/checkout relative overflow-hidden"
           >
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
             <span className="relative z-10 group-hover:tracking-[0.6em] transition-all duration-700">Open Terminal Protocol</span>
             <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center relative z-10 group-hover:rotate-45 transition-transform duration-500">
               <ChevronRight size={24} />
             </div>
           </button>
        </div>
      </div>

      {/* RIGHT: EXPLORER */}
      <div className="flex-[1_1_450px] max-w-full flex flex-col gap-8 min-h-0 animate-in slide-in-from-right-12 duration-1000">
        <div className="bg-[#0f172a]/60 backdrop-blur-2xl rounded-[3.5rem] border border-white/10 p-10 shadow-2xl shrink-0 relative overflow-hidden group/explorer">
            {/* Background Glow */}
            <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[80px] -ml-20 -mt-20 group-hover/explorer:bg-emerald-500/20 transition-all duration-1000"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-[60px] -mr-16 -mb-16"></div>

            <div className="flex gap-5 relative z-10">
                <div className="relative flex-1 group/search">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-indigo-500 transition-colors" size={20} />
                  <input 
                    value={productSearch} 
                    onChange={e => {setProductSearch(e.target.value); setProductTab('catalog');}} 
                    className="w-full h-16 pl-16 pr-8 bg-black/20 rounded-[2rem] border border-white/10 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600 shadow-inner" 
                    placeholder="Search Inventory..." 
                  />
                </div>
                <button 
                  onClick={() => onAddNewInventory('')} 
                  className="w-16 h-16 bg-emerald-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-emerald-600/40 hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all border border-emerald-500/20" 
                  title="Add New Product"
                >
                  <Plus size={28} />
                </button>
                <button 
                  onClick={() => setIsScanning(true)} 
                  className="w-16 h-16 bg-indigo-600 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all border border-indigo-500/20"
                >
                  <Camera size={28} />
                </button>
            </div>
            
            <div className="mt-10 flex p-2 bg-black/20 rounded-[2.5rem] border border-white/5 relative z-10 shadow-inner">
               <button 
                 onClick={() => setProductTab('quick')} 
                 className={`flex-1 py-4 text-[11px] font-black uppercase rounded-[2rem] transition-all duration-500 flex items-center justify-center gap-3 ${productTab === 'quick' ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40 text-white' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <Zap size={16} fill={productTab === 'quick' ? 'currentColor' : 'none'} /> Quick
               </button>
               <button 
                 onClick={() => setProductTab('top')} 
                 className={`flex-1 py-4 text-[11px] font-black uppercase rounded-[2rem] transition-all duration-500 flex items-center justify-center gap-3 ${productTab === 'top' ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40 text-white' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <Flame size={16} fill={productTab === 'top' ? 'currentColor' : 'none'} /> Top
               </button>
               <button 
                 onClick={() => setProductTab('catalog')} 
                 className={`flex-1 py-4 text-[11px] font-black uppercase rounded-[2rem] transition-all duration-500 flex items-center justify-center gap-3 ${productTab === 'catalog' ? 'bg-indigo-600 shadow-2xl shadow-indigo-600/40 text-white' : 'text-slate-500 hover:text-slate-300'}`}
               >
                 <Grid size={16} fill={productTab === 'catalog' ? 'currentColor' : 'none'} /> Catalog
               </button>
            </div>

            {productTab === 'catalog' && (
              <div className="mt-8 flex gap-4 overflow-x-auto no-scrollbar pb-2 relative z-10">
                 {categories.map(cat => (
                   <button 
                     key={cat} 
                     onClick={() => setSelectedCategory(cat)} 
                     className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap border transition-all duration-500 ${selectedCategory === cat ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xl shadow-indigo-500/40' : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300 hover:bg-white/10'}`}
                   >
                      {cat}
                   </button>
                 ))}
              </div>
            )}
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar align-content-start pb-24 pr-4">
            {productTab === 'quick' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {quickPicks.map((qp, idx) => {
                  const item = inventory.find(i => i.name === qp.name);
                  return (
                    <button 
                      key={idx} 
                      onClick={() => item && handleAddItem(item)} 
                      className="p-8 bg-[#0f172a]/60 backdrop-blur-xl rounded-[3rem] border border-white/5 flex flex-col items-center text-center transition-all duration-500 active:scale-95 hover:border-indigo-500/50 hover:bg-indigo-500/10 shadow-2xl group/pick relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8 blur-xl"></div>
                      <div className="w-16 h-16 bg-indigo-600/10 rounded-[1.5rem] flex items-center justify-center text-3xl mb-6 group-hover/pick:scale-110 group-hover/pick:rotate-6 transition-all duration-700 shadow-inner">⚡</div>
                      <p className="text-[11px] font-black uppercase leading-tight line-clamp-2 h-10 mb-3 text-white tracking-tight group-hover/pick:text-indigo-300 transition-colors">{qp.name}</p>
                      <p className="text-sm font-black text-indigo-400 tabular-nums">₱{qp.price.toFixed(2)}</p>
                    </button>
                  );
                })}
                {quickPicks.length === 0 && (
                  <div className="col-span-full py-24 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center gap-6">
                    <Zap size={48} className="text-slate-500" />
                    <p className="text-[12px] font-black uppercase tracking-[0.5em]">No Quick Picks Configured</p>
                  </div>
                )}
              </div>
            )}

            {productTab === 'top' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {topProducts.map(item => (
                  <button 
                    key={item.id} 
                    onClick={() => handleAddItem(item)} 
                    className="p-6 bg-[#0f172a]/60 backdrop-blur-xl rounded-[3rem] border border-white/5 flex flex-col items-center text-center transition-all duration-500 active:scale-95 hover:border-indigo-500/50 hover:bg-indigo-500/10 shadow-2xl group/top relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full -mr-8 -mt-8 blur-xl"></div>
                    <div className="w-full aspect-square bg-black/40 rounded-[2.5rem] mb-6 flex items-center justify-center text-4xl relative overflow-hidden border border-white/5 group-hover/top:scale-[1.05] transition-all duration-700 shadow-inner">
                      {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>:'🔥'}
                    </div>
                    <p className="text-[11px] font-black uppercase leading-tight line-clamp-2 h-10 mb-3 text-white tracking-tight group-hover/top:text-rose-300 transition-colors">{item.name}</p>
                    <p className="text-sm font-black text-indigo-400 tabular-nums">₱{item.price.toFixed(2)}</p>
                  </button>
                ))}
                {topProducts.length === 0 && (
                  <div className="col-span-full py-24 text-center opacity-20 border-2 border-dashed border-white/5 rounded-[4rem] flex flex-col items-center gap-6">
                    <Flame size={48} className="text-slate-500" />
                    <p className="text-[12px] font-black uppercase tracking-[0.5em]">No Transaction History</p>
                  </div>
                )}
              </div>
            )}

            {productTab === 'catalog' && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {productsToShow.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => handleAddItem(item)} 
                        className="p-6 bg-[#0f172a]/60 backdrop-blur-xl rounded-[3rem] border border-white/5 flex flex-col items-center text-center transition-all duration-500 active:scale-[0.95] group/cat shadow-2xl hover:border-indigo-500/50 hover:bg-indigo-500/10 relative overflow-hidden"
                      >
                          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8 blur-xl"></div>
                          <div className="w-full aspect-square bg-black/40 rounded-[2.5rem] mb-6 flex items-center justify-center text-4xl relative overflow-hidden border border-white/5 group-hover/cat:scale-[1.05] transition-all duration-700 shadow-inner">
                            {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>:'📦'}
                          </div>
                          <p className="text-[11px] font-black uppercase leading-tight line-clamp-2 h-10 text-white mb-3 tracking-tight group-hover/cat:text-indigo-300 transition-colors">{item.name}</p>
                          <p className="text-sm font-black text-indigo-400 tabular-nums">₱{item.price.toFixed(2)}</p>
                      </button>
                  ))}
              </div>
            )}
        </div>
      </div>
      
      {/* CHECKOUT TENDER UI */}
      {showCheckoutUI && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-[40px] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-700">
           <div className="w-full max-w-3xl bg-[#0f172a] rounded-[4.5rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden relative group/checkout-modal">
              {/* Background Glows */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] -mr-48 -mt-48"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[100px] -ml-40 -mb-40"></div>

              <div className="p-12 border-b border-white/5 flex justify-between items-start bg-black/20 backdrop-blur-md relative z-10">
                 <div className="space-y-2">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.6em]">Terminal Protocol v3.5</p>
                    </div>
                    <h3 className="text-6xl font-black text-white tracking-tighter leading-none uppercase">Settle Account</h3>
                    <div className="flex items-center gap-4 mt-6">
                      <div className="h-px w-10 bg-indigo-500/40"></div>
                      <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em]">
                        Transaction Finalization Sequence
                      </p>
                    </div>
                 </div>
                 <button 
                  onClick={() => {setShowCheckoutUI(false); setCashTendered('');}} 
                  className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition-all duration-500 border border-white/5 hover:border-rose-600/50 group/close shadow-2xl"
                >
                  <Trash2 size={24} className="group-hover/close:scale-110 transition-transform" />
                </button>
              </div>

              <div className="p-12 flex-1 space-y-12 relative z-10 overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-2 gap-10">
                    <div className="p-10 bg-black/40 rounded-[3.5rem] border border-white/5 relative overflow-hidden group/total shadow-inner">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] mb-4">Total Liability</p>
                        <p className="text-6xl font-black text-white tabular-nums tracking-tighter drop-shadow-2xl">₱{totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                    </div>
                    <div className="p-10 bg-indigo-600/5 rounded-[3.5rem] border border-indigo-500/20 relative overflow-hidden group/change shadow-inner">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/15 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <p className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-4">Change Return</p>
                        <p className="text-6xl font-black text-indigo-400 tabular-nums tracking-tighter drop-shadow-2xl">₱{changeAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</p>
                    </div>
                 </div>

                 <div className="space-y-8">
                    <div className="flex justify-between items-center px-6">
                      <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">Tendered Amount (Bayad)</label>
                      <span className="text-[10px] font-black text-indigo-500/60 uppercase tracking-widest">Input Registry</span>
                    </div>
                    <div className="relative group/input">
                       <span className="absolute left-10 top-1/2 -translate-y-1/2 text-5xl font-black text-slate-700 group-focus-within/input:text-indigo-500 transition-colors pointer-events-none">₱</span>
                       <input 
                         autoFocus
                         type="number"
                         step="any"
                         value={cashTendered}
                         onChange={e => setCashTendered(e.target.value)}
                         className="w-full h-32 pl-24 pr-12 bg-black/40 border border-white/10 rounded-[3.5rem] text-7xl font-black text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-right tabular-nums placeholder:text-white/5 shadow-inner"
                         placeholder="0.00"
                       />
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                       {[20, 50, 100, 200, 500, 1000].map(val => (
                         <button 
                          key={val} 
                          onClick={() => setCashTendered(val.toString())} 
                          className="py-5 bg-black/40 border border-white/5 text-slate-400 rounded-[1.5rem] text-[12px] font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-500 transition-all uppercase tracking-[0.2em] active:scale-95 shadow-lg"
                         >
                           ₱{val}
                         </button>
                       ))}
                    </div>
                 </div>

                 {!isWalkIn && (
                   <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
                      <label className="block text-[12px] font-black text-slate-400 uppercase tracking-[0.4em] px-6">Repayment Deadline (Optional)</label>
                      <div className="relative group/input">
                        <Calendar className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within/input:text-indigo-500 transition-colors" size={28} />
                        <input 
                          type="date"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="w-full h-24 pl-24 pr-10 bg-black/40 border border-white/10 rounded-[3rem] text-2xl font-black text-white outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-inner"
                        />
                      </div>
                   </div>
                 )}
              </div>

              <div className="p-12 bg-black/40 backdrop-blur-2xl border-t border-white/5 flex gap-8 relative z-10">
                 {!isWalkIn && (
                   <button 
                    onClick={() => handleFinalizeTransaction(false)} 
                    className="flex-1 h-24 bg-white/5 border border-white/10 text-slate-400 rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.4em] hover:bg-rose-600/10 hover:text-rose-500 hover:border-rose-500/30 transition-all shadow-xl"
                   >
                     Charge Debt
                   </button>
                 )}
                 <button 
                   onClick={() => handleFinalizeTransaction(true)} 
                   disabled={(parseFloat(cashTendered) || 0) < totalAmount}
                   className="flex-[2] h-24 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-[13px] tracking-[0.5em] shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:bg-indigo-500 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-6 group/confirm relative overflow-hidden"
                 >
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                   <span className="relative z-10 group-hover:tracking-[0.6em] transition-all duration-700">Authorize Payment</span>
                   <ChevronRight size={28} className="relative z-10 group-hover:translate-x-2 transition-transform duration-500" />
                 </button>
              </div>
           </div>
        </div>
      )}

      {isScanning && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setIsScanning(false)} isContinuous={true} scanContext="ID OR PRODUCT" />}
      
      {showParkedList && (
        <div className="fixed inset-0 z-[600] bg-black/90 backdrop-blur-[40px] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-700">
            <div className="w-full max-w-xl bg-[#0f172a] rounded-[4rem] border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col max-h-[85vh] overflow-hidden relative group/parked-modal">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

               <div className="p-10 border-b border-white/5 flex justify-between items-center bg-black/20 backdrop-blur-md relative z-10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Queue Registry</p>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter leading-none uppercase">Parked Sessions</h3>
                  </div>
                  <button 
                    onClick={() => setShowParkedList(false)} 
                    className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-600 hover:text-white transition-all duration-300 border border-white/5"
                  >
                    ✕
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar relative z-10">
                  {parkedTransactions.length === 0 ? (
                    <div className="py-20 text-center opacity-20 flex flex-col items-center gap-4">
                      <Pause size={48} className="text-slate-500" />
                      <p className="text-[11px] font-black uppercase tracking-[0.4em]">No Active Queues</p>
                    </div>
                  ) : (
                    parkedTransactions.map(pt => (
                      <button 
                        key={pt.id} 
                        onClick={() => { setTransactionItems(pt.items); setCustomerName(pt.customerName); setIsWalkIn(pt.isWalkIn); setParkedTransactions(p => p.filter(x => x.id !== pt.id)); setShowParkedList(false); }} 
                        className="w-full p-8 bg-black/40 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all text-left group/parked-item relative overflow-hidden shadow-xl"
                      >
                         <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full -mr-8 -mt-8 blur-xl"></div>
                         <div className="flex justify-between items-start mb-4">
                           <p className="text-base font-black text-white uppercase tracking-tight group-hover/parked-item:text-indigo-400 transition-colors">{pt.customerName}</p>
                           <span className="text-[10px] font-black text-slate-600 tabular-nums">{pt.time}</span>
                         </div>
                         <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500">
                            <span className="flex items-center gap-2">
                              <ShoppingCart size={12} />
                              {pt.items.length} Items Registry
                            </span>
                            <span className="text-indigo-500 opacity-0 group-hover/parked-item:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">RESUME SESSION →</span>
                         </div>
                      </button>
                    ))
                  )}
               </div>

               <div className="p-10 border-t border-white/5 bg-black/20 backdrop-blur-md relative z-10">
                  <button 
                    onClick={() => setParkedTransactions([])} 
                    className="w-full py-5 bg-rose-500/10 text-rose-500 rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all shadow-xl"
                  >
                    Purge All Queues
                  </button>
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