import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Car, Plus, Trash2, History, AlertTriangle, FileText, Settings, Camera, Save, Lock, Users, Shield, Eye, EyeOff, Edit2, LogOut, Home, CheckCircle2, Calendar } from 'lucide-react';
import { MOCK_BOOKINGS, MOCK_VEHICLES } from '../constants';
import { fetchBookings, fetchVehicles, fetchReports } from '../services/dataService';
import { Vehicle, Booking, Report } from '../types';
import { addVehicleSchema, addTenantSchema, validate } from '../services/validation';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

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
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS);

  useEffect(() => {
    fetchBookings().then(setBookings).catch(() => {});
  }, []);
  const [reports, setReports] = useState<Report[]>([]);
  const { userProfile } = useAuth();
  useEffect(() => {
    fetchReports(userProfile?.unit).then(setReports).catch(() => {});
  }, [userProfile?.unit]);
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { t } = useI18n();

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    const result = validate(addVehicleSchema, newVehicle);
    if (!result.success) { setFieldErrors(result.errors); return; }
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
    setFieldErrors({});
    const result = validate(addTenantSchema, newTenant);
    if (!result.success) { setFieldErrors(result.errors); return; }
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
    <div className="min-h-screen bg-white pb-12">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#C8FF00]/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -z-10"></div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 ">
        
        {/* LEFT SIDEBAR */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 sticky top-6 space-y-6">
            
            {/* Profile Avatar */}
            <div className="relative mx-auto w-fit">
              <div className="w-24 h-24 rounded-full bg-[#f3f4f6] flex items-center justify-center shadow-lg border-2 border-gray-200">
                <User size={48} className="text-gray-900" />
              </div>
              <button className="absolute bottom-0 right-0 p-2.5 bg-[#111111] rounded-full text-white hover:bg-[#333333] transition-colors shadow-lg border-2 border-white">
                <Camera size={16} />
              </button>
            </div>

            {/* Profile Info */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Alex Tan</h2>
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  accountRole === 'owner' 
                    ? 'bg-[#111111] text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {accountRole === 'owner' ? <Shield className="inline mr-1" size={12} /> : <Home className="inline mr-1" size={12} />}
                  {accountRole === 'owner' ? 'Owner' : 'Tenant'}
                </div>
              </div>
              <p className="text-gray-400 text-sm font-medium">Unit A-12-05</p>
            </div>

            {/* Menu Items */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              {accountRole === 'owner' ? (
                <>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'details'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <User size={18} /> {t.profile.details}
                  </button>
                  <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'vehicles'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Car size={18} /> {t.profile.vehicles}
                  </button>
                  <button
                    onClick={() => setActiveTab('tenants')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'tenants'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Users size={18} /> {t.profile.tenants} ({tenants.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'security'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Lock size={18} /> {t.profile.securityTab}
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'history'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <History size={18} /> {t.profile.history}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'details'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <User size={18} /> {t.profile.title}
                  </button>
                  <button
                    onClick={() => setActiveTab('vehicles')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'vehicles'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Car size={18} /> {t.profile.vehicles}
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'security'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Lock size={18} /> {t.profile.securityTab}
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`w-full text-left px-5 py-4 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-3 ${
                      activeTab === 'history'
                        ? 'bg-[#111111] text-white'
                        : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <History size={18} /> {t.profile.history}
                  </button>
                </>
              )}
            </div>

            {/* Logout Button */}
            <div className="pt-4 border-t border-gray-100">
              <button className="w-full px-5 py-4 rounded-xl text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2 border border-red-500/20">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="lg:col-span-3 space-y-6">
        {activeTab === 'details' && (
          <div className="bg-white rounded-2xl border border-gray-100 space-y-5 overflow-hidden">
            <div className="bg-[#111111] p-6 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <div className="w-9 h-9 bg-[#C8FF00] rounded-xl flex items-center justify-center">
                  <User size={18} className="text-[#111111]" />
                </div>
                {accountRole === 'owner' ? 'Account Details' : 'My Profile'}
              </h3>
              <button
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all duration-300 ${
                  isEditingProfile
                    ? 'bg-[#C8FF00] text-[#111111]'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Edit2 size={16} /> {isEditingProfile ? 'Editing...' : 'Edit'}
              </button>
            </div>
            <div className="px-6 pb-6">

            <div className="border-t border-gray-100 pt-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                    <input 
                      type="text" 
                      defaultValue="Alex" 
                      disabled={!isEditingProfile}
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                    <input 
                      type="text" 
                      defaultValue="Tan" 
                      disabled={!isEditingProfile}
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t.profile.emailAddress}</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-4 text-gray-400" size={20} />
                    <input 
                      type="email" 
                      defaultValue="alex.tan@example.com" 
                      disabled={true}
                      className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Contact admin to change email address</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-4 text-gray-400" size={20} />
                    <input 
                      type="tel" 
                      defaultValue="+60 12-345 6789" 
                      disabled={!isEditingProfile}
                      className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Number</label>
                  <div className="relative">
                    <Home className="absolute left-5 top-4 text-gray-400" size={20} />
                    <input 
                      type="text" 
                      defaultValue="A-12-05" 
                      disabled={true}
                      className="w-full pl-12 pr-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors disabled:opacity-60" 
                    />
                  </div>
                </div>

                {accountRole === 'owner' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Account Type</label>
                    <div className="flex items-center gap-3 px-5 py-4 bg-gray-100 border border-gray-200 rounded-2xl">
                      <Shield className="text-[#111111]" size={20} />
                      <span className="text-gray-800 font-bold">Property Owner</span>
                    </div>
                  </div>
                )}

                {isEditingProfile && (
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button 
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 rounded-xl font-bold text-white bg-[#111111] hover:bg-[#222222] transition-all shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Save Changes
                    </button>
                  </div>
                )}
              </form>
            </div>
            </div>
          </div>
        )}

        {activeTab === 'vehicles' && (
          <div className="space-y-6 ">
            {/* Add Vehicle Header */}
            <div className="rounded-2xl p-6 shadow-sm border overflow-hidden relative bg-[#111111] border-[#111111]">
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#C8FF00] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Car size={18} className="text-[#111111]" />
                  </div>
                  {accountRole === 'owner' ? 'Manage Vehicles' : 'My Vehicles'}
                </h3>
                <p className="text-gray-400 text-sm">Register and manage your vehicles for auto-entry access</p>
              </div>
              <button
                onClick={() => setIsAddingVehicle(!isAddingVehicle)}
                className="absolute top-6 right-8 bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20 flex items-center gap-2"
              >
                <Plus size={18} /> {t.profile.addVehicle}
              </button>
              <div className="absolute right-0 bottom-0 opacity-5">
                <Car size={240} />
              </div>
            </div>

            {/* Add Vehicle Form */}
            {isAddingVehicle && (
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 ">
                <h4 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                  <Plus className={accountRole === 'owner' ? 'text-[#111111]' : 'text-[#111111]'} size={20} />
                  Register New Vehicle
                </h4>
                <form onSubmit={handleAddVehicle} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">{t.profile.plateNumber}</label>
                      <input
                        type="text"
                        value={newVehicle.plate}
                        onChange={(e) => { setNewVehicle({...newVehicle, plate: e.target.value}); setFieldErrors(prev => ({ ...prev, plate: '' })); }}
                        placeholder="e.g. ABC 1234"
                        className={`w-full px-5 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none uppercase font-bold transition-colors ${fieldErrors.plate ? 'border-red-400' : 'border-gray-200'}`}
                        autoFocus
                      />
                      {fieldErrors.plate && <p className="text-red-500 text-xs mt-1">{fieldErrors.plate}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">{t.profile.model}</label>
                      <input 
                        type="text" 
                        value={newVehicle.model}
                        onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                        placeholder="e.g. Toyota Camry"
                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingVehicle(false)}
                      className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 rounded-xl font-bold text-white bg-[#111111] hover:bg-[#222222] transition-all shadow-lg flex items-center gap-2"
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
                  <div key={vehicle.id} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:border-gray-200 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-xl border-2 transition-all group-hover:shadow-lg ${
                          accountRole === 'owner'
                            ? 'bg-[#C8FF00]/10 text-[#111111] border-[#C8FF00]/30'
                            : 'bg-[#C8FF00]/10 text-[#111111] border-[#C8FF00]/30'
                        }`}>
                          {vehicle.plateNumber.split(' ')[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-xl text-gray-900 tracking-wider mb-1">{vehicle.plateNumber}</h4>
                          <p className="text-sm text-gray-400 font-medium">{vehicle.model || 'Unknown Model'}</p>
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
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                  <Car size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No vehicles registered yet</p>
                  <p className="text-sm text-gray-400/70 mt-1">Add a vehicle to enable auto-entry access</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'tenants' && accountRole === 'owner' && (
          <div className="space-y-6 ">
            {/* Add Tenant Header */}
            <div className="bg-[#111111] rounded-2xl p-6 shadow-sm border border-[#111111] overflow-hidden relative">
              <div className="relative z-10">
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  <div className="w-9 h-9 bg-[#C8FF00] rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users size={18} className="text-[#111111]" />
                  </div>
                  Manage Tenants
                </h3>
                <p className="text-gray-400 text-sm">Add, edit, and manage tenant accounts for your properties</p>
              </div>
              <button 
                onClick={() => setIsAddingTenant(!isAddingTenant)}
                className="absolute top-6 right-8 bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors backdrop-blur-sm border border-white/20 flex items-center gap-2"
              >
                <Plus size={18} /> {t.profile.addTenant}
              </button>
              <div className="absolute right-0 bottom-0 opacity-5">
                <Users size={240} />
              </div>
            </div>

            {/* Add Tenant Form */}
            {isAddingTenant && (
              <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 ">
                <h4 className="font-bold text-gray-900 mb-6 text-lg flex items-center gap-2">
                  <Plus className="text-[#111111]" size={20} />
                  Add New Tenant
                </h4>
                <form onSubmit={handleAddTenant} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">{t.profile.fullName}</label>
                      <input
                        type="text"
                        value={newTenant.name}
                        onChange={(e) => { setNewTenant({...newTenant, name: e.target.value}); setFieldErrors(prev => ({ ...prev, name: '' })); }}
                        placeholder="e.g. John Smith"
                        className={`w-full px-5 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none font-medium transition-colors ${fieldErrors.name ? 'border-red-400' : 'border-gray-200'}`}
                      />
                      {fieldErrors.name && <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase">Unit Number</label>
                      <input
                        type="text"
                        value={newTenant.unit}
                        onChange={(e) => setNewTenant({...newTenant, unit: e.target.value})}
                        placeholder="e.g. A-12-06"
                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none font-medium transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">{t.profile.emailAddress}</label>
                    <div className="relative">
                      <Mail className="absolute left-5 top-4 text-gray-400" size={20} />
                      <input
                        type="email"
                        value={newTenant.email}
                        onChange={(e) => { setNewTenant({...newTenant, email: e.target.value}); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                        placeholder="e.g. john@example.com"
                        className={`w-full pl-12 pr-5 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none font-medium transition-colors ${fieldErrors.email ? 'border-red-400' : 'border-gray-200'}`}
                      />
                    </div>
                    {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                  </div>
                  <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingTenant(false)}
                      className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-colors border border-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-3 rounded-xl font-bold text-white bg-[#111111] hover:bg-[#222222] transition-all shadow-lg flex items-center gap-2"
                    >
                      <CheckCircle2 size={18} /> {t.profile.addTenant}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Tenants List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tenants.length > 0 ? (
                tenants.map((tenant) => (
                  <div key={tenant.id} className="bg-white p-6 rounded-2xl shadow-xl border border-gray-100 hover:border-gray-200 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#111111] flex items-center justify-center text-white font-bold text-lg">
                          {tenant.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg">{tenant.name}</h4>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Home size={14} /> {tenant.unit}
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        tenant.status === 'active'
                          ? 'bg-[#C8FF00]/10 text-[#111111] border-[#C8FF00]/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {tenant.status === 'active' ? '✓ Active' : '✗ Inactive'}
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail size={14} /> {tenant.email}
                      </div>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Calendar size={14} /> Joined {tenant.joinDate}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button 
                        onClick={() => setSelectedTenant(tenant)}
                        className="flex-1 px-4 py-2 rounded-xl font-bold text-sm text-gray-600 hover:text-[#111111] hover:bg-gray-50 transition-all border border-gray-200 hover:border-gray-300 flex items-center justify-center gap-2"
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
                <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <Users size={48} className="text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium text-lg">No tenants yet</p>
                  <p className="text-sm text-gray-400/70 mt-1">Start adding tenants to manage their accounts</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-2xl border border-gray-100 space-y-5 overflow-hidden">
            <div className="bg-[#111111] p-6 flex items-center gap-3">
              <div className="w-9 h-9 bg-[#C8FF00] rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock size={18} className="text-[#111111]" />
              </div>
              <h3 className="text-lg font-semibold text-white">Security & Privacy</h3>
            </div>
            <div className="px-6 pb-6">

            <div className="border-t border-gray-100 pt-8 space-y-5">
              {/* Password Section */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Lock size={18} className={accountRole === 'owner' ? 'text-[#111111]' : 'text-[#111111]'} />
                  Password
                </h4>
                <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Current Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="Enter current password"
                        className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">New Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter new password"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase">Confirm Password</label>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Confirm new password"
                      className="w-full px-5 py-4 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#C8FF00]/20 focus:border-[#C8FF00] outline-none outline-none font-medium transition-colors"
                    />
                  </div>
                  <button className="w-full px-6 py-3 rounded-xl font-bold text-white bg-[#111111] hover:bg-[#222222] transition-all shadow-lg flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} /> Update Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Auth */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <Shield size={18} className={accountRole === 'owner' ? 'text-[#111111]' : 'text-[#111111]'} />
                  Two-Factor Authentication
                </h4>
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex justify-between items-center">
                  <div>
                    <p className="text-gray-900 font-bold">Secure your account</p>
                    <p className="text-sm text-gray-400 mt-1">Enable 2FA for added security</p>
                  </div>
                  <div className="w-12 h-7 bg-gray-100 rounded-full border border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors flex items-center px-1">
                    <div className="w-5 h-5 bg-slate-400 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="space-y-4">
                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  <CheckCircle2 size={18} className={accountRole === 'owner' ? 'text-[#111111]' : 'text-[#111111]'} />
                  Active Sessions
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex justify-between items-center">
                    <div>
                      <p className="text-gray-900 font-bold">This Device</p>
                      <p className="text-sm text-gray-400 mt-1">Current browser session • Active now</p>
                    </div>
                    <span className="text-xs font-bold text-[#111111]">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl border border-gray-100 space-y-6 overflow-hidden">
            <div className="bg-[#111111] p-6 flex items-center gap-3">
              <div className="w-9 h-9 bg-[#C8FF00] rounded-xl flex items-center justify-center flex-shrink-0">
                <History size={18} className="text-[#111111]" />
              </div>
              <h3 className="text-lg font-semibold text-white">{accountRole === 'owner' ? 'Activity Log' : 'My Bookings'}</h3>
            </div>
            <div className="px-6 pb-6">

            <div className="border-t border-gray-100 pt-8">
              <div className="space-y-6">
                {bookings.length > 0 ? (
                  bookings.map((booking, index) => (
                    <div key={booking.id} className="flex gap-4">
                      <div className="relative">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-gray-900 font-bold border-2 ${
                          booking.status === 'active'
                            ? 'bg-[#C8FF00]/15 border-[#C8FF00]/30 text-[#111111]'
                            : 'bg-gray-100 border-gray-100 text-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                        {index < bookings.length - 1 && (
                          <div className="absolute top-14 left-6 w-0.5 h-6 bg-gray-200"></div>
                        )}
                      </div>
                      <div className="flex-1 pt-1">
                        <h4 className="font-bold text-gray-900 capitalize">{booking.facilityType.replace('_', ' ')} Booking</h4>
                        <p className="text-sm text-gray-400 mt-1">{booking.date} at {booking.startTime}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                            booking.status === 'active'
                              ? 'bg-[#C8FF00]/10 text-[#111111] border-[#C8FF00]/30'
                              : 'bg-gray-50 text-gray-400 border-gray-100'
                          }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <History size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium">No activity yet</p>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-8 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-base mb-4">My Reports</h4>
                {reports.length > 0 ? (
                  <div className="space-y-4">
                    {reports.map((r) => (
                      <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-bold text-gray-900 text-sm">{r.category}</p>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            r.status === 'Resolved' ? 'bg-[#C8FF00]/15 text-[#4a6600]' :
                            r.status === 'In Progress' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                          }`}>{r.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">{r.description}</p>
                        {r.resolutionNotes && (
                          <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
                            <span className="font-semibold text-gray-500">Resolution: </span>{r.resolutionNotes}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400 mt-2">{r.date}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No reports submitted yet.</p>
                )}
              </div>
            </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};