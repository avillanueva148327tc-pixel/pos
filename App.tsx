import React, { useState, useEffect, useMemo, createContext, useCallback } from 'react';
import { 
  InventoryItem, Customer, UtangRecord, AppSettings, BranchConfig, 
  UserRole, BatchRecord, Stats as StatsType, RecycleBinItem, ShiftRecord, UtangItem, QuickPickItem, ActivityLog,
  BackupData 
} from './types';

// Components & Services
import LoginScreen from './components/LoginScreen';
import Stats from './components/Stats';
import POSTerminal from './components/POSTerminal';
import AddInventoryModal from './components/AddInventoryModal';
import AddCustomerModal from './components/AddCustomerModal';
import RecordDetailsModal from './components/RecordDetailsModal';
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
import { SecurityService } from './services/securityService';
import { TransactionService, currency } from './services/transactionService';

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
  receiptTemplate: { showBranchAddress: true, showBranchContact: true, showCustomerId: true, showItemSize: true, showDateTime: true, footerText: "Thank you for your business!", brandingText: "Sari-Sari Pro", headerAlignment: 'center', paperWidth: '58mm', fontFamily: 'Inter', fontSize: 14, layout: 'modern', accentColor: '#6366f1' },
  uiCustomization: { fontFamily: 'Inter', fontSize: 'base', compactMode: false, deviceMode: 'desktop' }
};

const App: React.FC = () => {
  // Domain Data Kernel
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [records, setRecords] = useState<UtangRecord[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [recycleBin, setRecycleBin] = useState<RecycleBinItem[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftRecord | null>(null);
  const [shiftHistory, setShiftHistory] = useState<ShiftRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [branch, setBranch] = useState<BranchConfig>(defaultBranch);
  const [isLoaded, setIsLoaded] = useState(false);

  // UI Flow Control
  const [activeTab, setActiveTab] = useState('pos');
  const [modals, setModals] = useState({ inventory: false, customer: false, bin: false, logout: false, shift: false, batch: false, backup: false, sync: false, hardware: false, guide: false, settings: false, reset: false });
  const [selection, setSelection] = useState({ record: null as UtangRecord | null, item: null as InventoryItem | null });

  // Terminal Persistence
  const [cart, setCart] = useState<{ items: UtangItem[], customer: string, isWalkIn: boolean }>({ items: [], customer: 'Walk-in Customer', isWalkIn: true });

  // 1. Kernel Boot Sequence
  useEffect(() => {
    (async () => {
      const [inv, cust, rec, bats, logs, bin, ashift, shist, brn, sets] = await Promise.all([
        SecurityService.secureLoad('inventory', []), SecurityService.secureLoad('customers', []),
        SecurityService.secureLoad('records', []), SecurityService.secureLoad('batches', []),
        SecurityService.secureLoad('activityLogs', []), SecurityService.secureLoad('recycleBin', []),
        SecurityService.secureLoad('activeShift', null), SecurityService.secureLoad('shiftHistory', []),
        SecurityService.secureLoad('branch', defaultBranch), SecurityService.secureLoad('settings', defaultSettings)
      ]);
      setInventory(inv); setCustomers(cust); setRecords(rec); setBatches(bats); setActivityLogs(logs); 
      setRecycleBin(bin); setActiveShift(ashift); setShiftHistory(shist); setBranch(brn); setSettings(sets);
      setIsLoaded(true);
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
      SecurityService.vacuum(activityLogs).then(v => SecurityService.secureSave('activityLogs', v));
    }
  }, [inventory, customers, records, batches, recycleBin, activeShift, shiftHistory, activityLogs, settings, branch, userRole, isLoaded]);

  // 2.1 UI Engine
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
    
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.uiCustomization, settings.theme]);

  const addLog = useCallback((action: string, details: string, type: ActivityLog['type'] = 'info') => {
    setActivityLogs(p => [{ id: crypto.randomUUID(), timestamp: new Date().toISOString(), user: userRole || 'System', action, details, type }, ...p].slice(0, 500));
  }, [userRole]);

  // 3. Centralized Transaction Background Processor
  const handleTransaction = useCallback((data: any) => {
    const result = TransactionService.processTransaction(data, inventory, records, customers, settings);
    if (result.success) {
      setInventory(result.updatedInventory);
      setRecords(result.updatedRecords);
      setCart({ items: [], customer: 'Walk-in Customer', isWalkIn: true });
      
      if (activeShift && data.isPaid) {
        setActiveShift(prev => prev ? {
          ...prev, cashSales: currency(prev.cashSales + data.totalAmount),
          expectedTotal: currency(prev.expectedTotal + data.totalAmount)
        } : null);
      }
      addLog('TX_COMMIT', `Sale: P${data.totalAmount.toFixed(2)}`);
      return true;
    }
    return false;
  }, [inventory, records, customers, settings, activeShift, addLog]);

  const handleSettleDebt = useCallback((record: UtangRecord, amount: number) => {
    setRecords(prev => TransactionService.settleDebt(record, amount, prev));
    if (activeShift) {
        setActiveShift(prev => prev ? {
            ...prev, cashSales: currency(prev.cashSales + amount),
            expectedTotal: currency(prev.expectedTotal + amount)
        } : null);
    }
    addLog('DEBT_PAY', `Payment for ${record.customerName}: P${amount}`);
  }, [activeShift, addLog]);

  // 4. Background Financial Analytics
  const stats: StatsType = useMemo(() => {
    const unpaid = records.filter(r => !r.isPaid);
    const totalSales = records.filter(r => r.isPaid).reduce((s, r) => s + r.totalAmount, 0);
    const invVal = inventory.reduce((s, i) => s + (i.stock * i.price), 0);
    const debtVal = unpaid.reduce((s, r) => s + (r.totalAmount - r.paidAmount), 0);
    const costOfSales = records.filter(r => r.isPaid).flatMap(r => r.items).reduce((s, i) => s + ((i.cost || 0) * i.quantity), 0);

    return {
      totalCount: records.length, totalAmount: records.reduce((s, r) => s + r.totalAmount, 0),
      unpaidTotal: debtVal, activeDebtors: new Set(unpaid.map(r => r.customerName)).size,
      lowStockCount: inventory.filter(i => i.stock <= i.reorderLevel).length,
      totalInventoryValue: invVal, totalInvestmentValue: inventory.reduce((s, i) => s + (i.stock * (i.originalPrice || 0)), 0),
      potentialProfit: inventory.reduce((s, i) => s + (i.stock * (i.price - (i.originalPrice || 0))), 0),
      dailySales: totalSales, monthlySales: totalSales, monthlyExpenses: batches.reduce((s, b) => s + b.totalCost, 0),
      monthlyNetProfit: currency(totalSales - costOfSales), debtRatio: invVal > 0 ? currency((debtVal / invVal) * 100) : 0
    };
  }, [records, inventory, batches]);

  if (!userRole) return <LoginScreen onLogin={(p) => {
    if (p === settings.auth.adminPin) setUserRole('admin');
    else if (p === settings.auth.cashierPin) setUserRole('cashier');
    else { alert("INVALID PIN"); addLog('AUTH_FAIL', 'Invalid Attempt', 'critical'); }
  }} />;

  return (
    <ThemeContext.Provider value={{ theme: settings.theme, toggleTheme: () => setSettings(s => ({...s, theme: s.theme === 'dark' ? 'light' : 'dark'})), ui: settings.uiCustomization }}>
      <div className={`h-screen w-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white overflow-hidden ${settings.uiCustomization.compactMode ? 'compact-mode' : ''}`}>
        <DesktopSidebar activeTab={activeTab} setActiveTab={setActiveTab} activeShift={activeShift} onOpenShiftModal={() => setModals(m=>({...m, shift:true}))} />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="px-6 py-4 flex justify-between items-center bg-white dark:bg-[#0f172a] border-b border-slate-200 dark:border-white/10 shrink-0">
            <h2 className="text-xl font-black uppercase tracking-widest text-indigo-500">{navItems.find(i => i.id === activeTab)?.label || 'POS'}</h2>
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 rounded-xl text-[9px] font-black uppercase border dark:border-white/10 bg-slate-100 dark:bg-white/5">
                 {userRole === 'admin' ? 'Admin' : 'Cashier'} • {activeShift ? 'Open' : 'Closed'}
               </div>
               <button onClick={() => setModals(m=>({...m, logout:true}))} className="px-5 py-2.5 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-black uppercase">Exit</button>
            </div>
          </header>

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full">
              {activeTab === 'pos' && (
                <POSTerminal 
                  inventory={inventory} customers={customers} records={records} settings={settings} branch={branch}
                  transactionItems={cart.items} customerName={cart.customer} isWalkIn={cart.isWalkIn}
                  setTransactionItems={(it)=>setCart(c=>({...c, items:it}))} setCustomerName={(n)=>setCart(c=>({...c, customer:n}))} setIsWalkIn={(w)=>setCart(c=>({...c, isWalkIn:w}))}
                  onProcessTransaction={handleTransaction} onAddNewInventory={() => setModals(m=>({...m, inventory:true}))} onRegisterCustomer={() => setModals(m=>({...m, customer:true}))} 
                  adminPinHash="" receiptTemplate={settings.receiptTemplate} quickPicks={settings.quickPicks} autoPrintReceipt={settings.autoPrintReceipt} activeShift={activeShift} setSettings={setSettings}
                  onUpdateRecord={(id,u)=>setRecords(p=>p.map(r=>r.id===id?{...r,...u}:r))} onUpdateQuickPicks={(qp)=>setSettings(s=>({...s, quickPicks:qp}))} onOpenShiftModal={()=>setModals(m=>({...m, shift:true}))}
                />
              )}
              {activeTab === 'inventory' && (
                <div className="space-y-6">
                  <div className="flex gap-3">
                    <button onClick={() => { setSelection(s=>({...s, item:null})); setModals(m=>({...m, inventory:true})); }} className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase">+ Add Stock</button>
                    <button onClick={() => setModals(m=>({...m, batch:true}))} className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase">📦 Bulk Stock-In</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inventory.map(item => (
                      <div key={item.id} className="p-5 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-white/10 flex justify-between items-center group shadow-sm">
                         <div className="min-w-0">
                            <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-widest">{item.category}</span>
                            <h4 className="font-black text-sm uppercase truncate mt-1">{item.name}</h4>
                            <p className="text-[10px] text-slate-500 font-bold mt-1">P{item.price.toFixed(2)} • Stock: <span className={item.stock <= item.reorderLevel ? 'text-rose-500' : 'text-emerald-500'}>{item.stock} {item.unit}</span></p>
                         </div>
                         <button onClick={() => { setSelection(s=>({...s, item})); setModals(m=>({...m, inventory:true})); }} className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center border border-slate-100 dark:border-white/5 hover:bg-indigo-500 hover:text-white transition-all">✏️</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeTab === 'records' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {records.map(record => (
                    <div key={record.id} onClick={() => setSelection(s=>({...s, record}))} className={`p-5 bg-white dark:bg-[#1e293b] rounded-3xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 cursor-pointer transition shadow-sm`}>
                       <div className="flex justify-between mb-2">
                         <p className="text-[9px] font-black text-slate-500 uppercase">{new Date(record.date).toLocaleDateString()}</p>
                         <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase ${record.isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>{record.isPaid ? 'Settled' : 'Debt'}</span>
                       </div>
                       <h4 className="font-black text-sm uppercase truncate">{record.customerName}</h4>
                       <p className="text-[10px] text-slate-400 mt-1 uppercase line-clamp-1">{record.product}</p>
                       <div className="mt-4 pt-4 border-t dark:border-white/5 flex justify-between items-end">
                          <p className="text-xl font-black">P{record.totalAmount.toFixed(2)}</p>
                          {!record.isPaid && <p className="text-[9px] font-bold text-rose-500 uppercase">Bal: P{(record.totalAmount - record.paidAmount).toFixed(2)}</p>}
                       </div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'reports' && <ReportsTab records={records} inventory={inventory} />}
              {activeTab === 'logs' && (
                <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-200 dark:border-white/5 overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-white/5 font-black uppercase text-slate-400 border-b dark:border-white/5">
                      <tr><th className="px-6 py-4">Timestamp</th><th className="px-6 py-4">User</th><th className="px-6 py-4">Action</th><th className="px-6 py-4">Details</th></tr>
                    </thead>
                    <tbody className="divide-y dark:divide-white/5">
                      {activityLogs.map(log => (
                        <tr key={log.id} className="dark:text-slate-300">
                          <td className="px-6 py-4 font-mono opacity-60">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="px-6 py-4 font-bold uppercase">{log.user}</td>
                          <td className="px-6 py-4"><span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-black">{log.action}</span></td>
                          <td className="px-6 py-4 truncate max-w-xs">{log.details}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'settings' && (
                <SettingsTab 
                  isAdmin={userRole==='admin'} branch={branch} settings={settings} recycleBinCount={recycleBin.length}
                  onUpdateBranch={(f, l) => { const n = prompt(`Enter New ${l}`, branch[f] || ''); if(n) setBranch(p => ({...p, [f]: n})); }} 
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
                  onToggleTheme={() => setSettings(s => ({...s, theme: s.theme === 'dark' ? 'light' : 'dark'}))}
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
        {modals.customer && <AddCustomerModal onAdd={(c) => { setCustomers(p => [{ ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...p]); setModals(m=>({...m, customer:false})); }} onClose={() => setModals(m=>({...m, customer:false}))} existingCustomers={customers} />}
        {selection.record && <RecordDetailsModal record={selection.record} onClose={() => setSelection(s=>({...s, record:null}))} isAdmin={userRole==='admin'} onAction={(t, r) => { if(t==='payFull') handleSettleDebt(r, r.totalAmount-r.paidAmount); setSelection(s=>({...s, record:null})); }} />}
        {modals.shift && <ShiftModal userRole={userRole!} activeShift={activeShift} shiftHistory={shiftHistory} onOpenShift={(cash) => setActiveShift({ id: crypto.randomUUID(), openedAt: new Date().toISOString(), openedBy: userRole!, startingCash: cash, cashSales: 0, movements: [], expectedTotal: cash, status: 'open' })} onCloseShift={(actual, note) => { const closed = { ...activeShift!, closedAt: new Date().toISOString(), closedBy: userRole!, actualTotal: actual, discrepancy: currency(actual - activeShift!.expectedTotal), status: 'closed' as const, note }; setShiftHistory(p => [...p, closed]); setActiveShift(null); }} onAddMovement={(type, amount, reason) => setActiveShift(p => p ? { ...p, movements: [...p.movements, { id: crypto.randomUUID(), type, amount, reason, timestamp: new Date().toISOString() }], expectedTotal: currency(p.expectedTotal + (type==='in'?amount:-amount)) } : null)} onClose={() => setModals(m=>({...m, shift:false}))} />}
        {modals.batch && <AddBatchModal userRole={userRole!} inventory={inventory} onAddBatch={(b) => { setBatches(p => [{ ...b, id: crypto.randomUUID() }, ...p]); setInventory(inv => inv.map(item => { const batchItem = b.items.find(bi => bi.productId === item.id); if(batchItem) return { ...item, stock: currency(item.stock + batchItem.quantity), originalPrice: batchItem.costPerUnit }; return item; })); }} onClose={() => setModals(m=>({...m, batch:false}))} onCreateNewItem={() => setModals(m=>({...m, inventory:true}))} />}
        {modals.settings && <AdvancedSettingsModal settings={settings} setSettings={setSettings} userRole={userRole!} onClose={() => setModals(m=>({...m, settings:false}))} onOpenReceiptStudio={()=>{}} onOpenCustomerCatalog={()=>{}} onRequestPrune={()=>{}} />}
        {modals.bin && <RecycleBinModal recycleBin={recycleBin} onRestore={(it) => { if(it.type==='inventory') setInventory(p => [it.data, ...p]); setRecycleBin(p => p.filter(x => x.id !== it.id)); }} onPermanentDelete={(id) => setRecycleBin(p => p.filter(x => x.id !== id))} onEmptyBin={() => setRecycleBin([])} onClose={() => setModals(m=>({...m, bin:false}))} />}
        {modals.logout && <ConfirmModal isOpen={true} title="End Session" message="Lock the terminal?" onConfirm={() => setUserRole(null)} onCancel={() => setModals(m=>({...m, logout:false}))} isDanger={true} />}
        {modals.backup && <BackupRestoreModal settings={settings} branch={branch} inventory={inventory} customers={customers} records={records} shiftHistory={shiftHistory} onClose={() => setModals(m=>({...m, backup:false}))} onRestore={(d, mode) => { if(mode==='replace') { if(d.inventory) setInventory(d.inventory); if(d.customers) setCustomers(d.customers); } else { if(d.inventory) setInventory(p => [...d.inventory!, ...p]); } }} />}
        {modals.sync && <SyncDevicesModal onClose={() => setModals(m=>({...m, sync:false}))} onRestore={()=>{}} currentData={{ inventory, customers, records, settings, branch }} />}
        {modals.hardware && <HardwareSettingsModal onClose={() => setModals(m=>({...m, hardware:false}))} />}
        {modals.guide && <UserGuideModal onClose={() => setModals(m=>({...m, guide:false}))} />}
        {modals.reset && <ConfirmModal isOpen={true} title="KERNEL WIPE" message="Destroy all database tables?" onConfirm={() => { localStorage.clear(); window.location.reload(); }} onCancel={() => setModals(m=>({...m, reset:false}))} isDanger={true} />}
      </div>
    </ThemeContext.Provider>
  );
};

export default App;
