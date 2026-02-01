
import React, { useState, useEffect, useMemo } from 'react';
import { 
  InventoryItem, Customer, UtangRecord, BatchRecord, AppSettings, BranchConfig, UserRole, Stats as StatsType, UtangItem, QuickPickItem 
} from './types';
import LoginScreen from './components/LoginScreen';
// Stats import is now used inside FinancialPulseModal, but we calculate stats here.
import Stats from './components/Stats';
import AddDebtModal from './components/AddDebtModal';
import AddInventoryModal from './components/AddInventoryModal';
import AddBatchModal from './components/AddBatchModal';
import BatchHistoryModal from './components/BatchHistoryModal';
import BulkUploadModal from './components/BulkUploadModal';
import StockAdjustModal from './components/StockAdjustModal';
import RecordDetailsModal from './components/RecordDetailsModal';
import AddCustomerModal from './components/AddCustomerModal';
import CustomerQRModal from './components/CustomerQRModal';
import CustomerHistoryModal from './components/CustomerHistoryModal';
import ReceiptModal from './components/ReceiptModal';
import PartialPayModal from './components/PartialPayModal';
import ReminderModal from './components/ReminderModal';
import ExpiryAlertBanner from './components/ExpiryAlertBanner';
import ReportsTab from './components/InsightsTab';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import BackupRestoreModal from './components/BackupRestoreModal';
import UserGuideModal from './components/UserGuideModal';
import SyncDevicesModal from './components/SyncDevicesModal';
import AdminPINModal from './components/AdminPINModal';
import ConfirmModal from './components/ConfirmModal';
import BarcodeScanner, { ScanResultStatus } from './components/BarcodeScanner';
import FinancialPulseModal from './components/FinancialPulseModal';
import HardwareSettingsModal from './components/HardwareSettingsModal';
import { translations } from './translations';
import { SecurityService } from './services/securityService';
import { TransactionService } from './services/transactionService';

const DEFAULT_BRANCH: BranchConfig = {
  name: "My Sari-Sari Store",
  address: "Barangay Hall St.",
  contact: "0912-345-6789",
  logoUrl: ""
};

const DEFAULT_SETTINGS: AppSettings = {
  categories: ["Canned Goods", "Beverages", "Snacks", "Condiments", "Toiletries", "Others"],
  quickPicks: [
    { name: 'Ice Tubig', price: 3 },
    { name: 'Ice Candy', price: 5 },
    { name: 'Yosi', price: 10 }
  ],
  expiryThresholdDays: 30,
  lowStockThreshold: 5,
  language: 'en',
  theme: 'dark', 
  dailySalesTarget: 5000, 
  autoPrintReceipt: false,
  requireAdminApproval: true,
  showFinancialPulseOnDashboard: false,
  auth: { adminPin: "1234", cashierPin: "0000" },
  receiptTemplate: {
    showBranchAddress: true,
    showBranchContact: true,
    showCustomerId: true,
    showItemSize: true,
    showDateTime: true,
    footerText: "Thank you for buying!",
    brandingText: "Powered by Sari-Sari Debt Pro",
    headerAlignment: "center",
    paperWidth: "58mm",
    fontFamily: "Inter",
    fontSize: 12,
    headerFontSize: 18,
    itemFontSize: 12,
    layout: "classic",
    accentColor: "#6366f1"
  },
  uiCustomization: {
    fontFamily: 'Inter',
    fontSize: 'base',
    compactMode: false,
    deviceMode: 'desktop'
  }
};

const MOCK_PREVIEW_RECORD: UtangRecord = {
  id: "PREVIEW-REF-001",
  customerName: "Sample Customer",
  date: new Date().toLocaleString(),
  product: "Corned Beef, Rice 1kg",
  items: [
    { name: "Corned Beef 150g", quantity: 2, price: 45, date: "", unit: "pc" },
    { name: "Rice 1kg", quantity: 1, price: 50, date: "", unit: "kg" }
  ],
  quantity: 3,
  totalAmount: 140,
  paidAmount: 140,
  isPaid: true
};

export default function App() {
  // --- STATE DEFINITIONS ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('cashier');
  
  // Data
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [records, setRecords] = useState<UtangRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [branch, setBranch] = useState<BranchConfig>(DEFAULT_BRANCH);

  // Computed Hashes for Auth
  const [adminPinHash, setAdminPinHash] = useState('');

  // UI State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [showExpiryAlert, setShowExpiryAlert] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [inventoryFilter, setInventoryFilter] = useState<'all' | 'low-stock'>('all'); 
  const [inventorySort, setInventorySort] = useState<'name' | 'stock-asc' | 'stock-desc' | 'price-asc' | 'price-desc'>('name');
  const [debtTabFilter, setDebtTabFilter] = useState<'registered' | 'walkin'>('registered'); 
  
  // Pagination State for Performance
  const [visibleItemsCount, setVisibleItemsCount] = useState(20);

  // Modals
  const [showDebtModal, setShowDebtModal] = useState(false); // Main POS
  const [posInitialCustomer, setPosInitialCustomer] = useState<Customer | null>(null);
  const [posInitialItem, setPosInitialItem] = useState<InventoryItem | null>(null);

  const [showAddInventory, setShowAddInventory] = useState<{ isOpen: boolean; item?: InventoryItem | null; initialBarcode?: string }>({ isOpen: false });
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBatchHistory, setShowBatchHistory] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showStockAdjust, setShowStockAdjust] = useState<InventoryItem | null>(null);
  const [showRecordDetails, setShowRecordDetails] = useState<UtangRecord | null>(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [prefilledCustomerName, setPrefilledCustomerName] = useState('');
  const [showCustomerQR, setShowCustomerQR] = useState<Customer | null>(null);
  const [showCustomerHistory, setShowCustomerHistory] = useState<Customer | { name: string, isWalkIn: boolean } | null>(null);
  const [showReceipt, setShowReceipt] = useState<{record: UtangRecord, autoPrint: boolean, editMode?: boolean} | null>(null);
  const [showPartialPay, setShowPartialPay] = useState<UtangRecord | null>(null);
  const [showReminder, setShowReminder] = useState<UtangRecord | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showBackupRestore, setShowBackupRestore] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showSync, setShowSync] = useState(false);
  
  // Updated showConfirm to support custom labels
  const [showConfirm, setShowConfirm] = useState<{ 
    title: string, 
    message: string, 
    onConfirm: () => void,
    confirmLabel?: string, 
    cancelLabel?: string,
    isDanger?: boolean 
  } | null>(null);

  const [showAdminAuth, setShowAdminAuth] = useState<{ onVerify: () => void } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showFinancialPulse, setShowFinancialPulse] = useState(false);
  const [showHardwareSettings, setShowHardwareSettings] = useState(false);

  // --- EFFECTS (Load/Save) ---
  useEffect(() => {
    // Load SECURELY from localStorage using SecurityService
    const initData = async () => {
        try {
            setInventory(await SecurityService.secureLoad('inventory', []));
            setCustomers(await SecurityService.secureLoad('customers', []));
            setRecords(await SecurityService.secureLoad('records', []));
            setBatches(await SecurityService.secureLoad('batches', []));
            setSettings(await SecurityService.secureLoad('settings', DEFAULT_SETTINGS));
            setBranch(await SecurityService.secureLoad('branch', DEFAULT_BRANCH));
        } catch (e) {
            console.error("Failed to load secure data", e);
        }
    };
    initData();
  }, []);

  useEffect(() => {
    // Clock Timer
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
        // Save SECURELY to localStorage
        // We use fire-and-forget here, but in a real app might want debounce or queue
        const saveData = async () => {
            await SecurityService.secureSave('inventory', inventory);
            await SecurityService.secureSave('customers', customers);
            await SecurityService.secureSave('records', records);
            await SecurityService.secureSave('batches', batches);
            await SecurityService.secureSave('settings', settings);
            await SecurityService.secureSave('branch', branch);
        };
        saveData();
    }
  }, [inventory, customers, records, batches, settings, branch, isAuthenticated]);

  useEffect(() => {
    SecurityService.hashPin(settings.auth.adminPin).then(setAdminPinHash);
  }, [settings.auth.adminPin]);

  // Theme Effect
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Reset pagination when search changes
  useEffect(() => {
    setVisibleItemsCount(20);
  }, [searchTerm, selectedCategory, inventoryFilter, inventorySort]);

  // --- COMPUTED ---
  const t = translations[settings.language] || translations.en;
  
  const expiringItems = useMemo(() => {
    const today = new Date();
    const threshold = new Date();
    threshold.setDate(today.getDate() + settings.expiryThresholdDays);
    
    return inventory.filter(i => {
       if (!i.expiryDate) return false;
       const exp = new Date(i.expiryDate);
       return exp <= threshold && exp >= new Date(new Date().setDate(today.getDate() - 1)); // Don't show super old expired stuff, just approaching or recently expired
    });
  }, [inventory, settings.expiryThresholdDays]);

  const lowStockItems = useMemo(() => {
    return inventory.filter(i => i.stock <= i.reorderLevel);
  }, [inventory]);

  const stats: StatsType = useMemo(() => {
    const totalCount = records.length;
    const totalAmount = records.reduce((sum, r) => sum + r.totalAmount, 0);
    const paidTotal = records.reduce((sum, r) => sum + r.paidAmount, 0);
    const unpaidTotal = totalAmount - paidTotal;
    const activeDebtors = new Set(records.filter(r => !r.isPaid).map(r => r.customerName)).size;
    
    const lowStockCount = lowStockItems.length;
    const totalInventoryValue = inventory.reduce((sum, i) => sum + (i.stock * i.price), 0);
    const totalInvestmentValue = inventory.reduce((sum, i) => sum + (i.stock * (i.originalPrice || 0)), 0);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const todayStr = now.toLocaleDateString();

    const monthlyRecs = records.filter(r => {
        const d = new Date(r.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const dailySales = records.filter(r => new Date(r.date).toLocaleDateString() === todayStr).reduce((sum, r) => sum + r.paidAmount, 0);
    const monthlySales = monthlyRecs.reduce((sum, r) => sum + r.paidAmount, 0);
    
    const monthlyExpenses = batches.filter(b => {
        const d = new Date(b.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).reduce((sum, b) => sum + b.totalCost, 0);

    return {
       totalCount, totalAmount, unpaidTotal, activeDebtors, lowStockCount, 
       totalInventoryValue, totalInvestmentValue, 
       potentialProfit: totalInventoryValue - totalInvestmentValue,
       dailySales, monthlySales, monthlyExpenses, 
       monthlyNetProfit: monthlySales - monthlyExpenses
    };
  }, [records, inventory, batches, lowStockItems]);

  // Goal Progress
  const goalProgress = useMemo(() => {
    if (!settings.dailySalesTarget) return 0;
    return Math.min(100, (stats.dailySales / settings.dailySalesTarget) * 100);
  }, [stats.dailySales, settings.dailySalesTarget]);

  // Debt Aging Logic
  const getDebtAgeDays = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 0;
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
  };

  const notificationCount = stats.lowStockCount + expiringItems.length;

  // --- HANDLERS ---
  const handleLogin = async (pin: string) => {
    const inputHash = await SecurityService.hashPin(pin);
    const adminHash = await SecurityService.hashPin(settings.auth.adminPin);

    if (inputHash === adminHash) {
        setCurrentUserRole('admin');
        setIsAuthenticated(true);
    } else if (pin === settings.auth.cashierPin) {
        setCurrentUserRole('cashier');
        setIsAuthenticated(true);
    } else {
        alert("Invalid PIN");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('dashboard');
  };

  // Helper to enforce admin access
  const requireAdmin = (action: () => void) => {
    if (currentUserRole === 'admin') {
      action();
    } else {
      setShowAdminAuth({ onVerify: action });
    }
  };

  const handleAddDebt = (recordData: any) => {
     // Delegate complex logic to TransactionService (Stored Procedure pattern)
     const result = TransactionService.processTransaction(
        recordData,
        inventory,
        records,
        customers,
        settings
     );

     if (result.success) {
        setInventory(result.updatedInventory);
        setRecords(result.updatedRecords);
        
        // Handle Post-Transaction Printing
        const { shouldPrint } = recordData;
        if ((shouldPrint || settings.autoPrintReceipt) && result.newRecord) {
            // Case 1: Explicitly requested print via button OR Auto-Print setting
            setShowReceipt({ record: result.newRecord, autoPrint: true });
        } else if (result.newRecord) {
            // Case 2: Silent success (e.g., Charge Debt or Pay Cash w/o print)
            // User requested to allow printing after success even if not auto-selected
            setShowConfirm({
               title: "Transaction Saved",
               message: "Would you like to print a receipt for this transaction?",
               confirmLabel: "Print Receipt",
               cancelLabel: "Done",
               isDanger: false,
               onConfirm: () => {
                  setShowReceipt({ record: result.newRecord!, autoPrint: false });
                  setShowConfirm(null);
               }
            });
        }
     } else {
        alert(result.error || "Transaction Failed");
     }
  };

  const handleDeleteInventory = (id: string) => {
      // 1. First trigger Confirmation Dialog
      setShowConfirm({
        title: "Delete Item",
        message: "Are you sure you want to permanently delete this inventory item?",
        onConfirm: () => {
             // 2. On Confirm, execute logic with Admin Check
             const executeDelete = () => {
                setInventory(inventory.filter(i => i.id !== id));
                setEditingItem(null);
                setShowAddInventory({ isOpen: false });
                setShowAdminAuth(null);
                setShowConfirm(null); 
             };

             if (currentUserRole !== 'admin') {
                setShowAdminAuth({ onVerify: executeDelete });
             } else {
                executeDelete();
             }
        }
      });
  };

  const handleDeleteCustomer = (id: string) => {
      // 1. First trigger Confirmation Dialog
      setShowConfirm({
        title: "Delete Customer",
        message: "Are you sure you want to delete this customer? This action cannot be undone.",
        onConfirm: () => {
           // 2. On Confirm, execute logic
           const executeDelete = () => {
               setCustomers(customers.filter(c => c.id !== id));
               setShowCustomerHistory(null);
               setShowConfirm(null);
               setShowAdminAuth(null);
           };
           
           if (currentUserRole !== 'admin') {
               setShowAdminAuth({ onVerify: executeDelete });
           } else {
               executeDelete();
           }
        }
      });
  };

  const handleAddBatch = (batch: Omit<BatchRecord, 'id'>) => {
      const newBatch = { ...batch, id: crypto.randomUUID() };
      setBatches([...batches, newBatch]);
      
      const newInventory = [...inventory];
      batch.items.forEach(bItem => {
          if (bItem.productId) {
              const idx = newInventory.findIndex(i => i.id === bItem.productId);
              if (idx >= 0) {
                  // Create new object to avoid state mutation
                  newInventory[idx] = {
                      ...newInventory[idx],
                      stock: newInventory[idx].stock + bItem.quantity,
                      // Update cost price if provided (Last Purchase Price strategy)
                      originalPrice: bItem.costPerUnit > 0 ? bItem.costPerUnit : newInventory[idx].originalPrice
                  };
              }
          }
      });
      setInventory(newInventory);
  };

  const handleRestore = (data: any, mode: 'merge' | 'replace') => {
      if (mode === 'replace') {
          if (data.inventory) setInventory(data.inventory);
          if (data.customers) setCustomers(data.customers);
          if (data.records) setRecords(data.records);
          if (data.settings) setSettings(data.settings);
          if (data.branch) setBranch(data.branch);
      } else {
          if (data.inventory) {
             const combined = [...inventory];
             data.inventory.forEach((ni: any) => {
                const exists = combined.findIndex(i => i.name === ni.name);
                if (exists >= 0) {
                    // Smart Merge: Accumulate stock, update pricing/details if changed in CSV
                    combined[exists] = { 
                        ...combined[exists], 
                        stock: combined[exists].stock + (ni.stock || 0),
                        price: ni.price !== undefined ? ni.price : combined[exists].price,
                        originalPrice: ni.originalPrice !== undefined ? ni.originalPrice : combined[exists].originalPrice,
                        category: ni.category || combined[exists].category,
                        barcode: ni.barcode || combined[exists].barcode
                    };
                } else {
                    combined.push(ni);
                }
             });
             setInventory(combined);
          }
          if (data.customers) {
             // Prevent duplicate customers
             const newCustomers = data.customers.filter((nc: any) => !customers.some(c => c.name === nc.name));
             setCustomers([...customers, ...newCustomers]);
          }
          if (data.records) {
             // Prevent duplicate records (by ID)
             const newRecords = data.records.filter((nr: any) => !records.some(r => r.id === nr.id));
             setRecords([...records, ...newRecords]);
          }
      }
  };

  // --- RENDER ---
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }
  
  // Inventory Filtering & Sorting
  const filteredInventory = inventory.filter(i => {
    // 1. Category Filter
    if (selectedCategory !== 'All' && i.category !== selectedCategory) return false;
    
    // 2. Low Stock Filter
    if (inventoryFilter === 'low-stock') {
        if (i.stock > i.reorderLevel) return false;
    }

    // 3. Search Term
    if (!searchTerm) return true;
    
    const lowerSearch = searchTerm.toLowerCase();
    return i.name.toLowerCase().includes(lowerSearch) || 
           (i.barcode && i.barcode.includes(lowerSearch));
  });

  const sortedInventory = [...filteredInventory].sort((a, b) => {
      switch (inventorySort) {
          case 'name': return a.name.localeCompare(b.name);
          case 'stock-asc': return a.stock - b.stock;
          case 'stock-desc': return b.stock - a.stock;
          case 'price-asc': return a.price - b.price;
          case 'price-desc': return b.price - a.price;
          default: return 0;
      }
  });

  const displayedInventory = sortedInventory.slice(0, visibleItemsCount);

  // Device Mode Logic
  const deviceMode = settings.uiCustomization.deviceMode || 'desktop';
  const deviceConstraints = {
    mobile: 'max-w-[430px] mx-auto border-x border-slate-200 dark:border-white/5 shadow-2xl',
    tablet: 'max-w-[840px] mx-auto border-x border-slate-200 dark:border-white/5 shadow-2xl',
    desktop: 'w-full'
  }[deviceMode];

  return (
    <div className={`min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-white font-sans transition-colors duration-300 ${settings.uiCustomization.compactMode ? 'text-sm' : ''}`} style={{ fontFamily: settings.uiCustomization.fontFamily }}>
      
      {/* Device Mode Wrapper */}
      <div className={`min-h-screen bg-inherit transition-all duration-300 flex flex-col ${deviceConstraints}`}>
        
        {/* Navbar */}
        <nav className="sticky top-0 z-40 bg-white/80 dark:bg-[#0f172a]/90 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-4 md:px-6 h-16 flex items-center justify-between shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#6366f1] rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/30 text-white">🏪</div>
              <h1 className="text-lg font-black tracking-tight hidden md:block uppercase text-slate-900 dark:text-white">{branch.name}</h1>
           </div>
           
           <div className="flex items-center gap-2">
              <button onClick={() => setShowScanner(true)} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-[#6366f1] transition shadow-sm text-xl" title="Scan ID or Item">📷</button>
              
              <button 
                onClick={() => setShowExpiryAlert(!showExpiryAlert)} 
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-amber-500 transition shadow-sm text-xl relative"
                title="Notifications"
              >
                🔔
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-[#0f172a]">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              <span className="text-[10px] font-black uppercase bg-slate-100 dark:bg-white/10 px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-300">{currentUserRole}</span>
              <button onClick={() => setShowUserGuide(true)} className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 flex items-center justify-center">❓</button>
              <button onClick={handleLogout} className="w-10 h-10 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center transition">🚪</button>
           </div>
        </nav>

        {/* Main Layout */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 mb-20 md:mb-0">
          
          {showExpiryAlert && (
              <ExpiryAlertBanner 
                expiringItems={expiringItems} 
                lowStockItems={lowStockItems}
                threshold={settings.expiryThresholdDays} 
                onViewDetails={() => { setActiveTab('inventory'); setInventoryFilter('all'); }}
                onDismiss={() => setShowExpiryAlert(false)} 
              />
          )}

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto gap-2 md:gap-4 mb-6 pb-2 md:pb-0 no-scrollbar">
             {['dashboard', 'inventory', 'debt', 'customers', 'insights', 'settings'].map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/20 scale-105' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-white/5'}`}
                >
                  {t[tab as keyof typeof t] || tab}
                </button>
             ))}
          </div>

          {/* ... (DASHBOARD) ... */}
          {activeTab === 'dashboard' && (
             <div className="animate-in fade-in duration-500 space-y-6">
                {/* ... existing dashboard content ... */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 px-1">
                   <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Dashboard</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">Store Overview</p>
                   </div>
                   <div className="bg-white dark:bg-[#1e293b] px-5 py-3 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm flex flex-col items-end">
                      <span className="text-xl font-black text-[#6366f1] font-mono leading-none">
                         {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                         {currentTime.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                   </div>
                </div>

                {settings.showFinancialPulseOnDashboard && (
                   <div className="animate-in slide-in-from-top-4">
                      <Stats stats={stats} userRole={currentUserRole} />
                   </div>
                )}

                {/* Sales Goal Widget */}
                {settings.dailySalesTarget > 0 && (
                  <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
                     {/* ... (Goal widget content) ... */}
                     <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-[#6366f1]/5 opacity-0 group-hover:opacity-100 transition duration-700"></div>
                     <div className="flex justify-between items-end mb-3 relative z-10">
                        <div>
                           <div className="flex items-center gap-2 mb-1">
                              <span className="text-2xl">🎯</span>
                              <h3 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-wider">Daily Goal</h3>
                           </div>
                           <p className="text-[10px] font-bold text-slate-400 uppercase">Target: ₱{settings.dailySalesTarget.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                           <span className={`text-2xl font-black ${goalProgress >= 100 ? 'text-emerald-500' : 'text-[#6366f1]'}`}>
                              {goalProgress.toFixed(0)}%
                           </span>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">₱{stats.dailySales.toLocaleString()} Earned</p>
                        </div>
                     </div>
                     <div className="h-4 bg-slate-100 dark:bg-black/20 rounded-full overflow-hidden relative z-10 border border-slate-100 dark:border-white/5">
                        <div 
                           className={`h-full rounded-full transition-all duration-1000 ease-out ${goalProgress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-indigo-400 to-purple-600'}`}
                           style={{ width: `${goalProgress}%` }}
                        >
                           {goalProgress >= 100 && (
                              <div className="w-full h-full flex items-center justify-center">
                                 <div className="w-full h-full bg-white/20 animate-pulse"></div>
                              </div>
                           )}
                        </div>
                     </div>
                     {goalProgress >= 100 && (
                        <div className="absolute top-2 right-2 text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-1 rounded-lg animate-bounce">
                           GOAL REACHED! 🎉
                        </div>
                     )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <button onClick={() => { setPosInitialCustomer(null); setPosInitialItem(null); setShowDebtModal(true); }} className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-left text-white shadow-2xl shadow-indigo-500/30 hover:scale-[1.02] transition active:scale-95 flex flex-col justify-between group relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                      <span className="text-4xl bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm">🛒</span>
                      <div>
                          <h3 className="text-2xl font-black uppercase tracking-tight">New Transaction</h3>
                          <p className="text-xs font-bold opacity-80 uppercase tracking-widest mt-1">POS Terminal</p>
                      </div>
                   </button>

                   <div className="h-40 bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-200 dark:border-white/5 p-6 flex items-center justify-center gap-4">
                      <button onClick={() => { setActiveTab('inventory'); setEditingItem(null); setShowAddInventory({ isOpen: true }); }} className="flex-1 h-full bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition group border border-emerald-100 dark:border-emerald-500/20">
                         <span className="text-2xl group-hover:scale-110 transition">📦</span>
                         <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Add Stock</span>
                      </button>
                      <button onClick={() => { setActiveTab('customers'); setShowAddCustomer(true); }} className="flex-1 h-full bg-amber-50 dark:bg-amber-500/10 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition group border border-amber-100 dark:border-amber-500/20">
                         <span className="text-2xl group-hover:scale-110 transition">👤</span>
                         <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400">Add Suki</span>
                      </button>
                   </div>
                </div>
             </div>
          )}

          {/* ... (INVENTORY) ... */}
          {activeTab === 'inventory' && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                
                {/* 1. Category and Low Stock Filters */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-4 px-4 md:mx-0 md:px-0 w-full md:w-auto">
                      <button onClick={() => { setSelectedCategory('All'); setInventoryFilter('all'); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === 'All' && inventoryFilter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'}`}>All Items</button>
                      
                      <button 
                        onClick={() => setInventoryFilter(inventoryFilter === 'low-stock' ? 'all' : 'low-stock')} 
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${inventoryFilter === 'low-stock' ? 'bg-rose-500 text-white border-transparent shadow-lg shadow-rose-500/30' : 'bg-white dark:bg-[#1e293b] text-rose-500 border-rose-200 dark:border-rose-900/30 hover:bg-rose-50'}`}
                      >
                        ⚠️ Low Stock Only
                      </button>

                      {settings.categories.map(cat => (
                        <button key={cat} onClick={() => { setSelectedCategory(cat); setInventoryFilter('all'); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat && inventoryFilter === 'all' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-lg' : 'bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5 hover:border-slate-300'}`}>{cat}</button>
                      ))}
                   </div>

                   {/* 2. Sorting Control */}
                   <div className="flex items-center gap-2 bg-white dark:bg-[#1e293b] p-1.5 rounded-xl border border-slate-200 dark:border-white/5 shrink-0">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase pl-2 tracking-wider">Sort:</span>
                      <select 
                        value={inventorySort} 
                        onChange={(e) => setInventorySort(e.target.value as any)}
                        className="bg-transparent text-xs font-bold text-slate-700 dark:text-white outline-none cursor-pointer pr-2"
                      >
                        <option value="name" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Name (A-Z)</option>
                        <option value="stock-asc" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Stock (Low → High)</option>
                        <option value="stock-desc" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Stock (High → Low)</option>
                        <option value="price-desc" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Price (High → Low)</option>
                        <option value="price-asc" className="bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white">Price (Low → High)</option>
                      </select>
                   </div>
                </div>

                <div className="flex gap-2 mb-4">
                   {isSearchExpanded || searchTerm ? (
                      <div className="flex-1 relative animate-in fade-in slide-in-from-left-2 duration-200">
                         <input 
                           autoFocus
                           className="w-full h-12 pl-10 pr-10 bg-white dark:bg-[#1e293b] rounded-2xl border border-[#6366f1]/50 text-sm font-bold outline-none dark:text-white shadow-lg ring-4 ring-[#6366f1]/10"
                           placeholder="Search item name or code..."
                           value={searchTerm}
                           onChange={e => setSearchTerm(e.target.value)}
                         />
                         <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">🔍</span>
                         <button onClick={() => { setSearchTerm(''); setIsSearchExpanded(false); }} className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-slate-400 hover:text-rose-500 transition">✕</button>
                      </div>
                   ) : (
                      <>
                         <button onClick={() => setIsSearchExpanded(true)} className="h-12 w-12 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/10 flex items-center justify-center text-xl shadow-sm text-slate-500 shrink-0 active:scale-95 transition">🔍</button>
                         <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar">
                             <button onClick={() => setShowBatchHistory(true)} className="flex-1 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-indigo-200 dark:border-indigo-800 whitespace-nowrap px-4">History</button>
                             <button onClick={() => setShowBatchModal(true)} className="flex-1 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 whitespace-nowrap px-4">+ Stock In</button>
                             <button onClick={() => requireAdmin(() => setShowBulkUpload(true))} className="px-4 h-12 bg-white dark:bg-[#1e293b] text-slate-500 rounded-2xl font-black text-xl border border-slate-200 dark:border-white/10 shrink-0">☁️</button>
                         </div>
                      </>
                   )}
                </div>

                <div className={`grid gap-4 ${deviceMode === 'mobile' ? 'grid-cols-2' : (deviceMode === 'tablet' ? 'grid-cols-3' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5')}`}>
                  <button onClick={() => { setEditingItem(null); setShowAddInventory({ isOpen: true }); }} className="min-h-[200px] bg-slate-100 dark:bg-[#1e293b]/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center gap-3 hover:border-[#6366f1]/50 hover:bg-white dark:hover:bg-[#1e293b] transition group">
                     <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-3xl group-hover:scale-110 transition text-slate-400">+</div>
                     <p className="text-xs font-black uppercase text-slate-500">New Item</p>
                  </button>

                  {displayedInventory.map(item => {
                     const isLowStock = item.stock <= item.reorderLevel;
                     return (
                     <div key={item.id} className={`bg-white dark:bg-[#1e293b] p-4 rounded-3xl border hover:shadow-xl transition flex flex-col justify-between group relative overflow-hidden ${isLowStock ? 'border-rose-500 dark:border-rose-500 shadow-lg shadow-rose-500/10' : 'border-slate-200 dark:border-white/5'}`}>
                        {isLowStock && <div className="absolute top-0 right-0 bg-rose-500 text-white text-[8px] font-black uppercase px-2 py-1 rounded-bl-xl z-10">Low Stock</div>}
                        <div className="flex flex-col items-center text-center gap-3 mb-4 cursor-pointer" onClick={() => { setEditingItem(item); setShowAddInventory({ isOpen: true }); }}>
                           <div className="w-20 h-20 bg-slate-50 dark:bg-[#0f172a] rounded-2xl flex items-center justify-center text-4xl shadow-inner overflow-hidden">
                              {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : '📦'}
                           </div>
                           <div>
                              <p className="font-black text-sm uppercase leading-tight line-clamp-2 dark:text-white">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{item.category}</p>
                           </div>
                        </div>
                        <div className="mt-auto space-y-3">
                           <div className="flex justify-between items-end">
                              <p className="text-lg font-black text-[#6366f1]">₱{item.price.toFixed(2)}</p>
                              <p className={`text-[10px] font-bold uppercase ${isLowStock ? 'text-rose-500' : 'text-slate-500'}`}>{item.stock} {item.unit}</p>
                           </div>
                           <button onClick={() => setShowStockAdjust(item)} className="w-full py-2 bg-slate-100 dark:bg-[#0f172a] rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-[#6366f1] hover:text-white transition">Adjust Stock</button>
                        </div>
                     </div>
                     );
                  })}
                </div>
                
                {inventoryFilter === 'low-stock' && displayedInventory.length === 0 && (
                   <div className="text-center py-20 opacity-50">
                      <span className="text-4xl block mb-2">🎉</span>
                      <p className="font-bold">No low stock items!</p>
                   </div>
                )}

                {visibleItemsCount < filteredInventory.length && (
                  <div className="flex justify-center pt-6 pb-12">
                     <button onClick={() => setVisibleItemsCount(prev => prev + 20)} className="px-8 py-3 bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-black uppercase text-slate-500 hover:text-[#6366f1] transition shadow-sm">Load More Items ({filteredInventory.length - visibleItemsCount} remaining)</button>
                  </div>
                )}
             </div>
          )}

          {activeTab === 'debt' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Toggle for Debt vs Sales */}
                <div className="flex justify-center">
                   <div className="flex p-1 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 w-full max-w-md shadow-sm">
                      <button 
                        onClick={() => setDebtTabFilter('registered')} 
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${debtTabFilter === 'registered' ? 'bg-[#6366f1] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        👥 Registered Suki
                      </button>
                      <button 
                        onClick={() => setDebtTabFilter('walkin')} 
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${debtTabFilter === 'walkin' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        🚶 Walk-in Sales
                      </button>
                   </div>
                </div>

                <div className={`grid gap-4 ${deviceMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                    {records
                      .filter(r => {
                          const isWalkIn = r.customerName === 'Walk-in Customer';
                          return debtTabFilter === 'walkin' ? isWalkIn : !isWalkIn;
                      })
                      .map(record => {
                        const daysOld = getDebtAgeDays(record.date);
                        let ageIndicatorColor = 'bg-white/5';
                        let ageLabel = 'New';
                        let borderClass = 'border-slate-200 dark:border-white/5';

                        if (!record.isPaid) {
                           if (daysOld > 30) {
                              ageIndicatorColor = 'bg-rose-500 text-white';
                              ageLabel = '> 30 Days';
                              borderClass = 'border-rose-500 ring-1 ring-rose-500/30';
                           } else if (daysOld > 7) {
                              ageIndicatorColor = 'bg-amber-500 text-white';
                              ageLabel = '> 7 Days';
                              borderClass = 'border-amber-500';
                           } else {
                              ageIndicatorColor = 'bg-emerald-500 text-white';
                              ageLabel = 'Recent';
                              borderClass = 'border-emerald-500';
                           }
                        }

                        return (
                        <div key={record.id} onClick={() => setShowRecordDetails(record)} className={`bg-white dark:bg-[#1e293b] p-5 rounded-3xl border transition cursor-pointer relative overflow-hidden group hover:shadow-xl ${borderClass}`}>
                            <div className="flex justify-between items-start mb-4 pl-1">
                              <div>
                                  <p className="font-black text-sm uppercase dark:text-white truncate max-w-[150px]">{record.customerName}</p>
                                  <p className="text-[10px] text-slate-400">{record.date}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${record.isPaid ? 'bg-slate-100 text-slate-500' : ageIndicatorColor}`}>
                                 {record.isPaid ? 'PAID' : ageLabel}
                              </span>
                            </div>
                            <div className="flex justify-between items-end pl-1">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">{record.quantity} Items</p>
                              <div className="text-right">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-0.5">Total</p>
                                <p className="text-xl font-black dark:text-white">₱{record.totalAmount.toFixed(2)}</p>
                              </div>
                            </div>
                        </div>
                        );
                      })}
                    
                    {records.filter(r => debtTabFilter === 'walkin' ? r.customerName === 'Walk-in Customer' : r.customerName !== 'Walk-in Customer').length === 0 && (
                        <div className="col-span-full text-center py-20 opacity-50">
                            <span className="text-4xl block mb-2">{debtTabFilter === 'walkin' ? '🚶' : '👥'}</span>
                            <p className="text-xs font-bold text-slate-500 uppercase">No {debtTabFilter === 'walkin' ? 'walk-in' : 'registered'} records found.</p>
                        </div>
                    )}
                </div>
             </div>
          )}

          {activeTab === 'customers' && (
             <div className="space-y-4">
                <button onClick={() => { setPrefilledCustomerName(''); setShowAddCustomer(true); }} className="w-full py-4 bg-[#6366f1] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg">Register New Suki</button>
                <div className={`grid gap-4 ${deviceMode === 'mobile' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                   
                   <div 
                      onClick={() => setShowCustomerHistory({ name: 'Walk-in Customer', isWalkIn: true })}
                      className="bg-indigo-500/10 dark:bg-indigo-900/10 p-5 rounded-3xl border border-indigo-500/20 hover:border-indigo-500/50 transition cursor-pointer group"
                   >
                      <div className="flex justify-between items-start mb-4">
                        <p className="font-black text-lg uppercase text-indigo-500 dark:text-indigo-400">Walk-in Customers</p>
                        <span className="text-xl group-hover:scale-110 transition">🚶</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <p className="text-xs text-slate-500">General Sales History</p>
                        <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-1 rounded-lg">VIEW HISTORY</span>
                      </div>
                   </div>

                   {customers.map(c => (
                      <div key={c.id} className="bg-white dark:bg-[#1e293b] p-5 rounded-3xl border border-slate-200 dark:border-white/5 relative group">
                         <button onClick={() => setShowCustomerQR(c)} className="absolute top-4 right-4 text-xl opacity-50 hover:opacity-100 transition z-10" title="View ID">🪪</button>
                         <div onClick={() => setShowCustomerHistory(c)} className="cursor-pointer">
                            <p className="font-black text-lg uppercase dark:text-white mr-8">{c.name}</p>
                            <div className="flex justify-between items-end">
                                <p className="text-xs text-slate-500 mb-4">{c.address || 'No Address'}</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl flex-1 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Limit</span>
                                    <span className="font-black dark:text-white">₱{c.creditLimit?.toLocaleString()}</span>
                                </div>
                                <button className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-[10px] font-black uppercase hover:bg-slate-200 dark:hover:bg-white/10 transition">
                                   History
                                </button>
                            </div>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

          {activeTab === 'insights' && <ReportsTab records={records} inventory={inventory} />}

          {activeTab === 'settings' && (
             <div className="max-w-3xl mx-auto space-y-6 animate-in slide-in-from-bottom-4">
                 {/* ... (Existing settings content) ... */}
                 
                 <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><span className="text-xl">🏪</span> Store Profile</h3>
                    <div className="grid grid-cols-1 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Store Name</label>
                          <input className="w-full p-4 bg-slate-50 dark:bg-[#0f172a] rounded-xl text-sm font-bold border border-slate-200 dark:border-white/5 outline-none focus:ring-2 focus:ring-[#6366f1]/20 transition dark:text-white" value={branch.name} onChange={e => setBranch({...branch, name: e.target.value})} placeholder="My Sari-Sari Store" />
                       </div>
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

                 {/* Removed Receipt Customization Section - Moved to Advanced Settings */}

                 <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                     <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><span className="text-xl">🎯</span> Business Goals</h3>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Daily Sales Target (₱)</label>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#0f172a] border border-slate-200 dark:border-white/5 rounded-xl px-4 py-3">
                           <span className="text-emerald-500 font-black text-lg">₱</span>
                           <input 
                             type="number" 
                             className="w-full bg-transparent text-sm font-bold dark:text-white text-slate-900 outline-none"
                             value={settings.dailySalesTarget || ''}
                             placeholder="0"
                             onChange={e => setSettings({...settings, dailySalesTarget: parseFloat(e.target.value) || 0})}
                           />
                        </div>
                        <p className="text-[9px] text-slate-400 px-1">Set a daily revenue goal to see a progress tracker on your dashboard.</p>
                     </div>
                 </div>

                 <div className="bg-white dark:bg-[#1e293b] p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
                     <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-900 dark:text-white"><span className="text-xl">⚙️</span> Preferences</h3>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-100 dark:border-white/5">
                           <div>
                              <p className="font-bold text-sm dark:text-white">App Theme</p>
                              <p className="text-[10px] text-slate-400">Switch between Light and Dark mode</p>
                           </div>
                           <div className="flex bg-slate-200 dark:bg-slate-700 p-1 rounded-lg">
                              <button 
                                onClick={() => setSettings({...settings, theme: 'light'})}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition ${settings.theme === 'light' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                              >
                                ☀️ Light
                              </button>
                              <button 
                                onClick={() => setSettings({...settings, theme: 'dark'})}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition ${settings.theme === 'dark' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}
                              >
                                🌙 Dark
                              </button>
                           </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-100 dark:border-white/5">
                           <div>
                              <p className="font-bold text-sm dark:text-white">Dashboard Financial Pulse</p>
                              <p className="text-[10px] text-slate-400">Show real-time metrics on home screen</p>
                           </div>
                           <div onClick={() => setSettings({...settings, showFinancialPulseOnDashboard: !settings.showFinancialPulseOnDashboard})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${settings.showFinancialPulseOnDashboard ? 'bg-[#6366f1]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                             <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${settings.showFinancialPulseOnDashboard ? 'translate-x-5' : ''}`} />
                           </div>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-100 dark:border-white/5">
                           <div>
                              <p className="font-bold text-sm dark:text-white">Auto-Print Receipt</p>
                              <p className="text-[10px] text-slate-400">Print immediately after transaction</p>
                           </div>
                           <div onClick={() => setSettings({...settings, autoPrintReceipt: !settings.autoPrintReceipt})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${settings.autoPrintReceipt ? 'bg-[#6366f1]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                             <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${settings.autoPrintReceipt ? 'translate-x-5' : ''}`} />
                           </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-100 dark:border-white/5">
                           <div>
                              <p className="font-bold text-sm dark:text-white">Require Admin Approval</p>
                              <p className="text-[10px] text-slate-400">PIN needed for debts & large sales</p>
                           </div>
                           <div onClick={() => setSettings({...settings, requireAdminApproval: !settings.requireAdminApproval})} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${settings.requireAdminApproval ? 'bg-[#6366f1]' : 'bg-slate-300 dark:bg-slate-700'}`}>
                             <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${settings.requireAdminApproval ? 'translate-x-5' : ''}`} />
                           </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#0f172a] rounded-xl border border-slate-100 dark:border-white/5">
                           <div>
                              <p className="font-bold text-sm dark:text-white">Language</p>
                              <p className="text-[10px] text-slate-400">App interface language</p>
                           </div>
                           <select value={settings.language} onChange={(e) => setSettings({...settings, language: e.target.value as any})} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold px-3 py-2 outline-none dark:text-white">
                             <option value="en">English</option>
                             <option value="tl">Tagalog</option>
                             <option value="bis">Bisaya</option>
                           </select>
                        </div>
                     </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button onClick={() => setShowFinancialPulse(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] transition group text-left">
                       <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">📈</span>
                       <p className="font-black text-xs uppercase dark:text-white">Financial Pulse</p>
                       <p className="text-[10px] text-slate-400">View real-time metrics</p>
                    </button>
                    <button onClick={() => setShowHardwareSettings(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] transition group text-left">
                       <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">🖨️</span>
                       <p className="font-black text-xs uppercase dark:text-white">Hardware Settings</p>
                       <p className="text-[10px] text-slate-400">Connect Printer & Scanner</p>
                    </button>
                    <button onClick={() => requireAdmin(() => setShowBackupRestore(true))} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] transition group text-left">
                       <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">💾</span>
                       <p className="font-black text-xs uppercase dark:text-white">Backup & Restore</p>
                       <p className="text-[10px] text-slate-400">Save data to file</p>
                    </button>
                    <button onClick={() => requireAdmin(() => setShowSync(true))} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] transition group text-left">
                       <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">🔄</span>
                       <p className="font-black text-xs uppercase dark:text-white">Sync Devices</p>
                       <p className="text-[10px] text-slate-400">Transfer data P2P</p>
                    </button>
                    <button onClick={() => setShowUserGuide(true)} className="p-4 bg-white dark:bg-[#1e293b] rounded-2xl border border-slate-200 dark:border-white/5 hover:border-[#6366f1] transition group text-left">
                       <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">📚</span>
                       <p className="font-black text-xs uppercase dark:text-white">User Guide</p>
                       <p className="text-[10px] text-slate-400">Manual & Tutorials</p>
                    </button>
                    <button onClick={() => requireAdmin(() => setShowAdvancedSettings(true))} className="p-4 bg-slate-900 dark:bg-white rounded-2xl border border-transparent transition group text-left md:col-span-2">
                       <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform origin-left">🛠️</span>
                       <p className="font-black text-xs uppercase text-white dark:text-slate-900">Advanced Settings</p>
                       <p className="text-[10px] text-slate-400 dark:text-slate-500">Security & System</p>
                    </button>
                 </div>
             </div>
          )}
        </main>
      </div>

      {/* --- MODALS --- */}
      {showDebtModal && (
        <AddDebtModal 
          inventory={inventory} customers={customers} records={records} receiptTemplate={settings.receiptTemplate} branch={branch}
          adminPinHash={adminPinHash} requireAdminApproval={settings.requireAdminApproval} defaultAutoPrint={settings.autoPrintReceipt}
          initialCustomer={posInitialCustomer} initialItem={posInitialItem}
          quickPicks={settings.quickPicks} onUpdateQuickPicks={(picks) => setSettings({...settings, quickPicks: picks})}
          onAdd={handleAddDebt} onClose={() => { setShowDebtModal(false); setPosInitialCustomer(null); setPosInitialItem(null); }}
          onAddNewInventory={(details) => { 
             setShowDebtModal(false); 
             if (typeof details === 'string') {
                setEditingItem({ barcode: details } as any); 
                setShowAddInventory({ isOpen: true, initialBarcode: details }); 
             } else {
                setEditingItem(details as any);
                setShowAddInventory({ isOpen: true });
             }
          }}
          onRegisterCustomer={(name) => { setShowDebtModal(false); setPrefilledCustomerName(name); setShowAddCustomer(true); }}
        />
      )}

      {showAddInventory.isOpen && (
        <AddInventoryModal 
           categories={settings.categories} defaultReorderLevel={settings.lowStockThreshold} item={editingItem} userRole={currentUserRole}
           onAdd={(item) => {
             if ('id' in item && item.id) {
               const id = item.id;
               setInventory(inventory.map(i => i.id === id ? { ...i, ...item } : i));
             } else {
               setInventory([...inventory, { ...item, id: crypto.randomUUID() }]);
             }
           }} 
           onClose={() => { setShowAddInventory({ isOpen: false }); setEditingItem(null); }} 
           onDelete={handleDeleteInventory} initialBarcode={showAddInventory.initialBarcode}
        />
      )}

      {/* ... (Other modals remain the same) ... */}
      
      {showBatchModal && (
         <AddBatchModal 
           inventory={inventory} onAddBatch={handleAddBatch} onClose={() => setShowBatchModal(false)} userRole={currentUserRole}
           onCreateNewItem={(name) => { setShowBatchModal(false); setEditingItem({ name } as any); setShowAddInventory({ isOpen: true }); }}
         />
      )}

      {showBatchHistory && <BatchHistoryModal batches={batches} onClose={() => setShowBatchHistory(false)} userRole={currentUserRole} />}
      {showBulkUpload && <BulkUploadModal categories={settings.categories} onAdd={(items) => { setInventory([...inventory, ...items.map((i: any) => ({ ...i, id: crypto.randomUUID() }))]); }} onClose={() => setShowBulkUpload(false)} />}
      {showStockAdjust && <StockAdjustModal item={showStockAdjust} onClose={() => setShowStockAdjust(null)} userRole={currentUserRole} onAdjust={(id, newStock, newItemsPerPack) => { setInventory(inventory.map(i => i.id === id ? { ...i, stock: newStock, itemsPerPack: newItemsPerPack || i.itemsPerPack } : i)); }} />}
      {showAddCustomer && <AddCustomerModal existingCustomers={customers} prefilledName={prefilledCustomerName} onAdd={(c) => setCustomers([...customers, { ...c, id: crypto.randomUUID(), createdAt: new Date().toLocaleString() }])} onClose={() => setShowAddCustomer(false)} />}
      {showRecordDetails && <RecordDetailsModal record={showRecordDetails} onClose={() => setShowRecordDetails(null)} isAdmin={currentUserRole === 'admin'} onAction={(type, rec) => {
              if (type === 'payFull') {
                 const updated = { ...rec, isPaid: true, paidAmount: rec.totalAmount };
                 setRecords(records.map(r => r.id === rec.id ? updated : r));
                 setShowRecordDetails(null);
                 if (settings.autoPrintReceipt) setShowReceipt({ record: updated, autoPrint: true });
              } else if (type === 'receipt') { setShowReceipt({ record: rec, autoPrint: false });
              } else if (type === 'customize') { setShowReceipt({ record: rec, autoPrint: false, editMode: true });
              } else if (type === 'partial') { setShowPartialPay(rec);
              } else if (type === 'reminder') { setShowReminder(rec);
              } else if (type === 'delete') {
                 setShowConfirm({
                    title: "Delete Record",
                    message: "Are you sure you want to permanently delete this transaction?",
                    onConfirm: () => {
                       const result = TransactionService.deleteTransaction(rec.id, inventory, records);
                       if (result.success) { setInventory(result.updatedInventory); setRecords(result.updatedRecords); setShowRecordDetails(null); setShowConfirm(null); } else { alert(result.error); }
                    }
                 });
              } else if (type === 'edit') { alert("To edit, please delete and recreate."); }
           }} />}
      {showReceipt && <ReceiptModal transaction={showReceipt.record} branch={branch} receiptTemplate={settings.receiptTemplate} autoPrint={showReceipt.autoPrint} isPreview={showReceipt.editMode || (activeTab === 'settings' && !showReceipt.autoPrint)} onUpdateSettings={(k, v) => setSettings({...settings, receiptTemplate: { ...settings.receiptTemplate, [k]: v }})} onClose={() => setShowReceipt(null)} />}
      {showPartialPay && <PartialPayModal record={showPartialPay} onClose={() => setShowPartialPay(null)} onPay={(amount) => { const updated = { ...showPartialPay, paidAmount: showPartialPay.paidAmount + amount, isPaid: (showPartialPay.paidAmount + amount) >= showPartialPay.totalAmount }; setRecords(records.map(r => r.id === showPartialPay.id ? updated : r)); setShowPartialPay(null); setShowRecordDetails(updated); }} />}
      {showReminder && <ReminderModal record={showReminder} onClose={() => setShowReminder(null)} onSave={(freq, date) => { const updated = { ...showReminder, reminderFrequency: freq, nextReminderDate: date }; setRecords(records.map(r => r.id === showReminder.id ? updated : r)); }} />}
      {showCustomerQR && <CustomerQRModal customer={showCustomerQR} branch={branch} onClose={() => setShowCustomerQR(null)} />}
      
      {showCustomerHistory && (
         <CustomerHistoryModal 
            customer={showCustomerHistory} 
            records={records} 
            onClose={() => setShowCustomerHistory(null)} 
            onViewRecord={(r) => { setShowRecordDetails(r); }}
            onDelete={'id' in showCustomerHistory ? () => handleDeleteCustomer(showCustomerHistory.id) : undefined}
            isAdmin={currentUserRole === 'admin'}
         />
      )}
      
      {showAdvancedSettings && <AdvancedSettingsModal settings={settings} setSettings={setSettings} onClose={() => setShowAdvancedSettings(false)} onOpenReceiptStudio={() => { setShowAdvancedSettings(false); setShowReceipt({ record: MOCK_PREVIEW_RECORD, autoPrint: false, editMode: true }); }} />}
      {showBackupRestore && <BackupRestoreModal inventory={inventory} customers={customers} records={records} settings={settings} branch={branch} onClose={() => setShowBackupRestore(false)} onRestore={handleRestore} lastSaved={new Date().toLocaleString()} />}
      {showSync && <SyncDevicesModal currentData={{ inventory, customers, records, settings, branch }} onRestore={handleRestore} onClose={() => setShowSync(false)} />}
      {showUserGuide && <UserGuideModal onClose={() => setShowUserGuide(false)} />}
      {showAdminAuth && <AdminPINModal adminPinHash={adminPinHash} onVerify={showAdminAuth.onVerify} onCancel={() => setShowAdminAuth(null)} />}
      
      {showConfirm && (
        <ConfirmModal 
          isOpen={true} 
          title={showConfirm.title} 
          message={showConfirm.message} 
          confirmLabel={showConfirm.confirmLabel}
          cancelLabel={showConfirm.cancelLabel}
          isDanger={showConfirm.isDanger}
          onConfirm={showConfirm.onConfirm} 
          onCancel={() => setShowConfirm(null)} 
        />
      )}
      
      {showHardwareSettings && <HardwareSettingsModal onClose={() => setShowHardwareSettings(false)} />}
      {showScanner && <BarcodeScanner onScan={(code) => {
            let customerId = code; if (code.startsWith('CID:')) { customerId = code.replace('CID:', ''); }
            const customer = customers.find(c => c.id === customerId || c.barcode === code);
            if (customer) { setPosInitialCustomer(customer); setPosInitialItem(null); setShowDebtModal(true); return ScanResultStatus.SUCCESS; }
            const item = inventory.find(i => i.barcode === code);
            if (item) { setPosInitialItem(item); setPosInitialCustomer(null); setShowDebtModal(true); return ScanResultStatus.SUCCESS; }
            return ScanResultStatus.NOT_FOUND;
          }} onClose={() => setShowScanner(false)} />}
      {showFinancialPulse && <FinancialPulseModal stats={stats} onClose={() => setShowFinancialPulse(false)} userRole={currentUserRole} />}
    </div>
  );
}
