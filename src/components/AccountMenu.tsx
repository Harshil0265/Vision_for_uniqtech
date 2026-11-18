import React, { useEffect, useRef, useState } from 'react';
import { LogOut, UserCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProject } from '../context/ProjectContext';

const initialsOf = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]!.toUpperCase()).join('') || 'U';

/** Avatar button in the top bar with the signed-in account and a sign-out action. */
export const AccountMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const { setActiveTab } = useProject();
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  // A new account (or a changed avatar URL) gets a fresh chance to load its image.
  useEffect(() => { setImageFailed(false); }, [user?.avatar]);

  if (!user) return null;

  const avatar = user.avatar && !imageFailed ? (
    <img
      src={user.avatar}
      alt=""
      onError={() => setImageFailed(true)}
      className="w-8 h-8 rounded-full border border-slate-200 object-cover"
    />
  ) : (
    <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
      {initialsOf(user.name)}
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
        className="flex items-center rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500/40 hover:ring-2 hover:ring-blue-400 transition-all cursor-pointer"
      >
        {avatar}
      </button>

      {open && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-3 border-b border-slate-100">
            <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
            <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
            {(user.role || user.department) && (
              <div className="text-[11px] text-slate-400 truncate mt-0.5">{[user.role, user.department].filter(Boolean).join(' · ')}</div>
            )}
          </div>
          <button
            role="menuitem"
            onClick={() => { setOpen(false); setActiveTab('profile'); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
          >
            <UserCircle2 className="w-4 h-4 text-slate-400" /> Profile & settings
          </button>
          <div className="border-t border-slate-100" />
          <button
            role="menuitem"
            onClick={() => { setOpen(false); void signOut(); }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-400" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};
