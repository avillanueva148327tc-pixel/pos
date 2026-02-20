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
  <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[501] p-4 animate-in fade-in duration-300">
    <div className="w-full max-w-5xl bg-[#0f172a] rounded-[3rem] border border-white/5 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
      
      {/* Laser Border Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.5)]"></div>

      {/* Header Panel */}
      <div className="p-8 md:p-10 flex justify-between items-center bg-[#0f172a] shrink-0 border-b border-white/5">
        <div className="flex items-center gap-6">
           <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-3xl ring-1 ring-indigo-500/30 shadow-lg shadow-indigo-500/5">🛠️</div>
           <div>
              <h2 className="text-2xl font-black tracking-tighter text-white uppercase">System <span className="text-indigo-500">Command</span></h2>
              <div className="flex items-center gap-2 mt-1">
                 <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Security Level 2 • Active Authorization</p>
              </div>
           </div>
        </div>
        <button onClick={onClose} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-all active:scale-90 border border-white/5 text-xl">✕</button>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar bg-[#020617]/40">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Rack: Logic & Categories */}
          <div className="lg:col-span-7 space-y-8">
            <section>
              <h4 className={blockTitle}>Database Taxonomy</h4>
              <div className="p-6 bg-[#1e293b]/30 rounded-[2.5rem] border border-white/5 space-y-6">
                <div className="flex gap-2">
                  <div className={`${inputContainer} flex-1`}>
                    <input disabled={!isAdmin} placeholder="ENTER NEW CATEGORY LABEL..." className={inputEl} value={newCategory} onChange={e => setNewCategory(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                  </div>
                  <button onClick={handleAddCategory} disabled={!newCategory.trim() || !isAdmin} className="h-14 px-8 bg-indigo-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-30 transition shadow-lg shadow-indigo-500/20">Inject</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {settings.categories.map(cat => (
                    <div key={cat} className="flex items-center gap-3 px-4 py-2.5 bg-[#020617] rounded-xl border border-white/5 group hover:border-indigo-500/30 transition-all">
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">{cat}</span>
                        <button disabled={!isAdmin} onClick={() => handleRemoveCategory(cat)} className="text-slate-600 hover:text-rose-500 transition text-xs opacity-0 group-hover:opacity-100">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h4 className={blockTitle}>Automation Parameters</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 bg-[#1e293b]/30 rounded-[2.5rem] border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Expiry Proximity (Days)</span>
                  <div className={inputContainer}>
                     <input disabled={!isAdmin} type="number" className={`${inputEl} text-center text-lg`} value={settings.expiryThresholdDays} onChange={e => updateNumericSetting('expiryThresholdDays', e.target.value)} />
                  </div>
                </div>
                <div className="p-6 bg-[#1e293b]/30 rounded-[2.5rem] border border-white/5">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Stock Floor Alert</span>
                  <div className={inputContainer}>
                     <input disabled={!isAdmin} type="number" className={`${inputEl} text-center text-lg`} value={settings.lowStockThreshold} onChange={e => updateNumericSetting('lowStockThreshold', e.target.value)} />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Rack: Access & Security */}
          <div className="lg:col-span-5 space-y-8">
            <section>
               <h4 className={blockTitle}>Security Protocols</h4>
               <div className="p-8 bg-gradient-to-b from-[#1e293b]/50 to-[#0f172a]/50 rounded-[3rem] border border-indigo-500/10 space-y-8 relative">
                  {!isAdmin && <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-[2px] z-10 rounded-[3rem] flex items-center justify-center p-8"><div className="bg-rose-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-pulse">Insufficient Clearance</div></div>}
                  
                  <div className="space-y-6">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Master Override PIN (Level 2)</p>
                      <div className="relative">
                        <div className={inputContainer}>
                          <input type={showAdminPin ? "text" : "password"} disabled={!isAdmin} maxLength={4} className={`${inputEl} tracking-[1.5em] text-center text-xl h-16 text-indigo-400`} value={settings.auth.adminPin} onChange={e => updatePIN('adminPin', e.target.value)} />
                        </div>
                        <button onClick={() => setShowAdminPin(!showAdminPin)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-white transition">{showAdminPin ? '🙈' : '👁️'}</button>
                      </div>
                    </div>

                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">Cashier Access PIN (Level 1)</p>
                      <div className="relative">
                        <div className={inputContainer}>
                          <input type={showCashierPin ? "text" : "password"} disabled={!isAdmin} maxLength={4} className={`${inputEl} tracking-[1.5em] text-center text-xl h-16 text-indigo-400`} value={settings.auth.cashierPin} onChange={e => updatePIN('cashierPin', e.target.value)} />
                        </div>
                        <button onClick={() => setShowCashierPin(!showCashierPin)} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-slate-600 hover:text-white transition">{showCashierPin ? '🙈' : '👁️'}</button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-3">System Auto-Lockout</p>
                    <select disabled={!isAdmin} className={`${inputContainer} w-full px-4 appearance-none text-white font-black text-[10px] uppercase tracking-widest cursor-pointer outline-none focus:border-indigo-500/50 transition-all`} value={settings.autoLockMinutes} onChange={e => setSettings(prev => ({...prev, autoLockMinutes: parseInt(e.target.value) as any}))}>
                      <option value="0" className="bg-[#0f172a]">Disabled</option>
                      <option value="5" className="bg-[#0f172a]">5 Minutes</option>
                      <option value="15" className="bg-[#0f172a]">15 Minutes</option>
                      <option value="30" className="bg-[#0f172a]">30 Minutes</option>
                    </select>
                  </div>
               </div>
            </section>

            <section>
              <h4 className={blockTitle}>System Extension</h4>
              <div className="p-6 bg-[#1e293b]/30 rounded-[2.5rem] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-xl ring-1 ring-white/5">✨</div>
                     <div>
                        <p className="text-xs font-black text-white uppercase leading-none">AI Neural Scanner</p>
                        <p className="text-[9px] text-slate-500 mt-1 uppercase">Machine Learning Product Entry</p>
                     </div>
                  </div>
                  <div onClick={() => isAdmin && setSettings(prev => ({...prev, enableAiScanner: !prev.enableAiScanner}))} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-all duration-300 ${settings.enableAiScanner ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]' : 'bg-slate-800'}`}>
                      <div className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform duration-300 ${settings.enableAiScanner ? 'translate-x-5' : ''}`} />
                  </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-8 bg-[#0f172a] border-t border-white/5 flex gap-4 shrink-0">
        <button onClick={onClose} className="flex-1 py-5 bg-white/5 text-slate-400 rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-white/10 hover:text-white transition-all active:scale-95 border border-white/5">Cancel Session</button>
        <button onClick={onClose} className="flex-[2] py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-500/30 hover:bg-indigo-600 transition-all active:scale-95">Commit System Changes</button>
      </div>
    </div>
  </div>
  );
};

export default AdvancedSettingsModal;