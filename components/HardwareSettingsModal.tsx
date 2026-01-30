
import React, { useState, useEffect } from 'react';
import { PrinterService } from '../services/printerService';

interface HardwareSettingsModalProps {
  onClose: () => void;
}

const HardwareSettingsModal: React.FC<HardwareSettingsModalProps> = ({ onClose }) => {
  const [printerStatus, setPrinterStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [connectionType, setConnectionType] = useState<'bluetooth' | 'usb' | 'none'>('none');
  const [isScanning, setIsScanning] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [driverError, setDriverError] = useState(false);
  
  const isSecure = window.isSecureContext;

  const checkStatus = () => {
    const connected = PrinterService.isConnected();
    setPrinterStatus(connected ? 'connected' : 'disconnected');
    setConnectionType(PrinterService.getConnectionType());
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async (type: 'bluetooth' | 'usb') => {
    setIsScanning(true);
    setDriverError(false);
    setStatusMsg(`Searching for ${type === 'bluetooth' ? 'Bluetooth' : 'USB'} devices...`);
    
    try {
      const success = type === 'bluetooth' 
        ? await PrinterService.connectBluetooth()
        : await PrinterService.connectUsb();
      
      if (success) {
        setStatusMsg("Device connected successfully!");
        setTimeout(() => setStatusMsg(''), 2000);
      } else {
        setStatusMsg("Connection cancelled or failed.");
      }
    } catch (e: any) {
      if (e.message === "DRIVER_LOCKED") {
        setDriverError(true);
        setStatusMsg("");
      } else {
        setStatusMsg("Error: " + (e.message || e));
      }
    } finally {
      setIsScanning(false);
      checkStatus();
    }
  };

  const handleDisconnect = async () => {
    if (connectionType === 'bluetooth') await PrinterService.disconnectBluetooth();
    if (connectionType === 'usb') await PrinterService.disconnectUsb();
    checkStatus();
    setStatusMsg("Device disconnected.");
  };

  const handleTestPrint = async () => {
    try {
      await PrinterService.printTestPage();
      setStatusMsg("Test page sent to printer.");
    } catch (e: any) {
      setStatusMsg("Print failed: " + (e.message || e));
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-[#0f172a] w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0f172a]">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight">Hardware Setup</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Peripherals</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white hover:bg-rose-500 transition">✕</button>
        </div>

        <div className="p-8 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
          
          {/* Secure Context Warning */}
          {!isSecure && (
             <div className="bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <div>
                   <p className="text-xs font-black text-amber-400 uppercase">Insecure Connection</p>
                   <p className="text-[10px] text-slate-400 mt-1">
                      Browser security blocks Bluetooth/USB on HTTP. Please use <b>HTTPS</b> or <b>localhost</b>.
                   </p>
                </div>
             </div>
          )}

          {/* Printer Section */}
          <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/5 shadow-sm">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${printerStatus === 'connected' ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-800 text-slate-500'}`}>
                     🖨️
                   </div>
                   <div>
                      <h4 className="font-black text-sm text-white uppercase tracking-wide">Thermal Printer</h4>
                      <p className={`text-[10px] font-bold uppercase mt-1 ${printerStatus === 'connected' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {printerStatus === 'connected' ? `Connected (${connectionType})` : 'Not Connected'}
                      </p>
                   </div>
                </div>
                {printerStatus === 'connected' && (
                  <button onClick={handleDisconnect} className="px-3 py-1.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition">
                    Disconnect
                  </button>
                )}
             </div>

             {printerStatus === 'disconnected' ? (
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleConnect('bluetooth')}
                    disabled={isScanning || !PrinterService.isBluetoothSupported}
                    className="p-4 rounded-2xl bg-[#0f172a] border border-white/5 hover:border-[#6366f1]/50 transition-all text-left group disabled:opacity-50"
                  >
                    <span className="text-xl mb-1 block">🔵</span>
                    <span className="text-[10px] font-black uppercase text-indigo-400 group-hover:text-white">Bluetooth</span>
                    {!PrinterService.isBluetoothSupported && <span className="block text-[8px] text-slate-500 mt-1">Not Supported</span>}
                  </button>

                  <button 
                    onClick={() => handleConnect('usb')}
                    disabled={isScanning || !PrinterService.isUsbSupported}
                    className="p-4 rounded-2xl bg-[#0f172a] border border-white/5 hover:border-amber-500/50 transition-all text-left group disabled:opacity-50"
                  >
                    <span className="text-xl mb-1 block">🔌</span>
                    <span className="text-[10px] font-black uppercase text-amber-400 group-hover:text-white">USB Cable</span>
                    {!PrinterService.isUsbSupported && <span className="block text-[8px] text-slate-500 mt-1">Not Supported</span>}
                  </button>
               </div>
             ) : (
               <button 
                 onClick={handleTestPrint}
                 className="w-full py-4 bg-[#0f172a] text-white border border-white/10 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition hover:bg-slate-800"
               >
                 Print Test Page
               </button>
             )}
             
             {driverError && (
                <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl animate-in slide-in-from-top-2">
                   <div className="flex items-start gap-3">
                      <span className="text-2xl">🛑</span>
                      <div>
                         <h5 className="text-xs font-black text-rose-400 uppercase mb-1">Driver Conflict Detected</h5>
                         <p className="text-[10px] text-slate-400 leading-relaxed mb-2">
                            Windows has locked this USB device. Replace the driver with <b>WinUSB</b> using Zadig.
                         </p>
                      </div>
                   </div>
                </div>
             )}

             {statusMsg && (
               <div className="mt-4 p-3 bg-slate-800 rounded-xl text-center border border-white/5">
                 <p className="text-[10px] font-bold text-slate-300 animate-pulse uppercase tracking-wide">{statusMsg}</p>
               </div>
             )}
          </div>

          {/* Scanner Info */}
          <div className="bg-[#1e293b] rounded-3xl p-6 border border-white/5 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-xl flex items-center justify-center text-lg">
                  🔫
                </div>
                <div>
                   <h4 className="font-black text-sm text-white uppercase tracking-wide">Barcode Scanner</h4>
                   <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Input Configuration</p>
                </div>
             </div>
             
             <div className="p-4 bg-[#0f172a] rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-start gap-2">
                   <span className="text-emerald-500 font-bold text-xs">✓</span>
                   <div>
                     <p className="text-xs font-bold text-white">Camera Scanner</p>
                     <p className="text-[10px] text-slate-500">Integrated automatically. Use the 📷 button in app.</p>
                   </div>
                </div>
                <div className="flex items-start gap-2">
                   <span className="text-emerald-500 font-bold text-xs">✓</span>
                   <div>
                     <p className="text-xs font-bold text-white">Physical Scanner (USB/BT)</p>
                     <p className="text-[10px] text-slate-500">Plug & Play. Works like a keyboard.</p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default HardwareSettingsModal;
