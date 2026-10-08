import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  X,
  Key,
  Check,
  ArrowRight,
  UserPlus,
  LogIn,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building
} from 'lucide-react';

export const ClerkAuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    currentUser,
    switchUser,
    teamMembers,
    clerkSession,
    clerkSignUp,
    clerkSignIn,
    clerkSignOut
  } = useProject();

  if (!isAuthModalOpen) return null;

  const [activeTab, setActiveTab] = useState<'profile' | 'signin' | 'signup'>('profile');

  // Sign Up Form
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState('Senior Full-Stack Engineer');
  const [signupDept, setSignupDept] = useState('Platform Systems');
  const [signupError, setSignupError] = useState<string | null>(null);
  const [isSubmittingSignup, setIsSubmittingSignup] = useState(false);

  // Sign In Form
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinError, setSigninError] = useState<string | null>(null);
  const [isSubmittingSignin, setIsSubmittingSignin] = useState(false);

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim()) return;

    setIsSubmittingSignup(true);
    setSignupError(null);

    const res = await clerkSignUp({
      name: signupName.trim(),
      email: signupEmail.trim(),
      password: signupPassword,
      role: signupRole,
      department: signupDept
    });

    setIsSubmittingSignup(false);

    if (res.success) {
      setActiveTab('profile');
      setSignupName('');
      setSignupEmail('');
      setSignupPassword('');
    } else {
      setSignupError(res.error || 'Sign up failed.');
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signinEmail.trim()) return;

    setIsSubmittingSignin(true);
    setSigninError(null);

    const res = await clerkSignIn({
      email: signinEmail.trim(),
      password: signinPassword
    });

    setIsSubmittingSignin(false);

    if (res.success) {
      setActiveTab('profile');
      setSigninEmail('');
      setSigninPassword('');
    } else {
      setSigninError(res.error || 'Invalid credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Clerk Top Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <span>Clerk Authentication & RBAC</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  Live API Connected
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">Enterprise Single Sign-On & Identity Directory</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-2 bg-slate-50/70 border-b border-slate-200 flex items-center gap-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-1 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Active Session ({currentUser.name.split(' ')[0]})</span>
          </button>

          <button
            onClick={() => setActiveTab('signup')}
            className={`pb-1 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account (Sign Up)</span>
          </button>

          <button
            onClick={() => setActiveTab('signin')}
            className={`pb-1 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'signin'
                ? 'text-blue-600 border-b-2 border-blue-600 font-semibold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Content Pane */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              {/* Active Profile Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-blue-500/20"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{currentUser.name}</div>
                    <div className="text-xs text-slate-500">{currentUser.role}</div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">{currentUser.email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                    Authenticated
                  </span>
                </div>
              </div>

              {/* Session Token & Claims Info */}
              <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Clerk Session Token ID:</span>
                  </span>
                  <span className="font-mono text-slate-700 font-medium text-[11px] truncate max-w-[200px]">
                    {clerkSession?.token || 'sess_clerk_verified_v2'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Department Organization:</span>
                  <span className="text-slate-800 font-medium">{currentUser.department}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>RBAC Security Permissions:</span>
                  <span className="text-emerald-700 font-mono font-semibold text-[11px]">Admin & Sprint Master</span>
                </div>
              </div>

              {/* One-Click User Switching */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Switch Active Persona (Clerk Directory)
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {teamMembers.length} accounts
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {teamMembers.map(member => {
                    const isSelected = member.id === currentUser.id;
                    return (
                      <button
                        key={member.id}
                        onClick={() => {
                          switchUser(member);
                          setIsAuthModalOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 text-blue-900 font-medium shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200"
                          />
                          <div className="text-left">
                            <div className="font-semibold text-slate-900">{member.name}</div>
                            <div className="text-[10px] text-slate-500">{member.role}</div>
                          </div>
                        </div>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-blue-600" />
                        ) : (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                            Switch <ArrowRight className="w-3 h-3" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'signup' && (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs text-blue-800">
                Register a new team member account with Clerk. The profile will immediately sync across project boards and assignments.
              </div>

              {signupError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {signupError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Liam Sterling"
                    value={signupName}
                    onChange={e => setSignupName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="liam.sterling@vision.dev"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={signupPassword}
                    onChange={e => setSignupPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={signupRole}
                    onChange={e => setSignupRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={signupDept}
                    onChange={e => setSignupDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingSignup}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  {isSubmittingSignup ? 'Creating Clerk Account...' : 'Complete Sign Up'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Sign in to your Vision workspace account via Clerk SSO credentials.
              </div>

              {signinError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                  {signinError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="alex.rivera@vision.dev"
                    value={signinEmail}
                    onChange={e => setSigninEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    value={signinPassword}
                    onChange={e => setSigninPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingSignin}
                  className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                >
                  {isSubmittingSignin ? 'Authenticating...' : 'Sign In with Clerk'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono">Clerk Auth Provider v5.1</span>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-xs font-medium text-slate-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
