import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Car, Plus, Trash2, History, AlertTriangle, FileText, Settings, Camera, Save } from 'lucide-react';
import { MOCK_BOOKINGS, MOCK_VIOLATIONS, MOCK_REPORTS, MOCK_VEHICLES } from '../constants';
import { Vehicle } from '../types';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'details' | 'vehicles' | 'history'>('details');
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [newVehicle, setNewVehicle] = useState({ plate: '', model: '' });
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVehicle.plate) return;
    const vehicle: Vehicle = {
      id: Date.now().toString(),
      plateNumber: newVehicle.plate.toUpperCase(),
      model: newVehicle.model,
      isPrimary: vehicles.length === 0
    };
    setVehicles([...vehicles, vehicle]);
    setNewVehicle({ plate: '', model: '' });
    setIsAddingVehicle(false);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  return (
    <div className="animate-fade-in pb-12">
      {/* Profile Header with Cover */}
      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 overflow-hidden mb-8 border border-slate-100">
         <div className="h-48 bg-gradient-to-r from-slate-800 to-slate-900 relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
         </div>
         <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-12 gap-6">
            <div className="relative">
               <div className="w-32 h-32 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  <User size={48} className="text-slate-300" />
               </div>
               <button className="absolute bottom-0 right-0 p-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-700 transition-colors shadow-md border-2 border-white">
                 <Camera size={14} />
               </button>
            </div>
            <div className="flex-1 mb-2 text-center md:text-left">
               <h2 className="text-3xl font-bold text-slate-800">Alex Tan</h2>
               <p className="text-slate-500 font-medium">Resident • Unit A-12-05</p>
            </div>
            <div className="flex gap-2 mb-2 w-full md:w-auto">
               {(['details', 'vehicles', 'history'] as const).map(tab => (
                 <button
                   key={tab}
                   onClick={() => setActiveTab(tab)}
                   className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold capitalize transition-all ${
                     activeTab === tab 
                       ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                       : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                   }`}
                 >
                   {tab}
                 </button>
               ))}
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {activeTab === 'details' && (
          <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
               <h3 className="text-xl font-bold text-slate-800">Account Settings</h3>
            </div>
            
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">First Name</label>
                  <input type="text" defaultValue="Alex" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700" />
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Last Name</label>
                  <input type="text" defaultValue="Tan" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700" />
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
                 <div className="relative">
                   <Mail className="absolute left-5 top-4.5 text-slate-400" size={20} />
                   <input type="email" defaultValue="alex.tan@example.com" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700" />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone Number</label>
                 <div className="relative">
                   <Phone className="absolute left-5 top-4.5 text-slate-400" size={20} />
                   <input type="tel" defaultValue="+60 12-345 6789" className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-700" />
                 </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2">
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-6 animate-fade-in-up">
             <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-xl shadow-indigo-200 flex justify-between items-center relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="text-2xl font-bold mb-1">My Vehicles</h3>
                   <p className="text-indigo-200">Manage registered plates for auto-entry.</p>
                </div>
                <button 
                  onClick={() => setIsAddingVehicle(true)}
                  className="relative z-10 bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors shadow-lg"
                >
                  <Plus size={16} className="inline mr-1" /> Add New
                </button>
                <div className="absolute right-0 bottom-0 opacity-10">
                   <Car size={200} />
                </div>
             </div>

             {isAddingVehicle && (
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg animate-fade-in">
                  <h4 className="font-bold text-slate-800 mb-4">Register New Vehicle</h4>
                  <form onSubmit={handleAddVehicle} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Plate Number</label>
                      <input 
                        type="text" 
                        value={newVehicle.plate}
                        onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 uppercase font-bold"
                        autoFocus
                      />
                    </div>
                    <div className="flex-1 w-full space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">Model</label>
                      <input 
                        type="text" 
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800">Add</button>
                      <button type="button" onClick={() => setIsAddingVehicle(false)} className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                        <Car size={32} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xl text-slate-800 tracking-wider mb-1">{vehicle.plateNumber}</h4>
                        <p className="text-sm text-slate-500 font-medium">{vehicle.model || 'Unknown Model'}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteVehicle(vehicle.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
          </div>
        )}
        
        {activeTab === 'history' && (
           <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 animate-fade-in-up">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Activity Log</h3>
              <div className="space-y-6">
                 {/* Reusing existing logic but simpler layout */}
                 <div className="border-l-2 border-slate-100 pl-6 space-y-8">
                    {MOCK_BOOKINGS.map(booking => (
                       <div key={booking.id} className="relative">
                          <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-indigo-500 border-4 border-white shadow-sm"></div>
                          <div className="flex justify-between items-start">
                             <div>
                                <h4 className="font-bold text-slate-800 capitalize">{booking.facilityType.replace('_', ' ')} Booking</h4>
                                <p className="text-sm text-slate-500 mt-1">{booking.date} at {booking.startTime}</p>
                             </div>
                             <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                booking.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                             }`}>{booking.status}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
};