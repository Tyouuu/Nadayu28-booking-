import React, { useEffect, useState } from "react";
import { Booking, Announcement } from "../types";
import { MOCK_ANNOUNCEMENTS, MOCK_BOOKINGS, USE_MOCK_DATA } from "../constants";
import { fetchBookings, fetchAnnouncements } from "../services/dataService";
import { Bell, Clock, ChevronRight, Activity, ArrowUpRight, Car, Dumbbell, MessageSquare, AlertTriangle, Zap, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useI18n } from "../contexts/I18nContext";

export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { setCurrentView } = useNavigation();
  const { t } = useI18n();
  const [activeBookings, setActiveBookings] = useState<Booking[]>(USE_MOCK_DATA ? MOCK_BOOKINGS.filter(b => b.status === "active") : []);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>(USE_MOCK_DATA ? MOCK_ANNOUNCEMENTS.slice(0, 3) : []);

  useEffect(() => {
    fetchBookings().then(data => setActiveBookings(data.filter(b => b.status === "active"))).catch(() => {});
    fetchAnnouncements().then(data => setRecentAnnouncements(data.slice(0, 3))).catch(() => {});
  }, []);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.dashboard.goodMorning : hour < 18 ? t.dashboard.goodAfternoon : t.dashboard.goodEvening;
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const quickActions = [
    { id: "parking",         label: t.nav.visitorParking, icon: Car,           desc: t.dashboard.bookSlot },
    { id: "invite-visitor",  label: "Invite Visitor",     icon: UserPlus,      desc: "Register a guest" },
    { id: "amenities",       label: t.nav.amenities,       icon: Dumbbell,      desc: t.dashboard.reserveFacilities },
    { id: "community",       label: t.dashboard.community, icon: MessageSquare, desc: t.dashboard.viewBoard },
    { id: "report",          label: t.nav.reportIssue,     icon: AlertTriangle, desc: t.dashboard.submitReport },
  ];

  return (
    <div className="min-h-screen bg-nadayu-bg pb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] text-nadayu-muted uppercase tracking-widest font-semibold mb-1">{today}</p>
          <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">{greeting}, {userProfile?.full_name?.split(' ')[0] || t.dashboard.resident}</h1>
          <p className="text-nadayu-muted text-sm mt-1">{userProfile?.unit ? `Unit ${userProfile.unit} · ` : ''}Nadayu28 Residences</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-nadayu-panel text-white px-4 py-2 rounded-full text-xs font-medium">
          <span className="w-1.5 h-1.5 bg-nadayu-accent rounded-full animate-pulse"></span>
          {t.common.allSystemsOnline}
        </div>
      </div>

      <div className="bg-nadayu-panel rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-sm">{t.dashboard.overview}</h2>
          <span className="text-gray-600 text-xs">{t.common.thisMonth}</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-nadayu-accent rounded-xl p-5 cursor-pointer hover:brightness-95 transition-all" onClick={() => setCurrentView("parking")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-white/70 text-xs font-semibold">{t.dashboard.visitorParking}</span>
              <ArrowUpRight size={14} className="text-white/50" />
            </div>
            <p className="text-white text-[1.6rem] font-bold leading-none mb-1">Unlimited</p>
            <p className="text-white/50 text-xs mt-2">{t.dashboard.accessActive}</p>
          </div>
          <div className="bg-white/[0.06] rounded-xl p-5 cursor-pointer hover:bg-white/[0.1] transition-all" onClick={() => setCurrentView("amenities")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-nadayu-muted text-xs font-semibold">{t.dashboard.activeBookings}</span>
              <ArrowUpRight size={14} className="text-gray-600" />
            </div>
            <p className="text-white text-[1.6rem] font-bold leading-none mb-1">{activeBookings.length}</p>
            <p className="text-gray-500 text-xs mt-2">{t.dashboard.facilitiesReserved}</p>
          </div>
          <div className="bg-white/[0.06] rounded-xl p-5 cursor-pointer hover:bg-white/[0.1] transition-all" onClick={() => setCurrentView("community")}>
            <div className="flex items-center justify-between mb-5">
              <span className="text-nadayu-muted text-xs font-semibold">{t.dashboard.announcements}</span>
              <ArrowUpRight size={14} className="text-gray-600" />
            </div>
            <p className="text-white text-[1.6rem] font-bold leading-none mb-1">{recentAnnouncements.length}</p>
            <p className="text-gray-500 text-xs mt-2">{t.dashboard.communityUpdates}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-6">
        {quickActions.map(action => (
          <button key={action.id} onClick={() => setCurrentView(action.id)} className="group flex items-center gap-3 bg-white border border-nadayu-border rounded-xl px-4 py-3 text-left hover:border-nadayu-accent hover:shadow-sm transition-all duration-200">
            <div className="w-8 h-8 bg-nadayu-cream group-hover:bg-nadayu-accent rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200">
              <action.icon size={15} className="text-gray-500 group-hover:text-white transition-colors duration-200" />
            </div>
            <div>
              <p className="text-gray-900 text-xs font-semibold leading-tight">{action.label}</p>
              <p className="text-nadayu-muted text-[10px] mt-0.5">{action.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <h2 className="text-gray-900 font-semibold text-sm">{t.dashboard.yourSchedule}</h2>
              <button onClick={() => setCurrentView("amenities")} className="text-[11px] text-nadayu-accent font-bold bg-nadayu-panel px-3 py-1.5 rounded-full hover:brightness-110 transition-colors">{t.dashboard.newBooking}</button>
            </div>
            {activeBookings.length > 0 ? (
              <div>
                {activeBookings.map((booking, idx) => (
                  <div key={booking.id} className={"flex items-center gap-4 px-5 py-3.5 hover:bg-nadayu-cream/70 transition-colors cursor-pointer" + (idx !== 0 ? " border-t border-gray-50" : "")}>
                    <div className="flex-shrink-0 w-11 h-11 bg-nadayu-panel rounded-xl flex flex-col items-center justify-center">
                      <span className="text-nadayu-accent text-[9px] font-bold leading-none">{new Date(booking.date).toLocaleDateString(undefined, { month: "short" }).toUpperCase()}</span>
                      <span className="text-white text-base font-bold leading-tight">{new Date(booking.date).getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-semibold capitalize">{booking.facilityType.replace("_", " ")}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-nadayu-muted text-xs"><Clock size={10} /> {booking.startTime}</span>
                        {booking.durationHours && <span className="text-gray-300 text-xs">{booking.durationHours}h</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold bg-nadayu-success/15 text-nadayu-success px-2.5 py-1 rounded-full">{t.dashboard.confirmed}</span>
                      <ChevronRight size={13} className="text-gray-300" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <div className="w-10 h-10 bg-nadayu-cream rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Activity size={18} className="text-gray-300" />
                </div>
                <p className="text-gray-900 text-sm font-semibold mb-1">{t.dashboard.noActiveBookings}</p>
                <p className="text-nadayu-muted text-xs mb-4">{t.dashboard.bookFacilityDesc}</p>
                <button onClick={() => setCurrentView("amenities")} className="inline-flex items-center gap-1.5 px-4 py-2 bg-nadayu-panel text-white rounded-full text-xs font-semibold hover:brightness-110 transition-colors">
                  <Zap size={11} /> {t.dashboard.bookFacility}
                </button>
              </div>
            )}
          </div>

          <div className="bg-white border border-nadayu-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell size={13} className="text-gray-900" />
                <h3 className="text-gray-900 font-semibold text-sm">{t.dashboard.notifications}</h3>
              </div>
              <span className="text-[10px] font-bold text-white bg-nadayu-panel px-2 py-0.5 rounded-full">2 {t.dashboard.newNotif}</span>
            </div>
            <div>
              {[
                { text: "Gymnasium maintenance scheduled tomorrow at 9 AM", time: "2h ago" },
                { text: "Package delivery confirmed at the main lobby", time: "5h ago" },
              ].map((n, i) => (
                <div key={i} className={"flex items-start gap-3 py-3" + (i !== 0 ? " border-t border-gray-50" : "")}>
                  <span className="w-1.5 h-1.5 bg-nadayu-accent rounded-full mt-1.5 flex-shrink-0"></span>
                  <p className="text-gray-600 text-xs flex-1 leading-relaxed">{n.text}</p>
                  <span className="text-gray-300 text-[10px] flex-shrink-0 ml-3">{n.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-semibold text-sm">{t.nav.communityBoard}</h2>
            <button onClick={() => setCurrentView("community")} className="text-nadayu-muted hover:text-gray-700 transition-colors"><ArrowUpRight size={15} /></button>
          </div>
          <div className="space-y-3">
            {recentAnnouncements.map((ann, idx) => {
              const pc = ann.priority === "high" ? "bg-nadayu-panel text-nadayu-accent" : ann.priority === "medium" ? "bg-nadayu-cream text-gray-600" : "bg-nadayu-cream text-nadayu-muted";
              return (
                <div key={ann.id} className="bg-white border border-nadayu-border rounded-xl p-4 cursor-pointer hover:border-nadayu-border hover:shadow-sm transition-all duration-200">
                  {idx === 0 && <div className="w-full h-0.5 bg-nadayu-accent rounded-full mb-3"></div>}
                  <div className="flex items-center justify-between mb-2">
                    <span className={"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full " + pc}>{ann.priority}</span>
                    <span className="text-[10px] text-gray-300">{new Date(ann.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                  </div>
                  <h4 className="text-gray-900 text-xs font-semibold leading-snug mb-1">{ann.title}</h4>
                  <p className="text-nadayu-muted text-[11px] leading-relaxed line-clamp-2">{ann.content}</p>
                </div>
              );
            })}
            <button onClick={() => setCurrentView("report")} className="w-full bg-nadayu-panel rounded-xl p-4 text-left hover:bg-[#181818] transition-colors group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-nadayu-accent text-xs font-semibold">{t.dashboard.reportAnIssue}</span>
                <ArrowUpRight size={12} className="text-gray-600 group-hover:text-nadayu-accent transition-colors" />
              </div>
              <p className="text-gray-500 text-[11px] leading-relaxed">{t.dashboard.reportIssueDesc}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
