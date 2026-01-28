
import React, { useState, useRef } from 'react';
import { InventoryItem } from '../types';

interface BulkUploadModalProps {
  onAdd: (items: Omit<InventoryItem, 'id'>[]) => void;
  onClose: () => void;
  categories: string[];
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onAdd, onClose, categories }) => {
  const [items, setItems] = useState<Omit<InventoryItem, 'id'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Robust CSV Parser that handles quotes and commas within fields
  const parseCSVLine = (text: string) => {
    const re = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
    return text.split(re).map(field => field.replace(/^"|"$/g, '').trim());
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      processCSV(text);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  };

  const processCSV = (text: string) => {
    try {
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
      if (lines.length < 2) {
        setError("CSV must have a header row and at least one data row.");
        return;
      }

      const parsedItems: Omit<InventoryItem, 'id'>[] = [];
      const rows = lines.slice(1);

      for (const row of rows) {
        const columns = parseCSVLine(row);
        if (columns.length < 4) continue;

        const [name, category, stock, price, costPrice, reorder, expiry, barcode] = columns;
        
        if (!name) continue;
        
        const validCategory = categories.includes(category) ? category : 'Others';
        const retailPrice = parseFloat(price) || 0;
        const originalPrice = parseFloat(costPrice) || retailPrice * 0.85;

        // Add default 'unit' property to satisfy InventoryItem interface
        parsedItems.push({
          name,
          category: validCategory,
          stock: parseInt(stock) || 0,
          price: retailPrice,
          originalPrice: originalPrice,
          reorderLevel: parseInt(reorder) || 5,
          expiryDate: expiry || undefined,
          barcode: barcode || undefined,
          unit: 'pc'
        });
      }

      if (parsedItems.length === 0) {
        setError("No valid items found in CSV.");
      } else {
        setItems(parsedItems);
        setError(null);
      }
    } catch (err) {
      setError("Parsing error. Check format: Name,Category,Stock,RetailPrice,CostPrice,Reorder,Expiry,Barcode");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black">Bulk Inventory Import</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Efficiently restock your shelves</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-900/10">
          {items.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] p-16 text-center hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl text-primary">📊</span>
              </div>
              <p className="text-lg font-black text-slate-700 dark:text-slate-200">Select Inventory CSV</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Download template or use your own .csv file</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center">
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{items.length} items detected</p>
                <button onClick={() => setItems([])} className="text-[10px] font-black text-rose-500 hover:underline">Clear List</button>
              </div>
              <div className="border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black">
                    <tr>
                      <th className="px-6 py-4">Item</th>
                      <th className="px-6 py-4 text-right">Retail</th>
                      <th className="px-6 py-4 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {items.slice(0, 50).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 font-bold truncate max-w-[200px]">{item.name}</td>
                        <td className="px-6 py-4 text-right font-black text-primary">₱{item.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-right font-black">{item.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {items.length > 50 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-center text-[10px] font-bold text-slate-400 italic">
                    And {items.length - 50} more items...
                  </div>
                )}
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl border border-rose-100 dark:border-rose-800 flex items-center gap-3 animate-pulse">
              <span className="text-xl">⚠️</span>
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
        </div>
        
        <div className="p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex gap-4">
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition">Cancel</button>
          <button 
            disabled={items.length === 0}
            onClick={() => { onAdd(items); onClose(); }}
            className="flex-[2] py-4 rounded-2xl bg-primary text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
          >
            Import Inventory
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
