import React, { useState } from 'react';
import { Shield, User, Clock, CheckCircle2, AlertTriangle, Camera, Bell, MapPin, Calendar, ScanLine, FileText, Phone, Edit2, Save } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';

export const SecurityProfile: React.FC = () => {
  const { setCurrentView } = useNavigation();
  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: 'Ahmad bin Razak',
    employeeId: 'SEC-2025-042',
    phone: '+60 11-2233 4455',
    station: 'Gate A - Main Entrance',
    shift: 'Morning (8:00 AM - 4:00 PM)',
    joined: '15 January 2025',
  });

  const todayStats = {
    verified: 47,
    warnings: 2,
    pending: 1,
    scansToday: 52,
  };

  const recentScans = [
    { id: 1, plate: 'WNB 1234', unit: 'A-12-05', time: '14:32', status: 'approved' },
    { id: 2, plate: 'BJK 5678', unit: 'B-08-03', time: '14:15', status: 'approved' },
    { id: 3, plate: 'WAA 9012', unit: 'C-03-01', time: '13:58', status: 'denied' },
    { id: 4, plate: 'WKL 3456', unit: 'A-15-10', time: '13:40', status: 'approved' },
    { id: 5, plate: 'BDG 7890', unit: 'B-11-07', time: '13:22', status: 'approved' },
  ];

  const notifications = [
    { text: 'Parcel van arriving at Gate A in 15 minutes', time: '15:30', urgent: true },
    { text: 'Shift change reminder - Evening shift starts at 4:00 PM', time: '16:00', urgent: false },
    { text: 'Maintenance team scheduled for Block C elevator', time: '17:00', urgent: false },
  ];

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: Shield },
    { id: 'log' as const, label: 'Scan Log', icon: FileText },
    { id: 'settings' as const, label: 'Settings', icon: User },
  ];

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] text-nadayu-muted uppercase tracking-widest font-semibold mb-1">Security Personnel</p>
          <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">My Profile</h1>
          <p className="text-nadayu-muted text-sm mt-1">Gate A Security · Morning Shift</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-nadayu-accent text-nadayu-panel px-4 py-2 rounded-full text-xs font-bold">
          <span className="w-1.5 h-1.5 bg-nadayu-panel rounded-full animate-pulse"></span>
          On Duty
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Left Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-nadayu-border sticky top-6 space-y-5 p-6">
            <div className="relative mx-auto w-fit">
              <div className="w-24 h-24 rounded-full bg-nadayu-panel flex items-center justify-center">
                <Shield size={40} className="text-nadayu-accent" />
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 bg-nadayu-accent rounded-full flex items-center justify-center border-2 border-white">
                <CheckCircle2 size={14} className="text-nadayu-panel" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">{profileData.name}</h2>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-nadayu-panel text-white rounded-full text-xs font-bold">
                <Shield size={11} /> Security Guard
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-nadayu-muted text-sm flex items-center justify-center gap-1.5"><MapPin size={13} /> Gate A</p>
                <p className="text-nadayu-muted text-sm flex items-center justify-center gap-1.5"><Clock size={13} /> 8:00 AM - 4:00 PM</p>
              </div>
              <p className="text-[11px] text-gray-300 mt-2">ID: {profileData.employeeId}</p>
            </div>
            <div className="space-y-1.5 pt-4 border-t border-nadayu-border">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-3 ${
                    activeTab === tab.id ? 'bg-nadayu-panel text-white' : 'text-nadayu-muted hover:text-gray-900 hover:bg-nadayu-cream'
                  }`}>
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>
            <button onClick={() => setCurrentView('security')}
              className="w-full bg-nadayu-accent text-nadayu-panel py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all">
              <Camera size={16} /> Quick Scan
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-5">
          {activeTab === 'overview' && (
            <>
              {/* Stats - fixed readability */}
              <div className="bg-nadayu-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-white font-semibold text-sm">Today's Stats</h2>
                  <span className="text-gray-600 text-xs">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white/[0.08] rounded-xl p-4">
                    <p className="text-xs font-semibold text-nadayu-muted mb-2">Total Scans</p>
                    <p className="text-2xl font-bold text-white">{todayStats.scansToday}</p>
                  </div>
                  <div className="bg-nadayu-accent rounded-xl p-4">
                    <p className="text-xs font-semibold text-nadayu-panel/60 mb-2">Verified</p>
                    <p className="text-2xl font-bold text-nadayu-panel">{todayStats.verified}</p>
                  </div>
                  <div className="bg-orange-500/15 rounded-xl p-4">
                    <p className="text-xs font-semibold text-orange-300 mb-2">Warnings</p>
                    <p className="text-2xl font-bold text-orange-400">{todayStats.warnings}</p>
                  </div>
                  <div className="bg-yellow-500/15 rounded-xl p-4">
                    <p className="text-xs font-semibold text-yellow-300 mb-2">Pending</p>
                    <p className="text-2xl font-bold text-yellow-400">{todayStats.pending}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Visitor Log now goes to scan log tab */}
              <div className="grid grid-cols-3 gap-3">
                <button onClick={() => setCurrentView('security')}
                  className="group flex items-center gap-3 bg-white border border-nadayu-border rounded-xl px-4 py-3 text-left hover:border-nadayu-accent hover:shadow-sm transition-all">
                  <div className="w-9 h-9 bg-nadayu-cream group-hover:bg-nadayu-accent rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <Camera size={16} className="text-gray-500 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-xs font-semibold">Quick Scan</p>
                    <p className="text-nadayu-muted text-[10px]">Scan QR code</p>
                  </div>
                </button>
                <button onClick={() => setActiveTab('log')}
                  className="group flex items-center gap-3 bg-white border border-nadayu-border rounded-xl px-4 py-3 text-left hover:border-nadayu-accent hover:shadow-sm transition-all">
                  <div className="w-9 h-9 bg-nadayu-cream group-hover:bg-nadayu-accent rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <FileText size={16} className="text-gray-500 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-xs font-semibold">Visitor Log</p>
                    <p className="text-nadayu-muted text-[10px]">View entries</p>
                  </div>
                </button>
                <button onClick={() => setCurrentView('report')}
                  className="group flex items-center gap-3 bg-white border border-nadayu-border rounded-xl px-4 py-3 text-left hover:border-nadayu-accent hover:shadow-sm transition-all">
                  <div className="w-9 h-9 bg-nadayu-cream group-hover:bg-nadayu-accent rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <AlertTriangle size={16} className="text-gray-500 group-hover:text-black transition-colors" />
                  </div>
                  <div>
                    <p className="text-gray-900 text-xs font-semibold">Report Issue</p>
                    <p className="text-nadayu-muted text-[10px]">Submit report</p>
                  </div>
                </button>
              </div>

              {/* Notifications */}
              <div className="bg-white border border-nadayu-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Bell size={14} className="text-gray-900" />
                    <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                  </div>
                  <span className="text-[10px] font-bold text-white bg-nadayu-panel px-2 py-0.5 rounded-full">{notifications.length} new</span>
                </div>
                {notifications.map((n, i) => (
                  <div key={i} className={`flex items-start gap-3 py-3 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.urgent ? 'bg-red-400' : 'bg-nadayu-accent'}`}></span>
                    <p className="text-gray-600 text-xs flex-1 leading-relaxed">{n.text}</p>
                    <span className="text-gray-300 text-[10px] flex-shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'log' && (
            <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ScanLine size={14} className="text-gray-900" />
                  <h3 className="text-sm font-semibold text-gray-900">Recent Scans</h3>
                </div>
                <span className="text-xs text-nadayu-muted">Today</span>
              </div>
              <div>
                {recentScans.map((scan, i) => (
                  <div key={scan.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-nadayu-cream/50 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${scan.status === 'approved' ? 'bg-nadayu-success/15' : 'bg-red-50'}`}>
                      {scan.status === 'approved'
                        ? <CheckCircle2 size={18} className="text-nadayu-success" />
                        : <AlertTriangle size={18} className="text-red-400" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{scan.plate}</p>
                      <p className="text-xs text-nadayu-muted">Unit {scan.unit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-nadayu-muted">{scan.time}</p>
                      <span className={`text-[10px] font-bold uppercase ${scan.status === 'approved' ? 'text-nadayu-success' : 'text-red-400'}`}>{scan.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings with edit feature */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
              <div className="bg-nadayu-panel p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-nadayu-accent rounded-xl flex items-center justify-center">
                    <User size={18} className="text-nadayu-panel" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Personal Details</h3>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                    isEditing ? 'bg-nadayu-accent text-nadayu-panel' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {isEditing ? <><Save size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
                </button>
              </div>
              <div className="p-6 space-y-5">
                {[
                  { label: 'Full Name', key: 'name' as const, icon: User, editable: true },
                  { label: 'Employee ID', key: 'employeeId' as const, icon: Shield, editable: false },
                  { label: 'Phone', key: 'phone' as const, icon: Phone, editable: true },
                  { label: 'Station', key: 'station' as const, icon: MapPin, editable: false },
                  { label: 'Shift', key: 'shift' as const, icon: Clock, editable: false },
                  { label: 'Joined', key: 'joined' as const, icon: Calendar, editable: false },
                ].map(item => (
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
