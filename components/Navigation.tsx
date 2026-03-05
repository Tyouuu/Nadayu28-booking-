import React from 'react';
import {
  Home, Car, Dumbbell, MessageSquare, AlertTriangle,
  Shield, BarChart2, LogOut, Menu, X, User, Settings, ChevronRight
} from 'lucide-react';
import { UserRole } from '../types';

interface NavigationProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  onLogout: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentView, setCurrentView, currentUserRole, setCurrentUserRole,
  isMobileOpen, setIsMobileOpen, onLogout
}) => {
  const navItems = [
    { id: 'dashboard',  label: 'Dashboard',      icon: Home,          roles: [UserRole.RESIDENT, UserRole.SECURITY, UserRole.MANAGEMENT] },
    { id: 'parking',    label: 'Visitor Parking', icon: Car,           roles: [UserRole.RESIDENT] },
    { id: 'amenities',  label: 'Amenities',       icon: Dumbbell,      roles: [UserRole.RESIDENT] },
    { id: 'community',  label: 'Community Board', icon: MessageSquare, roles: [UserRole.RESIDENT] },
    { id: 'report',     label: 'Report Issue',    icon: AlertTriangle, roles: [UserRole.RESIDENT, UserRole.SECURITY] },
    { id: 'security',   label: 'Security Scan',   icon: Shield,        roles: [UserRole.SECURITY] },
    { id: 'management', label: 'Admin Panel',     icon: BarChart2,     roles: [UserRole.MANAGEMENT] },
    { id: 'account',    label: 'My Account',      icon: User,          roles: [UserRole.RESIDENT] },
  ];

  const filtered = navItems.filter(i => i.roles.includes(currentUserRole));
  const handleNav = (id: string) => { setCurrentView(id); setIsMobileOpen(false); };

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#111111] overflow-hidden">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#C8FF00] flex items-center justify-center flex-shrink-0">
            <span className="font-extrabold text-black text-base leading-none">N</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Nadayu28</p>
            <p className="text-[#555] text-[10px] mt-0.5 tracking-wide">Community Portal</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto pb-2">
        <p className="px-3 pt-2 pb-1.5 text-[#444] text-[9px] font-bold uppercase tracking-[0.12em]">Navigation</p>
        {filtered.map(item => {
          const active = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left group ${
                active ? 'bg-[#C8FF00] text-black' : 'text-[#777] hover:text-white hover:bg-white/[0.06]'
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
        <div className="px-3 pb-2">
          <p className="text-[#444] text-[9px] uppercase tracking-[0.12em] font-bold mb-1.5">Switch View</p>
          <select
            className="w-full bg-white/[0.05] text-[#888] text-xs rounded-lg px-2.5 py-2 border border-white/[0.08] outline-none focus:border-[#C8FF00]/40 cursor-pointer appearance-none"
            value={currentUserRole}
            onChange={e => { setCurrentUserRole(e.target.value as UserRole); setCurrentView('dashboard'); }}
          >
            <option value={UserRole.RESIDENT}>Resident</option>
            <option value={UserRole.SECURITY}>Security</option>
            <option value={UserRole.MANAGEMENT}>Management</option>
          </select>
        </div>

        <button
          onClick={() => handleNav('account')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.06] transition-colors group"
        >
          <div className="w-7 h-7 rounded-full bg-[#222] ring-1 ring-white/10 flex items-center justify-center flex-shrink-0">
            <User size={13} className="text-[#666]" />
          </div>
          <div className="flex-1 overflow-hidden text-left">
            <p className="text-white text-xs font-semibold truncate leading-tight">Unit A-12-05</p>
            <p className="text-[#444] text-[10px] uppercase tracking-wide">{currentUserRole}</p>
          </div>
          <Settings size={12} className="text-[#444] group-hover:text-[#666] transition-colors flex-shrink-0" />
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#555] hover:text-[#bbb] hover:bg-white/[0.06] transition-all"
        >
          <LogOut size={15} />
          <span className="text-[13px] font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-100 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-[#C8FF00] rounded-full flex items-center justify-center">
            <span className="font-extrabold text-black text-xs">N</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Nadayu28</span>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-56 flex-shrink-0">
        <div className="fixed inset-y-0 left-0 w-56">
          <Sidebar />
        </div>
      </div>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-56 z-30 md:hidden"><Sidebar /></div>
        </>
      )}
    </>
  );
};
