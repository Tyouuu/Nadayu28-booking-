import React, { useState } from 'react';
import { Heart, MessageCircle, CheckCircle2, Clock, Bell, Search, Plus, Share2, Bookmark } from 'lucide-react';
import { notificationService } from '../services/notificationService';

interface NotificationCard {
  id: string;
  publisher: string;
  publisherType: 'property-center' | 'management' | 'security' | 'resident';
  postTime: Date;
  title: string;
  summary: string;
  category: 'property-notice' | 'event' | 'reminder' | 'announcement';
  isUrgent: boolean;
  attachments?: { name: string; url: string }[];
  likes: number;
  comments: number;
  hasLiked: boolean;
  hasRead: boolean;
  readCount?: number;
  totalResidents?: number;
}

export const CommunityBoard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'property-notice' | 'event' | 'reminder' | 'announcement'>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<'7days' | '30days' | 'all'>('30days');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<NotificationCard[]>([
    {
      id: 'notif-1',
      publisher: 'Property Center',
      publisherType: 'property-center',
      postTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      title: '[Property Notice] Water Shutdown Notice for December 15',
      summary: 'Water supply will be suspended from 8:00 AM to 6:00 PM on December 15 for Buildings 1-3. Please store water in advance. Emergency hotline: 555-0123',
      category: 'property-notice',
      isUrgent: true,
      attachments: [{ name: 'View Details', url: '#' }, { name: 'Area Map', url: '#' }],
      likes: 24,
      comments: 8,
      hasLiked: false,
      hasRead: true,
      readCount: 342,
      totalResidents: 485,
    },
    {
      id: 'notif-2',
      publisher: 'Community Events',
      publisherType: 'management',
      postTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      title: 'Christmas Gala - December 22 @ 6:00 PM | Community Hall',
      summary: 'Join us for our annual Christmas celebration! Live music, festive dinner, and family activities. Sign up at the Community Center or reply with "interested" to reserve your spot.',
      category: 'event',
      isUrgent: false,
      attachments: [{ name: 'Event Poster', url: '#' }, { name: 'Menu Preview', url: '#' }],
      likes: 156,
      comments: 32,
      hasLiked: false,
      hasRead: false,
      readCount: 198,
      totalResidents: 485,
    },
    {
      id: 'notif-3',
      publisher: 'Security Department',
      publisherType: 'security',
      postTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      title: '[Important Reminder] Gate Access Update',
      summary: 'New visitor access control system is now active. Please update your family member access credentials in the mobile app. Questions? Contact security@community.local',
      category: 'reminder',
      isUrgent: false,
      attachments: [{ name: 'How-to Guide', url: '#' }],
      likes: 45,
      comments: 12,
      hasLiked: false,
      hasRead: false,
      readCount: 156,
      totalResidents: 485,
    },
    {
      id: 'notif-4',
      publisher: 'Management Office',
      publisherType: 'property-center',
      postTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      title: 'Annual Property Tax Assessment Released',
      summary: 'Your 2025 property assessment is now available in the resident portal. Review estimated values and submit disputes by December 25 if needed.',
      category: 'announcement',
      isUrgent: false,
      attachments: [{ name: 'Assessment Document', url: '#' }],
      likes: 18,
      comments: 5,
      hasLiked: false,
      hasRead: true,
      readCount: 321,
      totalResidents: 485,
    },
  ]);

  const categoryTabs = [
    { id: 'all', label: 'All Updates', icon: '📢' },
    { id: 'property-notice', label: 'Property Notices', icon: '🏢' },
    { id: 'event', label: 'Events', icon: '🎉' },
    { id: 'reminder', label: 'Reminders', icon: '⏰' },
    { id: 'announcement', label: 'Announcements', icon: '📣' },
  ];

  const timeFilters = [
    { id: '7days', label: 'Last 7 Days' },
    { id: '30days', label: 'Last 30 Days' },
    { id: 'all', label: 'All Time' },
  ];

  const getPublisherColor = (type: string) => {
    const colors: { [key: string]: { bg: string; text: string; border: string } } = {
      'property-center': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      'management': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
      'security': { bg: 'bg-[#111111]/10', text: 'text-[#111111]', border: 'border-[#111111]/20' },
      'resident': { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' },
    };
    return colors[type] || colors['resident'];
  };

  const getPublisherEmoji = (type: string) => {
    const emojis: { [key: string]: string } = {
      'property-center': '🏢',
      'management': '👨‍💼',
      'security': '🛡️',
      'resident': '👤',
    };
    return emojis[type] || '👤';
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notif => {
    const categoryMatch = selectedCategory === 'all' || notif.category === selectedCategory;
    const timeMatch = (() => {
      const daysAgo = Math.floor((Date.now() - notif.postTime.getTime()) / (1000 * 60 * 60 * 24));
      if (selectedTimeFilter === '7days') return daysAgo <= 7;
      if (selectedTimeFilter === '30days') return daysAgo <= 30;
      return true;
    })();
    const searchMatch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       notif.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && timeMatch && searchMatch;
  });

  const handleLike = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id
          ? { ...notif, hasLiked: !notif.hasLiked, likes: notif.hasLiked ? notif.likes - 1 : notif.likes + 1 }
          : notif
      )
    );
  };

  const handleReadConfirm = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id
          ? { ...notif, hasRead: true }
          : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.hasRead).length;

  return (
    <div className="min-h-screen bg-white">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[100px] -z-10"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[100px] -z-10"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        
        {/* HEADER */}
        <div className="mb-5">
          <div className="bg-[#111111] rounded-2xl p-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-[#C8FF00] rounded-2xl flex items-center justify-center flex-shrink-0">
                <Bell size={28} className="text-[#111111]" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Community Board</h1>
                <p className="text-gray-400">Stay informed with community updates, events, and announcements</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <div className="px-4 py-2 bg-white/10 rounded-full flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#C8FF00] rounded-full animate-pulse"></div>
                  <span className="text-sm font-bold text-white">{unreadCount} unread</span>
                </div>
              )}
              <button className="px-6 py-3 bg-[#C8FF00] hover:brightness-95 text-[#111111] font-bold rounded-2xl transition-all flex items-center gap-2">
                <Plus size={20} /> Post Update
              </button>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="relative mb-5">
          <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search community updates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-6 py-4 bg-white border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none font-medium transition-colors shadow-sm"
          />
        </div>

        {/* CATEGORY TABS */}
        <div className="flex overflow-x-auto gap-3 mb-5 pb-4 scrollbar-hide">
          {categoryTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 whitespace-nowrap flex-shrink-0 ${
                selectedCategory === tab.id
                  ? 'bg-[#111111] text-white shadow-md'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C8FF00] hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TIME FILTER */}
        <div className="flex items-center gap-3 mb-5">
          <Clock size={18} className="text-gray-400" />
          <div className="flex gap-2">
            {timeFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => setSelectedTimeFilter(filter.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  selectedTimeFilter === filter.id
                    ? 'bg-[#111111] text-white border border-[#111111]'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        {filteredNotifications.length > 0 ? (
          <div className="space-y-6">
            {filteredNotifications.map(notification => {
              const publisherColor = getPublisherColor(notification.publisherType);
              return (
                <div
                  key={notification.id}
                  className={`bg-white border rounded-2xl p-6 transition-all duration-300 hover:shadow-md ${
                    notification.isUrgent
                      ? 'border-gray-200 shadow-sm'
                      : 'border-gray-100 hover:shadow-md'
                  } ${!notification.hasRead ? 'ring-1 ring-gray-200' : ''}`}
                >
                  {/* HEADER */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${publisherColor.bg}`}>
                        {getPublisherEmoji(notification.publisherType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className={`text-sm font-bold px-3 py-1 rounded-full border ${publisherColor.bg} ${publisherColor.border} ${publisherColor.text}`}>
                            {notification.publisher}
                          </span>
                          {notification.isUrgent && (
                          <span className="text-xs font-bold px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center gap-1">
                              🔴 Urgent
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {formatTimeAgo(notification.postTime)}
                        </div>
                      </div>
                    </div>
                    {!notification.hasRead && (
                      <div className="w-2 h-2 bg-[#C8FF00] rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>

                  {/* TITLE */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3 leading-relaxed">
                    {notification.title}
                  </h3>

                  {/* SUMMARY */}
                  <p className="text-gray-500 mb-4 leading-relaxed text-base">
                    {notification.summary}
                  </p>

                  {/* ATTACHMENTS */}
                  {notification.attachments && notification.attachments.length > 0 && (
                    <div className="flex items-center gap-3 mb-6 flex-wrap">
                      {notification.attachments.map((attachment, idx) => (
                        <button
                          key={idx}
                          className="px-4 py-2 bg-gray-100 border border-gray-200 hover:border-gray-300 hover:bg-gray-150 rounded-lg text-sm font-bold text-gray-700 transition-all"
                        >
                          📎 {attachment.name}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* READ STATS (for urgent/important) */}
                  {(notification.isUrgent || notification.readCount! > 200) && (
                    <div className="mb-6 p-3 bg-white border border-gray-100 rounded-xl text-xs text-gray-500 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-[#C8FF00]" />
                      Read by {notification.readCount} of {notification.totalResidents} residents
                    </div>
                  )}

                  {/* INTERACTIVE FOOTER */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(notification.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-bold ${
                          notification.hasLiked
                            ? 'bg-[#111111] border border-[#111111] text-[#C8FF00]'
                            : 'bg-gray-50 border border-gray-200 text-gray-500 hover:border-[#111111]'
                        }`}
                      >
                        <Heart size={18} fill={notification.hasLiked ? 'currentColor' : 'none'} />
                        <span className="text-sm">{notification.likes}</span>
                      </button>

                      <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 hover:border-[#111111] text-gray-500 hover:text-gray-900 rounded-lg transition-all font-bold">
                        <MessageCircle size={18} />
                        <span className="text-sm">{notification.comments}</span>
                      </button>

                      <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 hover:border-[#111111] text-gray-500 hover:text-gray-900 rounded-lg transition-all font-bold">
                        <Share2 size={18} />
                        <span className="text-sm">Share</span>
                      </button>
                    </div>

                    {!notification.hasRead && (
                      <button
                        onClick={() => handleReadConfirm(notification.id)}
                        className="px-4 py-2 bg-[#C8FF00] hover:brightness-95 text-[#111111] font-bold rounded-lg transition-all text-sm flex items-center gap-2"
                      >
                        <CheckCircle2 size={16} /> Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Bell size={48} className="text-gray-300" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Updates Available</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              There are no community notifications matching your filters. Follow category tags or adjust your time filter to stay updated.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedTimeFilter('30days');
              }}
              className="px-6 py-3 bg-[#C8FF00] hover:brightness-95 text-[#111111] font-bold rounded-2xl transition-all inline-flex items-center gap-2"
            >
              View All Updates
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
