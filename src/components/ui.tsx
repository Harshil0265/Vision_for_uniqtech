/**
 * Small shared UI building blocks so every page and form looks and behaves the same.
 * Styling follows the existing app: Tailwind, slate neutrals, blue/indigo accents, text-xs controls.
 */

import React, { useEffect, useId, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import type { ProjectRole } from '../types';
import { initialsOf } from '../lib/avatar';

// ---------------------------------------------------------------------------
// Form controls
// ---------------------------------------------------------------------------

export const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500/30 disabled:opacity-60 disabled:cursor-not-allowed';

export const inputErrorClass = 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30';

interface FieldProps {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string | null;
  children: (props: { id: string; describedBy?: string; invalid: boolean }) => React.ReactNode;
  className?: string;
}

/** Label + control + hint/error, with the ids wired up for screen readers. */
export const Field: React.FC<FieldProps> = ({ label, required, hint, error, children, className }) => {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-xs font-semibold text-slate-700 mb-1">
        {label} {required && <span className="text-rose-500" aria-hidden>*</span>}
      </label>
      {children({ id, describedBy: error || hint ? messageId : undefined, invalid: !!error })}
      {error ? (
        <p id={messageId} className="text-[11px] text-rose-600 mt-1">{error}</p>
      ) : hint ? (
        <p id={messageId} className="text-[11px] text-slate-500 mt-1">{hint}</p>
      ) : null}
    </div>
  );
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: React.ReactNode };

export const PrimaryButton: React.FC<ButtonProps> = ({ icon, children, className = '', ...rest }) => (
  <button
    {...rest}
    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {icon}
    {children}
  </button>
);

export const SecondaryButton: React.FC<ButtonProps> = ({ icon, children, className = '', ...rest }) => (
  <button
    {...rest}
    className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {icon}
    {children}
  </button>
);

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

export const Alert: React.FC<{ tone: 'error' | 'success' | 'info'; children: React.ReactNode }> = ({ tone, children }) => {
  const styles = {
    error: 'bg-rose-50 border-rose-200 text-rose-700',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  }[tone];
  const Icon = tone === 'error' ? AlertCircle : tone === 'success' ? CheckCircle2 : Info;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 p-3 rounded-lg border text-xs ${styles}`}>
      <Icon className="w-4 h-4 mt-px shrink-0" />
      <div className="flex-1">{children}</div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface ModalProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ title, subtitle, icon, onClose, children, footer, size = 'lg' }) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  // Callers usually pass an inline function; keep the latest one without re-running the mount effect.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current(); };
    window.addEventListener('keydown', onKey);
    // Focus the first form control (or the panel) once, so keyboard users land inside the dialog.
    const first = panelRef.current?.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea');
    (first ?? panelRef.current)?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const width = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-3xl' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs" onMouseDown={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`w-full ${width} bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] focus:outline-none`}
        onMouseDown={e => e.stopPropagation()}
      >
        <div className="px-5 sm:px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-8 h-8 shrink-0 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 id={titleId} className="text-sm font-semibold text-slate-900 truncate">{title}</h3>
              {subtitle && <p className="text-[11px] text-slate-500 truncate">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 bg-white flex items-center justify-end gap-2.5">{footer}</div>}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export const Avatar: React.FC<{ name: string; src?: string; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }> = ({ name, src, size = 'sm', className = '' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  const dims = { xs: 'w-5 h-5 text-[8px]', sm: 'w-7 h-7 text-[10px]', md: 'w-9 h-9 text-xs', lg: 'w-14 h-14 text-base' }[size];
  if (src && !failed) {
    return <img src={src} alt="" onError={() => setFailed(true)} className={`${dims} rounded-full object-cover ring-1 ring-slate-200 shrink-0 ${className}`} />;
  }
  return (
    <span className={`${dims} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center shrink-0 ${className}`} aria-hidden>
      {initialsOf(name)}
    </span>
  );
};

export const ROLE_LABELS: Record<ProjectRole, { label: string; description: string; className: string }> = {
  owner: { label: 'Owner', description: 'Full control, including deleting the project and managing owners.', className: 'bg-violet-50 text-violet-700 border-violet-200' },
  admin: { label: 'Admin', description: 'Manages members, settings, sprints and all work items.', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  member: { label: 'Member', description: 'Creates, edits and moves work items and comments.', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  viewer: { label: 'Viewer', description: 'Read-only access to the board, backlog and reports.', className: 'bg-slate-100 text-slate-600 border-slate-200' }
};

export const RoleBadge: React.FC<{ role: ProjectRole }> = ({ role }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-semibold ${ROLE_LABELS[role].className}`}>
    {ROLE_LABELS[role].label}
  </span>
);

export const PageHeader: React.FC<{ icon: React.ReactNode; title: string; description?: string; actions?: React.ReactNode }> = ({ icon, title, description, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-200">
    <div className="min-w-0">
      <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
        <span className="text-blue-600 shrink-0">{icon}</span>
        <span className="truncate">{title}</span>
      </h1>
      {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const EmptyState: React.FC<{ icon: React.ReactNode; title: string; body?: string; action?: React.ReactNode }> = ({ icon, title, body, action }) => (
  <div className="flex flex-col items-center justify-center text-center py-10 px-4 rounded-xl border border-dashed border-slate-200 bg-white">
    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">{icon}</div>
    <div className="text-sm font-semibold text-slate-800">{title}</div>
    {body && <p className="text-xs text-slate-500 mt-1 max-w-sm">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Card: React.FC<{ title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, action, children, className = '' }) => (
  <section className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        {title && <h2 className="text-xs font-semibold text-slate-900">{title}</h2>}
        {action}
      </div>
    )}
    <div className="p-4">{children}</div>
  </section>
);
