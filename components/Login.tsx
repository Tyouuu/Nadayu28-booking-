import React, { useState } from 'react';
import { UserRole } from '../types';
import { Eye, EyeOff, Upload, ArrowRight, ShieldCheck, User, Key, Building, Mail, ChevronLeft, CheckCircle2, Badge, Phone } from 'lucide-react';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'OWNER' | 'TENANT' | 'SECURITY' | 'MANAGEMENT'>('OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  // Registration States
  const [regMethod, setRegMethod] = useState<'invite' | 'apply'>('invite'); // For tenants

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API delay
    setTimeout(() => {
      setIsLoading(false);
      // Map internal roles to App roles
      const appRole = role === 'SECURITY' ? UserRole.SECURITY : 
                      role === 'MANAGEMENT' ? UserRole.MANAGEMENT : 
                      UserRole.RESIDENT;
      onLogin(appRole);
    }, 1500);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetStatus('sending');
    setTimeout(() => {
      setResetStatus('sent');
    }, 2000);
  };

  const getLoginLabel = () => {
    if (role === 'SECURITY') return 'Security ID';
    if (role === 'MANAGEMENT') return 'Staff ID / Email';
    return 'Phone / Unit No';
  };

  const getLoginPlaceholder = () => {
    if (role === 'SECURITY') return 'e.g. SEC-8821';
    if (role === 'MANAGEMENT') return 'admin@nadayu28.com';
    return '+60 12-345 6789';
  };

  const getRegIdLabel = () => {
    if (role === 'SECURITY') return 'Security Badge ID';
    if (role === 'MANAGEMENT') return 'Staff ID';
    return 'Unit No';
  };

  const getRegContactLabel = () => {
    if (role === 'MANAGEMENT') return 'Email Address';
    return 'Contact Number';
  };

  const getRegContactPlaceholder = () => {
    if (role === 'MANAGEMENT') return 'name@nadayu28.com';
    return '+60 12-345 6789';
  };

  const getRegContactType = () => {
    if (role === 'MANAGEMENT') return 'email';
    return 'tel';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-5xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in">
        
        {/* Left Side - Visuals */}
        <div className="hidden md:block w-1/2 bg-slate-900 relative">
          <img 
            src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000" 
            alt="Luxury Apartment" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-6">N</div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Nadayu28 Community</h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              Experience the harmony of smart community living. Manage your home, bookings, and security in one seamless portal.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            
            {showForgotPassword ? (
              // FORGOT PASSWORD VIEW
              <div className="animate-fade-in">
                <button 
                  onClick={() => { setShowForgotPassword(false); setResetStatus('idle'); }}
                  className="flex items-center text-slate-500 hover:text-slate-800 transition-colors mb-6 font-medium text-sm"
                >
                  <ChevronLeft size={16} className="mr-1" /> Back to Login
                </button>
                
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Reset Password</h2>
                <p className="text-slate-500 mb-8">Enter your registered email address and we'll send you instructions to reset your password.</p>
                
                {resetStatus === 'sent' ? (
                  <div className="bg-green-50 border border-green-100 rounded-2xl p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-bold text-slate-800 text-lg mb-2">Check your email</h3>
                    <p className="text-slate-500 text-sm mb-6">We've sent password reset instructions to <span className="font-bold text-slate-700">{resetEmail}</span></p>
                    <button 
                      onClick={() => { setShowForgotPassword(false); setResetStatus('idle'); }}
                      className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors"
                    >
                      Return to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                          type="email" 
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={resetStatus === 'sending'}
                      className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center gap-2"
                    >
                      {resetStatus === 'sending' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Send Reset Link'
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              // LOGIN / REGISTER VIEW
              <>
                {/* Header Switcher */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-slate-800">
                    {mode === 'signin' ? 'Welcome Back' : 'Join Community'}
                  </h2>
                  <div className="text-sm">
                    {mode === 'signin' ? (
                      <span className="text-slate-500">New here? <button onClick={() => setMode('signup')} className="text-indigo-600 font-bold hover:underline">Register</button></span>
                    ) : (
                      <span className="text-slate-500">Have account? <button onClick={() => setMode('signin')} className="text-indigo-600 font-bold hover:underline">Sign In</button></span>
                    )}
                  </div>
                </div>

                {/* Role Tabs */}
                <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
                  {(['OWNER', 'TENANT', 'SECURITY', 'MANAGEMENT'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 text-[10px] md:text-xs font-bold rounded-lg transition-all ${
                        role === r 
                          ? 'bg-white text-indigo-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                {/* SIGN IN FORM */}
                {mode === 'signin' && (
                  <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">{getLoginLabel()}</label>
                      <div className="relative">
                        <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                          type="text" 
                          placeholder={getLoginPlaceholder()}
                          className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-3.5 text-slate-400" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/30"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Sign In <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                )}

                {/* REGISTER FORM */}
                {mode === 'signup' && (
                  <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">{getRegIdLabel()}</label>
                        <div className="relative">
                          {role === 'SECURITY' || role === 'MANAGEMENT' ? (
                            <Badge className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          ) : (
                            <Building className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          )}
                          <input 
                            type="text" 
                            placeholder={role === 'SECURITY' ? 'e.g. 8821' : "e.g. A-12-05"} 
                            className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">{getRegContactLabel()}</label>
                         <div className="relative">
                          {role === 'MANAGEMENT' ? (
                             <Mail className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          ) : (
                             <Phone className="absolute left-3 top-3.5 text-slate-400" size={16} />
                          )}
                          <input 
                            type={getRegContactType()} 
                            placeholder={getRegContactPlaceholder()} 
                            className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* OWNER SPECIFIC */}
                    {role === 'OWNER' && (
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3">
                          <ShieldCheck className="text-amber-600 flex-shrink-0" size={20} />
                          <p className="text-xs text-amber-800 leading-relaxed">
                            <strong>Identity Verification Required:</strong> As a property owner, please upload your National ID/Passport for verification.
                          </p>
                        </div>
                        <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-pointer">
                          <Upload className="mx-auto text-slate-400 mb-2" size={24} />
                          <p className="text-xs font-bold text-slate-600">Upload ID Document</p>
                        </div>
                      </div>
                    )}

                    {/* TENANT SPECIFIC */}
                    {role === 'TENANT' && (
                      <div className="space-y-4 pt-2 border-t border-slate-100">
                        <div className="flex gap-4 mb-2">
                           <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" name="regMethod" checked={regMethod === 'invite'} onChange={() => setRegMethod('invite')} />
                             <span className="text-sm font-medium text-slate-700">Invitation Code</span>
                           </label>
                           <label className="flex items-center gap-2 cursor-pointer">
                             <input type="radio" name="regMethod" checked={regMethod === 'apply'} onChange={() => setRegMethod('apply')} />
                             <span className="text-sm font-medium text-slate-700">New Application</span>
                           </label>
                        </div>

                        {regMethod === 'invite' ? (
                           <div className="space-y-1.5 animate-fade-in">
                            <label className="text-xs font-bold text-slate-500 uppercase">Invitation Code</label>
                            <input type="text" placeholder="e.g. ND28-XYZ-999" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500" />
                            <p className="text-[10px] text-slate-400">Provided by the property owner.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 animate-fade-in">
                            <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg">
                               <p className="text-xs text-blue-800">Upload Tenancy Agreement for management approval.</p>
                            </div>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 cursor-pointer">
                              <p className="text-xs font-bold text-indigo-600">Browse Files</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="pt-2">
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg"
                      >
                        {isLoading ? 'Processing...' : 'Create Account'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};