import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, Filter, MoreHorizontal } from 'lucide-react';
import { analyticsApi, AnalyticsResponse } from '../services/api';

export const AdminPanel: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    analyticsApi
      .get()
      .then((data) => { if (!cancelled) setAnalytics(data); })
      .catch((err) => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load analytics'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const bookingsByDay = analytics?.bookingsByDay ?? [];
  const facilityUsage = analytics?.facilityUsage ?? [];
  const recentTasks = analytics?.recentMaintenanceTasks ?? [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold" style={{color: '#F5F5F7'}}>Management Dashboard</h2>
          <p className="mt-2 text-lg" style={{color: '#B0B0B8'}}>Resource utilization overview and enforcement tracking.</p>
        </div>
        <button className="border px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', color: '#F5F5F7'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2D2B55'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3D3B65'}>
           <Download size={16} /> Export Report
        </button>
      </header>

      {loadError && (
        <div className="border-l-4 p-4 rounded-lg" style={{backgroundColor: 'rgba(239,68,68,0.1)', borderColor: '#EF4444', color: '#FCA5A5'}}>
          <p className="text-sm font-medium">{loadError}</p>
        </div>
      )}

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="p-8 rounded-[2.5rem] shadow-xl border hover:shadow-2xl transition-shadow duration-300" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', boxShadow: '0 10px 25px rgba(45, 43, 85, 0.2)'}}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold" style={{color: '#F5F5F7'}}>Booking Activity</h3>
              <p className="text-sm font-medium" style={{color: '#B0B0B8'}}>Weekly Overview (live from Supabase)</p>
            </div>
            <button className="p-2 rounded-full transition-colors" style={{color: '#B0B0B8'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 179, 37, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><MoreHorizontal size={20} /></button>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bookingsByDay}>
                <defs>
                  <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E6B325" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#E6B325" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4A4860" />
                <XAxis dataKey="name" stroke="#B0B0B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#B0B0B8" fontSize={12} tickLine={false} axisLine={false} dx={-10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                    fontFamily: 'Inter',
                    fontWeight: 600,
                    backgroundColor: '#2D2B55',
                    color: '#F5F5F7'
                  }}
                  itemStyle={{ padding: 0 }}
                />
                <Line type="monotone" dataKey="bookings" stroke="#E6B325" strokeWidth={4} dot={{ r: 4, fill: '#E6B325', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-6">
             <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'rgba(230, 179, 37, 0.15)', borderColor: '#E6B325', border: '1px solid'}}>
               <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: '#E6B325'}}></div>
               <span className="text-xs font-bold uppercase tracking-wide" style={{color: '#E6B325'}}>Bookings</span>
             </div>
          </div>
        </div>

        <div className="p-8 rounded-[2.5rem] shadow-xl border hover:shadow-2xl transition-shadow duration-300" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', boxShadow: '0 10px 25px rgba(45, 43, 85, 0.2)'}}>
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold" style={{color: '#F5F5F7'}}>Facility Usage</h3>
              <p className="text-sm font-medium" style={{color: '#B0B0B8'}}>Hours per Week</p>
            </div>
            <button className="p-2 rounded-full transition-colors" style={{color: '#B0B0B8'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 179, 37, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><Filter size={20} /></button>
          </div>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4A4860" />
                <XAxis dataKey="name" stroke="#B0B0B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#B0B0B8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{fill: 'rgba(74, 72, 96, 0.5)'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600, backgroundColor: '#2D2B55', color: '#F5F5F7' }} />
                <Bar dataKey="hours" fill="#E6B325" radius={[8, 8, 8, 8]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Maintenance Reports Table */}
      <div className="rounded-[2.5rem] shadow-xl border overflow-hidden" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', boxShadow: '0 10px 25px rgba(45, 43, 85, 0.2)'}}>
        <div className="p-8 border-b flex justify-between items-center" style={{borderColor: '#4A4860', backgroundColor: 'rgba(230, 179, 37, 0.05)'}}>
          <div>
            <h3 className="text-xl font-bold" style={{color: '#F5F5F7'}}>Recent Maintenance Reports</h3>
            <p className="text-sm" style={{color: '#B0B0B8'}}>Latest tickets submitted by residents</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="uppercase text-[10px] tracking-widest font-bold" style={{backgroundColor: 'rgba(230, 179, 37, 0.1)', color: '#B0B0B8'}}>
              <tr>
                <th className="px-8 py-5">Unit</th>
                <th className="px-8 py-5">Issue</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Priority</th>
                <th className="px-8 py-5">Status</th>
              </tr>
            </thead>
            <tbody style={{borderColor: '#4A4860'}} className="divide-y">
              {loading && (
                <tr><td colSpan={5} className="px-8 py-8 text-center" style={{color: '#B0B0B8'}}>Loading...</td></tr>
              )}
              {!loading && recentTasks.length === 0 && (
                <tr><td colSpan={5} className="px-8 py-8 text-center" style={{color: '#B0B0B8'}}>No maintenance reports yet.</td></tr>
              )}
              {recentTasks.map((t) => (
                <tr key={t.id} className="transition-colors group" style={{backgroundColor: '#2D2B55'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D3B65'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2D2B55'}>
                  <td className="px-8 py-5 font-bold" style={{color: '#F5F5F7'}}>{t.resident_unit ?? '-'}</td>
                  <td className="px-8 py-5 font-medium" style={{color: '#B0B0B8'}}>{t.title}</td>
                  <td className="px-8 py-5" style={{color: '#B0B0B8'}}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</td>
                  <td className="px-8 py-5" style={{color: '#B0B0B8'}}>{t.priority}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border`} style={{
                      backgroundColor: t.status === 'completed' ? 'rgba(230, 179, 37, 0.15)' : 'rgba(245, 213, 71, 0.15)',
                      color: t.status === 'completed' ? '#E6B325' : '#F5D547',
                      borderColor: t.status === 'completed' ? '#E6B325' : '#F5D547'
                    }}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};