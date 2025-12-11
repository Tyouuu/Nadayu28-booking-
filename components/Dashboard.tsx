import React from 'react';
import { UserRole } from '../types';
import { MOCK_ANNOUNCEMENTS, MOCK_BOOKINGS } from '../constants';
import { Calendar, Bell, Clock, ChevronRight, Activity, ArrowUpRight, CheckCircle2, MapPin } from 'lucide-react';

interface DashboardProps {
  userRole: UserRole;
  setCurrentView: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userRole, setCurrentView }) => {
  const activeBookings = MOCK_BOOKINGS.filter(b => b.status === 'active');
  const recentAnnouncements = MOCK_ANNOUNCEMENTS.slice(0, 2);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <div className="space-y-10 animate-fade-in pb-12">
      
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-80 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-indigo-900/10 group">
        <img 
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&q=80&w=2000" 
          alt="Luxury Interior" 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white max-w-2xl">
          <div className="flex items-center gap-2 mb-2 text-indigo-300 text-sm font-bold tracking-widest uppercase">
            <span className="w-8 h-[2px] bg-indigo-400"></span>
            <span>Residence Portal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {getGreeting()}, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-indigo-200">Alex Tan</span>
          </h1>
          <div className="flex items-center gap-4 text-slate-300 text-sm md:text-base backdrop-blur-md bg-white/10 w-fit px-4 py-2 rounded-full border border-white/10">
             <MapPin size={16} className="text-indigo-400" />
             <span>Unit A-12-05, Nadayu28 Residences</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Stats & Actions) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Parking Status Card */}
            <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 cursor-pointer" onClick={() => setCurrentView('parking')}>
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
               <div className="relative z-10">
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 mb-6">
                   <Calendar size={24} />
                 </div>
                 <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider mb-1">Visitor Parking</h3>
                 <div className="flex items-center gap-3 mb-2">
                   <span className="text-3xl font-bold text-slate-800">Unlimited</span>
                   <CheckCircle2 className="text-green-500" size={24} />
                 </div>
                 <p className="text-slate-400 text-sm">Access granted for Unit A-12-05</p>
               </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-900/20 text-white relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
               <div className="relative z-10">
                 <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10">
                     <Bell size={24} />
                   </div>
                   <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">2 New</span>
                 </div>
                 <h3 className="text-indigo-200 text-sm font-bold uppercase tracking-wider mb-3">Recent Updates</h3>
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                      <span>Gym maintenance tomorrow</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                      <span>Package arrived at lobby</span>
                    </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Active Bookings Section */}
          <div>
            <div className="flex items-center justify-between mb-6 px-2">
              <h3 className="text-2xl font-bold text-slate-800">Your Schedule</h3>
              <button className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1">
                View Calendar <ChevronRight size={16} />
              </button>
            </div>
            
            <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
              {activeBookings.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {activeBookings.map(booking => (
                    <div key={booking.id} className="p-6 flex items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                           <span className="text-2xl font-bold">{new Date(booking.date).getDate()}</span>
                           <span className="text-xs uppercase font-bold tracking-wide opacity-60">{new Date(booking.date).toLocaleDateString(undefined, {month: 'short'})}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-md tracking-wide">Confirmed</span>
                          <span className="text-sm text-slate-400 font-medium flex items-center gap-1">
                            <Clock size={14} /> {booking.startTime} ({booking.durationHours}h)
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 capitalize mb-1">{booking.facilityType.replace('_', ' ')}</h4>
                        {booking.details && (
                          <p className="text-sm text-slate-500">Details: <span className="font-mono text-slate-700 font-medium">{booking.details}</span></p>
                        )}
                      </div>
                      <div className="hidden sm:block">
                        <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all">
                          <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Activity size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">No Active Bookings</h4>
                  <p className="text-slate-400 text-sm mt-1">You're all caught up! Book a facility to get started.</p>
                  <button onClick={() => setCurrentView('amenities')} className="mt-6 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-indigo-600 transition-colors shadow-lg">
                    Book Facility
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Announcements) */}
        <div className="lg:col-span-4 space-y-8">
           <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-xl font-bold text-slate-800">Community Board</h3>
           </div>
           
           <div className="space-y-4">
             {recentAnnouncements.map((announcement, idx) => (
               <div key={announcement.id} className="bg-white p-6 rounded-[2rem] shadow-lg shadow-slate-200/50 border border-slate-100 hover:shadow-xl transition-shadow cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        announcement.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 
                        announcement.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                     }`}>
                        {announcement.priority} Priority
                     </span>
                     <span className="text-xs font-bold text-slate-400">{new Date(announcement.date).toLocaleDateString(undefined, {day: 'numeric', month: 'short'})}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-2 group-hover:text-indigo-600 transition-colors leading-snug">
                    {announcement.title}
                  </h4>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {announcement.content}
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600">
                    Read More <ArrowUpRight size={14} className="ml-1" />
                  </div>
               </div>
             ))}

             <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2rem] shadow-xl text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <h4 className="font-bold text-xl mb-2 relative z-10">Have Feedback?</h4>
                <p className="text-indigo-100 text-sm mb-6 relative z-10">Help us improve your living experience.</p>
                <button onClick={() => setCurrentView('report')} className="relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors w-full shadow-lg">
                  Submit Report
                </button>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
};