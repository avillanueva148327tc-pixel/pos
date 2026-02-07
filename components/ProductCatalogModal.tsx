
import React, { useRef, useState, useMemo, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { InventoryItem, BranchConfig } from '../types';

interface ProductCatalogModalProps {
  inventory: InventoryItem[];
  branch: BranchConfig;
  onClose: () => void;
}

const ProductCatalogModal: React.FC<ProductCatalogModalProps> = ({ inventory, branch, onClose }) => {
  const catalogRef = useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'actions'>('preview');
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Group inventory by category
  const groupedInventory = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    const sorted = [...inventory].sort((a, b) => a.name.localeCompare(b.name));
    
    sorted.forEach(item => {
      const cat = item.category || 'Uncategorized';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });

    // Sort categories alphabetically
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, InventoryItem[]>);
  }, [inventory]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveImage = async () => {
    if (!catalogRef.current || isSaving) return;
    setIsSaving(true);
    try {
      // Small delay to ensure rendering
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const dataUrl = await toPng(catalogRef.current, {
        cacheBust: true,
        pixelRatio: 2, // High quality
        backgroundColor: '#ffffff',
        width: 794, // Force A4 width in px at 96dpi (210mm)
        height: catalogRef.current.scrollHeight, // Capture full height
        style: {
            height: 'auto', 
            minHeight: '1123px', // Minimum A4 height
            transform: 'none',
            margin: '0',
            boxShadow: 'none'
        }
      });

      const link = document.createElement('a');
      link.download = `${branch.name.replace(/\s+/g, '_')}_Catalog.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to save catalog image', err);
      alert('Could not save image. Try printing to PDF instead.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[500] p-0 md:p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full h-full md:h-[90vh] md:max-w-7xl md:rounded-[2.5rem] shadow-2xl overflow-hidden border-0 md:border border-white/10 flex flex-col md:flex-row relative">
        
        {/* Mobile Header */}
        <div className="md:hidden absolute top-0 left-0 right-0 p-4 bg-[#0f172a]/90 backdrop-blur-md z-50 flex justify-between items-center border-b border-white/5">
           <h3 className="text-white font-black uppercase tracking-widest text-xs">Catalog Maker</h3>
           <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center">✕</button>
        </div>

        {/* Sidebar Controls (Hidden on mobile if tab is 'preview') */}
        <div className={`w-full md:w-80 bg-[#1e293b] p-8 border-r border-white/5 flex-col shrink-0 pt-20 md:pt-8 ${activeTab === 'preview' ? 'hidden md:flex' : 'flex'}`}>
          <div className="mb-8 hidden md:block">
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Catalog Maker</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">A4 Format Tool</p>
          </div>

          <div className="space-y-4 flex-1">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
              <p className="text-[10px] text-indigo-300 font-medium leading-relaxed">
                This tool groups your inventory by category and formats it into a professional A4 layout. Use the actions below to export.
              </p>
            </div>
            
            <div className="p-4 bg-[#0f172a] rounded-2xl border border-white/5">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Details</p>
                <div className="flex justify-between text-xs text-white mb-1">
                    <span>Total Items:</span>
                    <span className="font-bold">{inventory.length}</span>
                </div>
                <div className="flex justify-between text-xs text-white mb-1">
                    <span>Categories:</span>
                    <span className="font-bold">{Object.keys(groupedInventory).length}</span>
                </div>
                <div className="flex justify-between text-xs text-white">
                    <span>Paper Size:</span>
                    <span className="font-bold">A4 (210mm)</span>
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
              {isSaving ? (
                 <span className="animate-pulse">Processing...</span>
              ) : (
                 <><span>💾</span> Save Image</>
              )}
            </button>
            <button 
              onClick={onClose}
              className="w-full py-4 bg-transparent border border-white/10 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition hidden md:block"
            >
              Close
            </button>
          </div>
        </div>

        {/* Preview Area (Hidden on mobile if tab is 'actions') */}
        <div className={`flex-1 bg-slate-500/10 overflow-y-auto p-4 md:p-8 justify-center custom-scrollbar relative pt-20 md:pt-8 ${activeTab === 'actions' ? 'hidden md:flex' : 'flex'}`}>
          
          {/* A4 Container with Scaling */}
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
                  width: '210mm', // A4 Width
                  minHeight: '297mm', // A4 Height
                  padding: '10mm',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                {/* Border Frame (Visual Flair) */}
                <div className="w-full h-full border-4 border-double border-slate-800 p-6 flex flex-col">
                    
                    {/* Header */}
                    <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                      <h1 className="text-3xl font-black uppercase tracking-tighter mb-1">{branch.name}</h1>
                      <div className="flex justify-center flex-wrap gap-x-6 gap-y-1 text-xs font-bold text-slate-600 uppercase tracking-widest">
                          <span>{branch.address}</span>
                          <span>•</span>
                          <span>{branch.contact}</span>
                      </div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-3">Product Catalog</p>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-6">
                      {Object.entries(groupedInventory).map(([category, items]) => (
                        <div key={category} className="break-inside-avoid page-break-inside-avoid">
                            <div className="flex items-center gap-4 mb-3">
                              <h3 className="text-sm font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1 rounded-md inline-block">
                                {category}
                              </h3>
                              <div className="h-px bg-slate-200 flex-1"></div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-3">
                              {(items as InventoryItem[]).map((item) => (
                                <div key={item.id} className="border border-slate-300 rounded-lg p-2 flex flex-col items-center text-center bg-white shadow-sm break-inside-avoid page-break-inside-avoid">
                                    <div className="w-full aspect-square bg-slate-50 rounded border border-slate-100 mb-2 overflow-hidden flex items-center justify-center relative">
                                      {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <span className="text-2xl opacity-10 grayscale">📦</span>
                                      )}
                                      {item.stock <= 0 && (
                                          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                                            <span className="text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.5 rounded uppercase">Out of Stock</span>
                                          </div>
                                      )}
                                    </div>
                                    <div className="flex-1 w-full flex flex-col justify-between">
                                        <h4 className="font-bold text-[9px] uppercase leading-tight line-clamp-2 mb-1 min-h-[22px] flex items-center justify-center w-full">
                                          {item.name}
                                        </h4>
                                        <div className="mt-1">
                                            <p className="text-xs font-black text-slate-900">₱{item.price.toFixed(2)}</p>
                                            <p className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 tracking-wide">{item.unit}</p>
                                        </div>
                                    </div>
                                </div>
                              ))}
                            </div>
                        </div>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end shrink-0">
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Generated by Sari-Sari Debt Pro</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase">Prices subject to change • {new Date().toLocaleDateString()}</p>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-[#0f172a]/90 backdrop-blur-md p-1.5 rounded-full border border-white/10 shadow-2xl z-[60]">
            <button 
              onClick={() => setActiveTab('preview')}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Preview
            </button>
            <button 
              onClick={() => setActiveTab('actions')}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'actions' ? 'bg-primary text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Actions
            </button>
        </div>

      </div>

      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body * { visibility: hidden; }
          .print-container, .print-container * { visibility: visible; }
          .print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-shadow: none !important;
            border: none !important;
            background-color: white !important;
            overflow: visible !important;
            transform: none !important;
          }
          .page-break-inside-avoid {
            break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductCatalogModal;
