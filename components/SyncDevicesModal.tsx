
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import BarcodeScanner, { ScanResultStatus } from './BarcodeScanner';
import { BackupData, InventoryItem, Customer, UtangRecord, AppSettings, BranchConfig } from '../types';

// Declare PeerJS global
declare const Peer: any;

interface SyncDevicesModalProps {
  onClose: () => void;
  onRestore: (data: Partial<BackupData['data']>, mode: 'merge' | 'replace') => void;
  currentData: {
    inventory: InventoryItem[];
    customers: Customer[];
    records: UtangRecord[];
    settings: AppSettings;
    branch: BranchConfig;
  };
}

const SyncDevicesModal: React.FC<SyncDevicesModalProps> = ({ onClose, onRestore, currentData }) => {
  const [mode, setMode] = useState<'select' | 'host' | 'join'>('select');
  const [status, setStatus] = useState<string>('Initializing...');
  const [peerId, setPeerId] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [showScanner, setShowScanner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const peerRef = useRef<any>(null);
  const connRef = useRef<any>(null);

  // --- HOST LOGIC (SENDER) ---
  const startHost = async () => {
    setMode('host');
    setStatus('Generating Secure ID...');
    
    try {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', async (id: string) => {
        setPeerId(id);
        setStatus('Ready to Link');
        const url = await QRCode.toDataURL(id, { margin: 1, width: 256, color: { dark: '#000000', light: '#ffffff' } });
        setQrCodeUrl(url);
      });

      peer.on('connection', (conn: any) => {
        connRef.current = conn;
        setStatus('Device Connected! Preparing data...');
        
        conn.on('open', () => {
          setStatus('Sending Data...');
          // Send Data
          const payload: BackupData = {
            metadata: {
              version: "3.4.0",
              date: new Date().toISOString(),
              type: "sync_transfer",
              encrypted: false
            },
            data: currentData
          };
          
          conn.send(payload);
          setStatus('Data Sent Successfully!');
          setProgress(100);
        });
      });

      peer.on('error', (err: any) => {
        setError("Connection Error: " + err.type);
      });
    } catch (err) {
      setError("Failed to initialize P2P network.");
    }
  };

  // --- CLIENT LOGIC (RECEIVER) ---
  const startJoin = () => {
    setMode('join');
    setShowScanner(true);
  };

  const connectToPeer = (hostId: string) => {
    setStatus('Connecting to Host...');
    setShowScanner(false);

    try {
      const peer = new Peer();
      peerRef.current = peer;

      peer.on('open', () => {
        const conn = peer.connect(hostId);
        connRef.current = conn;

        conn.on('open', () => {
          setStatus('Connected! Waiting for data...');
        });

        conn.on('data', (data: any) => {
          setStatus('Data Received. Processing...');
          if (data && data.data) {
             // Small delay to show UI status
             setTimeout(() => {
                onRestore(data.data, 'merge');
                setStatus('Sync Complete! Merging data...');
                setProgress(100);
             }, 500);
          } else {
             setError('Invalid data received.');
          }
        });
      });

      peer.on('error', (err: any) => {
        setError("Connection failed. Check internet.");
      });

    } catch (err) {
      setError("Failed to start receiver.");
    }
  };

  const handleScan = (code: string) => {
    if (code) {
      connectToPeer(code);
      return ScanResultStatus.SUCCESS;
    }
    return ScanResultStatus.NOT_FOUND;
  };

  // Cleanup
  useEffect(() => {
    return () => {
      if (peerRef.current) peerRef.current.destroy();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center z-[500] p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-[#0f172a]">
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Device Sync</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Peer-to-Peer Transfer</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition">✕</button>
        </div>

        <div className="p-8 flex-1 overflow-y-auto">
          
          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl text-xs font-bold border border-rose-200 dark:border-rose-800">
              ⚠️ {error}
            </div>
          )}

          {mode === 'select' && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                 <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold leading-relaxed text-center">
                    Both devices must be online. Data is transferred securely directly between devices.
                 </p>
              </div>

              <button 
                onClick={startHost}
                className="w-full p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 border-2 border-indigo-100 dark:border-indigo-500/20 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group text-left"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📤</div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">Send Data</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">This Device is Source</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pl-16">Generate a QR code to transfer inventory, customers, and records to another device.</p>
              </button>

              <button 
                onClick={startJoin}
                className="w-full p-6 rounded-[2rem] bg-emerald-50 dark:bg-emerald-900/10 border-2 border-emerald-100 dark:border-emerald-500/20 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group text-left"
              >
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📥</div>
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white">Receive Data</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">This Device is Destination</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 pl-16">Scan a QR code from the source device to merge data onto this device.</p>
              </button>
            </div>
          )}

          {mode === 'host' && (
            <div className="flex flex-col items-center text-center space-y-6 animate-in slide-in-from-right-4">
               <div className="relative">
                 <div className="w-64 h-64 bg-white rounded-3xl p-4 shadow-xl flex items-center justify-center">
                    {qrCodeUrl ? <img src={qrCodeUrl} className="w-full h-full" /> : <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                 </div>
                 {progress === 100 && (
                   <div className="absolute inset-0 bg-white/90 rounded-3xl flex items-center justify-center">
                      <div className="w-20 h-20 bg-emerald-500 rounded-full text-white flex items-center justify-center text-4xl shadow-lg animate-bounce">✓</div>
                   </div>
                 )}
               </div>
               
               <div>
                 <h4 className="text-lg font-black dark:text-white mb-1">{status}</h4>
                 <p className="text-xs text-slate-400">Scan this code with the other device.</p>
               </div>
               
               <button onClick={() => setMode('select')} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black uppercase text-slate-500 hover:text-rose-500">Cancel</button>
            </div>
          )}

          {mode === 'join' && !showScanner && (
             <div className="flex flex-col items-center text-center space-y-8 animate-in slide-in-from-right-4 py-10">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-xl ${progress === 100 ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                   {progress === 100 ? '✓' : '🔄'}
                </div>
                <div>
                   <h4 className="text-xl font-black dark:text-white mb-2">{status}</h4>
                   <p className="text-xs text-slate-400 max-w-xs mx-auto">Please wait while the secure connection is established and data is transferred.</p>
                </div>
                {progress === 100 && (
                   <button onClick={onClose} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Done</button>
                )}
             </div>
          )}
        </div>
      </div>
      
      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => { setShowScanner(false); setMode('select'); }} 
        />
      )}
    </div>
  );
};

export default SyncDevicesModal;
    