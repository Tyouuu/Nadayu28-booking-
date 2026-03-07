import React, { useState } from 'react';
import { FACILITIES } from '../constants';
import { Clock, Check, X, Calendar, AlertCircle, ArrowRight, ArrowUpRight, Star } from 'lucide-react';
import { FacilityType } from '../types';
import { CustomDatePicker } from './CustomPickers';

export const Amenities: React.FC = () => {
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'available' | 'popular'>('all');
  
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
    const statusMap: { [key: string]: { status: string; available: boolean } } = {
      [FacilityType.GYM]: { status: 'Available', available: true },
      [FacilityType.SWIMMING_POOL]: { status: 'Available', available: true },
      [FacilityType.TENNIS]: { status: 'Fully Booked', available: false },
      [FacilityType.BBQ]: { status: 'Available', available: true },
      [FacilityType.PARTY_ROOM]: { status: 'Available', available: true },
      [FacilityType.SQUASH_COURT]: { status: 'Fully Booked', available: false },
      [FacilityType.BASKETBALL_COURT]: { status: 'Available', available: true },
      [FacilityType.MULTI_PURPOSE_COURT]: { status: 'Available', available: true },
    };
    return statusMap[id] || { status: 'Available', available: true };
  };

  const getFacilityDescription = (id: FacilityType): string => {
    const descMap: { [key: string]: string } = {
      [FacilityType.GYM]: '2-hour sessions',
      [FacilityType.SWIMMING_POOL]: '2-hour sessions',
      [FacilityType.TENNIS]: '1.5-hour courts',
      [FacilityType.BBQ]: '3-hour slots',
      [FacilityType.PARTY_ROOM]: '4-hour rental',
      [FacilityType.SQUASH_COURT]: '1-hour slots',
      [FacilityType.BASKETBALL_COURT]: '2-hour sessions',
      [FacilityType.MULTI_PURPOSE_COURT]: '2-hour sessions',
    };
    return descMap[id] || '2-hour session';
  };

  const categoryFilters = [
    { id: 'all', label: 'All Facilities' },
    { id: 'available', label: 'Available Now' },
    { id: 'popular', label: 'Popular Facilities' },
  ];

  const closeModal = () => {
    setSelectedFacility(null);
    setBookingSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDate || !bookingTime) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setBookingSuccess(true);
    }, 1500);
  };

  return (
    <div className="pb-12 space-y-6">
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full blur-[100px] -z-10" style={{backgroundColor: 'rgba(200, 255, 0, 0.03)'}}></div>
      <div className="absolute top-96 right-0 w-96 h-96 rounded-full blur-[100px] -z-10" style={{backgroundColor: 'rgba(200, 255, 0, 0.03)'}}></div>
      
      {/* Hero Section - Premium Dark Theme */}
      <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-sm mb-16 group">
         <img 
            src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&h=600&fit=crop" 
            alt="Community Amenities" 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]"
         />
         <div className="absolute inset-0 bg-gradient-to-r backdrop-blur-[1px]" style={{backgroundImage: 'linear-gradient(to right, rgba(17, 17, 17, 0.92), rgba(17, 17, 17, 0.55), rgba(17, 17, 17, 0.1))'}}></div>
         
         {/* Decorative Elements */}
         <div className="absolute top-6 right-8 w-32 h-32 rounded-full blur-[80px] opacity-30 animate-pulse" style={{backgroundColor: '#C8FF00'}}></div>
         
         <div className="absolute bottom-0 left-0 p-12 md:p-16 max-w-3xl text-white z-10">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
               Community <br/>
               <span style={{color: '#C8FF00'}}>Amenities</span>
            </h1>
            <p className="text-lg mb-5 max-w-xl leading-relaxed" style={{color: '#B0B0B8'}}>
               Book our world-class facilities and make the most of your community. 
               Find your perfect time slot today.
            </p>
         </div>
      </div>

      {/* Facilities Grid */}
      <div className=" px-4">
         <div className="flex items-end justify-between mb-5">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-[#111111] rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Star size={24} className="text-[#C8FF00]" />
               </div>
               <div>
                  <h3 className="text-3xl font-bold text-gray-900">Community Amenities</h3>
                  <p className="mt-1 text-gray-500">Select and book your preferred facility</p>
               </div>
            </div>
         </div>

         {/* Category Filter Bar */}
         <div className="flex gap-3 mb-12 overflow-x-auto pb-2">
            {categoryFilters.map(filter => (
               <button
                  key={filter.id}
                  onClick={() => setSelectedCategory(filter.id as any)}
                  className="px-6 py-3 rounded-full text-sm font-bold transition-all whitespace-nowrap flex-shrink-0"
                  style={selectedCategory === filter.id ? {
                     backgroundColor: '#111111',
                     color: '#ffffff',
                     boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  } : {
                     backgroundColor: '#ffffff',
                     color: '#6b7280',
                     border: '2px solid #e5e7eb'
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
                  <div className="absolute inset-0 bg-gradient-to-t transition-opacity duration-300" style={{backgroundImage: 'linear-gradient(to top, rgba(17, 17, 17, 0.92), rgba(17, 17, 17, 0.4), transparent)'}}></div>

                  <div className="absolute bottom-0 left-0 p-6 w-full">
                     <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border transition-colors ${
                           getFacilityStatus(facility.id).available
                              ? 'border-[#C8FF00] text-[#C8FF00]'
                              : 'border-[#B0B0B8] text-gray-400'
                        }`} style={{backgroundColor: getFacilityStatus(facility.id).available ? 'rgba(200, 255, 0, 0.15)' : 'rgba(176, 176, 184, 0.15)'}}>
                           {getFacilityStatus(facility.id).status}
                        </span>
                     </div>
                     <h3 className="text-xl font-bold text-white mb-2">{facility.name}</h3>
                     <p className="text-xs mb-4" style={{color: '#B0B0B8'}}>
                        {getFacilityDescription(facility.id)}
                     </p>
                     <div className="flex items-center gap-2 font-bold text-sm group-hover:translate-x-1 transition-transform" style={{color: '#C8FF00'}}>
                        Book Now <ArrowRight size={16} />
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
              <button onClick={closeModal} className="absolute top-6 right-6 p-2.5 rounded-full z-50 transition-colors bg-gray-100 hover:bg-gray-200 text-gray-500">
                <X size={24} />
              </button>
            )}

            {bookingSuccess ? (
              // Success State
              <div className="p-16 flex flex-col items-center justify-center text-center bg-white">
                <div className="w-24 h-24 text-[#111111] rounded-full flex items-center justify-center mb-5 shadow-xl animate-bounce" style={{backgroundColor: '#C8FF00'}}>
                  <Check size={48} />
                </div>
                <h3 className="text-4xl font-bold mb-4 text-gray-900">Booking Confirmed!</h3>
                <p className="text-lg mb-5 max-w-md leading-relaxed text-gray-500">
                  You're all set for <span className="font-bold text-[#111111]">{selectedFacility.name}</span>
                  <br/>
                  <span className="font-bold text-[#111111]">{bookingDate}</span> at <span className="font-bold text-[#111111]">{bookingTime}</span>
                </p>
                <button onClick={closeModal} className="bg-[#111111] hover:bg-[#222222] text-white px-12 py-4 rounded-xl font-bold transition-all shadow-lg">
                  Done
                </button>
              </div>
            ) : (
              // Booking Form
              <div className="relative">
                {/* Header with Image */}
                <div className="relative h-56 overflow-hidden" style={{backgroundColor: '#111111'}}>
                   <img src={getFacilityImage(selectedFacility.id)} className="w-full h-full object-cover opacity-80" alt="Facility" />
                   <div className="absolute inset-0 bg-gradient-to-r" style={{backgroundImage: 'linear-gradient(to right, rgba(17, 17, 17, 1), rgba(34, 34, 34, 0.8), transparent)'}}></div>
                   <div className="absolute bottom-8 left-8 text-white z-10">
                      <h3 className="text-xl font-bold mb-2">{selectedFacility.name}</h3>
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
                        <label className="text-xs font-bold uppercase tracking-widest pl-2 text-gray-400">Select Date</label>
                        <CustomDatePicker
                          required
                          value={bookingDate}
                          onChange={setBookingDate}
                        />
                      </div>

                      {/* Time Slots */}
                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest pl-2 text-gray-400">Select Time Slot</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['09:00', '11:00', '13:00', '15:00', '17:00', '19:00'].map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setBookingTime(time)}
                              className={`py-4 rounded-xl text-sm font-bold transition-all duration-300`}
                              style={bookingTime === time ? {
                                backgroundColor: '#111111',
                                color: '#ffffff',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                border: '2px solid #111111'
                              } : {
                                backgroundColor: '#f9fafb',
                                borderColor: '#e5e7eb',
                                border: '2px solid',
                                color: '#374151'
                              }}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Info Alert */}
                      <div className="border-l-4 p-4 rounded-lg" style={{backgroundColor: '#f9fafb', borderColor: '#111111', color: '#374151'}}>
                        <p className="text-sm font-medium">
                          ⏱️ Bookings are confirmed instantly. You'll receive a QR code for check-in.
                        </p>
                      </div>

                      {/* Submit Button */}
                      <button 
                        type="submit"
                        disabled={isSubmitting || !bookingDate || !bookingTime}
                        className="w-full font-bold py-5 rounded-xl transition-all shadow-lg text-lg transform hover:-translate-y-1 disabled:transform-none text-white"
                        style={{
                          backgroundColor: '#111111',
                          opacity: (isSubmitting || !bookingDate || !bookingTime) ? 0.5 : 1,
                          cursor: (isSubmitting || !bookingDate || !bookingTime) ? 'not-allowed' : 'pointer'
                        }}
                        onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#222222')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#111111')}
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