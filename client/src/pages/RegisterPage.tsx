import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import { PasswordStrengthMeter } from '../components/common/PasswordStrengthMeter';
import { Brain, Mail, Lock, User, Eye, EyeOff, Sparkles, AlertCircle, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [educationalLevel, setEducationalLevel] = useState<'School' | 'College'>('College');
  const [ageRange, setAgeRange] = useState('18-22');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMinor = ageRange === 'Under 13';

  const validateField = (field: string, val: any) => {
    switch (field) {
      case 'name':
        if (!val || val.trim().length < 2) return 'Name must be at least 2 characters';
        return '';
      case 'email':
        if (!val.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid email address';
        return '';
      case 'password':
        if (!val) return 'Password is required';
        if (val.length < 10) return 'Password must be at least 10 characters';
        return '';
      case 'confirmPassword':
        if (!val) return 'Please confirm your password';
        if (val !== password) return 'Passwords do not match';
        return '';
      case 'guardianEmail':
        if (isMinor) {
          if (!val.trim()) return 'Guardian email is required for students under 13';
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) return 'Please enter a valid guardian email';
          if (val.trim().toLowerCase() === email.trim().toLowerCase()) return 'Guardian email must be different from student email';
        }
        return '';
      case 'consentGiven':
        if (!val) return 'You must agree to the Terms and Privacy Policy';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    let val: any = '';
    if (field === 'name') val = name;
    if (field === 'email') val = email;
    if (field === 'password') val = password;
    if (field === 'confirmPassword') val = confirmPassword;
    if (field === 'guardianEmail') val = guardianEmail;
    if (field === 'consentGiven') val = consentGiven;

    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const allErrors: Record<string, string> = {
      name: validateField('name', name),
      email: validateField('email', email),
      password: validateField('password', password),
      confirmPassword: validateField('confirmPassword', confirmPassword),
      guardianEmail: validateField('guardianEmail', guardianEmail),
      consentGiven: validateField('consentGiven', consentGiven),
    };

    setErrors(allErrors);
    setTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      guardianEmail: true,
      consentGiven: true,
    });

    const hasErrors = Object.values(allErrors).some(Boolean);
    if (hasErrors) return;

    setIsSubmitting(true);
    setServerError(null);

    const result = await register({
      name: name.trim(),
      email: email.trim(),
      password,
      confirm_password: confirmPassword,
      educational_level: educationalLevel,
      age_range: ageRange,
      guardian_email: isMinor ? guardianEmail.trim() : null,
      consent_given: consentGiven,
    });

    setIsSubmitting(false);

    if (result.success) {
      navigate('/', { replace: true });
    } else {
      setServerError(result.error || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F5F3FF] dark:bg-[#0B0A1A]">
      {/* Left Column: Gradient Hero */}
      <div className="md:w-5/12 p-8 sm:p-12 lg:p-16 bg-gradient-to-br from-brand-midnight via-[#4C1D95] to-brand-violet text-white flex flex-col justify-between relative overflow-hidden">
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

        <div className="relative z-10 my-8 sm:my-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-brand-mint text-xs font-semibold mb-4 backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Thousands of Ambitious Students</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-snug">
            Begin Your Personalized Learning Journey.
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-gray-200 leading-relaxed">
            Diagnose your knowledge gaps, build bulletproof study habits, and unlock high exam scores with zero guesswork.
          </p>
        </div>

        <div className="relative z-10 p-4 rounded-2xl bg-white/10 border border-white/20 text-xs text-white/80">
          <ShieldCheck className="w-5 h-5 text-brand-mint mb-1" />
          <p className="font-semibold text-white">Student Privacy First</p>
          <p className="text-[11px] text-gray-200 mt-0.5">
            We store only the minimum data required for your study plan and never sell student data.
          </p>
        </div>
      </div>

      {/* Right Column: Registration Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-lg bg-white dark:bg-[#151231] rounded-3xl p-6 sm:p-10 border border-brand-violet/15 shadow-xl">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-brand-midnight dark:text-white tracking-tight">
              Create Student Account
            </h2>
            <p className="text-xs sm:text-sm text-brand-slate/60 dark:text-gray-400 mt-1">
              Set up your profile to generate your customized curriculum.
            </p>
          </div>

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
            {/* Full Name */}
            <div>
              <label htmlFor="reg-name" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
                <input
                  id="reg-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (touched.name) setErrors((prev) => ({ ...prev, name: validateField('name', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('name')}
                  placeholder="Alex Chen"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                    touched.name && errors.name ? 'border-brand-coral' : 'border-brand-violet/20'
                  }`}
                  aria-invalid={Boolean(touched.name && errors.name)}
                />
              </div>
              {touched.name && errors.name && (
                <p className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.name}
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (touched.email) setErrors((prev) => ({ ...prev, email: validateField('email', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('email')}
                  placeholder="alex.chen@university.edu"
                  className={`w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                    touched.email && errors.email ? 'border-brand-coral' : 'border-brand-violet/20'
                  }`}
                  aria-invalid={Boolean(touched.email && errors.email)}
                />
              </div>
              {touched.email && errors.email && (
                <p className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Educational Level & Age Range Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                  Education Level
                </label>
                <select
                  value={educationalLevel}
                  onChange={(e) => setEducationalLevel(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                >
                  <option value="College">College / University</option>
                  <option value="School">Secondary / High School</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                  Age Range
                </label>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                >
                  <option value="18-22">18–22 years</option>
                  <option value="13-17">13–17 years</option>
                  <option value="23+">23+ years</option>
                  <option value="Under 13">Under 13 (Child policy)</option>
                </select>
              </div>
            </div>

            {/* Minor Guardian Email if Under 13 */}
            {isMinor && (
              <div className="p-3.5 rounded-xl bg-brand-cyan/10 border border-brand-cyan/30">
                <label htmlFor="reg-guardian" className="block text-xs font-bold uppercase tracking-wider text-brand-cyan mb-1">
                  Parent / Guardian Email (Required)
                </label>
                <input
                  id="reg-guardian"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  onBlur={() => handleBlur('guardianEmail')}
                  placeholder="parent@guardian.com"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-brand-violet/20 bg-white dark:bg-[#1C1742] text-brand-slate dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-cyan"
                />
                {touched.guardianEmail && errors.guardianEmail && (
                  <p className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.guardianEmail}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-brand-slate/70 dark:text-gray-300">
                  Notice: In compliance with child privacy standards, an account verification notice is sent to your guardian.
                </p>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                Password (minimum 10 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (touched.password) setErrors((prev) => ({ ...prev, password: validateField('password', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('password')}
                  placeholder="At least 10 mixed characters"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                    touched.password && errors.password ? 'border-brand-coral' : 'border-brand-violet/20'
                  }`}
                  aria-invalid={Boolean(touched.password && errors.password)}
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
              {touched.password && errors.password && (
                <p className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="reg-confirm-password" className="block text-xs font-bold uppercase tracking-wider text-brand-slate/80 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirm-password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (touched.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: validateField('confirmPassword', e.target.value) }));
                  }}
                  onBlur={() => handleBlur('confirmPassword')}
                  placeholder="Repeat your password"
                  className={`w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border bg-brand-violet/5 dark:bg-[#1C1742] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan ${
                    touched.confirmPassword && errors.confirmPassword ? 'border-brand-coral' : 'border-brand-violet/20'
                  }`}
                  aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
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
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Terms and Privacy Consent Checkbox */}
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-brand-slate/80 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => {
                    setConsentGiven(e.target.checked);
                    if (touched.consentGiven) setErrors((prev) => ({ ...prev, consentGiven: validateField('consentGiven', e.target.checked) }));
                  }}
                  onBlur={() => handleBlur('consentGiven')}
                  className="mt-0.5 w-4 h-4 rounded text-brand-violet border-brand-violet/30 focus:ring-brand-cyan accent-brand-violet"
                />
                <span className="leading-snug">
                  I agree to the <strong>Terms of Service</strong> and <strong>Privacy Policy</strong>. I understand that focus time tracking is self-timed and academic mastery is determined by quiz assessments.
                </span>
              </label>
              {touched.consentGiven && errors.consentGiven && (
                <p className="mt-1 text-xs text-brand-coral font-medium flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.consentGiven}
                </p>
              )}
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
                Create Free Account
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-brand-violet/10 dark:border-brand-violet/20 text-center text-xs text-brand-slate/60 dark:text-gray-400">
            <span>Already have an account? </span>
            <Link to="/login" className="font-bold text-brand-violet dark:text-brand-cyan hover:underline">
              Log in instead
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

