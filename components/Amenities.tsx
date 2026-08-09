'use client';

import React, { useState, useEffect } from 'react';
import { FACILITIES } from '../constants';
import { Check, X, Calendar, ArrowRight, Star } from 'lucide-react';
import { FacilityType } from '../types';
import { CustomDatePicker } from './CustomPickers';
import { amenityBookingSchema, validate } from '../services/validation';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { fetchFacilities, fetchFacilitySlots, createFacilityBooking, Facility } from '../services/dataService';

const TIME_SLOTS = ['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'];

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const Amenities: React.FC = () => {
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'available'>('all');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { t } = useI18n();
  const { userProfile } = useAuth();

  const [facilities, setFacilities] = useState<Record<string, Facility>>({});
  const [takenSlots, setTakenSlots] = useState<Set<string>>(new Set());
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  useEffect(() => {
    fetchFacilities()
      .then((rows) => setFacilities(Object.fromEntries(rows.map((f) => [f.id, f]))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedFacility || !bookingDate) {
      setTakenSlots(new Set());
      return;
    }
    let cancelled = false;
    setCheckingAvailability(true);
    fetchFacilitySlots(selectedFacility.id, bookingDate)
      .then((slots) => { if (!cancelled) setTakenSlots(new Set(slots)); })
      .catch(() => { if (!cancelled) setTakenSlots(new Set()); })
      .finally(() => { if (!cancelled) setCheckingAvailability(false); });
    return () => { cancelled = true; };
  }, [selectedFacility, bookingDate]);

  const getFacilityImage = (type: FacilityType) => {
    switch (type) {
      case FacilityType.GYM:
        return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop';
      case FacilityType.BBQ:
        return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&h=600&fit=crop';
      case FacilityType.PARTY_ROOM:
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop';
      case FacilityType.TENNIS:
        return 'https://images.unsplash.com/photo-1554068865-24859e3c93a8?w=800&h=600&fit=crop';
      case FacilityType.SWIMMING_POOL:
        return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=800&h=600&fit=crop';
      case FacilityType.SQUASH_COURT:
        return 'https://images.unsplash.com/photo-1554068865-24859e3c93a8?w=800&h=600&fit=crop';
      case FacilityType.BASKETBALL_COURT:
        return 'https://images.unsplash.com/photo-1546519638-68711109d298?w=800&h=600&fit=crop';
      case FacilityType.MULTI_PURPOSE_COURT:
        return 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop';
      default:
        return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop';
    }
  };

  const getFacilityStatus = (id: FacilityType): { status: string; available: boolean } => {
    const facility = facilities[id];
    if (!facility) return { status: 'Available', available: true };
    if (facility.status === 'active') return { status: 'Available', available: true };
    return { status: facility.status === 'maintenance' ? 'Maintenance' : t.amenities.fullyBooked, available: false };
  };

  const getFacilityDescription = (id: FacilityType): string => {
    const facility = facilities[id];
    return facility ? `${facility.sessionDuration}-hour sessions` : '2-hour session';
  };

  const categoryFilters: { id: typeof selectedCategory; label: string }[] = [
    { id: 'all', label: t.amenities.allFacilities },
    { id: 'available', label: t.amenities.availableNow },
  ];

  const visibleFacilities = FACILITIES
    .filter(f => f.id !== FacilityType.PARKING)
    .filter(f => selectedCategory === 'all' || getFacilityStatus(f.id).available);

  const closeModal = () => {
    setSelectedFacility(null);
    setBookingSuccess(false);
    setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    const result = validate(amenityBookingSchema, { bookingDate, bookingTime });
    if (!result.success) { setFieldErrors(result.errors); return; }

    setIsSubmitting(true);
    try {
      await createFacilityBooking({
        facilityId: selectedFacility.id,
        date: bookingDate,
        startTime: bookingTime,
        durationHours: facilities[selectedFacility.id]?.sessionDuration ?? 2,
        unit: userProfile?.unit ?? '',
      });
      setBookingSuccess(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <Star size={28} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t.amenities.title}</h1>
          <p className="mt-1 text-sm text-nadayu-muted">{t.amenities.subtitle}</p>
        </div>
      </div>

      {/* Facilities Grid */}
      <div>
         {/* Category Filter Bar */}
         <div className="flex gap-2 mb-5">
            {categoryFilters.map(filter => (
               <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                     selectedCategory === filter.id ? 'bg-nadayu-panel text-white' : 'bg-nadayu-cream text-gray-500 hover:bg-gray-200'
                  }`}
               >
                  {filter.label}
               </button>
            ))}
         </div>

         {visibleFacilities.length === 0 && (
            <p className="text-sm text-nadayu-muted text-center py-12">No facilities available right now.</p>
         )}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleFacilities.map((facility, idx) => (
               <div 
                  key={facility.id} 
                  onClick={() => {
                     setSelectedFacility(facility);
                     setBookingDate('');
                     setBookingTime('');
                     setBookingSuccess(false);
                  }}
                  className={`
                     group relative h-80 rounded-2xl overflow-hidden cursor-pointer shadow-xl
                     transform transition-all duration-300 hover:shadow-sm hover:-translate-y-2
                     ${idx === 0 || idx === 3 ? 'md:col-span-2' : ''} 
                  `}
               >
                  <img 
                     src={getFacilityImage(facility.id)} 
                     alt={facility.name} 
                     loading="lazy"
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     onError={(e) => {
                       (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop';
                     }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t transition-opacity duration-300" style={{backgroundImage: 'linear-gradient(to top, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.4), transparent)'}}></div>

                  <div className="absolute bottom-0 left-0 p-6 w-full">
                     <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                           getFacilityStatus(facility.id).available
                              ? 'border-nadayu-success text-nadayu-success bg-nadayu-success/15'
                              : 'border-nadayu-muted text-nadayu-muted bg-nadayu-muted/15'
                        }`}>
                           {getFacilityStatus(facility.id).status}
                        </span>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">{facility.name}</h3>
                     <p className="text-xs mb-4 text-slate-300">
                        {getFacilityDescription(facility.id)}
                     </p>
                     <div className="flex items-center gap-2 font-bold text-sm text-nadayu-accent group-hover:translate-x-1 transition-transform">
                        {t.amenities.bookNow} <ArrowRight size={16} />
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Booking Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/60">
          <div className="rounded-2xl shadow-sm w-full max-w-2xl overflow-hidden relative bg-white">

            {!bookingSuccess && (
              <button onClick={closeModal} className="absolute top-6 right-6 p-2.5 rounded-full z-50 transition-colors bg-nadayu-cream hover:bg-nadayu-border text-gray-500">
                <X size={24} />
              </button>
            )}

            {bookingSuccess ? (
              // Success State
              <div className="p-16 flex flex-col items-center justify-center text-center bg-white">
                <div className="w-24 h-24 text-white rounded-full flex items-center justify-center mb-5 shadow-xl animate-bounce bg-nadayu-success">
                  <Check size={48} />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">{t.amenities.bookingConfirmed}</h3>
                <p className="text-lg mb-5 max-w-md leading-relaxed text-gray-500">
                  You're all set for <span className="font-bold text-nadayu-panel">{selectedFacility.name}</span>
                  <br/>
                  <span className="font-bold text-nadayu-panel">{bookingDate}</span> at <span className="font-bold text-nadayu-panel">{bookingTime}</span>
                </p>
                <button onClick={closeModal} className="bg-nadayu-panel hover:brightness-110 text-white px-12 py-4 rounded-xl font-bold transition-all shadow-lg">
                  Done
                </button>
              </div>
            ) : (
              // Booking Form
              <div className="relative">
                {/* Header with Image */}
                <div className="relative h-56 overflow-hidden bg-nadayu-panel">
                   <img src={getFacilityImage(selectedFacility.id)} className="w-full h-full object-cover opacity-80" alt="Facility" />
                   <div className="absolute inset-0 bg-gradient-to-r from-nadayu-panel via-nadayu-panel/70 to-transparent"></div>
                   <div className="absolute bottom-8 left-8 text-white z-10">
                      <h3 className="text-xl font-bold mb-2">{selectedFacility.name}</h3>
                      <p className="flex items-center gap-2 text-slate-300">
                        <Calendar size={16} /> Select your preferred time slot
                      </p>
                   </div>
                </div>

                {/* Form Section */}
                <div className="p-6 md:p-12 space-y-5">
                   <form onSubmit={handleSubmit} className="space-y-5">
                      {/* Date Input */}
                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest pl-2 text-nadayu-muted">{t.amenities.selectDate}</label>
                        <CustomDatePicker
                          required
                          value={bookingDate}
                          onChange={(v) => { setBookingDate(v); setFieldErrors(prev => ({ ...prev, bookingDate: '' })); }}
                        />
                        {fieldErrors.bookingDate && <p className="text-nadayu-danger text-xs mt-1">{fieldErrors.bookingDate}</p>}
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest pl-2 text-nadayu-muted">
                          {t.amenities.selectTimeSlot} {checkingAvailability && '(checking availability...)'}
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {TIME_SLOTS.map(time => {
                            const isTaken = takenSlots.has(time);
                            return (
                              <button
                                key={time}
                                type="button"
                                disabled={isTaken}
                                onClick={() => { setBookingTime(time); setFieldErrors(prev => ({ ...prev, bookingTime: '' })); }}
                                className={`py-4 rounded-xl text-sm font-bold border-2 transition-all duration-300 ${
                                  isTaken
                                    ? 'bg-nadayu-cream border-nadayu-border text-nadayu-muted line-through cursor-not-allowed'
                                    : bookingTime === time
                                    ? 'bg-nadayu-panel border-nadayu-panel text-white shadow-lg'
                                    : 'bg-nadayu-cream border-nadayu-border text-nadayu-panel hover:border-nadayu-panel'
                                }`}
                              >
                                {time}{isTaken ? ' · Taken' : ''}
                              </button>
                            );
                          })}
                        </div>
                        {fieldErrors.bookingTime && <p className="text-nadayu-danger text-xs mt-1">{fieldErrors.bookingTime}</p>}
                      </div>

                      {submitError && (
                        <div className="border-l-4 border-nadayu-danger bg-nadayu-danger/10 text-nadayu-danger p-4 rounded-lg">
                          <p className="text-sm font-medium">{submitError}</p>
                        </div>
                      )}

                      {/* Info Alert */}
                      <div className="border-l-4 border-nadayu-panel bg-nadayu-cream text-nadayu-panel p-4 rounded-lg">
                        <p className="text-sm font-medium">
                          {t.amenities.instantQr}
                        </p>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !bookingDate || !bookingTime}
                        className="w-full font-bold py-5 rounded-xl transition-all shadow-lg text-lg transform hover:-translate-y-1 disabled:transform-none text-white bg-nadayu-panel hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                      </button>
                   </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};