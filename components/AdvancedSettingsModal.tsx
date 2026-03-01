import React, { useState } from 'react';
import { AppSettings, UserRole } from '../types';

interface AdvancedSettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onOpenReceiptStudio: () => void;
  onOpenCustomerCatalog: () => void;
  onRequestPrune: () => void;
  userRole?: UserRole;
}

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ 
  onClose, settings, setSettings, userRole = 'cashier' 
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showCashierPin, setShowCashierPin] = useState(false);
  const isAdmin = userRole === 'admin';
  
  const handleAddCategory = () => {
    if (!isAdmin) return;
    const cat = newCategory.trim();
    if (cat && !settings.categories.includes(cat)) {
      setSettings(prev => ({ ...prev, categories: [...prev.categories, cat] }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    if (!isAdmin || settings.categories.length <= 1) return;
    if (window.confirm(`Expunge category "${cat}"? This action cannot be undone.`)) {
        setSettings(prev => ({ ...prev, categories: prev.categories.filter(c => c !== cat) }));
    }
  };

  const updateNumericSetting = (field: keyof AppSettings, val: string) => {
    if (!isAdmin) return;
    const num = parseFloat(val) || 0;
    if (num < 0) return;
    setSettings(prev => ({ ...prev, [field]: num }));
  };

  const updatePIN = (type: 'adminPin' | 'cashierPin', val: string) => {
    if (!isAdmin) return;
    const pin = val.replace(/[^0-9]/g, '').slice(0, 4);
    setSettings(prev => ({ ...prev, auth: { ...prev.auth, [type]: pin } }));
  };

  const inputContainer = "bg-[#020617] border border-slate-800 rounded-2xl flex items-center overflow-hidden focus-within:border-indigo-500/50 transition-all h-14 ring-1 ring-white/5 shadow-inner";
  const inputEl = "w-full h-full px-4 bg-transparent text-white font-black text-xs outline-none placeholder:text-slate-700 disabled:opacity-30";
  const blockTitle = "text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-3 px-1";

  return (
  <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center z-[501] p-4 animate-in fade-in duration-300">
    <div className="absolute inset-0" onClick={onClose}></div>
    <div className="w-full max-w-5xl bg-white dark:bg-[#0f172a] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative z-10">
      
      {/* Header Panel */}
      <div className="p-6 md:p-8 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a] shrink-0 border-b border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-2xl ring-1 ring-indigo-500/20 shadow-sm">🛠️</div>
           <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">System <span className="text-indigo-500">Settings</span></h2>
              <div className="flex items-center gap-2 mt-0.5">
                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Security Level 2 • Authorized Access</p>
              </div>
           </div>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white hover:bg-rose-500 hover:text-white transition-all active:scale-90 border border-slate-300 dark:border-white/10 text-lg">✕</button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-white dark:bg-[#020617]/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Rack: Logic & Categories */}
          <div className="lg:col-span-7 space-y-8">
            <section>
              <h4 className={blockTitle}>Database Taxonomy</h4>
              <div className="p-6 bg-slate-50 dark:bg-[#1e293b]/30 rounded-[2rem] border border-slate-200 dark:border-white/5 space-y-6">
                <div className="flex gap-2">
                  <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center overflow-hidden focus-within:border-indigo-500/50 transition-all h-12 flex-1 shadow-sm">
                    <input disabled={!isAdmin} placeholder="ENTER NEW CATEGORY LABEL..." className="w-full h-full px-4 bg-transparent text-slate-900 dark:text-white font-bold text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-slate-700 disabled:opacity-30" value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                  </div>
                  <button onClick={handleAddCategory} disabled={!newCategory.trim() || !isAdmin} className="h-12 px-6 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-30 transition shadow-lg shadow-indigo-500/20">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.categories.map(cat => (
                    <div key={cat} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#020617] rounded-lg border border-slate-200 dark:border-white/5 group hover:border-indigo-500/30 transition-all shadow-sm">
                        <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">{cat}</span>
                        <button disabled={!isAdmin} onClick={() => handleRemoveCategory(cat)} className="text-slate-400 hover:text-rose-500 transition text-[10px] opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h4 className={blockTitle}>Automation Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-slate-50 dark:bg-[#1e293b]/30 rounded-[2rem] border border-slate-200 dark:border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Expiry Proximity (Days)</span>
                  <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center overflow-hidden focus-within:border-indigo-500/50 transition-all h-12 shadow-sm">
                     <input disabled={!isAdmin} type="number" className="w-full h-full px-4 bg-transparent text-slate-900 dark:text-white font-bold text-center text-base outline-none" value={settings.expiryThresholdDays} onChange={e => updateNumericSetting('expiryThresholdDays', e.target.value)} />
                  </div>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-[#1e293b]/30 rounded-[2rem] border border-slate-200 dark:border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Stock Floor Alert</span>
                  <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center overflow-hidden focus-within:border-indigo-500/50 transition-all h-12 shadow-sm">
                     <input disabled={!isAdmin} type="number" className="w-full h-full px-4 bg-transparent text-slate-900 dark:text-white font-bold text-center text-base outline-none" value={settings.lowStockThreshold} onChange={e => updateNumericSetting('lowStockThreshold', e.target.value)} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Rack: Access & Security */}
          <div className="lg:col-span-5 space-y-8">
            <section>
               <h4 className={blockTitle}>Security Protocols</h4>
               <div className="p-6 bg-slate-50 dark:bg-gradient-to-b dark:from-[#1e293b]/50 dark:to-[#0f172a]/50 rounded-[2rem] border border-slate-200 dark:border-indigo-500/10 space-y-6 relative">
                  {!isAdmin && <div className="absolute inset-0 bg-white/60 dark:bg-[#020617]/60 backdrop-blur-[2px] z-10 rounded-[2rem] flex items-center justify-center p-8"><div className="bg-rose-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-pulse">Insufficient Clearance</div></div>}
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Master Override PIN (Level 2)</p>
                      <div className="relative">
                        <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center overflow-hidden focus-within:border-indigo-500/50 transition-all h-14 shadow-sm">
                          <input type={showAdminPin ? "text" : "password"} disabled={!isAdmin} maxLength={4} className="w-full h-full px-4 bg-transparent text-slate-900 dark:text-white font-black tracking-[1.5em] text-center text-lg outline-none" value={settings.auth.adminPin} onChange={e => updatePIN('adminPin', e.target.value)} />
                        </div>
                        <button onClick={() => setShowAdminPin(!showAdminPin)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition">{showAdminPin ? '🙈' : '👁️'}</button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Cashier Access PIN (Level 1)</p>
                      <div className="relative">
                        <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center overflow-hidden focus-within:border-indigo-500/50 transition-all h-14 shadow-sm">
                          <input type={showCashierPin ? "text" : "password"} disabled={!isAdmin} maxLength={4} className="w-full h-full px-4 bg-transparent text-slate-900 dark:text-white font-black tracking-[1.5em] text-center text-lg outline-none" value={settings.auth.cashierPin} onChange={e => updatePIN('cashierPin', e.target.value)} />
                        </div>
                        <button onClick={() => setShowCashierPin(!showCashierPin)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-indigo-500 transition">{showCashierPin ? '🙈' : '👁️'}</button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">System Auto-Lockout</p>
                    <div className="bg-white dark:bg-[#020617] border border-slate-200 dark:border-slate-800 rounded-xl flex items-center overflow-hidden focus-within:border-indigo-500/50 transition-all h-12 shadow-sm">
                      <select disabled={!isAdmin} className="w-full h-full px-4 bg-transparent text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest cursor-pointer outline-none appearance-none" value={settings.autoLockMinutes} onChange={e => setSettings(prev => ({...prev, autoLockMinutes: parseInt(e.target.value) as any}))}>
                        <option value="0" className="bg-white dark:bg-[#0f172a]">Disabled</option>
                        <option value="5" className="bg-white dark:bg-[#0f172a]">5 Minutes</option>
                        <option value="15" className="bg-white dark:bg-[#0f172a]">15 Minutes</option>
                        <option value="30" className="bg-white dark:bg-[#0f172a]">30 Minutes</option>
                      </select>
                    </div>
                  </div>
               </div>
            </section>

            <section>
              <h4 className={blockTitle}>System Extension</h4>
              <div className="p-5 bg-slate-50 dark:bg-[#1e293b]/30 rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center text-lg ring-1 ring-indigo-500/20">✨</div>
                     <div>
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">AI Neural Scanner</p>
                        <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">ML Product Entry</p>
                     </div>
                  </div>
                  <div onClick={() => isAdmin && setSettings(prev => ({...prev, enableAiScanner: !prev.enableAiScanner}))} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-all duration-300 ${settings.enableAiScanner ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-800'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${settings.enableAiScanner ? 'translate-x-4' : ''}`} />
                  </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-6 md:p-8 bg-slate-50 dark:bg-[#0f172a] border-t border-slate-200 dark:border-white/10 flex gap-4 shrink-0">
        <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white transition-all active:scale-95 border border-slate-200 dark:border-white/10">Discard</button>
        <button onClick={onClose} className="flex-[2] py-4 bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95">Save Changes</button>
      </div>
    </div>
  </div>
  );
};

export default AdvancedSettingsModal;