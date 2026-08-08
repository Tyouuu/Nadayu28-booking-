'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { fetchViolations, fetchReports, fetchUsers, updateUserRole, fetchAuditLog, AuditLogEntry, updateViolationStatus, fetchAllInvoices, fetchAllFeeSchedules, setFeeSchedule, recordInvoicePayment, computeArrearsReport, computeCollectionTrend, arrearsToCSV, computeVisitorTraffic, computeFacilityUsage, fetchVisitors, fetchBookings, Visitor, Invoice, FeeSchedule } from '../services/dataService';
import { Violation, Report, User, UserRole, Booking } from '../types';
import { Download, Filter, MoreHorizontal, X, AlertTriangle, Calendar, MapPin, DollarSign, Clock, Receipt } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [violationsError, setViolationsError] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  useEffect(() => {
    fetchViolations().then(setViolations).catch(() => setViolationsError(true));
  }, []);

  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  useEffect(() => {
    fetchVisitors().then(setVisitors).catch(() => {});
    fetchBookings().then(setAllBookings).catch(() => {});
  }, []);
  const parkingData = useMemo(() => computeVisitorTraffic(visitors, violations), [visitors, violations]);
  const facilityUsage = useMemo(() => computeFacilityUsage(allBookings), [allBookings]);

  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    fetchReports().then(setReports).catch(() => {});
  }, []);

  const overdueCount = reports.filter(r =>
    r.status === 'Received' && r.createdAt && (Date.now() - new Date(r.createdAt).getTime()) > 24 * 60 * 60 * 1000
  ).length;

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'billing' | 'audit'>('overview');

  const [users, setUsers] = useState<User[]>([]);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => {});
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setSavingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      fetchUsers().then(setUsers).catch(() => {});
    } finally {
      setSavingUserId(null);
    }
  };

  const handleMarkPaid = async (violationId: string) => {
    await updateViolationStatus(violationId, 'paid');
    fetchViolations().then(setViolations).catch(() => {});
    setSelectedViolation(null);
  };

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
  const [paymentForm, setPaymentForm] = useState({ paidDate: '', method: 'bank_transfer' as 'bank_transfer' | 'cash' | 'cheque' | 'other', reference: '' });
  const [editingRateUnit, setEditingRateUnit] = useState<string | null>(null);
  const [rateInput, setRateInput] = useState('');
  const [newUnitId, setNewUnitId] = useState('');
  const [newUnitRate, setNewUnitRate] = useState('');

  const arrearsReport = useMemo(() => computeArrearsReport(invoices), [invoices]);
  const collectionTrend = useMemo(() => computeCollectionTrend(invoices), [invoices]);
  const totalOutstanding = arrearsReport.reduce((sum, r) => sum + r.totalOwed, 0);
  const currentMonthRate = collectionTrend.length > 0 ? collectionTrend[collectionTrend.length - 1].rate : null;

  const handleExportArrearsCSV = () => {
    const csv = arrearsToCSV(arrearsReport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arrears-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadBilling = () => {
    fetchAllInvoices().then(setInvoices).catch(() => {});
    fetchAllFeeSchedules().then(setFeeSchedules).catch(() => {});
  };

  useEffect(() => {
    if (activeTab === 'billing') loadBilling();
  }, [activeTab]);

  const handleSaveRate = async (unit: string) => {
    const amount = parseFloat(rateInput);
    if (isNaN(amount) || amount < 0) return;
    await setFeeSchedule(unit, amount);
    setEditingRateUnit(null);
    loadBilling();
  };

  const handleRecordPayment = async () => {
    if (!paymentModalInvoice || !paymentForm.paidDate || !paymentForm.reference) return;
    await recordInvoicePayment(paymentModalInvoice.id, paymentForm);
    setPaymentModalInvoice(null);
    setPaymentForm({ paidDate: '', method: 'bank_transfer', reference: '' });
    loadBilling();
  };

  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<'all' | 'violation_status_change' | 'report_update' | 'role_change'>('all');
  useEffect(() => {
    fetchAuditLog(auditFilter === 'all' ? undefined : auditFilter).then(setAuditLog).catch(() => {});
  }, [auditFilter]);

  return (
    <div className="space-y-5 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[11px] text-nadayu-muted uppercase tracking-widest font-semibold mb-1">Administration</p>
          <h2 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">Management Dashboard</h2>
          <p className="text-nadayu-muted text-sm mt-1">Resource utilization overview and enforcement tracking.</p>
        </div>
        <button className="flex items-center gap-2 bg-nadayu-panel text-white px-5 py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-colors">
          <Download size={16} /> Export Report
        </button>
      </header>

      <div className="flex gap-2">
        {(['overview', 'users', 'billing', 'audit'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab ? 'bg-nadayu-panel text-white' : 'bg-nadayu-cream text-gray-500 hover:bg-gray-200'
            }`}>
            {tab === 'overview' ? 'Overview' : tab === 'users' ? 'Users' : tab === 'billing' ? 'Billing' : 'Audit Log'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
      <div className="bg-white border border-nadayu-border rounded-2xl p-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
          <Clock size={20} className="text-orange-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 leading-none">{overdueCount}</p>
          <p className="text-xs text-nadayu-muted mt-1">Reports overdue (received &gt;24h ago, unactioned)</p>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Visitor Traffic */}
        <div className="bg-white border border-nadayu-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Visitor Traffic</h3>
              <p className="text-sm text-nadayu-muted">Weekly Overview</p>
            </div>
            <button className="p-2 rounded-xl text-nadayu-muted hover:bg-nadayu-cream transition-colors"><MoreHorizontal size={18} /></button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={parkingData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    padding: '10px 14px',
                    fontWeight: 600,
                    backgroundColor: '#fff',
                    color: '#0F172A',
                  }}
                />
                <Line type="monotone" dataKey="visitors" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="violations" stroke="#ff6b6b" strokeWidth={3} dot={{ r: 4, fill: '#ff6b6b', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-nadayu-accent/15">
              <div className="w-2 h-2 rounded-full bg-nadayu-accent"></div>
              <span className="text-[11px] font-bold text-nadayu-accent">Visitors</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/15">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <span className="text-[11px] font-bold text-red-400">Violations</span>
            </div>
          </div>
        </div>

        {/* Facility Usage */}
        <div className="bg-white border border-nadayu-border rounded-2xl p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Facility Usage</h3>
              <p className="text-sm text-nadayu-muted">Hours per Week</p>
            </div>
            <button className="p-2 rounded-xl text-nadayu-muted hover:bg-nadayu-cream transition-colors"><Filter size={18} /></button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontWeight: 600, backgroundColor: '#fff', color: '#0F172A' }} />
                <Bar dataKey="hours" fill="#2563EB" radius={[8, 8, 8, 8]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Enforcement Table */}
      <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
        <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Recent Violations</h3>
            <p className="text-xs text-nadayu-muted mt-0.5">Action required items</p>
          </div>
        </div>
        {violationsError && (
          <div className="px-6 py-4 bg-red-50 text-red-600 text-sm font-medium flex items-center gap-2">
            <AlertTriangle size={16} /> Couldn't load violations — please refresh.
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
              <tr>
                <th className="px-6 py-4">Unit</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {violations.map((v) => (
                <tr key={v.id} className="hover:bg-nadayu-cream/50 transition-colors group">
                  <td className="px-6 py-4 font-bold text-gray-900">{v.unit}</td>
                  <td className="px-6 py-4 text-gray-500">{v.type}</td>
                  <td className="px-6 py-4 text-nadayu-muted">{v.date}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">RM {v.amount}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      v.status === 'paid'
                        ? 'bg-nadayu-success/15 text-nadayu-success'
                        : 'bg-orange-50 text-orange-500'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedViolation(v)} className="font-bold text-xs text-nadayu-muted opacity-0 group-hover:opacity-100 hover:text-nadayu-panel transition-all">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Violation Detail Modal */}
      {selectedViolation && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedViolation(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-nadayu-panel p-6 flex items-center justify-between">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <AlertTriangle size={18} className="text-nadayu-accent" />
                Violation Details
              </h3>
              <button onClick={() => setSelectedViolation(null)} className="text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Unit', value: selectedViolation.unit, icon: MapPin },
                { label: 'Type', value: selectedViolation.type, icon: AlertTriangle },
                { label: 'Date', value: selectedViolation.date, icon: Calendar },
                { label: 'Amount', value: `RM ${selectedViolation.amount}`, icon: DollarSign },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-4 py-2">
                  <div className="w-10 h-10 bg-nadayu-cream rounded-xl flex items-center justify-center flex-shrink-0">
                    <item.icon size={16} className="text-nadayu-muted" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-3 pt-2">
                <span className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider">Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                  selectedViolation.status === 'paid' ? 'bg-nadayu-success/15 text-nadayu-success' : 'bg-orange-50 text-orange-500'
                }`}>{selectedViolation.status}</span>
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              {selectedViolation.status === 'pending' && (
                <button onClick={() => handleMarkPaid(selectedViolation.id)} className="flex-1 bg-nadayu-panel text-white py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-colors">
                  Mark as Paid
                </button>
              )}
              <button onClick={() => setSelectedViolation(null)} className="flex-1 bg-nadayu-cream text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-nadayu-cream/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-gray-500">{u.unit || '-'}</td>
                    <td className="px-6 py-4 text-nadayu-muted">{u.email || '-'}</td>
                    <td className="px-6 py-4">
                      <select value={u.role} disabled={savingUserId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-3 py-2 bg-nadayu-cream border border-nadayu-border rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none">
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-5">
          {invoices.length === 0 ? (
            <div className="bg-white border border-nadayu-border rounded-2xl p-6 text-sm text-nadayu-muted">
              No billing data yet — financial reports will appear once invoices exist.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-nadayu-border rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">RM {totalOutstanding.toFixed(2)}</p>
                    <p className="text-xs text-nadayu-muted mt-1">Total outstanding</p>
                  </div>
                </div>
                <div className="bg-white border border-nadayu-border rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{arrearsReport.length}</p>
                    <p className="text-xs text-nadayu-muted mt-1">Units in arrears</p>
                  </div>
                </div>
                <div className="bg-white border border-nadayu-border rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-nadayu-accent/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Receipt size={20} className="text-nadayu-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{currentMonthRate === null ? '—' : `${currentMonthRate}%`}</p>
                    <p className="text-xs text-nadayu-muted mt-1">Current month collection rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-nadayu-border rounded-2xl p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Collection Rate Trend</h3>
                    <p className="text-sm text-nadayu-muted">Last {collectionTrend.length} periods</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="period" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} unit="%" />
                      <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontWeight: 600, backgroundColor: '#fff', color: '#0F172A' }} formatter={(value: number) => [`${value}%`, 'Collected']} />
                      <Bar dataKey="rate" fill="#2563EB" radius={[8, 8, 8, 8]} barSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Arrears Report</h3>
                    <p className="text-xs text-nadayu-muted mt-0.5">Units with overdue unpaid invoices, worst first</p>
                  </div>
                  {arrearsReport.length > 0 && (
                    <button onClick={handleExportArrearsCSV} className="flex items-center gap-2 bg-nadayu-cream text-gray-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-200 transition-colors">
                      <Download size={14} /> Export CSV
                    </button>
                  )}
                </div>
                {arrearsReport.length === 0 ? (
                  <div className="p-6 text-sm text-nadayu-muted">No units in arrears — nice.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
                        <tr>
                          <th className="px-6 py-4">Unit</th>
                          <th className="px-6 py-4">Amount Owed</th>
                          <th className="px-6 py-4">Oldest Due Date</th>
                          <th className="px-6 py-4">Days Overdue</th>
                          <th className="px-6 py-4">Overdue Invoices</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {arrearsReport.map(row => (
                          <tr key={row.unit}>
                            <td className="px-6 py-4 font-bold text-gray-900">{row.unit}</td>
                            <td className="px-6 py-4 text-gray-900">RM {row.totalOwed.toFixed(2)}</td>
                            <td className="px-6 py-4 text-nadayu-muted">{row.oldestDueDate}</td>
                            <td className="px-6 py-4 text-orange-500 font-bold">{row.daysOverdue}</td>
                            <td className="px-6 py-4 text-nadayu-muted">{row.overdueCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Fee Schedules</h3>
              <p className="text-xs text-nadayu-muted mt-0.5">Monthly maintenance fee per unit</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
                  <tr>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Monthly Amount</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {feeSchedules.map(fs => (
                    <tr key={fs.unit}>
                      <td className="px-6 py-4 font-bold text-gray-900">{fs.unit}</td>
                      <td className="px-6 py-4 text-gray-900">
                        {editingRateUnit === fs.unit ? (
                          <input
                            type="number"
                            value={rateInput}
                            onChange={e => setRateInput(e.target.value)}
                            className="w-28 px-2 py-1 border border-nadayu-border rounded-lg text-sm"
                            autoFocus
                          />
                        ) : (
                          `RM ${fs.monthlyAmount.toFixed(2)}`
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {editingRateUnit === fs.unit ? (
                          <button onClick={() => handleSaveRate(fs.unit)} className="font-bold text-xs text-nadayu-accent">Save</button>
                        ) : (
                          <button onClick={() => { setEditingRateUnit(fs.unit); setRateInput(String(fs.monthlyAmount)); }} className="font-bold text-xs text-nadayu-muted hover:text-nadayu-panel">Edit</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-50 flex items-center gap-2">
              <input
                type="text"
                placeholder="New unit (e.g. C-08-01)"
                value={newUnitId}
                onChange={e => setNewUnitId(e.target.value)}
                className="px-3 py-2 border border-nadayu-border rounded-lg text-sm flex-1"
              />
              <input
                type="number"
                placeholder="Monthly RM"
                value={newUnitRate}
                onChange={e => setNewUnitRate(e.target.value)}
                className="w-28 px-3 py-2 border border-nadayu-border rounded-lg text-sm"
              />
              <button
                onClick={async () => {
                  const amount = parseFloat(newUnitRate);
                  if (!newUnitId || isNaN(amount)) return;
                  await setFeeSchedule(newUnitId, amount);
                  setNewUnitId('');
                  setNewUnitRate('');
                  loadBilling();
                }}
                className="bg-nadayu-panel text-white px-4 py-2 rounded-lg font-bold text-xs"
              >
                Add
              </button>
            </div>
          </div>

          <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Invoices</h3>
              <p className="text-xs text-nadayu-muted mt-0.5">All units, most recent period first</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
                  <tr>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Period</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => (
                    <tr key={inv.id}>
                      <td className="px-6 py-4 font-bold text-gray-900">{inv.unit}</td>
                      <td className="px-6 py-4 text-nadayu-muted">{inv.period}</td>
                      <td className="px-6 py-4 text-gray-900">RM {inv.amount.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          inv.status === 'paid' ? 'bg-nadayu-success/15 text-nadayu-success' : 'bg-orange-50 text-orange-500'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'unpaid' && (
                          <button onClick={() => setPaymentModalInvoice(inv)} className="font-bold text-xs text-nadayu-muted hover:text-nadayu-panel">Record Payment</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModalInvoice(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-nadayu-panel p-6">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Receipt size={18} className="text-nadayu-accent" /> Record Payment
              </h3>
              <p className="text-slate-400 text-xs mt-1">{paymentModalInvoice.unit} · {paymentModalInvoice.period} · RM {paymentModalInvoice.amount.toFixed(2)}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider block mb-1">Paid Date</label>
                <input type="date" value={paymentForm.paidDate} onChange={e => setPaymentForm({ ...paymentForm, paidDate: e.target.value })} className="w-full px-3 py-2 border border-nadayu-border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider block mb-1">Method</label>
                <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as typeof paymentForm.method })} className="w-full px-3 py-2 border border-nadayu-border rounded-lg text-sm">
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider block mb-1">Reference No.</label>
                <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="w-full px-3 py-2 border border-nadayu-border rounded-lg text-sm" placeholder="e.g. transaction ID" />
              </div>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={handleRecordPayment} className="flex-1 bg-nadayu-panel text-white py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-colors">Confirm</button>
              <button onClick={() => setPaymentModalInvoice(null)} className="flex-1 bg-nadayu-cream text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['all', 'violation_status_change', 'report_update', 'role_change'] as const).map(a => (
              <button key={a} onClick={() => setAuditFilter(a)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                  auditFilter === a ? 'bg-nadayu-panel text-white' : 'bg-nadayu-cream text-gray-500 hover:bg-gray-200'
                }`}>
                {a === 'all' ? 'All' : a === 'violation_status_change' ? 'Violation' : a === 'report_update' ? 'Report' : 'Role'}
              </button>
            ))}
          </div>
          <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
                  <tr>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Field</th>
                    <th className="px-6 py-4">Before → After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditLog.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-nadayu-muted">No audit entries yet.</td></tr>
                  )}
                  {auditLog.map(entry => (
                    <tr key={entry.id} className="hover:bg-nadayu-cream/50 transition-colors">
                      <td className="px-6 py-4 text-nadayu-muted">{new Date(entry.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{entry.actorName}</td>
                      <td className="px-6 py-4 text-gray-500">{entry.action}</td>
                      <td className="px-6 py-4 text-gray-500">{entry.field}</td>
                      <td className="px-6 py-4 text-gray-900 text-xs">{entry.beforeValue ?? '-'} → {entry.afterValue ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
