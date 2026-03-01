
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UtangRecord, UtangItem, InventoryItem, Customer } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';
import ConfirmModal from './ConfirmModal';
import { SearchService } from '../services/searchService';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: InventoryItem[];
  customers: Customer[];
  records: UtangRecord[];
  onProcessTransaction: (record: any) => boolean;
  onRegisterCustomer: (details: { name?: string; barcode?: string }) => void;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose, inventory, customers, records, onProcessTransaction, onRegisterCustomer }) => {
  const [items, setItems] = useState<UtangItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [scannerMode, setScannerMode] = useState<'product' | 'customer' | null>(null);
  const [showMergeConfirm, setShowMergeConfirm] = useState(false);
  const [showMemberRequired, setShowMemberRequired] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [transactionToConfirm, setTransactionToConfirm] = useState<any>(null);
  const [customerSuggestions, setCustomerSuggestions] = useState<Customer[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const customerInputRef = useRef<HTMLDivElement>(null);
  
  const totalAmount = useMemo(() => items.reduce((sum, i) => sum + (i.quantity * i.price), 0), [items]);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setCustomerName('');
      setProductSearch('');
      setScannerMode(null);
      setShowMergeConfirm(false);
      setTransactionToConfirm(null);
      setShowDiscardConfirm(false);
    }
  }, [isOpen]);
  
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
    const existingIndex = items.findIndex(i => i.productId === p.id);
    if (existingIndex >= 0) {
      setItems(items.map((item, i) => i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setItems([...items, { productId: p.id, name: p.name, quantity: 1, price: p.price, unit: p.unit, date: new Date().toISOString() }]);
    }
    setProductSearch('');
  };

  const updateQuantity = (index: number, delta: number) => {
    setItems(items.map((item, i) => i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item).filter(item => item.quantity > 0));
  };
  
  const handleBarcodeScan = (code: string): ScanResultStatus => {
    if (scannerMode === 'customer') {
      const codeId = code.replace('CID:', '');
      const foundCustomer = customers.find(c => c.id === codeId || c.barcode === code);
      if (foundCustomer) {
        setCustomerName(foundCustomer.name);
        setScannerMode('product');
        return ScanResultStatus.SUCCESS;
      } else {
        if (window.confirm(`Suki ID "${codeId}" not found. Register new Suki?`)) {
          onRegisterCustomer({ barcode: codeId });
          onClose();
        }
        return ScanResultStatus.NOT_FOUND;
      }
    } else {
      const foundItem = inventory.find(i => i.barcode === code);
      if (foundItem) {
        handleAddItem(foundItem);
        return ScanResultStatus.SUCCESS;
      }
      return ScanResultStatus.NOT_FOUND;
    }
  };

  const handleCloseAttempt = () => {
    if (items.length > 0) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSaveDebt = () => {
    const trimmedCustomerName = customerName.trim();
    if (items.length === 0 || !trimmedCustomerName) return;

    const isRegisteredCustomer = customers.some(c => c.name.toLowerCase() === trimmedCustomerName.toLowerCase());
    if (!isRegisteredCustomer) {
      setShowMemberRequired(true);
      return;
    }

    const data = {
      customerName: trimmedCustomerName,
      product: items.map(i => i.name).join(', '),
      items,
      quantity: items.reduce((s, i) => s + i.quantity, 0),
      totalAmount,
      isPaid: false,
      paidAmount: 0,
    };

    const existingRecord = records.find(r => r.customerName === trimmedCustomerName && !r.isPaid);
    if (existingRecord) {
      setTransactionToConfirm(data);
      setShowMergeConfirm(true);
      return;
    }

    if (onProcessTransaction(data)) {
      onClose();
    }
  };
  
  const confirmMerge = () => {
    if (transactionToConfirm && onProcessTransaction(transactionToConfirm)) onClose();
    setShowMergeConfirm(false);
    setTransactionToConfirm(null);
  };

  const denyMerge = () => {
    if (transactionToConfirm && onProcessTransaction({ ...transactionToConfirm, forceNew: true })) onClose();
    setShowMergeConfirm(false);
    setTransactionToConfirm(null);
  };

  const handleCustomerSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setCustomerName(query);
    if (query) {
        const filtered = customers.filter(c => SearchService.fuzzyMatch(query, c.name)).slice(0, 5);
        setCustomerSuggestions(filtered);
        setShowCustomerSuggestions(true);
    } else {
        setCustomerSuggestions([]);
        setShowCustomerSuggestions(false);
    }
  };
  
  const handleSelectCustomer = (customer: Customer) => {
      setCustomerName(customer.name);
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
  };

  const filteredInventory = useMemo(() => {
    if (!productSearch) return [];
    return inventory.filter(i => SearchService.fuzzyMatch(productSearch, i.name)).slice(0, 5);
  }, [productSearch, inventory]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[150] p-4 animate-in fade-in duration-500">
        <div className="bg-[#0f172a] w-full max-w-4xl h-[85vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 relative group">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-[120px] group-hover:bg-indigo-500/15 transition-colors duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/5 rounded-full -ml-32 -mb-32 blur-[100px]"></div>

          <div className="p-8 border-b border-white/5 flex justify-between items-start bg-[#0f172a]/50 backdrop-blur-md relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Credit Ledger System</p>
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter leading-none">Debt Statement</h3>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
                <span className="opacity-50">●</span>
                NEW ACCOUNT ENTRY
              </p>
            </div>
            <button 
              onClick={handleCloseAttempt} 
              className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-white/5 hover:border-rose-500/50 group/close"
            >
              <span className="text-xl group-hover/close:rotate-90 transition-transform duration-300">✕</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row relative z-10">
            {/* Left: Search & Selection */}
            <div className="w-full md:w-1/2 p-8 space-y-8 overflow-y-auto custom-scrollbar border-r border-white/5 bg-white/[0.02]">
              {/* Customer */}
              <div className="relative" ref={customerInputRef}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 px-1">Target Account *</label>
                <div className="flex gap-3">
                  <div className="relative flex-1 group/input">
                    <input 
                      value={customerName} 
                      onChange={handleCustomerSearchChange} 
                      onFocus={() => customerName && setShowCustomerSuggestions(true)} 
                      className="w-full h-16 px-6 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600" 
                      placeholder="Search Suki Member..." 
                      autoComplete="off" 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors">🔍</div>
                  </div>
                  <button 
                    onClick={() => setScannerMode('customer')} 
                    className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-xl border border-white/10 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all active:scale-90 shadow-lg shadow-indigo-500/0 hover:shadow-indigo-500/20"
                  >
                    🪪
                  </button>
                </div>
                {showCustomerSuggestions && customerSuggestions.length > 0 && (
                  <div className="absolute z-[160] w-full bg-[#1e293b] rounded-2xl shadow-2xl mt-3 overflow-hidden border border-white/10 animate-in slide-in-from-top-2 duration-300">
                    {customerSuggestions.map(c => (
                      <button 
                        key={c.id} 
                        onMouseDown={() => handleSelectCustomer(c)} 
                        className="w-full text-left px-6 py-5 text-xs font-bold text-white hover:bg-indigo-500 transition-all border-b border-white/5 last:border-0 flex items-center justify-between group/item"
                      >
                        <span>{c.name}</span>
                        <span className="text-[10px] opacity-0 group-hover/item:opacity-100 transition-opacity">SELECT →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Post Items *</label>
                   {items.length > 0 && (
                      <button 
                        onClick={() => setShowDiscardConfirm(true)} 
                        className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-white transition-colors"
                      >
                        Clear Statement
                      </button>
                   )}
                </div>
                <div className="flex gap-3">
                  <div className="relative flex-1 group/input">
                    <input 
                      value={productSearch} 
                      onChange={e => setProductSearch(e.target.value)} 
                      className="w-full h-16 px-6 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600" 
                      placeholder="Search Inventory Catalog..." 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors">📦</div>
                  </div>
                  <button 
                    onClick={() => setScannerMode('product')} 
                    className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-xl border border-white/10 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all active:scale-90 shadow-lg shadow-indigo-500/0 hover:shadow-indigo-500/20"
                  >
                    📸
                  </button>
                </div>
                {filteredInventory.length > 0 && (
                  <div className="space-y-2 animate-in fade-in duration-300">
                    {filteredInventory.map(item => (
                      <button 
                        key={item.id} 
                        onClick={() => handleAddItem(item)} 
                        className="w-full text-left p-5 bg-white/5 hover:bg-indigo-500/10 rounded-2xl text-xs font-bold text-white border border-white/5 hover:border-indigo-500/30 transition-all flex justify-between items-center group/prod"
                      >
                        <span className="uppercase truncate pr-4 group-hover:translate-x-1 transition-transform">{item.name}</span>
                        <span className="text-indigo-400 shrink-0 font-black">₱{item.price.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Statement Summary */}
            <div className="w-full md:w-1/2 p-8 flex flex-col bg-[#0f172a]/30">
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Statement Summary</h4>
                  <span className="text-[10px] font-black text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">{items.length} SKUs</span>
                </div>

                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-white/5 rounded-[3rem] p-12 text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center text-4xl opacity-20">📊</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">No items logged</p>
                        <p className="text-[8px] font-bold uppercase tracking-widest mt-2 opacity-50">Search or scan to begin entry</p>
                      </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <div key={idx} className="group/cart flex items-center gap-5 p-5 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all animate-in slide-in-from-right-4 duration-300">
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-xs uppercase truncate text-white leading-none mb-2">{item.name}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Unit: ₱{item.price.toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-[#0f172a] rounded-2xl p-1.5 border border-white/10 shadow-inner">
                          <button 
                            onClick={() => updateQuantity(idx, -1)} 
                            className="w-10 h-10 rounded-xl text-slate-400 hover:bg-rose-500 hover:text-white transition-all text-lg flex items-center justify-center active:scale-90"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-black text-xs tabular-nums text-white">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(idx, 1)} 
                            className="w-10 h-10 rounded-xl text-slate-400 hover:bg-indigo-500 hover:text-white transition-all text-lg flex items-center justify-center active:scale-90"
                          >
                            +
                          </button>
                        </div>
                        <div className="w-24 text-right">
                          <p className="font-black text-sm tabular-nums text-white">₱{(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-8 mt-8 border-t border-white/5 space-y-8">
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                     <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] block">Account Total</span>
                     <span className="text-5xl font-black tracking-tighter text-white tabular-nums leading-none">
                       ₱{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                     </span>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20 shadow-lg shadow-rose-500/10">Pending Balance</p>
                  </div>
                </div>
                <button 
                  onClick={handleSaveDebt} 
                  disabled={items.length === 0 || !customerName} 
                  className="w-full h-20 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-4 group/submit"
                >
                  <span className="group-hover/submit:translate-x-1 transition-transform">Process Account Debt</span>
                  <span className="text-xl">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {scannerMode && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setScannerMode(null)} />}
      
      <ConfirmModal isOpen={showMergeConfirm} title="Existing Ledger Found" message={`'${customerName}' has an active debt. Merge these items into their current unpaid balance?`} confirmLabel="Merge Items" cancelLabel="New Separate Entry" onConfirm={confirmMerge} onCancel={denyMerge} isDanger={false} />
      <ConfirmModal isOpen={showDiscardConfirm} title="Discard Changes?" message="You have items in your statement. Closing or clearing now will lose this data. Continue?" confirmLabel="Yes, Discard" onConfirm={() => { setShowDiscardConfirm(false); setItems([]); if(items.length > 0) onClose(); }} cancelLabel="Stay & Review" onCancel={() => setShowDiscardConfirm(false)} isDanger={true} />
      <ConfirmModal isOpen={showMemberRequired} title="Member Required" message="Debt can only be posted to a registered Suki. Please select an existing member or register this customer now." confirmLabel="Search Again" onConfirm={() => setShowMemberRequired(false)} cancelLabel="Register Now" onCancel={() => { setShowMemberRequired(false); onRegisterCustomer({ name: customerName.trim() }); onClose(); }} isDanger={false} />
    </>
  );
};

export default AddDebtModal;
