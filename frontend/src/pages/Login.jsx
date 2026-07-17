import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { Eye, EyeOff, Lock, Mail, AlertTriangle, ShieldCheck, UserRound, BriefcaseBusiness } from 'lucide-react';

const demoAccounts = [
  { label: 'Administrator', email: 'admin@csdashboard.com', password: 'Admin@123', icon: ShieldCheck, tone: 'bg-blue-50 text-blue-700' },
  { label: 'Staff workspace', email: 'staff1@csdashboard.com', password: 'Staff@123', icon: UserRound, tone: 'bg-violet-50 text-violet-700' },
  { label: 'Partner view', email: 'partner@csdashboard.com', password: 'Partner@123', icon: BriefcaseBusiness, tone: 'bg-emerald-50 text-emerald-700' },
];

const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
    setLoading(true);
    try {
      await login(account.email, account.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Test account login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated floating orbs */}
      <div className="absolute top-[-10%] left-[-8%] w-[500px] h-[500px] rounded-full bg-[#2563EB] opacity-[0.04] blur-[130px] pointer-events-none animate-float-orb" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-[#1D4ED8] opacity-[0.04] blur-[120px] pointer-events-none animate-float-orb-slow" />
      <div className="absolute top-[40%] right-[15%] w-[250px] h-[250px] rounded-full bg-[#3B82F6] opacity-[0.03] blur-[90px] pointer-events-none animate-float-orb" style={{ animationDelay: '4s' }} />

      {/* Main Content: split layout */}
      <div className="w-full max-w-4xl flex items-center justify-between gap-12 relative z-10">
        
        {/* Left side — branding + feature list */}
        <div className="hidden lg:flex flex-col justify-center space-y-6 flex-1 page-transition">
          {/* Logo */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#2563EB] rounded-xl flex items-center justify-center shadow-lg shadow-[#2563EB]/25">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-[#2563EB] font-mono font-extrabold text-base tracking-widest">
                CS DASHBOARD
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0F172A] leading-tight">
              ROC Compliance<br />
              <span className="brand-gradient-text">Managed Intelligently.</span>
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed max-w-sm">
              Track, manage, and automate your company secretarial obligations across all client portfolios in one unified platform.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="space-y-2.5">
            {[
              { label: 'Rule Engine auto-generates ROC tasks on client registration' },
              { label: 'Real-time compliance scoring and overdue escalation' },
              { label: 'Audit trail with timestamp for every user action' },
              { label: 'Role-based access for Admin, Staff and Partner' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs text-[#64748B]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] shrink-0" />
                {f.label}
              </div>
            ))}
          </div>

        </div>

        {/* Right side — login card */}
        <div className="w-full max-w-[420px] bg-white border border-[#E5E7EB] rounded-2xl p-8 shadow-xl shadow-[#0F172A]/8 page-transition">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#2563EB] font-mono font-extrabold text-sm tracking-widest">CS DASHBOARD</span>
            </div>
            <h2 className="text-[#0F172A] text-xl font-bold">Sign in to your account</h2>
            <p className="text-[#64748B] text-xs mt-1.5 font-medium">
              CS Compliance Platform — ROC Filing Hub
            </p>
          </div>

          {/* Error inline banner */}
          {error && (
            <div className="mb-5 bg-[#EF4444]/8 border border-[#EF4444]/20 text-[#EF4444] p-3 rounded-lg flex items-start gap-2.5 text-xs font-medium leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#94A3B8]">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@csdashboard.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none text-sm transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  required
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-[#64748B] mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#94A3B8]">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-10 bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg text-[#0F172A] placeholder-[#94A3B8] outline-none text-sm transition-all focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.98] text-white text-sm font-semibold rounded-lg flex items-center justify-center transition-all shadow-lg shadow-[#2563EB]/20 mt-6 disabled:opacity-50 disabled:cursor-not-allowed animate-glow-pulse"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Authenticating...
                </div>
              ) : "Sign in →"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Test access</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin(account)}
                className="group flex flex-col items-center rounded-xl border border-slate-200 bg-white px-2 py-3 text-center transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${account.tone}`}>
                  <account.icon className="h-4 w-4" />
                </span>
                <span className="mt-2 text-[9px] font-semibold leading-3 text-slate-700">{account.label}</span>
              </button>
            ))}
          </div>

          <p className="mt-3 text-center text-[9px] leading-4 text-slate-400">Select a role to sign in instantly with its seeded test account.</p>

          {/* Footer info */}
          <div className="text-center text-[10px] text-[#94A3B8] mt-6">
            Institute of Corporate Governance · MVP Phase 1 · June 2026
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
