
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { UtangRecord, UtangItem, InventoryItem, Customer, ReceiptTemplate, BranchConfig, QuickPickItem } from '../types';
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
  onAddNewInventory: (details: string | Partial<InventoryItem>) => void;
  onRegisterCustomer?: (name: string) => void;
  initialRecord?: UtangRecord | null;
  initialCustomer?: Customer | null;
  initialItem?: InventoryItem | null;
  quickPicks: QuickPickItem[];
  onUpdateQuickPicks: (picks: QuickPickItem[]) => void;
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
  initialItem,
  quickPicks,
  onUpdateQuickPicks
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

  // Entry Mode State
  const [entryMode, setEntryMode] = useState<'inventory' | 'manual'>('inventory');
  
  // Manual Form State - Added cost and itemsPerPack
  const [manualForm, setManualForm] = useState({ 
    name: '', 
    price: '', 
    cost: '', 
    itemsPerPack: '', 
    qty: 1 
  });

  // Quick Pick Edit State
  const [isEditingQuickPicks, setIsEditingQuickPicks] = useState(false);
  const [tempQuickPicks, setTempQuickPicks] = useState<QuickPickItem[]>(quickPicks);
  const [qpSearch, setQpSearch] = useState('');

  useEffect(() => {
    if (isEditingQuickPicks) setTempQuickPicks(quickPicks);
  }, [isEditingQuickPicks, quickPicks]);

  const handleSaveQuickPicks = () => {
    const cleanPicks = tempQuickPicks.filter(qp => qp.name.trim() !== '');
    onUpdateQuickPicks(cleanPicks);
    setIsEditingQuickPicks(false);
  };

  const handleAddTempQuickPick = () => {
    setTempQuickPicks([...tempQuickPicks, { name: '', price: 0 }]);
  };

  const handleImportQuickPick = (item: InventoryItem) => {
    setTempQuickPicks([...tempQuickPicks, { name: item.name, price: item.price }]);
    setQpSearch('');
  };

  const handleRemoveTempQuickPick = (index: number) => {
    setTempQuickPicks(tempQuickPicks.filter((_, i) => i !== index));
  };

  const handleUpdateTempQuickPick = (index: number, field: keyof QuickPickItem, value: any) => {
    const newPicks = [...tempQuickPicks];
    if (field === 'price') {
        newPicks[index].price = parseFloat(value) || 0;
    } else {
        newPicks[index].name = value;
    }
    setTempQuickPicks(newPicks);
  };

  const qpSearchResults = useMemo(() => {
    if (!qpSearch) return [];
    return inventory.filter(i => i.name.toLowerCase().includes(qpSearch.toLowerCase())).slice(0, 5);
  }, [inventory, qpSearch]);

  // Smart Edit State (For fractional quantities / per kilo pricing)
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ qty: string, total: string }>({ qty: '', total: '' });

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

  // Exit Confirmation State
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const totalAmount = useMemo(() => items.reduce((sum, i) => sum + (i.quantity * i.price), 0), [items]);
  const totalQuantity = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
  }, [customers, customerName]);

  const finalAmountToPay = totalAmount;

  const currentDebt = useMemo(() => {
    if (isWalkIn || !customerName) return 0;
    return records
      .filter(r => r.customerName.toLowerCase() === customerName.toLowerCase() && !r.isPaid)
      .reduce((sum, r) => sum + (r.totalAmount - r.paidAmount), 0);
  }, [records, customerName, isWalkIn]);

  const limitExceeded = useMemo(() => {
    if (isWalkIn || !selectedCustomer || !selectedCustomer.creditLimit) return false;
    return (currentDebt + finalAmountToPay) > selectedCustomer.creditLimit;
  }, [currentDebt, finalAmountToPay, selectedCustomer, isWalkIn]);

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
        productId: p.id, name: p.name, quantity: 1, price: p.price, unit: p.unit, measurementValue: p.measurementValue, date: dateStr,
        cost: p.originalPrice // Track cost from inventory
      });
    }

    setItems(newItems);
    setProductSearch('');
  };

  const updateQuantity = (index: number, delta: number) => {
    // If editing, close edit mode first
    if (editingIdx !== null) setEditingIdx(null);

    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const nextQty = Math.max(0.001, item.quantity + delta); // Prevent 0 or negative
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

  const startEditingItem = (index: number) => {
    const item = items[index];
    setEditingIdx(index);
    setEditValues({
      qty: item.quantity.toString(),
      total: (item.quantity * item.price).toFixed(2)
    });
  };

  const handleEditChange = (field: 'qty' | 'total', value: string) => {
    if (editingIdx === null) return;
    const item = items[editingIdx];
    const price = item.price;

    let newQtyStr = editValues.qty;
    let newTotalStr = editValues.total;

    if (field === 'qty') {
      newQtyStr = value;
      const parsedQty = parseFloat(value);
      if (!isNaN(parsedQty)) {
        newTotalStr = (parsedQty * price).toFixed(2);
        // Live update cart
        const updatedItems = [...items];
        updatedItems[editingIdx] = { ...item, quantity: parsedQty };
        setItems(updatedItems);
      }
    } else {
      newTotalStr = value;
      const parsedTotal = parseFloat(value);
      if (!isNaN(parsedTotal) && price > 0) {
        const calculatedQty = parsedTotal / price;
        newQtyStr = calculatedQty.toFixed(3); // 3 decimals for precision weight
        // Live update cart
        const updatedItems = [...items];
        updatedItems[editingIdx] = { ...item, quantity: calculatedQty };
        setItems(updatedItems);
      }
    }

    setEditValues({ qty: newQtyStr, total: newTotalStr });
  };

  const closeEditMode = () => {
    setEditingIdx(null);
  };

  const handleAddManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.name || !manualForm.price) return;
    
    const price = parseFloat(manualForm.price);
    if (isNaN(price)) return;

    const dateStr = new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
    
    setItems([...items, {
        name: manualForm.name,
        quantity: Math.max(1, manualForm.qty),
        price: price,
        cost: parseFloat(manualForm.cost) || 0, // Track cost for manual items
        itemsPerPack: parseFloat(manualForm.itemsPerPack) || undefined,
        date: dateStr
    }]);

    setManualForm({ name: '', price: '', cost: '', itemsPerPack: '', qty: 1 });
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleQuickPick = (qp: { name: string, price: number }) => {
    if (qp.price === 0) {
        // Prefill manual form if price is variable
        setManualForm(prev => ({ ...prev, name: qp.name, price: '', qty: 1 }));
    } else {
        // Add immediately
        setItems([...items, {
            name: qp.name,
            quantity: 1,
            price: qp.price,
            date: new Date().toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
        }]);
        if ('vibrate' in navigator) navigator.vibrate(50);
    }
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

    // If scanned item not found, ask to add to inventory or open manual tab
    if (window.confirm(`Item '${decodedText}' not found.\nClick OK to add to Inventory.\nClick Cancel to use Manual Entry.`)) {
        onAddNewInventory(decodedText);
        return ScanResultStatus.IDLE;
    } else {
       setEntryMode('manual');
       setManualForm(prev => ({ ...prev, name: decodedText }));
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
      paidAmount: isPaid ? finalAmountToPay : 0, // Store actual cash paid
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

  const handleCloseRequest = () => {
    const hasItems = items.length > 0;
    const hasCustomer = !isWalkIn && customerName && customerName !== 'Walk-in Customer';
    
    if (hasItems || hasCustomer) {
        setShowExitConfirm(true);
    } else {
        onClose();
    }
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
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in">
        <div className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/10 animate-in zoom-in-95 duration-200 relative">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f172a] shrink-0">
             <div>
               <h3 className="text-xl font-black text-white uppercase tracking-tight">New Transaction</h3>
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{branch.name}</p>
             </div>
             <button onClick={handleCloseRequest} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition">✕</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
             
             {/* Customer Section */}
             <div className="space-y-3">
                <div className="flex gap-2 p-1.5 bg-[#1e293b] rounded-2xl border border-white/5">
                   <button onClick={() => setIsWalkIn(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isWalkIn ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Walk-in</button>
                   <button onClick={() => setIsWalkIn(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isWalkIn ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Member</button>
                </div>
                
                {!isWalkIn && (
                   <div className="flex gap-2">
                      <div className="relative flex-1">
                          <input 
                            className="w-full pl-10 pr-4 py-4 bg-[#1e293b] rounded-2xl border border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition text-white placeholder:text-slate-500"
                            placeholder="Search Suki Name..."
                            value={customerName === 'Walk-in Customer' ? '' : customerName}
                            onChange={e => { setCustomerName(e.target.value); setIsCustomerSelected(false); }}
                          />
                          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
                          {customerSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-20 bg-[#1e293b] border border-slate-700 rounded-2xl shadow-2xl mt-2 overflow-hidden">
                              {customerSuggestions.map(c => (
                                <button key={c.id} onClick={() => { setCustomerName(c.name); setIsCustomerSelected(true); }} className="w-full p-4 text-left hover:bg-white/5 border-b border-white/5 last:border-0">
                                    <p className="font-bold text-xs text-white uppercase">{c.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Limit: ₱{c.creditLimit?.toLocaleString() || '0'}</p>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                      <button 
                        onClick={() => setScannerMode('customer')} 
                        className="w-14 h-auto bg-[#1e293b] rounded-2xl flex items-center justify-center text-xl border border-slate-700 text-indigo-400 hover:bg-indigo-500/10 transition"
                        title="Scan Member ID Card"
                      >
                        🪪
                      </button>
                   </div>
                )}
             </div>

             <div className="h-px bg-white/5 w-full"></div>

             {/* Item Entry Section */}
             <div className="space-y-4">
                {/* Entry Mode Tabs */}
                <div className="flex gap-2 p-1 bg-[#1e293b] rounded-2xl border border-white/5">
                   <button onClick={() => setEntryMode('inventory')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'inventory' ? 'bg-[#0f172a] text-white shadow-sm border border-white/5' : 'text-slate-400 hover:text-white'}`}>
                      Scan / Inventory
                   </button>
                   <button onClick={() => setEntryMode('manual')} className={`flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entryMode === 'manual' ? 'bg-[#0f172a] text-amber-400 shadow-sm border border-white/5' : 'text-slate-400 hover:text-white'}`}>
                      Manual Entry
                   </button>
                </div>

                {entryMode === 'inventory' ? (
                  /* Inventory Search */
                  <div className="space-y-2 relative z-10 animate-in fade-in">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                            <input 
                              className="w-full pl-10 pr-4 py-4 bg-[#1e293b] rounded-2xl border border-slate-700 text-xs font-bold outline-none focus:ring-2 focus:ring-[#6366f1]/50 transition text-white placeholder:text-slate-500"
                              placeholder="Scan or Search Item..."
                              value={productSearch}
                              onChange={e => setProductSearch(e.target.value)}
                              autoFocus
                            />
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">📦</span>
                        </div>
                        <button onClick={() => setScannerMode('product')} className="w-14 h-auto bg-[#1e293b] rounded-2xl flex items-center justify-center text-xl border border-slate-700 text-slate-400 hover:text-white transition" title="Scan Product Barcode">📷</button>
                      </div>
                      
                      {productSearch && (
                        <div className="absolute top-full left-0 right-0 bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 mt-2 max-h-60 overflow-y-auto z-20">
                            {filteredInventory.length === 0 ? (
                              <div className="p-4 text-center">
                                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">No items found.</p>
                                  <button onClick={() => { setEntryMode('manual'); setManualForm(prev => ({...prev, name: productSearch})); setProductSearch(''); }} className="text-[10px] font-black text-amber-400 hover:underline uppercase">
                                    Use Manual Entry
                                  </button>
                              </div>
                            ) : (
                              filteredInventory.map(item => (
                                  <button key={item.id} onClick={() => handleAddItem(item)} className="w-full p-4 flex justify-between items-center hover:bg-white/5 border-b border-white/5 last:border-0 text-left transition">
                                    <div>
                                        <p className="font-bold text-xs text-white uppercase">{item.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{item.stock} {item.unit} available</p>
                                    </div>
                                    <span className="font-black text-[#6366f1] text-xs">₱{item.price.toFixed(2)}</span>
                                  </button>
                              ))
                            )}
                        </div>
                      )}
                  </div>
                ) : (
                  /* Manual Entry Form */
                  <div className="animate-in fade-in space-y-4">
                    
                    {/* Quick Picks Configuration & Grid */}
                    <div>
                        <div className="flex justify-between items-end mb-2 px-1">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quick Items</p>
                            <button 
                                type="button" 
                                onClick={() => isEditingQuickPicks ? handleSaveQuickPicks() : setIsEditingQuickPicks(true)} 
                                className={`text-[10px] font-bold underline ${isEditingQuickPicks ? 'text-emerald-500' : 'text-indigo-400 hover:text-white'}`}
                            >
                                {isEditingQuickPicks ? 'Done & Save' : 'Edit List'}
                            </button>
                        </div>

                        {isEditingQuickPicks ? (
                            <div className="space-y-2 bg-[#1e293b] p-3 rounded-2xl border border-white/5 animate-in slide-in-from-top-2">
                                {/* Search Import */}
                                <div className="relative mb-3">
                                    <input 
                                        className="w-full bg-[#0f172a] text-white text-[10px] font-bold px-3 py-2 rounded-lg border border-white/10 outline-none focus:border-emerald-500 placeholder:text-slate-500" 
                                        placeholder="🔍 Search inventory to create shortcut..." 
                                        value={qpSearch}
                                        onChange={e => setQpSearch(e.target.value)}
                                    />
                                    {qpSearchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 bg-[#0f172a] border border-slate-700 rounded-lg shadow-xl mt-1 z-20 overflow-hidden">
                                            {qpSearchResults.map(item => (
                                                <button 
                                                    key={item.id}
                                                    onClick={() => handleImportQuickPick(item)}
                                                    className="w-full text-left px-3 py-2 hover:bg-white/10 text-[10px] font-bold text-white border-b border-white/5 last:border-0 flex justify-between"
                                                >
                                                    <span>{item.name}</span>
                                                    <span className="text-emerald-400">₱{item.price}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                                    {tempQuickPicks.map((qp, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input 
                                                value={qp.name} 
                                                onChange={(e) => handleUpdateTempQuickPick(idx, 'name', e.target.value)}
                                                className="flex-[2] bg-[#0f172a] text-white text-[10px] font-bold px-2 py-2 rounded-lg border border-white/10 outline-none focus:border-indigo-500" 
                                                placeholder="Item Name" 
                                            />
                                            <input 
                                                value={qp.price || ''} 
                                                onChange={(e) => handleUpdateTempQuickPick(idx, 'price', e.target.value)}
                                                className="flex-1 bg-[#0f172a] text-white text-[10px] font-bold px-2 py-2 rounded-lg border border-white/10 outline-none focus:border-indigo-500" 
                                                placeholder="Price" 
                                                type="number" 
                                            />
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveTempQuickPick(idx)}
                                                className="w-8 h-8 flex items-center justify-center bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={handleAddTempQuickPick}
                                    className="w-full py-2 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition"
                                >
                                    + Add Empty
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-2">
                                {quickPicks.map((qp, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => handleQuickPick(qp)}
                                        className="p-2 bg-[#2d3748] hover:bg-[#4a5568] border border-white/5 rounded-xl flex flex-col items-center justify-center text-center transition active:scale-95 group"
                                    >
                                        <span className="text-[9px] font-black text-white uppercase group-hover:scale-105 transition-transform">{qp.name}</span>
                                        <span className="text-[8px] font-bold text-amber-400 mt-0.5">{qp.price > 0 ? `₱${qp.price}` : '...'}</span>
                                    </button>
                                ))}
                                {quickPicks.length === 0 && (
                                    <div className="col-span-3 text-center py-4 border border-dashed border-white/10 rounded-xl">
                                        <p className="text-[9px] text-slate-500 font-bold uppercase">No shortcuts added.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-white/5 w-full"></div>

                    <form onSubmit={handleAddManualItem} className="bg-[#1e293b] p-4 rounded-2xl border border-white/5 space-y-4">
                        {/* Name */}
                        <div>
                           <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Item Name</label>
                           <input 
                             required
                             className="w-full p-3 bg-[#0f172a] rounded-xl border border-slate-700 text-xs font-bold text-white outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                             placeholder="Item Name (e.g. Service Fee)"
                             value={manualForm.name}
                             onChange={e => setManualForm({...manualForm, name: e.target.value})}
                             autoFocus
                           />
                        </div>

                        {/* Retail Price & Cost Price */}
                        <div className="grid grid-cols-2 gap-3">
                           <div className="relative">
                              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Retail Price</label>
                              <span className="absolute left-3 top-[29px] text-slate-500 text-xs font-bold">₱</span>
                              <input 
                                required
                                type="number"
                                step="any"
                                className="w-full p-3 pl-7 bg-[#0f172a] rounded-xl border border-slate-700 text-xs font-bold text-white outline-none focus:border-amber-500 transition placeholder:text-slate-600"
                                placeholder="0.00"
                                value={manualForm.price}
                                onChange={e => setManualForm({...manualForm, price: e.target.value})}
                              />
                           </div>
                           <div className="relative">
                              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Cost (Optional)</label>
                              <span className="absolute left-3 top-[29px] text-slate-500 text-xs font-bold">₱</span>
                              <input 
                                type="number"
                                step="any"
                                className="w-full p-3 pl-7 bg-[#0f172a] rounded-xl border border-slate-700 text-xs font-bold text-white outline-none focus:border-emerald-500 transition placeholder:text-slate-600"
                                placeholder="0.00"
                                value={manualForm.cost}
                                onChange={e => setManualForm({...manualForm, cost: e.target.value})}
                              />
                           </div>
                        </div>

                        {/* Quantity & Units per Pack */}
                        <div className="grid grid-cols-2 gap-3">
                           <div className="flex items-end">
                              <div className="w-full">
                                 <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Quantity</label>
                                 <div className="flex items-center bg-[#0f172a] rounded-xl border border-slate-700 h-[42px]">
                                    <button type="button" onClick={() => setManualForm(p => ({...p, qty: Math.max(1, p.qty - 1)}))} className="w-10 h-full text-slate-400 hover:text-white font-bold text-lg">-</button>
                                    <input 
                                      type="number" 
                                      className="flex-1 w-full bg-transparent text-center text-xs font-bold text-white outline-none"
                                      value={manualForm.qty}
                                      onChange={e => setManualForm({...manualForm, qty: parseFloat(e.target.value) || 1})}
                                    />
                                    <button type="button" onClick={() => setManualForm(p => ({...p, qty: p.qty + 1}))} className="w-10 h-full text-slate-400 hover:text-white font-bold text-lg">+</button>
                                 </div>
                              </div>
                           </div>
                           <div>
                              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Units/Pack (Opt)</label>
                              <input 
                                type="number"
                                className="w-full h-[42px] p-3 bg-[#0f172a] rounded-xl border border-slate-700 text-xs font-bold text-white outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                                placeholder="1"
                                value={manualForm.itemsPerPack}
                                onChange={e => setManualForm({...manualForm, itemsPerPack: e.target.value})}
                              />
                           </div>
                        </div>

                        <div className="flex gap-2 mt-2">
                            <button type="submit" className="flex-[2] py-3 bg-amber-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition active:scale-[0.98]">
                               + Add to Cart
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    if(manualForm.name && manualForm.price) {
                                        onAddNewInventory({ 
                                            name: manualForm.name, 
                                            price: parseFloat(manualForm.price),
                                            originalPrice: parseFloat(manualForm.cost) || 0
                                        });
                                    } else {
                                        alert("Enter Name and Price first.");
                                    }
                                }}
                                className="flex-1 py-3 bg-[#0f172a] border border-white/10 text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/10 transition active:scale-[0.98]"
                            >
                               Save to Inv.
                            </button>
                        </div>
                    </form>
                  </div>
                )}
             </div>

             {/* Cart Items */}
             <div className="space-y-3">
                {items.length === 0 ? (
                   <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl bg-white/5">
                      <span className="text-3xl grayscale opacity-30 block mb-3">🛒</span>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cart is Empty</p>
                   </div>
                ) : (
                   items.map((item, idx) => (
                      <div 
                        key={idx} 
                        className={`flex flex-col p-4 bg-[#1e293b] rounded-2xl border transition-all duration-300 ${editingIdx === idx ? 'border-[#6366f1] shadow-lg shadow-indigo-500/10' : 'border-white/5 hover:border-white/10'}`}
                      >
                         <div className="flex justify-between items-center cursor-pointer" onClick={() => editingIdx === idx ? closeEditMode() : startEditingItem(idx)}>
                            <div className="flex-1 min-w-0 pr-3">
                                <p className="font-bold text-xs truncate text-white uppercase">{item.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-0.5">₱{item.price.toFixed(2)} {item.unit && item.unit !== 'pc' ? `/ ${item.unit}` : 'each'} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="font-black text-sm text-white tabular-nums">₱{(item.price * item.quantity).toFixed(2)}</span>
                                {editingIdx !== idx && (
                                  <div className="flex items-center gap-1 bg-[#0f172a] rounded-lg p-1" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => updateQuantity(idx, -1)} className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white hover:bg-rose-500 transition">-</button>
                                    <button onClick={() => updateQuantity(idx, 1)} className="w-7 h-7 rounded-md bg-white/5 flex items-center justify-center text-xs font-bold text-slate-400 hover:text-white hover:bg-emerald-500 transition">+</button>
                                  </div>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); setItems(items.filter((_, i) => i !== idx)); }} className="text-slate-500 hover:text-rose-500 transition px-1">✕</button>
                            </div>
                         </div>

                         {/* Smart Edit Panel */}
                         {editingIdx === idx && (
                           <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3 animate-in slide-in-from-top-2">
                              <div>
                                <label className="text-[8px] font-black text-[#6366f1] uppercase tracking-widest mb-1 block">Quantity ({item.unit || 'qty'})</label>
                                <input 
                                  autoFocus
                                  type="number"
                                  step="any"
                                  className="w-full p-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm font-bold text-white outline-none focus:border-[#6366f1]"
                                  value={editValues.qty}
                                  onChange={(e) => handleEditChange('qty', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                              </div>
                              <div>
                                <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1 block">Total Amount (₱)</label>
                                <input 
                                  type="number"
                                  step="any"
                                  className="w-full p-2 bg-[#0f172a] border border-white/10 rounded-lg text-sm font-bold text-white outline-none focus:border-emerald-500"
                                  value={editValues.total}
                                  onChange={(e) => handleEditChange('total', e.target.value)}
                                  onFocus={(e) => e.target.select()}
                                />
                              </div>
                              <div className="col-span-2 text-[9px] text-slate-500 text-center font-medium pt-1">
                                 Tip: Enter "Total Amount" to auto-calculate fractional quantity (e.g. Tingi)
                              </div>
                              <button onClick={closeEditMode} className="col-span-2 py-2 bg-[#6366f1] text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition">
                                Done
                              </button>
                           </div>
                         )}
                      </div>
                   ))
                )}
             </div>

          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/5 bg-[#0f172a] shrink-0">
             {/* ... Footer content remains the same ... */}
             
             {/* Print Toggle */}
             <div className="flex justify-between items-center mb-6 bg-[#1e293b] p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🖨️ Auto-Print Receipt</span>
                <div 
                  onClick={() => setPrintReceipt(!printReceipt)}
                  className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${printReceipt ? 'bg-[#6366f1]' : 'bg-slate-700'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${printReceipt ? 'translate-x-4' : ''}`} />
                </div>
             </div>

             <div className="space-y-1 mb-6">
                <div className="flex justify-between items-end px-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subtotal</p>
                    <p className="text-xs font-bold text-slate-300">₱{totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-white/10 px-1">
                    <p className="text-xs font-black text-white uppercase tracking-widest">Total Due</p>
                    <p className="text-3xl font-black text-white tracking-tighter">₱{finalAmountToPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                </div>
             </div>
             
             {limitExceeded && !isWalkIn && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3">
                   <span className="text-lg">⚠️</span>
                   <p className="text-[10px] text-rose-400 font-bold leading-tight">
                      Credit Limit Exceeded by ₱{(currentDebt + finalAmountToPay - (selectedCustomer?.creditLimit || 0)).toLocaleString()}. Admin approval required.
                   </p>
                </div>
             )}

             <div className="grid grid-cols-2 gap-3">
                {!isWalkIn && (
                   <button 
                     onClick={() => handleTransactionRequest(false)}
                     disabled={items.length === 0}
                     className="py-4 rounded-xl border border-slate-600 bg-transparent font-black uppercase text-[10px] tracking-widest text-slate-300 hover:bg-white/5 transition disabled:opacity-50"
                   >
                     Charge Debt
                   </button>
                )}
                <button 
                  onClick={() => handleTransactionRequest(true)}
                  disabled={items.length === 0}
                  className={`py-4 bg-[#6366f1] text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-[#4f46e5] active:scale-[0.98] transition disabled:opacity-50 ${isWalkIn ? 'col-span-2' : ''}`}
                >
                  {printReceipt ? 'Pay & Print' : 'Pay Cash'}
                </button>
             </div>
          </div>
        </div>
        
        {/* ... Overlays (Auth, Merge, Warnings) remain the same ... */}
        {showAuthPanel && (
            <div className="absolute inset-0 z-[120] bg-[#020617]/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in rounded-[2.5rem]">
              <div className="w-full max-w-sm text-center space-y-6">
                <div className="space-y-2">
                   <h2 className="text-white text-xl font-black uppercase tracking-tight">Admin Required</h2>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enter PIN to approve</p>
                </div>
                <div className="flex gap-4 justify-center">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className={`w-4 h-4 rounded-full border-2 border-rose-500 transition-all ${authPin.length > i ? 'bg-rose-500 scale-110 shadow-lg shadow-rose-500/50' : 'bg-transparent'} ${authError ? 'border-rose-600' : ''}`} />
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✕'].map(btn => (
                    <button key={btn} onClick={() => { if (btn === '✕') setShowAuthPanel(false); else if (btn === 'C') setAuthPin(''); else if (authPin.length < 4) setAuthPin(prev => prev + btn); }} className={`h-14 bg-white/5 text-white rounded-2xl text-lg font-black hover:bg-white/10 transition active:scale-95 ${btn === 'C' ? 'text-rose-500' : ''}`}>{btn}</button>
                  ))}
                </div>
                <button onClick={verifyAdminAuth} className="w-full py-4 bg-white text-[#0f172a] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition">Approve</button>
              </div>
            </div>
        )}

        {mergePrompt && (
            <div className="absolute inset-0 z-[135] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 rounded-[2.5rem]">
              <div className="text-center w-full max-w-xs">
                <div className="mb-6">
                   <h3 className="text-white text-xl font-black uppercase tracking-tight mb-2">Unpaid Balance</h3>
                   <p className="text-slate-400 text-xs font-bold uppercase">{mergePrompt.customerName}</p>
                   <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Existing Debt</p>
                   <p className="text-3xl font-black text-rose-500 tracking-tighter mt-1">₱{mergePrompt.existingAmount.toLocaleString()}</p>
                </div>
                
                <div className="space-y-3">
                  <button onClick={() => onMergeConfirm(false)} className="w-full py-4 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition">
                    Merge with Existing
                  </button>
                  <div className="flex items-center gap-4 px-2">
                     <div className="h-px bg-white/10 flex-1"></div>
                     <span className="text-[9px] text-slate-600 font-black uppercase">OR</span>
                     <div className="h-px bg-white/10 flex-1"></div>
                  </div>
                  <button onClick={() => onMergeConfirm(true)} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition border border-white/10">
                    Create New Invoice
                  </button>
                </div>
              </div>
            </div>
        )}

        {stockWarning && (
            <div className="absolute inset-0 z-[140] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 rounded-[2.5rem]">
              <div className="text-center w-full max-w-xs">
                <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto text-amber-500">⚠️</div>
                <h3 className="text-white text-xl font-black uppercase tracking-tight mb-2">Low Stock Warning</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">
                   <span className="text-white">{stockWarning.name}</span> only has <span className="text-amber-500">{stockWarning.stock}</span> units remaining.
                </p>
                <button onClick={() => setStockWarning(null)} className="w-full py-4 bg-white text-[#0f172a] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition">Understood</button>
              </div>
            </div>
        )}

        {customerNotFoundError && (
            <div className="absolute inset-0 z-[130] bg-[#020617]/98 backdrop-blur-md flex items-center justify-center p-6 animate-in zoom-in rounded-[2.5rem]">
              <div className="text-center w-full max-w-xs space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-3xl mb-2 mx-auto">👤</div>
                <h2 className="text-white text-xl font-black uppercase tracking-tight">Suki Not Found</h2>
                <p className="text-slate-400 text-xs font-medium">The customer you searched for is not in the database.</p>
                <div className="pt-2 space-y-3">
                   <button onClick={() => { onClose(); onRegisterCustomer?.(customerName); }} className="w-full py-4 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20">Register New</button>
                   <button onClick={() => setCustomerNotFoundError(false)} className="w-full py-4 bg-transparent text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white transition">Cancel</button>
                </div>
              </div>
            </div>
        )}

        {showExitConfirm && (
            <div className="absolute inset-0 z-[150] bg-[#020617]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in zoom-in-95 rounded-[2.5rem]">
              <div className="text-center w-full max-w-xs">
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center text-3xl mb-4 mx-auto text-rose-500">🗑️</div>
                <h3 className="text-white text-xl font-black uppercase tracking-tight mb-2">Discard Transaction?</h3>
                <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6">
                   You have unsaved items in your cart. Leaving now will lose this data.
                </p>
                <div className="space-y-3">
                   <button onClick={onClose} className="w-full py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 transition shadow-lg shadow-rose-500/20">
                     Discard & Exit
                   </button>
                   <button onClick={() => setShowExitConfirm(false)} className="w-full py-4 bg-white/5 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition border border-white/10">
                     Keep Editing
                   </button>
                </div>
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
