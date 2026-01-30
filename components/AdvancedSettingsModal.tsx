
import React, { useState } from 'react';
import { AppSettings } from '../types';

interface AdvancedSettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onOpenReceiptStudio: () => void;
}

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ onClose, settings, setSettings, onOpenReceiptStudio }) => {
  const [newCategory, setNewCategory] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [showCashierPin, setShowCashierPin] = useState(false);

  const handleAddCategory = () => {
    if (newCategory.trim() && !settings.categories.includes(newCategory.trim())) {
      setSettings(prev => ({
        ...prev,
        categories: [...prev.categories, newCategory.trim()]
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (cat: string) => {
    if (settings.categories.length <= 1) {
      alert("You must have at least one category.");
      return;
    }
    if (window.confirm(`Remove category "${cat}"? Items in this category will remain unchanged but you won't be able to select this category for new items.`)) {
        setSettings(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c !== cat)
        }));
    }
  };

  const isSalesTargetEnabled = settings.dailySalesTarget > 0;

  const toggleSalesTarget = () => {
    if (isSalesTargetEnabled) {
      setSettings(prev => ({ ...prev, dailySalesTarget: 0 }));
    } else {
      setSettings(prev => ({ ...prev, dailySalesTarget: 5000 }));
    }
  };

  const labelStyle = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1";
  const inputStyle = "w-full p-4 rounded-2xl bg-[#0f172a] border border-slate-700 text-xs font-bold text-white focus:ring-2 focus:ring-[#6366f1]/50 outline-none transition-all";

  return (
  <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[501] p-4 animate-in zoom-in duration-300">
    <div className="w-full max-w-2xl bg-[#0f172a] rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl border border-white/10 max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase">System Config</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ADVANCED SETTINGS • LEVEL 2</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-colors">✕</button>
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
        
        {/* Receipt Configuration Section (New) */}
        <div className="p-6 bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-3xl border border-white/5 relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#6366f1]/10 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-[#6366f1]/20 transition"></div>
           <label className={labelStyle}>Receipt Configuration</label>
           <div className="flex items-center justify-between gap-4 relative z-10">
              <div className="flex-1">
                 <p className="text-xs font-bold text-white mb-1">Receipt Studio</p>
                 <p className="text-[10px] text-slate-400">Customize header logo, font, layout, and footer messages.</p>
              </div>
              <button 
                onClick={onOpenReceiptStudio}
                className="px-6 py-3 bg-[#6366f1] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 transition"
              >
                Open Studio 🎨
              </button>
           </div>
        </div>

        {/* Security Section */}
        <div className="p-6 bg-[#1e293b] rounded-3xl border border-white/5">
          <label className={labelStyle}>Security Credentials</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Admin PIN</span>
              <div className="relative">
                <input 
                  type={showAdminPin ? "text" : "password"} 
                  maxLength={4}
                  className={`${inputStyle} tracking-[0.5em] text-center font-black text-lg`}
                  value={settings.auth?.adminPin ?? ''}
                  onChange={e => setSettings(prev => ({...prev, auth: { ...prev.auth, adminPin: e.target.value.replace(/[^0-9]/g, '') } }))}
                  placeholder="1234"
                />
                <button 
                  onClick={() => setShowAdminPin(!showAdminPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-500 hover:text-white transition"
                >
                  {showAdminPin ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Cashier PIN</span>
              <div className="relative">
                <input 
                  type={showCashierPin ? "text" : "password"} 
                  maxLength={4}
                  className={`${inputStyle} tracking-[0.5em] text-center font-black text-lg`}
                  value={settings.auth?.cashierPin ?? ''}
                  onChange={e => setSettings(prev => ({...prev, auth: { ...prev.auth, cashierPin: e.target.value.replace(/[^0-9]/g, '') } }))}
                  placeholder="0000"
                />
                <button 
                  onClick={() => setShowCashierPin(!showCashierPin)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-500 hover:text-white transition"
                >
                  {showCashierPin ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-slate-500 mt-4 px-1">
            ⚠️ <b>Important:</b> Memorize these PINs. If you forget the Admin PIN, you will lose access to settings.
          </p>
        </div>

        {/* Category Management Section */}
        <div className="p-6 bg-[#1e293b] rounded-3xl border border-white/5">
          <label className={labelStyle}>Store Categories</label>
          
          <div className="flex gap-2 mb-4">
             <input 
               placeholder="ADD NEW CATEGORY..." 
               className={inputStyle}
               value={newCategory} 
               onChange={e => setNewCategory(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
             />
             <button 
               onClick={handleAddCategory}
               disabled={!newCategory.trim()}
               className="px-6 py-3 bg-[#6366f1] text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-500 disabled:opacity-50 transition shadow-lg shadow-indigo-500/20"
             >
               Add
             </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.categories.map(cat => (
               <div key={cat} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-[#0f172a] border border-white/5 rounded-xl group hover:border-slate-600 transition">
                  <span className="text-[10px] font-bold text-slate-300 uppercase">{cat}</span>
                  <button 
                    onClick={() => handleRemoveCategory(cat)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-white/5 text-slate-500 hover:bg-rose-500 hover:text-white transition"
                  >
                    ✕
                  </button>
               </div>
            ))}
          </div>
        </div>

        {/* Business Goals Section */}
        <div className="p-6 bg-[#1e293b] rounded-3xl border border-white/5">
          <div className="flex justify-between items-center mb-4">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Sales Target</label>
             <div onClick={toggleSalesTarget} className={`w-12 h-7 rounded-full p-1 cursor-pointer transition-colors ${isSalesTargetEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${isSalesTargetEnabled ? 'translate-x-5' : ''}`} />
             </div>
          </div>
          
          {isSalesTargetEnabled && (
            <div className="animate-in slide-in-from-top-2">
              <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-700 rounded-2xl px-4 py-3">
                 <span className="text-xl">🎯</span>
                 <span className="text-sm font-black text-emerald-500">₱</span>
                 <input 
                   type="number" 
                   className="w-full bg-transparent text-xs font-bold text-white outline-none"
                   value={settings.dailySalesTarget || ''}
                   placeholder="Enter Amount"
                   onChange={e => setSettings(prev => ({...prev, dailySalesTarget: parseFloat(e.target.value) || 0}))}
                 />
              </div>
            </div>
          )}
        </div>

        {/* Inventory Automation Section */}
        <div className="p-6 bg-[#1e293b] rounded-3xl border border-white/5">
          <label className={labelStyle}>Inventory Automation</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Expiry Alert Threshold (Days)</span>
              <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-700 rounded-2xl px-4 py-3">
                 <span className="text-xl">📅</span>
                 <input 
                   type="number" 
                   className="w-full bg-transparent text-xs font-bold text-white outline-none"
                   value={settings.expiryThresholdDays}
                   onChange={e => setSettings(prev => ({...prev, expiryThresholdDays: parseInt(e.target.value) || 30}))}
                 />
              </div>
            </div>
            
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Default Low Stock Level</span>
              <div className="flex items-center gap-3 bg-[#0f172a] border border-slate-700 rounded-2xl px-4 py-3">
                 <span className="text-xl">📉</span>
                 <input 
                   type="number" 
                   className="w-full bg-transparent text-xs font-bold text-white outline-none"
                   value={settings.lowStockThreshold}
                   onChange={e => setSettings(prev => ({...prev, lowStockThreshold: parseInt(e.target.value) || 5}))}
                 />
              </div>
            </div>
          </div>
        </div>

        {/* UI Scaling Section */}
        <div className="p-6 bg-[#1e293b] rounded-3xl border border-white/5">
          <label className={labelStyle}>UI Customization</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Font Family</span>
              <select 
                className={inputStyle}
                value={settings.uiCustomization.fontFamily}
                onChange={e => setSettings({...settings, uiCustomization: {...settings.uiCustomization, fontFamily: e.target.value as any}})}
              >
                <option value="Inter">Inter (Clean)</option>
                <option value="Roboto">Roboto (Android)</option>
                <option value="Poppins">Poppins (Modern)</option>
                <option value="JetBrains Mono">JetBrains Mono (Code)</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Interface Font Size</span>
              <select 
                className={inputStyle}
                value={settings.uiCustomization.fontSize}
                onChange={e => setSettings({...settings, uiCustomization: {...settings.uiCustomization, fontSize: e.target.value as any}})}
              >
                <option value="sm">Small</option>
                <option value="base">Standard</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Display Density</span>
              <button 
                onClick={() => setSettings({...settings, uiCustomization: {...settings.uiCustomization, compactMode: !settings.uiCustomization.compactMode}})}
                className={`w-full p-4 rounded-2xl border font-bold text-xs transition-all ${settings.uiCustomization.compactMode ? 'bg-[#6366f1] text-white border-transparent shadow-lg' : 'bg-[#0f172a] text-slate-400 border-slate-700 hover:text-white'}`}
              >
                {settings.uiCustomization.compactMode ? 'COMPACT MODE ACTIVE' : 'SWITCH TO COMPACT MODE'}
              </button>
            </div>

            <div className="space-y-2 md:col-span-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Device Mode</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mobile', label: 'Mobile', icon: '📱' },
                  { id: 'tablet', label: 'Tablet', icon: '📲' },
                  { id: 'desktop', label: 'Computer', icon: '💻' },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setSettings({
                      ...settings, 
                      uiCustomization: {
                        ...settings.uiCustomization, 
                        deviceMode: mode.id as 'mobile' | 'tablet' | 'desktop'
                      }
                    })}
                    className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                      (settings.uiCustomization.deviceMode || 'desktop') === mode.id 
                        ? 'bg-[#6366f1] text-white border-transparent shadow-lg' 
                        : 'bg-[#0f172a] text-slate-500 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{mode.icon}</span>
                    <span className="text-[10px] font-black uppercase">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-white/5">
        <button onClick={onClose} className="w-full py-5 bg-white text-[#0f172a] rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl hover:bg-slate-200 transition active:scale-95">
          Save & Return
        </button>
      </div>
    </div>
  </div>
  );
};

export default AdvancedSettingsModal;
