import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { MOCK_ANNOUNCEMENTS, MOCK_BOOKINGS } from '../constants';
import { Calendar, Bell, Clock, ChevronRight, Activity, ArrowUpRight, CheckCircle2, MapPin, Zap, TrendingUp, Star } from 'lucide-react';

interface DashboardProps {
  userRole: UserRole;
  setCurrentView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole, setCurrentView }) => {
  const [animateStats, setAnimateStats] = useState(false);
  const activeBookings = MOCK_BOOKINGS.filter(b => b.status === 'active');
  const recentAnnouncements = MOCK_ANNOUNCEMENTS.slice(0, 2);

  useEffect(() => {
    const timer = setTimeout(() => setAnimateStats(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Animated Background Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#E6B325]/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      <div className="absolute top-96 right-0 w-96 h-96 bg-[#E6B325]/10 rounded-full blur-[100px] -z-10 animate-pulse"></div>
      
      {/* Hero Section - Enhanced */}
      <div className="relative w-full h-72 md:h-96 rounded-3xl overflow-hidden shadow-2xl group">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2000" 
            alt="Luxury Interior" 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1200 ease-out"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1A2E]/95 via-[#2D2B55]/60 to-[#2D2B55]/20 backdrop-blur-[2px]"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-8 right-8 w-32 h-32 bg-[#E6B325] rounded-full blur-[80px] opacity-40 animate-pulse"></div>
        
        <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white max-w-3xl z-10">
          <div className="inline-flex items-center gap-2 mb-4 text-[#E6B325] text-xs font-bold tracking-widest uppercase px-4 py-2 bg-[#E6B325]/10 backdrop-blur-md rounded-full border border-[#E6B325]/20">
            <Zap size={14} />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight">
            {getGreeting()},
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold mb-8">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E6B325] via-white to-[#F5D547]">
              Alex Tan
            </span>
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 text-[#F5F5F7] backdrop-blur-lg bg-white/10 px-6 py-3 rounded-full border border-white/20 hover:bg-white/15 transition-all cursor-pointer">
               <MapPin size={18} className="text-[#E6B325]" />
               <span className="font-medium">Unit A-12-05, Nadayu28 Residences</span>
            </div>
            <div className="flex items-center gap-2 text-[#F5F5F7] backdrop-blur-lg bg-white/10 px-4 py-3 rounded-full border border-white/20">
               <Star size={16} className="text-[#E6B325] fill-[#E6B325]" />
               <span className="text-sm font-bold">Premium Member</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Stats & Actions) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Stats Row - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parking Status Card */}
            <div className={`relative group cursor-pointer overflow-hidden rounded-3xl transition-all duration-500 ${animateStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`} onClick={() => setCurrentView('parking')}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#3D3B65]/20 via-[#F5F5F7] to-[#3D3B65]/10 group-hover:from-[#E6B325]/20 group-hover:to-[#E6B325]/10 transition-colors duration-300"></div>
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#E6B325] rounded-full blur-[80px] opacity-0 group-hover:opacity-20 transition-opacity duration-500 -mr-20 -mt-20"></div>
              
              <div className="relative z-10 p-8 lg:p-10 h-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#E6B325] to-[#D4A017] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-[#E6B325]/30 group-hover:scale-110 group-hover:shadow-2xl transition-all duration-300">
                    <Calendar size={28} />
                  </div>
                  <div className="px-4 py-2 bg-[#E6B325]/20 text-[#E6B325] text-xs font-bold rounded-full tracking-wider uppercase shadow-lg">Active</div>
                </div>
                <h3 className="text-[#B0B0B8] text-sm font-bold uppercase tracking-widest mb-3">Visitor Parking</h3>
                <div className="mb-6">
                  <p className="text-4xl font-black text-[#2D2B55] tracking-tight">Unlimited</p>
                  <p className="text-[#E6B325] text-sm font-bold mt-2 flex items-center gap-2">
                    <CheckCircle2 size={16} className="flex-shrink-0" />
                    Access granted for your unit
                  </p>
                </div>
                <p className="text-[#B0B0B8] text-sm leading-relaxed">Enjoy unlimited parking access with advanced booking system.</p>
                <div className="mt-6 pt-6 border-t border-[#4A4860]/50 flex items-center text-[#E6B325] font-bold text-sm group-hover:translate-x-1 transition-transform">
                  View Details <ChevronRight size={16} className="ml-2" />
                </div>
              </div>
              
              <div className="absolute inset-0 border border-gradient-to-r from-[#E6B325]/50 to-transparent rounded-3xl group-hover:border-[#E6B325]/50 transition-colors duration-300"></div>
            </div>

            {/* Notifications Card - Enhanced */}
            <div className={`relative group overflow-hidden rounded-3xl transition-all duration-500 delay-100 ${animateStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] group-hover:via-[#E6B325]/10 transition-colors duration-500"></div>
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#E6B325] rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-500 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#E6B325] rounded-full blur-[60px] opacity-10 -ml-16 -mb-16"></div>
              </div>
              
              <div className="relative z-10 p-8 lg:p-10 text-white h-full">
                <div className="flex items-center justify-between mb-8">
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 group-hover:border-white/30 transition-all duration-300">
                    <Bell size={24} className="text-[#E6B325]" />
                  </div>
                  <span className="px-3 py-1 bg-[#E6B325]/90 text-white text-xs font-bold rounded-full tracking-wider shadow-lg animate-pulse">2 New</span>
                </div>
                <h3 className="text-[#F5D547] text-sm font-bold uppercase tracking-widest mb-6">Latest Updates</h3>
                <div className="space-y-4">
                   <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                     <span className="w-2 h-2 bg-[#E6B325] rounded-full mt-2 flex-shrink-0"></span>
                     <span className="text-sm text-[#F5F5F7] font-medium leading-relaxed">Gymnasium scheduled for maintenance tomorrow at 9 AM</span>
                   </div>
                   <div className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                     <span className="w-2 h-2 bg-[#E6B325] rounded-full mt-2 flex-shrink-0"></span>
                     <span className="text-sm text-[#F5F5F7] font-medium leading-relaxed">Package delivery confirmed at main lobby</span>
                   </div>
                </div>
                <div className="mt-6 pt-6 border-t border-white/10 flex items-center text-[#F5D547] font-bold text-sm group-hover:translate-x-1 transition-transform">
                  View All <ChevronRight size={16} className="ml-2" />
                </div>
              </div>
            </div>
          </div>

          {/* Active Bookings Section - Enhanced */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-3xl font-bold text-[#2D2B55] mb-2">Your Schedule</h3>
                <p className="text-[#B0B0B8] text-sm">Manage and track your facility bookings</p>
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E6B325] to-[#D4A017] text-white rounded-xl font-bold text-sm hover:from-[#F5D547] hover:to-[#E6B325] hover:shadow-xl transition-all duration-300 shadow-lg">
                <Calendar size={16} />
                View Calendar
              </button>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl border border-[#4A4860]/50 overflow-hidden">
              {activeBookings.length > 0 ? (
                <div className="divide-y divide-[#4A4860]/50">
                  {activeBookings.map((booking, idx) => (
                    <div key={booking.id} className={`p-8 flex items-center gap-8 hover:bg-[#E6B325]/10 transition-all duration-300 group ${idx % 2 === 0 ? '' : ''}`}>
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-[#E6B325]/20 to-[#D4A017]/20 rounded-2xl flex flex-col items-center justify-center border-2 border-[#E6B325]/30 group-hover:border-[#E6B325]/60 group-hover:from-[#E6B325]/30 group-hover:to-[#D4A017]/30 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                           <span className="text-3xl font-black text-[#2D2B55]">{new Date(booking.date).getDate()}</span>
                           <span className="text-xs uppercase font-bold tracking-wider text-[#E6B325]">{new Date(booking.date).toLocaleDateString(undefined, {month: 'short'})}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="px-3 py-1 bg-[#E6B325]/20 text-[#E6B325] text-xs font-bold uppercase rounded-full tracking-wider shadow-md">Confirmed</span>
                          <span className="px-3 py-1 bg-[#E6B325]/10 text-[#D4A017] text-xs font-bold uppercase rounded-full tracking-wider flex items-center gap-1">
                            <Clock size={12} /> {booking.startTime}
                          </span>
                          <span className="text-xs font-bold text-[#B0B0B8] bg-[#4A4860]/10 px-3 py-1 rounded-full">
                            {booking.durationHours}h duration
                          </span>
                        </div>
                        <h4 className="text-xl font-bold text-[#2D2B55] capitalize mb-2 group-hover:text-[#E6B325] transition-colors">{booking.facilityType.replace('_', ' ')}</h4>
                        {booking.details && (
                          <p className="text-sm text-[#B0B0B8] flex items-center gap-2">
                            <span className="text-[#4A4860]">Details:</span>
                            <code className="bg-[#4A4860]/10 px-3 py-1 rounded-lg text-[#2D2B55] font-mono font-medium">{booking.details}</code>
                          </p>
                        )}
                      </div>
                      <div className="hidden lg:flex items-center gap-4">
                        <button className="px-4 py-3 rounded-xl border border-[#4A4860]/50 text-[#B0B0B8] hover:border-[#E6B325] hover:text-[#E6B325] hover:bg-[#E6B325]/10 transition-all font-bold text-sm">
                          Reschedule
                        </button>
                        <button className="w-12 h-12 rounded-full border-2 border-[#4A4860]/50 flex items-center justify-center text-[#B0B0B8] hover:bg-gradient-to-br hover:from-[#E6B325] hover:to-[#D4A017] hover:text-white hover:border-[#E6B325] transition-all duration-300 group-hover:shadow-lg">
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center">
                  <div className="w-28 h-28 bg-gradient-to-br from-[#4A4860]/10 to-[#4A4860]/5 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Activity size={48} className="text-[#B0B0B8]" />
                  </div>
                  <h4 className="text-2xl font-bold text-[#2D2B55] mb-2">No Active Bookings</h4>
                  <p className="text-[#B0B0B8] text-base mb-8 max-w-sm mx-auto">You're all caught up! Book a facility or amenity to get started with your schedule.</p>
                  <button onClick={() => setCurrentView('amenities')} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#E6B325] to-[#D4A017] text-white rounded-xl font-bold text-base hover:shadow-2xl hover:from-[#F5D547] hover:to-[#E6B325] transition-all duration-300 shadow-xl">
                    <Zap size={18} />
                    Book a Facility
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Announcements) - Enhanced */}
        <div className="lg:col-span-4 space-y-8">
           <div>
              <h3 className="text-3xl font-bold text-[#2D2B55] mb-2">Community Board</h3>
              <p className="text-[#B0B0B8] text-sm">Latest announcements and updates</p>
           </div>
           
           <div className="space-y-5">
             {recentAnnouncements.map((announcement, idx) => (
               <div key={announcement.id} className={`relative group cursor-pointer overflow-hidden rounded-3xl border border-[#4A4860]/50 transition-all duration-500 hover:shadow-xl ${
                  idx === 0 ? 'delay-150' : 'delay-200'
               } ${animateStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                  <div className="absolute inset-0 bg-white group-hover:from-[#E6B325]/10 group-hover:to-white transition-colors duration-300"></div>
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E6B325] via-[#D4A017] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  <div className="relative z-10 p-7">
                     <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border-2 ${
                           announcement.priority === 'high' ? 'bg-[#E6B325]/20 text-[#D4A017] border-[#E6B325]/50' : 
                           announcement.priority === 'medium' ? 'bg-[#E6B325]/10 text-[#E6B325] border-[#E6B325]/30' :
                           'bg-[#4A4860]/20 text-[#2D2B55] border-[#4A4860]/50'
                        }`}>
                           {announcement.priority} Priority
                        </span>
                        <span className="text-xs font-bold text-[#B0B0B8]">{new Date(announcement.date).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}</span>
                     </div>
                     <h4 className="font-bold text-[#2D2B55] text-lg mb-3 group-hover:text-[#E6B325] transition-colors leading-snug">
                       {announcement.title}
                     </h4>
                     <p className="text-sm text-[#B0B0B8] leading-relaxed mb-4">
                       {announcement.content}
                     </p>
                     <div className="pt-4 border-t border-[#4A4860]/20 flex items-center text-sm font-bold text-[#E6B325] group-hover:text-[#D4A017] group-hover:translate-x-1 transition-transform duration-300">
                       Read Full Article <ArrowUpRight size={14} className="ml-2" />
                     </div>
                  </div>
               </div>
             ))}

             {/* Feedback CTA Card */}
             <div className={`relative group overflow-hidden rounded-3xl transition-all duration-500 delay-300 ${animateStats ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-[#E6B325] via-[#D4A017] to-[#2D2B55] group-hover:via-[#F5D547] transition-all duration-500"></div>
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl group-hover:w-48 group-hover:h-48 transition-all duration-500"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-3xl"></div>
                </div>
                
                <div className="relative z-10 p-8 text-center text-white">
                   <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 group-hover:bg-white/30 transition-all">
                     <Zap size={28} className="text-white" />
                   </div>
                   <h4 className="font-bold text-xl mb-3">Share Your Feedback</h4>
                   <p className="text-white/80 text-sm mb-6">Help us improve your living experience with your valuable suggestions.</p>
                   <button onClick={() => setCurrentView('report')} className="w-full bg-white text-[#E6B325] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#F5F5F7] transition-all duration-300 shadow-xl hover:shadow-2xl group-hover:scale-105">
                     Submit Report
                   </button>
                </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};