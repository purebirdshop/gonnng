import React, { useState, useEffect, useMemo } from 'react';
import { 
  LogIn, 
  UserPlus, 
  Key, 
  Mail, 
  Lock, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Loader2, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Check, 
  Search
} from 'lucide-react';
import { authService, UserSession } from '../../services/authService';
import { CATEGORIES_DATA, getCategoryColor } from '../../data/categoriesData';
import { GonnngGLogo, GonnngGIcon } from '../GonnngLogo';

interface LoginPageProps {
  initialMode?: 'login' | 'register' | 'forgot' | 'reset';
  onLoginSuccess: (user: UserSession) => void;
  onNavigate: (tab: string) => void;
}

// Derive parent category groups from CATEGORIES_DATA
const PARENT_GROUPS = ['All', ...Array.from(new Set(CATEGORIES_DATA.map(c => c.parentCategory)))];

export const LoginPage: React.FC<LoginPageProps> = ({ 
  initialMode = 'login', 
  onLoginSuccess, 
  onNavigate 
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>(initialMode);
  const [registerStep, setRegisterStep] = useState<1 | 2 | 3>(1);

  // Sync mode if initialMode prop changes
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      if (initialMode === 'register') {
        setRegisterStep(1);
      }
    }
  }, [initialMode]);

  // URL query params for reset token
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Step 1 Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Email Checking State
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isEmailAvailable, setIsEmailAvailable] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Step 2 Form State
  const [username, setUsername] = useState('');
  const [about, setAbout] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isUsernameCustom, setIsUsernameCustom] = useState(false);

  // Username checking state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // Interests Filter Tabs & Search
  const [activeParentGroup, setActiveParentGroup] = useState<string>('All');
  const [interestSearchQuery, setInterestSearchQuery] = useState('');

  // Step 3 Form State
  const [agreeTerms, setAgreeTerms] = useState(false);

  // General Status State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Parse reset token / verify token from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken') || params.get('token');
    const verifyToken = params.get('verifyToken');

    if (verifyToken) {
      setSuccessMsg('✅ Email address successfully verified! Welcome to Gonnng.');
      setMode('login');
    } else if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, []);

  // STEP 1: Real-time Email Availability Check
  useEffect(() => {
    const clean = email.trim().toLowerCase();
    if (!clean || !/\S+@\S+\.\S+/.test(clean)) {
      setIsEmailAvailable(null);
      setEmailError(null);
      return;
    }

    setIsCheckingEmail(true);
    setEmailError(null);

    const timer = setTimeout(async () => {
      const available = await authService.checkEmailAvailability(clean);
      setIsCheckingEmail(false);
      setIsEmailAvailable(available);
      if (!available) {
        setEmailError('This email address is already registered. Please sign in or use another email.');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  // STEP 2: Real-time Username Availability Check
  useEffect(() => {
    if (!username.trim()) {
      setIsUsernameAvailable(null);
      setUsernameError(null);
      return;
    }

    const clean = username.trim().toLowerCase();
    if (clean.length < 3) {
      setIsUsernameAvailable(false);
      setUsernameError('Username must be at least 3 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setIsUsernameAvailable(false);
      setUsernameError('Username can only contain letters, numbers, and underscores.');
      return;
    }

    setIsCheckingUsername(true);
    setUsernameError(null);

    const timer = setTimeout(async () => {
      const available = await authService.checkUsernameAvailability(clean);
      setIsCheckingUsername(false);
      setIsUsernameAvailable(available);
      if (!available) {
        setUsernameError('Username is already taken. Please try another.');
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username]);

  // STEP 1 VALIDATION
  const isEmailValidFormat = Boolean(email.trim()) && /\S+@\S+\.\S+/.test(email.trim());
  const isPasswordValid = password.length >= 6;
  const doPasswordsMatch = password.length > 0 && password === confirmPassword;

  const isStep1Valid = 
    isEmailValidFormat && 
    isEmailAvailable === true && 
    !isCheckingEmail && 
    isPasswordValid && 
    doPasswordsMatch;

  // STEP 2 VALIDATION
  const cleanUsername = username.trim().toLowerCase();
  const isUsernameValid = 
    cleanUsername.length >= 3 && 
    /^[a-zA-Z0-9_]+$/.test(cleanUsername) && 
    isUsernameAvailable === true && 
    !isCheckingUsername;

  const isInterestsValid = interests.length >= 1 && interests.length <= 3;

  const isStep2Valid = isUsernameValid && isInterestsValid;

  // STEP 3 VALIDATION
  const isStep3Valid = agreeTerms && !isSubmitting;

  // Handle Login Submit
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

  // Step 1 -> Step 2 Validation & Continuation
  const handleStep1Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid) return;
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    // Auto-populate username with everything before @ domain if user hasn't typed a custom username
    if (!isUsernameCustom || !username) {
      const emailPrefix = cleanEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '');
      setUsername(emailPrefix);
    }

    setRegisterStep(2);
  };

  // Step 2 -> Step 3 Validation & Continuation
  const handleStep2Continue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep2Valid) return;
    setError(null);
    setRegisterStep(3);
  };

  // Final Register Submission on Step 3
  const handleRegisterFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep3Valid) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const displayName = username;
      const res = await authService.register(
        displayName,
        email,
        password,
        username,
        about,
        interests
      );

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

  // Handle Password Recovery Request
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

  // Handle Password Reset Submit
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

  // Filter & Alphabetically Sort Interest Items
  const filteredAndSortedInterests = useMemo(() => {
    return CATEGORIES_DATA.filter(cat => {
      // Parent group filter
      if (activeParentGroup !== 'All' && cat.parentCategory !== activeParentGroup) {
        return false;
      }
      // Search query filter
      if (interestSearchQuery.trim()) {
        const q = interestSearchQuery.toLowerCase().trim();
        return (
          cat.name.toLowerCase().includes(q) ||
          cat.synonyms.some(s => s.toLowerCase().includes(q))
        );
      }
      return true;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeParentGroup, interestSearchQuery]);

  // Toggle Interest Pill Selection
  const toggleInterest = (categoryName: string) => {
    if (interests.includes(categoryName)) {
      setInterests(prev => prev.filter(i => i !== categoryName));
      setError(null);
    } else {
      if (interests.length >= 3) {
        setError('You can select a maximum of 3 interests.');
        return;
      }
      setInterests(prev => [...prev, categoryName]);
      setError(null);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-5 text-gray-900">
      {/* BRAND HEADER */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center">
          <GonnngGLogo className="h-10 w-auto text-black" />
        </div>
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {mode === 'login' && 'Welcome back to Gonnng'}
          {mode === 'register' && 'Create your Gonnng Creator account'}
          {mode === 'forgot' && 'Reset your Gonnng Password'}
          {mode === 'reset' && 'Set new Gonnng Password'}
        </h1>
        <p className="text-xs text-gray-600 font-sans">
          {mode === 'login' && 'Sign in to access your projects, recipes, and circle updates.'}
          {mode === 'register' && (
            registerStep === 1 ? 'Step 1 of 3: Account Credentials' :
            registerStep === 2 ? 'Step 2 of 3: Profile & Creative Interests' :
            'Step 3 of 3: Review & Terms Agreement'
          )}
          {mode === 'forgot' && 'Enter your registered email address to receive password reset instructions.'}
          {mode === 'reset' && 'Choose a strong password with at least 6 characters.'}
        </p>

        {/* Multi-step progress indicator for Registration */}
        {mode === 'register' && (
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3].map((stepNum) => (
              <div 
                key={stepNum} 
                className={`flex items-center gap-1.5 ${registerStep === stepNum ? 'text-[#F59E0B] font-bold' : 'text-gray-400'}`}
              >
                <div 
                  className={`w-6 h-6 rounded-full text-[11px] font-mono font-bold flex items-center justify-center transition-all ${
                    registerStep === stepNum 
                      ? 'bg-[#F59E0B] text-black shadow-sm' 
                      : registerStep > stepNum 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {registerStep > stepNum ? <Check className="w-3.5 h-3.5" /> : stepNum}
                </div>
                {stepNum < 3 && <div className={`w-8 h-0.5 rounded-full ${registerStep > stepNum ? 'bg-emerald-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ERROR / SUCCESS ALERTS */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-700 animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-emerald-700 animate-fadeIn">
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
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
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
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#F59E0B]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
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
              onClick={() => { setMode('register'); setRegisterStep(1); setError(null); setSuccessMsg(null); }}
              className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
            >
              Create Account
            </button>
            <span className="text-gray-300">|</span>
            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(null); setSuccessMsg(null); }}
              className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
            >
              Reset Password
            </button>
          </div>
        </form>
      )}

      {/* MULTI-STEP CREATE ACCOUNT WORKFLOW */}
      {mode === 'register' && (
        <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-6 space-y-5">
          {/* STEP 1: EMAIL & PASSWORD WITH REAL-TIME AVAILABILITY */}
          {registerStep === 1 && (
            <form onSubmit={handleStep1Continue} className="space-y-4">
              {/* EMAIL FIELD WITH REAL-TIME CHECK */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono font-medium block">
                  Email Address <span className="text-[#F59E0B] font-bold">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="creator@example.com"
                    className={`w-full bg-gray-50 border rounded-xl pl-10 pr-9 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white ${
                      isEmailAvailable === false 
                        ? 'border-red-400 focus:border-red-500' 
                        : isEmailAvailable === true 
                          ? 'border-emerald-400 focus:border-emerald-500' 
                          : 'border-gray-300 focus:border-[#F59E0B]'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingEmail ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : isEmailAvailable === true ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : isEmailAvailable === false ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {emailError && (
                  <p className="text-[11px] text-red-600 font-mono">{emailError}</p>
                )}
                {isEmailAvailable === true && !emailError && (
                  <p className="text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Email address is available!
                  </p>
                )}
              </div>

              {/* PASSWORD FIELD */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono font-medium block">
                  Password <span className="text-[#F59E0B] font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
                  />
                </div>
                {password.length > 0 && password.length < 6 && (
                  <p className="text-[11px] text-amber-600 font-mono">Password must be at least 6 characters.</p>
                )}
              </div>

              {/* CONFIRM PASSWORD FIELD */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono font-medium block">
                  Confirm Password <span className="text-[#F59E0B] font-bold">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
                  />
                </div>
                {confirmPassword.length > 0 && !doPasswordsMatch && (
                  <p className="text-[11px] text-red-600 font-mono">Passwords do not match.</p>
                )}
              </div>

              {/* CONTINUE BUTTON - DISABLED UNTIL STEP 1 IS VALID */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!isStep1Valid}
                  className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isStep1Valid
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black shadow-lg shadow-[#F59E0B]/20 hover:scale-[1.01]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              {/* UNIVERSAL FOOTER */}
              <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                  className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
                >
                  Sign in.
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PROFILE & CATEGORY-GROUPED INTEREST PILLS */}
          {registerStep === 2 && (
            <form onSubmit={handleStep2Continue} className="space-y-4">
              {/* USERNAME FIELD */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-700 font-mono font-medium block">
                    Username <span className="text-[#F59E0B] font-bold">*</span>
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Auto-generated from email
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-gray-400 font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setIsUsernameCustom(true);
                    }}
                    placeholder="username"
                    className={`w-full bg-gray-50 border rounded-xl pl-8 pr-9 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white ${
                      isUsernameAvailable === false 
                        ? 'border-red-400 focus:border-red-500' 
                        : isUsernameAvailable === true 
                          ? 'border-emerald-400 focus:border-emerald-500' 
                          : 'border-gray-300 focus:border-[#F59E0B]'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {isCheckingUsername ? (
                      <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                    ) : isUsernameAvailable === true ? (
                      <Check className="w-4 h-4 text-emerald-600 font-bold" />
                    ) : isUsernameAvailable === false ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : null}
                  </div>
                </div>
                {usernameError && (
                  <p className="text-[11px] text-red-600 font-mono">{usernameError}</p>
                )}
                {isUsernameAvailable === true && !usernameError && (
                  <p className="text-[11px] text-emerald-600 font-mono flex items-center gap-1">
                    <Check className="w-3 h-3" /> Username is available!
                  </p>
                )}
              </div>

              {/* ABOUT FIELD */}
              <div className="space-y-1.5">
                <label className="text-xs text-gray-700 font-mono font-medium block">
                  About <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Share a brief bio or what creative projects you build..."
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B] resize-none"
                />
              </div>

              {/* INTERESTS SECTION REDESIGN */}
              <div className="space-y-2.5 pt-1">
                {/* Header: Label + "What are we creating?" + Tracker ${n}/3 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <label className="text-xs text-gray-900 font-mono font-bold block">
                      Interests
                    </label>
                    <span className="text-xs text-gray-500 font-normal">
                      What are we creating?
                    </span>
                  </div>
                  <span className={`text-xs font-mono font-extrabold px-2 py-0.5 rounded-md ${
                    interests.length === 0 
                      ? 'bg-amber-100 text-amber-800' 
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {interests.length}/3
                  </span>
                </div>

                {/* HORIZONTAL SCROLLABLE PARENT GROUP FILTER TABS */}
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none border-b border-gray-100">
                    {PARENT_GROUPS.map((group) => {
                      const isActive = activeParentGroup === group;
                      const sampleCat = CATEGORIES_DATA.find(c => c.parentCategory === group);
                      const groupColorHex = group === 'All' 
                        ? getCategoryColor('General') 
                        : (sampleCat ? (sampleCat.colorHex || getCategoryColor(sampleCat.name)) : '#fff6e4');

                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => setActiveParentGroup(group)}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-mono shrink-0 transition-all cursor-pointer flex items-center gap-1.5 border ${
                            isActive 
                              ? 'font-extrabold shadow-xs scale-[1.02]' 
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:text-gray-900 font-medium'
                          }`}
                          style={isActive ? {
                            backgroundColor: groupColorHex,
                            borderColor: '#111827',
                            color: '#000000',
                          } : undefined}
                        >
                          <span 
                            className="w-2 h-2 rounded-full shrink-0 border border-black/10" 
                            style={{ backgroundColor: groupColorHex }} 
                          />
                          <span>{group}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* SEARCH BAR FOR QUICK FILTERING */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={interestSearchQuery}
                      onChange={(e) => setInterestSearchQuery(e.target.value)}
                      placeholder="Search interests by name or keyword..."
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
                    />
                    {interestSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setInterestSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* ALPHABETICALLY SORTED INTEREST PILLS IN PARAGRAPH / FLUID FLEX-WRAP */}
                <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-3 max-h-56 overflow-y-auto">
                  {filteredAndSortedInterests.length === 0 ? (
                    <div className="py-6 text-center text-xs text-gray-500 font-mono">
                      No matching interests found for "{interestSearchQuery}"
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredAndSortedInterests.map((cat) => {
                        const isSelected = interests.includes(cat.name);
                        const colorHex = cat.colorHex || getCategoryColor(cat.name);

                        return (
                          <button
                            key={cat.id || cat.name}
                            type="button"
                            onClick={() => toggleInterest(cat.name)}
                            className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer flex items-center gap-1.5 border ${
                              isSelected
                                ? 'font-extrabold shadow-xs scale-105 ring-2 ring-gray-900 ring-offset-1'
                                : 'font-medium hover:scale-[1.03] opacity-85 hover:opacity-100'
                            }`}
                            style={{
                              backgroundColor: isSelected ? colorHex : `${colorHex}18`,
                              borderColor: isSelected ? '#111827' : `${colorHex}50`,
                              color: isSelected ? '#000000' : '#1f2937',
                            }}
                          >
                            <span>{cat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ACTION BUTTONS: Back Button + Continue Button (Enabled when username & interests valid) */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setRegisterStep(1);
                  }}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center"
                  title="Back to Step 1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!isStep2Valid}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isStep2Valid
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black shadow-lg shadow-[#F59E0B]/20 hover:scale-[1.01]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              {/* UNIVERSAL FOOTER */}
              <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                  className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
                >
                  Sign in.
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: CONFIRMATION PREVIEW & TERMS AGREEMENT */}
          {registerStep === 3 && (
            <form onSubmit={handleRegisterFinalSubmit} className="space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-xs font-mono font-bold text-gray-900 uppercase tracking-wider">
                    Confirm Account Details
                  </h3>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                    Ready
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                    <span className="text-gray-500 font-mono">Email Address:</span>
                    <span className="font-semibold text-gray-900 truncate max-w-[200px]">{email}</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                    <span className="text-gray-500 font-mono">Username:</span>
                    <span className="font-mono font-bold text-[#F59E0B]">@{username}</span>
                  </div>

                  <div className="flex justify-between items-center py-0.5 border-b border-gray-100">
                    <span className="text-gray-500 font-mono">Password:</span>
                    <span className="font-mono text-gray-400">••••••••</span>
                  </div>

                  {about && (
                    <div className="py-1 border-b border-gray-100">
                      <span className="text-gray-500 font-mono block mb-0.5">About / Bio:</span>
                      <p className="text-gray-800 text-xs italic bg-white p-2 rounded-lg border border-gray-200">
                        "{about}"
                      </p>
                    </div>
                  )}

                  <div className="py-1">
                    <span className="text-gray-500 font-mono block mb-1">Selected Interests ({interests.length}):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((catName) => {
                        const catColor = getCategoryColor(catName);
                        return (
                          <span
                            key={catName}
                            className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border shadow-2xs"
                            style={{
                              backgroundColor: catColor,
                              color: '#000000',
                              borderColor: '#111827'
                            }}
                          >
                            {catName}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* AGREE TO TERMS & SERVICE CHECKBOX */}
              <label className="flex items-start gap-2 pt-1 text-[11px] text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-gray-300 text-[#F59E0B] focus:ring-0 cursor-pointer"
                />
                <span>
                  By creating an account, I agree to the{' '}
                  <button type="button" onClick={() => onNavigate('terms')} className="text-[#F59E0B] underline font-bold cursor-pointer">Terms of Service</button>{' '}
                  and{' '}
                  <button type="button" onClick={() => onNavigate('privacy')} className="text-[#F59E0B] underline font-bold cursor-pointer">Privacy Policy</button>. <span className="text-[#F59E0B] font-bold">*</span>
                </span>
              </label>

              {/* ACTION BUTTONS: Back button + Create my account button */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setRegisterStep(2);
                  }}
                  className="p-3 bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center"
                  title="Back to Step 2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>

                <button
                  type="submit"
                  disabled={!isStep3Valid}
                  className={`flex-1 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isStep3Valid
                      ? 'bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black shadow-lg shadow-[#F59E0B]/20 hover:scale-[1.01]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create my account</span>
                    </>
                  )}
                </button>
              </div>

              {/* UNIVERSAL FOOTER */}
              <div className="pt-4 border-t border-gray-200 text-center text-xs text-gray-600">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); setSuccessMsg(null); }}
                  className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
                >
                  Sign in.
                </button>
              </div>
            </form>
          )}
        </div>
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
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#F59E0B]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
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
              className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
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
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
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
                className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#F59E0B]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-[#F59E0B] to-[#FF8000] text-black py-3 rounded-xl text-xs font-bold shadow-lg shadow-[#F59E0B]/20 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer disabled:opacity-50"
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
              className="text-[#F59E0B] font-bold hover:underline cursor-pointer"
            >
              Return to Sign In
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
