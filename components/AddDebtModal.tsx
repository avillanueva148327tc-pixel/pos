
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UtangRecord, UtangItem, InventoryItem, Customer, ReceiptTemplate, BranchConfig } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';
import { SecurityService } from '../services/securityService';

interface AddDebtModalProps {
  inventory: InventoryItem[];
  customers: Customer[];
  records: UtangRecord[];
  receiptTemplate: ReceiptTemplate;
  branch: BranchConfig;
  adminPinHash: string;
  requireAdminApproval?: boolean;
  defaultAutoPrint?: boolean;
  onAdd: (record: Omit<UtangRecord, 'id' | 'date'> & { isPaid: boolean, forceNew?: boolean, shouldPrint?: boolean }) => void;
  onUpdate?: (id: string, record: Partial<UtangRecord>) => void;
  onClose: () => void;
  onAddNewInventory: (barcode: string) => void;
  onRegisterCustomer?: (name: string) => void;
  initialRecord?: UtangRecord | null;
  initialCustomer?: Customer | null;
  initialItem?: InventoryItem | null;
}

const AddDebtModal: React.FC<AddDebtModalProps> = ({ 
  inventory, 
  customers, 
  records, 
  receiptTemplate, 
  branch, 
  adminPinHash,
  requireAdminApproval = true,
  defaultAutoPrint = false,
  onAdd, 
  onUpdate, 
  onClose,
  onAddNewInventory,
  onRegisterCustomer,
  initialRecord,
  initialCustomer,
  initialItem
}) => {
  const [isWalkIn, setIsWalkIn] = useState(() => {
    if (initialRecord) return initialRecord.customerName === 'Walk-in Customer';
    if (initialCustomer) return false;
    return true;
  });
  
  const [customerName, setCustomerName] = useState(() => {
    if (initialRecord) return initialRecord.customerName;
    if (initialCustomer) return initialCustomer.name;
    return 'Walk-in Customer';
  });

  const [items, setItems] = useState<UtangItem[]>(() => {
    if (initialRecord?.items) return initialRecord.items;
    if (initialItem) {
      return [{
        productId: initialItem.id,
        name: initialItem.name,
        quantity: 1,
        price: initialItem.price,
        unit: initialItem.unit,
        measurementValue: initialItem.measurementValue,
        date: new Date().toLocaleString()
      }];
    }
    return [];
  });

  const [productSearch, setProductSearch] = useState('');
  const [scannerMode, setScannerMode] = useState<'product' | 'customer' | null>(null);
  const [dueDate, setDueDate] = useState<string>(initialRecord?.nextReminderDate || '');
  const [reminderNote, setReminderNote] = useState<string>(initialRecord?.reminderNote || '');
  const [printReceipt, setPrintReceipt] = useState(defaultAutoPrint);

  // Authorization & Validation State
  const [showAuthPanel, setShowAuthPanel] = useState(false);
  const [authPin, setAuthPin] = useState('');
  const [authError, setAuthError] = useState(false);
  const [customerNotFoundError, setCustomerNotFoundError] = useState(false);
  const [pendingTransactionIsPaid, setPendingTransactionIsPaid] = useState<boolean>(true);
  
  // Merge Prompt State
  const [mergePrompt, setMergePrompt] = useState<{ show: boolean, existingAmount: number, customerName: string } | null>(null);
  const [pendingForceNew, setPendingForceNew] = useState(false);

  // Stock Warning State
  const [stockWarning, setStockWarning] = useState<{ name: string, stock: number, requested: number } | null>(null);
  const [isCustomerSelected, setIsCustomerSelected] = useState(!!initialRecord || !!initialCustomer);

  const totalAmount = useMemo(() => items.reduce((sum, i) => sum + (i.quantity * i.price), 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
  }, [customers, customerName]);

  const currentDebt = useMemo(() => {
    if (isWalkIn || !customerName) return 0;
    return records
      .filter(r => r.customerName.toLowerCase() === customerName.toLowerCase() && !r.isPaid)
      .reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0);
  }, [records, customerName, isWalkIn]);

  const limitExceeded = useMemo(() => {
    if (isWalkIn || !selectedCustomer || !selectedCustomer.creditLimit) return false;
    return (currentDebt + totalAmount) > selectedCustomer.creditLimit;
  }, [currentDebt, totalAmount, selectedCustomer, isWalkIn]);

  useEffect(() => {
    if (isWalkIn) {
      setCustomerName('Walk-in Customer');
      setShowAuthPanel(false);
      setCustomerNotFoundError(false);
      setIsCustomerSelected(true);
    } else if (customerName === 'Walk-in Customer') {
      setCustomerName('');
      setIsCustomerSelected(false);
    }
  }, [isWalkIn]);

  useEffect(() => {
    if (customerNotFoundError) setCustomerNotFoundError(false);
  }, [customerName]);

  const handleAddItem = (p: InventoryItem) => {
    const existingIndex = items.findIndex(i => i.productId === p.id);
    const dateStr = new Date().toLocaleString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
    });
    
    let nextQty = 1;
    let newItems = [...items];

    if (existingIndex >= 0) {
      nextQty = newItems[existingIndex].quantity + 1;
      if (nextQty > p.stock) {
        setStockWarning({ name: p.name, stock: p.stock, requested: nextQty });
      }
      newItems[existingIndex] = { ...newItems[existingIndex], quantity: nextQty, date: dateStr };
    } else {
      if (1 > p.stock) {
        setStockWarning({ name: p.name, stock: p.stock, requested: 1 });
      }
      newItems.push({ 
        productId: p.id, name: p.name, quantity: 1, price: p.price, unit: p.unit, measurementValue: p.measurementValue, date: dateStr 
      });
    }

    setItems(newItems);
    setProductSearch('');
  };

  const updateQuantity = (index: number, delta: number) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const nextQty = Math.max(1, item.quantity + delta);
        if (delta > 0 && item.productId) {
          const invItem = inventory.find(inv => inv.id === item.productId);
          if (invItem && nextQty > invItem.stock) {
            setStockWarning({ name: item.name, stock: invItem.stock, requested: nextQty });
          }
        }
        return { ...item, quantity: nextQty };
      }
      return item;
    }));
  };

  const handleAddCustomItem = () => {
    if (!productSearch) return;
    const dateStr = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    // Use a prompt or default price for custom items in this simplified view
    const priceStr = prompt(`Enter price for "${productSearch}":`, "0");
    if (priceStr === null) return;
    
    setItems([...items, {
      name: productSearch,
      quantity: 1,
      price: parseFloat(priceStr) || 0,
      date: dateStr
    }]);
    setProductSearch('');
  };

  const handleBarcodeScan = (decodedText: string): ScanResultStatus => {
    let customerId = decodedText;
    if (decodedText.startsWith('CID:')) {
      customerId = decodedText.replace('CID:', '');
    }
    const foundCustomer = customers.find(c => c.id === customerId || c.barcode === decodedText);
    
    if (foundCustomer) {
      setCustomerName(foundCustomer.name);
      setIsWalkIn(false);
      setIsCustomerSelected(true);
      setCustomerNotFoundError(false);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      return ScanResultStatus.SUCCESS;
    }

    // Customer Mode Specific Logic
    if (scannerMode === 'customer') {
        if (window.confirm(`Member ID '${decodedText}' not found.\nDo you want to register a new customer with this ID?`)) {
            setScannerMode(null);
            // Pass the scanned code to the registration modal
            if (onRegisterCustomer) onRegisterCustomer(decodedText);
            return ScanResultStatus.IDLE;
        }
        return ScanResultStatus.NOT_FOUND;
    }

    const foundItem = inventory.find(i => i.barcode === decodedText);
    if (foundItem) {
      handleAddItem(foundItem);
      return ScanResultStatus.SUCCESS;
    }

    if (window.confirm(`Item '${decodedText}' not found.\nClick OK to add to Inventory.\nClick Cancel to add as one-off custom item.`)) {
        onAddNewInventory(decodedText);
        return ScanResultStatus.IDLE;
    } else {
       setItems([...items, {
         name: decodedText,
         quantity: 1,
         price: 0, // Will need adjustment
         date: new Date().toLocaleString()
       }]);
       setScannerMode(null);
    }

    return ScanResultStatus.NOT_FOUND;
  };

  const verifyAdminAuth = async () => {
    if (authPin.length < 4) return;
    const inputHash = await SecurityService.hashPin(authPin);
    if (inputHash === adminPinHash) {
      commitTransaction(pendingTransactionIsPaid, pendingForceNew);
    } else {
      setAuthError(true);
      setAuthPin('');
      setTimeout(() => { setAuthError(false), 2000 });
    }
  };

  const commitTransaction = (isPaid: boolean, forceNew: boolean = false) => {
    const payload = { 
      customerName: isWalkIn ? 'Walk-in Customer' : (selectedCustomer?.name || customerName), 
      product: items.map(i => i.name).join(', '), 
      items, 
      quantity: totalQuantity, 
      totalAmount, 
      isPaid, 
      paidAmount: isPaid ? totalAmount : 0,
      nextReminderDate: !isPaid ? (dueDate || undefined) : undefined,
      reminderNote: !isPaid ? (reminderNote || undefined) : undefined,
      forceNew,
      shouldPrint: printReceipt
    };
    if (initialRecord && onUpdate) onUpdate(initialRecord.id, payload);
    else onAdd(payload);
    onClose();
  };

  const proceedToAuth = (isPaid: boolean, forceNew: boolean) => {
    setPendingForceNew(forceNew);
    const needsAuth = requireAdminApproval && (isPaid || isWalkIn || (!isPaid && limitExceeded));
    if (needsAuth) {
      setShowAuthPanel(true);
    } else {
      commitTransaction(isPaid, forceNew);
    }
  };

  const onMergeConfirm = (forceNew: boolean) => {
    setMergePrompt(null);
    proceedToAuth(pendingTransactionIsPaid, forceNew);
  };

  const handleTransactionRequest = (isPaid: boolean) => {
    if (!customerName || items.length === 0) return;
    
    if (!isWalkIn && !selectedCustomer) {
      setCustomerNotFoundError(true);
      return;
    }

    setPendingTransactionIsPaid(isPaid);

    if (!isPaid && !isWalkIn) {
      const targetName = selectedCustomer?.name || customerName;
      // Case-insensitive check for existing unpaid records
      const existingRecord = records.find(r => 
        r.customerName.toLowerCase() === targetName.toLowerCase() && !r.isPaid
      );
      
      if (existingRecord) {
        setMergePrompt({
          show: true,
          existingAmount: existingRecord.totalAmount - existingRecord.paidAmount,
          customerName: existingRecord.customerName
        });
        return;
      }
    }

    proceedToAuth(isPaid, false);
  };

  const filteredInventory = useMemo(() => {
    if (!productSearch) return [];
    return inventory.filter(i => 
      i.name.toLowerCase().includes(productSearch.toLowerCase()) || 
      (i.barcode && i.barcode.includes(productSearch))
    ).slice(0, 5);
  }, [inventory, productSearch]);

  const customerSuggestions = useMemo(() => {
    if (!customerName || isWalkIn || isCustomerSelected || customerName.length < 1) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerName.toLowerCase())).slice(0, 3);
  }, [customers, customerName, isWalkIn, isCustomerSelected]);

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/10 animate-in zoom-in-95 duration-200 relative">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
             <div>
               <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">New Transaction</h3>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{branch.name}</p>
             </div>
             <button onClick={onClose} className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6 custom-scrollbar">
             
             {/* Customer Section */}
             <div className="space-y-3">
                <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                   <button onClick={() => setIsWalkIn(true)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isWalkIn ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}>Walk-in</button>
                   <button onClick={() => setIsWalkIn(false)} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${!isWalkIn ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-400'}`}>Member</button>
                </div>
                
                {!isWalkIn && (
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                          <input 
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition dark:text-white"
                            placeholder="Search Suki Name..."
                            value={customerName === 'Walk-in Customer' ? '' : customerName}
                            onChange={e => { setCustomerName(e.target.value); setIsCustomerSelected(false); }}
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                          {customerSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-20 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl mt-1 overflow-hidden">
                              {customerSuggestions.map(c => (
                                <button key={c.id} onClick={() => { setCustomerName(c.name); setIsCustomerSelected(true); }} className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                    <p className="font-bold text-xs dark:text-white">{c.name}</p>
                                    <p className="text-[9px] text-slate-400">Limit: ₱{c.creditLimit}</p>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                      <button 
                        onClick={() => setScannerMode('customer')} 
                        className="w-12 h-11 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center text-lg border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition"
                        title="Scan Member ID Card"
                      >
                        🪪
                      </button>
                   </div>
                )}
             </div>

             {/* Product Search */}
             <div className="space-y-2 relative z-10">
                <div className="flex gap-2">
                   <div className="relative flex-1">
                      <input 
                        className="w-full pl-9 pr-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 transition dark:text-white"
                        placeholder="Scan or Search Item..."
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        autoFocus
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">📦</span>
                   </div>
                   <button onClick={() => setScannerMode('product')} className="w-12 h-11 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-lg border border-slate-200 dark:border-slate-700" title="Scan Product Barcode">📷</button>
                </div>
                
                {productSearch && (
                   <div className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 mt-1 max-h-60 overflow-y-auto z-20">
                      {filteredInventory.length === 0 ? (
                         <div className="p-4 text-center text-xs text-slate-500">No items found.</div>
                      ) : (
                         filteredInventory.map(item => (
                            <button key={item.id} onClick={() => handleAddItem(item)} className="w-full p-3 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 text-left">
                               <div>
                                  <p className="font-bold text-xs dark:text-white">{item.name}</p>
                                  <p className="text-[9px] text-slate-400">{item.stock} {item.unit} available</p>
                               </div>
                               <span className="font-black text-primary text-xs">₱{item.price.toFixed(2)}</span>
                            </button>
                         ))
                      )}
                      <button onClick={handleAddCustomItem} className="w-full p-3 bg-slate-50 dark:bg-slate-700/50 text-center text-[10px] font-bold text-primary uppercase hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                         + Add "{productSearch}" as Custom Item
                      </button>
                   </div>
                )}
             </div>

             {/* Cart Items */}
             <div className="space-y-3">
                {items.length === 0 ? (
                   <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
                      <span className="text-3xl grayscale opacity-50 block mb-2">🛒</span>
                      <p className="text-xs font-bold text-slate-400 uppercase">Cart is Empty</p>
                   </div>
                ) : (
                   items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                         <div className="flex-1 min-w-0 pr-3">
                            <p className="font-bold text-xs truncate dark:text-white">{item.name}</p>
                            <p className="text-[10px] text-slate-400">₱{item.price.toFixed(2)} x {item.quantity}</p>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className="font-black text-sm dark:text-white">₱{(item.price * item.quantity).toFixed(2)}</span>
                            <div className="flex items-center gap-1">
                               <button onClick={() => updateQuantity(idx, -1)} className="w-6 h-6 rounded bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-xs font-bold text-slate-500 hover:text-rose-500">-</button>
                               <button onClick={() => updateQuantity(idx, 1)} className="w-6 h-6 rounded bg-white dark:bg-slate-700 shadow-sm flex items-center justify-center text-xs font-bold text-slate-500 hover:text-emerald-500">+</button>
                               <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="ml-1 text-slate-400 hover:text-rose-500">✕</button>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-[#0f172a]">
             
             {/* Print Toggle - Fixed for Terminal */}
             <div className="flex justify-between items-center mb-4 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-white/5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">🖨️ Print Receipt</span>
                <div 
                  onClick={() => setPrintReceipt(!printReceipt)}
                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${printReceipt ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${printReceipt ? 'translate-x-4' : ''}`} />
                </div>
             </div>

             <div className="flex justify-between items-end mb-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Total Amount</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
             </div>
             
             {limitExceeded && !isWalkIn && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-xl flex items-center gap-2">
                   <span className="text-lg">⚠️</span>
                   <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold leading-tight">
                      Credit Limit Exceeded by ₱{(currentDebt + totalAmount - (selectedCustomer?.creditLimit || 0)).toLocaleString()}. Admin approval required.
                   </p>
                </div>
             )}

             <div className="grid grid-cols-2 gap-3">
                {!isWalkIn && (
                   <button 
                     onClick={() => handleTransactionRequest(false)}
                     disabled={items.length === 0}
                     className="py-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 font-black uppercase text-[10px] tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                   >
                     Charge to Debt
                   </button>
                )}
                <button 
                  onClick={() => handleTransactionRequest(true)}
                  disabled={items.length === 0}
                  className={`py-4 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 ${isWalkIn ? 'col-span-2' : ''}`}
                >
                  {printReceipt ? 'Pay & Print' : 'Pay Cash'}
                </button>
             </div>
          </div>
        </div>
        
        {/* Absolute Overlays */}
        {showAuthPanel && (
            <div className="absolute inset-0 z-[120] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in rounded-3xl">
              <div className="w-full max-w-sm text-center space-y-4">
                <h2 className="text-white text-xl font-black uppercase">Admin Required</h2>
                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-3 h-3 rounded-full border-2 border-rose-500 ${authPin.length > i ? 'bg-rose-500' : ''}`} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✕'].map(btn => (
                    <button key={btn} onClick={() => { if (btn === '✕') setShowAuthPanel(false); else if (btn === 'C') setAuthPin(''); else if (authPin.length < 4) setAuthPin(prev => prev + btn); }} className="h-12 bg-white/5 text-white rounded-xl text-lg font-black">{btn}</button>
                  ))}
                </div>
                <button onClick={verifyAdminAuth} className="w-full py-3 bg-white text-slate-900 rounded-xl font-black uppercase text-[10px]">Approve</button>
              </div>
            </div>
        )}

        {mergePrompt && (
            <div className="absolute inset-0 z-[135] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 rounded-3xl">
              <div className="text-center w-full max-w-xs">
                <h3 className="text-white text-xl font-black uppercase mb-2">Unpaid Balance Found</h3>
                <p className="text-slate-300 text-sm font-bold mb-1">{mergePrompt.customerName}</p>
                <p className="text-slate-400 text-xs mb-6">Existing debt: <span className="text-rose-400 font-bold">₱{mergePrompt.existingAmount.toLocaleString()}</span></p>
                
                <div className="space-y-3">
                  <button onClick={() => onMergeConfirm(false)} className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-wide shadow-lg shadow-indigo-500/20 hover:bg-indigo-400 transition">
                    Merge with Existing
                  </button>
                  <p className="text-[10px] text-slate-500">OR</p>
                  <button onClick={() => onMergeConfirm(true)} className="w-full py-4 bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-wide hover:bg-white/20 transition">
                    Create New Invoice
                  </button>
                </div>
              </div>
            </div>
        )}

        {stockWarning && (
            <div className="absolute inset-0 z-[140] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 rounded-3xl">
              <div className="text-center w-full">
                <h3 className="text-white text-xl font-black uppercase mb-2">Stock Low</h3>
                <p className="text-slate-400 text-xs mb-6">{stockWarning.name}: Only {stockWarning.stock} available.</p>
                <button onClick={() => setStockWarning(null)} className="w-full py-3 bg-rose-500 text-white rounded-xl font-black uppercase text-xs">Acknowledge</button>
              </div>
            </div>
        )}

        {customerNotFoundError && (
            <div className="absolute inset-0 z-[130] bg-slate-900/98 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in rounded-3xl">
              <div className="text-center w-full space-y-4">
                <h2 className="text-white text-xl font-black uppercase">Suki Not Found</h2>
                <button onClick={() => { onClose(); onRegisterCustomer?.(customerName); }} className="w-full py-3 bg-primary text-white rounded-xl font-black uppercase text-xs">Register New</button>
                <button onClick={() => setCustomerNotFoundError(false)} className="w-full py-3 bg-white/5 text-slate-400 rounded-xl font-black uppercase text-xs">Cancel</button>
              </div>
            </div>
        )}

      </div>
      {scannerMode && (
        <BarcodeScanner 
          onScan={handleBarcodeScan} 
          onClose={() => setScannerMode(null)} 
          isContinuous={true} 
          successVibrationPattern={50}
          enableSound={true}
        />
      )}
    </>
  );
};

export default AddDebtModal;
