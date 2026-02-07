
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, MeasurementUnit, UserRole } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';

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
  userRole = 'cashier' 
}) => {
  // We use string values for inputs to allow "10." or empty states, then parse on submit
  const [name, setName] = useState(initialName || '');
  const [category, setCategory] = useState(categories[0] || 'Others');
  const [barcode, setBarcode] = useState(initialBarcode || '');
  const [unit, setUnit] = useState<MeasurementUnit>('pc');
  const [expiryDate, setExpiryDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  // Numeric fields managed as strings to fix Decimal Bug
  const [stockStr, setStockStr] = useState('0');
  const [priceStr, setPriceStr] = useState('0');
  const [costStr, setCostStr] = useState('0');
  const [reorderStr, setReorderStr] = useState(defaultReorderLevel.toString());
  const [itemsPerPackStr, setItemsPerPackStr] = useState('1');
  
  // Pack Logic Visuals
  const [packInputStr, setPackInputStr] = useState('');

  const [showScanner, setShowScanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const isPack = unit === 'pack';
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
      setItemsPerPackStr((item.itemsPerPack || 1).toString());

      // Calculate visual packs
      if (item.unit === 'pack' && item.itemsPerPack && item.itemsPerPack > 0) {
        const calculatedPacks = item.stock / item.itemsPerPack;
        setPackInputStr(Number.isInteger(calculatedPacks) ? calculatedPacks.toString() : calculatedPacks.toFixed(2));
      }
    } else {
        if (initialBarcode) setBarcode(initialBarcode);
        if (initialName) setName(initialName);
    }
  }, [item, initialBarcode, initialName]);

  const handleBarcodeScan = (code: string): ScanResultStatus => {
    setBarcode(code);
    setShowScanner(false);
    return ScanResultStatus.SUCCESS;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 300;
          const scaleSize = MAX_WIDTH / img.width;
          const height = img.height * scaleSize;
          const width = MAX_WIDTH;
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setImageUrl(dataUrl);
          setIsCompressing(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUnitChange = (newUnit: MeasurementUnit) => {
    if (newUnit === 'pack') {
      const ipp = parseFloat(itemsPerPackStr) || 1;
      const currentStock = parseFloat(stockStr) || 0;
      const calculatedPacks = currentStock / ipp;
      setPackInputStr(Number.isInteger(calculatedPacks) ? calculatedPacks.toString() : calculatedPacks.toFixed(2));
    } else {
      setPackInputStr('');
    }
    setUnit(newUnit);
  };

  const handlePackInputChange = (val: string) => {
    setPackInputStr(val);
    const packs = parseFloat(val) || 0;
    const ipp = parseFloat(itemsPerPackStr) || 1;
    setStockStr((packs * ipp).toString());
  };

  const handleItemsPerPackChange = (val: string) => {
    setItemsPerPackStr(val);
    const ipp = parseFloat(val) || 1;
    if (unit === 'pack') {
       const packs = parseFloat(packInputStr) || 0;
       setStockStr((packs * ipp).toString());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    // Safety check for packs
    const safeItemsPerPack = parseFloat(itemsPerPackStr) || 1;

    const payload: any = {
      name,
      category,
      barcode,
      unit,
      expiryDate,
      imageUrl,
      stock: parseFloat(stockStr) || 0,
      price: parseFloat(priceStr) || 0,
      originalPrice: parseFloat(costStr) || 0,
      reorderLevel: parseFloat(reorderStr) || 0,
      itemsPerPack: safeItemsPerPack > 0 ? safeItemsPerPack : 1
    };

    if (item?.id) payload.id = item.id;
    onAdd(payload);
    onClose();
  };

  const profit = (parseFloat(priceStr) || 0) - (parseFloat(costStr) || 0);
  const margin = parseFloat(priceStr) > 0 ? (profit / parseFloat(priceStr)) * 100 : 0;

  // Styles - Updated for Dark Theme Pro Look
  const labelStyle = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1";
  const inputContainerStyle = "bg-[#1e293b] border border-slate-700 rounded-xl flex items-center overflow-hidden focus-within:ring-2 focus-within:ring-[#6366f1]/50 transition-all focus-within:border-[#6366f1] h-14";
  const inputStyle = "w-full h-full px-4 bg-transparent text-white font-bold text-xs outline-none placeholder:text-slate-500 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center z-[150] p-4 animate-in fade-in duration-200">
        <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10 relative">
          
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0f172a] shrink-0">
            <div>
              <h3 className="text-xl font-black text-white tracking-tight">{item?.id ? 'Edit Product' : 'New Product'}</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">INVENTORY ENTRY</p>
            </div>
            <button 
              type="button" 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-white"
            >
              ✕
            </button>
          </div>

          <form id="inventory-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-6 space-y-6">
              
              {/* Image & Name Row */}
              <div className="flex gap-4">
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="w-20 h-20 rounded-2xl bg-[#1e293b] border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-[#6366f1] hover:text-[#6366f1] transition-colors shrink-0 overflow-hidden relative group"
                 >
                    {isCompressing ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#6366f1] border-t-transparent"></div>
                    ) : imageUrl ? (
                      <img src={imageUrl} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-slate-500">📷</span>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[8px] font-black uppercase">Change</div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </div>
                 <div className="flex-1">
                    <label className={labelStyle}>ITEM NAME <span className="text-rose-500">*</span></label>
                    <div className={inputContainerStyle}>
                      <input 
                        required 
                        autoFocus 
                        className={inputStyle} 
                        placeholder="e.g. Corned Beef 150g" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                      />
                    </div>
                 </div>
              </div>

              {/* Category & Barcode */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={labelStyle}>CATEGORY</label>
                    <div className={inputContainerStyle}>
                       <select 
                          className={`${inputStyle} appearance-none cursor-pointer`}
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                       >
                          {categories.map(c => <option key={c} value={c} className="bg-[#1e293b] text-white">{c}</option>)}
                       </select>
                    </div>
                 </div>
                 <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">BARCODE</label>
                       <button 
                         type="button" 
                         onClick={() => setShowScanner(true)}
                         className="text-[9px] font-black text-[#6366f1] uppercase tracking-wider hover:text-white transition-colors flex items-center gap-1"
                       >
                         SCAN 📷
                       </button>
                    </div>
                    <div className={inputContainerStyle}>
                      <input 
                        className={`${inputStyle} font-mono text-[#6366f1]`} 
                        placeholder="Scan or type..." 
                        value={barcode} 
                        onChange={e => setBarcode(e.target.value)} 
                      />
                    </div>
                 </div>
              </div>

              {/* Financials */}
              <div className="p-5 rounded-2xl bg-[#1e293b] border border-white/5 space-y-4 relative">
                {!isAdmin && (
                   <div className="absolute top-3 right-3 text-[8px] font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-full uppercase tracking-widest border border-rose-500/20">
                      Price Locked
                   </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className={labelStyle}>COST (₱)</label>
                      <div className={`${inputContainerStyle} bg-[#0f172a] border-slate-700 h-12`}>
                        <span className="pl-4 text-slate-500 font-bold text-xs">₱</span>
                        <input 
                          type="number" 
                          step="any"
                          disabled={!isAdmin}
                          className={`${inputStyle} pl-2`} 
                          placeholder="0.00" 
                          value={costStr}
                          onChange={e => setCostStr(e.target.value)}
                        />
                      </div>
                   </div>
                   <div>
                      <label className={labelStyle}>
                        RETAIL PRICE <span className="opacity-50 text-[8px] font-bold">(PER {unit === 'pc' ? 'PC' : unit.toUpperCase()})</span>
                      </label>
                      <div className={`${inputContainerStyle} bg-[#0f172a] border-emerald-500/30 focus-within:border-emerald-500 h-12`}>
                        <span className="pl-4 text-emerald-500 font-bold text-xs">₱</span>
                        <input 
                          type="number" 
                          step="any"
                          disabled={!isAdmin}
                          className={`${inputStyle} pl-2 text-emerald-400 text-sm`} 
                          placeholder="0.00" 
                          value={priceStr} 
                          onChange={e => setPriceStr(e.target.value)} 
                        />
                      </div>
                   </div>
                </div>
                {/* Profit Pill */}
                {margin > 0 && isAdmin && (
                  <div className="flex justify-between items-center pt-1 px-1">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Profit</span>
                     <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg">
                       +{margin.toFixed(0)}% (₱{profit.toFixed(2)})
                     </span>
                  </div>
                )}
              </div>

              {/* Stock & Unit */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={labelStyle}>UNIT TYPE</label>
                    <div className={inputContainerStyle}>
                       <select 
                          className={`${inputStyle} appearance-none cursor-pointer`}
                          value={unit} 
                          onChange={e => handleUnitChange(e.target.value as MeasurementUnit)}
                       >
                          <option value="pc" className="bg-[#1e293b]">Piece (pc)</option>
                          <option value="pack" className="bg-[#1e293b]">Pack (Bulk)</option>
                          <option value="kg" className="bg-[#1e293b]">Kilo (kg)</option>
                          <option value="g" className="bg-[#1e293b]">Gram (g)</option>
                          <option value="L" className="bg-[#1e293b]">Liter (L)</option>
                          <option value="ml" className="bg-[#1e293b]">Milliliter (ml)</option>
                       </select>
                    </div>
                 </div>
                 
                 <div>
                    <label className={labelStyle}>{isPack ? 'NUMBER OF PACKS' : 'CURRENT STOCK'}</label>
                    <div className={inputContainerStyle}>
                       <input 
                         type="number"
                         step="any"
                         className={inputStyle}
                         placeholder="0"
                         value={isPack ? packInputStr : stockStr}
                         onChange={e => isPack ? handlePackInputChange(e.target.value) : setStockStr(e.target.value)}
                       />
                    </div>
                 </div>
              </div>

              {/* Pack Config */}
              {isPack && (
                <div className="bg-[#6366f1]/10 rounded-2xl p-4 border border-[#6366f1]/20 animate-in slide-in-from-top-2">
                   <div className="flex justify-between items-center mb-2">
                      <label className="text-[9px] font-black text-[#6366f1] uppercase tracking-widest">ITEMS PER PACK</label>
                      <span className="text-[9px] font-bold text-slate-400">Total Units: {stockStr}</span>
                   </div>
                   <div className={`${inputContainerStyle} bg-[#0f172a] border-[#6366f1]/30 h-12`}>
                      <input 
                         type="number" 
                         className={inputStyle}
                         value={itemsPerPackStr}
                         onChange={e => handleItemsPerPackChange(e.target.value)}
                      />
                   </div>
                </div>
              )}

              {/* Reorder & Expiry */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className={labelStyle}>LOW STOCK ALERT</label>
                    <div className={inputContainerStyle}>
                      <input 
                        type="number" 
                        className={inputStyle} 
                        value={reorderStr} 
                        onChange={e => setReorderStr(e.target.value)} 
                      />
                    </div>
                 </div>
                 <div>
                    <label className={labelStyle}>EXPIRY DATE</label>
                    <div className={inputContainerStyle}>
                      <input 
                        type="date" 
                        className={`${inputStyle} appearance-none`} 
                        value={expiryDate} 
                        onChange={e => setExpiryDate(e.target.value)} 
                      />
                    </div>
                 </div>
              </div>

              {item?.id && onDelete && isAdmin && (
                <div className="pt-4 border-t border-white/5">
                   <button 
                     type="button" 
                     onClick={() => onDelete(item.id!)}
                     className="w-full py-3 border border-rose-500/20 text-rose-500 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition"
                   >
                     Delete Item
                   </button>
                </div>
              )}

            </div>
          </form>

          {/* Footer Action */}
          <div className="p-6 bg-[#0f172a] border-t border-white/5 shrink-0">
             <button 
               type="submit"
               form="inventory-form"
               disabled={isCompressing}
               className="w-full h-14 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-500/20 hover:bg-[#4f46e5] transition active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
             >
               {isCompressing ? 'COMPRESSING...' : (item?.id ? 'UPDATE ITEM' : 'SAVE TO INVENTORY')}
             </button>
          </div>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddInventoryModal;
