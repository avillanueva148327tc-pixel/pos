import React, { useState, useRef } from 'react';
import { InventoryItem, Customer, UtangRecord, AppSettings, BranchConfig, BackupData, ShiftRecord } from '../types';

interface BackupRestoreModalProps {
  onClose: () => void;
  inventory: InventoryItem[];
  customers: Customer[];
  records: UtangRecord[];
  settings: AppSettings;
  branch: BranchConfig;
  shiftHistory: ShiftRecord[];
  onRestore: (data: Partial<BackupData['data']>, mode: 'merge' | 'replace') => void;
  lastSaved?: string | null;
}

// Helper: robustly quote CSV fields
const toCSVField = (val: any): string => {
  const str = String(val === undefined || val === null ? '' : val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

// Helper: robust CSV parser (State Machine)
const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
        if (char === '\r') i++;
      } else if (char !== '\r') {
        currentField += char;
      }
    }
  }
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
};

interface RestoreStats {
  newCount: number;
  updateCount: number;
  type: 'JSON' | 'CSV';
  dataType?: string;
}

const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  onClose, inventory, customers, records, settings, branch, shiftHistory, onRestore, lastSaved
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [dragActive, setDragActive] = useState(false);
  
  // Backup State
  const [selectedModules, setSelectedModules] = useState({
    inventory: true,
    customers: true,
    records: true,
    shifts: true,
    settings: true
  });
  
  const [csvModules, setCsvModules] = useState({
    inventory: true,
    customers: true,
    records: true,
    shifts: true
  });

  // Restore State
  const [restoreData, setRestoreData] = useState<Partial<BackupData['data']> | null>(null);
  const [restoreStats, setRestoreStats] = useState<RestoreStats | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- EXPORT LOGIC ---

  const handleExportJSON = () => {
    try {
      const exportPayload: BackupData = {
        metadata: {
          version: "3.5.0",
          date: new Date().toISOString(),
          type: "full_archive",
          encrypted: false
        },
        data: {}
      };

      if (selectedModules.inventory) exportPayload.data.inventory = inventory;
      if (selectedModules.customers) exportPayload.data.customers = customers;
      if (selectedModules.records) exportPayload.data.records = records;
      if (selectedModules.shifts) exportPayload.data.shifts = shiftHistory;
      if (selectedModules.settings) {
        exportPayload.data.settings = settings;
        exportPayload.data.branch = branch;
      }

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `SariSari_FullBackup_${new Date().toISOString().split('T')[0]}.json`);
      setStatusMsg({ type: 'success', text: "JSON Archive downloaded successfully." });
    } catch (err) {
      setStatusMsg({ type: 'error', text: "Failed to generate JSON backup." });
    }
  };

  const handleExportCSV = (type: 'inventory' | 'records' | 'customers' | 'shifts') => {
    let content = "";
    let filename = "";

    if (type === 'inventory') {
      content = "Name,Category,Stock,Retail_Price,Cost,Unit,Barcode,Expiry\n";
      content += inventory.map(i => 
        [i.name, i.category, i.stock, i.price, i.originalPrice, i.unit, i.barcode, i.expiryDate].map(toCSVField).join(',')
      ).join('\n');
      filename = `Inventory_${new Date().toISOString().split('T')[0]}.csv`;
    } 
    else if (type === 'customers') {
      content = "Name,Nickname,Contact,Address,Credit_Limit,ID_Code\n";
      content += customers.map(c => 
        [c.name, c.nickname, c.contact, c.address, c.creditLimit, c.barcode].map(toCSVField).join(',')
      ).join('\n');
      filename = `Customers_${new Date().toISOString().split('T')[0]}.csv`;
    } 
    else if (type === 'records') {
      content = "Date,Customer,Items_Summary,Total_Amount,Paid_Amount,Balance,Is_Paid,Ref_ID\n";
      content += records.map(r => {
        const summary = r.items.map(i => `${i.quantity}x ${i.name}`).join('; ');
        return [r.date, r.customerName, summary, r.totalAmount, r.paidAmount, r.totalAmount - r.paidAmount, r.isPaid ? 'Yes' : 'No', r.id].map(toCSVField).join(',');
      }).join('\n');
      filename = `Sales_Records_${new Date().toISOString().split('T')[0]}.csv`;
    }
    else if (type === 'shifts') {
      content = "Date_Opened,Date_Closed,Opened_By,Start_Cash,Sales,Expected,Actual,Discrepancy,Status\n";
      content += shiftHistory.map(s => 
        [s.openedAt, s.closedAt, s.openedBy, s.startingCash, s.cashSales, s.expectedTotal, s.actualTotal, s.discrepancy, s.status].map(toCSVField).join(',')
      ).join('\n');
      filename = `Shift_History_${new Date().toISOString().split('T')[0]}.csv`;
    }

    downloadBlob(new Blob([content], { type: 'text/csv;charset=utf-8;' }), filename);
  };

  const handleBulkCSVExport = () => {
    let count = 0;
    if (csvModules.inventory) { handleExportCSV('inventory'); count++; }
    if (csvModules.customers) { setTimeout(() => handleExportCSV('customers'), 300); count++; }
    if (csvModules.records) { setTimeout(() => handleExportCSV('records'), 600); count++; }
    if (csvModules.shifts) { setTimeout(() => handleExportCSV('shifts'), 900); count++; }
    
    if (count > 0) setStatusMsg({ type: 'success', text: `${count} CSV files downloaded.` });
    else setStatusMsg({ type: 'error', text: "Select at least one module." });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- IMPORT LOGIC ---

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    setStatusMsg(null);
    setRestoreData(null);
    setRestoreStats(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (file.name.toLowerCase().endsWith('.json')) {
        processJSON(content);
      } else if (file.name.toLowerCase().endsWith('.csv')) {
        processCSVImport(content, file.name);
      } else {
        setStatusMsg({ type: 'error', text: "Unsupported file type. Please use .JSON or .CSV" });
      }
    };
    reader.readAsText(file);
  };

  const processJSON = (jsonStr: string) => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed.data) throw new Error("Invalid structure");
      
      const data = parsed.data;
      let newItems = 0;
      let updates = 0;

      // Simple heuristic for stats (matches by ID or Name)
      if (data.inventory) {
        data.inventory.forEach((i: InventoryItem) => 
          inventory.some(ex => ex.id === i.id || ex.name.toLowerCase() === i.name.toLowerCase()) ? updates++ : newItems++
        );
      }
      if (data.customers) {
        data.customers.forEach((c: Customer) => 
          customers.some(ex => ex.id === c.id || ex.name.toLowerCase() === c.name.toLowerCase()) ? updates++ : newItems++
        );
      }
      if (data.shifts) {
        data.shifts.forEach((s: ShiftRecord) => 
          shiftHistory.some(ex => ex.id === s.id) ? updates++ : newItems++
        );
      }

      setRestoreData(data);
      setRestoreStats({ type: 'JSON', newCount: newItems, updateCount: updates });
    } catch (e) {
      setStatusMsg({ type: 'error', text: "Invalid or corrupted JSON backup file." });
    }
  };

  const processCSVImport = (csvStr: string, filename: string) => {
    try {
      const rows = parseCSV(csvStr);
      if (rows.length < 2) throw new Error("Empty CSV");

      // Normalize headers (lowercase, remove spaces, handle BOM)
      const header = rows[0].map(h => h.toLowerCase().trim().replace(/^\ufeff/, ''));
      const dataRows = rows.slice(1);
      
      let importedData: Partial<BackupData['data']> = {};
      let dataType = '';
      let newCount = 0;
      let updateCount = 0;

      // Detect Type based on headers
      if (header.includes('retail_price') || (header.includes('price') && header.includes('stock'))) {
        dataType = 'Inventory';
        const items: InventoryItem[] = [];
        dataRows.forEach(row => {
          if (!row[0]) return; // Skip empty names
          const item: any = { id: crypto.randomUUID(), unit: 'pc', reorderLevel: 5 };
          
          header.forEach((col, idx) => {
            const val = row[idx];
            if (col === 'name') item.name = val;
            if (col === 'category') item.category = val;
            if (col === 'stock') item.stock = parseFloat(val) || 0;
            if (col === 'retail_price' || col === 'price') item.price = parseFloat(val) || 0;
            if (col === 'cost') item.originalPrice = parseFloat(val) || 0;
            if (col === 'unit') item.unit = val || 'pc';
            if (col === 'barcode') item.barcode = val;
            if (col === 'expiry') item.expiryDate = val;
          });

          // Check if exists by name/barcode
          if (inventory.some(ex => ex.name.toLowerCase() === item.name.toLowerCase() || (item.barcode && ex.barcode === item.barcode))) {
            updateCount++;
          } else {
            newCount++;
          }
          items.push(item);
        });
        importedData.inventory = items;

      } else if (header.includes('credit_limit') || (header.includes('name') && header.includes('contact'))) {
        dataType = 'Customers';
        const custs: Customer[] = [];
        dataRows.forEach(row => {
          if (!row[0]) return;
          const cust: any = { id: crypto.randomUUID(), createdAt: new Date().toLocaleString() };
          
          header.forEach((col, idx) => {
            const val = row[idx];
            if (col === 'name') cust.name = val;
            if (col === 'contact') cust.contact = val;
            if (col === 'address') cust.address = val;
            if (col === 'credit_limit') cust.creditLimit = parseFloat(val) || 0;
            if (col === 'id_code') cust.barcode = val;
            if (col === 'nickname') cust.nickname = val;
          });

          if (customers.some(ex => ex.name.toLowerCase() === cust.name.toLowerCase())) updateCount++;
          else newCount++;
          
          custs.push(cust);
        });
        importedData.customers = custs;

      } else if (header.includes('opened_by') || header.includes('start_cash')) {
        dataType = 'Shift History';
        const shifts: ShiftRecord[] = [];
        dataRows.forEach(row => {
           if (!row[0]) return;
           const shift: any = { id: crypto.randomUUID(), movements: [] };
           header.forEach((col, idx) => {
              const val = row[idx];
              if (col === 'date_opened') shift.openedAt = val;
              if (col === 'date_closed') shift.closedAt = val;
              if (col === 'opened_by') shift.openedBy = val;
              if (col === 'start_cash') shift.startingCash = parseFloat(val) || 0;
              if (col === 'sales') shift.cashSales = parseFloat(val) || 0;
              if (col === 'expected') shift.expectedTotal = parseFloat(val) || 0;
              if (col === 'actual') shift.actualTotal = parseFloat(val) || 0;
              if (col === 'discrepancy') shift.discrepancy = parseFloat(val) || 0;
              if (col === 'status') shift.status = val;
           });
           if (shiftHistory.some(s => s.openedAt === shift.openedAt)) updateCount++;
           else newCount++;
           shifts.push(shift);
        });
        importedData.shifts = shifts;

      } else {
        throw new Error("Unknown CSV format. Check headers.");
      }

      setRestoreData(importedData);
      setRestoreStats({ type: 'CSV', dataType, newCount, updateCount });

    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || "Failed to parse CSV." });
    }
  };

  const executeRestore = () => {
    if (restoreData) {
      onRestore(restoreData, restoreMode);
      setStatusMsg({ type: 'success', text: "Data restored successfully!" });
      setRestoreData(null);
      setRestoreStats(null);
      setTimeout(onClose, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">Data Manager</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Backup & Recovery Center</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex p-2 bg-slate-50 dark:bg-[#0f172a] gap-2 px-8">
          <button 
            onClick={() => { setActiveTab('backup'); setStatusMsg(null); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'backup' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
          >
            Export / Backup
          </button>
          <button 
            onClick={() => { setActiveTab('restore'); setStatusMsg(null); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'restore' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
          >
            Import / Restore
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-[#0f172a]/50">
          
          {statusMsg && (
            <div className={`mb-6 p-4 rounded-2xl text-xs font-bold border flex items-center gap-3 animate-in slide-in-from-top-2 ${statusMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-200 dark:border-rose-800'}`}>
              <span className="text-lg">{statusMsg.type === 'success' ? '✅' : '⚠️'}</span>
              {statusMsg.text}
            </div>
          )}

          {activeTab === 'backup' ? (
            <div className="space-y-8 animate-in slide-in-from-left-4">
              
              {/* Full JSON */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-black text-sm dark:text-white uppercase">Full Archive (JSON)</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Recommended for complete system transfer.</p>
                   </div>
                   <span className="text-2xl">📦</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {Object.keys(selectedModules).map(key => (
                    <button key={key} onClick={() => setSelectedModules(prev => ({...prev, [key]: !prev[key as keyof typeof selectedModules]}))} className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${selectedModules[key as keyof typeof selectedModules] ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-transparent text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                      {key}
                    </button>
                  ))}
                </div>

                <button onClick={handleExportJSON} className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:scale-[1.01] transition">
                  Download Archive
                </button>
              </div>

              {/* CSV Export */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                   <div>
                      <h4 className="font-black text-sm dark:text-white uppercase">Spreadsheets (CSV)</h4>
                      <p className="text-[10px] text-slate-500 mt-1">For Excel or Google Sheets.</p>
                   </div>
                   <span className="text-2xl">📊</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   {Object.keys(csvModules).map(k => (
                      <div key={k} onClick={() => setCsvModules(p => ({...p, [k]: !p[k as keyof typeof csvModules]}))} className={`p-3 rounded-xl border cursor-pointer text-center transition-all ${csvModules[k as keyof typeof csvModules] ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-transparent border-slate-200 dark:border-slate-700 opacity-50'}`}>
                         <p className="text-[9px] font-black uppercase">{k}</p>
                      </div>
                   ))}
                </div>

                <button onClick={handleBulkCSVExport} className="w-full py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-slate-600 transition">
                  Export Selected CSVs
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 h-full flex flex-col">
              
              {!restoreData ? (
                <div 
                  onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex-1 border-4 border-dashed rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 transition-all cursor-pointer group ${dragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition shadow-sm">
                    📂
                  </div>
                  <h4 className="text-sm font-black text-slate-700 dark:text-white uppercase mb-1">Drag & Drop File</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Supports .JSON Archive or .CSV Spreadsheet</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".json,.csv" />
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                   <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/5 mb-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                         <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center font-black text-lg">
                           {restoreStats?.type === 'JSON' ? '📦' : '📄'}
                         </div>
                         <div>
                            <h4 className="font-black text-sm dark:text-white uppercase">{restoreStats?.type} Data Analysis</h4>
                            <p className="text-[10px] text-slate-400">{restoreStats?.dataType || 'Mixed Data'} • Ready to process</p>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
                            <span className="block font-black text-2xl text-emerald-500">{restoreStats?.newCount}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">New Entries</span>
                         </div>
                         <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl text-center">
                            <span className="block font-black text-2xl text-amber-500">{restoreStats?.updateCount}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase">To Update/Merge</span>
                         </div>
                      </div>
                   </div>

                   <div className="mt-auto space-y-3">
                      <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-xl">
                        <button onClick={() => setRestoreMode('merge')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${restoreMode === 'merge' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}>Merge & Update</button>
                        <button onClick={() => setRestoreMode('replace')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${restoreMode === 'replace' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}>Replace All</button>
                      </div>
                      
                      <div className="flex gap-3">
                         <button onClick={() => setRestoreData(null)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-xs">Cancel</button>
                         <button onClick={executeRestore} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:scale-[1.02] transition">Confirm</button>
                      </div>
                   </div>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreModal;
