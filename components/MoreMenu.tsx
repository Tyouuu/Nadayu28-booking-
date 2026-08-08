'use client';

import React from 'react';
import { FolderOpen, User, MessageSquare, Dumbbell, ChevronRight, Receipt, Package as PackageIcon } from 'lucide-react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useAppNavigate } from '../hooks/useAppNavigate';

const MORE_ITEMS: Record<UserRole, { id: string; label: string; icon: React.ElementType }[]> = {
  [UserRole.RESIDENT]: [
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'packages', label: 'Packages', icon: PackageIcon },
    { id: 'amenities', label: 'Amenities', icon: Dumbbell },
    { id: 'community', label: 'Community Board', icon: MessageSquare },
    { id: 'account', label: 'My Account', icon: User },
  ],
  [UserRole.TENANT]: [
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'billing', label: 'Billing', icon: Receipt },
    { id: 'packages', label: 'Packages', icon: PackageIcon },
    { id: 'amenities', label: 'Amenities', icon: Dumbbell },
    { id: 'community', label: 'Community Board', icon: MessageSquare },
    { id: 'account', label: 'My Account', icon: User },
  ],
  [UserRole.SECURITY]: [
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'packages', label: 'Packages', icon: PackageIcon },
    { id: 'sec-profile', label: 'Profile', icon: User },
  ],
  [UserRole.MANAGEMENT]: [
    { id: 'packages', label: 'Packages', icon: PackageIcon },
  ],
};

export const MoreMenu: React.FC = () => {
  const { currentUserRole } = useAuth();
  const navigate = useAppNavigate();
  const items = MORE_ITEMS[currentUserRole] || [];

  return (
    <div className="max-w-md mx-auto pb-12">
      <h2 className="text-xl font-bold text-gray-900 mb-4">More</h2>
      <div className="space-y-2">
        {items.map(item => (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className="w-full flex items-center gap-3 bg-white border border-nadayu-border rounded-xl px-4 py-3.5 text-left hover:border-nadayu-accent transition-colors"
          >
            <div className="w-9 h-9 bg-nadayu-cream rounded-lg flex items-center justify-center flex-shrink-0">
              <item.icon size={17} className="text-nadayu-muted" />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-900">{item.label}</span>
            <ChevronRight size={16} className="text-nadayu-muted" />
          </button>
        ))}
      </div>
    </div>
  );
};
