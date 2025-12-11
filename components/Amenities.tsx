import React, { useState } from 'react';
import { FACILITIES } from '../constants';
import { Clock, Check, X, Calendar, AlertCircle, ArrowRight, ArrowUpRight } from 'lucide-react';
import { FacilityType } from '../types';

export const Amenities: React.FC = () => {
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  
  const getFacilityImage = (type: FacilityType) => {
    switch (type) {
      case FacilityType.GYM:
        return 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=2000';
      case FacilityType.BBQ:
        return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=2000';
      case FacilityType.PARTY_ROOM:
        return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000';
      case FacilityType.TENNIS:
        return 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=2000';
      case FacilityType.SWIMMING_POOL:
        return 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&q=80&w=2000';
      case FacilityType.SQUASH_COURT:
        return 'https://images.unsplash.com/photo-1554068865-24859e3c93a8?auto=format&fit=crop&q=80&w=2000';
      case FacilityType.MULTI_PURPOSE_COURT:
        return 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&q=80&w=2000';
      default:
        return 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&q=80&w=2000';
    }
  };

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
    <div className="animate-fade-in pb-20">
      
      {/* Hero Section */}
      <div className="relative w-full h-[500px] rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-900/10 mb-16 group">
         <img 
            src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=2000" 
            alt="Tennis Court" 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-[2s]"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
         <div className="absolute bottom-0 left-0 p-12 md:p-16 max-w-3xl text-white">
            <span className="px-4 py-2 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest border border-white/20 mb-6 inline-block">
               Premier Facility
            </span>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
               Refresh, Relax, and <br/>
               <span className="text-indigo-300">Rediscover.</span>
            </h1>
            <p className="text-lg text-slate-200 mb-8 max-w-xl leading-relaxed">
               Experience our newly renovated tennis courts and multi-purpose halls. 
               Rediscover the beauty in life's simplest pleasures.
            </p>
            <div className="flex gap-4">
               <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2">
                  Explore More <ArrowRight size={18} />
               </button>
            </div>
         </div>
      </div>

      {/* Facilities Grid */}
      <div className="max-w-7xl mx-auto">
         <div className="flex items-end justify-between mb-10 px-4">
            <div>
               <h3 className="text-3xl font-bold text-slate-900">Explore Our Facilities</h3>
               <p className="text-slate-500 mt-2">Premium courts for both individual and group training.</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-sm font-bold text-slate-900 bg-white border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors">
               View All <ArrowUpRight size={16} />
            </button>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                     group relative h-96 rounded-[2.5rem] overflow-hidden cursor-pointer shadow-lg shadow-slate-200/50
                     ${idx === 0 || idx === 3 ? 'md:col-span-2' : ''} 
                  `}
               >
                  <img 
                     src={getFacilityImage(facility.id)} 
                     alt={facility.name} 
                     className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent transition-opacity duration-300"></div>
                  
                  {/* Content Overlay */}
                  <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0">
                     <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white hover:bg-white hover:text-slate-900 transition-colors">
                        <ArrowUpRight size={24} />
                     </div>
                  </div>

                  <div className="absolute bottom-0 left-0 p-8 w-full">
                     <span className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-2 block">Unlimited Access</span>
                     <h3 className="text-3xl font-bold text-white mb-2">{facility.name}</h3>
                     <p className="text-slate-300 text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75">
                        Tap to book your slot now. Instant confirmation available.
                     </p>
                  </div>
               </div>
            ))}
         </div>
      </div>

      {/* Booking Modal */}
      {selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-scale-in relative flex flex-col md:flex-row h-[600px] md:h-auto">
            
            {!bookingSuccess && (
              <button onClick={closeModal} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full text-slate-800 z-50 transition-colors">
                <X size={24} />
              </button>
            )}

            {bookingSuccess ? (
              <div className="w-full p-16 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-green-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-200 animate-bounce">
                  <Check size={48} />
                </div>
                <h3 className="text-3xl font-bold text-slate-800 mb-4">Confirmed!</h3>
                <p className="text-slate-500 text-lg mb-8 max-w-md">
                  You're all set for <span className="text-slate-900 font-bold">{selectedFacility.name}</span> on <span className="text-slate-900 font-bold">{bookingDate}</span> at <span className="text-slate-900 font-bold">{bookingTime}</span>.
                </p>
                <button onClick={closeModal} className="bg-slate-900 text-white px-12 py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg">
                  Done
                </button>
              </div>
            ) : (
              <>
                {/* Visual Side */}
                <div className="w-full md:w-2/5 relative h-48 md:h-auto">
                   <img src={getFacilityImage(selectedFacility.id)} className="w-full h-full object-cover" alt="Facility" />
                   <div className="absolute inset-0 bg-slate-900/30"></div>
                   <div className="absolute bottom-8 left-8 text-white">
                      <h3 className="text-3xl font-bold">{selectedFacility.name}</h3>
                      <p className="opacity-80">Unit A-12-05</p>
                   </div>
                </div>

                {/* Form Side */}
                <div className="flex-1 p-8 md:p-12 overflow-y-auto">
                   <h4 className="text-xl font-bold text-slate-800 mb-8">Select a Time Slot</h4>
                   <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Date</label>
                        <input 
                          type="date" 
                          required
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700 text-lg"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Time</label>
                        <div className="grid grid-cols-3 gap-3">
                          {['10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setBookingTime(time)}
                              className={`py-3 rounded-xl text-sm font-bold transition-all ${
                                bookingTime === time 
                                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                  : 'bg-white border border-slate-200 text-slate-600 hover:border-indigo-400'
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3">
                        <AlertCircle className="text-amber-600 flex-shrink-0" size={20} />
                        <p className="text-xs text-amber-800 leading-relaxed font-medium">
                          Any damages caused will be charged to the resident's account. No deposit required.
                        </p>
                      </div>

                      <button 
                        type="submit"
                        disabled={isSubmitting || !bookingDate || !bookingTime}
                        className="w-full bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-xl hover:shadow-indigo-500/30 text-lg"
                      >
                        {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                      </button>
                   </form>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};