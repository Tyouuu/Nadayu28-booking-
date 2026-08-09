'use client';

import React, { useEffect, useState } from 'react';
import { Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchInvoices, Invoice } from '../services/dataService';

export const Billing: React.FC = () => {
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.unit) { setLoading(false); return; }
    fetchInvoices(userProfile.unit)
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userProfile?.unit]);

  const current = invoices[0];
  const isOverdue = current?.status === 'unpaid' && new Date(current.dueDate) < new Date();
  const history = invoices.filter(inv => inv.status === 'paid');

  return (
    <div className="pb-12">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <Receipt size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Billing</h2>
          <p className="mt-1 text-sm text-nadayu-muted">Maintenance fee statement for {userProfile?.unit ?? 'your unit'}.</p>
        </div>
      </div>

      {loading && <p className="text-nadayu-muted text-sm">Loading...</p>}

      {!loading && !current && (
        <div className="bg-white border border-nadayu-border rounded-2xl p-8 text-center text-nadayu-muted">
          No billing set up for your unit yet. Contact management if you believe this is an error.
        </div>
      )}

      {current && (
        <div className={`rounded-2xl p-6 mb-6 border ${isOverdue ? 'bg-nadayu-danger/5 border-nadayu-danger/30' : 'bg-white border-nadayu-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-nadayu-muted">Current Period · {current.period}</p>
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs font-bold text-nadayu-danger uppercase">
                <AlertTriangle size={14} /> Overdue
              </span>
            )}
            {current.status === 'paid' && (
              <span className="flex items-center gap-1 text-xs font-bold text-nadayu-success uppercase">
                <CheckCircle2 size={14} /> Paid
              </span>
            )}
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">RM {current.amount.toFixed(2)}</p>
          <p className="text-sm text-nadayu-muted">Due {new Date(current.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      )}

      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Payment History</h3>
      <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
              <tr>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Paid Date</th>
                <th className="px-6 py-4">Method</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {history.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-nadayu-muted">No payment history yet.</td></tr>
              )}
              {history.map(inv => (
                <tr key={inv.id}>
                  <td className="px-6 py-4 font-bold text-gray-900">{inv.period}</td>
                  <td className="px-6 py-4 text-gray-900">RM {inv.amount.toFixed(2)}</td>
                  <td className="px-6 py-4 text-nadayu-muted">{inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('en-GB') : '-'}</td>
                  <td className="px-6 py-4 text-nadayu-muted capitalize">{inv.paymentMethod?.replace('_', ' ') ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
