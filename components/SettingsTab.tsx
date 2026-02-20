import React from 'react';
import { AppSettings, BranchConfig, QuickPickItem } from '../types';
import { PrinterService } from '../services/printerService';
import { SecurityService } from '../services/securityService';

interface SettingsTabProps {
  isAdmin: boolean;
  branch: BranchConfig;
  settings: AppSettings;
  recycleBinCount: number;
  onUpdateBranch: (field: keyof BranchConfig, label: string) => void;
  onUpdateSettings: (field: string, value: any) => void;
  onAddQuickPick: () => void;
  onEditQuickPick: (index: number, qp: QuickPickItem) => void;
  onDeleteQuickPick: (index: number) => void;
  onToggleTheme: () => void;
  onCycleLanguage: () => void;
  onToggleAutoPrint: () => void;
  setRecordForReceiptStudio: (rec: any) => void;
  setShowHardware: (show: boolean) => void;
  setShowBackup: (show: boolean) => void;
  setShowSync: (show: boolean) => void;
  setShowCatalog: (show: boolean) => void;
  setShowCustomerCatalog: (show: boolean) => void;
  setShowGuide: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  setShowRecycleBin: (show: boolean) => void;
  setShowResetConfirm: (show: boolean) => void;
  dummyTransaction: any;
}

const SettingsGroup: React.FC<{ children?: React.ReactNode, title: string, icon: string, level?: 1 | 2 }> = ({ children, title, icon, level = 1 }) => (
  <div className="mb-8 animate-in slide-in-from-bottom-4">
    <div className="flex items-center justify-between mb-4 px-2">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ring-1 ${level === 2 ? 'bg-indigo-500/10 ring-indigo-500/20 text-indigo-500' : 'bg-slate-500/10 ring-slate-500/20 text-slate-500'}`}>
          {icon}
        </div>
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{title}</h4>
      </div>
      {level === 2 && <span className="text-[7px] font-black text-indigo-500 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">Lvl 2 Auth</span>}
    </div>
    <div className="grid grid-cols-1 gap-2">
      {children}
    </div>
  </div>
);

const ActionCard: React.FC<{ 
  label: string, 
  sublabel?: string,
  value?: string | number, 
  onClick?: (e?: React.MouseEvent) => void, 
  isToggle?: boolean, 
  toggleValue?: boolean, 
  isDanger?: boolean,
  icon: string,
  onDelete?: (e: React.MouseEvent) => void,
  isLocked?: boolean,
  status?: string
}> = ({ 
  label, sublabel, value, onClick, isToggle, toggleValue, isDanger, icon, onDelete, isLocked, status
}) => {
  return (
    <div 
      onClick={(!isToggle && !onDelete && !isLocked) ? onClick : undefined}
      className={`group relative flex items-center justify-between p-4 bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-3xl transition-all duration-300 ${(!isToggle && !onDelete && !isLocked) ? 'cursor-pointer hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.03] active:scale-[0.99] shadow-sm' : ''} ${isLocked ? 'opacity-50 select-none' : ''}`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl transition-all ${isDanger ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-100 dark:bg-[#0f172a] text-slate-600 dark:text-slate-300 group-hover:scale-110'}`}>
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className={`text-xs font-black uppercase tracking-tight ${isDanger ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>
            {label}
          </span>
          {sublabel && <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{sublabel}</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {status && <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase">{status}</span>}
        {value !== undefined && !isToggle && !onDelete && <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/5 px-2 py-1 rounded-lg">{value}</span>}
        {isToggle && (
          <div onClick={(e) => { if (!isLocked) { e.preventDefault(); e.stopPropagation(); onClick?.(e); }}} className={`w-11 h-6 rounded-full p-1 transition-colors ${isLocked ? 'cursor-not-allowed grayscale opacity-50' : 'cursor-pointer'} ${toggleValue ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'}`}>
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${toggleValue ? 'translate-x-5' : ''}`} />
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsTab: React.FC<SettingsTabProps> = (props) => {
  const { isAdmin, branch, settings, recycleBinCount, onUpdateBranch, onUpdateSettings, onToggleTheme, onCycleLanguage, onToggleAutoPrint, setShowHardware, setShowBackup, setShowSync, setShowCatalog, setShowCustomerCatalog, setShowGuide, setShowSettings, setShowRecycleBin, setShowResetConfirm } = props;
  const storage = SecurityService.getStorageHealth();

  const fontFamilies = ['Inter', 'Roboto', 'Poppins', 'JetBrains Mono'];
  const fontSizes = ['sm', 'base', 'lg', 'xl'];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-10 text-center">
         <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Terminal <span className="text-indigo-500">Configuration</span></h1>
         <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2">Kernel Protocol 3.6.5</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8">
        
        <SettingsGroup title="Store Identity" icon="🏪">
          <ActionCard label="Store Name" icon="🖋️" value={branch.name} isLocked={!isAdmin} onClick={() => onUpdateBranch('name', 'Business Name')} />
          <ActionCard label="Store Address" icon="📍" value={branch.address} isLocked={!isAdmin} onClick={() => onUpdateBranch('address', 'Business Address')} />
          <ActionCard label="Contact Info" icon="📞" value={branch.contact} isLocked={!isAdmin} onClick={() => onUpdateBranch('contact', 'Phone Number')} />
        </SettingsGroup>

        <SettingsGroup title="Kernel Storage" icon="💾" level={2}>
           <div className="p-6 bg-white dark:bg-[#1e293b]/50 border border-slate-200 dark:border-white/5 rounded-[2rem] space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Persistence Health</span>
                 <span className={`text-[10px] font-black uppercase ${storage.status === 'critical' ? 'text-rose-500 animate-pulse' : storage.status === 'warning' ? 'text-amber-500' : 'text-emerald-500'}`}>
                   {storage.percent}% Entropy
                 </span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                 <div className={`h-full transition-all duration-1000 ${storage.status === 'critical' ? 'bg-rose-500' : storage.status === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${storage.percent}%` }} />
              </div>
              <p className="text-[9px] text-slate-500 uppercase font-bold text-center">Used: {storage.usedKb}KB / 5120KB Browser Bound</p>
           </div>
           <ActionCard label="Asset Archive" icon="♻️" sublabel="Recover Deleted Data" value={recycleBinCount} isLocked={!isAdmin} onClick={() => setShowRecycleBin(true)} />
        </SettingsGroup>

        <SettingsGroup title="Interface" icon="🎨">
          <ActionCard label="Midnight Mode" icon="🌗" isToggle toggleValue={settings.theme === 'dark'} onClick={onToggleTheme} status={settings.theme === 'dark' ? 'On' : 'Off'} />
          <ActionCard label="Compact Mode" icon="📏" isToggle toggleValue={settings.uiCustomization.compactMode} onClick={() => onUpdateSettings('uiCustomization.compactMode', !settings.uiCustomization.compactMode)} status={settings.uiCustomization.compactMode ? 'On' : 'Off'} />
          <ActionCard label="Font Family" icon="🔤" value={settings.uiCustomization.fontFamily} onClick={() => {
            const currentIdx = fontFamilies.indexOf(settings.uiCustomization.fontFamily);
            const nextIdx = (currentIdx + 1) % fontFamilies.length;
            onUpdateSettings('uiCustomization.fontFamily', fontFamilies[nextIdx]);
          }} />
          <ActionCard label="Font Size" icon="🅰️" value={settings.uiCustomization.fontSize.toUpperCase()} onClick={() => {
            const currentIdx = fontSizes.indexOf(settings.uiCustomization.fontSize);
            const nextIdx = (currentIdx + 1) % fontSizes.length;
            onUpdateSettings('uiCustomization.fontSize', fontSizes[nextIdx]);
          }} />
          <ActionCard label="System Language" icon="🌍" value={settings.language.toUpperCase()} onClick={onCycleLanguage} />
          <ActionCard label="Manual" icon="📖" onClick={() => setShowGuide(true)} />
        </SettingsGroup>

        <SettingsGroup title="Security & Advanced" icon="🛡️" level={2}>
          <ActionCard label="System Protocols" icon="🛠️" sublabel="Authorization Lvl 2" onClick={() => setShowSettings(true)} />
          <ActionCard label="Cloud Backup" icon="💾" onClick={() => setShowBackup(true)} />
          <ActionCard label="Device Link" icon="🔄" onClick={() => setShowSync(true)} />
          {isAdmin && <ActionCard label="Kernel Wipe" icon="🛑" sublabel="Irreversible Reset" isDanger onClick={() => setShowResetConfirm(true)} />}
        </SettingsGroup>

      </div>
    </div>
  );
};

export default SettingsTab;