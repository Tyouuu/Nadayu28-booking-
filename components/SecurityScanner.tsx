import React, { useState } from 'react';
import { Scan, CheckCircle, XCircle, Zap } from 'lucide-react';

export const SecurityScanner: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);

  const handleSimulateScan = () => {
    setScanning(true);
    setResult(null);
    // Simulate scan delay
    setTimeout(() => {
      setScanning(false);
      // Randomly succeed or fail for demo
      setResult(Math.random() > 0.3 ? 'success' : 'fail');
    }, 2000);
  };

  return (
    <div className="max-w-lg mx-auto text-center py-8 animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Access Control</h2>
        <p className="text-slate-500 mt-2">Scan visitor QR codes for entry verification.</p>
      </div>
      
      <div className="bg-slate-950 rounded-[3rem] p-8 shadow-2xl shadow-slate-900/40 aspect-[3/4] flex flex-col items-center justify-center relative overflow-hidden border-8 border-slate-900 ring-1 ring-slate-800">
        
        {/* Background Grid Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(30,41,59,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(30,41,59,0.5)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        
        {/* Corner Brackets */}
        <div className="absolute top-8 left-8 w-12 h-12 border-l-4 border-t-4 border-slate-700 rounded-tl-2xl"></div>
        <div className="absolute top-8 right-8 w-12 h-12 border-r-4 border-t-4 border-slate-700 rounded-tr-2xl"></div>
        <div className="absolute bottom-8 left-8 w-12 h-12 border-l-4 border-b-4 border-slate-700 rounded-bl-2xl"></div>
        <div className="absolute bottom-8 right-8 w-12 h-12 border-r-4 border-b-4 border-slate-700 rounded-br-2xl"></div>
        
        {!scanning && !result && (
          <div className="z-20 flex flex-col items-center relative animate-fade-in">
            <div className="w-32 h-32 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-8 ring-1 ring-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)]">
               <Scan className="text-indigo-400 w-16 h-16 animate-pulse" />
            </div>
            <p className="text-slate-400 font-medium tracking-wide text-lg">Align QR Code</p>
            <p className="text-slate-600 text-sm mt-1 mb-8">Ready to scan...</p>
            <button 
              onClick={handleSimulateScan}
              className="group relative bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/30 overflow-hidden"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
              <span className="flex items-center gap-2"><Zap size={18} /> Simulate Scan</span>
            </button>
          </div>
        )}

        {scanning && (
          <div className="z-20 text-center w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
             <div className="w-64 h-64 border-2 border-indigo-500/30 rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,1)] animate-[scan_1.5s_infinite_linear]"></div>
             </div>
             <p className="text-indigo-400 mt-8 font-mono text-sm tracking-[0.2em] animate-pulse font-bold">VERIFYING...</p>
          </div>
        )}

        {result === 'success' && (
           <div className="z-20 text-center w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-emerald-950/90 backdrop-blur-md animate-scale-in">
             <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(16,185,129,0.4)] animate-bounce">
                <CheckCircle className="text-white w-12 h-12" strokeWidth={3} />
             </div>
             <h3 className="text-white text-2xl font-bold tracking-wide">ACCESS GRANTED</h3>
             <div className="mt-6 bg-black/20 p-4 rounded-xl border border-white/10 w-64">
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">Vehicle</p>
                <p className="text-white font-mono text-xl mb-3">WNB 1234</p>
                <div className="h-px bg-white/10 w-full mb-3"></div>
                <p className="text-emerald-300 text-xs font-bold uppercase tracking-widest mb-1">Destination</p>
                <p className="text-white font-medium">Unit A-12-05</p>
             </div>
             <button onClick={() => setResult(null)} className="mt-8 text-white/70 hover:text-white font-medium text-sm transition-colors">Tap to scan next</button>
           </div>
        )}

        {result === 'fail' && (
           <div className="z-20 text-center w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md animate-scale-in">
             <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_60px_rgba(239,68,68,0.4)] animate-shake">
                <XCircle className="text-white w-12 h-12" strokeWidth={3} />
             </div>
             <h3 className="text-white text-2xl font-bold tracking-wide">ACCESS DENIED</h3>
             <p className="text-red-200 text-lg mt-2">Invalid or Expired Code</p>
             <button onClick={() => setResult(null)} className="mt-8 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-xl text-white font-bold text-sm transition-colors border border-white/10">Try Again</button>
           </div>
        )}
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};