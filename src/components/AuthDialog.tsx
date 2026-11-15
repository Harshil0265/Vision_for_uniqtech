import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User as UserIcon,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CONFIGURED_AUTH_MODE } from '../lib/authClient';
import { VisionLogo } from './VisionLogo';

export type AuthMode = 'signin' | 'signup' | 'forgot' | 'reset';

interface AuthDialogProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
  /** Optional info banner shown above the form (for example "your session ended"). */
  notice?: string;
  /** Token from a password-reset email link (mode 'reset'). */
  resetToken?: string | null;
}

// Mirrors the rules in docs/API_CONTRACT.md so people get instant feedback. The server stays the authority.
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const emailProblem = (value: string): string | null => (EMAIL_RE.test(value.trim()) ? null : 'Enter a valid email address.');

const passwordProblem = (pw: string): string | null => {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (new TextEncoder().encode(pw).length > 72) return 'Use at most 72 bytes.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return null;
};

const strength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  return { score, label: labels[score], color: colors[score] };
};

// Demo account that ships with the mock API (and the offline demo mode). Offered in development builds only.
const DEMO_ACCOUNT = { email: 'test@test.com', password: 'test' };

const TITLES: Record<AuthMode, { heading: string; sub: string }> = {
  signin: { heading: 'Welcome back', sub: 'Sign in to continue to Vision.' },
  signup: { heading: 'Create your account', sub: 'Set up your Vision account. It takes under a minute.' },
  forgot: { heading: 'Reset your password', sub: 'Enter the email you signed up with and we will send you a reset link.' },
  reset: { heading: 'Choose a new password', sub: 'Enter a new password for your Vision account.' }
};

export const AuthDialog: React.FC<AuthDialogProps> = ({ mode, onModeChange, onClose, notice, resetToken }) => {
  const { signIn, signUp, requestPasswordReset, resetPassword } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [resetResult, setResetResult] = useState<{ tone: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const clearError = (field: string) => setFieldErrors(({ [field]: _removed, ...rest }) => rest);

  const isSignUp = mode === 'signup';
  const isForgot = mode === 'forgot';
  const isReset = mode === 'reset';
  const needsNewPassword = isSignUp || isReset;

  useEffect(() => {
    setError(null);
    setFieldErrors({});
    setResetResult(null);
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const errors: Record<string, string> = {};
    const emailErr = isReset ? null : emailProblem(email);
    if (emailErr) errors.email = emailErr;
    if (isReset) {
      const problem = passwordProblem(password);
      if (problem) errors.password = problem;
      if (confirm !== password) errors.confirm = 'The passwords do not match.';
    } else if (isSignUp) {
      if (!name.trim()) errors.name = 'Enter your full name.';
      else if (name.trim().length > 80) errors.name = 'Use 80 characters or fewer.';
      const problem = passwordProblem(password);
      if (problem) errors.password = problem;
      if (confirm !== password) errors.confirm = 'The passwords do not match.';
    } else if (!isForgot && !password) {
      errors.password = 'Enter your password.';
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError(null);
      return;
    }

    setSubmitting(true);
    setError(null);

    if (isReset) {
      const result = await resetPassword(resetToken ?? '', password);
      setSubmitting(false);
      setResetResult({ tone: result.status === 'ok' ? 'success' : result.status === 'unavailable' ? 'info' : 'error', text: result.message ?? '' });
      if (result.status === 'ok') { setPassword(''); setConfirm(''); }
      return;
    }

    if (isForgot) {
      const result = await requestPasswordReset(email);
      setSubmitting(false);
      setResetResult({ tone: result.status === 'ok' ? 'success' : result.status === 'unavailable' ? 'info' : 'error', text: result.message ?? '' });
      return;
    }

    const result = isSignUp
      ? await signUp({ name: name.trim(), email: email.trim(), password, role: jobTitle.trim() || undefined, department: department.trim() || undefined })
      : await signIn(email.trim(), password);
    setSubmitting(false);

    // On 'authenticated' the auth state flips and this dialog unmounts with the signed-out page.
    if (result.status === 'error') setError(result.error);
  };

  const inputClass = (invalid?: boolean) =>
    `w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border focus:outline-none focus:ring-2 bg-white ${
      invalid ? 'border-rose-400 focus:ring-rose-500/30 focus:border-rose-500' : 'border-slate-300 focus:ring-blue-500/40 focus:border-blue-500'
    }`;
  const pw = strength(password);
  const fieldError = (key: string) => fieldErrors[key] && <span className="text-[11px] text-rose-600 mt-1 block">{fieldErrors[key]}</span>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={TITLES[mode].heading}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto"
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-6 pt-6">
          <VisionLogo size="md" showSubtitle={false} />
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="px-6 pb-6 pt-4 space-y-4" noValidate>
          <div>
            {(isForgot || isReset) && (
              <button type="button" onClick={() => onModeChange('signin')} className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 mb-2 cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to sign in
              </button>
            )}
            <h2 className="text-xl font-bold text-slate-900">{TITLES[mode].heading}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{TITLES[mode].sub}</p>
          </div>

          {notice && !isForgot && !isReset && <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-sm">{notice}</div>}
          {error && (
            <div role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {resetResult && (
            <div role="status" className={`flex items-start gap-2 p-3 rounded-lg border text-sm ${
              resetResult.tone === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : resetResult.tone === 'info' ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {resetResult.tone === 'success' ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : resetResult.tone === 'info' ? <Info className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
              <span>{resetResult.text}</span>
            </div>
          )}

          {isSignUp && (
            <label className="block">
              <span className="text-xs font-medium text-slate-700">Full name <span className="text-rose-500">*</span></span>
              <div className="relative mt-1">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input className={inputClass(!!fieldErrors.name)} aria-invalid={!!fieldErrors.name} value={name} onChange={e => { setName(e.target.value); clearError('name'); }}
                  autoComplete="name" maxLength={80} autoFocus placeholder="e.g. Priya Patel" />
              </div>
              {fieldError('name')}
            </label>
          )}

          {!isReset && (
          <label className="block">
            <span className="text-xs font-medium text-slate-700">Email address {isSignUp && <span className="text-rose-500">*</span>}</span>
            <div className="relative mt-1">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                className={inputClass(!!fieldErrors.email)}
                aria-invalid={!!fieldErrors.email}
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError('email'); }}
                autoComplete="email"
                maxLength={254}
                autoFocus={!isSignUp}
              />
            </div>
            {fieldError('email')}
          </label>
          )}

          {!isForgot && (
            <div>
              <label className="block">
                <span className="flex items-center justify-between text-xs font-medium text-slate-700">
                  <span>{isReset ? 'New password' : 'Password'} {needsNewPassword && <span className="text-rose-500">*</span>}</span>
                  {mode === 'signin' && (
                    <button type="button" onClick={() => onModeChange('forgot')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                      Forgot password?
                    </button>
                  )}
                </span>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    className={`${inputClass(!!fieldErrors.password)} pr-10`}
                    aria-invalid={!!fieldErrors.password}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); clearError('password'); }}
                    autoComplete={needsNewPassword ? 'new-password' : 'current-password'}
                    maxLength={72}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </label>
              {fieldError('password')}
              {needsNewPassword && password && (
                <div className="mt-2" aria-live="polite">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < pw.score ? pw.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">{pw.label}</span>
                </div>
              )}
              {needsNewPassword && !fieldErrors.password && <span className="text-[11px] text-slate-500 mt-1 block">At least 8 characters, with a letter and a number.</span>}
            </div>
          )}

          {needsNewPassword && (
            <>
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Confirm {isReset ? 'new ' : ''}password <span className="text-rose-500">*</span></span>
                <div className="relative mt-1">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input className={inputClass(!!fieldErrors.confirm)} aria-invalid={!!fieldErrors.confirm} type={showPassword ? 'text' : 'password'}
                    value={confirm} onChange={e => { setConfirm(e.target.value); clearError('confirm'); }} autoComplete="new-password" maxLength={72} />
                </div>
                {fieldError('confirm')}
              </label>

              {isSignUp && <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Job title</span>
                  <div className="relative mt-1">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={inputClass()} value={jobTitle} onChange={e => setJobTitle(e.target.value)} maxLength={60} placeholder="Optional" />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-slate-700">Department</span>
                  <div className="relative mt-1">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input className={inputClass()} value={department} onChange={e => setDepartment(e.target.value)} maxLength={60} placeholder="Optional" />
                  </div>
                </label>
              </div>}
            </>
          )}

          {import.meta.env.DEV && mode === 'signin' && (
            <button
              type="button"
              onClick={() => { setEmail(DEMO_ACCOUNT.email); setPassword(DEMO_ACCOUNT.password); setError(null); setFieldErrors({}); }}
              className="w-full text-left text-[11px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer"
            >
              Development only: fill in the demo account <span className="font-mono">{DEMO_ACCOUNT.email}</span>
            </button>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isReset ? 'Set new password' : isForgot ? 'Send reset link' : isSignUp ? 'Create account' : 'Sign in'}
          </button>

          {(mode === 'signin' || mode === 'signup') && (
            <p className="text-center text-sm text-slate-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => onModeChange(isSignUp ? 'signin' : 'signup')}
                className="text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
              >
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            {CONFIGURED_AUTH_MODE === 'local' ? 'Offline demo mode (no server)' : 'Secure sign-in'}
          </div>
        </form>
      </div>
    </div>
  );
};
