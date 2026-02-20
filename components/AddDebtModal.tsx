
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
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[150] p-4 animate-in fade-in">
        <div className="bg-[#0f172a] w-full max-w-3xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 relative">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f172a] shrink-0">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">Debt Statement</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">NEW ACCOUNT ENTRY</p>
            </div>
            <button onClick={handleCloseAttempt} className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-all border border-white/5 active:scale-90">✕</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            {/* Customer */}
            <div className="relative" ref={customerInputRef}>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Target Account *</label>
              <div className="flex gap-2">
                <input value={customerName} onChange={handleCustomerSearchChange} onFocus={() => customerName && setShowCustomerSuggestions(true)} className="w-full h-14 px-5 bg-[#1e293b] rounded-2xl border border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition-all text-white placeholder:text-slate-600" placeholder="Search Suki Member..." autoComplete="off" />
                <button onClick={() => setScannerMode('customer')} className="flex-[0_0_56px] h-14 bg-[#1e293b] rounded-2xl flex items-center justify-center text-xl border border-slate-700 text-indigo-400 active:scale-95 transition-all">🪪</button>
              </div>
              {showCustomerSuggestions && customerSuggestions.length > 0 && (
                <div className="absolute z-[160] w-full bg-[#1e293b] rounded-2xl shadow-2xl mt-2 overflow-hidden border border-white/10">
                  {customerSuggestions.map(c => (
                    <button key={c.id} onMouseDown={() => handleSelectCustomer(c)} className="w-full text-left px-5 py-4 text-xs font-bold text-white hover:bg-indigo-500 transition-colors border-b border-white/5 last:border-0">{c.name}</button>
                  ))}
                </div>
              )}
            </div>

            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-3 px-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post Items *</label>
                 {items.length > 0 && (
                    <button onClick={() => setShowDiscardConfirm(true)} className="px-3 py-1 bg-rose-500/10 text-rose-500 rounded-lg text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Clear Statement</button>
                 )}
              </div>
              <div className="flex gap-2">
                <input value={productSearch} onChange={e => setProductSearch(e.target.value)} className="w-full h-14 px-5 bg-[#1e293b] rounded-2xl border border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-[#6366f1]/50 text-white placeholder:text-slate-600" placeholder="Search Inventory Catalog..." />
                <button onClick={() => setScannerMode('product')} className="flex-[0_0_56px] h-14 bg-[#1e293b] rounded-2xl flex items-center justify-center text-xl border border-slate-700 text-indigo-400 active:scale-95 transition-all">📸</button>
              </div>
              {filteredInventory.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {filteredInventory.map(item => (
                    <button key={item.id} onClick={() => handleAddItem(item)} className="w-full text-left p-4 bg-[#1e293b] hover:bg-slate-700 rounded-2xl text-xs font-bold text-white border border-white/5 transition-all flex justify-between items-center">
                      <span className="uppercase truncate pr-4">{item.name}</span>
                      <span className="text-indigo-400 shrink-0">₱{item.price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Statement Summary ({items.length} SKUs)</h4>
              {items.length === 0 ? (
                <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-[2.5rem] flex flex-col items-center gap-3">
                    <span className="text-4xl opacity-20">📊</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">No items logged</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-[#1e293b]/50 rounded-[1.5rem] border border-white/5 animate-in slide-in-from-right-1">
                      <div className="flex-[1_1_0%] min-w-0">
                        <p className="font-black text-xs uppercase truncate text-white leading-none">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase mt-2">Unit: ₱{item.price.toFixed(2)}</p>
                      </div>
                      <div className="flex-[0_0_auto] flex items-center gap-2 bg-[#0f172a] rounded-xl p-1 border border-white/10">
                        <button onClick={() => updateQuantity(idx, -1)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-rose-500 hover:text-white transition-all text-sm flex items-center justify-center">-</button>
                        <span className="w-7 text-center font-black text-[10px] tabular-nums text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(idx, 1)} className="w-8 h-8 rounded-lg text-slate-400 hover:bg-indigo-500 hover:text-white transition-all text-sm flex items-center justify-center">+</button>
                      </div>
                      <p className="flex-[0_0_80px] font-black text-xs text-right tabular-nums text-white">₱{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="p-8 border-t border-white/5 bg-[#0f172a] shrink-0 space-y-6">
            <div className="flex justify-between items-end">
              <div>
                 <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1 block">Account Total</span>
                 <span className="text-4xl font-black tracking-tighter text-white tabular-nums">₱{totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">Pending Balance</p>
              </div>
            </div>
            <button onClick={handleSaveDebt} disabled={items.length === 0 || !customerName} className="w-full h-16 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-500/20 hover:bg-[#4f46e5] transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale">
              Process Account Debt
            </button>
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
