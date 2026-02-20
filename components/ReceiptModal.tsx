import React, { useState, useRef, useEffect } from 'react';
import { UtangRecord, BranchConfig, ReceiptTemplate, ReceiptFont, ReceiptLayout, AppSettings } from '../types';
import { toPng } from 'html-to-image';
import { PrinterService } from '../services/printerService';

interface ReceiptModalProps {
  transaction: UtangRecord;
  branch: BranchConfig;
  settings: AppSettings;
  onClose: () => void;
  isPreview?: boolean;
  autoPrint?: boolean;
  onUpdateSettings?: (key: keyof ReceiptTemplate, value: any) => void;
  cashierName?: string;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ 
  transaction, 
  branch, 
  settings, 
  onClose, 
  isPreview = false, 
  autoPrint = false,
  onUpdateSettings,
  cashierName
}) => {
  const { receiptTemplate, uiCustomization } = settings;
  const [isSaving, setIsSaving] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'style'>('preview');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop' | 'tablet'>(uiCustomization.deviceMode);
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isThermal = ['58mm', '80mm'].includes(receiptTemplate.paperWidth);
  const isA4SixUp = receiptTemplate.paperWidth === 'A4-6';
  const isLargeFormat = ['A4', 'Letter'].includes(receiptTemplate.paperWidth);
  const isMobilePreview = previewDevice === 'mobile';

  useEffect(() => {
    let timer: any;
    if (autoPrint && !isPreview) {
      timer = setTimeout(() => {
        if (PrinterService.isConnected() && isThermal) {
          handleHardwarePrint();
        } else {
          window.print();
        }
      }, 500);
    }
    return () => {
        if (timer) clearTimeout(timer);
    };
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
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    if (onUpdateSettings) {
      onUpdateSettings('logoUrl', '');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const headerAlignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  }[receiptTemplate.headerAlignment || 'center'];

  const paperWidthStyle = {
    '58mm': { width: '380px', minHeight: '400px', maxWidth: '100%' },
    '80mm': { width: '480px', minHeight: '500px', maxWidth: '100%' },
    'A4':   { width: '794px', height: '1123px', maxWidth: '100%' },
    'Letter': { width: '816px', height: '1056px', maxWidth: '100%' },
    'A4-6': { width: '105mm', height: '99mm', maxWidth: '100%', overflow: 'hidden' },
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
  const headerFontSize = receiptTemplate.headerFontSize || 20;
  const itemFontSize = receiptTemplate.itemFontSize || 12;
  const isCompact = receiptTemplate.layout === 'compact' || isA4SixUp;
  const isModern = receiptTemplate.layout === 'modern';

  const ReceiptContent = ({ isCopy = false, refProp = null }: { isCopy?: boolean, refProp?: React.RefObject<HTMLDivElement> | null }) => (
    <div 
      ref={refProp}
      className={`bg-white text-slate-900 overflow-hidden border border-slate-200 print-receipt ${isPreview && !isCopy ? 'shadow-2xl' : 'rounded-none shadow-none'} ${isA4SixUp ? 'print:border-dashed print:border-slate-300' : ''}`}
      style={{ 
         ...paperWidthStyle,
         fontFamily: fontStyle,
         fontSize: `${isA4SixUp ? Math.max(9, fontSize - 2) : fontSize}px`,
         padding: !isThermal && !isA4SixUp ? '40px 50px' : '0'
      }}
    >
      {isModern && !isA4SixUp && (
        <div className="absolute top-0 left-0 right-0 h-24 no-print" style={{ backgroundColor: accentColor, opacity: 0.1, zIndex: 0 }} />
      )}
      {isModern && isThermal && <div className="h-2 w-full no-print relative z-10" style={{ backgroundColor: accentColor }}></div>}
      <div className={`${isCompact ? 'p-3' : (isThermal ? 'p-8 md:p-10' : 'p-0')} h-full flex flex-col relative z-10`}>
        <div className={`mb-3 ${headerAlignClass} ${isModern ? 'pb-4' : ''}`}>
          {(receiptTemplate.logoUrl || branch.logoUrl) && (
            <img 
              src={receiptTemplate.logoUrl || branch.logoUrl} 
              alt="Store Logo" 
              className={`object-contain mb-2 ${headerAlignClass === 'text-center' ? 'mx-auto' : 'ml-0'} rounded-xl ${isCompact ? 'h-8 w-auto max-w-[80px]' : 'h-24 w-auto max-w-[200px]'}`} 
            />
          )}
          <h2 className="font-black uppercase tracking-tighter leading-none truncate" style={{ color: isModern ? accentColor : 'inherit', fontSize: `${isA4SixUp ? Math.max(12, headerFontSize - 4) : headerFontSize}px` }}>{branch.name}</h2>
          {receiptTemplate.headerSubtitle && <p className="font-bold text-slate-400 uppercase tracking-widest mt-1 line-clamp-1" style={{ fontSize: `${fontSize * 0.7}px` }}>{receiptTemplate.headerSubtitle}</p>}
          <div className="font-medium text-slate-500 uppercase mt-2 space-y-0.5" style={{ fontSize: `${fontSize * 0.65}px` }}>
            {receiptTemplate.showBranchAddress && <p className="line-clamp-1">{branch.address}</p>}
            {receiptTemplate.showBranchContact && <p>{branch.contact}</p>}
          </div>
        </div>
        {!isCompact && !isModern && <div className="border-t border-slate-100 my-2"></div>}
        <div className={`${isModern ? 'bg-slate-50 border-0' : 'bg-transparent border border-slate-100'} rounded-xl space-y-0.5 ${isCompact ? 'p-2 mb-2' : 'p-5 mb-6'}`}>
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
              <span className="font-medium text-slate-700">{new Date(transaction.date).toLocaleString()}</span>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <table className="w-full text-left mb-2">
            <thead>
              <tr className={`uppercase tracking-widest text-slate-400 ${isModern ? 'border-b-2' : 'border-b'} border-slate-200`} style={{ fontSize: `${fontSize * 0.6}px` }}>
                <th className="pb-2 w-[40%]">Item</th>
                <th className="pb-2 text-right w-[20%]">Price</th>
                <th className="pb-2 text-center w-[15%]">Qty</th>
                <th className="pb-2 text-right w-[25%]">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transaction.items && transaction.items.slice(0, isA4SixUp ? 5 : 99).map((item, idx) => (
                <tr key={idx} style={{ fontSize: `${isA4SixUp ? Math.max(9, itemFontSize - 2) : itemFontSize}px` }}>
                  <td className="py-2 pr-1 align-top">
                    <p className="font-bold text-slate-800 uppercase leading-tight line-clamp-2">{item.name}</p>
                    {receiptTemplate.showItemSize && item.unit && !isA4SixUp && <p className="text-[0.8em] text-slate-400 mt-0.5">{item.unit}</p>}
                  </td>
                  <td className="py-2 text-right font-medium text-slate-600 tabular-nums align-top">₱{item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="py-2 text-center font-bold text-slate-700 tabular-nums align-top">{item.quantity}</td>
                  <td className="py-2 text-right font-black text-slate-900 tabular-nums align-top">₱{(item.price * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={`space-y-1 pt-4 border-t-2 border-slate-200 ${isCompact ? 'mb-2' : 'mb-10'}`}>
          <div className="flex justify-between items-center">
            <span className="font-black text-slate-400 uppercase tracking-widest" style={{ fontSize: `${fontSize * 0.7}px` }}>Total</span>
            <span className="font-black tracking-tighter tabular-nums" style={{ color: isModern ? accentColor : 'black', fontSize: `${fontSize * 1.5}px` }}>₱{(transaction.totalAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
        <div className={`text-center space-y-1 ${!isThermal && !isA4SixUp ? 'mt-auto' : ''}`}>
          <div className="flex items-center justify-center gap-2 opacity-30 pt-2">
             <span className="w-1 h-1 rounded-full bg-slate-900"></span>
             <p className="font-black text-slate-900 uppercase tracking-[0.3em]" style={{ fontSize: `${fontSize * 0.5}px` }}>{receiptTemplate.brandingText}</p>
             <span className="w-1 h-1 rounded-full bg-slate-900"></span>
          </div>
        </div>
      </div>
    </div>
  );

  if (isPreview) {
    return (
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center z-[250] animate-in fade-in duration-300">
        <div className="w-full h-full max-w-7xl flex flex-wrap md:flex-nowrap overflow-hidden md:rounded-[2.5rem] bg-[#0f172a] shadow-2xl relative border border-white/5">
          
          <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-[70] md:hidden bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5">
            <h3 className="text-white font-black uppercase tracking-widest text-sm">Receipt Studio</h3>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">✕</button>
          </div>
          
          <button onClick={onClose} className="absolute top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 text-white hover:bg-rose-500 flex items-center justify-center transition hidden md:flex text-xl font-bold">✕</button>

          {/* PREVIEW CONTAINER */}
          <div 
            className={`flex-grow flex-shrink basis-auto bg-[#111827] flex items-center justify-center p-4 md:p-12 overflow-y-auto overflow-x-hidden relative transition-all duration-300 ${activeTab === 'style' ? 'hidden md:flex' : 'flex'}`}
          >
            <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
            
            <div className="mt-16 md:mt-0 pb-32 md:pb-0 flex flex-col items-center justify-start md:justify-center min-h-0 w-full">
               <div 
                 className="transition-transform duration-300 origin-top md:origin-center"
                 style={{ 
                   transform: isMobilePreview
                     ? (isLargeFormat ? 'scale(0.35)' : 'scale(0.8)') 
                     : (isLargeFormat ? 'scale(0.55)' : 'scale(1)') 
                 }}
               >
                  <ReceiptContent refProp={receiptRef} />
               </div>
            </div>
          </div>

          {/* SETTINGS SIDEBAR */}
          <div 
            className={`flex-[0_0_420px] max-w-full bg-[#0f172a] border-l border-white/5 flex flex-col h-full ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}
          >
             <div className="p-6 md:p-8 border-b border-white/5 shrink-0 pt-20 md:pt-8 flex flex-col justify-end min-h-[120px] md:min-h-0">
                <h2 className="text-2xl font-black text-white tracking-tight">Receipt Studio</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">THEME & FORMATTING</p>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar pb-32 md:pb-8 flex flex-col align-content-start">
                
                {/* Branding Section */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Branding & Identity</h4>
                  <div className="flex flex-wrap gap-4 items-center bg-[#1e293b] p-4 rounded-2xl border border-slate-700">
                     <div 
                       onClick={() => fileInputRef.current?.click()}
                       className="flex-[0_0_96px] h-20 rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center cursor-pointer hover:border-primary transition overflow-hidden"
                     >
                        {receiptTemplate.logoUrl ? <img src={receiptTemplate.logoUrl} className="h-full w-auto object-contain" /> : <span className="text-2xl">📷</span>}
                     </div>
                     <div className="flex-grow flex-shrink basis-[200px]">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Store Logo</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <button onClick={() => fileInputRef.current?.click()} className="flex-grow flex-shrink-0 flex-basis-auto text-[9px] font-black bg-white text-slate-900 px-3 py-1.5 rounded-lg uppercase transition hover:bg-gray-200">Upload</button>
                          {receiptTemplate.logoUrl && (
                            <button onClick={removeLogo} className="flex-grow flex-shrink-0 flex-basis-auto text-[9px] font-black bg-rose-500/10 text-rose-500 border border-rose-500/30 px-3 py-1.5 rounded-lg uppercase hover:bg-rose-500 hover:text-white transition">Remove</button>
                          )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                     </div>
                  </div>
                </section>

                {/* Typography Controls */}
                <section className="space-y-5">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Typography Scaling</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="col-span-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Global Body Size</label>
                        <div className="flex items-center gap-3">
                           <input type="range" min="10" max="24" value={receiptTemplate.fontSize} onChange={e => onUpdateSettings?.('fontSize', parseInt(e.target.value))} className="flex-1 accent-primary" />
                           <span className="text-xs font-black text-white w-8">{receiptTemplate.fontSize}px</span>
                        </div>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Header Size</label>
                        <input type="number" value={receiptTemplate.headerFontSize || 20} onChange={e => onUpdateSettings?.('headerFontSize', parseInt(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/50" />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Item Row Size</label>
                        <input type="number" value={receiptTemplate.itemFontSize || 12} onChange={e => onUpdateSettings?.('itemFontSize', parseInt(e.target.value))} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/50" />
                     </div>
                  </div>
                </section>

                {/* Layout Config */}
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Layout & Sizing</h4>
                  
                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Layout Mode</label>
                     <div className="flex flex-wrap gap-2 p-1.5 bg-[#1e293b] rounded-xl border border-slate-700">
                        {[
                          { id: 'classic', label: 'Classic', icon: '📄' },
                          { id: 'modern', label: 'Modern', icon: '✨' },
                          { id: 'compact', label: 'Compact', icon: '🤏' }
                        ].map(l => (
                          <button 
                            key={l.id} 
                            onClick={() => onUpdateSettings?.('layout', l.id as any)}
                            className={`flex-[1_0_auto] flex flex-col items-center gap-1 py-3 rounded-lg text-[9px] font-black uppercase transition-all ${receiptTemplate.layout === l.id ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                          >
                            <span className="text-sm grayscale">{l.icon}</span>
                            {l.label}
                          </button>
                        ))}
                     </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Header Alignment</label>
                     <div className="flex flex-wrap gap-2 p-1.5 bg-[#1e293b] rounded-xl border border-slate-700">
                        {['left', 'center', 'right'].map(align => (
                           <button 
                             key={align} 
                             onClick={() => onUpdateSettings?.('headerAlignment', align as any)}
                             className={`flex-[1_0_auto] py-2 rounded-lg text-[10px] font-black uppercase transition-all ${receiptTemplate.headerAlignment === align ? 'bg-[#6366f1] text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                           >
                             {align}
                           </button>
                        ))}
                     </div>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Paper Size</label>
                     <select value={receiptTemplate.paperWidth} onChange={e => onUpdateSettings?.('paperWidth', e.target.value as any)} className="w-full bg-[#1e293b] border border-slate-700 rounded-xl px-3 py-3 text-xs font-bold text-white outline-none focus:ring-2 focus:ring-primary/50">
                         <option value="58mm">58mm Thermal</option>
                         <option value="80mm">80mm Thermal</option>
                         <option value="A4">A4 (Full Page)</option>
                         <option value="Letter">Letter (US)</option>
                         <option value="A4-6">A4 (1/6th Cut)</option>
                     </select>
                  </div>
                </section>

                <section className="space-y-4 pt-2">
                   <h4 className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Visibility Protocols</h4>
                   {[
                     { k: 'showBranchAddress', label: 'Branch Address' },
                     { k: 'showBranchContact', label: 'Contact Number' },
                     { k: 'showCustomerId', label: 'Suki ID (Ref)' },
                     { k: 'showItemSize', label: 'Measurement Units' },
                     { k: 'showDateTime', label: 'Timestamp' }
                   ].map(opt => (
                      <div key={opt.k} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-xl border border-slate-700">
                         <span className="text-xs font-bold text-white uppercase tracking-tight">{opt.label}</span>
                         <div onClick={() => onUpdateSettings?.(opt.k as keyof ReceiptTemplate, !receiptTemplate[opt.k as keyof ReceiptTemplate])} className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${receiptTemplate[opt.k as keyof ReceiptTemplate] ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${receiptTemplate[opt.k as keyof ReceiptTemplate] ? 'translate-x-4' : ''}`} />
                         </div>
                      </div>
                   ))}
                </section>
             </div>
          </div>

          <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-[#0f172a]/90 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-2xl z-[60]">
             <button onClick={() => setActiveTab('preview')} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Preview</button>
             <button onClick={() => setActiveTab('style')} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'style' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Design</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-in fade-in">
      <div className="w-full max-w-sm flex flex-col gap-6 items-center">
        <div className="w-full relative shadow-2xl animate-in zoom-in duration-300">
           <ReceiptContent />
        </div>
        <div className="flex gap-2 w-full">
           <button onClick={handlePrint} className="flex-[1_1_auto] py-4 bg-white text-[#0f172a] rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 transition shadow-lg">🖨️ Print</button>
           <button onClick={handleSaveToGallery} disabled={isSaving} className="flex-[1_1_auto] py-4 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 transition shadow-lg disabled:opacity-50">{isSaving ? 'Processing...' : '💾 Save Img'}</button>
           <button onClick={onClose} className="flex-[0_0_56px] bg-white/10 text-white rounded-2xl font-black text-xl hover:bg-rose-500 transition flex items-center justify-center">✕</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;