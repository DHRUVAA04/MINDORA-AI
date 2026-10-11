import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { Brain, Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, sessionExpiredNotice, clearSessionNotice } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (val: string) => {
    if (!val.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (val: string) => {
    if (!val) return 'Password is required';
    return undefined;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (field === 'email') setErrors((prev) => ({ ...prev, email: validateEmail(email) }));
    if (field === 'password') setErrors((prev) => ({ ...prev, password: validatePassword(password) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const emailErr = validateEmail(email);
    const passErr = validatePassword(password);
    setErrors({ email: emailErr, password: passErr });
    setTouched({ email: true, password: true });

    if (emailErr || passErr) return;

    setIsSubmitting(true);
    setServerError(null);

    const result = await login(email.trim(), password, rememberMe);
    setIsSubmitting(false);

    if (result.success) {
      clearSessionNotice();
      // Redirect back to intended destination if navigated from a protected route
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } else {
      setServerError(result.error || 'Email or password is incorrect');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F3FF] dark:bg-[#0B0A1A]">
      {/* Left Column: Signature Gradient Hero (collapses on mobile) */}
      <div className="md:w-1/2 p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-brand-midnight via-[#4C1D95] to-brand-violet text-white flex flex-col justify-between relative overflow-hidden">
        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-violet-glow">
            <Brain className="w-7 h-7 text-brand-cyan" />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-brand-cyan via-white to-brand-mint bg-clip-text text-transparent">
              MINDORA AI
            </span>
            <span className="block text-[11px] uppercase tracking-widest text-brand-cyan/80 font-bold">
              Aurora Study Nebula
            </span>
          </div>
        </div>

        {/* Hero Tagline Text */}
        <div className="relative z-10 my-8 sm:my-16 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-cyan text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Smart Exam & Concept Mastery</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            Welcome Back to Deep Concentration.
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-gray-200 leading-relaxed">
            Resume your personalized roadmap, study timer sessions, and diagnostic progress tracking.
          </p>
        </div>

        {/* Hero Footer */}
        <div className="relative z-10 text-xs text-white/60">
          <p>Protected by Argon2id cryptographic hashing & rotating session tokens.</p>
        </div>

        {/* Ambient background glows */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-brand-orchid/30 blur-3xl pointer-events-none" />
        <div className="absolute left-10 -top-20 w-64 h-64 rounded-full bg-brand-cyan/20 blur-2xl pointer-events-none" />
      </div>

      {/* Right Column: Clean White Card Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md bg-white dark:bg-[#151231] rounded-3xl p-6 sm:p-10 border border-brand-violet/15 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-brand-midnight dark:text-white tracking-tight">
              Sign In to Your Account
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate/60 dark:text-gray-400 mt-1">
              Enter your student credentials to access your study portal.
            </p>
          </div>

          {/* Session Expiry Notice Banner */}
          {sessionExpiredNotice && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-brand-amber/10 border border-brand-amber/30 text-brand-amber text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{sessionExpiredNotice}</span>
            </div>
          )}

          {/* Server Error Alert Banner */}
          {serverError && (
            <div
              role="alert"
              className="mb-4 p-3.5 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) setErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="name@college.edu"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                    touched.email && errors.email ? 'border-brand-coral' : 'border-brand-violet/20'
                  }`}
                  aria-invalid={Boolean(touched.email && errors.email)}
                  aria-describedby={touched.email && errors.email ? 'email-error' : undefined}
                />
              </div>
              {touched.email && errors.email && (
                <p id="email-error" className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-violet dark:text-brand-cyan hover:underline font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) setErrors((prev) => ({ ...prev, password: validatePassword(e.target.value) }));
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 transition-all focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                    touched.password && errors.password ? 'border-brand-coral' : 'border-brand-violet/20'
                  }`}
                  aria-invalid={Boolean(touched.password && errors.password)}
                  aria-describedby={touched.password && errors.password ? 'password-error' : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-brand-slate/50 hover:text-brand-slate dark:text-gray-400 dark:hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.password && errors.password && (
                <p id="password-error" className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-brand-violet border-brand-violet/30 focus:ring-brand-cyan accent-brand-violet"
              />
              <label htmlFor="remember-me" className="text-xs text-brand-slate/70 dark:text-gray-300 font-medium cursor-pointer">
                Remember me for 7 days
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                className="w-full"
              >
                Sign In
              </Button>
            </div>
          </form>

          {/* Quick Demo Credentials Box */}
          <div className="mt-4 p-3 rounded-xl bg-brand-violet/5 dark:bg-brand-violet/10 border border-brand-violet/15 text-xs flex items-center justify-between">
            <div>
              <span className="font-bold text-brand-midnight dark:text-white block">Pre-configured Demo Account</span>
              <span className="text-[11px] text-brand-slate/70 dark:text-gray-300 font-mono">demo@mindora.ai • Mindora2026!</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail('demo@mindora.ai');
                setPassword('Mindora2026!');
                setErrors({});
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-violet/10 hover:bg-brand-violet/20 text-brand-violet dark:text-brand-cyan transition-colors"
            >
              Auto-fill
            </button>
          </div>

          {/* Switch to Register */}
          <div className="mt-6 pt-6 border-t border-brand-violet/10 dark:border-brand-violet/20 text-center text-xs text-brand-slate/60 dark:text-gray-400">
            <span>Don't have an account yet? </span>
            <Link to="/register" className="font-bold text-brand-violet dark:text-brand-cyan hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
