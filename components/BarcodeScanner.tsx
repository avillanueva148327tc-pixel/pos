
import React, { useEffect, useRef, useState } from 'react';

// Declare global Html5Qrcode provided by the library in index.html
declare const Html5Qrcode: any;

export enum ScanResultStatus {
  SUCCESS = 'SUCCESS',
  NOT_FOUND = 'NOT_FOUND',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  IDLE = 'IDLE'
}

interface BarcodeScannerProps {
  onScan: (decodedText: string) => ScanResultStatus;
  onClose: () => void;
  isContinuous?: boolean;
  lastScannedItem?: string;
  successVibrationPattern?: number | number[];
  enableSound?: boolean;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  onClose, 
  isContinuous = false,
  lastScannedItem: initialLastItem,
  successVibrationPattern = 50,
  enableSound = true
}) => {
  const scannerRef = useRef<any>(null);
  const isInitializing = useRef(false);
  const isStopping = useRef(false);
  const isMounted = useRef(true);
  const isProcessing = useRef(false); // Throttle scanning
  
  const [hasError, setHasError] = useState<string | null>(null);
  const [isSystemDenied, setIsSystemDenied] = useState(false);
  const [scanStatus, setScanStatus] = useState<ScanResultStatus>(ScanResultStatus.IDLE);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [cameras, setCameras] = useState<any[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [showFlash, setShowFlash] = useState(false);
  
  // Local state for sound toggle, initialized from prop
  const [isSoundOn, setIsSoundOn] = useState(enableSound);

  const readerId = "reader";

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  const getCameras = async () => {
    try {
      if (!Html5Qrcode) return [];
      const devices = await Html5Qrcode.getCameras();
      if (isMounted.current && devices && devices.length > 0) {
        setCameras(devices);
        return devices;
      }
    } catch (e) {
      console.warn("Could not list cameras", e);
    }
    return [];
  };

  const playSound = (type: 'success' | 'error' | 'warning') => {
    if (!isSoundOn) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'success') {
        // High pitch pleasant beep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'error') {
        // Low pitch buzz (Sawtooth)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'warning') {
        // Descending tone
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.linearRampToValueAtTime(200, now + 0.3);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn("Audio play failed", e);
    }
  };

  const cleanupScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Cleanup warning:", e);
      }
      scannerRef.current = null;
    }
  };

  const startScanner = async (cameraId?: string) => {
    if (isInitializing.current || isStopping.current) return;
    isInitializing.current = true;
    
    // 1. Check for Secure Context (HTTPS or localhost)
    if (window.isSecureContext === false) {
       setHasError("Camera access requires a secure connection (HTTPS). You are connected via HTTP.");
       setIsSystemDenied(true);
       isInitializing.current = false;
       return;
    }

    if (isMounted.current) {
      setHasError(null);
      setIsSystemDenied(false);
    }

    try {
      await cleanupScanner();

      // 2. Pre-check permissions using standard API to catch denial early
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
         throw new Error("Camera API is not supported in this browser.");
      }

      // Try to get a stream briefly to trigger permission prompt or catch denial
      // This gives us a cleaner error than the library sometimes does
      try {
         const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
         // Immediately stop the stream so the library can take over
         stream.getTracks().forEach(track => track.stop());
      } catch (permErr: any) {
         // Re-throw to be caught by the outer catch block with correct name
         throw permErr;
      }

      // Ensure DOM element exists and is clear
      const element = document.getElementById(readerId);
      if (!element) throw new Error("Scanner element not found");
      element.innerHTML = "";

      const html5QrCode = new Html5Qrcode(readerId);
      scannerRef.current = html5QrCode;

      const config = { 
        fps: 10,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const size = Math.floor(minEdge * 0.75);
          return { width: size, height: size * 0.5 };
        },
        aspectRatio: 1.0 
      };

      const deviceId = cameraId || { facingMode: "environment" };

      await html5QrCode.start(
        deviceId, 
        config, 
        (decodedText: string) => {
          if (!isMounted.current || isProcessing.current) return;

          // Lock scanning processing
          isProcessing.current = true;

          const result = onScan(decodedText);
          
          if (result === ScanResultStatus.IDLE) {
             // If IDLE, caller handled it (e.g. showed a modal), but we should wait a bit before scanning again
             // OR if caller unmounted us (setScannerMode(null)), we will be cleaned up.
             setTimeout(() => { isProcessing.current = false; }, 1000);
             return;
          }

          setScanStatus(result);

          if (result === ScanResultStatus.SUCCESS) {
            if ('vibrate' in navigator) navigator.vibrate(successVibrationPattern);
            playSound('success');
            setStatusMessage("Added!");
            setShowFlash(true);
            setTimeout(() => { if(isMounted.current) setShowFlash(false); }, 150);
          } else if (result === ScanResultStatus.NOT_FOUND) {
            if ('vibrate' in navigator) navigator.vibrate([30, 50, 30]);
            playSound('error');
            setStatusMessage("Unknown Item");
          } else if (result === ScanResultStatus.OUT_OF_STOCK) {
            if ('vibrate' in navigator) navigator.vibrate(300);
            playSound('warning');
            setStatusMessage("Stock Empty!");
          }

          // Delay to show feedback and prevent duplicate scans
          const delay = result === ScanResultStatus.SUCCESS ? 1200 : 800;

          setTimeout(() => {
            if (isMounted.current) {
              setScanStatus(ScanResultStatus.IDLE);
              setStatusMessage('');
              isProcessing.current = false; // Unlock
            }
          }, delay);
          
          if (!isContinuous && result === ScanResultStatus.SUCCESS) {
            stopScanner();
          }
        },
        () => {} 
      );

      if (isMounted.current) {
        getCameras();
        try {
          const capabilities = html5QrCode.getRunningTrackCapabilities();
          setHasTorch(!!capabilities.torch);
        } catch(e) {}
      }

    } catch (err: any) {
      console.error("Scanner error detail:", err);
      if (!isMounted.current) return;

      const errStr = (typeof err === 'string') ? err : (err.message || err.toString());
      const lowerErr = errStr.toLowerCase();
      
      if (
        (err.name === 'NotAllowedError') ||
        lowerErr.includes('notallowederror') || 
        lowerErr.includes('permission denied') ||
        lowerErr.includes('not allowed') ||
        lowerErr.includes('getting usermedia')
      ) {
        setIsSystemDenied(true);
        setHasError("Camera access was denied. Please check your Device Privacy Settings and allow camera access.");
      } else if (lowerErr.includes('notfounderror') || lowerErr.includes('no device')) {
        setHasError("No camera device found.");
      } else if (lowerErr.includes('is being used')) {
        setHasError("Camera is currently in use by another app.");
      } else {
        setHasError("Scanner error: " + errStr);
      }
    } finally {
      isInitializing.current = false;
    }
  };

  const toggleTorch = async () => {
    if (!scannerRef.current || !hasTorch) return;
    try {
      const newState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }]
      });
      setIsTorchOn(newState);
    } catch (e) {
      console.error("Error toggling torch", e);
    }
  };

  const switchCamera = () => {
    if (cameras.length < 2) return;
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);
    startScanner(cameras[nextIndex].id);
  };

  const stopScanner = async () => {
    if (isStopping.current) return;
    isStopping.current = true;
    await cleanupScanner();
    isStopping.current = false;
    if (isMounted.current) onClose();
  };

  useEffect(() => {
    startScanner();
    return () => {
      cleanupScanner();
    };
  }, []);

  const getOverlayColor = () => {
    if (hasError) return 'bg-slate-900/95 border-slate-700/50';
    switch (scanStatus) {
      case ScanResultStatus.SUCCESS: return 'bg-emerald-500/10 border-emerald-500/40';
      case ScanResultStatus.NOT_FOUND: return 'bg-rose-500/10 border-rose-500/40';
      case ScanResultStatus.OUT_OF_STOCK: return 'bg-amber-500/10 border-amber-500/40';
      default: return 'bg-black/20 border-white/10';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[250] p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-[40px] overflow-hidden shadow-2xl animate-in relative flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10">
          <div>
            <h3 className="text-xl font-black">Scanner</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
              {isContinuous ? "Terminal Mode" : "Product Entry"}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsSoundOn(!isSoundOn)} 
              className={`w-10 h-10 rounded-full flex items-center justify-center transition shadow-sm ${isSoundOn ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}
              title={isSoundOn ? "Mute Sounds" : "Enable Sounds"}
            >
              {isSoundOn ? '🔊' : '🔇'}
            </button>
            <button onClick={stopScanner} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 transition shadow-sm">
              ✕
            </button>
          </div>
        </div>
        
        <div className="relative overflow-hidden bg-black aspect-square flex-shrink-0">
          <div id={readerId} className="w-full h-full scale-105"></div>
          
          <div className={`absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none z-30 ${showFlash ? 'opacity-80' : 'opacity-0'}`}></div>
          
          <div className={`absolute inset-0 pointer-events-none border-[40px] transition-all duration-300 z-20 ${getOverlayColor()}`}>
            <div className="w-full h-full flex items-center justify-center relative">
              
              {statusMessage && (
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-10 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl z-50 animate-in zoom-in duration-300 border-4 flex flex-col items-center gap-4 ${
                  scanStatus === ScanResultStatus.SUCCESS ? 'bg-emerald-600 border-emerald-400 text-white' :
                  scanStatus === ScanResultStatus.NOT_FOUND ? 'bg-rose-600 border-rose-400 text-white' : 
                  'bg-amber-600 border-amber-400 text-white'
                }`}>
                  <span className="text-4xl">
                    {scanStatus === ScanResultStatus.SUCCESS ? '✅' :
                     scanStatus === ScanResultStatus.NOT_FOUND ? '❓' : '⚠️'}
                  </span>
                  <span className="whitespace-nowrap">{statusMessage}</span>
                </div>
              )}

              {hasError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900/98 backdrop-blur-md z-40">
                  <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center text-3xl mb-4 shrink-0 mx-auto">🚫</div>
                  <h4 className="text-white font-black text-lg mb-2">Access Denied</h4>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed mb-6 uppercase tracking-wider">{hasError}</p>
                  
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-left mb-6 w-full">
                     <p className="text-[10px] font-black text-primary uppercase mb-2">How to resolve:</p>
                     <p className="text-[10px] text-slate-300 font-bold leading-tight">
                       Go to <b>Settings</b> > <b>Privacy</b> > <b>Camera</b> on your device. Ensure the browser is allowed to access the camera, then refresh this page.
                     </p>
                  </div>

                  <button onClick={() => window.location.reload()} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/30 mb-2">Refresh App</button>
                  <button onClick={stopScanner} className="w-full py-4 bg-white/5 text-slate-500 rounded-2xl font-black text-xs uppercase">Close</button>
                </div>
              )}

              {!hasError && !statusMessage && (
                <>
                  <div className="absolute w-64 h-32 border-2 rounded-3xl border-white/20">
                    <div className="absolute left-2 right-2 h-[2px] bg-primary rounded-full shadow-[0_0_15px_rgba(99,102,241,1)] animate-[scanLine_2s_ease-in-out_infinite]"></div>
                  </div>
                  
                  <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 pointer-events-auto">
                    {hasTorch && (
                      <button 
                        onClick={toggleTorch}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isTorchOn ? 'bg-amber-400 text-white shadow-xl scale-110' : 'bg-black/60 backdrop-blur-md text-white/70'}`}
                      >
                        {isTorchOn ? '🔦' : '🕯️'}
                      </button>
                    )}
                    {cameras.length > 1 && (
                      <button 
                        onClick={switchCamera}
                        className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-md text-white/70 flex items-center justify-center"
                      >
                        🔄
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex-1">
             Terminal Scanning Ready
          </p>
        </div>
      </div>

      <style>{`
        @keyframes scanLine {
          0% { top: 15%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
