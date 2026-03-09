import React, { createContext, useContext, useState, useCallback } from 'react';

interface NavigationContextType {
  currentView: string;
  isMobileOpen: boolean;
  setCurrentView: (view: string) => void;
  setIsMobileOpen: (open: boolean) => void;
  navigate: (view: string) => void; // navigate + close mobile menu
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ initialView: string; children: React.ReactNode }> = ({ initialView, children }) => {
  const [currentView, setCurrentView] = useState(initialView);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigate = useCallback((view: string) => {
    setCurrentView(view);
    setIsMobileOpen(false);
  }, []);

  return (
    <NavigationContext.Provider value={{ currentView, isMobileOpen, setCurrentView, setIsMobileOpen, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export function useNavigation(): NavigationContextType {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be used within NavigationProvider');
  return ctx;
}
