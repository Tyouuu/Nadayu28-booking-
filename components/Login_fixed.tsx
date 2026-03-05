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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-6xl w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px] animate-fade-in border border-slate-700/50">
        
        {/* LEFT SIDE - VISUAL SHOWCASE */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 relative overflow-hidden flex-col justify-between p-12">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>

          {/* Back Button */}
          <div className="relative z-10">
            <button className="text-slate-400 hover:text-white transition-colors text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800/50">
              ← Back to website
            </button>
          </div>

          {/* Center Content */}
          <div className="relative z-10 flex flex-col justify-center flex-1">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-pink-500/30 mb-8">N</div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Nadayu28<br/>Community
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed max-w-sm">
              Experience seamless community living. Manage bookings, parking, and security in one elegant platform.
            </p>

            {/* Pagination Dots */}
            <div className="flex gap-2 mt-10">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
              <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
            </div>
          </div>

          {/* Background Image/Pattern */}
          <div className="absolute inset-0 opacity-20">
            <img 
              src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1000" 
              alt="Community" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* RIGHT SIDE - FORM */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            
            {showForgotPassword ? (
              // FORGOT PASSWORD VIEW
              <div className="animate-fade-in">
                <button 
                  onClick={() => { setShowForgotPassword(false); setResetStatus('idle'); }}
                  className="flex items-center text-slate-400 hover:text-white transition-colors mb-8 font-bold text-sm"
                >
                  <ChevronLeft size={16} className="mr-2" /> Back to Login
                </button>
                
                <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-slate-400 mb-8 leading-relaxed">Enter your registered email address and we'll send you instructions to reset your password.</p>
                
                {resetStatus === 'sent' ? (
                  <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-2xl p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-2">Check your email</h3>
                    <p className="text-slate-400 text-sm mb-6">We've sent password reset instructions to <span className="font-bold text-white">{resetEmail}</span></p>
                    <button 
                      onClick={() => { setShowForgotPassword(false); setResetStatus('idle'); }}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30"
                    >
                      Return to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-500" size={18} />
                        <input 
                          type="email" 
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-12 pr-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={resetStatus === 'sending'}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2"
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
                {/* Header */}
                <div className="mb-8">
                  <h2 className="text-4xl font-bold text-white mb-1">
                    {mode === 'signin' ? 'Welcome Back' : 'Create an account'}
                  </h2>
                  {mode === 'signin' && (
                    <p className="text-slate-400">Sign in to your account to continue</p>
                  )}
                </div>

                {/* Already have account / New here */}
                <div className="mb-8">
                  {mode === 'signin' ? (
                    <span className="text-slate-400 text-sm">Already have an account? <button onClick={() => setMode('signup')} className="text-pink-400 font-bold hover:text-pink-300 transition-colors">Log in</button></span>
                  ) : (
                    <span className="text-slate-400 text-sm">Already have an account? <button onClick={() => setMode('signin')} className="text-pink-400 font-bold hover:text-pink-300 transition-colors">Sign in</button></span>
                  )}
                </div>

                {/* Role Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                  {(['OWNER', 'TENANT', 'SECURITY', 'MANAGEMENT'] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                        role === r 
                          ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/30' 
                          : 'bg-slate-700/30 text-slate-400 hover:text-white border border-slate-600/50'
                      }`}
                    >
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>

                {/* SIGN IN FORM */}
                {mode === 'signin' && (
                  <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">{getLoginLabel()}</label>
                      <div className="relative">
                        <User className="absolute left-4 top-4 text-slate-500" size={18} />
                        <input 
                          type="text" 
                          placeholder={getLoginPlaceholder()}
                          className="w-full pl-12 pr-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium text-white placeholder-slate-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-4 text-slate-500" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="w-full pl-12 pr-12 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all font-medium text-white placeholder-slate-500"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          type="button" 
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30 flex items-center justify-center gap-2 mt-8"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>Sign in <ArrowRight size={18} /></>
                      )}
                    </button>

                    {/* OAuth Options */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-400">Or sign in with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="py-3 border border-slate-600/50 hover:border-slate-500 rounded-xl font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1,12.545,1 C6.438,1,1.514,5.924,1.514,12c0,6.075,4.924,11,11.031,11c5.659,0,10.571-4.233,10.571-9.772c0-0.628-0.078-1.274-0.199-1.989H12.545z"/></svg>
                        Google
                      </button>
                      <button type="button" className="py-3 border border-slate-600/50 hover:border-slate-500 rounded-xl font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.48-3.24-1.84-.37-.69-.37-1.52-.03-2.47 1.23-3.27 3.45-6.71 3.73-7.89.05-.29-.13-.61-.37-.75-.51-.32-1.3.09-1.42.79-.13.69-.45 1.48-.89 2.25-1.04 1.81-1.65 2.47-2.86 2.18-1.04-.23-1.51-1.08-2.09-2.47-.3-.75-.63-1.46-.95-2.15-1.05-2.29-1.21-2.94-.97-4.03.07-.32.36-.68.75-.72 1.04-.1 1.17.59 1.95 2.39 1.36 3.23 1.65 4.2 2.95 4.18 1.28-.02 1.94-.92 2.24-2.33.12-.5.22-.94.32-1.31.18-.67.47-1.39 1.15-1.64 1.24-.4 2.12.32 2.06 1.39-.09 1.5-1.39 3.89-2.8 6.14-.5.86-.71 1.62-.43 2.3.28.68 1.08.82 1.79.3.85-.63 1.62-1.55 2.28-2.58z"/></svg>
                        Apple
                      </button>
                    </div>
                  </form>
                )}

                {/* REGISTER FORM */}
                {mode === 'signup' && (
                  <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">First Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. John" 
                          className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-medium text-white placeholder-slate-500 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Last Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Smith" 
                          className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-medium text-white placeholder-slate-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 text-slate-500" size={18} />
                        <input 
                          type="email" 
                          placeholder="you@example.com" 
                          className="w-full pl-12 pr-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-medium text-white placeholder-slate-500 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase">Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-4 text-slate-500" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="w-full pl-12 pr-12 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-medium text-white placeholder-slate-500 transition-all"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-4 text-slate-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-3 pt-2">
                      <input type="checkbox" id="terms" className="w-5 h-5 accent-pink-500 rounded mt-0.5" />
                      <label htmlFor="terms" className="text-xs text-slate-400">
                        I agree to the <button type="button" className="text-pink-400 hover:text-pink-300 font-bold">Terms & Conditions</button>
                      </label>
                    </div>

                    {/* OWNER SPECIFIC */}
                    {role === 'OWNER' && (
                      <div className="space-y-4 pt-4 border-t border-slate-700">
                        <div className="bg-pink-500/10 border border-pink-500/30 p-4 rounded-xl flex gap-3">
                          <ShieldCheck className="text-pink-400 flex-shrink-0 mt-0.5" size={18} />
                          <p className="text-xs text-pink-200 leading-relaxed">
                            <strong>Identity Verification Required:</strong> Upload your National ID/Passport for verification.
                          </p>
                        </div>
                        <div className="border-2 border-dashed border-slate-600/50 hover:border-pink-500/50 rounded-xl p-6 text-center hover:bg-slate-700/20 transition-all cursor-pointer">
                          <Upload className="mx-auto text-slate-500 mb-2 hover:text-pink-400 transition-colors" size={24} />
                          <p className="text-xs font-bold text-slate-300 hover:text-pink-400 transition-colors">Upload ID Document</p>
                        </div>
                      </div>
                    )}

                    {/* TENANT SPECIFIC */}
                    {role === 'TENANT' && (
                      <div className="space-y-4 pt-4 border-t border-slate-700">
                        <div className="flex gap-4 mb-2">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="regMethod" checked={regMethod === 'invite'} onChange={() => setRegMethod('invite')} className="accent-pink-500" />
                            <span className="text-sm font-medium text-slate-300">Invitation Code</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="regMethod" checked={regMethod === 'apply'} onChange={() => setRegMethod('apply')} className="accent-pink-500" />
                            <span className="text-sm font-medium text-slate-300">New Application</span>
                          </label>
                        </div>

                        {regMethod === 'invite' ? (
                          <div className="space-y-2 animate-fade-in">
                            <label className="text-xs font-bold text-slate-400 uppercase">Invitation Code</label>
                            <input type="text" placeholder="e.g. ND28-XYZ-999" className="w-full px-4 py-3 bg-slate-700/30 border border-slate-600/50 rounded-xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-medium text-white placeholder-slate-500 transition-all" />
                            <p className="text-[10px] text-slate-500">Provided by the property owner.</p>
                          </div>
                        ) : (
                          <div className="space-y-2 animate-fade-in">
                            <div className="bg-blue-500/10 border border-blue-500/30 p-3 rounded-lg">
                              <p className="text-xs text-blue-200">Upload Tenancy Agreement for management approval.</p>
                            </div>
                            <div className="border-2 border-dashed border-slate-600/50 hover:border-blue-500/50 rounded-xl p-4 text-center hover:bg-slate-700/20 transition-all cursor-pointer">
                              <p className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors">Browse Files</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-pink-500/30 mt-8"
                    >
                      {isLoading ? 'Processing...' : 'Create account'}
                    </button>

                    {/* OAuth Options */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-600/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-400">Or register with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="py-3 border border-slate-600/50 hover:border-slate-500 rounded-xl font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1,12.545,1 C6.438,1,1.514,5.924,1.514,12c0,6.075,4.924,11,11.031,11c5.659,0,10.571-4.233,10.571-9.772c0-0.628-0.078-1.274-0.199-1.989H12.545z"/></svg>
                        Google
                      </button>
                      <button type="button" className="py-3 border border-slate-600/50 hover:border-slate-500 rounded-xl font-bold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.48-3.24-1.84-.37-.69-.37-1.52-.03-2.47 1.23-3.27 3.45-6.71 3.73-7.89.05-.29-.13-.61-.37-.75-.51-.32-1.3.09-1.42.79-.13.69-.45 1.48-.89 2.25-1.04 1.81-1.65 2.47-2.86 2.18-1.04-.23-1.51-1.08-2.09-2.47-.3-.75-.63-1.46-.95-2.15-1.05-2.29-1.21-2.94-.97-4.03.07-.32.36-.68.75-.72 1.04-.1 1.17.59 1.95 2.39 1.36 3.23 1.65 4.2 2.95 4.18 1.28-.02 1.94-.92 2.24-2.33.12-.5.22-.94.32-1.31.18-.67.47-1.39 1.15-1.64 1.24-.4 2.12.32 2.06 1.39-.09 1.5-1.39 3.89-2.8 6.14-.5.86-.71 1.62-.43 2.3.28.68 1.08.82 1.79.3.85-.63 1.62-1.55 2.28-2.58z"/></svg>
                        Apple
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
