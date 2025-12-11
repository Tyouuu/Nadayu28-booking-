import React, { useState } from 'react';
import { QrCode, Calendar, Clock, Car, ChevronLeft, Download, Share2, MapPin, Moon, Sun, Info } from 'lucide-react';
import { Booking, FacilityType } from '../types';

// Mock Data for Slots
const ZONES = ['Zone A', 'Zone B', 'Zone C'];
const SLOTS_DATA: Record<string, { id: string; status: 'available' | 'occupied' | 'selected' }[]> = {
  'Zone A': [
    { id: 'A01', status: 'occupied' }, { id: 'A02', status: 'available' }, { id: 'A03', status: 'available' },
    { id: 'A04', status: 'occupied' }, { id: 'A05', status: 'available' }, { id: 'A06', status: 'available' },
    { id: 'A07', status: 'available' }, { id: 'A08', status: 'occupied' }, { id: 'A09', status: 'available' },
  ],
  'Zone B': [
    { id: 'B01', status: 'available' }, { id: 'B02', status: 'available' }, { id: 'B03', status: 'occupied' },
    { id: 'B04', status: 'available' }, { id: 'B05', status: 'available' }, { id: 'B06', status: 'occupied' },
  ],
  'Zone C': [
    { id: 'C01', status: 'occupied' }, { id: 'C02', status: 'occupied' }, { id: 'C03', status: 'available' },
    { id: 'C04', status: 'available' }, { id: 'C05', status: 'occupied' }, { id: 'C06', status: 'available' },
  ],
};

export const ParkingBooking: React.FC = () => {
  const [step, setStep] = useState(1);
  const [activeZone, setActiveZone] = useState('Zone A');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('4');
  const [plateNumber, setPlateNumber] = useState('');
  const [isOvernight, setIsOvernight] = useState(false);
  
  const [generatedBooking, setGeneratedBooking] = useState<Booking | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      const newBooking: Booking = {
        id: Math.random().toString(36).substr(2, 9),
        facilityType: FacilityType.PARKING,
        date: date,
        startTime: startTime,
        durationHours: isOvernight ? 12 : parseInt(duration),
        status: 'active',
        residentUnit: 'A-12-05',
        details: `${plateNumber.toUpperCase()} • ${selectedSlot}`,
        qrCode: 'mock-qr-code-string',
        isOvernight: isOvernight
      };
      setGeneratedBooking(newBooking);
      setStep(2);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-8 flex items-end justify-between px-2">
        <div>
           <h2 className="text-4xl font-bold text-slate-900 tracking-tight">Parkzone</h2>
           <p className="text-slate-500 mt-2 text-lg">Select a zone and spot for your visitor.</p>
        </div>
        <div className="hidden md:flex items-center gap-6 bg-white px-6 py-3 rounded-full shadow-sm border border-slate-200">
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white border-2 border-slate-300"></div>
              <span className="text-sm font-medium text-slate-500">Available</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-900"></div>
              <span className="text-sm font-medium text-slate-500">Occupied</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <span className="text-sm font-medium text-slate-500">Selected</span>
           </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* LEFT: VISUAL MAP (The "Vektora" Style) */}
          <div className="flex-1 bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden min-h-[500px]">
            {/* Zone Tabs */}
            <div className="flex justify-center mb-10 relative z-10">
               <div className="bg-slate-100/80 p-1.5 rounded-full inline-flex relative">
                  {ZONES.map(zone => (
                    <button
                      key={zone}
                      onClick={() => { setActiveZone(zone); setSelectedSlot(null); }}
                      className={`px-6 md:px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 relative z-10 ${
                        activeZone === zone 
                          ? 'bg-white text-slate-900 shadow-lg shadow-slate-200' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
               </div>
            </div>

            {/* Parking Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 md:gap-6 relative z-10">
              {SLOTS_DATA[activeZone].map((slot) => {
                const isOccupied = slot.status === 'occupied';
                const isSelected = selectedSlot === slot.id;

                return (
                  <button
                    key={slot.id}
                    disabled={isOccupied}
                    onClick={() => setSelectedSlot(slot.id)}
                    className={`
                      aspect-[3/5] rounded-2xl relative transition-all duration-300 group
                      ${isOccupied ? 'cursor-not-allowed opacity-80' : 'cursor-pointer hover:-translate-y-2'}
                      ${isSelected ? 'scale-105 z-10' : ''}
                    `}
                  >
                    {/* Slot Container */}
                    <div className={`
                      w-full h-full rounded-2xl border-2 flex flex-col items-center justify-center relative overflow-hidden shadow-sm transition-all duration-300
                      ${isSelected ? 'bg-amber-50 border-amber-400 ring-4 ring-amber-400/20' : 'bg-slate-50 border-slate-200'}
                    `}>
                        {isOccupied ? (
                          // Top-down Car Graphic
                          <div className="w-3/4 h-5/6 bg-slate-800 rounded-xl relative shadow-lg">
                             <div className="absolute top-0 left-0 w-full h-4 bg-slate-700 rounded-t-xl"></div>
                             <div className="absolute bottom-0 left-0 w-full h-4 bg-red-500/80 rounded-b-xl shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                             <div className="absolute top-6 left-1 right-1 h-8 bg-slate-900 rounded-sm opacity-50"></div>
                             <div className="absolute bottom-6 left-1 right-1 h-6 bg-slate-900 rounded-sm opacity-50"></div>
                          </div>
                        ) : (
                          // Empty Slot
                          <>
                             <span className={`text-sm md:text-lg font-bold ${isSelected ? 'text-amber-600' : 'text-slate-400'}`}>{slot.id}</span>
                             {isSelected && <div className="absolute bottom-3 w-1.5 h-1.5 bg-amber-500 rounded-full"></div>}
                          </>
                        )}
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Ambient Background Blur */}
            <div className="absolute -top-20 -left-20 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-amber-50 rounded-full blur-[100px] pointer-events-none"></div>
          </div>

          {/* RIGHT: BOOKING FORM */}
          <div className="w-full xl:w-96 flex flex-col gap-6">
             {/* Selected Info Card */}
             <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden transition-all duration-500">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400 rounded-full blur-[60px] opacity-20"></div>
                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-1">Parking Overview</h3>
                <div className="flex items-end justify-between mb-6">
                   <div>
                      <span className="text-3xl font-bold block">{activeZone}</span>
                      <span className="text-sm text-slate-400">{selectedSlot ? `Spot ${selectedSlot} Selected` : 'Select a spot'}</span>
                   </div>
                   <MapPin className="text-amber-400 mb-1" size={28} />
                </div>
                
                {/* Overnight Toggle */}
                <div className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 group ${isOvernight ? 'bg-indigo-600 border-indigo-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                     onClick={() => setIsOvernight(!isOvernight)}
                >
                   <div className={`p-2.5 rounded-full transition-colors ${isOvernight ? 'bg-white text-indigo-600' : 'bg-slate-800 text-slate-400 group-hover:text-white'}`}>
                      {isOvernight ? <Moon size={18} /> : <Sun size={18} />}
                   </div>
                   <div className="flex-1">
                      <p className="font-bold text-sm">Overnight Parking</p>
                      <p className="text-[10px] opacity-70">Extends booking to 12 Hours</p>
                   </div>
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isOvernight ? 'border-white bg-white' : 'border-slate-600'}`}>
                      {isOvernight && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>}
                   </div>
                </div>
             </div>

             {/* Booking Inputs */}
             <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 flex-1">
                <h3 className="font-bold text-slate-800 mb-6 text-lg">Book your parking</h3>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide pl-1">Date</label>
                      <input 
                         type="date" 
                         required
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 outline-none font-medium text-slate-700 transition-all"
                         value={date}
                         onChange={(e) => setDate(e.target.value)}
                      />
                   </div>

                   <div className="flex gap-4">
                      <div className="space-y-2 flex-1">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide pl-1">Arrive</label>
                        <input 
                           type="time" 
                           required
                           className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 outline-none font-medium text-slate-700 transition-all"
                           value={startTime}
                           onChange={(e) => setStartTime(e.target.value)}
                        />
                      </div>
                      {!isOvernight && (
                         <div className="space-y-2 flex-1">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wide pl-1">Hours</label>
                           <select 
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 outline-none font-medium text-slate-700 transition-all cursor-pointer"
                              value={duration}
                              onChange={(e) => setDuration(e.target.value)}
                           >
                              {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h} Hr</option>)}
                           </select>
                         </div>
                      )}
                   </div>

                   <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wide pl-1">Vehicle Plate</label>
                      <input 
                         type="text" 
                         required
                         placeholder="WNB 1234"
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400 outline-none font-bold uppercase text-slate-700 placeholder:font-normal placeholder:normal-case transition-all"
                         value={plateNumber}
                         onChange={(e) => setPlateNumber(e.target.value)}
                      />
                   </div>

                   <button 
                      type="submit"
                      disabled={!selectedSlot || isLoading}
                      className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold py-4 rounded-xl transition-all shadow-lg shadow-amber-400/20 transform hover:-translate-y-1 mt-4 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2"
                   >
                      {isLoading ? 'Processing...' : 'Confirm Booking'}
                   </button>
                </form>
             </div>
          </div>
        </div>
      ) : (
        // Ticket Result
        <div className="max-w-md mx-auto animate-fade-in-up pt-12">
          <button 
            onClick={() => {
              setStep(1);
              setGeneratedBooking(null);
            }}
            className="mb-6 flex items-center text-slate-500 hover:text-indigo-600 transition-colors font-medium text-sm"
          >
            <ChevronLeft size={16} className="mr-1" /> Back to Map
          </button>

          <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-300/50 overflow-hidden relative border border-slate-100">
            <div className={`p-8 text-center relative overflow-hidden ${generatedBooking?.isOvernight ? 'bg-indigo-900' : 'bg-slate-900'}`}>
               <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-30"></div>
               <div className="relative z-10">
                 <h3 className="text-white font-bold text-xl tracking-wide">ACCESS PASS</h3>
                 <p className="text-white/60 text-xs uppercase tracking-widest mt-1">Nadayu28 Residences</p>
                 {generatedBooking?.isOvernight && (
                    <div className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-white/10 rounded-full text-[10px] text-indigo-200 font-bold uppercase border border-indigo-400/30">
                       <Moon size={10} /> Overnight Parking
                    </div>
                 )}
               </div>
            </div>
            
            <div className="p-8 text-center relative">
              <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-200 inline-block mb-6 mx-auto">
                 <div className="w-48 h-48 bg-slate-900 p-2 flex items-center justify-center rounded-lg">
                    <QrCode className="text-white w-full h-full" />
                 </div>
              </div>

              <div className="space-y-4 text-left bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                   <div>
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Zone / Spot</span>
                      <span className="text-slate-800 font-bold text-lg">{generatedBooking?.details?.split('•')[1] || 'Assigned'}</span>
                   </div>
                   <div className="text-right">
                      <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Plate</span>
                      <span className="text-slate-800 font-bold text-lg">{generatedBooking?.details?.split('•')[0]}</span>
                   </div>
                </div>
                <div className="w-full h-px bg-slate-200"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Date</span>
                    <span className="text-slate-700 font-semibold">{generatedBooking?.date}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-xs font-bold uppercase block mb-1">Entry</span>
                    <span className="text-slate-700 font-semibold">{generatedBooking?.startTime}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                   <Share2 size={16} /> Share
                </button>
                <button className="flex-1 bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                   <Download size={16} /> Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};