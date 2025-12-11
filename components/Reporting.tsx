import React, { useState } from 'react';
import { Camera, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';

export const Reporting: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-white p-12 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 text-green-500 shadow-xl shadow-green-100 animate-bounce">
          <CheckCircle2 size={48} />
        </div>
        <h3 className="text-3xl font-bold text-slate-800 mb-3">Report Received</h3>
        <p className="text-slate-500 mb-10 leading-relaxed text-lg">
          Our maintenance team has been notified and will investigate the issue shortly.
          <br/>Reference ID: <span className="font-mono text-slate-900 font-bold bg-slate-100 px-2 py-1 rounded-md ml-2">#REP-{Math.floor(Math.random() * 10000)}</span>
        </p>
        <button 
          onClick={() => setSubmitted(false)}
          className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-slate-900/20"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in pb-12">
      <div className="mb-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 mb-6 shadow-lg shadow-amber-500/10 rotate-3 hover:rotate-6 transition-transform">
           <AlertTriangle size={32} />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">Report an Issue</h2>
        <p className="text-slate-500 text-lg">Help us maintain Nadayu28 by reporting defects or cleanliness issues.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
        <form className="p-8 md:p-12 space-y-8" onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Location</label>
              <div className="relative">
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer hover:bg-slate-100">
                  <option>Gymnasium</option>
                  <option>Visitor Parking B1</option>
                  <option>Pool Deck</option>
                  <option>Party Room</option>
                  <option>Lifts (Block A)</option>
                  <option>Other</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight size={20} className="rotate-90" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Urgency</label>
              <div className="relative">
                <select className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none font-bold text-slate-700 transition-all appearance-none cursor-pointer hover:bg-slate-100">
                  <option>Low (Cosmetic)</option>
                  <option>Medium (Functional Issue)</option>
                  <option>High (Safety Hazard)</option>
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronRight size={20} className="rotate-90" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Description</label>
            <textarea 
              rows={5} 
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none font-medium text-slate-700 transition-all placeholder:text-slate-400 resize-none"
              placeholder="Please describe the issue in detail..."
            ></textarea>
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Evidence</label>
            <div className="border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center hover:bg-slate-50 hover:border-amber-400 transition-all cursor-pointer relative group bg-slate-50/50">
              <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <div className="w-20 h-20 bg-white shadow-lg rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 text-amber-500">
                <Camera size={32} />
              </div>
              <p className="text-base font-bold text-slate-700">Tap to upload photo</p>
              <p className="text-xs text-slate-400 mt-2 font-medium">JPG, PNG up to 5MB</p>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit" 
              className="w-full bg-slate-900 hover:bg-amber-600 text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-amber-500/30 transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2"
            >
              Submit Report
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};