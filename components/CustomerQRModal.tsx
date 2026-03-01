import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Customer } from '../types';

interface CustomerQRModalProps {
  customer: Customer;
  onClose: () => void;
}

const CustomerQRModal: React.FC<CustomerQRModalProps> = ({ customer, onClose }) => {
  const qrValue = customer.barcode || `CID:${customer.id}`;

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-[200] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0f172a] w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col items-center p-8 text-center">
        <div className="w-full flex justify-between items-center mb-6">
          <div className="text-left">
            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Suki Digital ID</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Scan for Quick Checkout</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white">✕</button>
        </div>

        <div className="bg-white p-6 rounded-[2rem] shadow-inner mb-6 border border-slate-100">
          <QRCodeSVG 
            value={qrValue} 
            size={200}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="space-y-2 mb-8">
          <h4 className="text-2xl font-black text-indigo-500 uppercase tracking-tighter">{customer.name}</h4>
          {customer.nickname && <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">"{customer.nickname}"</p>}
          <p className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-full inline-block mt-2">{qrValue}</p>
        </div>

        <button 
          onClick={() => window.print()} 
          className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          🖨️ Print QR Label
        </button>
        
        <p className="text-[9px] font-bold text-slate-400 uppercase mt-4 opacity-50">Sari-Sari Pro • Secure Digital Identity</p>
      </div>
    </div>
  );
};

export default CustomerQRModal;
