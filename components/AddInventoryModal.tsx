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

    const stock = parseFloat(stockStr) || 0;
    const price = parseFloat(priceStr) || 0;
    const originalPrice = parseFloat(costStr) || 0;
    const reorderLevel = parseFloat(reorderStr) || 0;

    if (stock < 0 || price < 0 || originalPrice < 0 || reorderLevel < 0) {
      alert("Values cannot be negative.");
      return;
    }

    const payload: any = {
      name, category, barcode, unit, expiryDate, imageUrl,
      stock, price, originalPrice, reorderLevel,
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
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[150] p-4 animate-in fade-in duration-500">
        <div className="bg-[#0f172a] w-full max-w-lg rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh] border border-white/10 relative group">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-[100px] group-hover:bg-indigo-500/15 transition-colors duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-24 -mb-24 blur-[80px]"></div>

          <div className="p-8 border-b border-white/5 flex justify-between items-start bg-[#0f172a]/50 backdrop-blur-md relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Inventory Control Unit</p>
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter leading-none">
                {item?.id ? 'Modify Record' : 'Registry Entry'}
              </h3>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
                <span className="opacity-50">●</span>
                {item?.id ? 'DATABASE UPDATE' : 'NEW SYSTEM OBJECT'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-white/5 hover:border-rose-500/50 group/close"
            >
              <span className="text-xl group-hover/close:rotate-90 transition-transform duration-300">✕</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 relative z-10">
            <div className="space-y-2">
              <label className={labelStyle}>Product Label *</label>
              <div className="relative group/input">
                <input 
                  required 
                  className="w-full h-16 px-6 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600" 
                  placeholder="Product Name & Size" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors">🏷️</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelStyle}>Category</label>
                <div className="relative group/input">
                   <select 
                     className="w-full h-16 px-6 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white appearance-none cursor-pointer" 
                     value={category} 
                     onChange={e => setCategory(e.target.value)}
                   >
                      {categories.map(c => <option key={c} value={c} className="bg-[#1e293b]">{c}</option>)}
                   </select>
                   <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-focus-within/input:text-indigo-500 transition-colors">📂</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelStyle}>Identity (Barcode)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1 group/input">
                    <input 
                      className="w-full h-16 px-6 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white placeholder:text-slate-600" 
                      placeholder="Scan Code" 
                      value={barcode} 
                      onChange={e => setBarcode(e.target.value)} 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)} 
                    className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-xl border border-white/10 text-indigo-400 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all active:scale-90 shadow-lg shadow-indigo-500/0 hover:shadow-indigo-500/20"
                  >
                    📸
                  </button>
                </div>
              </div>
            </div>

            {isAiScannerEnabled && (
              <button 
                type="button" 
                onClick={async () => {
                  setIsAiScanning(true);
                  try {
                    const result = await GeminiService.analyzeProduct(name);
                    if (result) {
                      if (result.category) setCategory(result.category);
                      if (result.price) setPriceStr(result.price.toString());
                      if (result.unit) setUnit(result.unit as any);
                    }
                  } finally {
                    setIsAiScanning(false);
                  }
                }}
                disabled={!name || isAiScanning}
                className="w-full h-16 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:bg-indigo-500/20 transition-all disabled:opacity-30 flex items-center justify-center gap-3 group/ai"
              >
                <span className={`text-lg ${isAiScanning ? 'animate-spin' : 'group-hover/ai:scale-125 transition-transform'}`}>✨</span>
                {isAiScanning ? 'Neural Processing...' : 'Neural Auto-Fill'}
              </button>
            )}

            {/* Financial Logic Engine */}
            <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8 relative overflow-hidden group/financial">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover/financial:bg-indigo-500/10 transition-colors"></div>
              
              <div className="flex justify-between items-center relative z-10">
                 <div className="space-y-1">
                   <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Profit Guardrail</h4>
                   <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Automated Margin Calculation</p>
                 </div>
                 <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Target</span>
                    <div className="w-20 h-10 bg-[#0f172a] rounded-xl flex items-center border border-white/10 px-3 focus-within:border-indigo-500/50 transition-colors">
                       <input value={targetMargin} onChange={e => setTargetMargin(e.target.value)} className="w-full bg-transparent text-xs font-black text-white outline-none text-center" />
                       <span className="text-[10px] text-slate-600 font-black">%</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 relative z-10">
                <div className="space-y-2">
                   <label className={labelStyle}>Unit Cost (₱)</label>
                   <div className="relative group/cost">
                      <input 
                        disabled={!isAdmin} 
                        type="number" 
                        step="any" 
                        className="w-full h-16 px-6 bg-[#0f172a] rounded-2xl border border-white/10 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white disabled:opacity-50" 
                        value={costStr} 
                        onChange={e => setCostStr(e.target.value)} 
                        onBlur={applyMarkup} 
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 font-black text-[10px]">COST</div>
                   </div>
                </div>
                <div className="space-y-2">
                   <label className={labelStyle}>Retail Price (₱)</label>
                   <div className="relative group/price">
                      <input 
                        disabled={!isAdmin} 
                        type="number" 
                        step="any" 
                        className="w-full h-16 px-6 bg-[#0f172a] rounded-2xl border border-emerald-500/30 text-xs font-black outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all text-emerald-400 disabled:opacity-50" 
                        value={priceStr} 
                        onChange={e => setPriceStr(e.target.value)} 
                      />
                      <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500/50 font-black text-[10px]">SELL</div>
                   </div>
                </div>
              </div>

              {parseFloat(costStr) > 0 && parseFloat(priceStr) > 0 && (
                <div className="flex justify-between px-1 relative z-10">
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                     <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Profit: ₱{(parseFloat(priceStr) - parseFloat(costStr)).toFixed(2)}</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                     <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Margin: {(((parseFloat(priceStr) - parseFloat(costStr)) / parseFloat(priceStr)) * 100).toFixed(0)}%</p>
                   </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className={labelStyle}>Live Stock</label>
                <div className="relative group/input">
                  <input 
                    type="number" 
                    className="w-full h-16 px-6 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white" 
                    value={stockStr} 
                    onChange={e => setStockStr(e.target.value)} 
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors">📦</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelStyle}>Floor Alert</label>
                <div className="relative group/input">
                  <input 
                    type="number" 
                    className="w-full h-16 px-6 bg-white/5 rounded-2xl border border-white/10 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all text-white" 
                    value={reorderStr} 
                    onChange={e => setReorderStr(e.target.value)} 
                  />
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/input:text-indigo-500 transition-colors">🚨</div>
                </div>
              </div>
            </div>

            {item?.id && isAdmin && (
               <button 
                 type="button" 
                 onClick={() => onDelete?.(item.id!)} 
                 className="w-full py-6 text-rose-500 font-black uppercase text-[10px] tracking-[0.4em] hover:bg-rose-500/10 rounded-[2rem] transition-all border border-transparent hover:border-rose-500/20"
               >
                 Purge Record from Core
               </button>
            )}
          </form>

          <div className="p-8 bg-[#0f172a] border-t border-white/5 relative z-10">
             <button 
               onClick={handleSubmit} 
               className="w-full h-20 bg-indigo-600 text-white rounded-[2.5rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] transition-all active:scale-[0.98] flex items-center justify-center gap-4 group/submit"
             >
               <span className="group-hover/submit:translate-x-1 transition-transform">
                 {item?.id ? 'Commit Registry Changes' : 'Commit to System Core'}
               </span>
               <span className="text-xl">→</span>
             </button>
          </div>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={c => { setBarcode(c); setShowScanner(false); return ScanResultStatus.SUCCESS; }} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddInventoryModal;