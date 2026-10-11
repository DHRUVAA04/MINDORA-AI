import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { apiClient } from '../api/client';
import { Brain, Mail, ArrowLeft, CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim() }),
      });
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Unable to process request');
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
            Reset Your Password
          </h2>
          <p className="text-xs sm:text-sm text-brand-slate/60 dark:text-gray-400 mt-1">
            Enter your registered email to receive a secure recovery link.
          </p>
        </div>

        {/* Prototype Email Notice Banner */}
        <div className="mb-4 p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 text-brand-midnight dark:text-gray-200 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-brand-cyan flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Prototype Notice:</strong> In development mode, the password reset link is securely logged to the server terminal console.
          </p>
        </div>

        {isSubmitted ? (
          <div role="alert" className="space-y-4 text-center py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-brand-mint/15 text-brand-mint flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-sm text-brand-midnight dark:text-white">
              Recovery Link Dispatched
            </h3>
            <p className="text-xs text-brand-slate/70 dark:text-gray-300 leading-relaxed">
              If an account with <strong>{email}</strong> exists, single-use reset instructions have been generated. The link will expire in 30 minutes.
            </p>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="secondary" size="md" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
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

            <div>
              <label htmlFor="forgot-email" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                Account Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
                <input
                  id="forgot-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="name@college.edu"
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
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
              Send Password Reset Link
            </Button>

            <div className="text-center pt-2">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-violet dark:text-brand-cyan hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

