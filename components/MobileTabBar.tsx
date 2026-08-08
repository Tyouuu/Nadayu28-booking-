'use client';

import React from 'react';
import { Home, Car, UserPlus, AlertTriangle, Shield, Wrench, BarChart2, FolderOpen, User, MoreHorizontal, Receipt, Package as PackageIcon } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { usePathname } from 'next/navigation';
import { useAppNavigate } from '../hooks/useAppNavigate';

interface TabItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const TABS_BY_ROLE: Record<UserRole, { direct: TabItem[]; more: TabItem[] }> = {
  [UserRole.RESIDENT]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'parking', label: 'Parking', icon: Car },
      { id: 'invite-visitor', label: 'Invite', icon: UserPlus },
      { id: 'report', label: 'Report', icon: AlertTriangle },
    ],
    more: [
      { id: 'documents', label: 'Documents', icon: FolderOpen },
      { id: 'billing', label: 'Billing', icon: Receipt },
      { id: 'packages', label: 'Packages', icon: PackageIcon },
      { id: 'amenities', label: 'Amenities', icon: BarChart2 },
      { id: 'community', label: 'Community', icon: MoreHorizontal },
      { id: 'account', label: 'Account', icon: User },
    ],
  },
  [UserRole.TENANT]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'parking', label: 'Parking', icon: Car },
      { id: 'invite-visitor', label: 'Invite', icon: UserPlus },
      { id: 'report', label: 'Report', icon: AlertTriangle },
    ],
    more: [
      { id: 'documents', label: 'Documents', icon: FolderOpen },
      { id: 'billing', label: 'Billing', icon: Receipt },
      { id: 'packages', label: 'Packages', icon: PackageIcon },
      { id: 'amenities', label: 'Amenities', icon: BarChart2 },
      { id: 'community', label: 'Community', icon: MoreHorizontal },
      { id: 'account', label: 'Account', icon: User },
    ],
  },
  [UserRole.SECURITY]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'security', label: 'Scan', icon: Shield },
      { id: 'maintenance', label: 'Maintain', icon: Wrench },
      { id: 'report', label: 'Report', icon: AlertTriangle },
    ],
    more: [
      { id: 'documents', label: 'Documents', icon: FolderOpen },
      { id: 'packages', label: 'Packages', icon: PackageIcon },
      { id: 'sec-profile', label: 'Profile', icon: User },
    ],
  },
  [UserRole.MANAGEMENT]: {
    direct: [
      { id: 'dashboard', label: 'Home', icon: Home },
      { id: 'documents', label: 'Docs', icon: FolderOpen },
      { id: 'maintenance', label: 'Maintain', icon: Wrench },
      { id: 'management', label: 'Admin', icon: BarChart2 },
      { id: 'mgmt-profile', label: 'Profile', icon: User },
    ],
    more: [
      { id: 'packages', label: 'Packages', icon: PackageIcon },
    ],
  },
};

export const MobileTabBar: React.FC = () => {
  const { currentUserRole } = useAuth();
  const pathname = usePathname();
  const currentView = pathname.slice(1);
  const navigate = useAppNavigate();
  const config = TABS_BY_ROLE[currentUserRole];
  if (!config) return null;

  const showMoreTab = config.more.length > 0;
  const moreIsActive = config.more.some(item => item.id === currentView);
  const tabs = showMoreTab ? [...config.direct, { id: 'more', label: 'More', icon: MoreHorizontal }] : config.direct;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-nadayu-border z-30 flex items-stretch">
      {tabs.map(tab => {
        const active = tab.id === 'more' ? moreIsActive || currentView === 'more' : currentView === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => navigate(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
              active ? 'text-nadayu-accent' : 'text-nadayu-muted'
            }`}
          >
            <tab.icon size={20} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
