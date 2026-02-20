
import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { toPng } from 'html-to-image';
import { Customer, BranchConfig } from '../types';

interface CustomerQRModalProps {
  customer: Customer;
  branch: BranchConfig;
  onClose: () => void;
}

const CustomerQRModal: React.FC<CustomerQRModalProps> = ({ customer, branch, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateQR = async () => {
      try {
        // Encoding the internal ID for secure and accurate identification
        const url = await QRCode.toDataURL(`CID:${customer.id}`, {
          margin: 1,
          width: 256,
          color: {
            dark: '#1e293b',
            light: '#ffffff',
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error(err);
      }
    };
    generateQR();
  }, [customer]);

  const handleDownload = async () => {
    if (!cardRef.current || isSaving) return;
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: 'transparent'
      });
      const link = document.createElement('a');
      link.download = `Suki_ID_${customer.name.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[250] p-4 animate-in fade-in">
      <div className="w-full max-w-sm flex flex-col gap-8 items-center">
        
        <div className="text-center mb-2">
           <h3 className="text-white text-xl font-black">Digital Suki ID Ready</h3>
           <p className="text-slate-400 text-xs font-medium mt-1">Barcode identification generated successfully!</p>
        </div>

        {/* Professional ID Card */}
        <div 
          ref={cardRef}
          className="relative aspect-[1.586/1] w-full bg-[#1e293b] rounded-[28px] shadow-2xl overflow-hidden p-6 text-white border border-white/10"
        >
          {/* Holographic Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] -ml-24 -mb-24"></div>
          
          <div className="relative h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-primary mb-1">{branch.name}</h4>
                <p className="text-[7px] opacity-40 font-bold uppercase tracking-widest">Official Store Network</p>
              </div>
              <div className="flex flex-col items-end">
                 <div className="w-10 h-10 bg-white/5 backdrop-blur-md rounded-xl flex items-center justify-center text-xl border border-white/10">🏪</div>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="flex-1 mr-4 min-w-0">
                <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">Loyalty Member</p>
                <h3 className="text-lg md:text-xl font-black truncate leading-tight uppercase tracking-tight">{customer.name}</h3>
                <div className="flex items-center gap-3 mt-2">
                   {customer.department && (
                     <p className="text-[9px] font-bold text-primary/80 uppercase tracking-widest">🏢 {customer.department}</p>
                   )}
                </div>
                
                <div className="mt-4 flex gap-4 text-[7px] font-black uppercase tracking-tighter">
                   <div>
                     <p className="opacity-30">Member Since</p>
                     <p>{new Date(customer.createdAt).toLocaleDateString()}</p>
                   </div>
                   <div>
                     <p className="opacity-30">Account ID</p>
                     <p className="text-slate-400">{customer.id.slice(0, 8).toUpperCase()}</p>
                   </div>
                </div>
              </div>
              
              <div className="w-24 h-24 bg-white p-1.5 rounded-2xl shadow-2xl border-2 border-primary/20">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR ID" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full bg-slate-800 animate-pulse rounded-xl"></div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Helper Instructions */}
        <div className="w-full p-4 bg-white/5 rounded-2xl border border-white/10 text-center">
           <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
             <span className="text-primary font-black">TIP:</span> Save this image and send it to your suki. <br/>
             Scan this code at terminal for <span className="text-white font-bold">Instant Checkout</span>.
           </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button 
            onClick={handleDownload}
            disabled={isSaving}
            className="w-full py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {isSaving ? 'Saving Card...' : '💾 Save ID to Gallery'}
          </button>
          <button 
            onClick={onClose}
            className="w-full py-4 bg-white/10 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/20 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerQRModal;
