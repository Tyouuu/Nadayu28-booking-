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
    <div className="pb-12 space-y-5">
      <div className="flex items-end justify-between px-4 md:px-0">
        <div>
          <h2 className="text-4xl font-bold tracking-tight text-gray-900">Parkzone</h2>
          <p className="mt-2 text-sm text-gray-400">Double-line parking: P01-P36 (Visitor) and P37-P72 (Overnight)</p>
        </div>
        <div className="hidden md:flex items-center gap-5 bg-white border border-gray-100 px-6 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-100 border-2 border-gray-300"></div>
            <span className="text-sm font-semibold text-gray-600">Available</span>
          </div>
          <div className="w-px h-5 bg-gray-100"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span className="text-sm font-semibold text-gray-600">Occupied</span>
          </div>
          <div className="w-px h-5 bg-gray-100"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#C8FF00]"></div>
            <span className="text-sm font-semibold text-gray-600">Selected</span>
          </div>
        </div>
      </div>

      {step === 1 ? (
        <div className="flex flex-col lg:flex-row gap-5">
          <div className="flex-1 space-y-6">
            {ZONES.map((zone) => {
              const isDark = zone === 'Overnight Parking';
              const isActive = activeZone === zone;
              return (
              <div key={zone}
                onClick={() => { setActiveZone(zone); setSelectedSlot(null); }}
                className={"rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer " + (isDark ? "bg-[#111111] border-[#111111] shadow-xl" : isActive ? "bg-white border-gray-200 shadow-md" : "bg-white border-gray-100 hover:border-gray-200")}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className={"text-xl font-bold mb-3 " + (isDark ? "text-white" : "text-gray-900")}>{zone}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={"flex items-center gap-2 px-3 py-1.5 rounded-full " + (isDark ? "bg-[#C8FF00]/20 text-[#C8FF00]" : "bg-[#C8FF00]/15 text-[#4a6600]")}>
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-bold">{availableSlots} Available</span>
                      </div>
                      <div className={"flex items-center gap-2 px-3 py-1.5 rounded-full " + (isDark ? "bg-white/10 text-gray-400" : "bg-gray-100 text-gray-500")}>
                        <Car size={14} />
                        <span className="text-xs font-bold">{occupiedSlots} Occupied</span>
                      </div>
                    </div>
                  </div>
                  <div className={"p-3 rounded-2xl " + (isDark ? "bg-white/10" : isActive ? "bg-[#111111]" : "bg-gray-100")}>
                    {zone === 'Overnight Parking'
                      ? <Moon className={isDark ? "text-[#C8FF00]" : isActive ? "text-[#C8FF00]" : "text-gray-400"} size={24} />
                      : <Sun className={isActive ? "text-[#C8FF00]" : "text-gray-400"} size={24} />
                    }
                  </div>
                </div>
                <div className={"mb-5 p-4 rounded-xl border " + (isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-100")}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={"text-xs font-semibold uppercase tracking-wider mb-1 " + (isDark ? "text-gray-500" : "text-gray-400")}>Duration</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-900")}>{zone === 'Overnight Parking' ? '48 Hours' : 'Up to 6 Hours'}</p>
                    </div>
                    <div className="text-right">
                      <p className={"text-xs font-semibold uppercase tracking-wider mb-1 " + (isDark ? "text-gray-500" : "text-gray-400")}>Spots Range</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-900")}>{zone === 'Overnight Parking' ? 'P37-P72' : 'P01-P36'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 mb-5">
                  {SLOTS_DATA[zone].map((slot) => {
                    const isOccupied = slot.status === 'occupied';
                    const isSelected = selectedSlot === slot.id;
                    return (
                      <button key={slot.id}
                        disabled={isOccupied || activeZone !== zone}
                        onClick={(e) => { e.stopPropagation(); if (activeZone === zone) setSelectedSlot(slot.id); }}
                        className={"aspect-square rounded-lg transition-all duration-200 font-bold text-xs " + (isOccupied ? "cursor-not-allowed" : "cursor-pointer") + " " + (activeZone !== zone ? "opacity-40" : "opacity-100")}>
                        <div className={"w-full h-full rounded-lg border-2 flex items-center justify-center transition-all duration-200 " + (isSelected ? "bg-[#C8FF00] border-[#C8FF00] text-[#111111] font-bold" : isOccupied ? (isDark ? "bg-white/5 border-white/10 text-gray-600" : "bg-gray-100 border-gray-100 text-gray-300") : (isDark ? "bg-white/10 border-white/20 text-gray-300 hover:border-[#C8FF00] hover:bg-[#C8FF00]/15" : "bg-white border-gray-200 text-gray-700 hover:border-[#C8FF00] hover:bg-[#C8FF00]/10"))}>
                          {slot.number}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {isActive && (
                  <div className={"pt-4 border-t " + (isDark ? "border-white/10" : "border-gray-100")}>
                    <p className={"text-sm font-semibold " + (selectedSlot ? (isDark ? "text-[#C8FF00]" : "text-[#111111]") : "text-gray-400")}>
                      {selectedSlot
                        ? <span className="flex items-center gap-2"><CheckCircle2 size={15} /> Spot {selectedSlot.replace('P', '')} selected</span>
                        : <span>Select a parking spot above</span>
                      }
                    </p>
                  </div>
                )}
              </div>
              );
            })}
          </div>

          <div className="w-full lg:w-96 flex flex-col gap-5">
            <div className={"rounded-2xl p-6 relative overflow-hidden transition-all duration-500 " + (isOvernight ? "bg-[#111111]" : "bg-[#C8FF00]")}>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className={"font-semibold text-xs uppercase tracking-widest mb-1 " + (isOvernight ? "text-gray-500" : "text-black/50")}>Parking Type</p>
                    <h3 className={"text-xl font-bold " + (isOvernight ? "text-white" : "text-[#111111]")}>{activeZone}</h3>
                  </div>
                  <div className={"p-3 rounded-xl " + (isOvernight ? "bg-white/10" : "bg-black/10")}>
                    {isOvernight ? <Moon size={24} className="text-[#C8FF00]" /> : <Sun size={24} className="text-[#111111]" />}
                  </div>
                </div>
                <div className={"space-y-3 pt-5 border-t " + (isOvernight ? "border-white/10" : "border-black/10")}>
                  <div className="flex justify-between items-center">
                    <span className={"font-medium text-sm " + (isOvernight ? "text-gray-400" : "text-black/60")}>Duration</span>
                    <span className={"font-semibold " + (isOvernight ? "text-white" : "text-[#111111]")}>{isOvernight ? '48h' : 'Up to 6h'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={"font-medium text-sm " + (isOvernight ? "text-gray-400" : "text-black/60")}>Spot</span>
                    <span className={"text-xl font-bold " + (isOvernight ? "text-white" : "text-[#111111]")}>{selectedSlot ? selectedSlot.replace('P', 'P-') : '-'}</span>
                  </div>
                  {selectedSlot && (
                    <div className={"flex items-center gap-2 mt-4 pt-4 border-t " + (isOvernight ? "border-white/10" : "border-black/10")}>
                      <div className={"w-2 h-2 rounded-full " + (isOvernight ? "bg-[#C8FF00]" : "bg-[#111111]")}></div>
                      <span className={"text-sm font-semibold " + (isOvernight ? "text-white" : "text-[#111111]")}>Ready to book</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-5 text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gray-100">
                  <Calendar size={18} className="text-[#111111]" />
                </div>
                Complete Your Booking
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</label>
                  <input type="date" required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all"
                    value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="flex gap-3">
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Arrival Time</label>
                    <input type="time" required
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all"
                      value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                  </div>
                  {!isOvernight && (
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Duration</label>
                      <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all cursor-pointer"
                        value={duration} onChange={(e) => setDuration(e.target.value)}>
                        {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h}h</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {isOvernight && (
                  <div className="p-4 bg-[#111111] rounded-xl">
                    <p className="text-sm text-[#C8FF00] font-medium flex items-center gap-2">
                      <Moon size={15} />
                      48-Hour Overnight Parking (P37-P72)
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle Plate</label>
                  <input type="text" required placeholder="WNB 1234"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-bold uppercase text-gray-900 placeholder:font-normal placeholder:normal-case placeholder:text-gray-400 transition-all"
                    value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)} />
                </div>
                {apiError && (
                  <p className="text-sm text-red-500 text-center px-4 py-2 rounded-xl bg-red-50">{apiError}</p>
                )}
                <button type="submit"
                  disabled={!selectedSlot || isLoading || !date || !startTime || !plateNumber}
                  className="w-full py-4 rounded-xl font-bold text-[#111111] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm bg-[#C8FF00] hover:brightness-95">
                  <Calendar size={16} />
                  {isLoading ? 'Processing...' : 'Confirm Booking'}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
                Instant QR code confirmation. Free cancellation up to 2 hours before.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto pt-8">
          <button onClick={() => { setStep(1); setGeneratedBooking(null); }}
            className="mb-6 flex items-center text-gray-400 hover:text-[#111111] transition-colors font-semibold text-sm gap-1">
            <ChevronLeft size={16} /> Back to Selection
          </button>
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className={"p-6 text-center " + (isOvernight ? "bg-[#111111]" : "bg-[#C8FF00]")}>
              <h3 className={"font-bold text-2xl tracking-widest mb-1 " + (isOvernight ? "text-white" : "text-[#111111]")}>PARKING PASS</h3>
              <p className={"text-xs uppercase tracking-widest " + (isOvernight ? "text-gray-500" : "text-black/50")}>Nadayu28 Residences</p>
              <div className={"inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-xs font-bold uppercase " + (isOvernight ? "bg-white/10 text-white" : "bg-[#111111] text-[#C8FF00]")}>
                {isOvernight ? <Moon size={12} /> : <Sun size={12} />}
                {isOvernight ? 'Overnight (48h)' : 'Visitor (6h)'}
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="border-2 border-dashed border-gray-200 inline-block mb-5 p-4 rounded-2xl">
                <div className="bg-white p-2 rounded-lg">
                  {generatedBooking?.qrCode && (
                    <QRCodeSVG
                      value={generatedBooking.qrCode}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#111111"
                      level="M"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-4 text-left bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Parking Spot</span>
                    <span className="text-gray-900 font-bold text-2xl">{generatedBooking?.details?.split('•')[1]?.trim() || '-'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Vehicle</span>
                    <span className="text-gray-900 font-bold text-2xl">{generatedBooking?.details?.split('•')[0]}</span>
                  </div>
                </div>
                <div className="w-full h-px bg-gray-200"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Date</span>
                    <span className="text-gray-900 font-semibold text-sm">{generatedBooking?.date}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Time</span>
                    <span className="text-gray-900 font-semibold text-sm">{generatedBooking?.startTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Duration</span>
                    <span className="text-gray-900 font-semibold text-sm">{generatedBooking?.durationHours}h</span>
                  </div>
                </div>
                <div className="w-full h-px bg-gray-200"></div>
                <div className="text-center">
                  <span className="text-gray-400 text-xs font-semibold uppercase block mb-1">Booking ID</span>
                  <span className="text-[#111111] font-mono font-bold text-sm">{generatedBooking?.id}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-[#C8FF00] text-[#111111] py-3.5 rounded-xl font-bold text-sm hover:brightness-95 transition-all flex items-center justify-center gap-2">
                  <Share2 size={15} /> Share
                </button>
                <button className="flex-1 bg-gray-100 text-[#111111] py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                  <Download size={15} /> Save
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-5 text-center">
                Show this QR code at the entry gate for access
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};