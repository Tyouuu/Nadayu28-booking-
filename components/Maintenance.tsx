'use client';

import React, { useState, useEffect } from 'react';
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchReports, updateReport } from '../services/dataService';
import { Report } from '../types';

const STATUS_OPTIONS: Report['status'][] = ['Received', 'In Progress', 'Resolved'];

export const Maintenance: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<Report['status'] | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { assignedToName: string; resolutionNotes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => { fetchReports().then(setReports).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? reports : reports.filter(r => r.status === statusFilter);

  const getDraft = (r: Report) => drafts[r.id] ?? { assignedToName: r.assignedToName ?? '', resolutionNotes: r.resolutionNotes ?? '' };

  const handleSave = async (r: Report, status: Report['status']) => {
    const draft = getDraft(r);
    setSavingId(r.id);
    try {
      await updateReport(r.id, {
        status,
        assignedToName: draft.assignedToName || undefined,
        resolutionNotes: draft.resolutionNotes || undefined,
      });
      load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <Wrench size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Maintenance</h2>
          <p className="mt-1 text-sm text-nadayu-muted">Track and resolve resident-reported issues.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', ...STATUS_OPTIONS] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              statusFilter === s ? 'bg-nadayu-panel text-white' : 'bg-nadayu-cream text-gray-500 hover:bg-gray-200'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden divide-y divide-gray-50">
        {filtered.length === 0 && (
          <p className="text-sm text-nadayu-muted text-center py-12">No reports in this status.</p>
        )}
        {filtered.map(r => {
          const isOpen = expandedId === r.id;
          const draft = getDraft(r);
          return (
            <div key={r.id}>
              <button onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-nadayu-cream/50 transition-colors text-left">
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.category}</p>
                  <p className="text-xs text-nadayu-muted mt-0.5">Unit {r.residentUnit} · {r.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    r.status === 'Resolved' ? 'bg-nadayu-success/15 text-nadayu-success' :
                    r.status === 'In Progress' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                  }`}>{r.status}</span>
                  {isOpen ? <ChevronUp size={16} className="text-nadayu-muted" /> : <ChevronDown size={16} className="text-nadayu-muted" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-6 pb-5 space-y-4">
                  <p className="text-sm text-gray-600">{r.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider">Assigned To</label>
                      <input type="text" value={draft.assignedToName}
                        onChange={(e) => setDrafts(prev => ({ ...prev, [r.id]: { ...getDraft(r), assignedToName: e.target.value } }))}
                        placeholder="Staff/contractor name"
                        className="w-full px-3 py-2.5 bg-nadayu-cream border border-nadayu-border rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider">Resolution Notes</label>
                      <input type="text" value={draft.resolutionNotes}
                        onChange={(e) => setDrafts(prev => ({ ...prev, [r.id]: { ...getDraft(r), resolutionNotes: e.target.value } }))}
                        placeholder="What was done"
                        className="w-full px-3 py-2.5 bg-nadayu-cream border border-nadayu-border rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} onClick={() => handleSave(r, s)} disabled={savingId === r.id}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                          r.status === s ? 'bg-nadayu-panel text-white' : 'bg-nadayu-cream text-gray-600 hover:bg-gray-200'
                        }`}>
                        {savingId === r.id ? 'Saving...' : `Set: ${s}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
