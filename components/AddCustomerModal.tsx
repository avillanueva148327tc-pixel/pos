
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';

interface AddCustomerModalProps {
  onAdd: (customer: Omit<Customer, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  existingCustomers: Customer[];
  prefilledName?: string;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ onAdd, onClose, existingCustomers, prefilledName }) => {
  const [formData, setFormData] = useState({
    name: '', nickname: '', department: '', contact: '', address: '', creditLimit: 0, barcode: ''
  });
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  useEffect(() => {
    if (prefilledName) {
      setFormData(prev => ({ ...prev, name: prefilledName }));
    }
  }, [prefilledName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    if (existingCustomers.some(c => c.name.toLowerCase() === formData.name.toLowerCase())) {
      setError('Customer name already exists.'); return;
    }
    onAdd(formData); onClose();
  };

  const handleBarcodeScan = (barcode: string): ScanResultStatus => {
    setFormData(prev => ({ ...prev, barcode }));
    setShowScanner(false); return ScanResultStatus.SUCCESS;
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[150] p-4 animate-in fade-in">
        <div className="bg-[#0f172a] w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 relative">
          
          <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
            <div>
              <h3 className="text-2xl font-black text-white tracking-tight">Register Suki</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">ADD TO STORE NETWORK</p>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 hover:text-white transition-all text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl text-[10px] font-bold border border-rose-500/20 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Full Name *</label>
                <input 
                  required 
                  autoFocus 
                  className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold focus:ring-2 focus:ring-[#6366f1]/50 outline-none transition text-xs text-white placeholder:text-slate-600" 
                  placeholder="Juan Dela Cruz" 
                  value={formData.name} 
                  onChange={e => { setFormData({ ...formData, name: e.target.value }); setError(''); }} 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nickname</label>
                  <input 
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold focus:ring-2 focus:ring-[#6366f1]/50 outline-none text-xs text-white placeholder:text-slate-600" 
                    placeholder="e.g. Kuya" 
                    value={formData.nickname} 
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Department</label>
                  <input 
                    className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold focus:ring-2 focus:ring-[#6366f1]/50 outline-none text-xs text-white placeholder:text-slate-600" 
                    placeholder="e.g. Sales" 
                    value={formData.department} 
                    onChange={e => setFormData({ ...formData, department: e.target.value })} 
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between px-1 mb-2 items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Suki ID</label>
                  <button 
                    type="button" 
                    onClick={() => setShowScanner(true)} 
                    className="text-[9px] font-black text-[#6366f1] uppercase tracking-wider flex items-center gap-1 hover:text-white transition"
                  >
                    SCAN 📷
                  </button>
                </div>
                <div className="relative">
                  <input 
                    className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold focus:ring-2 focus:ring-[#6366f1]/50 outline-none text-xs font-mono text-white placeholder:text-slate-600" 
                    placeholder="ID code" 
                    value={formData.barcode} 
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })} 
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🆔</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Contact No.</label>
                   <input 
                     className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold text-xs text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-[#6366f1]/50" 
                     placeholder="0912..." 
                     value={formData.contact} 
                     onChange={e => setFormData({ ...formData, contact: e.target.value })} 
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Credit Limit</label>
                   <input 
                     type="number" 
                     className="w-full px-4 py-3.5 rounded-xl bg-[#1e293b] border border-slate-700 font-bold text-xs text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-[#6366f1]/50" 
                     placeholder="0.00" 
                     value={formData.creditLimit || ''} 
                     onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })} 
                   />
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 bg-[#6366f1] text-white rounded-xl font-black uppercase text-[11px] tracking-[0.1em] shadow-xl shadow-indigo-500/20 hover:bg-[#4f46e5] transition-all active:scale-[0.98] mt-2"
            >
              Complete Registration
            </button>
          </form>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddCustomerModal;
