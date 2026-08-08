'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Navigation } from '../../components/Navigation';
import { SmartAssistant } from '../../components/SmartAssistant';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-nadayu-bg">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-nadayu-border border-t-nadayu-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-nadayu-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-nadayu-bg text-gray-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navigation />

      <main className="flex-1 min-w-0 transition-all duration-300 ease-in-out relative">
        <div className="pt-20 md:pt-0 h-full">
          <div className="h-full overflow-y-auto p-4 pb-24 md:p-8">
            <div className="max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
              {children}
            </div>
          </div>
        </div>
      </main>

      <SmartAssistant />
    </div>
  );
}
