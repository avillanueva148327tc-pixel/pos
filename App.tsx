
import React, { useState, useEffect, useMemo } from 'react';
import { 
  InventoryItem, Customer, UtangRecord, AppSettings, BranchConfig, 
  UserRole, BatchRecord, Stats as StatsType, RecycleBinItem, ShiftRecord 
} from './types';
import LoginScreen from './components/LoginScreen';
import Stats from './components/Stats';
import AddDebtModal from './components/AddDebtModal';
import AddInventoryModal from './components/AddInventoryModal';
import AddCustomerModal from './components/AddCustomerModal';
import RecordDetailsModal from './components/RecordDetailsModal';
import ReceiptModal from './components/ReceiptModal';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import UserGuideModal from './components/UserGuideModal';
import BackupRestoreModal from './components/BackupRestoreModal';
import SyncDevicesModal from './components/SyncDevicesModal';
import HardwareSettingsModal from './components/HardwareSettingsModal';
import FinancialPulseModal from './components/FinancialPulseModal';
import ExpiryAlertBanner from './components/ExpiryAlertBanner';
import BatchHistoryModal from './components/BatchHistoryModal';
import AddBatchModal from './components/AddBatchModal';
import CustomerHistoryModal from './components/CustomerHistoryModal';
import CustomerQRModal from './components/CustomerQRModal';
import StockAdjustModal from './components/StockAdjustModal';
import ReminderModal from './components/ReminderModal';
import PartialPayModal from './components/PartialPayModal';
import ReportsTab from './components/InsightsTab';
import BulkUploadModal from './components/BulkUploadModal';
import ProductCatalogModal from './components/ProductCatalogModal';
import RecycleBinModal from './components/RecycleBinModal';
import ShiftModal from './components/ShiftModal';

import { SecurityService } from './services/securityService';
import { TransactionService } from './services/transactionService';
import { translations } from './translations';

const defaultBranch: BranchConfig = {
  name: "My Sari-Sari Store",
  address: "Local Barangay",
  contact: "09123456789"
};

const defaultSettings: AppSettings = {
  categories: ['Canned Goods', 'Snacks', 'Drinks', 'Toiletries', 'Others'],
  // Default Quick Picks for new users
  quickPicks: [
    { name: 'Ice Tubig', price: 3 },
    { name: 'Ice Yelo', price: 5 },
    { name: 'Load 10', price: 12 },
    { name: 'Load 20', price: 22 },
    { name: 'Gcash Cash In', price: 0 }, // 0 price means manual entry
    { name: 'Gcash Cash Out', price: 0 },
  ],
  expiryThresholdDays: 30,
  lowStockThreshold: 10,
  language: 'en',
  theme: 'dark',
  dailySalesTarget: 5000,
  autoPrintReceipt: false,
  requireAdminApproval: true,
  showFinancialPulseOnDashboard: true,
  auth: { adminPin: '1234', cashierPin: '0000' },
  receiptTemplate: {
    showBranchAddress: true,
    showBranchContact: true,
    showCustomerId: true,
    showItemSize: true,
    showDateTime: true,
    footerText: "Thank you for your purchase!",
    brandingText: "Sari-Sari Debt Pro",
    headerAlignment: 'center',
    paperWidth: '58mm',
    fontFamily: 'Inter',
    fontSize: 14,
    layout: 'modern',
    accentColor: '#6366f1'
  },
  uiCustomization: {
    fontFamily: 'Inter',
    fontSize: 'base',
    compactMode: false,
    deviceMode: 'desktop'
  }
};

const dummyTransaction: UtangRecord = {
  id: "sample-trx-123",
  customerName: "Suki Sample",
  product: "Sample Item 1, Sample Item 2",
  items: [
    { name: "Coke Sakto", quantity: 2, price: 15, date: new Date().toLocaleString() },
    { name: "Piattos 85g", quantity: 1, price: 52, date: new Date().toLocaleString() }
  ],
  quantity: 3,
  totalAmount: 82.00,
  paidAmount: 82.00,
  date: new Date().toLocaleString(),
  isPaid: true
};

const App: React.FC = () => {
  // --- STATE ---
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  
  // Data State
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [records, setRecords] = useState<UtangRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [branch, setBranch] = useState<BranchConfig>(defaultBranch);
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>([]);
  const [adminPinHash, setAdminPinHash] = useState('');
  
  // UI State
  const [activeTab, setActiveTab] = useState('pos');
  const [inventorySort, setInventorySort] = useState<'name' | 'stock-asc' | 'stock-desc' | 'price-desc' | 'price-asc'>('name');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(true);
  
  // Modals Visibility
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [showSync, setShowSync] = useState(false);
  const [showHardware, setShowHardware] = useState(false);
  const [showFinancialPulse, setShowFinancialPulse] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBatchHistory, setShowBatchHistory] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  
  // Selection & Action State
  const [selectedRecord, setSelectedRecord] = useState<UtangRecord | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<InventoryItem | null>(null);
  const [stockAdjustItem, setStockAdjustItem] = useState<InventoryItem | null>(null);
  const [customerToQR, setCustomerToQR] = useState<Customer | null>(null);
  const [recordToPrint, setRecordToPrint] = useState<UtangRecord | null>(null);
  const [recordForReceiptStudio, setRecordForReceiptStudio] = useState<UtangRecord | null>(null);

  // Prefill Data for Cross-Modal Flows
  const [inventoryPrefillName, setInventoryPrefillName] = useState<string>('');
  const [customerPrefillName, setCustomerPrefillName] = useState<string>('');

  // --- EFFECTS ---
  useEffect(() => {
    const loadData = async () => {
      setInventory(await SecurityService.secureLoad('inventory', []));
      setCustomers(await SecurityService.secureLoad('customers', []));
      setRecords(await SecurityService.secureLoad('records', []));
      setBatches(await SecurityService.secureLoad('batches', []));
      setRecycleBin(await SecurityService.secureLoad('recycleBin', []));
      setBranch(await SecurityService.secureLoad('branch', defaultBranch));
      
      const loadedShift = await SecurityService.secureLoad('activeShift', null);
      // Ensure date objects are parsed if needed, though secureLoad handles JSON parsing
      setActiveShift(loadedShift);
      setShiftHistory(await SecurityService.secureLoad('shiftHistory', []));

      // Smart Settings Load: Merge with defaults to ensure new fields (like uiCustomization) exist
      const loadedSettings = await SecurityService.secureLoad('settings', defaultSettings);
      setSettings({
        ...defaultSettings,
        ...loadedSettings,
        auth: { ...defaultSettings.auth, ...loadedSettings.auth },
        receiptTemplate: { ...defaultSettings.receiptTemplate, ...loadedSettings.receiptTemplate },
        uiCustomization: { ...defaultSettings.uiCustomization, ...loadedSettings.uiCustomization }
      });
    };
    loadData();
  }, []);

  useEffect(() => {
    if (userRole) {
       SecurityService.secureSave('inventory', inventory);
       SecurityService.secureSave('customers', customers);
       SecurityService.secureSave('records', records);
       SecurityService.secureSave('batches', batches);
       SecurityService.secureSave('recycleBin', recycleBin);
       SecurityService.secureSave('settings', settings);
       SecurityService.secureSave('branch', branch);
       SecurityService.secureSave('activeShift', activeShift);
       SecurityService.secureSave('shiftHistory', shiftHistory);
    }
  }, [inventory, customers, records, batches, recycleBin, settings, branch, activeShift, shiftHistory, userRole]);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Hash the admin pin when settings load/change
    const hashPin = async () => {
      if (settings.auth.adminPin) {
        setAdminPinHash(await SecurityService.hashPin(settings.auth.adminPin));
      }
    };
    hashPin();
  }, [settings.theme, settings.auth.adminPin]);

  // --- HANDLERS ---
  const handleLogin = async (pin: string) => {
    const cashierHash = await SecurityService.hashPin(settings.auth.cashierPin);
    const inputHash = await SecurityService.hashPin(pin);

    if (inputHash === adminPinHash) setUserRole('admin');
    else if (inputHash === cashierHash) setUserRole('cashier');
    else alert("Invalid PIN");
  };

  const handleTransaction = (data: any) => {
    const result = TransactionService.processTransaction(data, inventory, records, customers, settings);
    if (result.success) {
      setInventory(result.updatedInventory);
      setRecords(result.updatedRecords);
      
      // SHIFT LOGIC: Add Cash Sales to Active Shift
      if (activeShift && data.isPaid) {
         // Calculate actual cash paid (might be partial or full)
         const cashReceived = data.paidAmount || 0;
         setActiveShift(prev => prev ? ({
            ...prev,
            cashSales: prev.cashSales + cashReceived
         }) : null);
      }

      setShowAddDebt(false);
      if (result.shouldPrint && result.newRecord) {
        setRecordToPrint(result.newRecord);
      }
    } else {
      alert(result.error);
    }
  };

  const handleUpdateRecord = (id: string, updates: Partial<UtangRecord>) => {
    setRecords(prev => prev.map(r => {
        if (r.id === id) {
            // Check if payment was added to a debt
            if (activeShift && updates.paidAmount !== undefined && updates.paidAmount > r.paidAmount) {
                const addedCash = updates.paidAmount - r.paidAmount;
                setActiveShift(s => s ? ({ ...s, cashSales: s.cashSales + addedCash }) : null);
            }
            return { ...r, ...updates };
        }
        return r;
    }));
  };

  // --- SHIFT HANDLERS ---
  const handleOpenShift = (startingCash: number) => {
    const newShift: ShiftRecord = {
      id: crypto.randomUUID(),
      openedAt: new Date().toISOString(),
      openedBy: userRole || 'Unknown',
      startingCash,
      cashSales: 0,
      movements: [],
      expectedTotal: startingCash, // Initial expected
      status: 'open'
    };
    setActiveShift(newShift);
  };

  const handleAddMovement = (type: 'in' | 'out', amount: number, reason: string) => {
    if (!activeShift) return;
    const movement = { id: crypto.randomUUID(), type, amount, reason, timestamp: new Date().toISOString() };
    setActiveShift(prev => prev ? ({
        ...prev,
        movements: [...prev.movements, movement]
    }) : null);
  };

  const handleCloseShift = (actualCash: number, note: string) => {
    if (!activeShift) return;
    
    // Calculate final expected
    const added = activeShift.movements.filter(m => m.type === 'in').reduce((s, m) => s + m.amount, 0);
    const removed = activeShift.movements.filter(m => m.type === 'out').reduce((s, m) => s + m.amount, 0);
    const expected = activeShift.startingCash + activeShift.cashSales + added - removed;

    const closedShift: ShiftRecord = {
        ...activeShift,
        closedAt: new Date().toISOString(),
        closedBy: userRole || 'Unknown',
        expectedTotal: expected,
        actualTotal: actualCash,
        discrepancy: actualCash - expected,
        status: 'closed',
        note
    };

    setShiftHistory(prev => [...prev, closedShift]);
    setActiveShift(null);
    setShowShiftModal(false);
  };

  const handleAddInventory = (item: any) => {
    const newItem = { ...item, id: crypto.randomUUID() };
    setInventory(prev => [...prev, newItem]);
    setShowAddInventory(false);
    setInventoryPrefillName('');
  };

  const handleUpdateInventory = (item: any) => {
    setInventory(prev => prev.map(i => i.id === item.id ? { ...i, ...item } : i));
    setSelectedItemForEdit(null);
    setShowAddInventory(false);
  };

  // Soft Delete Logic
  const handleSoftDelete = (type: 'inventory' | 'customer' | 'record', data: any) => {
    const item: RecycleBinItem = {
      id: crypto.randomUUID(),
      type,
      data,
      deletedAt: new Date().toISOString(),
      originalName: type === 'record' ? `Trans: ${data.customerName} - ₱${data.totalAmount}` : data.name
    };
    setRecycleBin(prev => [item, ...prev]);
    
    if (type === 'inventory') setInventory(prev => prev.filter(i => i.id !== data.id));
    if (type === 'customer') setCustomers(prev => prev.filter(c => c.id !== data.id));
    if (type === 'record') setRecords(prev => prev.filter(r => r.id !== data.id));
  };

  const handleRestoreFromBin = (item: RecycleBinItem) => {
    if (item.type === 'inventory') {
        if (inventory.some(i => i.id === item.data.id)) {
            alert("Item with this ID already exists in active inventory.");
            return;
        }
        setInventory(prev => [...prev, item.data]);
    }
    if (item.type === 'customer') {
        if (customers.some(c => c.id === item.data.id)) {
            alert("Customer with this ID already exists.");
            return;
        }
        setCustomers(prev => [...prev, item.data]);
    }
    if (item.type === 'record') {
        if (records.some(r => r.id === item.data.id)) {
            alert("Transaction record already exists.");
            return;
        }
        setRecords(prev => [...prev, item.data]);
    }
    
    setRecycleBin(prev => prev.filter(i => i.id !== item.id));
  };

  const handlePermanentDelete = (id: string) => {
    setRecycleBin(prev => prev.filter(i => i.id !== id));
  };

  const handleEmptyBin = () => {
    setRecycleBin([]);
  };

  const handleDeleteInventory = (id: string) => {
    if (window.confirm("Move this item to Recycle Bin?")) {
      const item = inventory.find(i => i.id === id);
      if (item) handleSoftDelete('inventory', item);
      setSelectedItemForEdit(null);
      setShowAddInventory(false);
    }
  };

  const handleAddCustomer = (customer: any) => {
    setCustomers(prev => [...prev, { ...customer, id: crypto.randomUUID(), createdAt: new Date().toLocaleString() }]);
    setShowAddCustomer(false);
    setCustomerPrefillName('');
  };

  const handleStockAdjust = (id: string, newStock: number) => {
    setInventory(prev => prev.map(i => i.id === id ? { ...i, stock: newStock } : i));
    setStockAdjustItem(null);
  };

  const handleRestore = (data: any, mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      if (data.inventory) setInventory(data.inventory);
      if (data.customers) setCustomers(data.customers);
      if (data.records) setRecords(data.records);
      if (data.settings) setSettings(data.settings);
      if (data.shifts) setShiftHistory(data.shifts);
      if (data.branch) setBranch(data.branch);
    } else {
      // MERGE MODE - UPDATED LOGIC TO ALLOW UPDATES TO EXISTING ITEMS
      if (data.inventory) {
        setInventory(prev => {
            const next = [...prev];
            data.inventory.forEach((newItem: InventoryItem) => {
                // Robust Match: ID or Name+Barcode
                const existingIndex = next.findIndex(e => 
                    e.id === newItem.id || 
                    (e.name.toLowerCase() === newItem.name.toLowerCase() && (!newItem.barcode || e.barcode === newItem.barcode))
                );

                if (existingIndex >= 0) {
                    // Update existing item fields, preserving ID
                    next[existingIndex] = { ...next[existingIndex], ...newItem, id: next[existingIndex].id };
                } else {
                    // Add new item
                    next.push({ ...newItem, id: newItem.id || crypto.randomUUID() });
                }
            });
            return next;
        });
      }

      if (data.customers) {
        setCustomers(prev => {
            const next = [...prev];
            data.customers.forEach((newCust: Customer) => {
                const existingIndex = next.findIndex(c => c.id === newCust.id || c.name.toLowerCase() === newCust.name.toLowerCase());
                if (existingIndex >= 0) {
                    // Update existing customer
                    next[existingIndex] = { ...next[existingIndex], ...newCust, id: next[existingIndex].id };
                } else {
                    next.push({ ...newCust, id: newCust.id || crypto.randomUUID() });
                }
            });
            return next;
        });
      }

      if (data.records) {
         setRecords(prev => {
             // Records are strictly additive based on ID to avoid duplicate transactions
             const newRecords = data.records.filter((r: UtangRecord) => !prev.some(p => p.id === r.id));
             return [...prev, ...newRecords];
         });
      }

      if (data.shifts) {
         setShiftHistory(prev => {
             const newShifts = data.shifts.filter((s: ShiftRecord) => !prev.some(p => p.id === s.id));
             return [...prev, ...newShifts];
         });
      }
    }
  };

  // --- COMPUTED DATA ---
  const stats: StatsType = useMemo(() => {
    const unpaid = records.filter(r => !r.isPaid);
    const totalSales = records.filter(r => r.isPaid).reduce((sum, r) => sum + r.totalAmount, 0);
    // Simple mock stats for dashboard
    return {
      totalCount: records.length,
      totalAmount: records.reduce((s, r) => s + r.totalAmount, 0),
      unpaidTotal: unpaid.reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0),
      activeDebtors: new Set(unpaid.map(r => r.customerName)).size,
      lowStockCount: inventory.filter(i => i.stock <= i.reorderLevel).length,
      totalInventoryValue: inventory.reduce((s, i) => s + (i.stock * i.price), 0),
      totalInvestmentValue: inventory.reduce((s, i) => s + (i.stock * (i.originalPrice || 0)), 0),
      potentialProfit: inventory.reduce((s, i) => s + (i.stock * (i.price - (i.originalPrice || 0))), 0),
      dailySales: totalSales, // In a real app, filter by today
      monthlySales: totalSales,
      monthlyExpenses: batches.reduce((s, b) => s + b.totalCost, 0),
      monthlyNetProfit: totalSales - batches.reduce((s, b) => s + b.totalCost, 0),
    };
  }, [records, inventory, batches]);

  const filteredInventory = useMemo(() => {
    let sorted = [...inventory];
    if (searchQuery) {
       const lowerQuery = searchQuery.toLowerCase();
       sorted = sorted.filter(i => 
         i.name.toLowerCase().includes(lowerQuery) || 
         i.barcode?.toLowerCase().includes(lowerQuery) ||
         i.category?.toLowerCase().includes(lowerQuery)
       );
    }
    
    switch(inventorySort) {
       case 'name': return sorted.sort((a,b) => a.name.localeCompare(b.name));
       case 'stock-asc': return sorted.sort((a,b) => a.stock - b.stock);
       case 'stock-desc': return sorted.sort((a,b) => b.stock - a.stock);
       case 'price-asc': return sorted.sort((a,b) => a.price - b.price);
       case 'price-desc': return sorted.sort((a,b) => b.price - a.price);
       default: return sorted;
    }
  }, [inventory, inventorySort, searchQuery]);

  // --- RENDER ---
  if (!userRole) return <LoginScreen onLogin={handleLogin} />;

  const t = translations[settings.language] || translations.en;

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white font-${settings.uiCustomization.fontFamily} ${settings.theme === 'dark' ? 'dark' : ''}`}>
       {/* Nav */}
       <nav className="px-4 py-3 flex justify-between items-center bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-30 transition-all">
          <h1 className="text-xl font-black tracking-tighter">SARI-SARI <span className="text-[#6366f1]">DEBT PRO</span></h1>
          <div className="flex gap-2 items-center">
             <button 
               onClick={() => setShowShiftModal(true)} 
               className={`hidden md:flex px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition items-center gap-2 ${activeShift ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'}`}
             >
                <div className={`w-2 h-2 rounded-full ${activeShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                {activeShift ? 'Register Open' : 'Register Closed'}
             </button>
             <button onClick={() => setShowGuide(true)} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition">❓</button>
             <button onClick={() => setActiveTab('settings')} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-sm hover:bg-slate-200 dark:hover:bg-white/10 transition">⚙️</button>
             <button onClick={() => setUserRole(null)} className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase hover:bg-rose-500 hover:text-white transition">Logout</button>
          </div>
       </nav>

       <main className="p-4 max-w-7xl mx-auto pb-24">
          
          {/* Dashboard Notifications */}
          {showNotifications && (
            <ExpiryAlertBanner 
              expiringItems={inventory.filter(i => i.expiryDate && new Date(i.expiryDate) < new Date(Date.now() + settings.expiryThresholdDays * 86400000))} 
              lowStockItems={inventory.filter(i => i.stock <= i.reorderLevel)}
              threshold={settings.expiryThresholdDays}
              onViewDetails={() => setActiveTab('inventory')}
              onDismiss={() => setShowNotifications(false)}
            />
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
             {['pos', 'inventory', 'customers', 'records', 'reports', 'settings'].map(tab => (
               <button 
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border border-transparent ${activeTab === tab ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-[#1e293b] text-slate-500 border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
               >
                 {tab === 'pos' ? 'Dashboard' : tab}
               </button>
             ))}
          </div>

          {activeTab === 'pos' && (
             <div className="space-y-6">
                {settings.showFinancialPulseOnDashboard && (
                  <Stats stats={stats} userRole={userRole} />
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button onClick={() => setShowAddDebt(true)} className="bg-gradient-to-br from-[#6366f1] to-indigo-700 p-8 rounded-[2.5rem] text-white shadow-2xl hover:scale-[1.02] transition text-left relative overflow-hidden group col-span-2 ring-4 ring-[#6366f1]/20 border border-white/10">
                     <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform origin-left drop-shadow-md">🛒</span>
                     <h2 className="text-2xl font-black uppercase tracking-tight">New Transaction</h2>
                     <p className="text-xs opacity-70 mt-2 font-bold uppercase tracking-wider">Process Sales & Credits</p>
                  </button>
                  
                  <button onClick={() => setShowShiftModal(true)} className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-white/5 hover:border-emerald-500/50 hover:shadow-lg transition text-left group relative overflow-hidden">
                     {activeShift && <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-5 -mt-5 blur-xl"></div>}
                     <span className="text-3xl mb-2 block group-hover:scale-110 transition-transform origin-left">{activeShift ? '🟢' : '🔴'}</span>
                     <h2 className="text-lg font-black uppercase text-white">Cash Register</h2>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {activeShift ? `Open: ₱${activeShift.startingCash.toLocaleString()}` : 'Shift Closed'}
                     </p>
                  </button>
                </div>
             </div>
          )}

          {activeTab === 'inventory' && (
             <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#1e293b] p-4 rounded-3xl border border-white/5 shadow-sm">
                   <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                      <button onClick={() => setShowAddInventory(true)} className="px-5 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition whitespace-nowrap active:scale-95">+ Add Item</button>
                      <button onClick={() => setShowBatchModal(true)} className="px-5 py-3 bg-[#0f172a] text-white rounded-xl font-black text-[10px] uppercase border border-white/5 hover:bg-[#2d3748] transition whitespace-nowrap active:scale-95">Stock In</button>
                      <button onClick={() => setShowBulkUpload(true)} className="px-5 py-3 bg-[#0f172a] text-white rounded-xl font-black text-[10px] uppercase border border-white/5 hover:bg-[#2d3748] transition whitespace-nowrap active:scale-95">Bulk Import</button>
                   </div>
                   
                   <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="relative flex-1">
                        <input 
                           placeholder="Search Inventory..." 
                           className="w-full bg-[#0f172a] text-white text-xs font-bold px-4 pl-9 py-3 rounded-xl outline-none border border-white/5 focus:border-[#6366f1] transition"
                           value={searchQuery}
                           onChange={e => setSearchQuery(e.target.value)}
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
                      </div>
                      {/* Sorting Control */}
                      <div className="flex items-center gap-2 bg-white dark:bg-[#0f172a] p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shrink-0 h-[42px]">
                         <span className="text-[9px] font-black text-slate-400 uppercase pl-2">Sort:</span>
                         <select 
                           value={inventorySort} 
                           onChange={e => setInventorySort(e.target.value as any)}
                           className="bg-transparent text-xs font-bold text-slate-700 dark:text-white outline-none cursor-pointer pr-2"
                         >
                           <option value="name">Name (A-Z)</option>
                           <option value="stock-asc">Stock (Low → High)</option>
                           <option value="stock-desc">Stock (High → Low)</option>
                           <option value="price-desc">Price (High → Low)</option>
                           <option value="price-asc">Price (Low → High)</option>
                         </select>
                      </div>
                   </div>
                </div>

                {filteredInventory.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-20 opacity-60">
                      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-4 grayscale">
                         📦
                      </div>
                      <h3 className="text-white font-black text-lg uppercase">No Items Found</h3>
                      <p className="text-slate-400 text-xs mt-1">Try adjusting your search or add new stock.</p>
                      <button onClick={() => setSearchQuery('')} className="mt-4 px-4 py-2 bg-[#1e293b] text-white rounded-lg text-[10px] font-bold uppercase hover:bg-slate-700 transition">
                         Clear Filters
                      </button>
                   </div>
                ) : (
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {filteredInventory.map(item => (
                         <div key={item.id} className="p-4 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col gap-3 group hover:border-[#6366f1]/30 hover:shadow-lg transition relative overflow-hidden">
                            <div className="flex justify-between items-start">
                               <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-2 mb-1">
                                     <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-wider">
                                       {item.category || 'General'}
                                     </span>
                                     {item.stock <= item.reorderLevel && (
                                        <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-500 text-[9px] font-black uppercase tracking-wider animate-pulse">
                                          Low Stock
                                        </span>
                                     )}
                                  </div>
                                  <h4 className="font-black text-sm uppercase truncate text-slate-900 dark:text-white tracking-tight" title={item.name}>{item.name}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                     <p className="text-[10px] text-slate-500 font-bold uppercase">
                                        Stock: <span className={item.stock <= item.reorderLevel ? 'text-rose-500' : 'text-emerald-500'}>{item.stock} {item.unit}</span>
                                     </p>
                                     <span className="text-slate-700 dark:text-slate-600">•</span>
                                     <p className="text-[10px] text-slate-500 font-bold uppercase">
                                        Price: <span className="text-indigo-400">₱{item.price.toFixed(2)}</span>
                                     </p>
                                  </div>
                               </div>
                               <div className="flex flex-col gap-2 shrink-0">
                                  <button onClick={() => { setSelectedItemForEdit(item); setShowAddInventory(true); }} className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-[#6366f1] hover:text-white transition active:scale-90 text-sm">✏️</button>
                                  <button onClick={() => setStockAdjustItem(item)} className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center hover:bg-[#6366f1] hover:text-white transition active:scale-90 text-sm">🔢</button>
                               </div>
                            </div>
                            
                            {userRole === 'admin' && (
                               <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                     Cost: ₱{item.originalPrice?.toFixed(2) || '0.00'}
                                  </p>
                                  {item.price > 0 && (
                                     <p className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-lg">
                                        {(( (item.price - (item.originalPrice || 0)) / item.price ) * 100).toFixed(0)}% Margin
                                     </p>
                                  )}
                               </div>
                            )}
                         </div>
                      ))}
                   </div>
                )}
             </div>
          )}

          {activeTab === 'customers' && (
             <div className="space-y-6">
                <div className="flex justify-between items-center bg-[#1e293b] p-4 rounded-3xl border border-white/5 shadow-sm">
                   <button onClick={() => setShowAddCustomer(true)} className="px-6 py-3 bg-[#6366f1] text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition active:scale-95">+ New Suki</button>
                   <input 
                      placeholder="Search Customers..." 
                      className="w-64 bg-[#0f172a] text-white text-xs font-bold px-4 py-3 rounded-xl outline-none border border-white/5 focus:border-[#6366f1] transition"
                      onChange={(e) => { /* Implement search */ }}
                   />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                   {customers.map(cust => (
                      <div key={cust.id} className="p-5 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-white/5 relative group hover:border-[#6366f1]/30 hover:shadow-lg transition">
                         <div className="flex justify-between items-start mb-2">
                            <div>
                               <h4 className="font-black text-sm uppercase text-slate-900 dark:text-white tracking-tight">{cust.name}</h4>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{cust.department || 'Regular'}</p>
                            </div>
                            <button onClick={() => setCustomerToQR(cust)} className="text-xl opacity-50 hover:opacity-100 hover:scale-110 transition">🆔</button>
                         </div>
                         <div className="flex justify-between items-end mt-4">
                             <div>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Credit Limit</p>
                                <p className="text-xs font-black text-slate-900 dark:text-white">₱{(cust.creditLimit || 0).toLocaleString()}</p>
                             </div>
                             <button onClick={() => setSelectedCustomer(cust)} className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black uppercase text-slate-500 hover:text-white hover:bg-[#6366f1] transition active:scale-95">History</button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'records' && (
             <div className="space-y-6">
                <div className="bg-[#1e293b] p-4 rounded-3xl border border-white/5 shadow-sm">
                   <h3 className="text-white font-bold mb-2 ml-2">Recent Transactions</h3>
                </div>
                <div className="space-y-2">
                   {records.slice().reverse().slice(0, 50).map(record => (
                      <div key={record.id} onClick={() => setSelectedRecord(record)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 flex justify-between items-center cursor-pointer hover:border-[#6366f1]/50 hover:shadow-md transition">
                         <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-10 rounded-full ${record.isPaid ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                            <div>
                               <h4 className="font-black text-xs uppercase text-slate-900 dark:text-white">{record.customerName}</h4>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{record.date}</p>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-black text-sm text-slate-900 dark:text-white">₱{record.totalAmount.toFixed(2)}</p>
                            {!record.isPaid && <p className="text-[9px] font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded-md inline-block mt-1">Unpaid</p>}
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'reports' && (
             <ReportsTab records={records} inventory={inventory} />
          )}

          {activeTab === 'settings' && (
             <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 pb-20">
                 
                 {/* 1. Store Profile */}
                 <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><span className="text-xl">🏪</span> Store Profile</h3>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Store Name</label>
                          <input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-xl text-sm font-bold border border-slate-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition dark:text-white" value={branch.name} onChange={e => setBranch({...branch, name: e.target.value})} placeholder="My Sari-Sari Store" />
                       </div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address</label>
                              <input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-xl text-sm font-bold border border-slate-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition dark:text-white" value={branch.address} onChange={e => setBranch({...branch, address: e.target.value})} placeholder="Barangay..." />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Contact Number</label>
                              <input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-xl text-sm font-bold border border-slate-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition dark:text-white" value={branch.contact} onChange={e => setBranch({...branch, contact: e.target.value})} placeholder="0912..." />
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* 2. Preferences (Grid Layout) */}
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">App Preferences</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Theme */}
                        <div className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 flex flex-col justify-between h-full">
                          <div className="mb-2">
                              <span className="text-2xl mb-2 block">🎨</span>
                              <p className="font-bold text-xs dark:text-white">Appearance</p>
                          </div>
                          <div className="flex bg-slate-100 dark:bg-slate-700/50 p-1 rounded-lg">
                              <button onClick={() => setSettings({...settings, theme: 'light'})} className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase transition ${settings.theme === 'light' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>Light</button>
                              <button onClick={() => setSettings({...settings, theme: 'dark'})} className={`flex-1 py-1.5 rounded-md text-[10px] font-black uppercase transition ${settings.theme === 'dark' ? 'bg-slate-600 shadow-sm text-white' : 'text-slate-400'}`}>Dark</button>
                          </div>
                        </div>

                        {/* Auto Print */}
                        <div onClick={() => setSettings({...settings, autoPrintReceipt: !settings.autoPrintReceipt})} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 cursor-pointer hover:border-[#6366f1] transition group">
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-2xl">🖨️</span>
                              <div className={`w-8 h-5 rounded-full p-1 transition-colors ${settings.autoPrintReceipt ? 'bg-[#6366f1]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${settings.autoPrintReceipt ? 'translate-x-3' : ''}`} />
                              </div>
                          </div>
                          <p className="font-bold text-xs dark:text-white group-hover:text-[#6366f1] transition-colors">Auto-Print Receipt</p>
                          <p className="text-[10px] text-slate-400 mt-1">Print after checkout</p>
                        </div>

                        {/* Dashboard Pulse */}
                        <div onClick={() => setSettings({...settings, showFinancialPulseOnDashboard: !settings.showFinancialPulseOnDashboard})} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 cursor-pointer hover:border-[#6366f1] transition group">
                          <div className="flex justify-between items-start mb-2">
                              <span className="text-2xl">📊</span>
                              <div className={`w-8 h-5 rounded-full p-1 transition-colors ${settings.showFinancialPulseOnDashboard ? 'bg-[#6366f1]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${settings.showFinancialPulseOnDashboard ? 'translate-x-3' : ''}`} />
                              </div>
                          </div>
                          <p className="font-bold text-xs dark:text-white group-hover:text-[#6366f1] transition-colors">Dashboard Stats</p>
                          <p className="text-[10px] text-slate-400 mt-1">Show financial cards</p>
                        </div>
                    </div>
                 </div>

                 {/* 3. System Management */}
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">System Management</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button onClick={() => setShowHardware(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] hover:shadow-lg transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">🔌</span>
                          <p className="font-black text-xs uppercase dark:text-white">Hardware</p>
                          <p className="text-[10px] text-slate-400">Printers</p>
                        </button>
                        <button onClick={() => setShowSync(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] hover:shadow-lg transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">🔄</span>
                          <p className="font-black text-xs uppercase dark:text-white">Sync</p>
                          <p className="text-[10px] text-slate-400">Link Device</p>
                        </button>
                        <button onClick={() => setShowBackup(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] hover:shadow-lg transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">💾</span>
                          <p className="font-black text-xs uppercase dark:text-white">Backup</p>
                          <p className="text-[10px] text-slate-400">Save Data</p>
                        </button>
                        <button onClick={() => setShowRecycleBin(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-rose-500 hover:shadow-lg transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">♻️</span>
                          <p className="font-black text-xs uppercase dark:text-white">Recycle Bin</p>
                          <p className="text-[10px] text-slate-400">Restore</p>
                        </button>
                    </div>
                 </div>

                 {/* 4. Tools & Support */}
                 <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Tools & Support</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <button onClick={() => setShowFinancialPulse(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] hover:shadow-lg transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">📈</span>
                          <p className="font-black text-xs uppercase dark:text-white">Pulse</p>
                          <p className="text-[10px] text-slate-400">Analytics</p>
                        </button>
                        <button onClick={() => setShowCatalog(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] hover:shadow-lg transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">📋</span>
                          <p className="font-black text-xs uppercase dark:text-white">Catalog</p>
                          <p className="text-[10px] text-slate-400">Menu Maker</p>
                        </button>
                        <button onClick={() => setShowGuide(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] hover:shadow-lg transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">📚</span>
                          <p className="font-black text-xs uppercase dark:text-white">Guide</p>
                          <p className="text-[10px] text-slate-400">Help</p>
                        </button>
                        <button onClick={() => setShowSettings(true)} className="p-4 bg-slate-800 dark:bg-slate-200 rounded-2xl border border-transparent hover:shadow-xl transition text-left group">
                          <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">🛠️</span>
                          <p className="font-black text-xs uppercase text-white dark:text-slate-900">Advanced</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">System Config</p>
                        </button>
                    </div>
                 </div>

             </div>
          )}

       </main>

       {/* MODALS */}
       {showAddDebt && (
          <AddDebtModal 
            inventory={inventory} 
            customers={customers} 
            records={records}
            receiptTemplate={settings.receiptTemplate}
            branch={branch}
            adminPinHash={adminPinHash}
            quickPicks={settings.quickPicks}
            onUpdateQuickPicks={(picks) => setSettings({...settings, quickPicks: picks})}
            onAdd={handleTransaction}
            onUpdate={(id, updates) => handleUpdateRecord(id, updates)}
            onClose={() => setShowAddDebt(false)}
            onAddNewInventory={(name) => { 
                if (typeof name === 'string') {
                    setInventoryPrefillName(name);
                    setShowAddInventory(true);
                }
            }}
            onRegisterCustomer={(name) => { 
                setCustomerPrefillName(name);
                setShowAddCustomer(true);
            }}
          />
       )}

       {showAddInventory && (
          <AddInventoryModal 
             categories={settings.categories}
             defaultReorderLevel={settings.lowStockThreshold}
             onAdd={selectedItemForEdit ? handleUpdateInventory : handleAddInventory}
             onDelete={handleDeleteInventory}
             onClose={() => { setShowAddInventory(false); setSelectedItemForEdit(null); setInventoryPrefillName(''); }}
             item={selectedItemForEdit}
             initialName={inventoryPrefillName}
             userRole={userRole}
          />
       )}

       {showAddCustomer && (
          <AddCustomerModal 
             onAdd={handleAddCustomer}
             onClose={() => { setShowAddCustomer(false); setCustomerPrefillName(''); }}
             existingCustomers={customers}
             prefilledName={customerPrefillName}
          />
       )}

       {showSettings && (
          <AdvancedSettingsModal 
             settings={settings}
             setSettings={setSettings}
             onClose={() => setShowSettings(false)}
             onOpenReceiptStudio={() => { setShowSettings(false); setRecordForReceiptStudio(dummyTransaction); }}
          />
       )}

       {showCatalog && (
          <ProductCatalogModal
             inventory={inventory}
             branch={branch}
             onClose={() => setShowCatalog(false)}
          />
       )}

       {showBatchModal && (
          <AddBatchModal 
             inventory={inventory}
             onAddBatch={(b) => setBatches(prev => [...prev, { ...b, id: crypto.randomUUID() }])}
             onClose={() => setShowBatchModal(false)}
             onCreateNewItem={() => { /* logic */ }}
             userRole={userRole}
          />
       )}

       {showRecycleBin && (
          <RecycleBinModal 
             recycleBin={recycleBin}
             onRestore={handleRestoreFromBin}
             onPermanentDelete={handlePermanentDelete}
             onEmptyBin={handleEmptyBin}
             onClose={() => setShowRecycleBin(false)}
          />
       )}
       
       {showShiftModal && (
          <ShiftModal 
             activeShift={activeShift}
             shiftHistory={shiftHistory}
             onOpenShift={handleOpenShift}
             onCloseShift={handleCloseShift}
             onAddMovement={handleAddMovement}
             onClose={() => setShowShiftModal(false)}
             userRole={userRole}
          />
       )}

       {showGuide && <UserGuideModal onClose={() => setShowGuide(false)} />}
       {showBackup && (
          <BackupRestoreModal 
             inventory={inventory} customers={customers} records={records} settings={settings} branch={branch} shiftHistory={shiftHistory}
             onClose={() => setShowBackup(false)}
             onRestore={handleRestore}
          />
       )}
       {showSync && (
          <SyncDevicesModal 
             onClose={() => setShowSync(false)}
             onRestore={handleRestore}
             currentData={{ inventory, customers, records, settings, branch }}
          />
       )}
       {showHardware && <HardwareSettingsModal onClose={() => setShowHardware(false)} />}
       {showFinancialPulse && <FinancialPulseModal stats={stats} onClose={() => setShowFinancialPulse(false)} userRole={userRole}/>}
       {showBulkUpload && <BulkUploadModal categories={settings.categories} onAdd={(items) => { /* Bulk add logic */ setShowBulkUpload(false); }} onClose={() => setShowBulkUpload(false)} />}

       {/* Item/Record Modals */}
       {selectedRecord && !showReceipt && (
          <RecordDetailsModal 
             record={selectedRecord}
             onClose={() => setSelectedRecord(null)}
             isAdmin={userRole === 'admin'}
             onAction={(action, rec) => {
                if (action === 'receipt') { setShowReceipt(true); }
                if (action === 'customize') { setSelectedRecord(null); setRecordForReceiptStudio(rec); }
                if (action === 'delete') {
                    if(window.confirm('Delete this record?')) {
                        handleSoftDelete('record', rec);
                        setSelectedRecord(null);
                    }
                }
                // Handle other actions like payFull, partial logic would be here
             }}
          />
       )}

       {selectedRecord && showReceipt && (
          <ReceiptModal 
             transaction={selectedRecord}
             branch={branch}
             receiptTemplate={settings.receiptTemplate}
             onClose={() => setShowReceipt(false)}
          />
       )}
       
       {recordToPrint && (
          <ReceiptModal 
             transaction={recordToPrint}
             branch={branch}
             receiptTemplate={settings.receiptTemplate}
             onClose={() => setRecordToPrint(null)}
             autoPrint={true}
          />
       )}

       {recordForReceiptStudio && (
          <ReceiptModal
            isPreview={true}
            transaction={recordForReceiptStudio}
            branch={branch}
            receiptTemplate={settings.receiptTemplate}
            onClose={() => setRecordForReceiptStudio(null)}
            onUpdateSettings={(key, value) => {
              setSettings(prev => ({
                ...prev,
                receiptTemplate: {
                  ...prev.receiptTemplate,
                  [key]: value
                }
              }));
            }}
          />
       )}

       {stockAdjustItem && (
          <StockAdjustModal 
             item={stockAdjustItem}
             onAdjust={handleStockAdjust}
             onClose={() => setStockAdjustItem(null)}
             userRole={userRole}
          />
       )}

       {customerToQR && (
          <CustomerQRModal 
             customer={customerToQR}
             branch={branch}
             onClose={() => setCustomerToQR(null)}
          />
       )}
       
       {selectedCustomer && (
          <CustomerHistoryModal 
             customer={selectedCustomer}
             records={records}
             onClose={() => setSelectedCustomer(null)}
             onViewRecord={(r) => { setSelectedCustomer(null); setSelectedRecord(r); }}
             onDelete={() => {
                if(window.confirm('Delete this customer profile?')) {
                   handleSoftDelete('customer', selectedCustomer);
                   setSelectedCustomer(null);
                }
             }}
             isAdmin={userRole === 'admin'}
          />
       )}

    </div>
  );
};

export default App;
