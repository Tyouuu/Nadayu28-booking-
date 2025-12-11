import React, { useState } from 'react';
import { UserRole } from './types';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ParkingBooking } from './components/ParkingBooking';
import { Amenities } from './components/Amenities';
import { AdminPanel } from './components/AdminPanel';
import { Reporting } from './components/Reporting';
import { SecurityScanner } from './components/SecurityScanner';
import { SmartAssistant } from './components/SmartAssistant';
import { Profile } from './components/Profile';
import { Login } from './components/Login';
import { Bell } from 'lucide-react';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.RESIDENT);
  const [currentView, setCurrentView] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogin = (role: UserRole) => {
    setCurrentUserRole(role);
    setIsLoggedIn(true);
    setCurrentView(role === UserRole.MANAGEMENT ? 'management' : role === UserRole.SECURITY ? 'security' : 'dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentView('dashboard');
  };

  // Render logic based on view
  const renderContent = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard userRole={currentUserRole} setCurrentView={setCurrentView} />;
      case 'parking':
        return <ParkingBooking />;
      case 'amenities':
        return <Amenities />;
      case 'report':
        return <Reporting />;
      case 'management':
        return <AdminPanel />;
      case 'security':
        return <SecurityScanner />;
      case 'account':
        return <Profile />;
      case 'community':
        return (
          <div className="text-center py-20 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-none animate-fade-in-up">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
               <Bell size={40} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Community Board</h2>
            <p className="text-slate-500 max-w-md mx-auto mt-2">All community announcements and notices will appear here in a chronological feed.</p>
          </div>
        );
      default:
        return <Dashboard userRole={currentUserRole} setCurrentView={setCurrentView} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navigation 
        currentView={currentView}
        setCurrentView={setCurrentView}
        currentUserRole={currentUserRole}
        setCurrentUserRole={setCurrentUserRole}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        onLogout={handleLogout}
      />

      <main className="flex-1 transition-all duration-300 ease-in-out relative">
        {/* Top spacing for mobile only */}
        <div className="pt-20 md:pt-0 h-full">
            {/* Main scrollable area */}
            <div className="h-full overflow-y-auto p-4 md:p-8">
               <div className="max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
                 {renderContent()}
               </div>
            </div>
        </div>
      </main>

      {/* Floating Action Button for AI Help */}
      <SmartAssistant />
    </div>
  );
};

export default App;