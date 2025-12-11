import React from 'react';
import { 
  Home, 
  Car, 
  Dumbbell, 
  MessageSquare, 
  AlertTriangle, 
  Shield, 
  BarChart2, 
  LogOut,
  Menu,
  X,
  User,
  Settings,
  ChevronRight
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
  currentView, 
  setCurrentView, 
  currentUserRole, 
  setCurrentUserRole,
  isMobileOpen,
  setIsMobileOpen,
  onLogout
}) => {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, roles: [UserRole.RESIDENT, UserRole.SECURITY, UserRole.MANAGEMENT] },
    { id: 'parking', label: 'Visitor Parking', icon: Car, roles: [UserRole.RESIDENT] },
    { id: 'amenities', label: 'Amenities', icon: Dumbbell, roles: [UserRole.RESIDENT] },
    { id: 'community', label: 'Community Board', icon: MessageSquare, roles: [UserRole.RESIDENT] },
    { id: 'report', label: 'Report Issue', icon: AlertTriangle, roles: [UserRole.RESIDENT, UserRole.SECURITY] },
    { id: 'security', label: 'Security Scan', icon: Shield, roles: [UserRole.SECURITY] },
    { id: 'management', label: 'Admin Panel', icon: BarChart2, roles: [UserRole.MANAGEMENT] },
    { id: 'account', label: 'My Account', icon: User, roles: [UserRole.RESIDENT] },
  ];

  const filteredItems = navItems.filter(item => item.roles.includes(currentUserRole));

  const handleNavClick = (viewId: string) => {
    setCurrentView(viewId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Header with Glass Effect */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 z-30 flex items-center justify-between px-6 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">N</div>
          <div>
            <span className="font-bold text-lg text-slate-800 tracking-tight block leading-none">Nadayu28</span>
            <span className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Portal</span>
          </div>
        </div>
        <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="p-2 bg-slate-100 rounded-full text-slate-600 hover:text-indigo-600 transition-colors">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-20 w-80 bg-slate-900 text-white transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-[10px_0_30px_-10px_rgba(0,0,0,0.3)] ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col overflow-hidden`}>
        
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-slate-900 via-[#0f172a] to-[#020617] z-0"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[80px] -mr-32 -mt-32 z-0"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px] -ml-32 -mb-32 z-0"></div>

        {/* Logo Area */}
        <div className="relative z-10 p-8 pb-6">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-500/20 ring-1 ring-white/10">
              N
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Nadayu28</h1>
              <div className="flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                 <p className="text-slate-400 text-xs font-medium tracking-wide uppercase">Community Portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="relative z-10 flex-1 mt-4 px-4 space-y-2 overflow-y-auto scrollbar-hide">
          <div className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-widest">Menu</div>
          {filteredItems.map(item => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-white/10 text-white shadow-lg backdrop-blur-sm border border-white/5' 
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-400 rounded-l-2xl"></div>
                )}
                <item.icon 
                  size={22} 
                  className={`${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]' : 'text-slate-500 group-hover:text-slate-300'} transition-all duration-300`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className={`font-medium tracking-wide ${isActive ? 'translate-x-1' : ''} transition-transform duration-300`}>{item.label}</span>
                {isActive && <ChevronRight size={16} className="ml-auto text-indigo-400 opacity-80" />}
              </button>
            )
          })}
        </nav>

        {/* User Profile / Role Switcher */}
        <div className="relative z-10 p-4 m-4 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 shadow-xl">
          <button 
            onClick={() => handleNavClick('account')}
            className="flex items-center gap-3 mb-4 p-2 w-full text-left group transition-colors rounded-xl hover:bg-white/5"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center ring-2 ring-slate-800 group-hover:ring-indigo-500/50 transition-all">
                <User size={18} className="text-slate-300 group-hover:text-indigo-300"/>
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-bold text-white truncate group-hover:text-indigo-300 transition-colors">Unit A-12-05</p>
              <p className="text-[10px] text-slate-400 truncate uppercase tracking-wider font-medium">{currentUserRole}</p>
            </div>
            <Settings size={16} className="text-slate-600 group-hover:text-indigo-400 transition-transform group-hover:rotate-90" />
          </button>

          <div className="space-y-3 pt-3 border-t border-white/5">
            <div className="relative">
               <select 
                className="w-full bg-slate-950/50 text-slate-300 text-xs font-medium rounded-xl p-3 pl-3 pr-8 border border-white/5 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all appearance-none cursor-pointer hover:bg-slate-950"
                value={currentUserRole}
                onChange={(e) => {
                  setCurrentUserRole(e.target.value as UserRole);
                  setCurrentView('dashboard');
                }}
              >
                <option value={UserRole.RESIDENT}>Resident View</option>
                <option value={UserRole.SECURITY}>Security View</option>
                <option value={UserRole.MANAGEMENT}>Management View</option>
              </select>
              <div className="absolute right-3 top-3 pointer-events-none text-slate-500">
                <Settings size={14} />
              </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="w-full flex items-center justify-center space-x-2 text-red-400/80 hover:text-red-400 hover:bg-red-400/10 transition-all py-3 rounded-xl text-xs font-bold uppercase tracking-wide"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-10 md:hidden transition-opacity duration-500"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
};