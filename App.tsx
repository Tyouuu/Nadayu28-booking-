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
import { CommunityBoard } from './components/CommunityBoard';
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
        return <CommunityBoard />;
      default:
        return <Dashboard userRole={currentUserRole} setCurrentView={setCurrentView} />;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-white text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
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