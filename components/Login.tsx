import React, { useState } from 'react';
import { UserRole, CurrentUser } from '../types';
import { Eye, EyeOff, Upload, ArrowRight, ShieldCheck, User, Key, Building, Mail, ChevronLeft, CheckCircle2, Badge, Phone, Smartphone, Fingerprint, Zap, Users, Clock } from 'lucide-react';
import { signIn, supabase } from '../services/supabase';

interface LoginProps {
  onLogin: (user: CurrentUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'visitor'>('signin');
  const [role, setRole] = useState<'OWNER' | 'TENANT' | 'SECURITY' | 'MANAGEMENT'>('OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Login Methods
  const [loginMethod, setLoginMethod] = useState<'password' | 'mobile' | 'biometric'>('password');
  const [mobileVerificationSent, setMobileVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  
  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  
  // Owner Registration States
  const [ownerIDVerified, setOwnerIDVerified] = useState(false);
  const [idUploadFile, setIdUploadFile] = useState<File | null>(null);
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  
  // Tenant Registration States
  const [tenantRegMethod, setTenantRegMethod] = useState<'invite' | 'apply'>('invite');
  const [invitationCode, setInvitationCode] = useState('');
  
  // Visitor Registration States
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorVisitDate, setVisitorVisitDate] = useState('');

  // Auth state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    // For owner, require two-factor confirmation step
    if (role === 'OWNER' && !twoFactorRequired) {
      setTwoFactorRequired(true);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signIn(loginEmail, loginPassword);
      if (error) throw error;

      // Read profile (role, unit, name) from Supabase
      let appRole = UserRole.RESIDENT;
      let unit = '';
      let fullName = '';
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, unit, full_name')
          .eq('id', data.user.id)
          .single();
        if (profile?.role === 'SECURITY')        appRole = UserRole.SECURITY;
        else if (profile?.role === 'MANAGEMENT') appRole = UserRole.MANAGEMENT;
        unit = profile?.unit ?? '';
        fullName = profile?.full_name ?? '';
      }
      onLogin({ id: data.user!.id, unit, name: fullName, role: appRole });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMobileVerificationSend = () => {
    setMobileVerificationSent(true);
    // Simulate SMS sending
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetStatus('sending');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: window.location.origin + '/?reset=true',
      });
      if (error) throw error;
      setResetStatus('sent');
    } catch {
      setResetStatus('idle');
    }
  };

  const handleIDUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdUploadFile(file);
      // Simulate ID verification
      setTimeout(() => {
        setOwnerIDVerified(true);
      }, 1500);
    }
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1A1A2E] via-[#2D2B55] to-[#1A1A2E] p-4 relative overflow-hidden">
      {/* Background Effects - Subtle Gold Accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#E6B325]/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#E6B325]/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-6xl w-full bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px] animate-fade-in border border-[#E6B325]/20">
        
        {/* LEFT SIDE - VISUAL SHOWCASE */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#1A1A2E] relative overflow-hidden flex-col justify-between p-12">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-transparent to-transparent opacity-80"></div>

          {/* Back Button */}
          <div className="relative z-10">
            <button className="text-[#B0B0B8] hover:text-[#F5F5F7] transition-colors text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-[#E6B325]/10">
              ← Back to website
            </button>
          </div>

          {/* Center Content */}
          <div className="relative z-10 flex flex-col justify-center flex-1">
            <div className="w-16 h-16 bg-gradient-to-br from-[#E6B325] to-[#D4A017] rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-[#E6B325]/30 mb-8">N</div>
            <h2 className="text-5xl font-bold text-[#F5F5F7] mb-6 leading-tight">
              Nadayu28<br/>Community
            </h2>
            <p className="text-xl text-[#B0B0B8] leading-relaxed max-w-sm">
              Experience seamless community living. Manage bookings, parking, and security in one elegant platform.
            </p>

            {/* Pagination Dots */}
            <div className="flex gap-2 mt-10">
              <div className="w-2 h-2 bg-[#E6B325] rounded-full"></div>
              <div className="w-2 h-2 bg-[#4A4860] rounded-full"></div>
              <div className="w-2 h-2 bg-[#4A4860] rounded-full"></div>
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
                  className="flex items-center text-[#B0B0B8] hover:text-[#F5F5F7] transition-colors mb-8 font-bold text-sm"
                >
                  <ChevronLeft size={16} className="mr-2" /> Back to Login
                </button>
                
                <h2 className="text-3xl font-bold text-[#F5F5F7] mb-2">Reset Password</h2>
                <p className="text-[#B0B0B8] mb-8 leading-relaxed">Enter your registered email address and we'll send you instructions to reset your password.</p>
                
                {resetStatus === 'sent' ? (
                  <div className="bg-gradient-to-br from-[#E6B325]/10 to-[#D4A017]/10 border border-[#E6B325]/30 rounded-2xl p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 bg-gradient-to-br from-[#E6B325] to-[#D4A017] text-[#1A1A2E] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#E6B325]/30">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-bold text-[#F5F5F7] text-lg mb-2">Check your email</h3>
                    <p className="text-[#B0B0B8] text-sm mb-6">We've sent password reset instructions to <span className="font-bold text-[#F5F5F7]">{resetEmail}</span></p>
                    <button 
                      onClick={() => { setShowForgotPassword(false); setResetStatus('idle'); }}
                      className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30"
                    >
                      Return to Login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                        <input 
                          type="email" 
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-12 pr-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none transition-all font-medium text-[#F5F5F7] placeholder-[#B0B0B8]"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={resetStatus === 'sending'}
                      className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30 flex items-center justify-center gap-2"
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
                  <h2 className="text-4xl font-bold text-[#F5F5F7] mb-1">
                    {mode === 'signin' ? 'Welcome Back' : 'Create an account'}
                  </h2>
                  {mode === 'signin' && (
                    <p className="text-[#B0B0B8]">Sign in to your account to continue</p>
                  )}
                </div>

                {/* Already have account / New here */}
                <div className="mb-8">
                  {mode === 'signin' ? (
                    <span className="text-[#B0B0B8] text-sm">Already have an account? <button onClick={() => setMode('signup')} className="text-[#E6B325] font-bold hover:text-[#F5D547] transition-colors">Log in</button></span>
                  ) : (
                    <span className="text-[#B0B0B8] text-sm">Already have an account? <button onClick={() => setMode('signin')} className="text-[#E6B325] font-bold hover:text-[#F5D547] transition-colors">Sign in</button></span>
                  )}
                </div>

                {/* Mode Selector - Sign In vs Visitor */}
                {mode !== 'visitor' && (
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => { setMode('signin'); setTwoFactorRequired(false); }}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        mode === 'signin' 
                          ? 'bg-[#E6B325]/20 border border-[#E6B325]/50 text-[#E6B325]' 
                          : 'bg-[#3D3B65]/50 border border-[#4A4860]/50 text-[#B0B0B8] hover:text-[#F5F5F7]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => { setMode('signup'); setTwoFactorRequired(false); }}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        mode === 'signup' 
                          ? 'bg-[#E6B325]/20 border border-[#E6B325]/50 text-[#E6B325]' 
                          : 'bg-[#3D3B65]/50 border border-[#4A4860]/50 text-[#B0B0B8] hover:text-[#F5F5F7]'
                      }`}
                    >
                      Register
                    </button>
                  </div>
                )}

                {/* Role Tabs - Hidden for Visitor */}
                {mode !== 'visitor' && (
                  <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {(['OWNER', 'TENANT', 'SECURITY', 'MANAGEMENT'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRole(r)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap ${
                          role === r 
                            ? 'bg-gradient-to-r from-[#E6B325] to-[#D4A017] text-[#1A1A2E] shadow-lg shadow-[#E6B325]/30' 
                            : 'bg-[#3D3B65]/50 text-[#B0B0B8] hover:text-[#F5F5F7] border border-[#4A4860]/50'
                        }`}
                      >
                        {r.charAt(0) + r.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                )}

                {/* SIGN IN FORM */}
                {mode === 'signin' && (
                  <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
                    {/* Two-Factor Authentication for Owner */}
                    {role === 'OWNER' && twoFactorRequired && (
                      <div className="bg-[#D4A017]/10 border border-[#E6B325]/30 p-4 rounded-xl mb-6 flex gap-3">
                        <ShieldCheck className="text-[#E6B325] flex-shrink-0 mt-0.5" size={18} />
                        <p className="text-xs text-[#E6B325]/90 leading-relaxed">
                          <strong>Two-Factor Authentication Required:</strong> Complete biometric verification or mobile OTP for sensitive operations.
                        </p>
                      </div>
                    )}

                    {/* Login Method Selection - For Owner & Tenant */}
                    {(role === 'OWNER' || role === 'TENANT') && !twoFactorRequired && (
                      <div className="space-y-3 mb-6">
                        <label className="text-xs font-bold text-[#B0B0B8] uppercase">Select Login Method</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => { setLoginMethod('password'); setMobileVerificationSent(false); }}
                            className={`py-3 px-2 rounded-xl transition-all font-bold text-xs flex flex-col items-center gap-2 ${
                              loginMethod === 'password'
                                ? 'bg-[#E6B325]/20 border border-[#E6B325]/50 text-[#E6B325]'
                                : 'bg-[#3D3B65]/50 border border-[#4A4860]/50 text-[#B0B0B8] hover:text-[#F5F5F7]'
                            }`}
                          >
                            <Key size={16} /> Password
                          </button>
                          <button
                            type="button"
                            onClick={() => { setLoginMethod('mobile'); }}
                            className={`py-3 px-2 rounded-xl transition-all font-bold text-xs flex flex-col items-center gap-2 ${
                              loginMethod === 'mobile'
                                ? 'bg-[#E6B325]/20 border border-[#E6B325]/50 text-[#E6B325]'
                                : 'bg-[#3D3B65]/50 border border-[#4A4860]/50 text-[#B0B0B8] hover:text-[#F5F5F7]'
                            }`}
                          >
                            <Smartphone size={16} /> Mobile OTP
                          </button>
                          {role === 'OWNER' && (
                            <button
                              type="button"
                              onClick={() => { setLoginMethod('biometric'); }}
                              className={`py-3 px-2 rounded-xl transition-all font-bold text-xs flex flex-col items-center gap-2 ${
                                loginMethod === 'biometric'
                                  ? 'bg-[#E6B325]/20 border border-[#E6B325]/50 text-[#E6B325]'
                                  : 'bg-[#3D3B65]/50 border border-[#4A4860]/50 text-[#B0B0B8] hover:text-[#F5F5F7]'
                              }`}
                            >
                              <Fingerprint size={16} /> Biometric
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Password-based Login */}
                    {loginMethod === 'password' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#B0B0B8] uppercase">{getLoginLabel()}</label>
                          <div className="relative">
                            <User className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                            <input
                              type="email"
                              required
                              value={loginEmail}
                              onChange={(e) => setLoginEmail(e.target.value)}
                              placeholder={getLoginPlaceholder()}
                              className="w-full pl-12 pr-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none transition-all font-medium text-[#F5F5F7] placeholder-[#B0B0B8]"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#B0B0B8] uppercase">Password</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={loginPassword}
                              onChange={(e) => setLoginPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-12 pr-12 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none transition-all font-medium text-[#F5F5F7] placeholder-[#B0B0B8]"
                            />
                            <button 
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-4 text-[#B0B0B8] hover:text-[#F5F5F7] transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          <div className="flex justify-end">
                            <button 
                              type="button" 
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs font-bold text-[#E6B325] hover:text-[#F5D547] transition-colors"
                            >
                              Forgot password?
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Mobile OTP Login */}
                    {loginMethod === 'mobile' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#B0B0B8] uppercase">Mobile Number</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                            <input 
                              type="tel" 
                              placeholder="+60 12-345 6789"
                              className="w-full pl-12 pr-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none transition-all font-medium text-[#F5F5F7] placeholder-[#B0B0B8]"
                            />
                          </div>
                        </div>

                        {!mobileVerificationSent ? (
                          <button
                            type="button"
                            onClick={handleMobileVerificationSend}
                            className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30"
                          >
                            Send Verification Code
                          </button>
                        ) : (
                          <div className="space-y-2 animate-fade-in">
                            <label className="text-xs font-bold text-[#B0B0B8] uppercase">Verification Code</label>
                            <input 
                              type="text" 
                              placeholder="000000"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              maxLength={6}
                              className="w-full px-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none transition-all font-medium text-[#F5F5F7] placeholder-[#B0B0B8] text-center tracking-widest"
                            />
                            <p className="text-xs text-[#B0B0B8] text-center">Code expires in 5 minutes</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Biometric Login (Owner Only) */}
                    {loginMethod === 'biometric' && role === 'OWNER' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="bg-[#E6B325]/10 border border-[#E6B325]/30 p-8 rounded-2xl text-center">
                          <div className="w-16 h-16 bg-gradient-to-br from-[#E6B325] to-[#D4A017] text-[#1A1A2E] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#E6B325]/30">
                            <Fingerprint size={32} />
                          </div>
                          <h3 className="font-bold text-[#F5F5F7] text-lg mb-2">Biometric Authentication</h3>
                          <p className="text-[#B0B0B8] text-sm mb-6">Place your finger on the scanner to authenticate</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsLoading(true);
                              setTimeout(() => {
                                setIsLoading(false);
                                handleLogin({ preventDefault: () => {} } as React.FormEvent);
                              }, 2000);
                            }}
                            className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30"
                          >
                            Scan Fingerprint
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Auth error */}
                    {authError && (
                      <p className="text-sm text-center px-4 py-2 rounded-xl" style={{color: '#E6B325', backgroundColor: 'rgba(230,179,37,0.1)'}}>{authError}</p>
                    )}

                    {/* Submit Button */}
                    {!twoFactorRequired && (
                      <button 
                        type="submit"
                        disabled={isLoading || (loginMethod === 'mobile' && !verificationCode)}
                        className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30 flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-[#1A1A2E]/30 border-t-[#1A1A2E] rounded-full animate-spin" />
                        ) : (
                          <>Sign in <ArrowRight size={18} /></>
                        )}
                      </button>
                    )}

                    {twoFactorRequired && (
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30 flex items-center justify-center gap-2 mt-8"
                      >
                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-[#1A1A2E]/30 border-t-[#1A1A2E] rounded-full animate-spin" />
                        ) : (
                          <>Complete 2FA <ShieldCheck size={18} /></>
                        )}
                      </button>
                    )}

                    {/* OAuth Options */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#4A4860]/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] text-[#B0B0B8]">Or sign in with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="py-3 border border-[#4A4860]/50 hover:border-[#E6B325]/30 rounded-xl font-bold text-[#B0B0B8] hover:text-[#E6B325] transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1,12.545,1 C6.438,1,1.514,5.924,1.514,12c0,6.075,4.924,11,11.031,11c5.659,0,10.571-4.233,10.571-9.772c0-0.628-0.078-1.274-0.199-1.989H12.545z"/></svg>
                        Google
                      </button>
                      <button type="button" className="py-3 border border-[#4A4860]/50 hover:border-[#E6B325]/30 rounded-xl font-bold text-[#B0B0B8] hover:text-[#E6B325] transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.48-3.24-1.84-.37-.69-.37-1.52-.03-2.47 1.23-3.27 3.45-6.71 3.73-7.89.05-.29-.13-.61-.37-.75-.51-.32-1.3.09-1.42.79-.13.69-.45 1.48-.89 2.25-1.04 1.81-1.65 2.47-2.86 2.18-1.04-.23-1.51-1.08-2.09-2.47-.3-.75-.63-1.46-.95-2.15-1.05-2.29-1.21-2.94-.97-4.03.07-.32.36-.68.75-.72 1.04-.1 1.17.59 1.95 2.39 1.36 3.23 1.65 4.2 2.95 4.18 1.28-.02 1.94-.92 2.24-2.33.12-.5.22-.94.32-1.31.18-.67.47-1.39 1.15-1.64 1.24-.4 2.12.32 2.06 1.39-.09 1.5-1.39 3.89-2.8 6.14-.5.86-.71 1.62-.43 2.3.28.68 1.08.82 1.79.3.85-.63 1.62-1.55 2.28-2.58z"/></svg>
                        Apple
                      </button>
                    </div>
                  </form>
                )}

                {/* REGISTER FORM */}
                {mode === 'signup' && (
                  <form onSubmit={handleLogin} className="space-y-5 animate-fade-in max-h-[600px] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#B0B0B8] uppercase">First Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. John" 
                          className="w-full px-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] placeholder-[#B0B0B8] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-[#B0B0B8] uppercase">Last Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Smith" 
                          className="w-full px-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] placeholder-[#B0B0B8] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                        <input 
                          type="email" 
                          placeholder="you@example.com" 
                          className="w-full pl-12 pr-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] placeholder-[#B0B0B8] transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#B0B0B8] uppercase">Password</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                        <input 
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="w-full pl-12 pr-12 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] placeholder-[#B0B0B8] transition-all"
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-4 text-[#B0B0B8] hover:text-[#E6B325] transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-3 pt-2">
                      <input type="checkbox" id="terms" className="w-5 h-5 accent-[#E6B325] rounded mt-0.5" />
                      <label htmlFor="terms" className="text-xs text-[#B0B0B8]">
                        I agree to the <button type="button" className="text-[#E6B325] hover:text-[#F5D547] font-bold">Terms & Conditions</button>
                      </label>
                    </div>

                    {/* OWNER REGISTRATION - ID VERIFICATION */}
                    {role === 'OWNER' && (
                      <div className="space-y-4 pt-4 border-t border-[#4A4860]/50 animate-fade-in">
                        <div className="bg-[#E6B325]/10 border border-[#E6B325]/30 p-4 rounded-xl flex gap-3">
                          <ShieldCheck className="text-[#E6B325] flex-shrink-0 mt-0.5" size={18} />
                          <div className="text-xs text-[#E6B325]/90 leading-relaxed">
                            <strong>Identity Verification Required:</strong> Upload your National ID, Passport, or Driver's License for verification.
                          </div>
                        </div>

                        {!ownerIDVerified ? (
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-[#B0B0B8] uppercase">Upload ID Document</label>
                            <div className="border-2 border-dashed border-[#E6B325]/50 hover:border-[#E6B325] rounded-xl p-6 text-center hover:bg-[#E6B325]/5 transition-all cursor-pointer">
                              <input 
                                type="file" 
                                accept="image/*,.pdf"
                                onChange={handleIDUpload}
                                className="hidden"
                                id="idUpload"
                              />
                              <label htmlFor="idUpload" className="cursor-pointer">
                                <Upload className="mx-auto text-[#E6B325] mb-2" size={24} />
                                <p className="text-xs font-bold text-[#E6B325] hover:text-[#F5D547] transition-colors">{idUploadFile ? 'File uploaded: ' + idUploadFile.name : 'Click or drag to upload'}</p>
                              </label>
                            </div>
                            {idUploadFile && !ownerIDVerified && (
                              <p className="text-xs text-[#B0B0B8]">Verifying your identity...</p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-[#E6B325]/10 border border-[#E6B325]/30 p-4 rounded-xl flex gap-3 animate-scale-in">
                            <CheckCircle2 className="text-[#E6B325] flex-shrink-0 mt-0.5" size={18} />
                            <div className="text-xs text-[#E6B325]/90">
                              <strong>ID Verified!</strong> Your identity has been confirmed.
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-[#B0B0B8] uppercase">Mobile Number (for 2FA)</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                            <input 
                              type="tel" 
                              placeholder="+60 12-345 6789" 
                              className="w-full pl-12 pr-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] placeholder-[#B0B0B8] transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TENANT REGISTRATION - INVITATION OR APPLICATION */}
                    {role === 'TENANT' && (
                      <div className="space-y-4 pt-4 border-t border-[#4A4860]/50 animate-fade-in">
                        <div className="flex gap-4 mb-4">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input 
                              type="radio" 
                              name="tenantRegMethod" 
                              checked={tenantRegMethod === 'invite'} 
                              onChange={() => setTenantRegMethod('invite')} 
                              className="accent-[#E6B325]" 
                            />
                            <span className="text-sm font-medium text-[#F5F5F7]">Invitation Code</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input 
                              type="radio" 
                              name="tenantRegMethod" 
                              checked={tenantRegMethod === 'apply'} 
                              onChange={() => setTenantRegMethod('apply')} 
                              className="accent-[#E6B325]" 
                            />
                            <span className="text-sm font-medium text-[#F5F5F7]">Self-Apply</span>
                          </label>
                        </div>

                        {tenantRegMethod === 'invite' ? (
                          <div className="space-y-2 animate-fade-in">
                            <div className="bg-[#E6B325]/10 border border-[#E6B325]/30 p-3 rounded-lg">
                              <p className="text-xs text-[#E6B325]/90">Enter the invitation code sent by the property owner</p>
                            </div>
                            <label className="text-xs font-bold text-[#B0B0B8] uppercase">Invitation Code</label>
                            <input 
                              type="text" 
                              placeholder="e.g. ND28-XYZ-999" 
                              value={invitationCode}
                              onChange={(e) => setInvitationCode(e.target.value)}
                              className="w-full px-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none font-medium text-[#F5F5F7] placeholder-[#B0B0B8] transition-all"
                            />
                            <p className="text-[10px] text-[#B0B0B8]">Code format: NADAYU-XXXXX (provided by owner)</p>
                          </div>
                        ) : (
                          <div className="space-y-2 animate-fade-in">
                            <div className="bg-[#E6B325]/10 border border-[#E6B325]/30 p-3 rounded-lg">
                              <p className="text-xs text-[#E6B325]/90">Upload your tenancy agreement for administrator approval</p>
                            </div>
                            <label className="text-xs font-bold text-[#B0B0B8] uppercase">Tenancy Agreement</label>
                            <div className="border-2 border-dashed border-[#E6B325]/50 hover:border-[#E6B325] rounded-xl p-4 text-center hover:bg-[#E6B325]/5 transition-all cursor-pointer">
                              <input 
                                type="file" 
                                accept=".pdf,.doc,.docx,image/*"
                                className="hidden"
                                id="tenancyUpload"
                              />
                              <label htmlFor="tenancyUpload" className="cursor-pointer">
                                <Upload className="mx-auto text-[#E6B325] mb-2" size={20} />
                                <p className="text-xs font-bold text-[#E6B325]">Upload Agreement</p>
                              </label>
                            </div>
                            <p className="text-[10px] text-[#B0B0B8]">Status: Awaiting administrator approval</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isLoading || (role === 'OWNER' && !ownerIDVerified) || (role === 'TENANT' && tenantRegMethod === 'invite' && !invitationCode)}
                      className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30 mt-8 disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : 'Create account'}
                    </button>

                    {/* OAuth Options */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#4A4860]/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-gradient-to-br from-[#2D2B55] via-[#3D3B65] to-[#2D2B55] text-[#B0B0B8]">Or register with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="py-3 border border-[#4A4860]/50 hover:border-[#E6B325]/30 rounded-xl font-bold text-[#B0B0B8] hover:text-[#E6B325] transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1,12.545,1 C6.438,1,1.514,5.924,1.514,12c0,6.075,4.924,11,11.031,11c5.659,0,10.571-4.233,10.571-9.772c0-0.628-0.078-1.274-0.199-1.989H12.545z"/></svg>
                        Google
                      </button>
                      <button type="button" className="py-3 border border-[#4A4860]/50 hover:border-[#E6B325]/30 rounded-xl font-bold text-[#B0B0B8] hover:text-[#E6B325] transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.48-3.24-1.84-.37-.69-.37-1.52-.03-2.47 1.23-3.27 3.45-6.71 3.73-7.89.05-.29-.13-.61-.37-.75-.51-.32-1.3.09-1.42.79-.13.69-.45 1.48-.89 2.25-1.04 1.81-1.65 2.47-2.86 2.18-1.04-.23-1.51-1.08-2.09-2.47-.3-.75-.63-1.46-.95-2.15-1.05-2.29-1.21-2.94-.97-4.03.07-.32.36-.68.75-.72 1.04-.1 1.17.59 1.95 2.39 1.36 3.23 1.65 4.2 2.95 4.18 1.28-.02 1.94-.92 2.24-2.33.12-.5.22-.94.32-1.31.18-.67.47-1.39 1.15-1.64 1.24-.4 2.12.32 2.06 1.39-.09 1.5-1.39 3.89-2.8 6.14-.5.86-.71 1.62-.43 2.3.28.68 1.08.82 1.79.3.85-.63 1.62-1.55 2.28-2.58z"/></svg>
                        Apple
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* VISITOR LOGIN */}
            {mode === 'visitor' && (
              <div className="animate-fade-in">
                <button 
                  onClick={() => setMode('signin')}
                  className="flex items-center text-[#B0B0B8] hover:text-[#F5F5F7] transition-colors mb-8 font-bold text-sm"
                >
                  <ChevronLeft size={16} className="mr-2" /> Back
                </button>
                
                <h2 className="text-3xl font-bold text-[#F5F5F7] mb-2">Visitor Access</h2>
                <p className="text-[#B0B0B8] mb-8 leading-relaxed">Enter your temporary visitor credentials to access the facility</p>
                
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="bg-[#E6B325]/10 border border-[#E6B325]/30 p-4 rounded-xl flex gap-3 mb-6">
                    <Users className="text-[#E6B325] flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-[#E6B325]/90 leading-relaxed">
                      <strong>Temporary Access:</strong> Your account is automatically created based on pre-registration and expires at the scheduled visit end time.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase">Visitor Code</label>
                    <div className="relative">
                      <Badge className="absolute left-4 top-4 text-[#B0B0B8]" size={18} />
                      <input 
                        type="text" 
                        placeholder="e.g. VISIT-ABC123"
                        className="w-full pl-12 pr-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none transition-all font-medium text-[#F5F5F7] placeholder-[#B0B0B8]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#B0B0B8] uppercase">Verification Code</label>
                    <input 
                      type="text" 
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-[#3D3B65]/50 border border-[#4A4860]/50 rounded-xl focus:ring-2 focus:ring-[#E6B325]/20 focus:border-[#E6B325] outline-none transition-all font-medium text-[#F5F5F7] placeholder-[#B0B0B8] text-center tracking-widest"
                    />
                  </div>

                  <div className="bg-[#3D3B65]/50 border border-[#4A4860]/50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock className="text-[#B0B0B8]" size={18} />
                      <div className="text-xs text-[#B0B0B8]">
                        <p className="font-bold">Visit Time: 2:00 PM - 5:00 PM</p>
                        <p>Expires automatically after visit ends</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#E6B325]/30 flex items-center justify-center gap-2 mt-8"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-[#1A1A2E]/30 border-t-[#1A1A2E] rounded-full animate-spin" />
                    ) : (
                      <>Access Facility <ArrowRight size={18} /></>
                    )}
                  </button>

                  <p className="text-xs text-[#B0B0B8] text-center mt-6">For security purposes, your access will be automatically revoked at the scheduled time</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visitor Access Button - Bottom Right */}
      <button
        onClick={() => setMode('visitor')}
        className="fixed bottom-8 right-8 bg-gradient-to-r from-[#E6B325] to-[#D4A017] hover:from-[#F5D547] hover:to-[#E6B325] text-[#1A1A2E] px-6 py-3 rounded-full font-bold transition-all shadow-lg shadow-[#E6B325]/30 flex items-center gap-2"
      >
        <Users size={18} /> Visitor Access
      </button>
    </div>
  );
};