'use client';

import React, { useEffect, useState } from "react";
import { Booking, Announcement, UserRole } from "../types";
import { MOCK_ANNOUNCEMENTS, MOCK_BOOKINGS, USE_MOCK_DATA } from "../constants";
import { fetchBookings, fetchAnnouncements, fetchPackages, Package, fetchInvoices, Invoice } from "../services/dataService";
import { Bell, Clock, ChevronRight, Calendar, ArrowUpRight, Car, Package as PackageIcon, Zap, Receipt } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAppNavigate } from "../hooks/useAppNavigate";
import { useI18n } from "../contexts/I18nContext";

export const Dashboard: React.FC = () => {
  const { userProfile, currentUserRole } = useAuth();
  const setCurrentView = useAppNavigate();
  const { t } = useI18n();
  const isBillable = currentUserRole === UserRole.RESIDENT || currentUserRole === UserRole.TENANT;
  const [activeBookings, setActiveBookings] = useState<Booking[]>(USE_MOCK_DATA ? MOCK_BOOKINGS.filter(b => b.status === "active") : []);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>(USE_MOCK_DATA ? MOCK_ANNOUNCEMENTS.slice(0, 3) : []);
  const [waitingPackages, setWaitingPackages] = useState<Package[]>([]);
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(!USE_MOCK_DATA);

  useEffect(() => {
    Promise.all([
      fetchBookings().then(data => setActiveBookings(data.filter(b => b.status === "active"))).catch(() => {}),
      fetchAnnouncements().then(data => setRecentAnnouncements(data.slice(0, 3))).catch(() => {}),
      userProfile?.unit
        ? fetchPackages(userProfile.unit).then(pkgs => setWaitingPackages(pkgs.filter(p => p.status === 'waiting'))).catch(() => {})
        : Promise.resolve(),
      userProfile?.unit && isBillable
        ? fetchInvoices(userProfile.unit).then(invs => setCurrentInvoice(invs[0] ?? null)).catch(() => {})
        : Promise.resolve(),
    ]).finally(() => setIsLoading(false));
  }, [userProfile?.unit, isBillable]);
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const hasAgendaItems = activeBookings.length > 0 || waitingPackages.length > 0;
  const isOverdue = currentInvoice?.status === 'unpaid' && new Date(currentInvoice.dueDate) < new Date();

  return (
    <div className="pb-12">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="text-[11px] text-nadayu-muted uppercase tracking-widest font-semibold mb-1">{today}</p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{isBillable ? `Unit ${userProfile?.unit ?? '—'}` : (userProfile?.full_name || t.dashboard.resident)}</h1>
          <p className="text-nadayu-muted text-sm mt-0.5">{isBillable ? (userProfile?.full_name || t.dashboard.resident) : currentUserRole} · Nadayu28 Residences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Today: unified agenda of bookings + packages, plus a persistent parking-access line */}
          <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
              <h2 className="text-gray-900 font-semibold text-sm">Today</h2>
              <button onClick={() => setCurrentView("amenities")} className="text-[11px] text-nadayu-accent font-bold hover:underline">{t.dashboard.newBooking}</button>
            </div>

            <div className="flex items-center gap-3 px-5 py-3 bg-nadayu-cream/60 border-b border-gray-50">
              <Car size={14} className="text-nadayu-muted flex-shrink-0" />
              <span className="text-xs font-medium text-gray-700 flex-1">{t.dashboard.visitorParking} — access active</span>
              <button onClick={() => setCurrentView("parking")} className="text-[11px] font-bold text-nadayu-accent hover:underline flex-shrink-0">Manage</button>
            </div>

            {isLoading ? (
              <div className="p-5 space-y-3">
                {[0, 1].map(i => <div key={i} className="h-11 bg-nadayu-cream rounded-xl animate-pulse" />)}
              </div>
            ) : hasAgendaItems ? (
              <div>
                {activeBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-nadayu-cream/50 transition-colors cursor-pointer border-t border-gray-50 first:border-t-0" onClick={() => setCurrentView("amenities")}>
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-nadayu-cream flex items-center justify-center">
                      <Calendar size={15} className="text-nadayu-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-semibold capitalize">{booking.facilityType.replace("_", " ")}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-nadayu-muted text-xs"><Clock size={10} /> {new Date(booking.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}, {booking.startTime}</span>
                        {booking.durationHours && <span className="text-gray-300 text-xs">{booking.durationHours}h</span>}
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-nadayu-success flex-shrink-0">{t.dashboard.confirmed}</span>
                  </div>
                ))}
                {waitingPackages.map((pkg) => (
                  <div key={pkg.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-nadayu-cream/50 transition-colors cursor-pointer border-t border-gray-50 first:border-t-0" onClick={() => setCurrentView("packages")}>
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-nadayu-cream flex items-center justify-center">
                      <PackageIcon size={15} className="text-nadayu-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-semibold">Package waiting at the lobby{pkg.courier ? ` · ${pkg.courier}` : ''}</p>
                      {pkg.description && <p className="text-nadayu-muted text-xs mt-0.5">{pkg.description}</p>}
                    </div>
                    <span className="text-[11px] text-nadayu-muted flex-shrink-0">{new Date(pkg.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                    <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center px-5">
                <p className="text-gray-900 text-sm font-semibold mb-1">{t.dashboard.noActiveBookings}</p>
                <p className="text-nadayu-muted text-xs mb-4">{t.dashboard.bookFacilityDesc}</p>
                <button onClick={() => setCurrentView("amenities")} className="inline-flex items-center gap-1.5 px-4 py-2 bg-nadayu-panel text-white rounded-full text-xs font-semibold hover:brightness-110 transition-colors">
                  <Zap size={11} /> {t.dashboard.bookFacility}
                </button>
              </div>
            )}
          </div>

          {isBillable && !isLoading && currentInvoice && (
            <div className={`rounded-2xl overflow-hidden border ${isOverdue ? 'bg-nadayu-danger/5 border-nadayu-danger/30' : 'bg-white border-nadayu-border'}`}>
              <button onClick={() => setCurrentView("billing")} className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-nadayu-cream/40 transition-colors">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-nadayu-cream flex items-center justify-center">
                  <Receipt size={15} className="text-nadayu-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 text-sm font-semibold">Maintenance fee · {currentInvoice.period}</p>
                  <p className={`text-xs mt-0.5 ${isOverdue ? 'text-nadayu-danger font-semibold' : 'text-nadayu-muted'}`}>
                    {currentInvoice.status === 'paid' ? 'Paid' : isOverdue ? `Overdue since ${new Date(currentInvoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : `Due ${new Date(currentInvoice.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`}
                  </p>
                </div>
                <span className="text-gray-900 text-sm font-bold flex-shrink-0">RM {currentInvoice.amount.toFixed(2)}</span>
                <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
              </button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900 font-semibold text-sm">{t.nav.communityBoard}</h2>
            <button onClick={() => setCurrentView("community")} className="text-nadayu-muted hover:text-gray-700 transition-colors"><ArrowUpRight size={15} /></button>
          </div>
          <div className="space-y-3">
            {isLoading && (
              [0, 1].map(i => <div key={i} className="h-20 bg-white border border-nadayu-border rounded-xl animate-pulse" />)
            )}
            {!isLoading && recentAnnouncements.length === 0 && (
              <div className="bg-white border border-nadayu-border rounded-xl p-6 text-center">
                <Bell size={20} className="text-gray-300 mx-auto mb-2" />
                <p className="text-nadayu-muted text-xs">No announcements yet.</p>
              </div>
            )}
            {recentAnnouncements.map((ann) => {
              const pc = ann.priority === "high" ? "bg-nadayu-danger/10 text-nadayu-danger" : "bg-nadayu-cream text-nadayu-muted";
              return (
                <div key={ann.id} className="bg-white border border-nadayu-border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all duration-200" onClick={() => setCurrentView("community")}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={"text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full " + pc}>{ann.priority}</span>
                    <span className="text-[10px] text-gray-300">{new Date(ann.date).toLocaleDateString(undefined, { day: "numeric", month: "short" })}</span>
                  </div>
                  <h4 className="text-gray-900 text-xs font-semibold leading-snug mb-1">{ann.title}</h4>
                  <p className="text-nadayu-muted text-[11px] leading-relaxed line-clamp-2">{ann.content}</p>
                </div>
              );
            })}
            <button onClick={() => setCurrentView("report")} className="w-full bg-nadayu-panel rounded-xl p-4 text-left hover:brightness-125 transition-all">
              <span className="text-nadayu-accent text-xs font-semibold block mb-1">{t.dashboard.reportAnIssue}</span>
              <p className="text-gray-500 text-[11px] leading-relaxed">{t.dashboard.reportIssueDesc}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
