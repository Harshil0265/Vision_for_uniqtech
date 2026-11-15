import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, LogOut, ServerCrash, ShieldCheck, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';
import { getSessionExpiry } from '../lib/authClient';
import type { ActionOutcome } from '../lib/authClient';
import { Alert, Avatar, Card, Field, PageHeader, PrimaryButton, SecondaryButton, inputClass, inputErrorClass } from './ui';

const passwordProblem = (pw: string): string | null => {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (new TextEncoder().encode(pw).length > 72) return 'Use at most 72 bytes.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Include at least one letter and one number.';
  return null;
};

const toneOf = (o: ActionOutcome) => (o.status === 'ok' ? 'success' : o.status === 'unavailable' ? 'info' : 'error') as 'success' | 'info' | 'error';

/** The signed-in user's profile, password and session. */
export const ProfileView: React.FC = () => {
  const { user, mode, updateProfile, changePassword, signOut } = useAuth();
  const { currentUser } = useProject();

  // ---- profile form
  const [name, setName] = useState(user?.name ?? '');
  const [jobTitle, setJobTitle] = useState(user?.role ?? '');
  const [department, setDepartment] = useState(user?.department ?? '');
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileResult, setProfileResult] = useState<ActionOutcome | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const editProfile = (field: string) => { setProfileErrors(({ [field]: _removed, ...rest }) => rest); setProfileResult(null); };

  useEffect(() => {
    setName(user?.name ?? '');
    setJobTitle(user?.role ?? '');
    setDepartment(user?.department ?? '');
  }, [user?.id]);

  const profileDirty = !!user && (name.trim() !== user.name || jobTitle.trim() !== user.role || department.trim() !== user.department);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = 'Enter your name.';
    else if (name.trim().length > 80) errors.name = 'Use 80 characters or fewer.';
    if (jobTitle.trim().length > 60) errors.jobTitle = 'Use 60 characters or fewer.';
    if (department.trim().length > 60) errors.department = 'Use 60 characters or fewer.';
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingProfile(true);
    setProfileResult(await updateProfile({ name: name.trim(), role: jobTitle.trim(), department: department.trim() }));
    setSavingProfile(false);
  };

  // ---- password form
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [pwResult, setPwResult] = useState<ActionOutcome | null>(null);
  const [savingPw, setSavingPw] = useState(false);
  const editPw = (field: string) => { setPwErrors(({ [field]: _removed, ...rest }) => rest); setPwResult(null); };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!current) errors.current = 'Enter your current password.';
    const problem = passwordProblem(next);
    if (problem) errors.next = problem;
    else if (next === current) errors.next = 'Choose a password different from the current one.';
    if (confirm !== next) errors.confirm = 'The passwords do not match.';
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSavingPw(true);
    const result = await changePassword(current, next);
    setSavingPw(false);
    setPwResult(result);
    if (result.status === 'ok') { setCurrent(''); setNext(''); setConfirm(''); }
  };

  if (!user) return null;

  const expiry = getSessionExpiry();
  const pwType = show ? 'text' : 'password';

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader icon={<UserCircle2 className="w-5 h-5" />} title="Profile & settings" description="Manage your personal details, password and session." />

        {/* Profile */}
        <Card title="Profile">
          <form onSubmit={saveProfile} className="space-y-4" noValidate>
            <div className="flex items-center gap-4">
              <Avatar name={name || user.name} src={currentUser.avatar} size="lg" />
              <div>
                <div className="text-sm font-semibold text-slate-900">{user.name}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
            </div>

            {profileResult && <Alert tone={toneOf(profileResult)}>{profileResult.message}</Alert>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full name" required error={profileErrors.name}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                    value={name} onChange={e => { setName(e.target.value); editProfile('name'); }} maxLength={80} autoComplete="name" />
                )}
              </Field>
              <Field label="Email" hint="Your sign-in email. Contact an administrator to change it.">
                {({ id, describedBy }) => (
                  <input id={id} aria-describedby={describedBy} className={inputClass} value={user.email} disabled readOnly />
                )}
              </Field>
              <Field label="Job title" error={profileErrors.jobTitle}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                    value={jobTitle} onChange={e => { setJobTitle(e.target.value); editProfile('jobTitle'); }} maxLength={60} placeholder="e.g. Frontend Developer" />
                )}
              </Field>
              <Field label="Department" error={profileErrors.department}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                    value={department} onChange={e => { setDepartment(e.target.value); editProfile('department'); }} maxLength={60} placeholder="e.g. Engineering" />
                )}
              </Field>
            </div>
            <div className="flex justify-end">
              <PrimaryButton type="submit" disabled={!profileDirty || savingProfile}>{savingProfile ? 'Saving…' : 'Save changes'}</PrimaryButton>
            </div>
          </form>
        </Card>

        {/* Password */}
        <Card title="Change password">
          <form onSubmit={savePassword} className="space-y-4" noValidate>
            {pwResult && <Alert tone={toneOf(pwResult)}>{pwResult.message}</Alert>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Current password" required error={pwErrors.current}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} type={pwType} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                    value={current} onChange={e => { setCurrent(e.target.value); editPw('current'); }} autoComplete="current-password" maxLength={72} />
                )}
              </Field>
              <Field label="New password" required error={pwErrors.next} hint="At least 8 characters, with a letter and a number.">
                {({ id, describedBy, invalid }) => (
                  <input id={id} type={pwType} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                    value={next} onChange={e => { setNext(e.target.value); editPw('next'); }} autoComplete="new-password" maxLength={72} />
                )}
              </Field>
              <Field label="Confirm new password" required error={pwErrors.confirm}>
                {({ id, describedBy, invalid }) => (
                  <input id={id} type={pwType} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                    value={confirm} onChange={e => { setConfirm(e.target.value); editPw('confirm'); }} autoComplete="new-password" maxLength={72} />
                )}
              </Field>
            </div>
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => setShow(s => !s)} className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1.5 cursor-pointer">
                {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />} {show ? 'Hide passwords' : 'Show passwords'}
              </button>
              <PrimaryButton type="submit" icon={<KeyRound className="w-3.5 h-3.5" />} disabled={savingPw}>{savingPw ? 'Updating…' : 'Update password'}</PrimaryButton>
            </div>
          </form>
        </Card>

        {/* Session */}
        <Card title="Session">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              {mode === 'local' ? <ServerCrash className="w-5 h-5 text-amber-600 mt-0.5" /> : <ShieldCheck className="w-5 h-5 text-emerald-600 mt-0.5" />}
              <div>
                <div className="text-xs font-semibold text-slate-900">
                  {mode === 'local' ? 'Offline demo mode' : 'Signed in through the Vision API'}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">
                  {mode === 'local'
                    ? 'The backend could not be reached, so this demo account lives only in this browser. Start the API and sign in again to use real accounts.'
                    : 'Your session token is stored in this browser and sent with each request to the API.'}
                </p>
                {expiry > 0 && (
                  <p className="text-[11px] text-slate-400 mt-1">Session expires {new Date(expiry).toLocaleString()}</p>
                )}
              </div>
            </div>
            <SecondaryButton icon={<LogOut className="w-3.5 h-3.5" />} onClick={() => void signOut()}>Sign out</SecondaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
};
