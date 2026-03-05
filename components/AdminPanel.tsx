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
    <div className="space-y-5  pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold" style={{color: '#F5F5F7'}}>Management Dashboard</h2>
          <p className="mt-2 text-lg" style={{color: '#B0B0B8'}}>Resource utilization overview and enforcement tracking.</p>
        </div>
        <button className="border px-6 py-3 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center gap-2" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', color: '#F5F5F7'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2D2B55'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3D3B65'}>
           <Download size={16} /> Export Report
        </button>
      </header>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-6 rounded-[2.5rem] shadow-xl border hover:shadow-sm transition-shadow duration-300" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', boxShadow: '0 10px 25px rgba(45, 43, 85, 0.2)'}}>
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xl font-bold" style={{color: '#F5F5F7'}}>Visitor Traffic</h3>
              <p className="text-sm font-medium" style={{color: '#B0B0B8'}}>Weekly Overview</p>
            </div>
            <button className="p-2 rounded-full transition-colors" style={{color: '#B0B0B8'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 179, 37, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}><MoreHorizontal size={20} /></button>
          </div>
          
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={parkingData}>
                <defs>
                  <linearGradient id="colorVisitor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#C8FF00" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#C8FF00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#4A4860" />
                <XAxis dataKey="name" stroke="#B0B0B8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#B0B0B8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
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
                <Line type="monotone" dataKey="visitors" stroke="#C8FF00" strokeWidth={4} dot={{ r: 4, fill: '#C8FF00', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="violations" stroke="#F5D547" strokeWidth={4} dot={{ r: 4, fill: '#F5D547', strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-5 mt-6">
             <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'rgba(230, 179, 37, 0.15)', borderColor: '#C8FF00', border: '1px solid'}}>
               <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: '#C8FF00'}}></div>
               <span className="text-xs font-bold uppercase tracking-wide" style={{color: '#C8FF00'}}>Visitors</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{backgroundColor: 'rgba(245, 213, 71, 0.1)', borderColor: '#F5D547', border: '1px solid'}}>
               <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: '#F5D547'}}></div>
               <span className="text-xs font-bold uppercase tracking-wide" style={{color: '#F5D547'}}>Violations</span>
             </div>
          </div>
        </div>

        <div className="p-6 rounded-[2.5rem] shadow-xl border hover:shadow-sm transition-shadow duration-300" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', boxShadow: '0 10px 25px rgba(45, 43, 85, 0.2)'}}>
          <div className="flex justify-between items-center mb-5">
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
                <Bar dataKey="hours" fill="#C8FF00" radius={[8, 8, 8, 8]} barSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Enforcement Table */}
      <div className="rounded-[2.5rem] shadow-xl border overflow-hidden" style={{backgroundColor: '#3D3B65', borderColor: '#4A4860', boxShadow: '0 10px 25px rgba(45, 43, 85, 0.2)'}}>
        <div className="p-6 border-b flex justify-between items-center" style={{borderColor: '#4A4860', backgroundColor: 'rgba(230, 179, 37, 0.05)'}}>
          <div>
            <h3 className="text-xl font-bold" style={{color: '#F5F5F7'}}>Recent Violations</h3>
            <p className="text-sm" style={{color: '#B0B0B8'}}>Action required items</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="uppercase text-[10px] tracking-widest font-bold" style={{backgroundColor: 'rgba(230, 179, 37, 0.1)', color: '#B0B0B8'}}>
              <tr>
                <th className="px-8 py-5">Unit</th>
                <th className="px-8 py-5">Type</th>
                <th className="px-8 py-5">Date</th>
                <th className="px-8 py-5">Amount</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody style={{borderColor: '#4A4860'}} className="divide-y">
              {MOCK_VIOLATIONS.map((v) => (
                <tr key={v.id} className="transition-colors group" style={{backgroundColor: '#2D2B55'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#3D3B65'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2D2B55'}>
                  <td className="px-8 py-5 font-bold" style={{color: '#F5F5F7'}}>{v.unit}</td>
                  <td className="px-8 py-5 font-medium" style={{color: '#B0B0B8'}}>{v.type}</td>
                  <td className="px-8 py-5" style={{color: '#B0B0B8'}}>{v.date}</td>
                  <td className="px-8 py-5 font-bold" style={{color: '#F5F5F7'}}>RM {v.amount}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide border`} style={{
                      backgroundColor: v.status === 'paid' ? 'rgba(230, 179, 37, 0.15)' : 'rgba(245, 213, 71, 0.15)',
                      color: v.status === 'paid' ? '#C8FF00' : '#F5D547',
                      borderColor: v.status === 'paid' ? '#C8FF00' : '#F5D547'
                    }}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity" style={{color: '#C8FF00'}}>View Details</button>
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