import React, { useState, useEffect } from 'react';
import { FACILITIES } from '../constants';
import { Clock, Check, X, Calendar, AlertCircle, ArrowRight, ArrowUpRight, Star } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'available' | 'popular'>('all');
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
    { id: 'popular', label: t.amenities.popularFacilities },
  ];

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
    <div className="pb-12 space-y-6">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-[100px] -z-10" style={{backgroundColor: 'rgba(181, 101, 47, 0.03)'}}></div>
      <div className="absolute top-96 right-0 w-96 h-96 rounded-full blur-[100px] -z-10" style={{backgroundColor: 'rgba(181, 101, 47, 0.03)'}}></div>
      
      {/* Hero Section - Premium Dark Theme */}
      <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-sm mb-16 group">
         <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=600&fit=crop" 
            alt="Community Amenities" 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]"
         />
         <div className="absolute inset-0 bg-gradient-to-r backdrop-blur-[1px]" style={{backgroundImage: 'linear-gradient(to right, rgba(43, 36, 28, 0.92), rgba(43, 36, 28, 0.55), rgba(43, 36, 28, 0.1))'}}></div>

         {/* Decorative Elements */}
         <div className="absolute top-6 right-8 w-32 h-32 rounded-full blur-[80px] opacity-30 animate-pulse" style={{backgroundColor: '#B5652F'}}></div>

         <div className="absolute bottom-0 left-0 p-12 md:p-16 max-w-3xl text-white z-10">
            <h1 className="font-serif text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
               {t.amenities.title}
            </h1>
            <p className="text-lg mb-5 max-w-xl leading-relaxed" style={{color: '#B0B0B8'}}>
               {t.amenities.subtitle}
            </p>
         </div>
      </div>

      {/* Facilities Grid */}
      <div className=" px-4">
         <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-nadayu-panel rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Star size={24} className="text-nadayu-accent" />
               </div>
               <div>
                  <h3 className="font-serif text-3xl font-bold text-gray-900">Community Amenities</h3>
                  <p className="mt-1 text-gray-500">Select and book your preferred facility</p>
               </div>
            </div>
         </div>

         {/* Category Filter Bar */}
         <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
            {categoryFilters.map(filter => (
               <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id)}
                  className="px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0"
                  style={selectedCategory === filter.id ? {
                     backgroundColor: '#2B241C',
                     color: '#ffffff',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  } : {
                     backgroundColor: '#ffffff',
                     color: '#6B5D48',
                     border: '2px solid #E4D9C6'
                  }}
               >
                  {filter.label}
               </button>
            ))}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FACILITIES.filter(f => f.id !== FacilityType.PARKING).map((facility, idx) => (
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
                  <div className="absolute inset-0 bg-gradient-to-t transition-opacity duration-300" style={{backgroundImage: 'linear-gradient(to top, rgba(43, 36, 28, 0.92), rgba(43, 36, 28, 0.4), transparent)'}}></div>

                  <div className="absolute bottom-0 left-0 p-6 w-full">
                     <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                           getFacilityStatus(facility.id).available
                              ? 'border-nadayu-success text-nadayu-success'
                              : 'border-nadayu-muted text-nadayu-muted'
                        }`} style={{backgroundColor: getFacilityStatus(facility.id).available ? 'rgba(74, 93, 58, 0.15)' : 'rgba(107, 93, 72, 0.15)'}}>
                           {getFacilityStatus(facility.id).status}
                        </span>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">{facility.name}</h3>
                     <p className="text-xs mb-4" style={{color: '#B0B0B8'}}>
                        {getFacilityDescription(facility.id)}
                     </p>
                     <div className="flex items-center gap-2 font-bold text-sm group-hover:translate-x-1 transition-transform" style={{color: '#B5652F'}}>
                        {t.amenities.bookNow} <ArrowRight size={16} />
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Booking Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl " style={{backgroundColor: 'rgba(0, 0, 0, 0.6)'}}>
          <div className="rounded-2xl shadow-sm w-full max-w-2xl overflow-hidden relative" style={{backgroundColor: '#ffffff'}}>
            
            {!bookingSuccess && (
              <button onClick={closeModal} className="absolute top-6 right-6 p-2.5 rounded-full z-50 transition-colors bg-nadayu-cream hover:bg-nadayu-border text-gray-500">
                <X size={24} />
              </button>
            )}

            {bookingSuccess ? (
              // Success State
              <div className="p-16 flex flex-col items-center justify-center text-center bg-white">
                <div className="w-24 h-24 text-white rounded-full flex items-center justify-center mb-5 shadow-xl animate-bounce" style={{backgroundColor: '#4A5D3A'}}>
                  <Check size={48} />
                </div>
                <h3 className="font-serif text-4xl font-bold mb-4 text-gray-900">{t.amenities.bookingConfirmed}</h3>
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
                <div className="relative h-56 overflow-hidden" style={{backgroundColor: '#2B241C'}}>
                   <img src={getFacilityImage(selectedFacility.id)} className="w-full h-full object-cover opacity-80" alt="Facility" />
                   <div className="absolute inset-0 bg-gradient-to-r" style={{backgroundImage: 'linear-gradient(to right, rgba(43, 36, 28, 1), rgba(58, 50, 38, 0.8), transparent)'}}></div>
                   <div className="absolute bottom-8 left-8 text-white z-10">
                      <h3 className="font-serif text-xl font-bold mb-2">{selectedFacility.name}</h3>
                      <p className="flex items-center gap-2" style={{color: '#B0B0B8'}}>
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
                        {fieldErrors.bookingDate && <p className="text-red-500 text-xs mt-1">{fieldErrors.bookingDate}</p>}
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
                                className={`py-4 rounded-xl text-sm font-bold transition-all duration-300`}
                                style={isTaken ? {
                                  backgroundColor: '#F5F0E8',
                                  borderColor: '#E4D9C6',
                                  border: '2px solid',
                                  color: '#6B5D48',
                                  cursor: 'not-allowed',
                                  textDecoration: 'line-through'
                                } : bookingTime === time ? {
                                  backgroundColor: '#2B241C',
                                  color: '#ffffff',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                  border: '2px solid #2B241C'
                                } : {
                                  backgroundColor: '#F5F0E8',
                                  borderColor: '#E4D9C6',
                                  border: '2px solid',
                                  color: '#2B241C'
                                }}
                              >
                                {time}{isTaken ? ' · Taken' : ''}
                              </button>
                            );
                          })}
                        </div>
                        {fieldErrors.bookingTime && <p className="text-red-500 text-xs mt-1">{fieldErrors.bookingTime}</p>}
                      </div>

                      {submitError && (
                        <div className="border-l-4 p-4 rounded-lg" style={{backgroundColor: '#fef2f2', borderColor: '#ef4444', color: '#991b1b'}}>
                          <p className="text-sm font-medium">{submitError}</p>
                        </div>
                      )}

                      {/* Info Alert */}
                      <div className="border-l-4 p-4 rounded-lg" style={{backgroundColor: '#F5F0E8', borderColor: '#2B241C', color: '#2B241C'}}>
                        <p className="text-sm font-medium">
                          {t.amenities.instantQr}
                        </p>
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={isSubmitting || !bookingDate || !bookingTime}
                        className="w-full font-bold py-5 rounded-xl transition-all shadow-lg text-lg transform hover:-translate-y-1 disabled:transform-none text-white"
                        style={{
                          backgroundColor: '#2B241C',
                          opacity: (isSubmitting || !bookingDate || !bookingTime) ? 0.5 : 1,
                          cursor: (isSubmitting || !bookingDate || !bookingTime) ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#3A3226')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2B241C')}
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