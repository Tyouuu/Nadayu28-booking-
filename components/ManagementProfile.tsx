'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, BarChart2, Clock, CheckCircle2, AlertTriangle, FileText, Bell, Briefcase, Calendar, Megaphone, Scale, ClipboardList, Edit2, Save } from 'lucide-react';
import { useAppNavigate } from '../hooks/useAppNavigate';

interface Approval {
  id: number;
  type: string;
  unit: string;
  desc: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'approved' | 'rejected';
}

export const ManagementProfile: React.FC = () => {
  const setCurrentView = useAppNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Sarah Tan Mei Ling',
    position: 'Property Manager',
    department: 'Operations',
    email: 'sarah.tan@nadayu28.com',
    phone: '+60 12-888 9999',
    office: 'Management Office, Level G',
    joined: '1 March 2024',
  });

  const [approvals, setApprovals] = useState<Approval[]>([
    { id: 1, type: 'Refund Request', unit: 'A-08-02', desc: 'Late cancellation refund - RM 30', date: '2026-03-07', priority: 'medium', status: 'pending' },
    { id: 2, type: 'Refund Request', unit: 'B-15-09', desc: 'Double charge on parking - RM 20', date: '2026-03-06', priority: 'high', status: 'pending' },
    { id: 3, type: 'Special Booking', unit: 'C-03-01', desc: 'Private event - BBQ area full day', date: '2026-03-08', priority: 'low', status: 'pending' },
  ]);

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  const stats = {
    pendingViolations: 5,
    unreadComplaints: 3,
    todayBookings: 12,
    occupancyRate: 87,
  };

  const handleApproval = (id: number, action: 'approved' | 'rejected') => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: action } : a));
  };

  const recentActivity = [
    { text: 'Violation fine issued to Unit B-05-01 - RM 10', time: '2h ago', type: 'violation' },
    { text: 'Complaint resolved: Noise complaint from A-10-03', time: '4h ago', type: 'resolved' },
    { text: 'New maintenance report: Elevator Block C', time: '5h ago', type: 'report' },
    { text: 'Announcement posted: Pool maintenance schedule', time: '1d ago', type: 'announcement' },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: BarChart2 },
    { id: 'approvals' as const, label: 'Approvals', icon: ClipboardList },
    { id: 'settings' as const, label: 'My Details', icon: User },
  ];

  return (
    <div className="pb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] text-nadayu-muted uppercase tracking-widest font-semibold mb-1">Property Management</p>
          <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">My Profile</h1>
          <p className="text-nadayu-muted text-sm mt-1">Operations Department</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-nadayu-border sticky top-6 space-y-5 p-6">
            <div className="relative mx-auto w-fit">
              <div className="w-24 h-24 rounded-full bg-nadayu-panel flex items-center justify-center">
                <Briefcase size={40} className="text-nadayu-accent" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">{profileData.name.split(' ').slice(0, 2).join(' ')}</h2>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-nadayu-panel text-white rounded-full text-xs font-bold">
                <Briefcase size={11} /> {profileData.position}
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-nadayu-muted text-sm flex items-center justify-center gap-1.5"><Mail size={13} /> {profileData.email}</p>
                <p className="text-nadayu-muted text-sm flex items-center justify-center gap-1.5"><Phone size={13} /> {profileData.phone}</p>
              </div>
            </div>
            <div className="space-y-1.5 pt-4 border-t border-nadayu-border">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    activeTab === tab.id ? 'bg-nadayu-panel text-white' : 'text-nadayu-muted hover:text-gray-900 hover:bg-nadayu-cream'
                  }`}>
                  <tab.icon size={16} /> {tab.label}
                  {tab.id === 'approvals' && pendingCount > 0 && (
                    <span className="ml-auto text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">{pendingCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-5">
          {activeTab === 'overview' && (
            <>
              {/* Stats - fixed readability */}
              <div className="bg-white border border-nadayu-border rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-gray-900 font-semibold text-sm">Today's Overview</h2>
                  <span className="text-nadayu-muted text-xs">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-orange-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-orange-500 mb-2">Pending Violations</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pendingViolations}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-red-500 mb-2">Unread Complaints</p>
                    <p className="text-2xl font-bold text-red-600">{stats.unreadComplaints}</p>
                  </div>
                  <div className="bg-nadayu-accent rounded-xl p-4">
                    <p className="text-xs font-semibold text-white/70 mb-2">Today's Bookings</p>
                    <p className="text-2xl font-bold text-white">{stats.todayBookings}</p>
                  </div>
                  <div className="bg-nadayu-cream rounded-xl p-4">
                    <p className="text-xs font-semibold text-nadayu-muted mb-2">Occupancy Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.occupancyRate}%</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'View Reports', desc: 'Analytics dashboard', icon: BarChart2, action: () => setCurrentView('management') },
                  { label: 'Handle Violations', desc: 'Review pending', icon: Scale, action: () => setCurrentView('management') },
                  { label: 'Post Announcement', desc: 'Community updates', icon: Megaphone, action: () => setCurrentView('management') },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    className="group flex items-center gap-3 bg-white border border-nadayu-border rounded-xl px-4 py-3 text-left hover:border-nadayu-accent hover:shadow-sm transition-all">
                    <div className="w-9 h-9 bg-nadayu-cream group-hover:bg-nadayu-accent rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                      <a.icon size={16} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    <div>
                      <p className="text-gray-900 text-xs font-semibold">{a.label}</p>
                      <p className="text-nadayu-muted text-[10px]">{a.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Recent Activity + Reminders */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white border border-nadayu-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={14} className="text-gray-900" />
                    <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
                  </div>
                  {recentActivity.map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 py-3 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        item.type === 'violation' ? 'bg-orange-50' : item.type === 'resolved' ? 'bg-nadayu-success/15' : item.type === 'report' ? 'bg-red-50' : 'bg-blue-50'
                      }`}>
                        {item.type === 'violation' && <Scale size={11} className="text-orange-400" />}
                        {item.type === 'resolved' && <CheckCircle2 size={11} className="text-nadayu-success" />}
                        {item.type === 'report' && <AlertTriangle size={11} className="text-red-400" />}
                        {item.type === 'announcement' && <Megaphone size={11} className="text-blue-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 text-xs leading-relaxed">{item.text}</p>
                        <p className="text-gray-300 text-[10px] mt-1">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white border border-nadayu-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Bell size={14} className="text-gray-900" />
                    <h3 className="text-sm font-semibold text-gray-900">Reminders</h3>
                  </div>
                  {[
                    { text: 'Monthly report deadline - March 10', urgent: true },
                    { text: 'Fire drill scheduled - March 15 at 10 AM', urgent: false },
                    { text: 'AGM preparation meeting - March 20', urgent: false },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 py-3 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.urgent ? 'bg-red-400' : 'bg-nadayu-accent'}`}></span>
                      <p className="text-gray-600 text-xs flex-1 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Approvals - functional approve/reject */}
          {activeTab === 'approvals' && (
            <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Pending Approvals</h3>
                  <p className="text-xs text-nadayu-muted mt-0.5">{pendingCount} items need your attention</p>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {approvals.map(item => (
                  <div key={item.id} className={`px-6 py-5 transition-colors ${item.status !== 'pending' ? 'opacity-60' : 'hover:bg-nadayu-cream/50'}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.priority === 'high' ? 'bg-red-50' : item.priority === 'medium' ? 'bg-orange-50' : 'bg-nadayu-cream'
                        }`}>
                          {item.type === 'Refund Request'
                            ? <FileText size={18} className={item.priority === 'high' ? 'text-red-400' : 'text-orange-400'} />
                            : <Calendar size={18} className="text-nadayu-muted" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{item.type}</p>
                          <p className="text-xs text-nadayu-muted">Unit {item.unit} · {item.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status !== 'pending' && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            item.status === 'approved' ? 'bg-nadayu-success/15 text-nadayu-success' : 'bg-red-50 text-red-500'
                          }`}>{item.status}</span>
                        )}
                        {item.status === 'pending' && (
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                            item.priority === 'high' ? 'bg-red-50 text-red-500' : item.priority === 'medium' ? 'bg-orange-50 text-orange-500' : 'bg-nadayu-cream text-nadayu-muted'
                          }`}>{item.priority}</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 ml-[52px]">{item.desc}</p>
                    {item.status === 'pending' && (
                      <div className="flex gap-2 ml-[52px]">
                        <button onClick={() => handleApproval(item.id, 'approved')}
                          className="px-4 py-2 bg-nadayu-panel text-white rounded-lg text-xs font-bold hover:brightness-110 transition-colors flex items-center gap-1.5">
                          <CheckCircle2 size={13} /> Approve
                        </button>
                        <button onClick={() => handleApproval(item.id, 'rejected')}
                          className="px-4 py-2 bg-white border border-nadayu-border text-gray-500 rounded-lg text-xs font-bold hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* My Details with edit feature */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
              <div className="bg-nadayu-panel p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-nadayu-accent rounded-xl flex items-center justify-center">
                    <User size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Personal Details</h3>
                </div>
                <button onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    isEditing ? 'bg-nadayu-accent text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {isEditing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
                </button>
              </div>
              <div className="p-6 space-y-5">
                {([
                  { label: 'Full Name', key: 'name' as const, icon: User, editable: true },
                  { label: 'Position', key: 'position' as const, icon: Briefcase, editable: false },
                  { label: 'Department', key: 'department' as const, icon: BarChart2, editable: false },
                  { label: 'Email', key: 'email' as const, icon: Mail, editable: false },
                  { label: 'Phone', key: 'phone' as const, icon: Phone, editable: true },
                  { label: 'Office', key: 'office' as const, icon: MapPin, editable: false },
                  { label: 'Joined', key: 'joined' as const, icon: Calendar, editable: false },
                ]).map(item => (
                  <div key={item.label} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 bg-nadayu-cream rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={16} className="text-nadayu-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider">{item.label}</p>
                      {isEditing && item.editable ? (
                        <input
                          type="text"
                          value={profileData[item.key]}
                          onChange={e => setProfileData({ ...profileData, [item.key]: e.target.value })}
                          className="w-full mt-1 px-3 py-2 bg-nadayu-cream border border-nadayu-border rounded-lg text-sm font-semibold text-gray-900 outline-none focus:border-nadayu-accent focus:ring-1 focus:ring-nadayu-accent/20"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{profileData[item.key]}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
