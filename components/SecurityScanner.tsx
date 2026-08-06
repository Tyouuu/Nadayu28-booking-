import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, Camera, CameraOff, Shield, ScanLine } from 'lucide-react';
import { validateBookingById } from '../services/dataService';

interface ScannedBooking {
  id: string;
  plate: string;
  slot: string;
  date: string;
  time: string;
  duration: number;
  unit: string;
  zone: string;
}

export const SecurityScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [scannedData, setScannedData] = useState<ScannedBooking | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_ID = 'qr-reader';

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
  };

  const validateBooking = async (payload: ScannedBooking): Promise<boolean> => {
    try {
      const res = await validateBookingById(payload.id);
      return res.valid;
    } catch {
      return false;
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    stopScanner().then(async () => {
      setScanning(false);
      try {
        const data: ScannedBooking = JSON.parse(decodedText);
        setScannedData(data);
        const valid = await validateBooking(data);
        setResult(valid ? 'success' : 'fail');
      } catch {
        setScannedData(null);
        setErrorMsg('Invalid QR code');
        setResult('fail');
      }
    });
  };

  const startScanner = async () => {
    setResult(null);
    setScannedData(null);
    setErrorMsg(null);
    setCameraStarting(true);
    await stopScanner();
    try {
      const html5Qr = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      );
      setScanning(true);
    } catch {
      setErrorMsg('Camera access denied. Please allow camera access and try again.');
    } finally {
      setCameraStarting(false);
    }
  };

  const handleReset = async () => {
    await stopScanner();
    setScanning(false);
    setResult(null);
    setScannedData(null);
    setErrorMsg(null);
  };

  return (
    <div className="pb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Security</p>
          <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">Access Control</h1>
          <p className="text-gray-400 text-sm mt-1">Scan visitor QR codes for entry verification.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-[#111111] text-white px-4 py-2 rounded-full text-xs font-medium">
          <Shield size={12} className="text-[#C8FF00]" />
          Scanner Active
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Scanner Card */}
        <div className="bg-[#111111] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
          {/* Corner markers */}
          <div className="absolute top-5 left-5 w-10 h-10 border-l-[3px] border-t-[3px] border-[#C8FF00]/30 rounded-tl-xl"></div>
          <div className="absolute top-5 right-5 w-10 h-10 border-r-[3px] border-t-[3px] border-[#C8FF00]/30 rounded-tr-xl"></div>
          <div className="absolute bottom-5 left-5 w-10 h-10 border-l-[3px] border-b-[3px] border-[#C8FF00]/30 rounded-bl-xl"></div>
          <div className="absolute bottom-5 right-5 w-10 h-10 border-r-[3px] border-b-[3px] border-[#C8FF00]/30 rounded-br-xl"></div>

          {/* Camera viewfinder */}
          <div id={SCANNER_ID}
            className={`w-full rounded-xl overflow-hidden ${scanning ? 'block' : 'hidden'}`}
            style={{ maxWidth: '280px' }} />

          {/* Ready state */}
          {!scanning && !result && !cameraStarting && (
            <div className="z-20 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/[0.06] rounded-2xl flex items-center justify-center mb-6">
                <Camera className="w-12 h-12 text-gray-500" />
              </div>
              <p className="font-semibold text-white text-lg mb-1">Ready to Scan</p>
              <p className="text-sm text-gray-500 mb-6">Point camera at a booking QR code</p>
              {errorMsg && (
                <p className="text-sm mb-4 px-4 py-2 rounded-xl bg-red-500/10 text-red-400">{errorMsg}</p>
              )}
              <button onClick={startScanner}
                className="bg-[#C8FF00] text-[#111111] px-8 py-4 rounded-xl font-bold text-sm transition-all hover:brightness-95 active:scale-95 flex items-center gap-2">
                <Camera size={18} /> Open Camera
              </button>
            </div>
          )}

          {/* Loading state */}
          {cameraStarting && (
            <div className="z-20 flex flex-col items-center">
              <div className="w-14 h-14 border-[3px] border-[#C8FF00] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-400 font-medium animate-pulse">Starting camera...</p>
            </div>
          )}

          {/* Scanning state */}
          {scanning && (
            <div className="z-20 flex flex-col items-center w-full mt-4">
              <p className="text-sm text-[#C8FF00] font-semibold mb-4 animate-pulse flex items-center gap-2">
                <ScanLine size={16} /> Scanning...
              </p>
              <button onClick={handleReset}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors px-4 py-2 rounded-xl bg-white/5">
                <CameraOff size={14} /> Cancel
              </button>
            </div>
          )}

          {/* Success state */}
          {result === 'success' && scannedData && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className="w-20 h-20 bg-[#C8FF00] rounded-full flex items-center justify-center mb-5">
                <CheckCircle className="w-10 h-10 text-[#111111]" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Access Granted</h3>
              <p className="text-sm text-gray-500 mb-5">Booking verified successfully</p>
              <div className="bg-white/[0.06] rounded-xl p-5 w-full max-w-[280px] text-left space-y-3">
                {[
                  { label: 'Vehicle', value: scannedData.plate },
                  { label: 'Spot', value: scannedData.slot },
                  { label: 'Unit', value: scannedData.unit },
                  { label: 'Date & Time', value: `${scannedData.date} ${scannedData.time}` },
                  { label: 'Duration', value: `${scannedData.duration}h` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleReset}
                className="mt-5 text-sm font-semibold text-[#C8FF00] hover:underline">
                Scan Next
              </button>
            </div>
          )}

          {/* Fail state */}
          {result === 'fail' && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className="w-20 h-20 bg-red-500/15 border-2 border-red-500/30 rounded-full flex items-center justify-center mb-5">
                <XCircle className="w-10 h-10 text-red-400" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Access Denied</h3>
              <p className="text-sm text-red-400 mb-6">{errorMsg || 'Invalid or expired code'}</p>
              <button onClick={handleReset}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/15 transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Info card below scanner */}
        <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <Shield size={15} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">How it works</h3>
          </div>
          <div className="space-y-2">
            {['Visitor shows QR code from their booking confirmation',
              'Scanner verifies the booking against the database',
              'Green = valid entry, Red = denied access'].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-[#111111] text-[#C8FF00] rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
