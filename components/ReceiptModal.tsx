
import React, { useState, useRef, useEffect } from 'react';
import { UtangRecord, BranchConfig, ReceiptTemplate, ReceiptFont, ReceiptLayout } from '../types';
import { toPng } from 'html-to-image';
import { PrinterService } from '../services/printerService';

interface ReceiptModalProps {
  transaction: UtangRecord;
  branch: BranchConfig;
  receiptTemplate: ReceiptTemplate;
  onClose: () => void;
  isPreview?: boolean;
  autoPrint?: boolean;
  onUpdateSettings?: (key: keyof ReceiptTemplate, value: any) => void;
  cashierName?: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  transaction, 
  branch, 
  receiptTemplate, 
  onClose, 
  isPreview = false, 
  autoPrint = false,
  onUpdateSettings,
  cashierName
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'style'>('preview');
  const receiptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isThermal = ['58mm', '80mm'].includes(receiptTemplate.paperWidth);
  const isA4SixUp = receiptTemplate.paperWidth === 'A4-6';

  useEffect(() => {
    if (autoPrint && !isPreview) {
      const timer = setTimeout(() => {
        if (PrinterService.isConnected() && isThermal) {
          handleHardwarePrint();
        } else {
          window.print();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint, isPreview, isThermal]);

  const handlePrint = () => {
    window.print();
  };

  const handleHardwarePrint = async () => {
    if (!PrinterService.isConnected()) {
      alert("Please connect a Printer (Bluetooth or USB) in Settings first.");
      return;
    }
    setIsPrinting(true);
    try {
      await PrinterService.printReceipt(transaction, branch, receiptTemplate, cashierName);
    } catch (err: any) {
      console.error(err);
      alert(`Print Failed: ${err.message}. Check connection.`);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleSaveToGallery = async () => {
    if (!receiptRef.current || isSaving) return;
    
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(receiptRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      });
      
      const link = document.createElement('a');
      link.download = `Receipt_${transaction.customerName?.replace(/\s+/g, '_') || 'Sample'}_${transaction.id?.slice(0, 8) || 'PREVIEW'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Could not save receipt image:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpdateSettings) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings('logoUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Styles based on settings
  const headerAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[receiptTemplate.headerAlignment || 'center'];

  const paperWidthStyle = {
    '58mm': { width: '380px', minHeight: '400px', maxWidth: '100%' },
    '80mm': { width: '480px', minHeight: '500px', maxWidth: '100%' },
    'A4':   { width: '794px', height: '1123px', maxWidth: '100%' }, // A4 at 96dpi
    'Letter': { width: '816px', height: '1056px', maxWidth: '100%' }, // Letter at 96dpi
    'A4-6': { width: '105mm', height: '99mm', maxWidth: '100%', overflow: 'hidden' }, // 1/6th of A4 (105mm x 99mm)
    'full': { width: '100%', maxWidth: '100%' }
  }[receiptTemplate.paperWidth || '58mm'];

  const fontStyle = {
    'JetBrains Mono': "'JetBrains Mono', monospace",
    'Inter': "'Inter', sans-serif",
    'Courier New': "'Courier New', Courier, monospace",
    'Roboto': "'Roboto', sans-serif",
    'Poppins': "'Poppins', sans-serif"
  }[receiptTemplate.fontFamily || 'Inter'];

  const accentColor = receiptTemplate.accentColor || '#6366f1';
  const fontSize = receiptTemplate.fontSize || 14;
  const isCompact = receiptTemplate.layout === 'compact' || isA4SixUp; // Force compact for 6-up
  const isModern = receiptTemplate.layout === 'modern';

  const ReceiptContent = ({ isCopy = false, refProp = null }: { isCopy?: boolean, refProp?: React.RefObject<HTMLDivElement> | null }) => (
    <div 
      ref={refProp}
      className={`bg-white text-slate-900 overflow-hidden border border-slate-200 print-receipt ${isPreview && !isCopy ? 'scale-90 md:scale-100 transition-transform origin-top shadow-2xl' : 'rounded-none shadow-none'} ${isA4SixUp ? 'print:border-dashed print:border-slate-300' : ''}`}
      style={{ 
         ...paperWidthStyle,
         fontFamily: fontStyle,
         fontSize: `${isA4SixUp ? Math.max(9, fontSize - 2) : fontSize}px`, // Slightly smaller font for 6-up
         // If A4/Letter, simulate page
         padding: !isThermal && !isA4SixUp ? '40px 50px' : '0'
      }}
    >
      {isModern && isThermal && <div className="h-3 w-full no-print" style={{ backgroundColor: accentColor }}></div>}
      {isModern && !isThermal && !isA4SixUp && <div className="absolute top-0 left-0 right-0 h-4 w-full" style={{ backgroundColor: accentColor }}></div>}

      <div className={`${isCompact ? 'p-3' : (isThermal ? 'p-8 md:p-10' : 'p-0')} h-full flex flex-col`}>
        {/* Header Section */}
        <div className={`mb-3 ${headerAlignClass}`}>
          {(receiptTemplate.logoUrl || branch.logoUrl) && (
            <img src={receiptTemplate.logoUrl || branch.logoUrl} alt="Store Logo" className={`object-contain mb-1 ${headerAlignClass === 'text-center' ? 'mx-auto' : ''} rounded-xl ${isCompact ? 'w-8 h-8' : 'w-20 h-20'}`} />
          )}
          <h2 className="font-black uppercase tracking-tighter leading-none truncate" style={{ color: isModern ? accentColor : 'inherit', fontSize: `${fontSize * (isCompact ? 1.2 : 1.5)}px` }}>{branch.name}</h2>
          {receiptTemplate.headerSubtitle && (
            <p className="font-bold text-slate-400 uppercase tracking-widest mt-0.5 line-clamp-1" style={{ fontSize: `${fontSize * 0.7}px` }}>{receiptTemplate.headerSubtitle}</p>
          )}
          <div className="font-medium text-slate-500 uppercase mt-1 space-y-0.5" style={{ fontSize: `${fontSize * 0.65}px` }}>
            {receiptTemplate.showBranchAddress && <p className="line-clamp-1">{branch.address}</p>}
            {receiptTemplate.showBranchContact && <p>{branch.contact}</p>}
          </div>
        </div>

        {!isCompact && <div className="border-t border-slate-100 my-2"></div>}

        {/* Transaction Metadata */}
        <div className={`bg-slate-50 rounded-xl space-y-0.5 border border-slate-100 ${isCompact ? 'p-2 mb-2' : 'p-5 mb-6'}`}>
          <div className="flex justify-between items-center">
            <span className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: `${fontSize * 0.6}px` }}>Customer</span>
            <span className="font-bold text-slate-900 uppercase truncate max-w-[60%]">{transaction.customerName || 'Walk-in'}</span>
          </div>
          {receiptTemplate.showCustomerId && transaction.customerName !== 'Walk-in Customer' && (
             <div className="flex justify-between items-center">
                <span className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: `${fontSize * 0.6}px` }}>ID</span>
                <span className="font-medium text-slate-700">{(transaction.id || '').slice(0,8).toUpperCase()}</span>
             </div>
          )}
          {receiptTemplate.showDateTime && (
            <div className="flex justify-between items-center">
              <span className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: `${fontSize * 0.6}px` }}>Date</span>
              <span className="font-medium text-slate-700">{transaction.date || new Date().toLocaleString()}</span>
            </div>
          )}
          {cashierName && (
            <div className="flex justify-between items-center border-t border-slate-200 mt-1 pt-1">
              <span className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: `${fontSize * 0.6}px` }}>Cashier</span>
              <span className="font-medium text-slate-700 uppercase">{cashierName}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="flex-1 overflow-hidden">
          <table className="w-full text-left mb-2">
            <thead>
              <tr className="border-b border-slate-200 uppercase tracking-widest text-slate-400" style={{ fontSize: `${fontSize * 0.6}px` }}>
                <th className="pb-1 w-[40%]">Item</th>
                <th className="pb-1 text-right w-[20%]">Price</th>
                <th className="pb-1 text-center w-[15%]">Qty</th>
                <th className="pb-1 text-right w-[25%]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transaction.items && transaction.items.slice(0, isA4SixUp ? 5 : 99).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 pr-1 align-top">
                    <p className="font-bold text-slate-800 uppercase leading-tight line-clamp-1">{item.name}</p>
                    {receiptTemplate.showItemSize && item.unit && !isA4SixUp && <p className="text-[0.8em] text-slate-400">{item.unit}</p>}
                  </td>
                  <td className="py-1 text-right font-medium text-slate-600 tabular-nums align-top">
                    ₱{item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="py-1 text-center font-bold text-slate-700 tabular-nums align-top">
                    {item.quantity}
                  </td>
                  <td className="py-1 text-right font-black text-slate-900 tabular-nums align-top">
                    ₱{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {isA4SixUp && transaction.items && transaction.items.length > 5 && (
                 <tr>
                   <td colSpan={4} className="text-center text-[8px] italic py-1 opacity-50">...and {transaction.items.length - 5} more</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className={`space-y-1 pt-2 border-t border-slate-200 ${isCompact ? 'mb-2' : 'mb-10'}`}>
          <div className="flex justify-between items-center">
            <span className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: `${fontSize * 0.7}px` }}>Total</span>
            <span className="font-black tracking-tighter tabular-nums" style={{ color: isModern ? accentColor : 'black', fontSize: `${fontSize * 1.3}px` }}>₱{(transaction.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          {transaction.paidAmount > 0 && !isA4SixUp && (
             <div className="flex justify-between items-center text-slate-500" style={{ fontSize: `${fontSize * 0.8}px` }}>
                <span className="font-bold uppercase">Cash / Paid</span>
                <span>₱{transaction.paidAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
          )}
           {transaction.totalAmount - transaction.paidAmount > 0 && (
             <div className="flex justify-between items-center text-rose-500" style={{ fontSize: `${fontSize * 0.8}px` }}>
                <span className="font-black uppercase">Bal</span>
                <span className="font-black">₱{(transaction.totalAmount - transaction.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className={`text-center space-y-1 ${!isThermal && !isA4SixUp ? 'mt-auto' : ''}`}>
          {!isA4SixUp && (
            <p className="font-bold text-slate-700 uppercase leading-relaxed px-4 opacity-80 line-clamp-2" style={{ fontSize: `${fontSize * 0.7}px` }}>
              {receiptTemplate.footerText}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 opacity-30">
             <span className="w-1 h-1 rounded-full bg-slate-900"></span>
             <p className="font-black text-slate-900 uppercase tracking-[0.3em]" style={{ fontSize: `${fontSize * 0.5}px` }}>
               {receiptTemplate.brandingText}
             </p>
             <span className="w-1 h-1 rounded-full bg-slate-900"></span>
          </div>
        </div>
      </div>
    </div>
  );

  // PREVIEW / EDIT MODE - STYLED TO MATCH "REGISTER SUKI" IMAGE
  if (isPreview) {
    return (
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[250] animate-in fade-in duration-300">
        <div className="w-full h-full max-w-7xl flex flex-col md:flex-row overflow-hidden md:rounded-[2.5rem] bg-[#0f172a] shadow-2xl relative border border-white/5">
          
          {/* Header (Mobile) / Close Button */}
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 md:hidden bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5">
            <h3 className="text-white font-black uppercase tracking-widest text-sm">Receipt Designer</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center">✕</button>
          </div>
          <button onClick={onClose} className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-rose-500 hover:text-white flex items-center justify-center transition hidden md:flex text-xl font-bold">✕</button>

          {/* Left Pane: Preview */}
          <div className={`flex-1 bg-[#111827] flex items-center justify-center p-8 md:p-12 overflow-y-auto relative ${activeTab === 'style' ? 'hidden md:flex' : 'flex'}`}>
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            <div className="scale-90 md:scale-100 shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all">
               <ReceiptContent refProp={receiptRef} />
            </div>
          </div>

          {/* Right Pane: Settings (Styled like Suki Modal) */}
          <div className={`w-full md:w-[420px] bg-[#0f172a] border-l border-white/5 flex flex-col ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
             <div className="p-8 border-b border-white/5 hidden md:block">
                <h2 className="text-2xl font-black text-white tracking-tight">Receipt Studio</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">CUSTOMIZE TEMPLATE</p>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar pt-20 md:pt-8">
                {/* Branding Section */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Branding & Identity</h4>
                  
                  <div className="flex gap-4 items-center bg-[#1e293b] p-4 rounded-2xl border border-slate-700">
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="w-16 h-16 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-primary transition overflow-hidden shrink-0"
                     >
                        {receiptTemplate.logoUrl ? <img src={receiptTemplate.logoUrl} className="w-full h-full object-contain" /> : <span className="text-2xl">📷</span>}
                     </div>
                     <div className="flex-1">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Header Logo</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => fileInputRef.current?.click()} className="text-[9px] font-black bg-white text-slate-900 px-3 py-1.5 rounded-lg uppercase transition hover:bg-gray-200">Upload</button>
                          {receiptTemplate.logoUrl && (
                            <button 
                              onClick={() => onUpdateSettings?.('logoUrl', '')}
                              className="text-[9px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/30 px-3 py-1.5 rounded-lg uppercase hover:bg-rose-500 hover:text-white transition"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                     </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Footer Message</label>
                     <textarea 
                       value={receiptTemplate.footerText} 
                       onChange={e => onUpdateSettings?.('footerText', e.target.value)} 
                       className="w-full bg-[#1e293b] border border-slate-700 rounded-xl p-4 text-xs font-bold text-white h-24 outline-none focus:ring-2 focus:ring-primary/50 transition resize-none placeholder:text-slate-600"
                       placeholder="e.g. Thank you for buying!"
                     />
                  </div>
                </section>

                {/* Layout Section */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Layout Config</h4>
                  
                  <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#1e293b] rounded-xl border border-slate-700">
                     {(['classic', 'modern', 'compact'] as ReceiptLayout[]).map(l => (
                       <button 
                         key={l} 
                         onClick={() => onUpdateSettings?.('layout', l)}
                         className={`py-2.5 rounded-lg text-[9px] font-black uppercase transition-all ${receiptTemplate.layout === l ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                       >
                         {l}
                       </button>
                     ))}
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Font Family</label>
                     <div className="relative">
                        <select 
                            value={receiptTemplate.fontFamily} 
                            onChange={e => onUpdateSettings?.('fontFamily', e.target.value)} 
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                        >
                            <option value="Inter">Inter (Clean)</option>
                            <option value="JetBrains Mono">JetBrains Mono (Code)</option>
                            <option value="Courier New">Courier New (Retro)</option>
                            <option value="Roboto">Roboto (Standard)</option>
                            <option value="Poppins">Poppins (Modern)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">▼</div>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Paper Size</label>
                        <div className="relative">
                            <select 
                            value={receiptTemplate.paperWidth} 
                            onChange={e => onUpdateSettings?.('paperWidth', e.target.value)} 
                            className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-4 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
                            >
                            <optgroup label="Thermal">
                                <option value="58mm">58mm</option>
                                <option value="80mm">80mm</option>
                            </optgroup>
                            <optgroup label="Standard">
                                <option value="A4-6">A4 (Grid)</option>
                                <option value="A4">A4 Full</option>
                                <option value="Letter">Letter</option>
                            </optgroup>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">▼</div>
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Font Size</label>
                        <div className="flex items-center gap-2 bg-[#1e293b] border border-slate-700 rounded-xl px-2 h-[42px]">
                           <button onClick={() => onUpdateSettings?.('fontSize', Math.max(10, fontSize - 1))} className="w-8 h-full text-slate-400 hover:text-white font-black text-lg">-</button>
                           <span className="flex-1 text-center text-xs font-bold text-white">{fontSize}px</span>
                           <button onClick={() => onUpdateSettings?.('fontSize', Math.min(20, fontSize + 1))} className="w-8 h-full text-slate-400 hover:text-white font-black text-lg">+</button>
                        </div>
                     </div>
                  </div>
                </section>

                {/* Toggles */}
                <section className="space-y-3">
                   <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Display Options</h4>
                   {[
                     { k: 'showBranchAddress', label: 'Show Store Address' },
                     { k: 'showBranchContact', label: 'Show Contact Info' },
                     { k: 'showDateTime', label: 'Show Date & Time' },
                     { k: 'showCustomerId', label: 'Show Customer ID' },
                   ].map(opt => (
                     <div key={opt.k} className="flex justify-between items-center p-3 bg-[#1e293b] rounded-xl border border-slate-700">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wide">{opt.label}</span>
                        <div 
                          onClick={() => onUpdateSettings?.(opt.k as keyof ReceiptTemplate, !receiptTemplate[opt.k as keyof ReceiptTemplate])}
                          className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${receiptTemplate[opt.k as keyof ReceiptTemplate] ? 'bg-[#6366f1]' : 'bg-slate-700'}`}
                        >
                           <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${receiptTemplate[opt.k as keyof ReceiptTemplate] ? 'translate-x-4' : ''}`} />
                        </div>
                     </div>
                   ))}
                </section>
                
                {/* Save Button */}
                <button onClick={onClose} className="w-full py-4 bg-[#6366f1] text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition active:scale-95">
                  Done & Save
                </button>

                <div className="h-20 md:hidden"></div>
             </div>

             {/* Mobile Tab Bar */}
             <div className="md:hidden flex p-2 bg-[#020617] border-t border-white/10 fixed bottom-0 left-0 right-0 z-50">
                <button onClick={() => setActiveTab('preview')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'preview' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>Preview</button>
                <button onClick={() => setActiveTab('style')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${activeTab === 'style' ? 'bg-white text-slate-900' : 'text-slate-500'}`}>Styles</button>
             </div>
          </div>
        </div>
      </div>
    );
  }

  // DEFAULT (NON-PREVIEW) RENDER (THE ACTUAL PRINT VIEW)
  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full flex flex-col items-center gap-6 py-12">
        
        {/* If A4-6 Layout is selected, render 6 copies in a grid for printing */}
        {isA4SixUp ? (
          <div className="bg-white p-0 grid grid-cols-2 grid-rows-3 print-grid" style={{ width: '210mm', height: '297mm', alignContent: 'start', justifyContent: 'center' }}>
             {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center justify-center p-1 border-r border-b border-dashed border-slate-200">
                   <ReceiptContent isCopy={true} refProp={i === 0 ? receiptRef : null} />
                </div>
             ))}
          </div>
        ) : (
          // Normal Single Receipt
          <ReceiptContent refProp={receiptRef} />
        )}

        <div className="flex flex-col gap-4 w-full max-w-xs px-4 pb-10 no-print">
          
          {/* Smart Button: Show Hardware Print only for Thermal Sizes */}
          {isThermal && PrinterService.isConnected() && (
            <button 
              onClick={handleHardwarePrint} 
              disabled={isPrinting} 
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              {isPrinting ? 'SENDING DATA...' : `⚡ ${PrinterService.getConnectionType().toUpperCase()} PRINT`}
            </button>
          )}

          {/* OS Print - Better for A4/Letter or if no hardware connected */}
          <button onClick={handlePrint} className="py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
            🖨️ {isThermal && PrinterService.isConnected() ? 'System Print' : 'Print Now'}
          </button>

          <div className="grid grid-cols-1 gap-3">
            <button onClick={handleSaveToGallery} disabled={isSaving} className="py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
              {isSaving ? 'Saving...' : '💾 Save as Image'}
            </button>
          </div>
          <button onClick={onClose} className="py-4 bg-white/10 text-white border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/20 transition-all">
            Close Terminal
          </button>
        </div>
      </div>
       <style>{`
        @media print {
          @page { margin: 0; size: ${isA4SixUp ? 'A4 portrait' : 'auto'}; }
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          .no-print { display: none !important; }
          body * { visibility: hidden; }
          .print-receipt, .print-receipt * { visibility: visible; }
          ${!isA4SixUp ? `
            .print-receipt { 
              position: absolute; left: 0; top: 0; margin: 0; padding: 0 !important; 
              box-shadow: none !important; border: none !important; 
              width: 100% !important; max-width: none !important; transform: none !important; 
              min-height: auto !important;
            }
          ` : `
            .print-grid, .print-grid * { visibility: visible; }
            .print-grid {
              position: absolute; left: 0; top: 0;
              display: grid !important;
              grid-template-columns: 1fr 1fr;
              grid-template-rows: 1fr 1fr 1fr;
              width: 210mm !important;
              height: 297mm !important;
            }
          `}
        }
      `}</style>
    </div>
  );
};

export default ReceiptModal;
