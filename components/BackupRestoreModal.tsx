
import React, { useState, useRef } from 'react';
import { InventoryItem, Customer, UtangRecord, AppSettings, BranchConfig, BackupData, UtangItem } from '../types';

interface BackupRestoreModalProps {
  onClose: () => void;
  inventory: InventoryItem[];
  customers: Customer[];
  records: UtangRecord[];
  settings: AppSettings;
  branch: BranchConfig;
  onRestore: (data: Partial<BackupData['data']>, mode: 'merge' | 'replace') => void;
  lastSaved?: string | null;
}

const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  onClose, inventory, customers, records, settings, branch, onRestore, lastSaved
}) => {
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  
  // Backup State
  const [selectedModules, setSelectedModules] = useState({
    inventory: true,
    customers: true,
    records: true,
    settings: true
  });
  
  // CSV specific selection
  const [csvModules, setCsvModules] = useState({
    inventory: true,
    customers: true,
    records: true
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Restore State
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvType, setCsvType] = useState<'inventory' | 'customers' | 'records' | null>(null);

  const handleExportJSON = async () => {
    setIsProcessing(true);
    try {
      const exportPayload: BackupData = {
        metadata: {
          version: "3.2.0",
          date: new Date().toISOString(),
          type: "full_archive",
          encrypted: false
        },
        data: {}
      };

      if (selectedModules.inventory) exportPayload.data.inventory = inventory;
      if (selectedModules.customers) exportPayload.data.customers = customers;
      if (selectedModules.records) exportPayload.data.records = records;
      if (selectedModules.settings) {
        exportPayload.data.settings = settings;
        exportPayload.data.branch = branch;
      }

      const finalContent = JSON.stringify(exportPayload, null, 2);

      const blob = new Blob([finalContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = `SariSari_Backup_${new Date().toISOString().split('T')[0]}.json`;
      
      link.href = url;
      link.download = filename;
      link.click();
      setSuccess("Backup downloaded successfully!");
    } catch (err) {
      console.error(err);
      setError("Failed to generate backup.");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateCSV = (type: 'inventory' | 'records' | 'customers') => {
    let csvContent = "";
    let filename = "";

    if (type === 'inventory') {
      csvContent = "Name,Category,Stock,Retail_Price,Cost,Unit,Barcode\n";
      inventory.forEach(i => {
        csvContent += `"${i.name}","${i.category}",${i.stock},${i.price},${i.originalPrice || 0},"${i.unit}","${i.barcode || ''}"\n`;
      });
      filename = `Inventory_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'records') {
      csvContent = "Date,Customer,Total,Paid,Balance,Items\n";
      records.forEach(r => {
        const balance = r.totalAmount - r.paidAmount;
        const itemsList = r.items.map(i => `${i.quantity}x ${i.name}`).join('; ');
        csvContent += `"${r.date}","${r.customerName}",${r.totalAmount},${r.paidAmount},${balance},"${itemsList}"\n`;
      });
      filename = `Sales_Records_${new Date().toISOString().split('T')[0]}.csv`;
    } else if (type === 'customers') {
      csvContent = "Name,Contact,Address,Credit_Limit,ID\n";
      customers.forEach(c => {
        csvContent += `"${c.name}","${c.contact || ''}","${c.address || ''}",${c.creditLimit || 0},"${c.barcode || ''}"\n`;
      });
      filename = `Customers_${new Date().toISOString().split('T')[0]}.csv`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
  };

  const handleBulkCSVExport = () => {
    let exportedCount = 0;
    if (csvModules.inventory) { generateCSV('inventory'); exportedCount++; }
    if (csvModules.customers) { 
      setTimeout(() => generateCSV('customers'), 500); 
      exportedCount++; 
    }
    if (csvModules.records) { 
      setTimeout(() => generateCSV('records'), 1000); 
      exportedCount++; 
    }

    if (exportedCount > 0) {
      setSuccess(`Exported ${exportedCount} CSV files successfully.`);
    } else {
      setError("Please select at least one module to export.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRestoreFile(file);
      analyzeFile(file);
    }
  };

  const analyzeFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      try {
        const json = JSON.parse(text);
        if (json.metadata && json.metadata.encrypted) {
           setError("Encrypted backups are not supported in this version.");
           setPreviewData(null);
        } else if (json.metadata) {
            setPreviewData(json);
            setError(null);
        } else {
            // Fallback for files without metadata
            setPreviewData({ metadata: { version: 'unknown', date: 'unknown', type: 'unknown', encrypted: false }, data: {} });
        }
      } catch (err) {
        setError("Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  // --- CSV Import Logic ---
  const parseCSVLine = (text: string) => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return text.split(re).map(field => field.replace(/^"|"$/g, '').trim());
  };

  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && csvType) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        processCSVImport(ev.target?.result as string, csvType);
      };
      reader.readAsText(file);
    }
  };

  const processCSVImport = (text: string, type: 'inventory' | 'customers' | 'records') => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) throw new Error("Empty CSV");
      
      const rows = lines.slice(1);
      const importedData: any = {};

      if (type === 'inventory') {
        const items: InventoryItem[] = [];
        rows.forEach(row => {
          const cols = parseCSVLine(row);
          if (cols.length >= 3) { 
             const [name, category, stock, price, cost, unit, barcode] = cols;
             if (name) {
               items.push({
                 id: crypto.randomUUID(),
                 name,
                 category: category || 'Imported',
                 stock: parseInt(stock) || 0,
                 price: parseFloat(price) || 0,
                 originalPrice: parseFloat(cost) || 0,
                 unit: (unit as any) || 'pc',
                 barcode: barcode || undefined,
                 reorderLevel: 5
               });
             }
          }
        });
        importedData.inventory = items;
        setSuccess(`Recovered ${items.length} items from CSV.`);
        
      } else if (type === 'customers') {
        const custs: Customer[] = [];
        rows.forEach(row => {
          const cols = parseCSVLine(row);
          if (cols.length >= 1) {
             const [name, contact, address, limit, id] = cols;
             if (name) {
               custs.push({
                 id: id || crypto.randomUUID(),
                 name,
                 contact: contact || '',
                 address: address || '',
                 creditLimit: parseFloat(limit) || 0,
                 createdAt: new Date().toLocaleString()
               });
             }
          }
        });
        importedData.customers = custs;
        setSuccess(`Recovered ${custs.length} customers from CSV.`);
        
      } else if (type === 'records') {
        const recs: UtangRecord[] = [];
        rows.forEach(row => {
          const cols = parseCSVLine(row);
          if (cols.length >= 6) {
             const [date, customer, total, paid, balance, itemsStr] = cols;
             const totalAmount = parseFloat(total) || 0;
             const paidAmount = parseFloat(paid) || 0;
             
             // Try to parse items: "2x Item A; 1x Item B"
             const items: UtangItem[] = [];
             if (itemsStr) {
               itemsStr.split(';').forEach(part => {
                 const match = part.trim().match(/^(\d+)x\s+(.+)$/);
                 if (match) {
                   items.push({ 
                     name: match[2], 
                     quantity: parseInt(match[1]) || 1, 
                     price: 0, // Price is lost in standard CSV, default to 0
                     date: date 
                   });
                 }
               });
             }
             
             // If items array is empty but we have a total, create a generic item
             if (items.length === 0) {
               items.push({ name: 'Imported Transaction', quantity: 1, price: totalAmount, date });
             } else if (items.length === 1) {
               // If single item, we can recover the unit price
               items[0].price = totalAmount / items[0].quantity;
             }

             if (customer) {
               recs.push({
                 id: crypto.randomUUID(),
                 date: date || new Date().toLocaleString(),
                 customerName: customer,
                 totalAmount,
                 paidAmount,
                 isPaid: paidAmount >= totalAmount,
                 items,
                 quantity: items.reduce((acc, i) => acc + i.quantity, 0),
                 product: items.map(i => i.name).join(', ')
               });
             }
          }
        });
        importedData.records = recs;
        setSuccess(`Recovered ${recs.length} records from CSV.`);
      }

      onRestore(importedData, 'merge'); 
      
    } catch (err) {
      console.error(err);
      setError("Failed to parse CSV. Ensure correct format.");
    }
  };

  const triggerCSVImport = (type: 'inventory' | 'customers' | 'records') => {
    setCsvType(type);
    csvInputRef.current?.click();
  };

  const executeRestore = () => {
    if (!previewData || !previewData.data) return;
    onRestore(previewData.data, restoreMode);
    setSuccess("System restored successfully!");
    setTimeout(onClose, 1500);
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
            onClick={() => { setActiveTab('backup'); setSuccess(null); setError(null); setPreviewData(null); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'backup' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
          >
            Create Backup
          </button>
          <button 
            onClick={() => { setActiveTab('restore'); setSuccess(null); setError(null); setPreviewData(null); }}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'restore' ? 'bg-amber-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-400'}`}
          >
            Restore Data
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 dark:bg-[#0f172a]/50">
          
          {error && <div className="mb-4 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl text-xs font-bold border border-rose-200 dark:border-rose-800">⚠️ {error}</div>}
          {success && <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl text-xs font-bold border border-emerald-200 dark:border-emerald-800">✅ {success}</div>}

          {activeTab === 'backup' ? (
            <div className="space-y-10 animate-in slide-in-from-left-4">
              
              {/* Full System Archive Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                   <h4 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Full System Archive (JSON)</h4>
                   {lastSaved && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">Auto-saved: {lastSaved}</span>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(selectedModules).map(key => (
                    <div key={key} onClick={() => setSelectedModules(prev => ({...prev, [key]: !prev[key as keyof typeof selectedModules]}))} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedModules[key as keyof typeof selectedModules] ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500' : 'bg-white dark:bg-slate-800 border-transparent opacity-60'}`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-200">{key}</span>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${selectedModules[key as keyof typeof selectedModules] ? 'bg-indigo-500 text-white' : 'bg-slate-200'}`}>✓</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={handleExportJSON}
                  disabled={isProcessing || (!Object.values(selectedModules).includes(true))}
                  className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:scale-[1.01] active:scale-[0.98] transition disabled:opacity-50"
                >
                  {isProcessing ? 'Generating...' : 'Download JSON Archive 📥'}
                </button>
              </div>

              <div className="h-px bg-slate-200 dark:bg-white/10 w-full"></div>

              {/* CSV Export Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-slate-700 dark:text-white uppercase tracking-wider">Spreadsheet Export (CSV)</h4>
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[9px] font-bold rounded uppercase">Compatible with Excel</span>
                </div>
                
                <p className="text-[10px] text-slate-500">Select modules to generate individual CSV files:</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div onClick={() => setCsvModules(prev => ({...prev, inventory: !prev.inventory}))} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${csvModules.inventory ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500' : 'bg-white dark:bg-slate-800 border-transparent opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📦</span>
                      <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Inventory</span>
                    </div>
                    {csvModules.inventory && <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[8px]">✓</div>}
                  </div>

                  <div onClick={() => setCsvModules(prev => ({...prev, customers: !prev.customers}))} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${csvModules.customers ? 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-500' : 'bg-white dark:bg-slate-800 border-transparent opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">👥</span>
                      <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Customers</span>
                    </div>
                    {csvModules.customers && <div className="w-4 h-4 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[8px]">✓</div>}
                  </div>

                  <div onClick={() => setCsvModules(prev => ({...prev, records: !prev.records}))} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${csvModules.records ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-500' : 'bg-white dark:bg-slate-800 border-transparent opacity-60'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📄</span>
                      <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300">Sales Recs</span>
                    </div>
                    {csvModules.records && <div className="w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[8px]">✓</div>}
                  </div>
                </div>

                <button 
                  onClick={handleBulkCSVExport}
                  disabled={!Object.values(csvModules).some(Boolean)}
                  className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-50 dark:hover:bg-slate-700 transition active:scale-[0.98] disabled:opacity-50"
                >
                  Export Selected Modules to CSV
                </button>
              </div>

            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              {!previewData ? (
                <>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-4 border-dashed border-slate-300 dark:border-slate-700 rounded-[2.5rem] p-10 text-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all group"
                  >
                    <span className="text-4xl block mb-4 group-hover:scale-110 transition-transform">📂</span>
                    <p className="text-sm font-black text-slate-500">Restore from JSON Archive</p>
                    <p className="text-[10px] text-slate-400 mt-2">Full system restore</p>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept=".json" />
                  </div>

                  <div className="h-px bg-slate-200 dark:bg-white/10 w-full"></div>

                  <div className="space-y-3">
                     <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">CSV Import Recovery</h4>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <button 
                          onClick={() => triggerCSVImport('inventory')}
                          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-left hover:border-primary transition group"
                        >
                           <span className="text-2xl block mb-1">📦</span>
                           <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 group-hover:text-primary">Recover Inventory</span>
                        </button>
                        <button 
                          onClick={() => triggerCSVImport('customers')}
                          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-left hover:border-indigo-500 transition group"
                        >
                           <span className="text-2xl block mb-1">👥</span>
                           <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 group-hover:text-indigo-500">Recover Members</span>
                        </button>
                        <button 
                          onClick={() => triggerCSVImport('records')}
                          className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl text-left hover:border-amber-500 transition group"
                        >
                           <span className="text-2xl block mb-1">📄</span>
                           <span className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 group-hover:text-amber-500">Recover Sales/Debt</span>
                        </button>
                     </div>
                     <p className="text-[9px] text-slate-400 px-2 leading-relaxed">
                        Note: CSV Import will merge new items into your existing data. It does not replace the full database.
                     </p>
                     <input type="file" ref={csvInputRef} onChange={handleCSVSelect} className="hidden" accept=".csv" />
                  </div>
                </>
              ) : (
                <div className="space-y-6">
                    <>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-white/5 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-black text-lg">✓</div>
                          <div>
                            <h4 className="font-black text-sm dark:text-white">Backup Verified</h4>
                            <p className="text-[10px] text-slate-400">Created: {new Date(previewData.metadata.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                            <span className="block font-black text-lg dark:text-white">{previewData.data.inventory?.length || 0}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Products</span>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                            <span className="block font-black text-lg dark:text-white">{previewData.data.customers?.length || 0}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Customers</span>
                          </div>
                          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-center">
                            <span className="block font-black text-lg dark:text-white">{previewData.data.records?.length || 0}</span>
                            <span className="text-[8px] font-bold text-slate-400 uppercase">Records</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex p-1.5 bg-slate-200 dark:bg-slate-800 rounded-2xl">
                        <button 
                          onClick={() => setRestoreMode('merge')} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${restoreMode === 'merge' ? 'bg-white dark:bg-slate-700 shadow-sm dark:text-white' : 'text-slate-500'}`}
                        >
                          Merge Data
                        </button>
                        <button 
                          onClick={() => setRestoreMode('replace')} 
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${restoreMode === 'replace' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500'}`}
                        >
                          Replace All
                        </button>
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium leading-relaxed">
                          {restoreMode === 'merge' 
                            ? "Merge will add new items and customers. Existing items with same Barcode/ID will be updated."
                            : "⚠️ Warning: Replace will permanently delete all current data on this device and load the backup."}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button onClick={() => { setPreviewData(null); setRestoreFile(null); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">Cancel</button>
                        <button onClick={executeRestore} className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Confirm Restore</button>
                      </div>
                    </>
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
