'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types';
import { supabase } from '../services/supabase';

interface UserProfile {
  full_name: string;
  unit: string;
  role: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  currentUserRole: UserRole;
  userProfile: UserProfile | null;
  login: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function mapRole(roleStr?: string): UserRole {
  switch (roleStr) {
    case 'SECURITY':   return UserRole.SECURITY;
    case 'MANAGEMENT': return UserRole.MANAGEMENT;
    case 'TENANT':     return UserRole.TENANT;
    default:           return UserRole.RESIDENT;
  }
}

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data } = await supabase
    .from('profiles')
    .select('full_name, unit, role')
    .eq('id', userId)
    .single();
  return data;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.RESIDENT);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        const role = mapRole(profile?.role);
        setCurrentUserRole(role);
        setUserProfile(profile);
        setIsLoggedIn(true);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserProfile(null);
        setCurrentUserRole(UserRole.RESIDENT);
      }
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await fetchProfile(session.user.id);
        const role = mapRole(profile?.role);
        setCurrentUserRole(role);
        setUserProfile(profile);
        setIsLoggedIn(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (role: UserRole) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      setUserProfile(profile);
    }
    setCurrentUserRole(role);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserProfile(null);
    setCurrentUserRole(UserRole.RESIDENT);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, currentUserRole, userProfile, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
