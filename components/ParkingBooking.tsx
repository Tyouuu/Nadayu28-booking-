import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Car, ChevronLeft, Download, Share2, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { Booking, FacilityType } from '../types';
import { bookingsApi } from '../services/api';

const generateParkingSpots = (startNum: number, count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `P${String(startNum + i).padStart(2, '0')}`,
    number: startNum + i,
    status: Math.random() > 0.4 ? 'available' : 'occupied' as 'available' | 'occupied' | 'selected'
  }));
};

const ZONES = ['Visitor Parking', 'Overnight Parking'];
const SLOTS_DATA: Record<string, { id: string; number: number; status: 'available' | 'occupied' | 'selected' }[]> = {
  'Visitor Parking': generateParkingSpots(1, 36),
  'Overnight Parking': generateParkingSpots(37, 36),
};

export const ParkingBooking: React.FC = () => {
  const [step, setStep] = useState(1);
  const [activeZone, setActiveZone] = useState('Visitor Parking');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('4');
  const [plateNumber, setPlateNumber] = useState('');
  const isOvernight = activeZone === 'Overnight Parking';
  const [generatedBooking, setGeneratedBooking] = useState<Booking | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setIsLoading(true);
    try {
      const bookingId = Math.random().toString(36).substr(2, 9).toUpperCase();
      const durationHours = isOvernight ? 48 : parseInt(duration);
      const qrPayload = JSON.stringify({
        id: bookingId,
        plate: plateNumber.toUpperCase(),
        slot: selectedSlot,
        date,
        time: startTime,
        duration: durationHours,
        unit: 'A-12-05',
        zone: activeZone,
      });
      await bookingsApi.create({
        id: bookingId,
        facility_type: `PARKING:${activeZone}`,
        date,
        start_time: startTime,
        duration_hours: durationHours,
        resident_unit: 'A-12-05',
        details: `${plateNumber.toUpperCase()} • ${selectedSlot}`,
        qr_code: qrPayload,
        is_overnight: isOvernight,
      });
      setGeneratedBooking({
        id: bookingId,
        facilityType: FacilityType.PARKING,
        date,
        startTime,
        durationHours,
        status: 'active',
        residentUnit: 'A-12-05',
        details: `${plateNumber.toUpperCase()} • ${selectedSlot}`,
        qrCode: qrPayload,
        isOvernight,
      });
      setStep(2);
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableSlots = SLOTS_DATA[activeZone].filter(s => s.status === 'available').length;
  const occupiedSlots = SLOTS_DATA[activeZone].filter(s => s.status === 'occupied').length;

  return (
    <div className="animate-fade-in pb-12 space-y-8">
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-[100px] -z-10" style={{backgroundColor: 'rgba(230, 179, 37, 0.05)'}}></div>
      <div className="absolute top-96 right-0 w-96 h-96 rounded-full blur-[100px] -z-10" style={{backgroundColor: 'rgba(212, 160, 23, 0.05)'}}></div>

      <div className="flex items-end justify-between px-4 md:px-0">
        <div>
          <h2 className="text-4xl font-bold tracking-tight" style={{color: '#F5F5F7'}}>Parkzone</h2>
          <p className="mt-2 text-lg" style={{color: '#B0B0B8'}}>Double-line parking: P01-P36 (Visitor) & P37-P72 (Overnight)</p>
        </div>
        <div className="hidden md:flex items-center gap-8 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border" style={{backgroundColor: 'rgba(61, 59, 101, 0.8)', borderColor: '#4A4860'}}>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full border-2" style={{backgroundColor: '#fff', borderColor: '#E6B325'}}></div>
            <span className="text-sm font-bold" style={{color: '#F5F5F7'}}>Available</span>
          </div>
          <div className="w-px h-6" style={{backgroundColor: '#4A4860'}}></div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#2D2B55'}}></div>
            <span className="text-sm font-bold" style={{color: '#F5F5F7'}}>Occupied</span>
          </div>
          <div className="w-px h-6" style={{backgroundColor: '#4A4860'}}></div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{backgroundColor: '#E6B325'}}></div>
            <span className="text-sm font-bold" style={{color: '#F5F5F7'}}>Selected</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-6">
            {ZONES.map((zone) => (
              <div key={zone}
                onClick={() => { setActiveZone(zone); setSelectedSlot(null); }}
                className={`bg-gradient-to-br rounded-3xl p-10 shadow-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden relative group ${
                  activeZone === zone
                    ? 'border-[#E6B325] shadow-2xl shadow-[#E6B325]/30 from-[#2D2B55] to-[#3D3B65]'
                    : 'border-[#4A4860]/50 from-[#3D3B65]/50 to-[#3D3B65]/30 hover:border-[#E6B325] hover:shadow-xl'
                }`}>
                {activeZone === zone && (
                  <div className="absolute top-0 right-0 w-40 h-40 bg-[#E6B325] rounded-full blur-[80px] opacity-20 -mr-20 -mt-20"></div>
                )}
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div>
                    <h3 className="text-3xl font-bold mb-3 text-[#F5F5F7]">{zone}</h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6B325]/20 text-[#F5D547] border border-[#E6B325]/30">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{availableSlots} Available</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#3D3B65]/30 text-[#B0B0B8] border border-[#4A4860]/50">
                        <Car size={16} />
                        <span className="text-xs font-bold uppercase tracking-wider">{occupiedSlots} Occupied</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#E6B325]/20">
                    {zone === 'Overnight Parking'
                      ? <Moon className={zone === activeZone ? 'text-[#F5D547]' : 'text-[#E6B325]'} size={32} />
                      : <Sun className={zone === activeZone ? 'text-[#F5D547]' : 'text-[#E6B325]'} size={32} />
                    }
                  </div>
                </div>
                <div className="mb-8 p-5 rounded-2xl border bg-[#3D3B65]/30 border-[#4A4860]/50">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-[#B0B0B8]">Duration</p>
                      <p className="text-2xl font-bold text-[#F5F5F7]">{zone === 'Overnight Parking' ? '48 Hours' : 'Up to 6 Hours'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold uppercase tracking-wider mb-2 text-[#B0B0B8]">Spots Range</p>
                      <p className="text-2xl font-bold text-[#F5F5F7]">{zone === 'Overnight Parking' ? 'P37-P72' : 'P01-P36'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-3 mb-6 relative z-10">
                  {SLOTS_DATA[zone].map((slot) => {
                    const isOccupied = slot.status === 'occupied';
                    const isSelected = selectedSlot === slot.id;
                    return (
                      <button key={slot.id}
                        disabled={isOccupied || activeZone !== zone}
                        onClick={(e) => { e.stopPropagation(); if (activeZone === zone) setSelectedSlot(slot.id); }}
                        className={`aspect-square rounded-lg relative transition-all duration-200 font-bold text-xs ${isOccupied ? 'cursor-not-allowed' : 'cursor-pointer'} ${activeZone !== zone ? 'opacity-50' : 'opacity-100'}`}>
                        <div className={`w-full h-full rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected ? 'bg-[#E6B325] border-[#D4A017] ring-2 ring-[#E6B325]/50 shadow-lg text-[#2D2B55] font-bold'
                            : isOccupied ? 'bg-[#2D2B55] border-[#3D3B65] text-[#B0B0B8]'
                            : 'bg-[#3D3B65]/50 border-[#E6B325]/50 text-[#F5F5F7] hover:bg-[#3D3B65]/70 hover:border-[#E6B325]'}`}>
                          {slot.number}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {activeZone === zone && (
                  <div className="pt-6 border-t-2 border-[#4A4860]/50 relative z-10">
                    <p className={`text-sm font-bold ${selectedSlot ? 'text-[#E6B325]' : 'text-[#B0B0B8]'}`}>
                      {selectedSlot
                        ? <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Spot {selectedSlot.replace('P', '')} selected</span>
                        : <span>Select a parking spot above</span>
                      }
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="w-full lg:w-96 flex flex-col gap-6">
            <div className={`rounded-3xl p-8 text-[#F5F5F7] shadow-2xl relative overflow-hidden transition-all duration-500 ${isOvernight ? 'bg-gradient-to-br from-[#3D3B65] to-[#2D2B55]' : 'bg-gradient-to-br from-[#E6B325] to-[#D4A017]'}`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-[80px] opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full blur-[60px] opacity-10"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <p className="text-[#B0B0B8] font-bold text-xs uppercase tracking-widest mb-2">Parking Type</p>
                    <h3 className="text-3xl font-bold text-[#F5F5F7]">{activeZone}</h3>
                  </div>
                  <div className={`p-3 rounded-2xl ${isOvernight ? 'bg-[#E6B325]/20' : 'bg-[#F5D547]/20'}`}>
                    {isOvernight ? <Moon size={32} className="text-[#E6B325]" /> : <Sun size={32} className="text-[#F5D547]" />}
                  </div>
                </div>
                <div className="space-y-4 pt-6 border-t border-[#4A4860]/50">
                  <div className="flex justify-between items-center">
                    <span className="text-[#B0B0B8] font-medium">Duration</span>
                    <span className="text-2xl font-bold text-[#F5F5F7]">{isOvernight ? '48h' : 'Up to 6h'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#B0B0B8] font-medium">Spot</span>
                    <span className="text-xl font-bold text-[#F5F5F7]">{selectedSlot ? selectedSlot.replace('P', 'P-') : '-'}</span>
                  </div>
                  {selectedSlot && (
                    <div className="flex items-center gap-2 mt-6 pt-6 border-t border-[#4A4860]/50">
                      <div className="w-3 h-3 rounded-full bg-[#E6B325]"></div>
                      <span className="text-sm font-bold text-[#F5F5F7]">Ready to book</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#3D3B65]/50 rounded-3xl p-8 shadow-xl border border-[#4A4860]/50">
              <h3 className="font-bold text-[#F5F5F7] mb-8 text-xl flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#E6B325]/20">
                  <Calendar size={24} className="text-[#E6B325]" />
                </div>
                Complete Your Booking
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider pl-1">Date</label>
                  <input type="date" required
                    className="w-full px-5 py-4 bg-[#2D2B55]/50 border-2 border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/30 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] transition-all hover:border-[#E6B325]"
                    value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex gap-4">
                  <div className="space-y-3 flex-1">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider pl-1">Arrival Time</label>
                    <input type="time" required
                      className="w-full px-5 py-4 bg-[#2D2B55]/50 border-2 border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/30 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] transition-all hover:border-[#E6B325]"
                      value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  {!isOvernight && (
                    <div className="space-y-3 flex-1">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider pl-1">Duration</label>
                      <select className="w-full px-5 py-4 bg-[#2D2B55]/50 border-2 border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/30 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] transition-all cursor-pointer hover:border-[#E6B325]"
                        value={duration} onChange={(e) => setDuration(e.target.value)}>
                        {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h}h</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {isOvernight && (
                  <div className="p-4 bg-[#3D3B65]/50 border-l-4 border-[#E6B325] rounded-lg">
                    <p className="text-sm text-[#F5F5F7] font-medium flex items-center gap-2">
                      <Moon size={18} className="text-[#E6B325]" />
                      48-Hour Overnight Parking available (P37-P72)
                    </p>
                  </div>
                )}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider pl-1">Vehicle Plate</label>
                  <input type="text" required placeholder="WNB 1234"
                    className="w-full px-5 py-4 bg-[#2D2B55]/50 border-2 border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/30 focus:border-[#E6B325] outline-none font-bold uppercase text-[#F5F5F7] placeholder:font-normal placeholder:normal-case placeholder:text-[#B0B0B8] transition-all hover:border-[#E6B325]"
                    value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
                </div>
                {apiError && (
                  <p className="text-sm text-red-400 text-center px-4 py-2 rounded-xl bg-red-400/10">{apiError}</p>
                )}
                <button type="submit"
                  disabled={!selectedSlot || isLoading || !date || !startTime || !plateNumber}
                  className="w-full py-5 rounded-xl font-bold text-[#2D2B55] transition-all shadow-lg transform hover:-translate-y-1 disabled:opacity-50 disabled:transform-none flex items-center justify-center gap-2 text-base bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325]">
                  <Calendar size={18} />
                  {isLoading ? 'Processing...' : 'Confirm Booking'}
                </button>
              </form>
              <p className="text-xs text-[#B0B0B8] text-center mt-4 leading-relaxed">
                Instant QR code confirmation - Free cancellation up to 2 hours
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto animate-fade-in-up pt-12">
          <button onClick={() => { setStep(1); setGeneratedBooking(null); }}
            className="mb-6 flex items-center text-[#B0B0B8] hover:text-[#E6B325] transition-colors font-bold text-sm gap-1">
            <ChevronLeft size={18} /> Back to Selection
          </button>
          <div className="bg-[#3D3B65]/50 rounded-3xl shadow-2xl overflow-hidden relative border border-[#4A4860]/50">
            <div className={`p-10 text-center relative overflow-hidden ${isOvernight ? 'bg-gradient-to-br from-[#2D2B55] to-[#1a1938]' : 'bg-gradient-to-br from-[#D4A017] to-[#2D2B55]'}`}>
              <div className="relative z-10">
                <h3 className="text-[#F5F5F7] font-bold text-2xl tracking-widest mb-1">PARKING PASS</h3>
                <p className="text-[#B0B0B8] text-xs uppercase tracking-widest">Nadayu28 Residences</p>
                <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#4A4860]/50 rounded-full text-xs text-[#F5F5F7] font-bold uppercase border border-[#4A4860]">
                  {isOvernight ? <Moon size={12} /> : <Sun size={12} />}
                  {isOvernight ? 'Overnight (48h)' : 'Visitor (6h)'}
                </div>
              </div>
            </div>
            <div className="p-10 text-center relative">
              <div className="bg-gradient-to-br from-[#2D2B55] to-[#3D3B65] p-6 rounded-2xl border-2 border-dashed border-[#4A4860] inline-block mb-8 mx-auto">
                <div className="bg-white p-3 rounded-lg">
                  {generatedBooking?.qrCode && (
                    <QRCodeSVG
                      value={generatedBooking.qrCode}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#2D2B55"
                      level="M"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-5 text-left bg-[#2D2B55]/50 p-8 rounded-2xl border border-[#4A4860]/50 mb-8">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[#B0B0B8] text-xs font-bold uppercase block mb-1">Parking Spot</span>
                    <span className="text-[#F5F5F7] font-bold text-2xl">{generatedBooking?.details?.split('•')[1]?.trim() || '-'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#B0B0B8] text-xs font-bold uppercase block mb-1">Vehicle</span>
                    <span className="text-[#F5F5F7] font-bold text-2xl">{generatedBooking?.details?.split('•')[0]}</span>
                  </div>
                </div>
                <div className="w-full h-px bg-[#4A4860]/50"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-[#B0B0B8] text-xs font-bold uppercase block mb-2">Date</span>
                    <span className="text-[#F5F5F7] font-bold text-sm">{generatedBooking?.date}</span>
                  </div>
                  <div>
                    <span className="text-[#B0B0B8] text-xs font-bold uppercase block mb-2">Time</span>
                    <span className="text-[#F5F5F7] font-bold text-sm">{generatedBooking?.startTime}</span>
                  </div>
                  <div>
                    <span className="text-[#B0B0B8] text-xs font-bold uppercase block mb-2">Duration</span>
                    <span className="text-[#F5F5F7] font-bold text-sm">{generatedBooking?.durationHours}h</span>
                  </div>
                </div>
                <div className="w-full h-px bg-[#4A4860]/50"></div>
                <div className="text-center">
                  <span className="text-[#B0B0B8] text-xs font-bold uppercase block mb-1">Booking ID</span>
                  <span className="text-[#E6B325] font-mono font-bold text-sm">{generatedBooking?.id}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-gradient-to-r from-[#E6B325] to-[#D4A017] text-[#2D2B55] py-4 rounded-xl font-bold text-sm hover:from-[#F5D547] hover:to-[#E6B325] transition-all flex items-center justify-center gap-2 shadow-lg">
                  <Share2 size={16} /> Share
                </button>
                <button className="flex-1 bg-[#3D3B65]/50 text-[#E6B325] py-4 rounded-xl font-bold text-sm hover:bg-[#3D3B65]/70 transition-all flex items-center justify-center gap-2 shadow-lg border border-[#E6B325]/30">
                  <Download size={16} /> Save
                </button>
              </div>
              <p className="text-xs text-[#B0B0B8] mt-6 text-center">
                Show this QR code at the entry gate for access
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};