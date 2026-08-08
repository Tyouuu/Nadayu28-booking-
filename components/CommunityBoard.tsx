'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Search, Plus, Clock, X } from 'lucide-react';
import { fetchAnnouncements, createAnnouncement } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { UserRole, Announcement } from '../types';

export const CommunityBoard: React.FC = () => {
  const { currentUserRole } = useAuth();
  const isManagement = currentUserRole === UserRole.MANAGEMENT;

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'7days' | '30days' | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const load = () => { fetchAnnouncements().then(setAnnouncements).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const [isPosting, setIsPosting] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<Announcement['priority']>('medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    setIsSubmitting(true);
    try {
      await createAnnouncement({ title: newTitle.trim(), content: newContent.trim(), priority: newPriority });
      setNewTitle('');
      setNewContent('');
      setNewPriority('medium');
      setIsPosting(false);
      load();
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeFilters: { id: typeof selectedTimeFilter; label: string }[] = [
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'all', label: 'All Time' },
  ];

  const formatTimeAgo = (dateStr: string): string => {
    const date = new Date(dateStr);
    const diffDays = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const filtered = announcements.filter(a => {
    const daysAgo = Math.floor((Date.now() - new Date(a.date).getTime()) / (1000 * 60 * 60 * 24));
    const timeMatch = selectedTimeFilter === 'all' ? true : selectedTimeFilter === '7days' ? daysAgo <= 7 : daysAgo <= 30;
    const searchMatch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) || a.content.toLowerCase().includes(searchQuery.toLowerCase());
    return timeMatch && searchMatch;
  });

  const priorityStyle = (priority: Announcement['priority']) =>
    priority === 'high' ? 'bg-red-50 border-red-200 text-red-600'
      : priority === 'medium' ? 'bg-nadayu-cream border-nadayu-border text-gray-700'
      : 'bg-nadayu-cream border-nadayu-border text-nadayu-muted';

  return (
    <div className="min-h-screen bg-nadayu-bg">
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        <div className="mb-5">
          <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
                <Bell size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Community Board</h1>
                <p className="text-nadayu-muted">Stay informed with community updates and announcements</p>
              </div>
            </div>
            {isManagement && (
              <button
                onClick={() => setIsPosting(!isPosting)}
                className="px-6 py-3 bg-nadayu-accent hover:brightness-95 text-white font-bold rounded-2xl transition-all flex items-center gap-2"
              >
                <Plus size={20} /> Post Update
              </button>
            )}
          </div>
        </div>

        {isPosting && (
          <div className="bg-white p-6 rounded-2xl shadow-xl border border-nadayu-border mb-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 text-lg">New Announcement</h4>
              <button onClick={() => setIsPosting(false)} className="text-nadayu-muted hover:text-gray-900"><X size={20} /></button>
            </div>
            <form onSubmit={handlePost} className="space-y-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-5 py-3 bg-white border border-nadayu-border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium"
              />
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Details"
                rows={3}
                className="w-full px-5 py-3 bg-white border border-nadayu-border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium"
              />
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-nadayu-muted uppercase">Priority</span>
                {(['low', 'medium', 'high'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${newPriority === p ? 'bg-nadayu-panel text-white' : 'bg-nadayu-cream text-gray-600'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim() || !newContent.trim()}
                  className="px-6 py-3 rounded-xl font-bold text-white bg-nadayu-panel hover:brightness-110 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="relative mb-5">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-nadayu-muted" />
          <input
            type="text"
            placeholder="Search community updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-nadayu-border rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium transition-colors shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3 mb-5">
          <Clock size={18} className="text-nadayu-muted" />
          <div className="flex gap-2">
            {timeFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedTimeFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedTimeFilter === filter.id
                    ? 'bg-nadayu-panel text-white border border-nadayu-panel'
                    : 'bg-white border border-nadayu-border text-gray-600 hover:border-gray-400'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(a => (
              <div key={a.id} className="bg-white border border-nadayu-border rounded-2xl p-6 hover:shadow-md transition-all duration-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full border ${priorityStyle(a.priority)}`}>
                    {a.priority}
                  </span>
                  <span className="text-xs text-nadayu-muted">{formatTimeAgo(a.date)}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{a.title}</h3>
                <p className="text-gray-500 leading-relaxed">{a.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-nadayu-cream rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell size={48} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Updates</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No community announcements match your filters.
            </p>
            <button
              onClick={() => { setSelectedTimeFilter('all'); setSearchQuery(''); }}
              className="px-6 py-3 bg-nadayu-accent hover:brightness-95 text-white font-bold rounded-2xl transition-all inline-flex items-center gap-2"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
