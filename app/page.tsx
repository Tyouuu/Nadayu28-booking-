'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Login } from '../components/Login';
import { UserRole } from '../types';

export default function RootPage() {
  const { isLoggedIn, isLoading, login } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/dashboard');
    }
  }, [isLoading, isLoggedIn, router]);

  if (isLoading || isLoggedIn) {
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
    <Login
      onLogin={async (role: UserRole) => {
        await login(role);
        router.push(role === UserRole.MANAGEMENT ? '/management' : role === UserRole.SECURITY ? '/security' : '/dashboard');
      }}
    />
  );
}
