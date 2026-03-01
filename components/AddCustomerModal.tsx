import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';

interface AddCustomerModalProps {
  onAdd: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onUpdate?: (id: string, customer: Partial<Customer>) => void;
  onClose: () => void;
  existingCustomers: Customer[];
  prefilledName?: string;
  prefilledBarcode?: string;
  editingCustomer?: Customer;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ 
  onAdd, onUpdate, onClose, existingCustomers, prefilledName, prefilledBarcode, editingCustomer 
}) => {
  const [formData, setFormData] = useState({
    name: '', nickname: '', department: '', contact: '', address: '', creditLimit: 0, barcode: '', notes: '', trustLevel: 'bronze' as 'bronze' | 'silver' | 'gold'
  });
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (editingCustomer) {
      setFormData({
        name: editingCustomer.name,
        nickname: editingCustomer.nickname || '',
        department: editingCustomer.department || '',
        contact: editingCustomer.contact || '',
        address: editingCustomer.address || '',
        creditLimit: editingCustomer.creditLimit || 0,
        barcode: editingCustomer.barcode || '',
        notes: editingCustomer.notes || '',
        trustLevel: editingCustomer.trustLevel || 'bronze'
      });
    } else {
      if (prefilledName) {
        setFormData(prev => ({ ...prev, name: prefilledName }));
      }
      if (prefilledBarcode) {
        const formatted = prefilledBarcode.toUpperCase().startsWith('CID:') ? prefilledBarcode : `CID:${prefilledBarcode}`;
        setFormData(prev => ({ ...prev, barcode: formatted.toUpperCase() }));
      }
    }
  }, [prefilledName, prefilledBarcode, editingCustomer]);

  /**
   * Automatic ID Formatting Logic
   * Ensures every ID follows the 'CID:' protocol.
   */
  const handleBarcodeBlur = () => {
    const val = formData.barcode.trim();
    if (!val) return;
    
    let formatted = val.toUpperCase();
    if (!formatted.startsWith('CID:')) {
      formatted = `CID:${formatted}`;
    }
    
    setFormData(prev => ({ ...prev, barcode: formatted }));
    
    // Immediate Collision Check on Blur
    if (existingCustomers.some(c => c.barcode === formatted && c.id !== editingCustomer?.id)) {
      setError(`Suki ID "${formatted}" is already registered to another member.`);
    } else {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // 1. Name Collision Check
    if (existingCustomers.some(c => c.name.toLowerCase() === formData.name.toLowerCase() && c.id !== editingCustomer?.id)) {
      setError('A Suki with this exact name already exists.'); 
      return;
    }

    // 2. ID Collision Algorithm (Final verification before save)
    const finalBarcode = formData.barcode.trim().toUpperCase();
    if (finalBarcode && existingCustomers.some(c => c.barcode === finalBarcode && c.id !== editingCustomer?.id)) {
      setError(`The ID "${finalBarcode}" belongs to another customer.`);
      return;
    }

    if (editingCustomer && onUpdate) {
      onUpdate(editingCustomer.id, { ...formData, barcode: finalBarcode });
    } else {
      onAdd({ ...formData, barcode: finalBarcode }); 
    }
    onClose();
  };

  const handleBarcodeScan = (barcode: string): ScanResultStatus => {
    let formatted = barcode.toUpperCase();
    if (!formatted.startsWith('CID:')) formatted = `CID:${formatted}`;
    
    if (existingCustomers.some(c => c.barcode === formatted && c.id !== editingCustomer?.id)) {
      setError('The scanned ID is already assigned to a Suki.');
      setShowScanner(false);
      return ScanResultStatus.NOT_FOUND;
    }

    setFormData(prev => ({ ...prev, barcode: formatted }));
    setError('');
    setShowScanner(false); 
    return ScanResultStatus.SUCCESS;
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center z-[150] p-4 animate-in fade-in duration-500">
        <div className="bg-[#0f172a] w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 relative group">
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-[100px] group-hover:bg-indigo-500/20 transition-colors duration-1000"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full -ml-20 -mb-20 blur-[80px]"></div>

          <div className="p-10 border-b border-white/5 flex justify-between items-start bg-[#0f172a]/50 backdrop-blur-md relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full ${editingCustomer ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Registry System v2.4</p>
              </div>
              <h3 className="text-4xl font-black text-white tracking-tighter leading-none">
                {editingCustomer ? 'Update Suki' : 'Register Suki'}
              </h3>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.25em] mt-3 flex items-center gap-2">
                <span className="opacity-50">●</span>
                {editingCustomer ? 'MODIFY DATABASE ENTRY' : 'NEW DATABASE ENTRY'}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300 border border-white/5 hover:border-rose-500/50 group/close"
            >
              <span className="text-xl group-hover/close:rotate-90 transition-transform duration-300">✕</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-10 space-y-8 relative z-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {error && (
              <div className="p-5 bg-rose-500/10 text-rose-500 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-rose-500/20 flex items-center gap-4 animate-in shake duration-500">
                <div className="w-8 h-8 bg-rose-500 rounded-xl flex items-center justify-center text-white text-xs shadow-lg shadow-rose-500/20">⚠️</div>
                <p className="flex-1">{error}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Identity */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Identity Profile</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Full Member Name *</label>
                      <input 
                        required 
                        autoFocus 
                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-xs text-white placeholder:text-slate-600" 
                        placeholder="e.g. Aling Nena" 
                        value={formData.name} 
                        onChange={e => { setFormData({ ...formData, name: e.target.value }); if(error.includes('name')) setError(''); }} 
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Nickname / Alias</label>
                      <input 
                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none transition-all text-xs text-white placeholder:text-slate-600" 
                        placeholder="e.g. Nena" 
                        value={formData.nickname} 
                        onChange={e => setFormData({ ...formData, nickname: e.target.value })} 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between px-1 items-center">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Suki ID Protocol</label>
                    <button 
                      type="button" 
                      onClick={() => setShowScanner(true)} 
                      className="px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                    >
                      Initialize Scan 📷
                    </button>
                  </div>
                  <div className="relative group/id">
                    <input 
                      className="w-full pl-5 pr-12 py-4 rounded-2xl bg-white/5 border border-white/10 font-mono font-bold focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 outline-none text-xs text-white placeholder:text-slate-600 transition-all" 
                      placeholder="Enter ID (e.g. 2004)" 
                      value={formData.barcode} 
                      onBlur={handleBarcodeBlur}
                      onChange={e => {
                        setFormData({ ...formData, barcode: e.target.value });
                        if (error.includes('ID')) setError('');
                      }} 
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 text-sm group-focus-within/id:text-indigo-500 transition-colors">🆔</div>
                  </div>
                  <p className="text-[8px] text-slate-600 px-1 uppercase font-bold tracking-widest">Protocol "CID:XXXX" applied on blur</p>
                </div>
              </div>

              {/* Right Column: Logistics & Trust */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1">Logistics & Trust</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                       <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Contact Protocol</label>
                       <input 
                         className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" 
                         placeholder="09..." 
                         value={formData.contact} 
                         onChange={e => setFormData({ ...formData, contact: e.target.value })} 
                       />
                    </div>
                    <div>
                       <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Trust Classification</label>
                       <div className="relative">
                         <select 
                           className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 appearance-none transition-all cursor-pointer"
                           value={formData.trustLevel}
                           onChange={e => setFormData({ ...formData, trustLevel: e.target.value as any })}
                         >
                           <option value="bronze" className="bg-[#0f172a]">🥉 Bronze Classification</option>
                           <option value="silver" className="bg-[#0f172a]">🥈 Silver Classification</option>
                           <option value="gold" className="bg-[#0f172a]">🥇 Gold Classification</option>
                         </select>
                         <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                     <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Credit Threshold (₱)</label>
                     <input 
                       type="number" 
                       className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" 
                       placeholder="0.00" 
                       value={formData.creditLimit || ''} 
                       onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })} 
                     />
                  </div>
                  <div>
                     <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Geographic Address</label>
                     <input 
                       className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:text-slate-600" 
                       placeholder="Street/Brgy" 
                       value={formData.address} 
                       onChange={e => setFormData({ ...formData, address: e.target.value })} 
                     />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Internal Ledger Remarks</label>
              <textarea 
                className="w-full px-6 py-5 rounded-[2rem] bg-white/5 border border-white/10 font-bold text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all min-h-[100px] resize-none placeholder:text-slate-600" 
                placeholder="Special instructions or payment behavior notes..." 
                value={formData.notes} 
                onChange={e => setFormData({ ...formData, notes: e.target.value })} 
              />
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={!!error}
                className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] shadow-2xl shadow-indigo-500/40 hover:bg-indigo-500 hover:scale-[1.02] transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3 group/btn"
              >
                <span className="group-hover/btn:translate-x-1 transition-transform">
                  {editingCustomer ? 'COMMIT REGISTRY UPDATES' : 'INITIALIZE MEMBER RECORD'}
                </span>
                <span className="text-lg">→</span>
              </button>
            </div>
          </form>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddCustomerModal;