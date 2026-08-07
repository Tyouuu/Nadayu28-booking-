import React, { useState } from 'react';
import { UserRole } from '../types';
import { Eye, EyeOff, Upload, ArrowRight, User, Key, Building, Mail, ChevronLeft, CheckCircle2, Badge, Phone, Smartphone, Users, Clock } from 'lucide-react';
import { signIn, signUp, supabase } from '../services/supabase';
import { loginSchema, registerSchema, phoneOtpSchema, otpVerifySchema, resetPasswordSchema, validate } from '../services/validation';
import { useI18n } from '../contexts/I18nContext';

interface LoginProps {
  onLogin: (role: UserRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'visitor'>('signin');
  const [role, setRole] = useState<'OWNER' | 'TENANT' | 'SECURITY' | 'MANAGEMENT'>('OWNER');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login Methods (password or mobile OTP)
  const [loginMethod, setLoginMethod] = useState<'password' | 'mobile'>('password');

  // Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);

  // Forgot Password States
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

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

  // Register form state
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regUnit, setRegUnit] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { t } = useI18n();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFieldErrors({});
    const result = validate(loginSchema, { email: loginEmail, password: loginPassword });
    if (!result.success) { setFieldErrors(result.errors); return; }
    setIsLoading(true);
    try {
      const { data, error } = await signIn(loginEmail, loginPassword);
      if (error) throw error;

      // Read profile role from Supabase
      let appRole = role === 'TENANT' ? UserRole.TENANT : UserRole.RESIDENT;
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profile?.role === 'SECURITY')        appRole = UserRole.SECURITY;
        else if (profile?.role === 'MANAGEMENT') appRole = UserRole.MANAGEMENT;
        else if (profile?.role === 'TENANT')     appRole = UserRole.TENANT;
      }
      onLogin(appRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please try again.';
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setFieldErrors({});
    const result = validate(registerSchema, {
      firstName: regFirstName, lastName: regLastName, email: regEmail,
      password: regPassword, phone: regPhone, unit: regUnit,
    });
    if (!result.success) { setFieldErrors(result.errors); return; }
    setIsLoading(true);
    try {
      const fullName = `${regFirstName} ${regLastName}`.trim();
      const mappedRole = role === 'OWNER' ? 'RESIDENT' : role;
      const { error } = await signUp(regEmail, regPassword, {
        full_name: fullName,
        role: mappedRole,
        unit: regUnit || undefined,
        phone: regPhone || undefined,
      });
      if (error) throw error;
      setRegSuccess(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setAuthError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phone OTP: Send code via Supabase ──
  const handleSendOTP = async () => {
    setOtpError(null);
    const result = validate(phoneOtpSchema, { phone: phoneNumber });
    if (!result.success) { setOtpError(result.errors.phone); return; }
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone: phoneNumber });
      if (error) throw error;
      setOtpSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setOtpError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Phone OTP: Verify code via Supabase ──
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);
    const result = validate(otpVerifySchema, { code: otpCode });
    if (!result.success) { setOtpError(result.errors.code); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: 'sms',
      });
      if (error) throw error;

      // Read profile role from Supabase
      let appRole = UserRole.RESIDENT;
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
        if (profile?.role === 'SECURITY')        appRole = UserRole.SECURITY;
        else if (profile?.role === 'MANAGEMENT') appRole = UserRole.MANAGEMENT;
        else if (profile?.role === 'TENANT')     appRole = UserRole.TENANT;
      }
      onLogin(appRole);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid OTP. Please try again.';
      setOtpError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = validate(resetPasswordSchema, { email: resetEmail });
    if (!result.success) { setFieldErrors(result.errors); return; }
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

  const getLoginLabel = () => {
    if (role === 'SECURITY') return 'Security ID';
    if (role === 'MANAGEMENT') return 'Staff ID / Email';
    return 'Gmail or user ID';
  };

  const getLoginPlaceholder = () => {
    if (role === 'SECURITY') return 'e.g. SEC-8821';
    if (role === 'MANAGEMENT') return 'admin@nadayu28.com';
    return 'you@gmail.com or username';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-nadayu-bg p-4 relative overflow-hidden">
      {/* Background Effects - Subtle Gold Accents */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-nadayu-accent/5 rounded-full blur-[100px] -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-nadayu-accent/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-6xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[700px] animate-fade-in border border-nadayu-border">

        {/* LEFT SIDE - VISUAL SHOWCASE */}
        <div className="hidden md:flex w-1/2 bg-nadayu-panel relative overflow-hidden flex-col justify-between p-12">
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-nadayu-panel via-transparent to-transparent opacity-80"></div>

          {/* Center Content */}
          <div className="relative z-10 flex flex-col justify-center flex-1">
            <div className="w-16 h-16 bg-nadayu-accent rounded-2xl flex items-center justify-center text-white font-bold text-2xl mb-8">N</div>
            <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
              Nadayu28<br/>Community
            </h2>
            <p className="text-xl text-gray-300 leading-relaxed max-w-sm">
              Experience seamless community living. Manage bookings, parking, and security in one elegant platform.
            </p>

            {/* Pagination Dots */}
            <div className="flex gap-2 mt-10">
              <div className="w-2 h-2 bg-nadayu-accent rounded-full"></div>
              <div className="w-2 h-2 bg-white/20 rounded-full"></div>
              <div className="w-2 h-2 bg-white/20 rounded-full"></div>
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
                  className="flex items-center text-nadayu-muted hover:text-gray-900 transition-colors mb-8 font-bold text-sm"
                >
                  <ChevronLeft size={16} className="mr-2" /> {t.login.signIn}
                </button>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">{t.login.resetPassword}</h2>
                <p className="text-nadayu-muted mb-8 leading-relaxed">Enter your registered email address and we'll send you instructions to reset your password.</p>

                {resetStatus === 'sent' ? (
                  <div className="bg-nadayu-accent/10 border border-nadayu-accent/30 rounded-2xl p-8 text-center animate-scale-in">
                    <div className="w-16 h-16 bg-nadayu-accent text-white rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{t.login.checkEmail}</h3>
                    <p className="text-nadayu-muted text-sm mb-6">We've sent password reset instructions to <span className="font-bold text-gray-900">{resetEmail}</span></p>
                    <button
                      onClick={() => { setShowForgotPassword(false); setResetStatus('idle'); }}
                      className="w-full bg-nadayu-accent hover:brightness-95 text-white py-3 rounded-xl font-bold transition-all"
                    >
                      {t.login.signIn}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.email}</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="w-full pl-12 pr-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={resetStatus === 'sending'}
                      className="w-full bg-nadayu-accent hover:brightness-95 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                    >
                      {resetStatus === 'sending' ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        t.login.sendResetLink
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
                  <h2 className="text-4xl font-bold text-gray-900 mb-1">
                    {mode === 'signin' ? t.login.welcome : t.login.createAccount}
                  </h2>
                  {mode === 'signin' && (
                    <p className="text-nadayu-muted">{t.login.signIn}</p>
                  )}
                </div>

                {/* Already have account / New here */}
                <div className="mb-8">
                  {mode === 'signin' ? (
                    <span className="text-nadayu-muted text-sm">{t.login.noAccount} <button onClick={() => setMode('signup')} className="text-nadayu-panel font-semibold hover:text-gray-700 transition-colors underline">{t.login.createAccount}</button></span>
                  ) : (
                    <span className="text-nadayu-muted text-sm">{t.login.hasAccount} <button onClick={() => setMode('signin')} className="text-nadayu-panel font-semibold hover:text-gray-700 transition-colors underline">{t.login.signIn}</button></span>
                  )}
                </div>

                {/* Mode Selector - Sign In vs Register */}
                {mode !== 'visitor' && (
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setMode('signin')}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        mode === 'signin'
                          ? 'bg-nadayu-panel border border-nadayu-panel text-white'
                          : 'bg-nadayu-cream border border-nadayu-border/50 text-nadayu-muted hover:text-gray-900'
                      }`}
                    >
                      {t.login.signIn}
                    </button>
                    <button
                      onClick={() => setMode('signup')}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all ${
                        mode === 'signup'
                          ? 'bg-nadayu-panel border border-nadayu-panel text-white'
                          : 'bg-nadayu-cream border border-nadayu-border/50 text-nadayu-muted hover:text-gray-900'
                      }`}
                    >
                      {t.login.signUp}
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
                            ? 'bg-nadayu-panel text-white'
                            : 'bg-nadayu-cream text-gray-500 hover:text-gray-900 border border-nadayu-border'
                        }`}
                      >
                        {r === 'OWNER' ? t.login.owner : r === 'TENANT' ? t.login.tenant : r === 'SECURITY' ? t.login.security : t.login.management}
                      </button>
                    ))}
                  </div>
                )}

                {/* SIGN IN FORM */}
                {mode === 'signin' && (
                  <form onSubmit={loginMethod === 'mobile' ? handleVerifyOTP : handleLogin} className="space-y-5 animate-fade-in">

                    {/* Login Method Selection - For Owner & Tenant */}
                    {(role === 'OWNER' || role === 'TENANT') && (
                      <div className="space-y-3 mb-6">
                        <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.loginMethod}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => { setLoginMethod('password'); setOtpSent(false); setOtpCode(''); setOtpError(null); }}
                            className={`py-3 px-2 rounded-xl transition-all font-bold text-xs flex flex-col items-center gap-2 ${
                              loginMethod === 'password'
                                ? 'bg-nadayu-panel border border-nadayu-panel text-white'
                                : 'bg-nadayu-cream border border-nadayu-border/50 text-nadayu-muted hover:text-gray-900'
                            }`}
                          >
                            <Key size={16} /> {t.login.passwordLogin}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setLoginMethod('mobile'); setAuthError(null); }}
                            className={`py-3 px-2 rounded-xl transition-all font-bold text-xs flex flex-col items-center gap-2 ${
                              loginMethod === 'mobile'
                                ? 'bg-nadayu-panel border border-nadayu-panel text-white'
                                : 'bg-nadayu-cream border border-nadayu-border/50 text-nadayu-muted hover:text-gray-900'
                            }`}
                          >
                            <Smartphone size={16} /> {t.login.mobileOtp}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Password-based Login */}
                    {loginMethod === 'password' && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-nadayu-muted uppercase">{getLoginLabel()}</label>
                          <div className="relative">
                            <User className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                            <input
                              type="email"
                              value={loginEmail}
                              onChange={(e) => { setLoginEmail(e.target.value); setFieldErrors(prev => ({ ...prev, email: '' })); }}
                              placeholder={getLoginPlaceholder()}
                              className={`w-full pl-12 pr-4 py-3 bg-nadayu-cream border rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none transition-all font-medium text-gray-900 placeholder-gray-400 ${fieldErrors.email ? 'border-red-400' : 'border-nadayu-border/50'}`}
                            />
                          </div>
                          {fieldErrors.email && <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.password}</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                            <input
                              type={showPassword ? "text" : "password"}
                              value={loginPassword}
                              onChange={(e) => { setLoginPassword(e.target.value); setFieldErrors(prev => ({ ...prev, password: '' })); }}
                              placeholder="••••••••"
                              className={`w-full pl-12 pr-12 py-3 bg-nadayu-cream border rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none transition-all font-medium text-gray-900 placeholder-gray-400 ${fieldErrors.password ? 'border-red-400' : 'border-nadayu-border/50'}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-4 top-4 text-nadayu-muted hover:text-gray-900 transition-colors"
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => setShowForgotPassword(true)}
                              className="text-xs font-bold text-nadayu-accent hover:text-gray-700 transition-colors"
                            >
                              {t.login.forgotPassword}
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Mobile OTP Login */}
                    {loginMethod === 'mobile' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.phone}</label>
                          <div className="relative">
                            <Phone className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+60123456789"
                              disabled={otpSent}
                              className="w-full pl-12 pr-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none transition-all font-medium text-gray-900 placeholder-gray-400 disabled:opacity-50"
                            />
                          </div>
                          <p className="text-[10px] text-nadayu-muted">Include country code (e.g. +60 for Malaysia)</p>
                        </div>

                        {!otpSent ? (
                          <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={isLoading}
                            className="w-full bg-nadayu-accent hover:brightness-95 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                          >
                            {isLoading ? (
                              <div className="w-5 h-5 border-2 border-nadayu-panel/30 border-t-nadayu-panel rounded-full animate-spin" />
                            ) : (
                              t.login.sendOtp
                            )}
                          </button>
                        ) : (
                          <div className="space-y-3 animate-fade-in">
                            <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.enterOtp}</label>
                            <input
                              type="text"
                              placeholder="000000"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                              maxLength={6}
                              className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none transition-all font-medium text-gray-900 placeholder-gray-400 text-center tracking-widest"
                            />
                            <p className="text-xs text-nadayu-muted text-center">Code expires in 5 minutes</p>
                            <button
                              type="button"
                              onClick={() => { setOtpSent(false); setOtpCode(''); setOtpError(null); }}
                              className="text-xs font-bold text-nadayu-accent hover:text-gray-700 transition-colors"
                            >
                              Change phone number
                            </button>
                          </div>
                        )}

                        {/* OTP Error */}
                        {otpError && (
                          <p className="text-sm text-center px-4 py-2 rounded-xl text-red-600 bg-red-50">{otpError}</p>
                        )}
                      </div>
                    )}

                    {/* Auth error */}
                    {authError && (
                      <p className="text-sm text-center px-4 py-2 rounded-xl text-red-600 bg-red-50">{authError}</p>
                    )}

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading || (loginMethod === 'mobile' && (!otpSent || otpCode.length !== 6))}
                      className="w-full bg-nadayu-accent hover:brightness-95 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-8 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-nadayu-panel/30 border-t-nadayu-panel rounded-full animate-spin" />
                      ) : (
                        <>{t.login.signIn} <ArrowRight size={18} /></>
                      )}
                    </button>

                    {/* OAuth Options */}
                    <div className="relative my-8">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-nadayu-border/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-nadayu-muted">Or sign in with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="py-3 border border-nadayu-border/50 hover:border-nadayu-accent/30 rounded-xl font-bold text-nadayu-muted hover:text-nadayu-accent transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1,12.545,1 C6.438,1,1.514,5.924,1.514,12c0,6.075,4.924,11,11.031,11c5.659,0,10.571-4.233,10.571-9.772c0-0.628-0.078-1.274-0.199-1.989H12.545z"/></svg>
                        Google
                      </button>
                      <button type="button" className="py-3 border border-nadayu-border/50 hover:border-nadayu-accent/30 rounded-xl font-bold text-nadayu-muted hover:text-nadayu-accent transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.48-3.24-1.84-.37-.69-.37-1.52-.03-2.47 1.23-3.27 3.45-6.71 3.73-7.89.05-.29-.13-.61-.37-.75-.51-.32-1.3.09-1.42.79-.13.69-.45 1.48-.89 2.25-1.04 1.81-1.65 2.47-2.86 2.18-1.04-.23-1.51-1.08-2.09-2.47-.3-.75-.63-1.46-.95-2.15-1.05-2.29-1.21-2.94-.97-4.03.07-.32.36-.68.75-.72 1.04-.1 1.17.59 1.95 2.39 1.36 3.23 1.65 4.2 2.95 4.18 1.28-.02 1.94-.92 2.24-2.33.12-.5.22-.94.32-1.31.18-.67.47-1.39 1.15-1.64 1.24-.4 2.12.32 2.06 1.39-.09 1.5-1.39 3.89-2.8 6.14-.5.86-.71 1.62-.43 2.3.28.68 1.08.82 1.79.3.85-.63 1.62-1.55 2.28-2.58z"/></svg>
                        Apple
                      </button>
                    </div>
                  </form>
                )}

                {/* REGISTER FORM */}
                {mode === 'signup' && !regSuccess && (
                  <form onSubmit={handleRegister} className="space-y-5 animate-fade-in max-h-[600px] overflow-y-auto pr-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.firstName} *</label>
                        <input
                          type="text"
                          placeholder="e.g. Ahmad"
                          value={regFirstName}
                          onChange={e => setRegFirstName(e.target.value)}
                          required
                          className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium text-gray-900 placeholder-gray-400 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.lastName}</label>
                        <input
                          type="text"
                          placeholder="e.g. Razali"
                          value={regLastName}
                          onChange={e => setRegLastName(e.target.value)}
                          className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium text-gray-900 placeholder-gray-400 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.email} *</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                        <input
                          type="email"
                          placeholder="you@example.com"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          required
                          className="w-full pl-12 pr-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium text-gray-900 placeholder-gray-400 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.password} *</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Min 6 characters"
                          value={regPassword}
                          onChange={e => setRegPassword(e.target.value)}
                          required
                          minLength={6}
                          className="w-full pl-12 pr-12 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium text-gray-900 placeholder-gray-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-4 text-nadayu-muted hover:text-nadayu-accent transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.unitNumber}</label>
                        <div className="relative">
                          <Building className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                          <input
                            type="text"
                            placeholder="e.g. A-08-03"
                            value={regUnit}
                            onChange={e => setRegUnit(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium text-gray-900 placeholder-gray-400 transition-all"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-nadayu-muted uppercase">{t.login.phone}</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                          <input
                            type="tel"
                            placeholder="012-3456789"
                            value={regPhone}
                            onChange={e => setRegPhone(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium text-gray-900 placeholder-gray-400 transition-all"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Terms & Conditions */}
                    <div className="flex items-start gap-3 pt-2">
                      <input type="checkbox" id="terms" className="w-5 h-5 accent-nadayu-accent rounded mt-0.5" />
                      <label htmlFor="terms" className="text-xs text-nadayu-muted">
                        I agree to the <button type="button" className="text-nadayu-accent hover:text-gray-700 font-bold">Terms & Conditions</button>
                      </label>
                    </div>

                    {/* TENANT REGISTRATION - INVITATION OR APPLICATION */}
                    {role === 'TENANT' && (
                      <div className="space-y-4 pt-4 border-t border-nadayu-border/50 animate-fade-in">
                        <div className="flex gap-4 mb-4">
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="radio"
                              name="tenantRegMethod"
                              checked={tenantRegMethod === 'invite'}
                              onChange={() => setTenantRegMethod('invite')}
                              className="accent-nadayu-accent"
                            />
                            <span className="text-sm font-medium text-gray-900">Invitation Code</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer flex-1">
                            <input
                              type="radio"
                              name="tenantRegMethod"
                              checked={tenantRegMethod === 'apply'}
                              onChange={() => setTenantRegMethod('apply')}
                              className="accent-nadayu-accent"
                            />
                            <span className="text-sm font-medium text-gray-900">Self-Apply</span>
                          </label>
                        </div>

                        {tenantRegMethod === 'invite' ? (
                          <div className="space-y-2 animate-fade-in">
                            <div className="bg-nadayu-accent/10 border border-nadayu-accent/30 p-3 rounded-lg">
                              <p className="text-xs text-nadayu-accent">Enter the invitation code sent by the property owner</p>
                            </div>
                            <label className="text-xs font-bold text-nadayu-muted uppercase">Invitation Code</label>
                            <input
                              type="text"
                              placeholder="e.g. ND28-XYZ-999"
                              value={invitationCode}
                              onChange={(e) => setInvitationCode(e.target.value)}
                              className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none font-medium text-gray-900 placeholder-gray-400 transition-all"
                            />
                            <p className="text-[10px] text-nadayu-muted">Code format: NADAYU-XXXXX (provided by owner)</p>
                          </div>
                        ) : (
                          <div className="space-y-2 animate-fade-in">
                            <div className="bg-nadayu-accent/10 border border-nadayu-accent/30 p-3 rounded-lg">
                              <p className="text-xs text-nadayu-accent">Upload your tenancy agreement for administrator approval</p>
                            </div>
                            <label className="text-xs font-bold text-nadayu-muted uppercase">Tenancy Agreement</label>
                            <div className="border-2 border-dashed border-nadayu-accent/50 hover:border-nadayu-accent rounded-xl p-4 text-center hover:bg-nadayu-accent/5 transition-all cursor-pointer">
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,image/*"
                                className="hidden"
                                id="tenancyUpload"
                              />
                              <label htmlFor="tenancyUpload" className="cursor-pointer">
                                <Upload className="mx-auto text-nadayu-accent mb-2" size={20} />
                                <p className="text-xs font-bold text-nadayu-accent">Upload Agreement</p>
                              </label>
                            </div>
                            <p className="text-[10px] text-nadayu-muted">Status: Awaiting administrator approval</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Auth error */}
                    {authError && (
                      <p className="text-sm text-center px-4 py-2 rounded-xl text-red-600 bg-red-50">{authError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || (role === 'TENANT' && tenantRegMethod === 'invite' && !invitationCode)}
                      className="w-full bg-nadayu-accent hover:brightness-95 text-white py-3 rounded-xl font-bold transition-all mt-8 disabled:opacity-50"
                    >
                      {isLoading ? 'Processing...' : t.login.createAccount}
                    </button>

                    {/* OAuth Options */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-nadayu-border/50"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-nadayu-muted">Or register with</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <button type="button" className="py-3 border border-nadayu-border/50 hover:border-nadayu-accent/30 rounded-xl font-bold text-nadayu-muted hover:text-nadayu-accent transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 c0-3.331,2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.461,2.268,15.199,1,12.545,1 C6.438,1,1.514,5.924,1.514,12c0,6.075,4.924,11,11.031,11c5.659,0,10.571-4.233,10.571-9.772c0-0.628-0.078-1.274-0.199-1.989H12.545z"/></svg>
                        Google
                      </button>
                      <button type="button" className="py-3 border border-nadayu-border/50 hover:border-nadayu-accent/30 rounded-xl font-bold text-nadayu-muted hover:text-nadayu-accent transition-all flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.48-3.24-1.84-.37-.69-.37-1.52-.03-2.47 1.23-3.27 3.45-6.71 3.73-7.89.05-.29-.13-.61-.37-.75-.51-.32-1.3.09-1.42.79-.13.69-.45 1.48-.89 2.25-1.04 1.81-1.65 2.47-2.86 2.18-1.04-.23-1.51-1.08-2.09-2.47-.3-.75-.63-1.46-.95-2.15-1.05-2.29-1.21-2.94-.97-4.03.07-.32.36-.68.75-.72 1.04-.1 1.17.59 1.95 2.39 1.36 3.23 1.65 4.2 2.95 4.18 1.28-.02 1.94-.92 2.24-2.33.12-.5.22-.94.32-1.31.18-.67.47-1.39 1.15-1.64 1.24-.4 2.12.32 2.06 1.39-.09 1.5-1.39 3.89-2.8 6.14-.5.86-.71 1.62-.43 2.3.28.68 1.08.82 1.79.3.85-.63 1.62-1.55 2.28-2.58z"/></svg>
                        Apple
                      </button>
                    </div>
                  </form>
                )}

                {/* REGISTRATION SUCCESS */}
                {mode === 'signup' && regSuccess && (
                  <div className="text-center animate-fade-in py-8">
                    <div className="w-16 h-16 bg-nadayu-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="text-nadayu-accent" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{t.login.registerSuccess}</h3>
                    <p className="text-nadayu-muted text-sm mb-6">{t.login.checkEmail}</p>
                    <button
                      onClick={() => { setMode('signin'); setRegSuccess(false); setLoginEmail(regEmail); }}
                      className="bg-nadayu-accent hover:brightness-95 text-white px-6 py-3 rounded-xl font-bold transition-all"
                    >
                      {t.login.signIn}
                    </button>
                  </div>
                )}
              </>
            )}

            {/* VISITOR LOGIN */}
            {mode === 'visitor' && (
              <div className="animate-fade-in">
                <button
                  onClick={() => setMode('signin')}
                  className="flex items-center text-nadayu-muted hover:text-gray-900 transition-colors mb-8 font-bold text-sm"
                >
                  <ChevronLeft size={16} className="mr-2" /> Back
                </button>

                <h2 className="text-3xl font-bold text-gray-900 mb-2">Visitor Access</h2>
                <p className="text-nadayu-muted mb-8 leading-relaxed">Enter your temporary visitor credentials to access the facility</p>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="bg-nadayu-accent/10 border border-nadayu-accent/30 p-4 rounded-xl flex gap-3 mb-6">
                    <Users className="text-nadayu-accent flex-shrink-0 mt-0.5" size={18} />
                    <div className="text-xs text-nadayu-accent leading-relaxed">
                      <strong>Temporary Access:</strong> Your account is automatically created based on pre-registration and expires at the scheduled visit end time.
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-nadayu-muted uppercase">Visitor Code</label>
                    <div className="relative">
                      <Badge className="absolute left-4 top-4 text-nadayu-muted" size={18} />
                      <input
                        type="text"
                        placeholder="e.g. VISIT-ABC123"
                        className="w-full pl-12 pr-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none transition-all font-medium text-gray-900 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-nadayu-muted uppercase">Verification Code</label>
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength={6}
                      className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border/50 rounded-xl focus:ring-2 focus:ring-nadayu-accent/20 focus:border-nadayu-accent outline-none transition-all font-medium text-gray-900 placeholder-gray-400 text-center tracking-widest"
                    />
                  </div>

                  <div className="bg-nadayu-cream border border-nadayu-border/50 p-4 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock className="text-nadayu-muted" size={18} />
                      <div className="text-xs text-nadayu-muted">
                        <p className="font-bold">Visit Time: 2:00 PM - 5:00 PM</p>
                        <p>Expires automatically after visit ends</p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-nadayu-accent hover:brightness-95 text-white py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mt-8"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-nadayu-panel/30 border-t-nadayu-panel rounded-full animate-spin" />
                    ) : (
                      <>Access Facility <ArrowRight size={18} /></>
                    )}
                  </button>

                  <p className="text-xs text-nadayu-muted text-center mt-6">For security purposes, your access will be automatically revoked at the scheduled time</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Visitor Access Button - Bottom Right */}
      <button
        onClick={() => setMode('visitor')}
        className="fixed bottom-8 right-8 bg-nadayu-accent hover:brightness-95 text-white px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2"
      >
        <Users size={18} /> Visitor Access
      </button>
    </div>
  );
};
