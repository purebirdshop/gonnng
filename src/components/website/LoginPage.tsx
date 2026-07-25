import React, { useState } from 'react';
import { LogIn, UserPlus, Key, Mail, Lock, User, AlertCircle, CheckCircle2, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { authService, UserSession, DEMO_USER } from '../../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: UserSession) => void;
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status State
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 1-Click Fill Demo Credentials
  const handleFillDemo = () => {
    setEmail('test@gonnng.com');
    setPassword('test1234');
    setError(null);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const res = authService.login(email, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error || 'Authentication failed.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!agreeTerms) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    const res = authService.register(name, email, password);
    if (res.success && res.user) {
      onLoginSuccess(res.user);
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSuccessMsg(`Password reset instructions sent to ${email}. (Note: Test password is test1234)`);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      {/* BRAND HEADER */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5C00] to-[#FF8000] mx-auto flex items-center justify-center text-white font-mono font-black text-2xl shadow-xl shadow-[#FF5C00]/20">
          G
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          {mode === 'login' && 'Welcome back to Gonnng'}
          {mode === 'register' && 'Create your Gonnng Creator account'}
          {mode === 'forgot' && 'Reset your Gonnng Password'}
        </h1>
        <p className="text-xs text-white/60 font-sans">
          {mode === 'login' && 'Sign in to access your projects, recipes, and circle updates.'}
          {mode === 'register' && 'Start organizing your ideas and finishing ambitious creative projects.'}
          {mode === 'forgot' && 'Enter your email address to receive password recovery instructions.'}
        </p>
      </div>

      {/* QUICK DEMO CREDENTIALS BANNER */}
      {mode === 'login' && (
        <div className="bg-gradient-to-r from-[#FF5C00]/20 to-amber-500/10 border border-[#FF5C00]/30 rounded-2xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-[#FF5C00] font-mono font-bold">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Available Test Accounts (Password: test1234)</span>
            </span>
            <span className="bg-[#FF5C00] text-white px-2 py-0.5 rounded text-[10px]">5 Logins</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              { email: 'test@gonnng.com', label: 'Jason Tyler (Test User)' },
              // { email: 'qa@gonnng.com', label: 'Quinton Adams (QA Lead)' },
              // { email: 'creator@gonnng.com', label: 'Clara Monet (Creator)' },
              // { email: 'dev@gonnng.com', label: 'David Vance (Developer)' },
              // { email: 'product@gonnng.com', label: 'Penelope Reed (Product)' },
            ].map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword('test1234');
                  setError(null);
                }}
                className={`p-2 rounded-xl border text-left transition-all text-[11px] font-mono cursor-pointer flex items-center justify-between ${
                  email === acc.email
                    ? 'bg-[#FF5C00] text-black font-bold border-[#FF5C00]'
                    : 'bg-white/5 border-white/10 hover:border-[#FF5C00]/50 text-white'
                }`}
              >
                <div className="truncate pr-1">
                  <div className="truncate font-bold">{acc.email}</div>
                  <div className="text-[9px] opacity-70 truncate">{acc.label}</div>
                </div>
                <ArrowRight className="w-3 h-3 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ERROR / SUCCESS ALERTS */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* LOGIN FORM */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/70 font-mono">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@gonnng.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <label className="text-white/70 font-mono">Password</label>
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
                className="text-[#FF5C00] hover:underline text-[11px]"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Workspace</span>
          </button>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-white/60">
            <span>Don't have an account? </span>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline"
            >
              Create Account
            </button>
          </div>
        </form>
      )}

      {/* REGISTER FORM */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/70 font-mono">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Clara Monet"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-white/70 font-mono">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-mono">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 chars"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-white/70 font-mono">Confirm Pass</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat pass"
                className="w-full bg-white/5 border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 text-[11px] text-white/70 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-white/20 text-[#FF5C00] focus:ring-0"
            />
            <span>
              By creating an account, I agree to the{' '}
              <button type="button" onClick={() => onNavigate('terms')} className="text-[#FF5C00] underline">Terms of Service</button>{' '}
              and{' '}
              <button type="button" onClick={() => onNavigate('privacy')} className="text-[#FF5C00] underline">Privacy Policy</button>.
            </span>
          </label>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Create Account & Onboard</span>
          </button>

          <div className="pt-4 border-t border-white/10 text-center text-xs text-white/60">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline"
            >
              Sign In
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD FORM */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgotSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/70 font-mono">Your Registered Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@gonnng.com"
                className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
          >
            <Key className="w-4 h-4" />
            <span>Send Recovery Instructions</span>
          </button>

          <div className="pt-2 text-center text-xs text-white/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline"
            >
              Return to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
