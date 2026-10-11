import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PasswordStrengthMeter } from '../components/common/PasswordStrengthMeter';
import { apiClient } from '../api/client';
import { Brain, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenParam);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('A recovery token is required');
      return;
    }
    if (password.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token.trim(),
          new_password: password,
          confirm_password: confirmPassword,
        }),
      });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Reset link is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F5F3FF] dark:bg-[#0B0A1A]">
      <div className="w-full max-w-md bg-white dark:bg-[#151231] rounded-3xl p-6 sm:p-10 border border-brand-violet/15 shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-brand-midnight via-brand-violet to-brand-orchid flex items-center justify-center shadow-violet-glow mb-3">
            <Brain className="w-7 h-7 text-brand-cyan" />
          </div>
          <h2 className="text-2xl font-black text-brand-midnight dark:text-white tracking-tight">
            Create New Password
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate/60 dark:text-gray-400 mt-1">
            Choose a secure passphrase with at least 10 characters.
          </p>
        </div>

        {isSuccess ? (
          <div role="alert" className="space-y-4 text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-mint/15 text-brand-mint flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-brand-midnight dark:text-white">
              Password Successfully Updated
            </h3>
            <p className="text-xs text-brand-slate/70 dark:text-gray-300">
              Your password has been changed. All active sessions have been secured. You can now sign in.
            </p>
            <div className="pt-2">
              <Button variant="primary" size="md" className="w-full" onClick={() => navigate('/login')}>
                Go to Sign In
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {error && (
              <div role="alert" className="p-3.5 rounded-xl bg-brand-coral/10 border border-brand-coral/30 text-brand-coral text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Token field (prefilled if present in URL) */}
            {!tokenParam && (
              <div>
                <label htmlFor="reset-token" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                  Recovery Token
                </label>
                <input
                  id="reset-token"
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste reset token here"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
              </div>
            )}

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 10 mixed characters"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
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
              <PasswordStrengthMeter password={password} />
            </div>

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm-new-password" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
                <input
                  id="confirm-new-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-3 text-brand-slate/50 hover:text-brand-slate dark:text-gray-400 dark:hover:text-white"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              disabled={isLoading}
              className="w-full"
            >
              Update Password
            </Button>

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs font-semibold text-brand-violet dark:text-brand-cyan hover:underline">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

