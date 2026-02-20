import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, MeasurementUnit, UserRole } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';
import { GeminiService } from '../services/geminiService';

interface AddInventoryModalProps {
  categories: string[];
  defaultReorderLevel: number;
  onAdd: (item: Omit<InventoryItem, 'id'> | InventoryItem) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  item?: InventoryItem | null;
  initialBarcode?: string;
  initialName?: string;
  userRole?: UserRole;
  isAiScannerEnabled: boolean;
}

const AddInventoryModal: React.FC<AddInventoryModalProps> = ({ 
  categories, 
  defaultReorderLevel, 
  onAdd, 
  onClose, 
  onDelete, 
  item, 
  initialBarcode,
  initialName,
  userRole = 'cashier',
  isAiScannerEnabled
}) => {
  const [name, setName] = useState(initialName || '');
  const [category, setCategory] = useState(categories[0] || 'Others');
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [unit, setUnit] = useState<MeasurementUnit>('pc');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const [stockStr, setStockStr] = useState('0');
  const [priceStr, setPriceStr] = useState('0');
  const [costStr, setCostStr] = useState('0');
  const [reorderStr, setReorderStr] = useState(defaultReorderLevel.toString());
  
  const [showScanner, setShowScanner] = useState(false);
  const [isAiScanning, setIsAiScanning] = useState(false);
  const [targetMargin, setTargetMargin] = useState<string>('20');
  
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    if (item) {
      setName(item.name);
      setCategory(item.category);
      setBarcode(item.barcode || '');
      setUnit(item.unit);
      setExpiryDate(item.expiryDate || '');
      setImageUrl(item.imageUrl || '');
      setStockStr(item.stock.toString());
      setPriceStr(item.price.toString());
      setCostStr(item.originalPrice.toString());
      setReorderStr(item.reorderLevel.toString());
    }
  }, [item]);

  const applyMarkup = () => {
    const cost = parseFloat(costStr) || 0;
    const margin = parseFloat(targetMargin) || 0;
    if (cost > 0) {
      const suggested = cost * (1 + (margin / 100));
      setPriceStr(suggested.toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    const payload: any = {
      name, category, barcode, unit, expiryDate, imageUrl,
      stock: parseFloat(stockStr) || 0,
      price: parseFloat(priceStr) || 0,
      originalPrice: parseFloat(costStr) || 0,
      reorderLevel: parseFloat(reorderStr) || 0,
      itemsPerPack: 1
    };

    if (item?.id) payload.id = item.id;
    onAdd(payload);
    onClose();
  };

  const labelStyle = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1";
  const inputContainer = "bg-[#1e293b] border border-slate-700 rounded-xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-[#6366f1]/50 transition-all h-14";
  const inputStyle = "w-full h-full px-4 bg-transparent text-white font-bold text-xs outline-none placeholder:text-slate-500 disabled:opacity-50";

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
        <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10">
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f172a] shrink-0">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">{item?.id ? 'Adjust Registry' : 'New Entry'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Inventory Management</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-white">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div>
              <label className={labelStyle}>Product Label *</label>
              <div className={inputContainer}>
                <input required className={inputStyle} placeholder="Product Name & Size" value={name} onChange={e => setName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Category</label>
                <div className={inputContainer}>
                   <select className={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
                      {categories.map(c => <option key={c} value={c} className="bg-[#1e293b]">{c}</option>)}
                   </select>
                </div>
              </div>
              <div>
                <label className={labelStyle}>Identity (Barcode)</label>
                <div className={inputContainer}>
                   <input className={inputStyle} placeholder="Scan Code" value={barcode} onChange={e => setBarcode(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Financial Logic Engine */}
            <div className="p-5 rounded-3xl bg-[#1e293b] border border-white/5 space-y-5">
              <div className="flex justify-between items-center">
                 <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Profit Guardrail</h4>
                 <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase">Target Margin</span>
                    <div className="w-16 h-8 bg-[#0f172a] rounded-lg flex items-center border border-white/10 px-2">
                       <input value={targetMargin} onChange={e => setTargetMargin(e.target.value)} className="w-full bg-transparent text-[10px] font-black text-white outline-none text-center" />
                       <span className="text-[9px] text-slate-600">%</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className={labelStyle}>Unit Cost (₱)</label>
                   <div className={`${inputContainer} bg-[#0f172a]`}>
                      <input disabled={!isAdmin} type="number" step="any" className={inputStyle} value={costStr} onChange={e => setCostStr(e.target.value)} onBlur={applyMarkup} />
                   </div>
                </div>
                <div>
                   <label className={labelStyle}>Retail Price (₱)</label>
                   <div className={`${inputContainer} bg-[#0f172a] border-emerald-500/30`}>
                      <input disabled={!isAdmin} type="number" step="any" className={`${inputStyle} text-emerald-400`} value={priceStr} onChange={e => setPriceStr(e.target.value)} />
                   </div>
                </div>
              </div>

              {parseFloat(costStr) > 0 && parseFloat(priceStr) > 0 && (
                <div className="flex justify-between px-1">
                   <p className="text-[9px] font-bold text-slate-500 uppercase">Profit: ₱{(parseFloat(priceStr) - parseFloat(costStr)).toFixed(2)}</p>
                   <p className="text-[9px] font-bold text-emerald-500 uppercase">Current Margin: {(((parseFloat(priceStr) - parseFloat(costStr)) / parseFloat(priceStr)) * 100).toFixed(0)}%</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelStyle}>Live Stock</label>
                <div className={inputContainer}>
                  <input type="number" className={inputStyle} value={stockStr} onChange={e => setStockStr(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelStyle}>Floor Alert</label>
                <div className={inputContainer}>
                  <input type="number" className={inputStyle} value={reorderStr} onChange={e => setReorderStr(e.target.value)} />
                </div>
              </div>
            </div>

            {item?.id && isAdmin && (
               <button type="button" onClick={() => onDelete?.(item.id!)} className="w-full py-4 text-rose-500 font-black uppercase text-[10px] tracking-widest hover:bg-rose-500/10 rounded-2xl transition">Purge Record</button>
            )}
          </form>

          <div className="p-6 bg-[#0f172a] border-t border-white/5">
             <button onClick={handleSubmit} className="w-full h-14 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-[0.98] transition-all">
               {item?.id ? 'COMMIT REGISTRY CHANGES' : 'COMMIT TO SYSTEM CORE'}
             </button>
          </div>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={c => { setBarcode(c); setShowScanner(false); return ScanResultStatus.SUCCESS; }} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddInventoryModal;