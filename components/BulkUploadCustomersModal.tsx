import React, { useState, useRef } from 'react';
import { Customer } from '../types';

interface BulkUploadCustomersModalProps {
  onAdd: (customers: Omit<Customer, 'id' | 'createdAt'>[]) => void;
  onClose: () => void;
}

// Robust CSV parser
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
        i++;
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
  return rows.filter(row => row.length > 1 || (row.length === 1 && row[0]));
};

const BulkUploadCustomersModal: React.FC<BulkUploadCustomersModalProps> = ({ onAdd, onClose }) => {
  const [customers, setCustomers] = useState<Omit<Customer, 'id' | 'createdAt'>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setError("CSV must have a header row and at least one data row.");
        return;
      }

      const header = rows[0].map(h => h.toLowerCase().trim().replace(/^\ufeff/, '').replace(/ /g, '_'));
      const dataRows = rows.slice(1);
      
      const colMap: Record<string, number> = {};
      header.forEach((h, i) => { colMap[h] = i; });

      if (colMap['name'] === undefined) throw new Error("Missing required header: 'name'");
      
      const parsedCustomers: Omit<Customer, 'id' | 'createdAt'>[] = [];

      for (const row of dataRows) {
        const name = row[colMap['name']];
        if (!name) continue;

        const nickname = row[colMap['nickname']] || '';
        const department = row[colMap['department']] || '';
        const contact = row[colMap['contact']] || '';
        const address = row[colMap['address']] || '';
        const creditLimit = parseFloat(row[colMap['credit_limit']] || row[colMap['limit']]) || 0;
        const idCode = row[colMap['id_code']] || row[colMap['barcode']] || '';

        parsedCustomers.push({
          name,
          nickname,
          department,
          contact,
          address,
          creditLimit,
          barcode: idCode
        });
      }

      if (parsedCustomers.length === 0) {
        setError("No valid customers found in CSV.");
      } else {
        setCustomers(parsedCustomers);
        setError(null);
      }
    } catch (err: any) {
      setError(`Parsing error: ${err.message}. Ensure headers like 'name' exist.`);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 w-full max-w-3xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black">Bulk Customer Import</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Onboard your suki base faster</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30 dark:bg-slate-900/10">
          {customers.length === 0 ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-4 border-dashed border-slate-200 dark:border-slate-700 rounded-[32px] p-16 text-center hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
            >
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-4xl">👥</span>
              </div>
              <p className="text-lg font-black text-slate-700 dark:text-white uppercase tracking-tight">Select Customer CSV</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">Headers: name, nickname, department, contact, address, credit_limit, id_code</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/50 flex justify-between items-center">
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{customers.length} sukis detected</p>
                <button onClick={() => setCustomers([])} className="text-[10px] font-black text-rose-500 hover:underline uppercase">Clear List</button>
              </div>
              <div className="border border-slate-100 dark:border-slate-700 rounded-3xl overflow-hidden shadow-sm bg-white dark:bg-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 uppercase text-[10px] font-black">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Dept</th>
                      <th className="px-6 py-4 text-right">Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                    {customers.slice(0, 50).map((c, idx) => (
                      <tr key={idx}>
                        <td className="px-6 py-4 font-bold text-slate-900 dark:text-white uppercase truncate max-w-[150px]">{c.name}</td>
                        <td className="px-6 py-4 text-slate-500 uppercase">{c.department || '-'}</td>
                        <td className="px-6 py-4 text-right font-black text-emerald-500">₱{c.creditLimit.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customers.length > 50 && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 text-center text-[10px] font-bold text-slate-400 italic">
                    And {customers.length - 50} more...
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
          <button onClick={onClose} className="flex-1 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-700 font-black text-xs uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition">Cancel</button>
          <button 
            disabled={customers.length === 0}
            onClick={() => onAdd(customers)}
            className="flex-[2] py-4 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50"
          >
            Import Suki List
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadCustomersModal;