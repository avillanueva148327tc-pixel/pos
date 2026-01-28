
import React, { useState } from 'react';
import { AppSettings } from '../types';

interface AdvancedSettingsModalProps {
  onClose: () => void;
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
}

const AdvancedSettingsModal: React.FC<AdvancedSettingsModalProps> = ({ onClose, settings, setSettings }) => {
  const [newCategory, setNewCategory] = useState('');

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
    if (confirm(`Remove category "${cat}"? Items in this category will remain unchanged but you won't be able to select this category for new items.`)) {
        setSettings(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c !== cat)
        }));
    }
  };

  return (
  <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[501] p-4 animate-in zoom-in duration-300">
    <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-12 relative overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-black tracking-tight dark:text-white text-slate-900">Advanced Configurations</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">System Core Settings • Level 2</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors">✕</button>
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
        {/* Security Section */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Security Credentials</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Admin PIN</span>
              <input 
                type="text" 
                maxLength={4}
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-white text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all tracking-[0.5em] text-center"
                value={settings.auth?.adminPin || '1234'}
                onChange={e => setSettings(prev => ({...prev, auth: { ...prev.auth, adminPin: e.target.value.replace(/[^0-9]/g, '') } }))}
              />
            </div>
            
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Cashier PIN</span>
              <input 
                type="text" 
                maxLength={4}
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-white text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all tracking-[0.5em] text-center"
                value={settings.auth?.cashierPin || '0000'}
                onChange={e => setSettings(prev => ({...prev, auth: { ...prev.auth, cashierPin: e.target.value.replace(/[^0-9]/g, '') } }))}
              />
            </div>
          </div>
          <p className="text-[9px] text-slate-400 mt-4 px-1">
            ⚠️ <b>Important:</b> Memorize these PINs. If you forget the Admin PIN, you will lose access to settings.
          </p>
        </div>

        {/* Category Management Section */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Store Categories</label>
          
          <div className="flex gap-2 mb-4">
             <input 
               placeholder="Add New Category..." 
               className="flex-1 px-4 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-primary/20"
               value={newCategory} 
               onChange={e => setNewCategory(e.target.value)} 
               onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
             />
             <button 
               onClick={handleAddCategory}
               disabled={!newCategory.trim()}
               className="px-6 py-3 bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider hover:bg-indigo-600 disabled:opacity-50 transition"
             >
               Add
             </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.categories.map(cat => (
               <div key={cat} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl group hover:border-slate-300 dark:hover:border-slate-600 transition">
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase">{cat}</span>
                  <button 
                    onClick={() => handleRemoveCategory(cat)}
                    className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-rose-500 hover:text-white transition"
                  >
                    ✕
                  </button>
               </div>
            ))}
          </div>
        </div>

        {/* Inventory Automation Section */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Inventory Automation</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Expiry Alert Threshold (Days)</span>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                 <span className="text-xl">📅</span>
                 <input 
                   type="number" 
                   className="w-full bg-transparent text-xs font-bold dark:text-white text-slate-900 outline-none"
                   value={settings.expiryThresholdDays}
                   onChange={e => setSettings(prev => ({...prev, expiryThresholdDays: parseInt(e.target.value) || 30}))}
                 />
              </div>
              <p className="text-[8px] text-slate-400 px-1">Items expiring within this range will trigger dashboard alerts.</p>
            </div>
            
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Default Low Stock Level</span>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                 <span className="text-xl">📉</span>
                 <input 
                   type="number" 
                   className="w-full bg-transparent text-xs font-bold dark:text-white text-slate-900 outline-none"
                   value={settings.lowStockThreshold}
                   onChange={e => setSettings(prev => ({...prev, lowStockThreshold: parseInt(e.target.value) || 5}))}
                 />
              </div>
              <p className="text-[8px] text-slate-400 px-1">Automatically applied to new items. Customize per item in inventory.</p>
            </div>
          </div>
        </div>

        {/* UI Scaling Section */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">UI Customization</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Font Family</span>
              <select 
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-white text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                value={settings.uiCustomization.fontFamily}
                onChange={e => setSettings({...settings, uiCustomization: {...settings.uiCustomization, fontFamily: e.target.value as any}})}
              >
                <option value="Inter">Inter (Clean)</option>
                <option value="Roboto">Roboto (Android)</option>
                <option value="Poppins">Poppins (Modern)</option>
                <option value="JetBrains Mono">JetBrains Mono (Code)</option>
                <option value="Lora">Lora (Serif)</option>
              </select>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase px-1">Interface Font Size</span>
              <select 
                className="w-full p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold dark:text-white text-slate-900 focus:ring-4 focus:ring-primary/10 outline-none transition-all"
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
                className={`w-full p-4 rounded-2xl border font-bold text-xs transition-all ${settings.uiCustomization.compactMode ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-900 dark:text-white border-slate-200 dark:border-slate-700'}`}
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
                        ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-lg">{mode.icon}</span>
                    <span className="text-[10px] font-black uppercase">{mode.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-[8px] text-slate-400 px-1 mt-1">Forces the app layout to match a specific device width.</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3">
          <span className="text-xl">⚙️</span>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
            Changes saved automatically. Ensure your device has enough storage for offline data.
          </p>
        </div>
      </div>

      <button onClick={onClose} className="mt-8 w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-3xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:opacity-90 transition active:scale-95 shrink-0">
        Save & Return
      </button>
    </div>
  </div>
  );
};

export default AdvancedSettingsModal;
