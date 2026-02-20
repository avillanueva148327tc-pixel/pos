
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { Customer, BranchConfig } from '../types';

interface CustomerCatalogModalProps {
  customers: Customer[];
  branch: BranchConfig;
  onClose: () => void;
}

const CustomerCatalogModal: React.FC<CustomerCatalogModalProps> = ({ customers, branch, onClose }) => {
  const catalogRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    
    // Generate QRs for all customers on mount
    const generateQRs = async () => {
        const codes: Record<string, string> = {};
        for (const c of customers) {
            try {
                // Encode the internal customer ID for scanning
                codes[c.id] = await QRCode.toDataURL(`CID:${c.id}`, { 
                    margin: 1, 
                    width: 256,
                    color: { dark: '#0f172a', light: '#ffffff' }
                });
            } catch (e) { console.error(`Failed to generate QR for ${c.name}:`, e); }
        }
        setQrCodes(codes);
    };
    if (customers.length > 0) {
        generateQRs();
    }

    return () => window.removeEventListener('resize', handleResize);
  }, [customers]);

  // Group customers by department
  const groupedCustomers = useMemo(() => {
    const groups: Record<string, Customer[]> = {};
    const sorted = [...customers].sort((a, b) => a.name.localeCompare(b.name));
    
    sorted.forEach(item => {
      const cat = item.department || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    // Sort categories alphabetically
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, Customer[]>);
  }, [customers]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveImage = async () => {
    if (!catalogRef.current || isSaving) return;
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const dataUrl = await toPng(catalogRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 794,
        height: catalogRef.current.scrollHeight,
        style: {
            height: 'auto', 
            minHeight: '1123px',
            transform: 'none',
            margin: '0',
            boxShadow: 'none'
        }
      });

      const link = document.createElement('a');
      link.download = `Suki_Catalog_${branch.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save image', err);
      alert('Could not save image. Try printing to PDF instead.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[500] p-0 md:p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full h-full md:h-[90vh] md:max-w-7xl md:rounded-[2.5rem] shadow-2xl overflow-hidden border-0 md:border border-white/10 flex flex-col md:flex-row relative">
        
        <div className="w-full md:w-80 bg-[#1e293b] p-8 border-r border-white/5 flex flex-col shrink-0">
          <div className="mb-8">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Suki Catalog</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ID Card Generator</p>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <p className="text-[10px] text-emerald-300 font-medium leading-relaxed">
                Print these cards for your customers for instant identification and credit tracking via QR code.
              </p>
            </div>
            
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Summary</p>
                <div className="flex justify-between text-xs text-white mb-1">
                    <span>Total Sukis:</span>
                    <span className="font-bold">{customers.length}</span>
                </div>
                 <div className="flex justify-between text-xs text-white mb-1">
                    <span>Departments:</span>
                    <span className="font-bold">{Object.keys(groupedCustomers).length}</span>
                </div>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <button 
              onClick={handlePrint}
              className="w-full py-4 bg-white text-[#0f172a] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition active:scale-95 shadow-lg flex items-center justify-center gap-2"
            >
              <span>🖨️</span> Print / PDF
            </button>
            <button 
              onClick={handleSaveImage}
              disabled={isSaving}
              className="w-full py-4 bg-[#6366f1] text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition active:scale-95 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? 'Processing...' : '💾 Save Image'}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-transparent border border-white/10 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-500/10 overflow-y-auto p-4 md:p-8 justify-center custom-scrollbar relative flex">
          
          <div className="flex flex-col items-center w-full min-h-0">
            <div 
              className="origin-top transition-transform duration-300"
              style={{ 
                transform: windowWidth < 768 ? 'scale(0.45)' : 'scale(1)',
                marginBottom: windowWidth < 768 ? '-50%' : '0'
              }}
            >
              <div 
                ref={catalogRef}
                className="bg-white text-slate-900 shadow-2xl relative print-container"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '10mm',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <div className="w-full h-full border-4 border-double border-slate-800 p-6 flex flex-col">
                    
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                      <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">{branch.name}</h1>
                      <div className="flex justify-center flex-wrap gap-x-6 gap-y-1 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          <span>{branch.address}</span>
                          <span>•</span>
                          <span>{branch.contact}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Suki Member Catalog</p>
                    </div>

                    <div className="flex-1 space-y-6">
                      {Object.entries(groupedCustomers).map(([department, items]) => (
                        <div key={department} className="break-inside-avoid page-break-inside-avoid">
                            <div className="flex items-center gap-4 mb-3">
                              <h3 className="text-sm font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded-md inline-block">
                                {department}
                              </h3>
                              <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3">
                              {(items as Customer[]).map((cust) => (
                                <div key={cust.id} className="border border-slate-300 rounded-lg p-2 flex flex-col items-center text-center bg-white shadow-sm break-inside-avoid page-break-inside-avoid">
                                    <div className="w-full aspect-square bg-slate-50 rounded border border-slate-100 mb-2 overflow-hidden flex items-center justify-center p-2">
                                      {qrCodes[cust.id] ? (
                                        <img src={qrCodes[cust.id]} alt={cust.name} className="w-full h-full object-contain" />
                                      ) : (
                                        <div className="w-full h-full bg-slate-200 animate-pulse rounded-md"></div>
                                      )}
                                    </div>
                                    <div className="flex-1 w-full flex flex-col justify-between">
                                        <h4 className="font-bold text-[9px] uppercase leading-tight line-clamp-2 mb-1 min-h-[22px] flex items-center justify-center w-full">
                                          {cust.name}
                                        </h4>
                                        <div className="mt-1">
                                            <p className="text-[10px] font-black text-slate-900 font-mono">{cust.barcode || cust.id.slice(0, 8).toUpperCase()}</p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">Suki ID</p>
                                        </div>
                                    </div>
                                </div>
                              ))}
                            </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end shrink-0">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Generated by Sari-Sari Debt Pro</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">For internal use only • {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container {
            position: absolute !important; left: 0 !important; top: 0 !important;
            width: 210mm !important; min-height: 297mm !important;
            margin: 0 !important; padding: 10mm !important;
            box-shadow: none !important; border: none !important;
            background-color: white !important;
            overflow: visible !important; transform: none !important;
          }
          .page-break-inside-avoid { break-inside: avoid; }
        }
      `}</style>
    </div>
  );
};

export default CustomerCatalogModal;
