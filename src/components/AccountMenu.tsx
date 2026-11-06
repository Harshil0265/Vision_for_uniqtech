import React, { useEffect, useRef, useState } from 'react';
import { KeyRound, Laptop, Loader2, LogOut, MonitorSmartphone, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { changePassword, listSessions, revokeSession, type SessionInfo } from '../lib/authClient';

/** Turns a user-agent string into something readable, e.g. "Chrome on Windows". */
const describeDevice = (ua: string): string => {
  if (!ua) return 'Unknown device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  return `${browser} on ${os}`;
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onMouseDown={onClose}>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 max-h-[85vh] flex flex-col"
      onMouseDown={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5 overflow-y-auto">{children}</div>
    </div>
  </div>
);

const SessionsDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => setSessions(await listSessions());
  useEffect(() => { load(); }, []);

  const revoke = async (s: SessionInfo) => {
    setBusyId(s.id);
    const ok = await revokeSession(s.id);
    setBusyId(null);
    if (ok && s.current) await signOut();
    else if (ok) await load();
  };

  return (
    <Modal title="Active sessions" onClose={onClose}>
      <p className="text-xs text-slate-500 mb-3">Devices currently signed in to your account. Revoke any you don't recognise.</p>
      {!sessions ? (
        <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
      ) : (
        <ul className="space-y-2">
          {sessions.map(s => (
            <li key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3 min-w-0">
                <Laptop className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">
                    {describeDevice(s.userAgent)}
                    {s.current && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">This device</span>}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.ip || 'unknown IP'} · last active {new Date(s.lastUsedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => revoke(s)}
                disabled={busyId === s.id}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {busyId === s.id ? 'Working...' : s.current ? 'Sign out' : 'Revoke'}
              </button>
            </li>
          ))}
          {sessions.length === 0 && <li className="text-sm text-slate-500">No active sessions.</li>}
        </ul>
      )}
    </Modal>
  );
};

const ChangePasswordDialog: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [state, setState] = useState<{ busy: boolean; error?: string; done?: boolean }>({ busy: false });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState({ busy: true });
    const res = await changePassword(current, next);
    setState({ busy: false, error: res.error, done: res.success });
  };

  const input = 'w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500';

  return (
    <Modal title="Change password" onClose={onClose}>
      {state.done ? (
        <div className="space-y-3">
          <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            Password updated. Your other devices have been signed out.
          </p>
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold cursor-pointer">Done</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {state.error && <div role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{state.error}</div>}
          <label className="block text-xs font-medium text-slate-700">Current password
            <input className={`${input} mt-1`} type="password" value={current} onChange={e => setCurrent(e.target.value)} autoComplete="current-password" maxLength={72} autoFocus />
          </label>
          <label className="block text-xs font-medium text-slate-700">New password
            <input className={`${input} mt-1`} type="password" value={next} onChange={e => setNext(e.target.value)} autoComplete="new-password" maxLength={72} />
            <span className="text-[11px] text-slate-500 font-normal">At least 10 characters, with a letter and a number.</span>
          </label>
          <button
            type="submit"
            disabled={state.busy || !current || !next}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            {state.busy && <Loader2 className="w-4 h-4 animate-spin" />} Update password
          </button>
        </form>
      )}
    </Modal>
  );
};

export const AccountMenu: React.FC = () => {
  const { user, signOut, signOutEverywhere } = useAuth();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<'sessions' | 'password' | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  if (!user) return null;

  const item = 'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left cursor-pointer';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 cursor-pointer"
      >
        <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 object-cover" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-3 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
          </div>
          <button role="menuitem" className={item} onClick={() => { setOpen(false); setDialog('sessions'); }}>
            <MonitorSmartphone className="w-4 h-4 text-slate-400" /> Active sessions
          </button>
          <button role="menuitem" className={item} onClick={() => { setOpen(false); setDialog('password'); }}>
            <KeyRound className="w-4 h-4 text-slate-400" /> Change password
          </button>
          <div className="border-t border-slate-100" />
          <button role="menuitem" className={item} onClick={() => { setOpen(false); signOut(); }}>
            <LogOut className="w-4 h-4 text-slate-400" /> Sign out
          </button>
          <button role="menuitem" className={`${item} text-red-600`} onClick={() => { setOpen(false); signOutEverywhere(); }}>
            <ShieldCheck className="w-4 h-4" /> Sign out of all devices
          </button>
        </div>
      )}

      {dialog === 'sessions' && <SessionsDialog onClose={() => setDialog(null)} />}
      {dialog === 'password' && <ChangePasswordDialog onClose={() => setDialog(null)} />}
    </div>
  );
};
