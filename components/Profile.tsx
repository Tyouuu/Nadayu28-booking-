import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Car, Plus, Trash2, History, AlertTriangle, FileText, Settings, Camera, Save, Lock, Users, Shield, Eye, EyeOff, Edit2, LogOut, Home, CheckCircle2, Calendar } from 'lucide-react';
import { MOCK_BOOKINGS, MOCK_VIOLATIONS, MOCK_REPORTS, MOCK_VEHICLES } from '../constants';
import { Vehicle } from '../types';

interface Tenant {
  id: string;
  name: string;
  email: string;
  unit: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

type AccountRole = 'owner' | 'tenant';

export const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'details' | 'vehicles' | 'security' | 'history' | 'tenants'>('details');
  const [accountRole, setAccountRole] = useState<AccountRole>('owner'); // Change to test different roles
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [newVehicle, setNewVehicle] = useState({ plate: '', model: '' });
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([
    { id: '1', name: 'John Smith', email: 'john@example.com', unit: 'A-12-05', status: 'active', joinDate: '2024-01-15' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', unit: 'A-12-06', status: 'active', joinDate: '2024-03-20' },
  ]);
  const [newTenant, setNewTenant] = useState({ name: '', email: '', unit: '' });
  const [isAddingTenant, setIsAddingTenant] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

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

  const handleAddTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.email) return;
    const tenant: Tenant = {
      id: Date.now().toString(),
      name: newTenant.name,
      email: newTenant.email,
      unit: newTenant.unit,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0]
    };
    setTenants([...tenants, tenant]);
    setNewTenant({ name: '', email: '', unit: '' });
    setIsAddingTenant(false);
  };

  const handleDeleteTenant = (id: string) => {
    setTenants(tenants.filter(t => t.id !== id));
    if (selectedTenant?.id === id) setSelectedTenant(null);
  };

  return (
    <div className="animate-fade-in pb-20">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#E6B325]/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#2D2B55]/5 rounded-full blur-[100px] -z-10"></div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
        
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] rounded-3xl p-8 shadow-2xl border border-[#4A4860]/50 sticky top-8 space-y-6">
            
            {/* Profile Avatar */}
            <div className="relative mx-auto w-fit">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#E6B325] to-[#D4A017] flex items-center justify-center shadow-lg shadow-[#E6B325]/30 border-2 border-[#E6B325]/30">
                <User size={48} className="text-[#1A1A2E]" />
              </div>
              <button className="absolute bottom-0 right-0 p-2.5 bg-[#E6B325] rounded-full text-[#1A1A2E] hover:bg-[#F5D547] transition-colors shadow-lg border-2 border-[#2D2B55]">
                <Camera size={16} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[#F5F5F7] mb-1">Alex Tan</h2>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  accountRole === 'owner' 
                    ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30' 
                    : 'bg-[#E6B325]/10 text-[#E6B325]/80 border border-[#E6B325]/20'
                }`}>
                  {accountRole === 'owner' ? <Shield className="inline mr-1" size={12} /> : <Home className="inline mr-1" size={12} />}
                  {accountRole === 'owner' ? 'Owner' : 'Tenant'}
                </div>
              </div>
              <p className="text-[#B0B0B8] text-sm font-medium">Unit A-12-05</p>
            </div>

            {/* Menu Items */}
            <div className="space-y-2 pt-4 border-t border-[#4A4860]/50">
              {accountRole === 'owner' ? (
                <>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'details'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <User size={18} /> Profile Details
                  </button>
                  <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'vehicles'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <Car size={18} /> Vehicles
                  </button>
                  <button
                    onClick={() => setActiveTab('tenants')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'tenants'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <Users size={18} /> Manage Tenants ({tenants.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'security'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <Lock size={18} /> Security
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'history'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <History size={18} /> Activity Log
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'details'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <User size={18} /> My Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'vehicles'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <Car size={18} /> My Vehicles
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'security'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <Lock size={18} /> Security
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'history'
                        ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30'
                        : 'text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50'
                    }`}
                  >
                    <History size={18} /> My Bookings
                  </button>
                </>
              )}
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-[#4A4860]/50">
              <button className="w-full px-5 py-4 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 border border-red-500/20">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="lg:col-span-3 space-y-6">
        {activeTab === 'details' && (
          <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] rounded-3xl p-8 shadow-2xl border border-[#4A4860]/50 animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-[#F5F5F7] flex items-center gap-2">
                <User size={24} className={accountRole === 'owner' ? 'text-[#E6B325]' : 'text-[#E6B325]'} />
                {accountRole === 'owner' ? 'Account Details' : 'My Profile'}
              </h3>
              <button 
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-300 ${
                  isEditingProfile 
                    ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30' 
                    : accountRole === 'owner'
                    ? 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30 hover:bg-[#E6B325]/30'
                    : 'bg-[#E6B325]/20 text-[#E6B325] border border-[#E6B325]/30 hover:bg-[#E6B325]/30'
                }`}
              >
                <Edit2 size={16} /> {isEditingProfile ? 'Editing...' : 'Edit'}
              </button>
            </div>

            <div className="border-t border-[#4A4860]/50 pt-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      defaultValue="Alex" 
                      disabled={!isEditingProfile}
                      className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue="Tan" 
                      disabled={!isEditingProfile}
                      className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-4 text-[#B0B0B8]" size={20} />
                    <input 
                      type="email" 
                      defaultValue="alex.tan@example.com" 
                      disabled={true}
                      className="w-full pl-12 pr-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                  <p className="text-xs text-[#B0B0B8] mt-2">Contact admin to change email address</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-4 text-[#B0B0B8]" size={20} />
                    <input 
                      type="tel" 
                      defaultValue="+60 12-345 6789" 
                      disabled={!isEditingProfile}
                      className="w-full pl-12 pr-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider">Unit Number</label>
                  <div className="relative">
                    <Home className="absolute left-5 top-4 text-[#B0B0B8]" size={20} />
                    <input 
                      type="text" 
                      defaultValue="A-12-05" 
                      disabled={true}
                      className="w-full pl-12 pr-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                </div>

                {accountRole === 'owner' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase tracking-wider">Account Type</label>
                    <div className="flex items-center gap-3 px-5 py-4 bg-[#E6B325]/10 border border-[#E6B325]/30 rounded-2xl">
                      <Shield className="text-[#E6B325]" size={20} />
                      <span className="text-[#F5D547] font-bold">Property Owner</span>
                    </div>
                  </div>
                )}

                {isEditingProfile && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-[#4A4860]/50">
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-6 py-3 rounded-xl font-bold text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50 transition-colors border border-[#4A4860]/50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 rounded-xl font-bold text-[#1A1A2E] bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] transition-all shadow-lg shadow-[#E6B325]/30 flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-6 animate-fade-in">
            {/* Add Vehicle Header */}
            <div className={`rounded-3xl p-8 shadow-2xl border overflow-hidden relative ${
              accountRole === 'owner'
                ? 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] border-[#E6B325]/30'
                : 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] border-[#E6B325]/30'
            }`}>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-[#1A1A2E] mb-1 flex items-center gap-2">
                  <Car size={24} /> {accountRole === 'owner' ? 'Manage Vehicles' : 'My Vehicles'}
                </h3>
                <p className="text-[#1A1A2E]/90 text-sm">Register and manage your vehicles for auto-entry access</p>
              </div>
              <button 
                onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                className="absolute top-8 right-8 bg-[#1A1A2E]/20 text-[#1A1A2E] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#1A1A2E]/30 transition-colors backdrop-blur-sm border border-[#1A1A2E]/20 flex items-center gap-2"
              >
                <Plus size={18} /> Add Vehicle
              </button>
              <div className="absolute right-0 bottom-0 opacity-5">
                <Car size={240} />
              </div>
            </div>

            {/* Add Vehicle Form */}
            {isAddingVehicle && (
              <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] p-8 rounded-3xl shadow-xl border border-[#4A4860]/50 animate-fade-in">
                <h4 className="font-bold text-[#F5F5F7] mb-6 text-lg flex items-center gap-2">
                  <Plus className={accountRole === 'owner' ? 'text-[#E6B325]' : 'text-[#E6B325]'} size={20} />
                  Register New Vehicle
                </h4>
                <form onSubmit={handleAddVehicle} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase">Plate Number</label>
                      <input 
                        type="text" 
                        value={newVehicle.plate}
                        onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                        placeholder="e.g. ABC 1234"
                        className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none uppercase font-bold transition-colors"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase">Model</label>
                      <input 
                        type="text" 
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                        placeholder="e.g. Toyota Camry"
                        className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-[#4A4860]/50">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingVehicle(false)}
                      className="px-6 py-3 rounded-xl font-bold text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50 transition-colors border border-[#4A4860]/50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className={`px-6 py-3 rounded-xl font-bold text-[#1A1A2E] transition-all shadow-lg flex items-center gap-2 ${
                        accountRole === 'owner'
                          ? 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] shadow-[#E6B325]/30'
                          : 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] shadow-[#E6B325]/30'
                      }`}
                    >
                      <CheckCircle2 size={18} /> Register
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Vehicles List */}
            <div className="grid grid-cols-1 gap-4">
              {vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <div key={vehicle.id} className="bg-gradient-to-r from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] p-6 rounded-2xl shadow-xl border border-[#4A4860]/50 hover:border-[#4A4860] transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl border-2 transition-all group-hover:shadow-lg ${
                          accountRole === 'owner'
                            ? 'bg-[#E6B325]/10 text-[#E6B325] border-[#E6B325]/30'
                            : 'bg-[#E6B325]/10 text-[#E6B325] border-[#E6B325]/30'
                        }`}>
                          {vehicle.plateNumber.split(' ')[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-xl text-[#F5F5F7] tracking-wider mb-1">{vehicle.plateNumber}</h4>
                          <p className="text-sm text-[#B0B0B8] font-medium">{vehicle.model || 'Unknown Model'}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/30"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] rounded-3xl border border-[#4A4860]/50">
                  <Car size={48} className="text-[#4A4860] mx-auto mb-4" />
                  <p className="text-[#B0B0B8] font-medium">No vehicles registered yet</p>
                  <p className="text-sm text-[#B0B0B8]/70 mt-1">Add a vehicle to enable auto-entry access</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'tenants' && accountRole === 'owner' && (
          <div className="space-y-6 animate-fade-in">
            {/* Add Tenant Header */}
            <div className="bg-gradient-to-r from-[#E6B325] to-[#D4A017] rounded-3xl p-8 shadow-2xl border border-[#E6B325]/30 overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold text-[#1A1A2E] mb-1 flex items-center gap-2">
                  <Users size={24} /> Manage Tenants
                </h3>
                <p className="text-[#1A1A2E]/90 text-sm">Add, edit, and manage tenant accounts for your properties</p>
              </div>
              <button 
                onClick={() => setIsAddingTenant(!isAddingTenant)}
                className="absolute top-8 right-8 bg-[#1A1A2E]/20 text-[#1A1A2E] px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#1A1A2E]/30 transition-colors backdrop-blur-sm border border-[#1A1A2E]/20 flex items-center gap-2"
              >
                <Plus size={18} /> Add Tenant
              </button>
              <div className="absolute right-0 bottom-0 opacity-5">
                <Users size={240} />
              </div>
            </div>

            {/* Add Tenant Form */}
            {isAddingTenant && (
              <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] p-8 rounded-3xl shadow-xl border border-[#4A4860]/50 animate-fade-in">
                <h4 className="font-bold text-[#F5F5F7] mb-6 text-lg flex items-center gap-2">
                  <Plus className="text-[#E6B325]" size={20} />
                  Add New Tenant
                </h4>
                <form onSubmit={handleAddTenant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase">Full Name</label>
                      <input 
                        type="text" 
                        value={newTenant.name}
                        onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                        placeholder="e.g. John Smith"
                        className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase">Unit Number</label>
                      <input 
                        type="text" 
                        value={newTenant.unit}
                        onChange={(e) => setNewTenant({...newTenant, unit: e.target.value})}
                        placeholder="e.g. A-12-06"
                        className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-4 text-[#B0B0B8]" size={20} />
                      <input 
                        type="email" 
                        value={newTenant.email}
                        onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                        placeholder="e.g. john@example.com"
                        className="w-full pl-12 pr-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-[#4A4860]/50">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingTenant(false)}
                      className="px-6 py-3 rounded-xl font-bold text-[#B0B0B8] hover:text-[#F5F5F7] hover:bg-[#3D3B65]/50 transition-colors border border-[#4A4860]/50"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 rounded-xl font-bold text-[#1A1A2E] bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] transition-all shadow-lg shadow-[#E6B325]/30 flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Add Tenant
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tenants List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <div key={tenant.id} className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] p-6 rounded-2xl shadow-xl border border-[#4A4860]/50 hover:border-[#E6B325]/30 transition-all group hover:shadow-[#E6B325]/20">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E6B325] to-[#D4A017] flex items-center justify-center text-[#1A1A2E] font-bold text-lg">
                          {tenant.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-[#F5F5F7] text-lg">{tenant.name}</h4>
                          <p className="text-sm text-[#B0B0B8] flex items-center gap-1">
                            <Home size={14} /> {tenant.unit}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        tenant.status === 'active'
                          ? 'bg-[#E6B325]/10 text-[#E6B325] border-[#E6B325]/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {tenant.status === 'active' ? '✓ Active' : '✗ Inactive'}
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-[#B0B0B8] text-sm">
                        <Mail size={14} /> {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-[#B0B0B8] text-sm">
                        <Calendar size={14} /> Joined {tenant.joinDate}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-[#4A4860]/50">
                      <button 
                        onClick={() => setSelectedTenant(tenant)}
                        className="flex-1 px-4 py-2 rounded-xl font-bold text-sm text-[#E6B325] hover:text-[#F5D547] hover:bg-[#E6B325]/10 transition-all border border-[#E6B325]/30 hover:border-[#E6B325]/50 flex items-center justify-center gap-2"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="flex-1 px-4 py-2 rounded-xl font-bold text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border border-red-500/30 hover:border-red-500/50 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16 bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] rounded-3xl border border-[#4A4860]/50">
                  <Users size={48} className="text-[#4A4860] mx-auto mb-4" />
                  <p className="text-[#B0B0B8] font-medium text-lg">No tenants yet</p>
                  <p className="text-sm text-[#B0B0B8]/70 mt-1">Start adding tenants to manage their accounts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] rounded-3xl p-8 shadow-2xl border border-[#4A4860]/50 animate-fade-in space-y-8">
            <div className="flex items-center gap-2 mb-2">
              <Lock className={accountRole === 'owner' ? 'text-[#E6B325]' : 'text-[#E6B325]'} size={24} />
              <h3 className="text-2xl font-bold text-[#F5F5F7]">Security & Privacy</h3>
            </div>

            <div className="border-t border-[#4A4860]/50 pt-8 space-y-8">
              {/* Password Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#F5F5F7] text-lg flex items-center gap-2">
                  <Lock size={18} className={accountRole === 'owner' ? 'text-[#E6B325]' : 'text-[#E6B325]'} />
                  Password
                </h4>
                <div className="space-y-4 bg-[#3D3B65]/20 p-6 rounded-2xl border border-[#4A4860]/50">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter current password"
                        className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B0B0B8] hover:text-[#F5F5F7] transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase">New Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter new password"
                      className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase">Confirm Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Confirm new password"
                      className="w-full px-5 py-4 bg-[#3D3B65]/30 border border-[#4A4860]/50 rounded-2xl text-[#F5F5F7] placeholder-[#B0B0B8] focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium transition-colors"
                    />
                  </div>
                  <button className={`w-full px-6 py-3 rounded-xl font-bold text-[#1A1A2E] transition-all shadow-lg flex items-center justify-center gap-2 ${
                    accountRole === 'owner'
                      ? 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] shadow-[#E6B325]/30'
                      : 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] shadow-[#E6B325]/30'
                  }`}>
                    <CheckCircle2 size={18} /> Update Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Auth */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#F5F5F7] text-lg flex items-center gap-2">
                  <Shield size={18} className={accountRole === 'owner' ? 'text-[#E6B325]' : 'text-[#E6B325]'} />
                  Two-Factor Authentication
                </h4>
                <div className="bg-[#3D3B65]/20 p-6 rounded-2xl border border-[#4A4860]/50 flex justify-between items-center">
                  <div>
                    <p className="text-[#F5F5F7] font-bold">Secure your account</p>
                    <p className="text-sm text-[#B0B0B8] mt-1">Enable 2FA for added security</p>
                  </div>
                  <div className="w-12 h-7 bg-[#4A4860]/50 rounded-full border border-[#4A4860] cursor-pointer hover:bg-[#4A4860] transition-colors flex items-center px-1">
                    <div className="w-5 h-5 bg-slate-400 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="space-y-4">
                <h4 className="font-bold text-[#F5F5F7] text-lg flex items-center gap-2">
                  <CheckCircle2 size={18} className={accountRole === 'owner' ? 'text-[#E6B325]' : 'text-[#E6B325]'} />
                  Active Sessions
                </h4>
                <div className="space-y-3">
                  <div className="bg-[#3D3B65]/20 p-6 rounded-2xl border border-[#4A4860]/50 flex justify-between items-center">
                    <div>
                      <p className="text-[#F5F5F7] font-bold">This Device</p>
                      <p className="text-sm text-[#B0B0B8] mt-1">Current browser session • Active now</p>
                    </div>
                    <span className="text-xs font-bold text-[#E6B325]">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] rounded-3xl p-8 shadow-2xl border border-[#4A4860]/50 animate-fade-in space-y-6">
            <div className="flex items-center gap-2">
              <History className={accountRole === 'owner' ? 'text-[#E6B325]' : 'text-[#E6B325]'} size={24} />
              <h3 className="text-2xl font-bold text-[#F5F5F7]">{accountRole === 'owner' ? 'Activity Log' : 'My Bookings'}</h3>
            </div>

            <div className="border-t border-[#4A4860]/50 pt-8">
              <div className="space-y-6">
                {MOCK_BOOKINGS.length > 0 ? (
                  MOCK_BOOKINGS.map((booking, index) => (
                    <div key={booking.id} className="flex gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-[#F5F5F7] font-bold border-2 ${
                          booking.status === 'active'
                            ? 'bg-[#E6B325]/20 border-[#E6B325]/30 text-[#E6B325]'
                            : 'bg-[#4A4860]/50 border-[#4A4860]/30 text-[#B0B0B8]'
                        }`}>
                          {index + 1}
                        </div>
                        {index < MOCK_BOOKINGS.length - 1 && (
                          <div className="absolute top-14 left-6 w-0.5 h-6 bg-[#4A4860]"></div>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-bold text-[#F5F5F7] capitalize">{booking.facilityType.replace('_', ' ')} Booking</h4>
                        <p className="text-sm text-[#B0B0B8] mt-1">{booking.date} at {booking.startTime}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                            booking.status === 'active'
                              ? 'bg-[#E6B325]/10 text-[#E6B325] border-[#E6B325]/30'
                              : 'bg-[#4A4860]/30 text-[#B0B0B8] border-[#4A4860]/30'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <History size={48} className="text-[#4A4860] mx-auto mb-4" />
                    <p className="text-[#B0B0B8] font-medium">No activity yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};