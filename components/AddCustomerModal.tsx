
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
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-[150] p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-white/10">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Register Suki</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Add to store network</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-400">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg text-[10px] font-bold border border-rose-100 dark:border-rose-900/30">⚠️ {error}</div>}
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Full Name *</label>
                <input required autoFocus className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:ring-4 focus:ring-primary/10 outline-none transition text-xs dark:text-white" placeholder="Juan Dela Cruz" value={formData.name} onChange={e => { setFormData({ ...formData, name: e.target.value }); setError(''); }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Nickname</label>
                  <input className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:ring-4 focus:ring-primary/10 outline-none text-xs dark:text-white" placeholder="e.g. Kuya" value={formData.nickname} onChange={e => setFormData({ ...formData, nickname: e.target.value })} />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Department</label>
                  <input className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:ring-4 focus:ring-primary/10 outline-none text-xs dark:text-white" placeholder="e.g. Sales" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} />
                </div>
              </div>
              <div>
                <div className="flex justify-between px-1 mb-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suki ID</label>
                  <button type="button" onClick={() => setShowScanner(true)} className="text-[9px] font-black text-primary uppercase hover:underline">Scan 📸</button>
                </div>
                <input className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold focus:ring-4 focus:ring-primary/10 outline-none text-xs font-mono dark:text-white" placeholder="ID code" value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs dark:text-white" placeholder="Contact No." value={formData.contact} onChange={e => setFormData({ ...formData, contact: e.target.value })} />
                <input type="number" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bold text-xs dark:text-white" placeholder="Credit Limit" value={formData.creditLimit || ''} onChange={e => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <button type="submit" className="w-full py-3.5 bg-primary text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/30 hover:bg-primary-dark transition-all active:scale-[0.98]">Complete Registration</button>
          </form>
        </div>
      </div>
      {showScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowScanner(false)} />}
    </>
  );
};

export default AddCustomerModal;
