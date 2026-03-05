import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, Camera, CameraOff } from 'lucide-react';
import { bookingsApi } from '../services/api';

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
      const res = await bookingsApi.validate(payload.id);
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
    <div className="max-w-lg mx-auto text-center py-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold" style={{color: '#F5F5F7'}}>Access Control</h2>
        <p className="mt-2" style={{color: '#B0B0B8'}}>Scan visitor QR codes for entry verification.</p>
      </div>

      <div className="rounded-[3rem] p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden border-8 ring-1 min-h-[520px]"
        style={{backgroundColor: '#1A1A2E', borderColor: '#2D2B55', boxShadow: '0 25px 50px rgba(26, 26, 46, 0.4)'}}>

        <div className="absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 rounded-tl-2xl" style={{borderColor: '#4A4860'}}></div>
        <div className="absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 rounded-tr-2xl" style={{borderColor: '#4A4860'}}></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 rounded-bl-2xl" style={{borderColor: '#4A4860'}}></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 rounded-br-2xl" style={{borderColor: '#4A4860'}}></div>

        {/* Camera viewfinder - always mounted so html5-qrcode can attach */}
        <div id={SCANNER_ID}
          className={`w-full rounded-2xl overflow-hidden ${scanning ? 'block' : 'hidden'}`}
          style={{maxWidth: '300px'}} />

        {!scanning && !result && !cameraStarting && (
          <div className="z-20 flex flex-col items-center relative">
            <div className="w-32 h-32 rounded-3xl flex items-center justify-center mb-8"
              style={{backgroundColor: 'rgba(230, 179, 37, 0.1)', border: '1px solid rgba(230, 179, 37, 0.3)', boxShadow: '0 0 50px rgba(230,179,37,0.2)'}}>
              <Camera className="w-16 h-16 animate-pulse" style={{color: '#E6B325'}} />
            </div>
            <p className="font-medium tracking-wide text-lg mb-2" style={{color: '#B0B0B8'}}>Ready to Scan</p>
            <p className="text-sm mb-8" style={{color: '#4A4860'}}>Point camera at a booking QR code</p>
            {errorMsg && (
              <p className="text-sm mb-4 px-4 py-2 rounded-xl" style={{color: '#F5D547', backgroundColor: 'rgba(245,213,71,0.1)'}}>{errorMsg}</p>
            )}
            <button onClick={startScanner}
              className="text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2"
              style={{backgroundImage: 'linear-gradient(to right, #E6B325, #D4A017)', boxShadow: '0 0 30px rgba(230,179,37,0.3)'}}>
              <Camera size={18} /> Open Camera
            </button>
          </div>
        )}

        {cameraStarting && (
          <div className="z-20 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#E6B325] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-mono text-sm tracking-[0.2em] animate-pulse font-bold" style={{color: '#E6B325'}}>STARTING CAMERA...</p>
          </div>
        )}

        {scanning && (
          <div className="z-20 flex flex-col items-center w-full mt-4">
            <p className="font-mono text-sm tracking-[0.2em] animate-pulse font-bold mb-4" style={{color: '#E6B325'}}>SCANNING...</p>
            <button onClick={handleReset}
              className="flex items-center gap-2 font-medium text-sm px-4 py-2 rounded-xl"
              style={{color: '#B0B0B8', backgroundColor: 'rgba(74,72,96,0.3)'}}>
              <CameraOff size={16} /> Cancel
            </button>
          </div>
        )}

        {result === 'success' && scannedData && (
          <div className="z-20 text-center w-full flex flex-col items-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{backgroundColor: '#E6B325', boxShadow: '0 0 60px rgba(230,179,37,0.4)'}}>
              <CheckCircle className="w-12 h-12" strokeWidth={3} style={{color: '#2D2B55'}} />
            </div>
            <h3 className="text-2xl font-bold tracking-wide mb-6" style={{color: '#F5F5F7'}}>ACCESS GRANTED</h3>
            <div className="p-5 rounded-xl w-72 text-left space-y-3"
              style={{backgroundColor: 'rgba(45,43,85,0.8)', border: '1px solid rgba(74,72,96,0.5)'}}>
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase" style={{color: '#E6B325'}}>Vehicle</span>
                <span className="font-mono font-bold" style={{color: '#F5F5F7'}}>{scannedData.plate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase" style={{color: '#E6B325'}}>Spot</span>
                <span className="font-bold" style={{color: '#F5F5F7'}}>{scannedData.slot}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase" style={{color: '#E6B325'}}>Unit</span>
                <span className="font-bold" style={{color: '#F5F5F7'}}>{scannedData.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase" style={{color: '#E6B325'}}>Date & Time</span>
                <span className="font-bold" style={{color: '#F5F5F7'}}>{scannedData.date} {scannedData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs font-bold uppercase" style={{color: '#E6B325'}}>Duration</span>
                <span className="font-bold" style={{color: '#F5F5F7'}}>{scannedData.duration}h</span>
              </div>
            </div>
            <button onClick={handleReset}
              className="mt-6 font-medium text-sm rounded-xl px-4 py-2" style={{color: '#B0B0B8'}}>
              Scan Next
            </button>
          </div>
        )}

        {result === 'fail' && (
          <div className="z-20 text-center w-full flex flex-col items-center">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{backgroundColor: 'rgba(230,179,37,0.15)', border: '2px solid #E6B325'}}>
              <XCircle className="w-12 h-12" strokeWidth={3} style={{color: '#E6B325'}} />
            </div>
            <h3 className="text-2xl font-bold tracking-wide" style={{color: '#F5F5F7'}}>ACCESS DENIED</h3>
            <p className="text-lg mt-2 mb-6" style={{color: '#E6B325'}}>{errorMsg || 'Invalid or Expired Code'}</p>
            <button onClick={handleReset}
              className="px-6 py-3 rounded-xl font-bold text-sm border"
              style={{backgroundColor: 'rgba(74,72,96,0.3)', borderColor: 'rgba(74,72,96,0.5)', color: '#F5F5F7'}}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};