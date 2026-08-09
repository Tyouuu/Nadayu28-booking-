'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, Camera, CameraOff, Shield, ScanLine, AlertTriangle } from 'lucide-react';
import { validateBookingById, fetchVisitorById, fetchVisitors, checkInVisitor, uploadVisitorIdPhoto, markVisitorDeparted, Visitor } from '../services/dataService';

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
  const [mode, setMode] = useState<'booking' | 'visitor'>('booking');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [scannedData, setScannedData] = useState<ScannedBooking | null>(null);
  const [scannedVisitor, setScannedVisitor] = useState<Visitor | null>(null);
  const [visitorFlagged, setVisitorFlagged] = useState(false);
  const [visitorCheckedIn, setVisitorCheckedIn] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [todaysArrivals, setTodaysArrivals] = useState<Visitor[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_ID = 'qr-reader';

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const loadArrivals = () => {
    fetchVisitors().then(list => {
      const todayStr = new Date().toISOString().split('T')[0];
      setTodaysArrivals(list.filter(v =>
        (v.status === 'arrived' || v.status === 'flagged') && v.actualArrival?.startsWith(todayStr)
      ));
    }).catch(() => {});
  };

  useEffect(() => { if (mode === 'visitor') loadArrivals(); }, [mode]);

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

      if (mode === 'visitor') {
        try {
          const payload = JSON.parse(decodedText) as { type?: string; id?: string };
          const visitor = payload.id ? await fetchVisitorById(payload.id) : null;
          if (!visitor) {
            setErrorMsg('Visitor record not found');
            setResult('fail');
            return;
          }
          setScannedVisitor(visitor);
          setVisitorCheckedIn(visitor.status === 'arrived' || visitor.status === 'flagged' || visitor.status === 'departed');
          setVisitorFlagged(visitor.status === 'flagged');
          setResult('success');
        } catch {
          setErrorMsg('Invalid QR code');
          setResult('fail');
        }
        return;
      }

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
    setScannedVisitor(null);
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
    setScannedVisitor(null);
    setVisitorFlagged(false);
    setVisitorCheckedIn(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrorMsg(null);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMarkArrived = async () => {
    if (!scannedVisitor) return;
    setIsUploadingPhoto(true);
    try {
      if (photoFile) await uploadVisitorIdPhoto(scannedVisitor.id, photoFile);
      const { flagged } = await checkInVisitor(scannedVisitor.id);
      setVisitorFlagged(flagged);
      setVisitorCheckedIn(true);
      loadArrivals();
    } catch {
      setErrorMsg('Failed to check in visitor. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleMarkDeparted = async (visitorId: string) => {
    try {
      await markVisitorDeparted(visitorId);
      loadArrivals();
    } catch {
      setErrorMsg('Failed to mark visitor departed. Please try again.');
    }
  };

  return (
    <div className="pb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] text-nadayu-muted uppercase tracking-widest font-semibold mb-1">Security</p>
          <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">Access Control</h1>
          <p className="text-nadayu-muted text-sm mt-1">Scan visitor QR codes for entry verification.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-nadayu-panel text-white px-4 py-2 rounded-full text-xs font-medium">
          <Shield size={12} className="text-nadayu-accent" />
          Scanner Active
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Mode toggle */}
        <div className="mb-4 flex bg-nadayu-cream rounded-xl p-1">
          <button onClick={() => { setMode('booking'); handleReset(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'booking' ? 'bg-nadayu-panel text-white' : 'text-gray-500'}`}>
            Booking QR
          </button>
          <button onClick={() => { setMode('visitor'); handleReset(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'visitor' ? 'bg-nadayu-panel text-white' : 'text-gray-500'}`}>
            Visitor QR
          </button>
        </div>

        {/* Scanner Card */}
        <div className="bg-nadayu-panel rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
          <div className="absolute top-5 left-5 w-10 h-10 border-l-[3px] border-t-[3px] border-nadayu-accent/30 rounded-tl-xl"></div>
          <div className="absolute top-5 right-5 w-10 h-10 border-r-[3px] border-t-[3px] border-nadayu-accent/30 rounded-tr-xl"></div>
          <div className="absolute bottom-5 left-5 w-10 h-10 border-l-[3px] border-b-[3px] border-nadayu-accent/30 rounded-bl-xl"></div>
          <div className="absolute bottom-5 right-5 w-10 h-10 border-r-[3px] border-b-[3px] border-nadayu-accent/30 rounded-br-xl"></div>

          <div id={SCANNER_ID}
            className={`w-full rounded-xl overflow-hidden ${scanning ? 'block' : 'hidden'}`}
            style={{ maxWidth: '280px' }} />

          {!scanning && !result && !cameraStarting && (
            <div className="z-20 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/[0.06] rounded-2xl flex items-center justify-center mb-6">
                <Camera className="w-12 h-12 text-gray-500" />
              </div>
              <p className="font-semibold text-white text-lg mb-1">Ready to Scan</p>
              <p className="text-sm text-gray-500 mb-6">Point camera at a {mode === 'visitor' ? 'visitor' : 'booking'} QR code</p>
              {errorMsg && (
                <p className="text-sm mb-4 px-4 py-2 rounded-xl bg-nadayu-danger/10 text-nadayu-danger">{errorMsg}</p>
              )}
              <button onClick={startScanner}
                className="bg-nadayu-accent text-white px-8 py-4 rounded-xl font-bold text-sm transition-all hover:brightness-95 active:scale-95 flex items-center gap-2">
                <Camera size={18} /> Open Camera
              </button>
            </div>
          )}

          {cameraStarting && (
            <div className="z-20 flex flex-col items-center">
              <div className="w-14 h-14 border-[3px] border-nadayu-accent border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-nadayu-muted font-medium animate-pulse">Starting camera...</p>
            </div>
          )}

          {scanning && (
            <div className="z-20 flex flex-col items-center w-full mt-4">
              <p className="text-sm text-nadayu-accent font-semibold mb-4 animate-pulse flex items-center gap-2">
                <ScanLine size={16} /> Scanning...
              </p>
              <button onClick={handleReset}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors px-4 py-2 rounded-xl bg-white/5">
                <CameraOff size={14} /> Cancel
              </button>
            </div>
          )}

          {/* Booking success state */}
          {result === 'success' && mode === 'booking' && scannedData && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className="w-20 h-20 bg-nadayu-success rounded-full flex items-center justify-center mb-5">
                <CheckCircle className="w-10 h-10 text-white" strokeWidth={3} />
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
                className="mt-5 text-sm font-semibold text-nadayu-accent hover:underline">
                Scan Next
              </button>
            </div>
          )}

          {/* Visitor success state */}
          {result === 'success' && mode === 'visitor' && scannedVisitor && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${visitorFlagged ? 'bg-nadayu-warning' : 'bg-nadayu-success'}`}>
                {visitorFlagged
                  ? <AlertTriangle className="w-10 h-10 text-white" strokeWidth={3} />
                  : <CheckCircle className="w-10 h-10 text-white" strokeWidth={3} />}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{visitorFlagged ? 'Arrival Time Mismatch' : 'Visitor Verified'}</h3>
              <p className="text-sm text-gray-500 mb-5">
                {visitorFlagged ? 'Arrival is more than 30 minutes off the expected time' : 'Expected visitor confirmed'}
              </p>
              <div className="bg-white/[0.06] rounded-xl p-5 w-full max-w-[280px] text-left space-y-3 mb-5">
                {[
                  { label: 'Name', value: scannedVisitor.visitorName },
                  { label: 'Host Unit', value: scannedVisitor.residentUnit },
                  { label: 'Purpose', value: scannedVisitor.purpose || '-' },
                  { label: 'Expected', value: new Date(scannedVisitor.expectedArrival).toLocaleString() },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold text-white text-right">{item.value}</span>
                  </div>
                ))}
              </div>
              {!visitorCheckedIn ? (
                <div className="w-full max-w-[280px] space-y-3">
                  <label className="block">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-nadayu-accent/50 transition-colors">
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                      {photoPreview ? (
                        <img src={photoPreview} alt="MyKad" className="h-20 mx-auto rounded-lg object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-nadayu-muted mx-auto mb-1" />
                          <p className="text-xs text-nadayu-muted">Capture MyKad photo (optional)</p>
                        </>
                      )}
                    </div>
                  </label>
                  <button onClick={handleMarkArrived} disabled={isUploadingPhoto}
                    className="w-full bg-nadayu-accent text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-95 transition-all disabled:opacity-50">
                    {isUploadingPhoto ? 'Checking in...' : 'Mark Arrived'}
                  </button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-nadayu-success">Visitor checked in</p>
              )}
              <button onClick={handleReset} className="mt-5 text-sm font-semibold text-nadayu-accent hover:underline">
                Scan Next
              </button>
            </div>
          )}

          {/* Fail state */}
          {result === 'fail' && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className="w-20 h-20 bg-nadayu-danger/15 border-2 border-nadayu-danger/30 rounded-full flex items-center justify-center mb-5">
                <XCircle className="w-10 h-10 text-nadayu-danger" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Access Denied</h3>
              <p className="text-sm text-nadayu-danger mb-6">{errorMsg || 'Invalid or expired code'}</p>
              <button onClick={handleReset}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/15 transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 bg-white border border-nadayu-border rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-nadayu-cream rounded-lg flex items-center justify-center">
              <Shield size={15} className="text-nadayu-muted" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">How it works</h3>
          </div>
          <div className="space-y-2">
            {['Choose Booking QR or Visitor QR mode above',
              'Scanner verifies the code against the database',
              'Green = valid entry, Orange = flagged, Red = denied access'].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-nadayu-panel text-nadayu-accent rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {mode === 'visitor' && (
          <div className="mt-4 bg-white border border-nadayu-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Arrivals</h3>
            {todaysArrivals.length === 0 ? (
              <p className="text-xs text-nadayu-muted">No visitors checked in yet today.</p>
            ) : (
              <div className="space-y-2">
                {todaysArrivals.map(v => (
                  <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{v.visitorName}</p>
                      <p className="text-xs text-nadayu-muted">Unit {v.residentUnit}{v.status === 'flagged' ? ' · Flagged' : ''}</p>
                    </div>
                    <button onClick={() => handleMarkDeparted(v.id)}
                      className="text-xs font-bold text-gray-500 hover:text-nadayu-panel px-3 py-1.5 rounded-lg bg-nadayu-cream hover:bg-nadayu-cream transition-colors">
                      Mark Departed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
