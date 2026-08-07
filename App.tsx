import React from 'react';
import { UserRole } from './types';
import { Navigation } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { ParkingBooking } from './components/ParkingBooking';
import { InviteVisitor } from './components/InviteVisitor';
import { Documents } from './components/Documents';
import { Amenities } from './components/Amenities';
import { AdminPanel } from './components/AdminPanel';
import { Reporting } from './components/Reporting';
import { Maintenance } from './components/Maintenance';
import { SecurityScanner } from './components/SecurityScanner';
import { SmartAssistant } from './components/SmartAssistant';
import { Profile } from './components/Profile';
import { SecurityProfile } from './components/SecurityProfile';
import { ManagementProfile } from './components/ManagementProfile';
import { Login } from './components/Login';
import { CommunityBoard } from './components/CommunityBoard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';
import { I18nProvider } from './contexts/I18nContext';

const AppContent: React.FC = () => {
  const { isLoggedIn, isLoading, currentUserRole, login } = useAuth();
  const { currentView, setCurrentView } = useNavigation();

  // Render logic based on view
  const renderContent = () => {
    switch(currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'documents':
        return <Documents />;
      case 'parking':
        return <ParkingBooking />;
      case 'invite-visitor':
        return <InviteVisitor />;
      case 'amenities':
        return <Amenities />;
      case 'report':
        return <Reporting />;
      case 'maintenance':
        return <Maintenance />;
      case 'management':
        return <AdminPanel />;
      case 'security':
        return <SecurityScanner />;
      case 'account':
        return <Profile />;
      case 'sec-profile':
        return <SecurityProfile />;
      case 'mgmt-profile':
        return <ManagementProfile />;
      case 'community':
        return <CommunityBoard />;
      default:
        return <Dashboard />;
    }
  };

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nadayu-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-nadayu-border border-t-nadayu-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-nadayu-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={async (role: UserRole) => {
      await login(role);
      setCurrentView(role === UserRole.MANAGEMENT ? 'management' : role === UserRole.SECURITY ? 'security' : 'dashboard');
    }} />;
  }

  return (
    <div className="flex min-h-screen bg-nadayu-bg text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navigation />

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

const App: React.FC = () => {
  return (
    <I18nProvider>
      <AuthProvider>
        <NavigationProvider initialView="dashboard">
          <AppContent />
        </NavigationProvider>
      </AuthProvider>
    </I18nProvider>
  );
};

export default App;
