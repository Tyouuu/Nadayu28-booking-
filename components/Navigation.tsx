'use client';

import React from 'react';
import {
  Home, Car, Dumbbell, MessageSquare, AlertTriangle,
  Shield, BarChart2, LogOut, User, Settings, ChevronRight, Globe, UserPlus, Wrench, FolderOpen, Receipt, Package as PackageIcon
} from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useI18n, LOCALE_LABELS } from '../contexts/I18nContext';
import { Locale } from '../i18n/types';
import { MobileTabBar } from './MobileTabBar';

export const Navigation: React.FC = () => {
  const { currentUserRole, logout } = useAuth();
  const pathname = usePathname();
  const currentView = pathname.slice(1);
  const navigate = useAppNavigate();
  const { locale, t, setLocale } = useI18n();

  const navItems = [
    { id: 'dashboard',    label: t.nav.dashboard,      icon: Home,          roles: [UserRole.RESIDENT, UserRole.TENANT, UserRole.SECURITY, UserRole.MANAGEMENT] },
    { id: 'documents',    label: 'Documents',          icon: FolderOpen,    roles: [UserRole.RESIDENT, UserRole.TENANT, UserRole.SECURITY, UserRole.MANAGEMENT] },
    { id: 'billing',      label: 'Billing',            icon: Receipt,       roles: [UserRole.RESIDENT, UserRole.TENANT] },
    { id: 'packages',     label: 'Packages',           icon: PackageIcon,   roles: [UserRole.RESIDENT, UserRole.TENANT, UserRole.SECURITY, UserRole.MANAGEMENT] },
    { id: 'parking',      label: t.nav.visitorParking,  icon: Car,           roles: [UserRole.RESIDENT, UserRole.TENANT] },
    { id: 'invite-visitor', label: 'Invite Visitor',    icon: UserPlus,      roles: [UserRole.RESIDENT, UserRole.TENANT] },
    { id: 'amenities',    label: t.nav.amenities,       icon: Dumbbell,      roles: [UserRole.RESIDENT, UserRole.TENANT] },
    { id: 'community',    label: t.nav.communityBoard,  icon: MessageSquare, roles: [UserRole.RESIDENT, UserRole.TENANT] },
    { id: 'report',       label: t.nav.reportIssue,     icon: AlertTriangle, roles: [UserRole.RESIDENT, UserRole.TENANT, UserRole.SECURITY] },
    { id: 'maintenance',  label: 'Maintenance',         icon: Wrench,        roles: [UserRole.SECURITY, UserRole.MANAGEMENT] },
    { id: 'security',     label: t.nav.securityScan,    icon: Shield,        roles: [UserRole.SECURITY] },
    { id: 'management',   label: t.nav.adminPanel,      icon: BarChart2,     roles: [UserRole.MANAGEMENT] },
    { id: 'account',      label: t.nav.myAccount,       icon: User,          roles: [UserRole.RESIDENT, UserRole.TENANT] },
    { id: 'sec-profile',  label: t.nav.profile,         icon: User,          roles: [UserRole.SECURITY] },
    { id: 'mgmt-profile', label: t.nav.profile,         icon: User,          roles: [UserRole.MANAGEMENT] },
  ];

  const filtered = navItems.filter(i => i.roles.includes(currentUserRole));

  const locales: Locale[] = ['en', 'ms', 'zh'];
  const nextLocale = locales[(locales.indexOf(locale) + 1) % locales.length];

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-nadayu-panel overflow-hidden">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-nadayu-accent flex items-center justify-center flex-shrink-0">
            <span className="font-extrabold text-white text-base leading-none">N</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Nadayu28</p>
            <p className="text-slate-500 text-[10px] mt-0.5 tracking-wide">Community Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        <p className="px-3 pt-2 pb-1.5 text-slate-500 text-[9px] font-bold uppercase tracking-[0.12em]">Navigation</p>
        {filtered.map(item => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group ${
                active ? 'bg-nadayu-accent text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <item.icon size={17} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
              <span className="text-[13px] font-medium flex-1">{item.label}</span>
              {active && <ChevronRight size={13} className="flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3 space-y-1">
        {/* Language Switcher */}
        <button
          onClick={() => setLocale(nextLocale)}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
        >
          <Globe size={15} className="text-slate-400 flex-shrink-0" />
          <span className="text-[13px] font-medium text-slate-400 flex-1">{LOCALE_LABELS[locale]}</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase">{locale.toUpperCase()}</span>
        </button>

        <button
          onClick={() => navigate('account')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-slate-400" />
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="text-white text-xs font-semibold truncate leading-tight">Unit A-12-05</p>
            <p className="text-slate-500 text-[10px] uppercase tracking-wide">{currentUserRole}</p>
          </div>
          <Settings size={12} className="text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
        </button>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-white/[0.06] transition-all"
        >
          <LogOut size={15} />
          <span className="text-[13px] font-medium">{t.nav.signOut}</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-nadayu-border z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-nadayu-accent rounded-full flex items-center justify-center">
            <span className="font-extrabold text-white text-xs">N</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Nadayu28</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setLocale(nextLocale)} className="p-1.5 rounded-lg text-nadayu-muted hover:bg-nadayu-cream transition-colors text-xs font-bold uppercase">
            {locale}
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-48 flex-shrink-0">
        <div className="fixed inset-y-0 left-0 w-48">
          <Sidebar />
        </div>
      </div>

      {/* Mobile bottom tab bar */}
      <MobileTabBar />
    </>
  );
};
