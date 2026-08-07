import React, { useState, useEffect } from 'react';
import { LogIn, UserPlus, Key, Mail, Lock, User, AlertCircle, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';
import { authService, UserSession } from '../../services/authService';

interface LoginPageProps {
  onLoginSuccess: (user: UserSession) => void;
  onNavigate: (tab: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');

  // URL query params for reset token
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken') || params.get('token');
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authService.login(email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Invalid email address or password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

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

    setIsSubmitting(true);

    try {
      const res = await authService.register(name, email, password);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Registration failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authService.forgotPassword(email);
      if (res.success) {
        setSuccessMsg(res.message || `Password reset instructions sent to ${email}.`);
      } else {
        setError(res.error || 'Failed to send password reset email.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error processing request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetToken) {
      setError('Reset token is missing or invalid.');
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

    setError(null);
    setSuccessMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authService.resetPassword(resetToken, password);
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset successfully. You can now sign in with your new password.');
        setTimeout(() => {
          setMode('login');
          setPassword('');
          setConfirmPassword('');
        }, 2000);
      } else {
        setError(res.error || 'Failed to reset password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error resetting password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6 text-gray-900">
      {/* BRAND HEADER */}
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF5C00] to-[#FF8000] mx-auto flex items-center justify-center text-black font-mono font-black text-2xl shadow-xl shadow-[#FF5C00]/20">
          G
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {mode === 'login' && 'Welcome back to Gonnng'}
          {mode === 'register' && 'Create your Gonnng Creator account'}
          {mode === 'forgot' && 'Reset your Gonnng Password'}
          {mode === 'reset' && 'Set new Gonnng Password'}
        </h1>
        <p className="text-xs text-gray-600 font-sans">
          {mode === 'login' && 'Sign in to access your projects, recipes, and circle updates.'}
          {mode === 'register' && 'Start organizing your ideas and finishing ambitious creative projects.'}
          {mode === 'forgot' && 'Enter your registered email address to receive password reset instructions.'}
          {mode === 'reset' && 'Choose a strong password with at least 6 characters.'}
        </p>
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-700">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* LOGIN FORM */}
      {mode === 'login' && (
        <form onSubmit={handleLoginSubmit} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-700 font-mono">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-700 font-mono block">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Workspace</span>
              </>
            )}
          </button>

          <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-600 flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline cursor-pointer"
            >
              Create Account
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline cursor-pointer"
            >
              Reset Password
            </button>
          </div>
        </form>
      )}

      {/* REGISTER FORM */}
      {mode === 'register' && (
        <form onSubmit={handleRegisterSubmit} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-700 font-mono">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Clara Monet"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-700 font-mono">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="creator@example.com"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-700 font-mono">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 chars"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-700 font-mono">Confirm Pass</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat pass"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <label className="flex items-start gap-2 pt-1 text-[11px] text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-[#FF5C00] focus:ring-0"
            />
            <span>
              By creating an account, I agree to the{' '}
              <button type="button" onClick={() => onNavigate('terms')} className="text-[#FF5C00] underline font-medium cursor-pointer">Terms of Service</button>{' '}
              and{' '}
              <button type="button" onClick={() => onNavigate('privacy')} className="text-[#FF5C00] underline font-medium cursor-pointer">Privacy Policy</button>.
            </span>
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account & Onboard</span>
              </>
            )}
          </button>

          <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
            <span>Already have an account? </span>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD FORM */}
      {mode === 'forgot' && (
        <form onSubmit={handleForgotSubmit} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-700 font-mono">Your Registered Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Send Recovery Instructions</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-gray-600">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </form>
      )}

      {/* RESET PASSWORD FORM */}
      {mode === 'reset' && (
        <form onSubmit={handleResetSubmit} className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-700 font-mono">New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-700 font-mono">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#FF5C00]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#FF5C00] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#FF5C00]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Save New Password</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-gray-600">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
              className="text-[#FF5C00] font-bold hover:underline cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
