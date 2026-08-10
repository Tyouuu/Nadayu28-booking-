'use client';

import React, { useState, useEffect } from 'react';
import { Shield, User, Clock, CheckCircle2, AlertTriangle, Camera, ScanLine, FileText, Phone, Mail, Edit2, Save } from 'lucide-react';
import { useAppNavigate } from '../hooks/useAppNavigate';
import { useAuth } from '../contexts/AuthContext';
import { fetchVisitors, updateProfile, Visitor } from '../services/dataService';

export const SecurityProfile: React.FC = () => {
  const setCurrentView = useAppNavigate();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  useEffect(() => {
    setNameInput(userProfile?.full_name || '');
    setPhoneInput(userProfile?.phone || '');
  }, [userProfile?.full_name, userProfile?.phone]);

  const handleSaveDetails = async () => {
    if (!userProfile?.id) { setIsEditing(false); return; }
    setIsSaving(true);
    try {
      await updateProfile(userProfile.id, { full_name: nameInput, phone: phoneInput });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const [todaysVisitors, setTodaysVisitors] = useState<Visitor[]>([]);
  useEffect(() => {
    fetchVisitors().then(list => {
      const todayStr = new Date().toISOString().slice(0, 10);
      setTodaysVisitors(list.filter(v => (v.actualArrival ?? v.expectedArrival)?.slice(0, 10) === todayStr));
    }).catch(() => {});
  }, []);

  const todayStats = {
    verified: todaysVisitors.filter(v => v.status === 'arrived' || v.status === 'departed').length,
    warnings: todaysVisitors.filter(v => v.status === 'flagged').length,
    pending: todaysVisitors.filter(v => v.status === 'scheduled').length,
    scansToday: todaysVisitors.filter(v => v.status !== 'scheduled').length,
  };

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
          <p className="text-nadayu-muted text-sm mt-1">Access Control</p>
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
                <CheckCircle2 size={14} className="text-white" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-gray-900">{userProfile?.full_name || 'Security'}</h2>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-nadayu-panel text-white rounded-full text-xs font-bold">
                <Shield size={11} /> Security Guard
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-nadayu-muted text-sm flex items-center justify-center gap-1.5"><Phone size={13} /> {userProfile?.phone || '—'}</p>
              </div>
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
              className="w-full bg-nadayu-accent text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:brightness-95 transition-all">
              <Camera size={16} /> Quick Scan
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="lg:col-span-3 space-y-5">
          {activeTab === 'overview' && (
            <>
              {/* Stats - each cell is a real link to where that number lives */}
              <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-50">
                  <h2 className="text-gray-900 font-semibold text-sm">Today's Stats</h2>
                  <span className="text-nadayu-muted text-xs">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-gray-50">
                  {[
                    { label: 'Total Scans', value: todayStats.scansToday, action: () => setActiveTab('log') },
                    { label: 'Verified', value: todayStats.verified, action: () => setActiveTab('log') },
                    { label: 'Warnings', value: todayStats.warnings, warn: todayStats.warnings > 0 },
                    { label: 'Pending', value: todayStats.pending, action: () => setActiveTab('log') },
                  ].map(s => (
                    s.action ? (
                      <button key={s.label} onClick={s.action} className="text-left px-6 py-4 hover:bg-nadayu-cream/50 transition-colors">
                        <p className="text-xs font-semibold text-nadayu-muted mb-1.5">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.warn ? 'text-nadayu-warning' : 'text-gray-900'}`}>{s.value}</p>
                      </button>
                    ) : (
                      <div key={s.label} className="px-6 py-4">
                        <p className="text-xs font-semibold text-nadayu-muted mb-1.5">{s.label}</p>
                        <p className={`text-2xl font-bold ${s.warn ? 'text-nadayu-warning' : 'text-gray-900'}`}>{s.value}</p>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Flagged visitors */}
              <div className="bg-white border border-nadayu-border rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-gray-900" />
                    <h3 className="text-sm font-semibold text-gray-900">Flagged Today</h3>
                  </div>
                </div>
                {todaysVisitors.filter(v => v.status === 'flagged').length === 0 ? (
                  <p className="text-gray-400 text-xs py-3">No flagged visitors today.</p>
                ) : (
                  todaysVisitors.filter(v => v.status === 'flagged').map((v, i) => (
                    <div key={v.id} className={`flex items-start gap-3 py-3 ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-nadayu-danger"></span>
                      <p className="text-gray-600 text-xs flex-1 leading-relaxed">{v.visitorName} — Unit {v.residentUnit}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'log' && (
            <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
              <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ScanLine size={14} className="text-gray-900" />
                  <h3 className="text-sm font-semibold text-gray-900">Today's Visitor Log</h3>
                </div>
                <span className="text-xs text-nadayu-muted">Today</span>
              </div>
              <div>
                {todaysVisitors.length === 0 && (
                  <p className="px-6 py-12 text-center text-sm text-nadayu-muted">No visitor activity yet today.</p>
                )}
                {todaysVisitors.map((v, i) => (
                  <div key={v.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-nadayu-cream/50 transition-colors ${i !== 0 ? 'border-t border-gray-50' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.status === 'flagged' ? 'bg-nadayu-danger/10' : 'bg-nadayu-success/15'}`}>
                      {v.status === 'flagged'
                        ? <AlertTriangle size={18} className="text-nadayu-danger" />
                        : <CheckCircle2 size={18} className="text-nadayu-success" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900">{v.visitorName}</p>
                      <p className="text-xs text-nadayu-muted">Unit {v.residentUnit}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-nadayu-muted">{new Date(v.actualArrival ?? v.expectedArrival).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                      <span className={`text-[10px] font-bold uppercase ${v.status === 'flagged' ? 'text-nadayu-danger' : 'text-nadayu-success'}`}>{v.status}</span>
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
                    <User size={18} className="text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Personal Details</h3>
                </div>
                <button
                  onClick={() => { if (isEditing) { handleSaveDetails(); } else { setIsEditing(true); } }}
                  disabled={isSaving}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all disabled:opacity-50 ${
                    isEditing ? 'bg-nadayu-accent text-white' : 'bg-white/10 text-white hover:bg-white/20'
                  }`}>
                  {isEditing ? <><Save size={14} /> {isSaving ? 'Saving...' : 'Save'}</> : <><Edit2 size={14} /> Edit</>}
                </button>
              </div>
              <div className="p-6 space-y-5">
                {([
                  { label: 'Full Name', value: nameInput, onChange: setNameInput, icon: User, editable: true },
                  { label: 'Email', value: userProfile?.email || '', onChange: undefined, icon: Mail, editable: false },
                  { label: 'Phone', value: phoneInput, onChange: setPhoneInput, icon: Phone, editable: true },
                ]).map(item => (
                  <div key={item.label} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 bg-nadayu-cream rounded-xl flex items-center justify-center flex-shrink-0">
                      <item.icon size={16} className="text-nadayu-muted" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider">{item.label}</p>
                      {isEditing && item.editable && item.onChange ? (
                        <input
                          type="text"
                          value={item.value}
                          onChange={e => item.onChange!(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-nadayu-cream border border-nadayu-border rounded-lg text-sm font-semibold text-gray-900 outline-none focus:border-nadayu-accent focus:ring-1 focus:ring-nadayu-accent/20"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-900 mt-0.5">{item.value || '—'}</p>
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
