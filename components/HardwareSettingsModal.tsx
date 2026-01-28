
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

  const checkStatus = () => {
    const connected = PrinterService.isConnected();
    setPrinterStatus(connected ? 'connected' : 'disconnected');
    setConnectionType(PrinterService.getConnectionType());
  };

  useEffect(() => {
    checkStatus();
    // Poll status every 2 seconds to catch unexpected disconnections
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async (type: 'bluetooth' | 'usb') => {
    setIsScanning(true);
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
      setStatusMsg("Error: " + (e.message || e));
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
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Hardware Setup</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage Peripherals</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition">✕</button>
        </div>

        <div className="p-8 space-y-8 bg-slate-50/50 dark:bg-[#0f172a]/50">
          
          {/* Printer Section */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${printerStatus === 'connected' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                     🖨️
                   </div>
                   <div>
                      <h4 className="font-black text-sm dark:text-white uppercase tracking-wide">Thermal Printer</h4>
                      <p className={`text-[10px] font-bold uppercase mt-1 ${printerStatus === 'connected' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {printerStatus === 'connected' ? `Connected (${connectionType})` : 'Not Connected'}
                      </p>
                   </div>
                </div>
                {printerStatus === 'connected' && (
                  <button onClick={handleDisconnect} className="px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-lg text-[9px] font-black uppercase hover:bg-rose-100 transition">
                    Disconnect
                  </button>
                )}
             </div>

             {printerStatus === 'disconnected' ? (
               <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleConnect('bluetooth')}
                    disabled={isScanning || !PrinterService.isBluetoothSupported}
                    className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-500 transition-all text-left group disabled:opacity-50"
                  >
                    <span className="text-xl mb-1 block">🔵</span>
                    <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 group-hover:text-indigo-700">Bluetooth</span>
                    {!PrinterService.isBluetoothSupported && <span className="block text-[8px] text-slate-400 mt-1">Not Supported</span>}
                  </button>

                  <button 
                    onClick={() => handleConnect('usb')}
                    disabled={isScanning || !PrinterService.isUsbSupported}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border-2 border-amber-100 dark:border-amber-500/20 hover:border-amber-500 transition-all text-left group disabled:opacity-50"
                  >
                    <span className="text-xl mb-1 block">🔌</span>
                    <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 group-hover:text-amber-700">USB Cable</span>
                    {!PrinterService.isUsbSupported && <span className="block text-[8px] text-slate-400 mt-1">Not Supported</span>}
                  </button>
               </div>
             ) : (
               <button 
                 onClick={handleTestPrint}
                 className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition"
               >
                 Print Test Page
               </button>
             )}
             
             {statusMsg && (
               <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-center">
                 <p className="text-[10px] font-bold text-slate-500 dark:text-slate-300 animate-pulse">{statusMsg}</p>
               </div>
             )}
          </div>

          {/* Scanner Info */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-white/5 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-xl flex items-center justify-center text-lg">
                  🔫
                </div>
                <div>
                   <h4 className="font-black text-sm dark:text-white uppercase tracking-wide">Barcode Scanner</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Input Configuration</p>
                </div>
             </div>
             
             <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 space-y-3">
                <div className="flex items-start gap-2">
                   <span className="text-emerald-500 font-bold text-xs">✓</span>
                   <div>
                     <p className="text-xs font-bold dark:text-white">Camera Scanner</p>
                     <p className="text-[10px] text-slate-400">Integrated automatically. Use the 📷 button in app.</p>
                   </div>
                </div>
                <div className="flex items-start gap-2">
                   <span className="text-emerald-500 font-bold text-xs">✓</span>
                   <div>
                     <p className="text-xs font-bold dark:text-white">Physical Scanner (USB/BT)</p>
                     <p className="text-[10px] text-slate-400">Plug & Play. Ensure the search box is focused when scanning.</p>
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
