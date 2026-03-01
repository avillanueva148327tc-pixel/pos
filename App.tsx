import React, { useState, useEffect, useMemo, createContext, useCallback } from 'react';
import { 
  InventoryItem, Customer, UtangRecord, AppSettings, BranchConfig, 
  UserRole, BatchRecord, Stats as StatsType, RecycleBinItem, ShiftRecord, UtangItem, QuickPickItem, ActivityLog,
  BackupData, Task
} from './types';

// Components & Services
import LoginScreen from './components/LoginScreen';
import Stats from './components/Stats';
import POSTerminal from './components/POSTerminal';
import AddInventoryModal from './components/AddInventoryModal';
import AddCustomerModal from './components/AddCustomerModal';
import RecordDetailsModal from './components/RecordDetailsModal';
import ReminderModal from './components/ReminderModal';
import AdvancedSettingsModal from './components/AdvancedSettingsModal';
import ExpiryAlertBanner from './components/ExpiryAlertBanner';
import RecycleBinModal from './components/RecycleBinModal';
import ConfirmModal from './components/ConfirmModal';
import ShiftModal from './components/ShiftModal';
import AddBatchModal from './components/AddBatchModal';
import BackupRestoreModal from './components/BackupRestoreModal';
import SyncDevicesModal from './components/SyncDevicesModal';
import HardwareSettingsModal from './components/HardwareSettingsModal';
import UserGuideModal from './components/UserGuideModal';
import ReportsTab from './components/InsightsTab';
import { DesktopSidebar, MobileNavigation, navItems } from './components/Navigation';
import SettingsTab from './components/SettingsTab';
import InputModal from './components/InputModal';
import CustomerQRModal from './components/CustomerQRModal';
import BentoDashboard from './components/BentoDashboard';
import CommandPalette from './components/CommandPalette';
import NotificationsModal from './components/NotificationsModal';
import { SplashScreen, DashboardSkeleton, TableSkeleton } from './components/Skeleton';
import { SecurityService } from './services/securityService';
import { TransactionService, currency } from './services/transactionService';
import { Plus, Users, Bell, AlertTriangle, Zap, Terminal } from 'lucide-react';

export const ThemeContext = createContext({ 
  theme: 'dark', toggleTheme: () => {}, ui: {} as any 
});

const defaultBranch: BranchConfig = { name: "My Sari-Sari Store", address: "Local Barangay, City", contact: "09123456789" };
const defaultSettings: AppSettings = {
  categories: ['Canned Goods', 'Snacks', 'Drinks', 'Toiletries', 'Household', 'Instant Food', 'Others'],
  quickPicks: [ { name: 'Ice Tubig', price: 3 }, { name: 'Ice Yelo', price: 5 } ],
  expiryThresholdDays: 30, lowStockThreshold: 10, language: 'en', theme: 'dark',
  dailySalesTarget: 5000, autoPrintReceipt: false, requireAdminApproval: true,
  showFinancialPulseOnDashboard: true, enableAiScanner: true, autoLockMinutes: 15,
  auth: { adminPin: '1234', cashierPin: '0000' },
  receiptTemplate: { showBranchAddress: true, showBranchContact: true, showCustomerId: true, showItemSize: true, showDateTime: true, footerText: "Thank you for your business!", brandingText: "Sari-Sari Pro", headerAlignment: 'center', paperWidth: '58mm', fontFamily: 'Inter', fontSize: 14, layout: 'modern' },
  uiCustomization: { fontFamily: 'Inter', fontSize: 'base', compactMode: false, deviceMode: 'desktop' }
};

// Memoized Tab Components for Performance
const DashboardTab = React.memo(({ isLoaded, stats, records, inventory, activityLogs, tasks, onAddTask, onToggleTask, onDeleteTask, onSelectRecord }: any) => (
  isLoaded ? (
    <BentoDashboard 
      stats={stats} 
      records={records} 
      inventory={inventory} 
      logs={activityLogs} 
      tasks={tasks}
      onAddTask={onAddTask}
      onToggleTask={onToggleTask}
      onDeleteTask={onDeleteTask}
      onSelectRecord={onSelectRecord}
    />
  ) : <DashboardSkeleton />
));

const InventoryTab = React.memo(({ isLoaded, inventory, records, onAddStock, onBulkStock, onEditItem }: any) => {
  const reorderSuggestions = useMemo(() => {
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentSales = records.filter((r: any) => new Date(r.date) >= last7Days && r.isPaid);
    
    const velocity: Record<string, number> = {};
    recentSales.forEach((r: any) => {
      r.items.forEach((i: any) => {
        if (i.productId) {
          velocity[i.productId] = (velocity[i.productId] || 0) + i.quantity;
        }
      });
    });

    return inventory
      .filter((item: any) => {
        const sold = velocity[item.id] || 0;
        return item.stock <= item.reorderLevel || (sold > 0 && item.stock < sold * 1.5);
      })
      .map((item: any) => ({
        ...item,
        weeklySales: velocity[item.id] || 0,
        suggestedOrder: Math.max(item.reorderLevel * 2, (velocity[item.id] || 0) * 2) - item.stock
      }))
      .sort((a: any, b: any) => (a.stock / a.reorderLevel) - (b.stock / b.reorderLevel));
  }, [inventory, records]);

  return isLoaded ? (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Inventory Registry</h3>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">Stock Management & Procurement Protocol</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button onClick={onBulkStock} className="px-8 py-5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-slate-50 dark:hover:bg-white/10 transition-all shadow-xl">Bulk Entry</button>
          <button onClick={onAddStock} className="px-8 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/40">+ Add Product</button>
        </div>
      </div>

      {reorderSuggestions.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[3.5rem] p-10 relative overflow-hidden group/reorder">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black text-amber-600 uppercase tracking-tight">Reorder Protocol</h3>
                <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.4em]">Predictive Stock Depletion Warning</p>
              </div>
            </div>
            <span className="px-4 py-2 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
              {reorderSuggestions.length} Alerts
            </span>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar relative z-10">
            {reorderSuggestions.slice(0, 8).map((item: any) => (
              <div key={item.id} className="min-w-[280px] bg-white dark:bg-[#0f172a]/80 backdrop-blur-xl p-6 rounded-[2.5rem] border border-amber-500/20 shadow-2xl group/item hover:border-amber-500/40 transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 rounded-lg text-[8px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                  <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                </div>
                <h4 className="text-sm font-black uppercase truncate text-slate-900 dark:text-white mb-6">{item.name}</h4>
                <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Current Stock</p>
                    <p className="text-xl font-black text-rose-500 tabular-nums">{item.stock} <span className="text-[10px] opacity-60">{item.unit}</span></p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Suggested</p>
                    <p className="text-xl font-black text-indigo-600 tabular-nums">+{Math.ceil(item.suggestedOrder)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {inventory.map((item: any) => (
          <div key={item.id} className="p-8 bg-white dark:bg-[#0f172a]/50 backdrop-blur-xl rounded-[3rem] border border-slate-200 dark:border-white/5 shadow-2xl group hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             
             <div className="flex justify-between items-start mb-8">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.2em] border border-slate-200 dark:border-white/5">
                  {item.category}
                </span>
                <button 
                  onClick={() => onEditItem(item)} 
                  className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 hover:border-indigo-500/30 transition-all shadow-lg group-hover:scale-110"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
             </div>

             <div className="space-y-1 mb-8">
                <h4 className="font-black text-xl uppercase tracking-tight text-slate-900 dark:text-white truncate">{item.name}</h4>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">SKU: {item.id.slice(0, 8)}</p>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-slate-100 dark:border-white/5">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Price</p>
                  <p className="text-lg font-black text-indigo-500 tabular-nums">₱{item.price.toLocaleString()}</p>
                </div>
                <div className={`p-5 rounded-[1.5rem] border ${item.stock <= item.reorderLevel ? 'bg-rose-500/5 border-rose-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                  <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">Stock</p>
                  <p className={`text-lg font-black tabular-nums ${item.stock <= item.reorderLevel ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {item.stock} <span className="text-[10px] opacity-60 font-bold">{item.unit}</span>
                  </p>
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  ) : <TableSkeleton />;
});

const CustomersTab = React.memo(({ isLoaded, customers, records, onRegister, onShowQR, onEdit }: any) => {
  const getBalance = (name: string) => {
    return records
      .filter((r: any) => !r.isPaid && r.customerName.toLowerCase() === name.toLowerCase())
      .reduce((sum: number, r: any) => sum + (r.totalAmount - r.paidAmount), 0);
  };

  return isLoaded ? (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Suki Directory</h3>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">Customer Relations & Loyalty Registry</p>
          </div>
        </div>
        <button onClick={onRegister} className="px-8 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.3em] hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-500/40">+ Register Suki</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {customers.map((customer: any) => {
          const balance = getBalance(customer.name);
          return (
            <div key={customer.id} className="p-8 bg-white dark:bg-[#0f172a]/50 backdrop-blur-xl rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-2xl group hover:border-indigo-500/30 transition-all duration-500 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               
               <div className="flex justify-between items-start mb-10">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-[2rem] flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500 shadow-inner relative">
                    <div className="absolute inset-0 rounded-[2rem] border border-white/10"></div>
                    👤
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => onEdit(customer)} className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 transition-all shadow-lg">
                      <Plus size={20} className="rotate-45" />
                    </button>
                    <button onClick={() => onShowQR(customer)} className="w-12 h-12 bg-white dark:bg-white/5 rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-500 transition-all shadow-lg">
                      <Zap size={20} />
                    </button>
                  </div>
               </div>

               <div className="space-y-2 mb-10">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${customer.trustLevel === 'gold' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : customer.trustLevel === 'silver' ? 'bg-slate-400/10 text-slate-400 border border-slate-400/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                      {customer.trustLevel || 'Bronze'} Tier
                    </span>
                    {customer.nickname && <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">"{customer.nickname}"</span>}
                  </div>
                  <h4 className="font-black text-2xl uppercase tracking-tighter text-slate-900 dark:text-white truncate">{customer.name}</h4>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] truncate">{customer.contact || 'No Contact Registry'}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-emerald-500/5 rounded-[1.5rem] border border-emerald-500/10">
                    <p className="text-[8px] font-black text-emerald-500/60 uppercase tracking-widest mb-1">Loyalty</p>
                    <p className="text-lg font-black text-emerald-500 tabular-nums">{customer.loyaltyPoints} <span className="text-[10px] opacity-60">pts</span></p>
                  </div>
                  <div className={`p-5 rounded-[1.5rem] border ${balance > 0 ? 'bg-rose-500/5 border-rose-500/10' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5'}`}>
                    <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mb-1">Liability</p>
                    <p className={`text-lg font-black tabular-nums ${balance > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                      ₱{balance.toLocaleString()}
                    </p>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
    </div>
  ) : <TableSkeleton />;
});

const RecordsTab = React.memo(({ isLoaded, records, onSelectRecord }: any) => (
  isLoaded ? (
    <div className="space-y-12 animate-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-3">
          <h3 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Debt Ledger</h3>
          <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em]">Financial Liability & Repayment Registry</p>
          </div>
        </div>
        <div className="bg-white dark:bg-white/5 p-2 rounded-[1.5rem] border border-slate-200 dark:border-white/10 flex gap-2">
           <button className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30">All Records</button>
           <button className="px-8 py-4 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-colors">Pending Only</button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#0f172a]/50 backdrop-blur-xl rounded-[4rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500 opacity-50"></div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
              <tr>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Timestamp</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Customer Registry</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Liability</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Status</th>
                <th className="px-10 py-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {records.map(record => (
                <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300 group cursor-pointer" onClick={() => onSelectRecord(record)}>
                  <td className="px-10 py-8">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">{new Date(record.date).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center text-lg shadow-inner">👤</div>
                      <p className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">{record.customerName}</p>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-lg font-black text-indigo-500 tabular-nums">₱{record.totalAmount.toLocaleString()}</p>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border ${record.isPaid ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                      {record.isPaid ? 'Settled' : 'Outstanding'}
                    </span>
                  </td>
                  <td className="px-10 py-8">
                    <button className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-500/10 transition-all shadow-md group-hover:scale-110">
                      <Plus size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  ) : <TableSkeleton />
));

const App: React.FC = () => {
  // Domain Data Kernel
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [records, setRecords] = useState<UtangRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [branch, setBranch] = useState<BranchConfig>(defaultBranch);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [cart, setCart] = useState<{ items: UtangItem[], customer: string, isWalkIn: boolean }>({ items: [], customer: 'Walk-in Customer', isWalkIn: true });
  const [selection, setSelection] = useState<{ item: InventoryItem | null, record: UtangRecord | null, customerQR: Customer | null }>({ item: null, record: null, customerQR: null });
  const [modals, setModals] = useState({ 
    inventory: false, customer: false, shift: false, batch: false, 
    settings: false, bin: false, logout: false, backup: false, 
    sync: false, hardware: false, guide: false, reset: false,
    input: false, notifications: false, reminder: false
  });
  const [inputModalConfig, setInputModalConfig] = useState<{ title: string, label: string, field: keyof BranchConfig, defaultValue: string }>({ title: '', label: '', field: 'name', defaultValue: '' });
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'success' | 'error' | 'info' }[]>([]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = crypto.randomUUID();
    setToasts(p => [...p, { id, message, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
  }, []);

  // 1. Kernel Boot Sequence
  useEffect(() => {
    (async () => {
      const [inv, cust, rec, bats, logs, bin, ashift, shist, brn, sets, tks] = await Promise.all([
        SecurityService.secureLoad('inventory', []), SecurityService.secureLoad('customers', []),
        SecurityService.secureLoad('records', []), SecurityService.secureLoad('batches', []),
        SecurityService.secureLoad('activityLogs', []), SecurityService.secureLoad('recycleBin', []),
        SecurityService.secureLoad('activeShift', null), SecurityService.secureLoad('shiftHistory', []),
        SecurityService.secureLoad('branch', defaultBranch), SecurityService.secureLoad('settings', defaultSettings),
        SecurityService.secureLoad('tasks', [])
      ]);
      setInventory(inv); setCustomers(cust); setRecords(rec); setBatches(bats); setActivityLogs(logs); 
      setRecycleBin(bin); setActiveShift(ashift); setShiftHistory(shist); setBranch(brn); setSettings(sets);
      setTasks(tks);
      setTimeout(() => setIsLoaded(true), 800);
    })();
  }, []);

  // 2. Background Persistence Engine
  useEffect(() => {
    if (isLoaded && userRole) {
      SecurityService.secureSave('inventory', inventory);
      SecurityService.secureSave('customers', customers);
      SecurityService.secureSave('records', records);
      SecurityService.secureSave('batches', batches);
      SecurityService.secureSave('recycleBin', recycleBin);
      SecurityService.secureSave('activeShift', activeShift);
      SecurityService.secureSave('shiftHistory', shiftHistory);
      SecurityService.secureSave('settings', settings);
      SecurityService.secureSave('branch', branch);
      SecurityService.secureSave('tasks', tasks);
      SecurityService.vacuum(activityLogs).then(v => SecurityService.secureSave('activityLogs', v));
    }
  }, [inventory, customers, records, batches, recycleBin, activeShift, shiftHistory, activityLogs, settings, branch, tasks, userRole, isLoaded]);

  // 2.1 UI Engine
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const fonts: Record<string, string> = {
      'Inter': "'Inter', sans-serif",
      'Roboto': "'Roboto', sans-serif",
      'Poppins': "'Poppins', sans-serif",
      'JetBrains Mono': "'JetBrains Mono', monospace"
    };
    const sizes: Record<string, string> = {
      'sm': '14px',
      'base': '16px',
      'lg': '18px',
      'xl': '20px'
    };
    
    root.style.setProperty('--font-family', fonts[settings.uiCustomization.fontFamily] || fonts['Inter']);
    root.style.setProperty('--base-font-size', sizes[settings.uiCustomization.fontSize] || sizes['base']);
    
    root.classList.remove('dark', 'midnight');
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'midnight') {
      root.classList.add('midnight');
    }
  }, [settings.uiCustomization, settings.theme]);

  const dueReminders = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return records.filter(r => 
      !r.isPaid && 
      r.reminderFrequency && 
      r.reminderFrequency !== 'none' && 
      r.nextReminderDate && 
      r.nextReminderDate <= today
    );
  }, [records]);

  useEffect(() => {
    if (isLoaded && userRole && dueReminders.length > 0) {
      const hasShown = sessionStorage.getItem('remindersShown');
      if (!hasShown) {
        addToast(`You have ${dueReminders.length} pending debt collection reminder(s)!`, 'info');
        sessionStorage.setItem('remindersShown', 'true');
      }
    }
  }, [isLoaded, userRole, dueReminders.length, addToast]);

  const handleAcknowledgeReminder = useCallback((record: UtangRecord) => {
    const nextDate = new Date();
    if (record.reminderFrequency === 'daily') {
      nextDate.setDate(nextDate.getDate() + 1);
    } else if (record.reminderFrequency === 'weekly') {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (record.reminderFrequency === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, reminderFrequency: 'none', nextReminderDate: undefined } : r));
      return;
    }
    
    setRecords(prev => prev.map(r => r.id === record.id ? { ...r, nextReminderDate: nextDate.toISOString().split('T')[0] } : r));
    addToast(`Reminder for ${record.customerName} snoozed until ${nextDate.toLocaleDateString()}`, 'info');
  }, [addToast]);

  const addLog = useCallback((action: string, details: string, type: ActivityLog['type'] = 'info') => {
    setActivityLogs(p => [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), user: userRole || 'System', action, details, type }, ...p].slice(0, 500));
  }, [userRole]);

  // 3. Centralized Transaction Background Processor
  const handleTransactionFinalized = useCallback((data: any) => {
    const result = TransactionService.processTransaction(data, inventory, records, customers, settings);
    if (result.success) {
      setInventory(result.updatedInventory);
      setRecords(result.updatedRecords);
      
      // Award Loyalty Points (1 point per 10 pesos)
      if (!data.isWalkIn && data.customerName) {
        const pointsEarned = Math.floor(data.totalAmount / 10);
        if (pointsEarned > 0) {
          setCustomers(prev => prev.map(c => 
            c.name === data.customerName 
              ? { ...c, loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned, lastVisit: new Date().toISOString() } 
              : c
          ));
        }
      }

      setCart({ items: [], customer: 'Walk-in Customer', isWalkIn: true });
      
      if (activeShift && data.isPaid) {
        setActiveShift(prev => prev ? {
          ...prev, cashSales: currency(prev.cashSales + data.totalAmount),
          expectedTotal: currency(prev.expectedTotal + data.totalAmount)
        } : null);
      }
      addLog('TX_COMMIT', `Sale: P${data.totalAmount.toFixed(2)}`);
      addToast(`Transaction Successful: P${data.totalAmount.toFixed(2)}`);
      return true;
    }
    addToast('Transaction Failed', 'error');
    return false;
  }, [inventory, records, customers, settings, activeShift, addLog, addToast]);

  const handleUpdateCustomer = useCallback((id: string, updated: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updated } : c));
    addLog('CUSTOMER_UPDATE', `Updated: ${updated.name || id}`);
    addToast('Customer Details Updated');
  }, [addLog, addToast]);

  const handleSettleDebt = useCallback((record: UtangRecord, amount: number) => {
    setRecords(prev => TransactionService.settleDebt(record, amount, prev));
    if (activeShift) {
        setActiveShift(prev => prev ? {
            ...prev, cashSales: currency(prev.cashSales + amount),
            expectedTotal: currency(prev.expectedTotal + amount)
        } : null);
    }
    addLog('DEBT_PAY', `Payment for ${record.customerName}: P${amount}`);
    addToast(`Payment Received: P${amount}`);
  }, [activeShift, addLog, addToast]);

  const handleAddTask = useCallback((text: string, priority: Task['priority'] = 'medium') => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      priority
    };
    setTasks(prev => [newTask, ...prev]);
    addToast('Task Added');
  }, [addToast]);

  const handleToggleTask = useCallback((id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  }, []);

  const handleDeleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    addToast('Task Deleted', 'info');
  }, [addToast]);

  // 4. Background Financial Analytics
  const stats: StatsType = useMemo(() => {
    const unpaidRecords = records.filter(r => !r.isPaid);
    
    // Single pass calculation for efficiency
    let totalSales = 0;
    let costOfSales = 0;
    records.forEach(r => {
      if (r.isPaid) {
        totalSales += r.totalAmount;
        r.items.forEach(i => {
          costOfSales += (i.cost || 0) * i.quantity;
        });
      }
    });

    const invVal = inventory.reduce((s, i) => s + (i.stock * i.price), 0);
    const debtVal = unpaidRecords.reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);
    const investmentVal = inventory.reduce((s, i) => s + (i.stock * (i.originalPrice || 0)), 0);
    const potentialProfit = inventory.reduce((s, i) => s + (i.stock * (i.price - (i.originalPrice || 0))), 0);

    return {
      totalCount: records.length, 
      totalAmount: records.reduce((s, r) => s + r.totalAmount, 0),
      unpaidTotal: debtVal, 
      activeDebtors: new Set(unpaidRecords.map(r => r.customerName)).size,
      lowStockCount: inventory.filter(i => i.stock <= i.reorderLevel).length,
      totalInventoryValue: invVal, 
      totalInvestmentValue: investmentVal,
      potentialProfit: potentialProfit,
      dailySales: totalSales, 
      monthlySales: totalSales, 
      monthlyExpenses: batches.reduce((s, b) => s + b.totalCost, 0),
      monthlyNetProfit: currency(totalSales - costOfSales), 
      debtRatio: invVal > 0 ? currency((debtVal / invVal) * 100) : 0
    };
  }, [records, inventory, batches]);

  const handleEmergencyBackup = useCallback(() => {
    const exportPayload: BackupData = {
      metadata: {
        version: "3.5.0",
        date: new Date().toISOString(),
        type: "emergency_wipe_backup",
        encrypted: false
      },
      data: {
        inventory,
        customers,
        records,
        shifts: shiftHistory,
        tasks,
        settings,
        branch
      }
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EMERGENCY_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [inventory, customers, records, shiftHistory, tasks, settings, branch]);

  if (!isLoaded) return <SplashScreen />;

  if (!userRole) return <LoginScreen onLogin={(p) => {
    if (p === settings.auth.adminPin) setUserRole('admin');
    else if (p === settings.auth.cashierPin) setUserRole('cashier');
    else { alert("INVALID PIN"); addLog('AUTH_FAIL', 'Invalid Attempt', 'critical'); }
  }} />;

  return (
    <ThemeContext.Provider value={{ 
      theme: settings.theme, 
      toggleTheme: () => setSettings(s => ({
        ...s, 
        theme: s.theme === 'light' ? 'dark' : s.theme === 'dark' ? 'midnight' : 'light'
      })), 
      ui: settings.uiCustomization 
    }}>
      <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#020617] transition-colors duration-700 font-sans ${settings.uiCustomization.compactMode ? 'compact-mode' : ''}`}>
        
        {/* SIDEBAR NAVIGATION */}
        <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Top Header - Editorial Style */}
          <header className="h-24 flex items-center justify-between px-8 md:px-12 bg-white/50 dark:bg-[#020617]/50 backdrop-blur-2xl border-b border-slate-200 dark:border-white/5 sticky top-0 z-40">
            <div className="flex items-center gap-6">
              <div className="md:hidden w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <Terminal className="text-white" size={20} />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                  {navItems.find(i => i.id === activeTab)?.label || 'System'}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">
                    Terminal Active • {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Quick Action Buttons */}
              <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5">
                <button 
                  onClick={() => setModals(m => ({ ...m, inventory: true }))}
                  className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all"
                  title="Add Inventory"
                >
                  <Plus size={20} />
                </button>
                <button 
                  onClick={() => setModals(m => ({ ...m, customer: true }))}
                  className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all"
                  title="Add Customer"
                >
                  <Users size={20} />
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-white/10 mx-1"></div>
                <button 
                  onClick={() => setModals(m => ({ ...m, notifications: true }))}
                  className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-white dark:hover:bg-white/5 rounded-xl transition-all relative"
                  title="Notifications"
                >
                  <Bell size={20} />
                  {records.filter(r => !r.isPaid && r.nextReminderDate && new Date(r.nextReminderDate) <= new Date()).length > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#020617]"></span>
                  )}
                </button>
              </div>

              {/* User Profile - Minimalist */}
              <button 
                onClick={() => setModals(m => ({ ...m, logout: true }))}
                className="flex items-center gap-3 pl-4 pr-2 py-2 bg-slate-100 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all group"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider leading-none">{userRole === 'admin' ? 'Administrator' : 'Terminal Operator'}</p>
                  <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Authorized Session</p>
                </div>
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  {userRole?.charAt(0).toUpperCase()}
                </div>
              </button>
            </div>
          </header>

          {/* TAB CONTENT AREA */}
          <main className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 relative">
            <div className="max-w-[1600px] mx-auto">
              {activeTab === 'dashboard' && (
                <DashboardTab 
                  isLoaded={isLoaded} stats={stats} records={records} inventory={inventory} 
                  activityLogs={activityLogs} tasks={tasks} onAddTask={handleAddTask} 
                  onToggleTask={handleToggleTask} onDeleteTask={handleDeleteTask} onSelectRecord={(r: any) => setSelection(s=>({...s, record:r}))} 
                />
              )}
              {activeTab === 'pos' && (
                <POSTerminal 
                  inventory={inventory} customers={customers} records={records} shiftHistory={shiftHistory} tasks={tasks} settings={settings} branch={branch}
                  onFinalize={handleTransactionFinalized} onAddNewInventory={() => { setSelection(s => ({ ...s, item: null })); setModals(m => ({ ...m, inventory: true })); }} 
                  onAddNewCustomer={() => { setSelection(s => ({ ...s, customer: null })); setModals(m => ({ ...m, customer: true })); }} 
                  onUpdateCustomer={handleUpdateCustomer} onUpdateInventory={(it) => setInventory(p => p.map(i => i.id === it.id ? it : i))}
                  onLogout={() => setUserRole(null)} onOpenShift={() => setModals(m => ({ ...m, shift: true }))}
                />
              )}
              {activeTab === 'inventory' && (
                <InventoryTab 
                  isLoaded={isLoaded}
                  inventory={inventory}
                  records={records}
                  onAddStock={() => { setSelection(s=>({...s, item:null})); setModals(m=>({...m, inventory:true})); }}
                  onBulkStock={() => setModals(m=>({...m, batch:true}))}
                  onEditItem={(item: any) => { setSelection(s=>({...s, item})); setModals(m=>({...m, inventory:true})); }}
                />
              )}
              {activeTab === 'customers' && (
                <CustomersTab 
                  isLoaded={isLoaded}
                  customers={customers}
                  records={records}
                  onRegister={() => { setSelection(s=>({...s, customer:null})); setModals(m=>({...m, customer:true})); }}
                  onEdit={(customer: any) => { setSelection(s=>({...s, customer})); setModals(m=>({...m, customer:true})); }}
                  onShowQR={(customer: any) => setSelection(s=>({...s, customerQR: customer}))}
                />
              )}
              {activeTab === 'records' && (
                <RecordsTab 
                  isLoaded={isLoaded}
                  records={records}
                  onSelectRecord={(record: any) => setSelection(s=>({...s, record}))}
                />
              )}
              {activeTab === 'reports' && <ReportsTab records={records} inventory={inventory} stats={stats} />}
              {activeTab === 'logs' && (
                <div className="space-y-8 animate-in">
                  <div className="space-y-2">
                    <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Audit Trail</h3>
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">System Activity & Security Registry</p>
                  </div>
                  <div className="bg-white dark:bg-[#0f172a]/50 backdrop-blur-xl rounded-[3rem] border border-slate-200 dark:border-white/5 overflow-hidden shadow-2xl">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Timestamp</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Authorized User</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Action Protocol</th>
                          <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Registry Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {activityLogs.map(log => (
                          <tr key={log.id} className="dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-8 py-6 font-mono opacity-60 text-[10px]">{new Date(log.timestamp).toLocaleString()}</td>
                            <td className="px-8 py-6 font-black uppercase tracking-tight">{log.user}</td>
                            <td className="px-8 py-6">
                              <span className="px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 font-black uppercase text-[9px] tracking-widest border border-indigo-500/20">
                                {log.action}
                              </span>
                            </td>
                            <td className="px-8 py-6 truncate max-w-xs opacity-80">{log.details}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'settings' && (
                <SettingsTab 
                  isAdmin={userRole==='admin'} branch={branch} settings={settings} recycleBinCount={recycleBin.length}
                  onUpdateBranch={(f, l) => { 
                    setInputModalConfig({ title: `Update ${l}`, label: l, field: f, defaultValue: branch[f] || '' });
                    setModals(m => ({ ...m, input: true }));
                  }} 
                  onUpdateSettings={(field, value) => {
                    setSettings(prev => {
                      const newSettings = { ...prev };
                      if (field.includes('.')) {
                        const [parent, child] = field.split('.');
                        (newSettings as any)[parent] = { ...(newSettings as any)[parent], [child]: value };
                      } else {
                        (newSettings as any)[field] = value;
                      }
                      return newSettings;
                    });
                  }}
                  onToggleTheme={() => setSettings(s => ({
                    ...s, 
                    theme: s.theme === 'light' ? 'dark' : s.theme === 'dark' ? 'midnight' : 'light'
                  }))}
                  onCycleLanguage={() => setSettings(s => ({...s, language: s.language === 'en' ? 'tl' : s.language === 'tl' ? 'bis' : 'en'}))} 
                  onToggleAutoPrint={() => setSettings(s => ({...s, autoPrintReceipt: !s.autoPrintReceipt}))}
                  setRecordForReceiptStudio={() => {}} setShowHardware={(s)=>setModals(m=>({...m, hardware:s}))} setShowBackup={(s)=>setModals(m=>({...m, backup:s}))} 
                  setShowSync={(s)=>setModals(m=>({...m, sync:s}))} setShowCatalog={() => {}} setShowCustomerCatalog={() => {}} setShowGuide={(s)=>setModals(m=>({...m, guide:s}))} 
                  setShowSettings={(s)=>setModals(m=>({...m, settings:s}))} setShowRecycleBin={(s)=>setModals(m=>({...m, bin:s}))} setShowResetConfirm={(s)=>setModals(m=>({...m, reset:s}))}
                  onAddQuickPick={() => {}} onEditQuickPick={() => {}} onDeleteQuickPick={() => {}} dummyTransaction={null}
                />
              )}
            </div>
          </main>
        </div>

        <MobileNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Modal Overlay Registry */}
        {modals.inventory && <AddInventoryModal categories={settings.categories} defaultReorderLevel={settings.lowStockThreshold} onAdd={(it) => { setInventory(p => { if (selection.item) return p.map(i => i.id === it.id ? it as InventoryItem : i); return [{ ...it, id: crypto.randomUUID() } as InventoryItem, ...p]; }); setModals(m=>({...m, inventory:false})); }} onClose={() => setModals(m=>({...m, inventory:false}))} item={selection.item} userRole={userRole!} isAiScannerEnabled={settings.enableAiScanner} />}
        {modals.customer && (
          <AddCustomerModal 
            onClose={() => setModals(m=>({...m, customer:false}))} 
            onAdd={(c) => { setCustomers(p => [{ ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...p]); setModals(m=>({...m, customer:false})); }} 
            onUpdate={handleUpdateCustomer}
            existingCustomers={customers} 
            editingCustomer={selection.customer}
          />
        )}
        {selection.record && (
          <RecordDetailsModal 
            record={selection.record} 
            onClose={() => setSelection(s=>({...s, record:null}))} 
            isAdmin={userRole==='admin'} 
            onAction={(t, r) => { 
              if(t==='payFull') handleSettleDebt(r, r.totalAmount-r.paidAmount); 
              if(t==='reminder') setModals(m => ({ ...m, reminder: true }));
              if(t!=='reminder') setSelection(s=>({...s, record:null})); 
            }} 
          />
        )}
        {modals.shift && <ShiftModal userRole={userRole!} activeShift={activeShift} shiftHistory={shiftHistory} onOpenShift={(cash) => setActiveShift({ id: crypto.randomUUID(), openedAt: new Date().toISOString(), openedBy: userRole!, startingCash: cash, cashSales: 0, movements: [], expectedTotal: cash, status: 'open' })} onCloseShift={(actual, note) => { const closed = { ...activeShift!, closedAt: new Date().toISOString(), closedBy: userRole!, actualTotal: actual, discrepancy: currency(actual - activeShift!.expectedTotal), status: 'closed' as const, note }; setShiftHistory(p => [...p, closed]); setActiveShift(null); }} onAddMovement={(type, amount, reason) => setActiveShift(p => p ? { ...p, movements: [...p.movements, { id: crypto.randomUUID(), type, amount, reason, timestamp: new Date().toISOString() }], expectedTotal: currency(p.expectedTotal + (type==='in'?amount:-amount)) } : null)} onClose={() => setModals(m=>({...m, shift:false}))} />}
        {modals.batch && <AddBatchModal userRole={userRole!} inventory={inventory} onAddBatch={(b) => { setBatches(p => [{ ...b, id: crypto.randomUUID() }, ...p]); setInventory(inv => inv.map(item => { const batchItem = b.items.find(bi => bi.productId === item.id); if(batchItem) return { ...item, stock: currency(item.stock + batchItem.quantity), originalPrice: batchItem.costPerUnit }; return item; })); }} onClose={() => setModals(m=>({...m, batch:false}))} onCreateNewItem={() => setModals(m=>({...m, inventory:true}))} />}
        {modals.settings && <AdvancedSettingsModal settings={settings} setSettings={setSettings} userRole={userRole!} onClose={() => setModals(m=>({...m, settings:false}))} onOpenReceiptStudio={()=>{}} onOpenCustomerCatalog={()=>{}} onRequestPrune={()=>{}} />}
        {modals.bin && <RecycleBinModal recycleBin={recycleBin} onRestore={(it) => { if(it.type==='inventory') setInventory(p => [it.data, ...p]); setRecycleBin(p => p.filter(x => x.id !== it.id)); }} onPermanentDelete={(id) => setRecycleBin(p => p.filter(x => x.id !== id))} onEmptyBin={() => setRecycleBin([])} onClose={() => setModals(m=>({...m, bin:false}))} />}
        {modals.logout && <ConfirmModal isOpen={true} title="End Session" message="Lock the terminal?" onConfirm={() => setUserRole(null)} onCancel={() => setModals(m=>({...m, logout:false}))} isDanger={true} />}
        {modals.backup && <BackupRestoreModal settings={settings} branch={branch} inventory={inventory} customers={customers} records={records} tasks={tasks} shiftHistory={shiftHistory} onClose={() => setModals(m=>({...m, backup:false}))} onRestore={(d, mode) => { if(mode==='replace') { if(d.inventory) setInventory(d.inventory); if(d.customers) setCustomers(d.customers); if(d.tasks) setTasks(d.tasks); } else { if(d.inventory) setInventory(p => [...d.inventory!, ...p]); if(d.tasks) setTasks(p => [...d.tasks!, ...p]); } }} />}
        {modals.sync && <SyncDevicesModal onClose={() => setModals(m=>({...m, sync:false}))} onRestore={(d, mode) => { if(mode==='replace') { if(d.inventory) setInventory(d.inventory); if(d.customers) setCustomers(d.customers); if(d.tasks) setTasks(d.tasks!); } else { if(d.inventory) setInventory(p => [...d.inventory!, ...p]); if(d.tasks) setTasks(p => [...d.tasks!, ...p]); } }} currentData={{ inventory, customers, records, tasks, settings, branch }} />}
        {modals.hardware && <HardwareSettingsModal onClose={() => setModals(m=>({...m, hardware:false}))} />}
        {modals.guide && <UserGuideModal onClose={() => setModals(m=>({...m, guide:false}))} />}
        {modals.reset && <ConfirmModal isOpen={true} title="KERNEL WIPE" message="Destroy all database tables? A backup will be downloaded automatically." onConfirm={() => { handleEmergencyBackup(); localStorage.clear(); window.location.reload(); }} onCancel={() => setModals(m=>({...m, reset:false}))} isDanger={true} />}
        
        {selection.customerQR && <CustomerQRModal customer={selection.customerQR} onClose={() => setSelection(s=>({...s, customerQR: null}))} />}

        {/* Quick Actions Trigger */}
        <button 
          onClick={() => setIsCommandPaletteOpen(true)}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-2xl shadow-indigo-500/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group"
        >
          <div className="absolute -top-12 right-0 bg-slate-900 text-white text-[10px] font-black px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-widest">
            Quick Actions (⌘K)
          </div>
          <Plus size={24} className={`transition-transform duration-300 ${isCommandPaletteOpen ? 'rotate-45' : ''}`} />
        </button>

        <CommandPalette 
          isOpen={isCommandPaletteOpen} 
          onClose={() => setIsCommandPaletteOpen(false)} 
          onNavigate={setActiveTab}
          onAction={(action) => {
            if (action === 'add-stock') setModals(m => ({ ...m, inventory: true }));
            if (action === 'add-suki') setModals(m => ({ ...m, customer: true }));
            if (action === 'logout') setUserRole(null);
          }}
        />

        {modals.input && (
          <InputModal 
            isOpen={true} 
            title={inputModalConfig.title} 
            label={inputModalConfig.label} 
            defaultValue={inputModalConfig.defaultValue} 
            onConfirm={(val) => { setBranch(p => ({ ...p, [inputModalConfig.field]: val })); setModals(m => ({ ...m, input: false })); addToast('Store Info Updated'); }} 
            onCancel={() => setModals(m => ({ ...m, input: false }))} 
          />
        )}

        {modals.notifications && (
          <NotificationsModal 
            records={records} 
            onClose={() => setModals(m => ({ ...m, notifications: false }))} 
            onAcknowledge={handleAcknowledgeReminder}
            onNavigateToRecord={(r) => { setActiveTab('records'); setSelection(s => ({ ...s, record: r })); setModals(m => ({ ...m, notifications: false })); }}
          />
        )}

        {modals.reminder && selection.record && (
          <ReminderModal 
            record={selection.record} 
            onClose={() => setModals(m => ({ ...m, reminder: false }))} 
            onSave={(freq, date, note) => {
              setRecords(prev => prev.map(r => r.id === selection.record!.id ? { ...r, reminderFrequency: freq, nextReminderDate: date, reminderNote: note } : r));
              addToast('Reminder Updated');
              setModals(m => ({ ...m, reminder: false }));
              setSelection(s => ({ ...s, record: null }));
            }}
          />
        )}

        {/* Toast Notification System */}
        <div className="fixed bottom-24 md:bottom-8 right-8 z-[1000] flex flex-col gap-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-6 py-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3 animate-in slide-in-from-right-4 duration-300 ${t.type === 'error' ? 'bg-rose-500 text-white' : t.type === 'info' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
              <span className="text-lg">{t.type === 'error' ? '❌' : t.type === 'info' ? 'ℹ️' : '✅'}</span>
              <p className="text-xs font-black uppercase tracking-widest">{t.message}</p>
            </div>
          ))}
        </div>
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
