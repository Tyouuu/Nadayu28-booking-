import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { MOCK_VIOLATIONS } from '../constants';
import { Download, Filter, MoreHorizontal } from 'lucide-react';

const parkingData = [
  { name: 'Mon', visitors: 12, violations: 1 },
  { name: 'Tue', visitors: 19, violations: 0 },
  { name: 'Wed', visitors: 15, violations: 2 },
  { name: 'Thu', visitors: 22, violations: 1 },
  { name: 'Fri', visitors: 35, violations: 3 },
  { name: 'Sat', visitors: 45, violations: 5 },
  { name: 'Sun', visitors: 40, violations: 4 },
];

const facilityUsage = [
  { name: 'Gym', hours: 120 },
  { name: 'BBQ', hours: 45 },
  { name: 'Tennis', hours: 80 },
  { name: 'Party', hours: 20 },
];

export const AdminPanel: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Management Dashboard</h2>
          <p className="text-slate-500 mt-2 text-lg">Resource utilization overview and enforcement tracking.</p>
        </div>
        <button className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
           <Download size={16} /> Export Report
        </button>
      </header>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Visitor Traffic</h3>
              <p className="text-slate-400 text-sm font-medium">Weekly Overview</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><MoreHorizontal size={20} /></button>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={parkingData}>
                <defs>
                  <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px 16px',
                    fontFamily: 'Inter',
                    fontWeight: 600
                  }}
                  itemStyle={{ padding: 0 }}
                />
                <Line type="monotone" dataKey="visitors" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="violations" stroke="#ef4444" strokeWidth={4} dot={{ r: 4, fill: '#ef4444', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-8 mt-6">
             <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100">
               <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-sm"></div>
               <span className="text-xs font-bold text-indigo-700 uppercase tracking-wide">Visitors</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-red-50 rounded-full border border-red-100">
               <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm"></div>
               <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Violations</span>
             </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Facility Usage</h3>
              <p className="text-slate-400 text-sm font-medium">Hours per Week</p>
            </div>
            <button className="p-2 hover:bg-slate-50 rounded-full transition-colors text-slate-400"><Filter size={20} /></button>
          </div>
          <div className="h-72">
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={facilityUsage}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 600 }} />
                <Bar dataKey="hours" fill="#1e293b" radius={[8, 8, 8, 8]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Enforcement Table */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Recent Violations</h3>
            <p className="text-slate-500 text-sm">Action required items</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-widest font-bold">
              <tr>
                <th className="px-8 py-5">Unit</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_VIOLATIONS.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-8 py-5 font-bold text-slate-800">{v.unit}</td>
                  <td className="px-8 py-5 text-slate-600 font-medium">{v.type}</td>
                  <td className="px-8 py-5 text-slate-500">{v.date}</td>
                  <td className="px-8 py-5 text-slate-900 font-bold">RM {v.amount}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                      v.status === 'paid' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-indigo-600 hover:text-indigo-800 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">View Details</button>
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