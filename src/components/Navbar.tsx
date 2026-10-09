import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { UserButton, useUser } from '@clerk/clerk-react';
import { VisionLogo } from './VisionLogo';
import { getUserRoleInProject, canEditIssue } from '../utils/permissions';
import {
  Plus,
  Search,
  Bell,
  Layers,
  ChevronDown,
  Activity,
  Check,
  FolderPlus,
  FolderKanban,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    projects,
    activeProject,
    setActiveProject,
    currentUser,
    unreadNotificationCount,
    notifications,
    markAllNotificationsRead,
    realtimeStatus,
    lastSyncTime,
    setIsCreateModalOpen,
    setIsCreateProjectModalOpen,
    setIsAuthModalOpen,
    searchQuery,
    setSearchQuery,
    setSelectedIssue,
    issues,
    setActiveTab
  } = useProject();

  const { isSignedIn } = useUser();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);

  // Check if user can create issues in active project
  const userRoleInActiveProject = getUserRoleInProject(activeProject, currentUser.id);
  const canCreateIssue = userRoleInActiveProject ? canEditIssue(userRoleInActiveProject) : false;

  const notifRef = useRef<HTMLDivElement>(null);
  const projectRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
      if (projectRef.current && !projectRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 flex items-center justify-between select-none z-30 sticky top-0 shadow-2xs">
      {/* Left: Brand & Interactive Project Selector */}
      <div className="flex items-center gap-4">
        {/* Brand */}
        <VisionLogo size="md" showSubtitle={true} />

        <div className="h-4 w-px bg-slate-200 hidden sm:block" />

        {/* Jira-style Project Dropdown Selector */}
        <div className="relative" ref={projectRef}>
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
          >
            <div
              className={`w-5 h-5 rounded-md bg-gradient-to-tr ${activeProject.iconGradient} flex items-center justify-center text-white text-[10px] font-mono font-bold shadow-2xs`}
            >
              {activeProject.key.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[190px]">
                  {activeProject.name}
                </span>
                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                  {activeProject.key}
                </span>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Project Switcher Popover */}
          {isProjectDropdownOpen && (
            <div className="absolute left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-800">Workspace Projects</span>
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setIsCreateProjectModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Project</span>
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
                {projects.map(p => {
                  const isCurrent = p.id === activeProject.id;
                  const count = issues.filter(i => i.projectId === p.id).length;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveProject(p);
                        setIsProjectDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                        isCurrent ? 'bg-blue-50/70 border border-blue-200/80 text-blue-900' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div
                          className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${p.iconGradient} flex items-center justify-center text-white font-mono font-bold text-[11px] shrink-0 shadow-2xs`}
                        >
                          {p.key}
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Key: {p.key} · {count} work items
                          </div>
                        </div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              <div className="p-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px]">
                <button
                  onClick={() => {
                    setIsProjectDropdownOpen(false);
                    setActiveTab('projects');
                  }}
                  className="text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>View all projects ({projects.length})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="relative ml-2 hidden md:block w-64 lg:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeProject.key} items in Vision...`}
            className="w-full bg-slate-100/80 border border-slate-200/90 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2.5">
        {/* Create Work Item Button with gradient */}
        <button
          onClick={() => canCreateIssue && setIsCreateModalOpen(true)}
          disabled={!canCreateIssue}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium shadow-xs transition-all duration-150 active:scale-95 ${
            canCreateIssue ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
          title={!canCreateIssue ? 'Viewers cannot create issues. Contact a project admin to request member access.' : 'Create new work item'}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Create</span>
        </button>

        {/* Add Project Shortcut Button */}
        <button
          onClick={() => setIsCreateProjectModalOpen(true)}
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs text-slate-700 transition-colors cursor-pointer"
          title="Create New Project in Workspace"
        >
          <FolderPlus className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-medium">New Project</span>
        </button>

        {/* Real-Time Supabase Sync Status Indicator */}
        <div
          title={`Supabase Realtime Channel: Synced at ${lastSyncTime.toLocaleTimeString()}`}
          className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-50/80 border border-emerald-200/80 text-[11px] text-emerald-800"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                realtimeStatus === 'connected' ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                realtimeStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="font-mono text-emerald-700 font-medium">
            {realtimeStatus === 'connected' ? 'Supabase Live' : 'Syncing...'}
          </span>
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(prev => !prev)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-800">Alerts & Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-semibold border border-blue-200">
                      {unreadNotificationCount} new
                    </span>
                  )}
                </div>
                {unreadNotificationCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (notif.issueKey) {
                          const target = issues.find(i => i.key === notif.issueKey);
                          if (target) setSelectedIssue(target);
                        }
                        setIsNotifOpen(false);
                      }}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        !notif.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-900">{notif.title}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">{notif.timestamp}</span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-1 line-clamp-2">{notif.message}</p>
                      {notif.issueKey && (
                        <div className="mt-1.5">
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-blue-700 border border-slate-200 font-medium">
                            {notif.issueKey}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Clerk Auth Profile & Switcher Button */}
        <div className="flex items-center gap-2">
          <UserButton afterSignOutUrl="/" showName={false} />
          {/* Only show persona switcher in development/demo mode when NOT signed in via Clerk */}
          {!isSignedIn && (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-all text-left cursor-pointer"
              title="Switch Team Persona (Demo)"
            >
              <span className="text-[10px] text-slate-600 font-mono font-medium">Switch Persona</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
