import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Calendar, Car, ChevronLeft, Download, Share2, Moon, Sun, CheckCircle2 } from 'lucide-react';
import { Booking, FacilityType } from '../types';
import { fetchParkingSlots, createParkingBooking, ParkingSlot } from '../services/dataService';
import { CustomDatePicker, CustomTimePicker } from './CustomPickers';
import { parkingBookingSchema, validate } from '../services/validation';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

const ZONES = ['Visitor Parking', 'Overnight Parking'];

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [parkingSlots, setParkingSlots] = useState<ParkingSlot[]>([]);
  const { t } = useI18n();
  const { userProfile } = useAuth();

  const loadSlots = () => { fetchParkingSlots().then(setParkingSlots).catch(() => {}); };
  useEffect(() => { loadSlots(); }, []);

  const SLOTS_DATA: Record<string, { id: string; number: number; status: 'available' | 'occupied' | 'selected' }[]> = {
    'Visitor Parking': parkingSlots.filter(s => s.zone === 'Visitor Parking').map(s => ({ id: s.id, number: s.slotNumber, status: s.status === 'available' ? 'available' : 'occupied' })),
    'Overnight Parking': parkingSlots.filter(s => s.zone === 'Overnight Parking').map(s => ({ id: s.id, number: s.slotNumber, status: s.status === 'available' ? 'available' : 'occupied' })),
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});
    const result = validate(parkingBookingSchema, {
      date, startTime, duration, plateNumber, selectedSlot: selectedSlot || '',
    });
    if (!result.success) { setFieldErrors(result.errors); return; }
    setIsLoading(true);
    try {
      const durationHours = isOvernight ? 48 : parseInt(duration);
      const unit = userProfile?.unit ?? '';
      const { id: bookingId, qrCode } = await createParkingBooking({
        slotId: selectedSlot!,
        zone: activeZone,
        date,
        startTime,
        durationHours,
        plateNumber,
        unit,
        isOvernight,
      });
      setGeneratedBooking({
        id: bookingId,
        facilityType: FacilityType.PARKING,
        date,
        startTime,
        durationHours,
        status: 'active',
        residentUnit: unit,
        details: `${plateNumber.toUpperCase()} • ${selectedSlot}`,
        qrCode,
        isOvernight,
      });
      setStep(2);
      loadSlots();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
      loadSlots();
    } finally {
      setIsLoading(false);
    }
  };

  const availableSlots = SLOTS_DATA[activeZone].filter(s => s.status === 'available').length;
  const occupiedSlots = SLOTS_DATA[activeZone].filter(s => s.status === 'occupied').length;

  return (
    <div className="pb-12 space-y-5">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
            <Car size={28} className="text-nadayu-panel" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-white">{t.parking.title}</h2>
            <p className="mt-1 text-sm text-nadayu-muted">{t.parking.subtitle}</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-5 bg-white/10 px-6 py-3 rounded-2xl">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/20 border-2 border-white/30"></div>
            <span className="text-sm font-semibold text-nadayu-muted">{t.parking.available}</span>
          </div>
          <div className="w-px h-5 bg-white/10"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-white/10"></div>
            <span className="text-sm font-semibold text-nadayu-muted">{t.parking.occupied}</span>
          </div>
          <div className="w-px h-5 bg-white/10"></div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-nadayu-accent"></div>
            <span className="text-sm font-semibold text-nadayu-accent">{t.parking.selected}</span>
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
                className={"rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer " + (isDark ? "bg-nadayu-panel border-nadayu-panel shadow-xl" : isActive ? "bg-white border-nadayu-border shadow-md" : "bg-white border-nadayu-border hover:border-nadayu-border")}>
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <h3 className={"text-xl font-bold mb-3 " + (isDark ? "text-white" : "text-gray-900")}>{zone}</h3>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className={"flex items-center gap-2 px-3 py-1.5 rounded-full " + (isDark ? "bg-nadayu-accent/20 text-nadayu-accent" : "bg-nadayu-success/15 text-nadayu-success")}>
                        <CheckCircle2 size={14} />
                        <span className="text-xs font-bold">{availableSlots} {t.parking.available}</span>
                      </div>
                      <div className={"flex items-center gap-2 px-3 py-1.5 rounded-full " + (isDark ? "bg-white/10 text-nadayu-muted" : "bg-nadayu-cream text-gray-500")}>
                        <Car size={14} />
                        <span className="text-xs font-bold">{occupiedSlots} {t.parking.occupied}</span>
                      </div>
                    </div>
                  </div>
                  <div className={"p-3 rounded-2xl " + (isDark ? "bg-white/10" : isActive ? "bg-nadayu-panel" : "bg-nadayu-cream")}>
                    {zone === 'Overnight Parking'
                      ? <Moon className={isDark ? "text-nadayu-accent" : isActive ? "text-nadayu-accent" : "text-nadayu-muted"} size={24} />
                      : <Sun className={isActive ? "text-nadayu-accent" : "text-nadayu-muted"} size={24} />
                    }
                  </div>
                </div>
                <div className={"mb-5 p-4 rounded-xl border " + (isDark ? "bg-white/5 border-white/10" : "bg-nadayu-cream border-nadayu-border")}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={"text-xs font-semibold uppercase tracking-wider mb-1 " + (isDark ? "text-gray-500" : "text-nadayu-muted")}>Duration</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-900")}>{zone === 'Overnight Parking' ? '48 Hours' : 'Up to 6 Hours'}</p>
                    </div>
                    <div className="text-right">
                      <p className={"text-xs font-semibold uppercase tracking-wider mb-1 " + (isDark ? "text-gray-500" : "text-nadayu-muted")}>Spots Range</p>
                      <p className={"text-sm font-semibold " + (isDark ? "text-white" : "text-gray-900")}>{zone === 'Overnight Parking' ? 'P37-P72' : 'P01-P36'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-6 gap-2 mb-5" style={{ gridAutoRows: '1fr' }}>
                  {SLOTS_DATA[zone].map((slot) => {
                    const isOccupied = slot.status === 'occupied';
                    const isSelected = selectedSlot === slot.id;
                    return (
                      <button key={slot.id}
                        disabled={isOccupied || activeZone !== zone}
                        onClick={(e) => { e.stopPropagation(); if (activeZone === zone) setSelectedSlot(slot.id); }}
                        className={"rounded-lg transition-all duration-200 font-bold text-xs " + (isOccupied ? "cursor-not-allowed" : "cursor-pointer") + " " + (activeZone !== zone ? "opacity-40" : "opacity-100")}
                        style={{ aspectRatio: '1 / 1' }}>
                        <div className={"w-full h-full rounded-lg border-2 flex items-center justify-center transition-all duration-200 " + (isSelected ? "bg-nadayu-accent border-nadayu-accent text-white font-bold" : isOccupied ? (isDark ? "bg-white/5 border-white/10 text-gray-600" : "bg-nadayu-cream border-nadayu-border text-gray-300") : (isDark ? "bg-white/10 border-white/20 text-gray-300 hover:border-nadayu-accent hover:bg-nadayu-accent/15" : "bg-white border-nadayu-border text-gray-700 hover:border-nadayu-accent hover:bg-nadayu-accent/10"))}>
                          {slot.number}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {isActive && (
                  <div className={"pt-4 border-t " + (isDark ? "border-white/10" : "border-nadayu-border")}>
                    <p className={"text-sm font-semibold " + (selectedSlot ? (isDark ? "text-nadayu-accent" : "text-nadayu-panel") : "text-nadayu-muted")}>
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
            <div className={"rounded-2xl overflow-hidden relative transition-all duration-500 " + (isOvernight ? "bg-nadayu-panel" : "bg-white border border-nadayu-border shadow-sm")}>
              {!isOvernight && <div className="h-1.5 bg-nadayu-accent w-full"></div>}
              <div className="p-6 relative z-10">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className={"font-semibold text-xs uppercase tracking-widest mb-1 " + (isOvernight ? "text-gray-500" : "text-nadayu-muted")}>Parking Type</p>
                    <h3 className={"text-xl font-bold " + (isOvernight ? "text-white" : "text-gray-900")}>{activeZone}</h3>
                  </div>
                  <div className={"p-3 rounded-xl " + (isOvernight ? "bg-white/10" : "bg-nadayu-cream")}>
                    {isOvernight ? <Moon size={24} className="text-nadayu-accent" /> : <Sun size={24} className="text-gray-700" />}
                  </div>
                </div>
                <div className={"space-y-3 pt-5 border-t " + (isOvernight ? "border-white/10" : "border-nadayu-border")}>
                  <div className="flex justify-between items-center">
                    <span className={"font-medium text-sm " + (isOvernight ? "text-nadayu-muted" : "text-gray-500")}>Duration</span>
                    <span className={"font-semibold " + (isOvernight ? "text-white" : "text-gray-900")}>{isOvernight ? '48h' : 'Up to 6h'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={"font-medium text-sm " + (isOvernight ? "text-nadayu-muted" : "text-black/60")}>Spot</span>
                    <span className={"text-xl font-bold " + (isOvernight ? "text-white" : "text-gray-900")}>{selectedSlot ? selectedSlot.replace('P', 'P-') : '-'}</span>
                  </div>
                  {selectedSlot && (
                    <div className={"flex items-center gap-2 mt-4 pt-4 border-t " + (isOvernight ? "border-white/10" : "border-nadayu-border")}>
                      <div className={"w-2 h-2 rounded-full " + (isOvernight ? "bg-nadayu-accent" : "bg-nadayu-accent")}></div>
                      <span className={"text-sm font-semibold " + (isOvernight ? "text-white" : "text-gray-900")}>Ready to book</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-nadayu-border">
              <h3 className="font-bold text-gray-900 mb-5 text-lg flex items-center gap-3">
                <div className="p-2 rounded-xl bg-nadayu-cream">
                  <Calendar size={18} className="text-nadayu-panel" />
                </div>
                {t.parking.completeBooking}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">{t.parking.date}</label>
                  <CustomDatePicker required value={date} onChange={(v) => { setDate(v); setFieldErrors(prev => ({ ...prev, date: '' })); }} />
                  {fieldErrors.date && <p className="text-red-500 text-xs mt-1">{fieldErrors.date}</p>}
                </div>
                <div className="flex gap-3">
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">{t.parking.arrivalTime}</label>
                    <CustomTimePicker required value={startTime} onChange={setStartTime} />
                  </div>
                  {!isOvernight && (
                    <div className="space-y-2 flex-1">
                      <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">{t.parking.duration}</label>
                      <select className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all cursor-pointer"
                        value={duration} onChange={(e) => setDuration(e.target.value)}>
                        {[1,2,3,4,5,6].map(h => <option key={h} value={h}>{h}h</option>)}
                      </select>
                    </div>
                  )}
                </div>
                {isOvernight && (
                  <div className="p-4 bg-nadayu-panel rounded-xl">
                    <p className="text-sm text-nadayu-accent font-medium flex items-center gap-2">
                      <Moon size={15} />
                      {t.parking.overnightParking}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">{t.parking.vehiclePlate}</label>
                  <input type="text" placeholder="WNB 1234"
                    className={`w-full px-4 py-3 bg-nadayu-cream border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-bold uppercase text-gray-900 placeholder:font-normal placeholder:normal-case placeholder:text-nadayu-muted transition-all ${fieldErrors.plateNumber ? 'border-red-400' : 'border-nadayu-border'}`}
                    value={plateNumber} onChange={(e) => { setPlateNumber(e.target.value); setFieldErrors(prev => ({ ...prev, plateNumber: '' })); }} />
                  {fieldErrors.plateNumber && <p className="text-red-500 text-xs mt-1">{fieldErrors.plateNumber}</p>}
                </div>
                {fieldErrors.selectedSlot && <p className="text-red-500 text-xs mt-1">{fieldErrors.selectedSlot}</p>}
                {apiError && (
                  <p className="text-sm text-red-500 text-center px-4 py-2 rounded-xl bg-red-50">{apiError}</p>
                )}
                <button type="submit"
                  disabled={!selectedSlot || isLoading || !date || !startTime || !plateNumber}
                  className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm bg-nadayu-panel hover:brightness-110">
                  <Calendar size={16} />
                  {isLoading ? t.parking.processing : t.parking.confirmBooking}
                </button>
              </form>
              <p className="text-xs text-nadayu-muted text-center mt-4 leading-relaxed">
                {t.parking.instantConfirm}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto pt-8">
          <button onClick={() => { setStep(1); setGeneratedBooking(null); }}
            className="mb-6 flex items-center text-nadayu-muted hover:text-nadayu-panel transition-colors font-semibold text-sm gap-1">
            <ChevronLeft size={16} /> {t.parking.backToSelection}
          </button>
          <div className="bg-white rounded-2xl overflow-hidden border border-nadayu-border">
            <div className={"p-6 text-center bg-nadayu-panel"}>
              <h3 className={"font-bold text-2xl tracking-widest mb-1 text-white"}>{t.parking.parkingPass}</h3>
              <p className={"text-xs uppercase tracking-widest text-gray-500"}>Nadayu28 Residences</p>
              <div className={"inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full text-xs font-bold uppercase bg-nadayu-accent text-white"}>
                {isOvernight ? <Moon size={12} /> : <Sun size={12} />}
                {isOvernight ? 'Overnight (48h)' : 'Visitor (6h)'}
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="border-2 border-dashed border-nadayu-border inline-block mb-5 p-4 rounded-2xl">
                <div className="bg-white p-2 rounded-lg">
                  {generatedBooking?.qrCode && (
                    <QRCodeSVG
                      value={generatedBooking.qrCode}
                      size={160}
                      bgColor="#ffffff"
                      fgColor="#0F172A"
                      level="M"
                    />
                  )}
                </div>
              </div>
              <div className="space-y-4 text-left bg-nadayu-cream p-5 rounded-2xl border border-nadayu-border mb-5">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-nadayu-muted text-xs font-semibold uppercase block mb-1">Parking Spot</span>
                    <span className="text-gray-900 font-bold text-2xl">{generatedBooking?.details?.split('•')[1]?.trim() || '-'}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-nadayu-muted text-xs font-semibold uppercase block mb-1">Vehicle</span>
                    <span className="text-gray-900 font-bold text-2xl">{generatedBooking?.details?.split('•')[0]}</span>
                  </div>
                </div>
                <div className="w-full h-px bg-nadayu-border"></div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-nadayu-muted text-xs font-semibold uppercase block mb-1">Date</span>
                    <span className="text-gray-900 font-semibold text-sm">{generatedBooking?.date}</span>
                  </div>
                  <div>
                    <span className="text-nadayu-muted text-xs font-semibold uppercase block mb-1">Time</span>
                    <span className="text-gray-900 font-semibold text-sm">{generatedBooking?.startTime}</span>
                  </div>
                  <div>
                    <span className="text-nadayu-muted text-xs font-semibold uppercase block mb-1">Duration</span>
                    <span className="text-gray-900 font-semibold text-sm">{generatedBooking?.durationHours}h</span>
                  </div>
                </div>
                <div className="w-full h-px bg-nadayu-border"></div>
                <div className="text-center">
                  <span className="text-nadayu-muted text-xs font-semibold uppercase block mb-1">Booking ID</span>
                  <span className="text-nadayu-panel font-mono font-bold text-sm">{generatedBooking?.id}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 bg-nadayu-accent text-white py-3.5 rounded-xl font-bold text-sm hover:brightness-95 transition-all flex items-center justify-center gap-2">
                  <Share2 size={15} /> Share
                </button>
                <button className="flex-1 bg-nadayu-cream text-nadayu-panel py-3.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                  <Download size={15} /> Save
                </button>
              </div>
              <p className="text-xs text-nadayu-muted mt-5 text-center">
                Show this QR code at the entry gate for access
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};