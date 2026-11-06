import React, { useEffect, useState } from 'react';
import { X, Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VisionLogo } from './VisionLogo';

export type AuthMode = 'signin' | 'signup';

interface AuthDialogProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onClose: () => void;
}

// Mirrors the server rules (backend/auth/emailPolicy.ts) so users get instant feedback.
// The server is still the authority.
const emailProblem = (value: string): string | null => {
  const email = value.trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at < 1) return 'Enter a valid email address.';
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return 'Only official Gmail addresses (@gmail.com) can be used.';
  if (!/^[a-z0-9](?!.*\.\.)[a-z0-9.]{4,28}[a-z0-9]$/.test(local)) return 'That does not look like a valid Gmail address.';
  return null;
};

const passwordProblem = (pw: string): string | null => {
  if (pw.length < 10) return 'Use at least 10 characters.';
  if (new TextEncoder().encode(pw).length > 72) return 'Use at most 72 bytes.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return null;
};

const strength = (pw: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (pw.length >= 10) score++;
  if (pw.length >= 14) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ['Too weak', 'Weak', 'Okay', 'Strong', 'Very strong'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-600'];
  return { score, label: labels[score], color: colors[score] };
};

export const AuthDialog: React.FC<AuthDialogProps> = ({ mode, onModeChange, onClose }) => {
  const { signIn, signUp } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignUp = mode === 'signup';

  useEffect(() => { setError(null); }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const emailErr = emailProblem(email);
    if (emailErr) return setError(emailErr);
    if (isSignUp) {
      if (!name.trim()) return setError('Enter your name.');
      const problem = passwordProblem(password);
      if (problem) return setError(problem);
    }

    setSubmitting(true);
    setError(null);
    const result = isSignUp
      ? await signUp({ name: name.trim(), email: email.trim(), password })
      : await signIn(email.trim(), password);
    setSubmitting(false);

    // On 'authenticated' the auth state flips and this dialog unmounts with the signed-out page.
    if (result.status === 'error') setError(result.error);
  };

  const inputClass =
    'w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 bg-white';
  const pw = strength(password);

  const errorBox = error && (
    <div role="alert" className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={isSignUp ? 'Create your account' : 'Sign in'}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
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
              <h2 className="text-xl font-bold text-slate-900">{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                {isSignUp ? 'Use your Gmail address and choose a password.' : 'Sign in to continue to Vision.'}
              </p>
            </div>

            {errorBox}

            {isSignUp && (
              <label className="block">
                <span className="text-xs font-medium text-slate-700">Full name</span>
                <div className="relative mt-1">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input className={inputClass} value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={80} autoFocus />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Gmail address</span>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className={inputClass}
                  type="email"
                  placeholder="you@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  maxLength={254}
                  autoFocus={!isSignUp}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-700">Password</span>
              <div className="relative mt-1">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className={`${inputClass} pr-10`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
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
              {isSignUp && password && (
                <div className="mt-2" aria-live="polite">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < pw.score ? pw.color : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">{pw.label}</span>
                </div>
              )}
              {isSignUp && <span className="text-[11px] text-slate-500 mt-1 block">At least 10 characters, with a letter and a number.</span>}
            </label>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSignUp ? 'Create account' : 'Sign in'}
            </button>

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

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Encrypted session
            </div>
          </form>
      </div>
    </div>
  );
};
