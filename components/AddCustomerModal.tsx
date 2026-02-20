import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';

interface AddCustomerModalProps {
  onAdd: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  existingCustomers: Customer[];
  prefilledName?: string;
  prefilledBarcode?: string;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onAdd, onClose, existingCustomers, prefilledName, prefilledBarcode }) => {
  const [formData, setFormData] = useState({
    name: '', nickname: '', department: '', contact: '', address: '', creditLimit: 0, barcode: ''
  });
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (prefilledName) {
      setFormData(prev => ({ ...prev, name: prefilledName }));
    }
    if (prefilledBarcode) {
      const formatted = prefilledBarcode.toUpperCase().startsWith('CID:') ? prefilledBarcode : `CID:${prefilledBarcode}`;
      setFormData(prev => ({ ...prev, barcode: formatted.toUpperCase() }));
    }
  }, [prefilledName, prefilledBarcode]);

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
    if (existingCustomers.some(c => c.barcode === formatted)) {
      setError(`Suki ID "${formatted}" is already registered to another member.`);
    } else {
      setError('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // 1. Name Collision Check
    if (existingCustomers.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      setError('A Suki with this exact name already exists.'); 
      return;
    }

    // 2. ID Collision Algorithm (Final verification before save)
    const finalBarcode = formData.barcode.trim().toUpperCase();
    if (finalBarcode && existingCustomers.some(c => c.barcode === finalBarcode)) {
      setError(`The ID "${finalBarcode}" belongs to another customer.`);
      return;
    }

    onAdd({ ...formData, barcode: finalBarcode }); 
    onClose();
  };

  const handleBarcodeScan = (barcode: string): ScanResultStatus => {
    let formatted = barcode.toUpperCase();
    if (!formatted.startsWith('CID:')) formatted = `CID:${formatted}`;
    
    if (existingCustomers.some(c => c.barcode === formatted)) {
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
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[150] p-4 animate-in fade-in">
        <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 relative">
          
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Register Suki</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">NEW DATABASE ENTRY</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition-all text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-4 bg-rose-500/10 text-rose-500 rounded-2xl text-[10px] font-bold border border-rose-500/20 flex items-center gap-3 animate-in shake">
                <span className="text-lg">⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Member Name *</label>
                <input 
                  required 
                  autoFocus 
                  className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition text-xs text-white" 
                  placeholder="e.g. Aling Nena" 
                  value={formData.name} 
                  onChange={e => { setFormData({ ...formData, name: e.target.value }); if(error.includes('name')) setError(''); }} 
                />
              </div>
              
              <div>
                <div className="flex justify-between px-1 mb-2 items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suki ID Code</label>
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)} 
                    className="text-[9px] font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1 hover:text-white transition"
                  >
                    SCAN 📷
                  </button>
                </div>
                <div className="relative">
                  <input 
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none text-xs font-mono text-white placeholder:text-slate-600" 
                    placeholder="Enter ID (e.g. 2004)" 
                    value={formData.barcode} 
                    onBlur={handleBarcodeBlur}
                    onChange={e => {
                      setFormData({ ...formData, barcode: e.target.value });
                      if (error.includes('ID')) setError('');
                    }} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🆔</div>
                </div>
                <p className="text-[8px] text-slate-500 mt-2 px-1 uppercase font-bold tracking-wider">Format "CID:XXXX" will be applied automatically</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Contact</label>
                   <input 
                     className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50" 
                     placeholder="09..." 
                     value={formData.contact} 
                     onChange={e => setFormData({ ...formData, contact: e.target.value })} 
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Credit Limit</label>
                   <input 
                     type="number" 
                     className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50" 
                     placeholder="0.00" 
                     value={formData.creditLimit || ''} 
                     onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })} 
                   />
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={!!error}
              className="w-full py-4 bg-indigo-500 text-white rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-[0.98] mt-2 disabled:opacity-30 disabled:grayscale"
            >
              Confirm Membership
            </button>
          </form>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddCustomerModal;