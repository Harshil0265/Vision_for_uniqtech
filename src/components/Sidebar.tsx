import React from 'react';
import { useProject } from '../context/ProjectContext';
import { ViewTab } from '../types';
import {
  Kanban,
  ListTodo,
  BarChart3,
  Users,
  Calendar,
  FolderKanban,
  FolderPlus
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    activeProject,
    projects,
    activeSprint,
    issues,
    setIsCreateProjectModalOpen
  } = useProject();

  const navItems: { id: ViewTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'board', label: 'Active Board', icon: <Kanban className="w-4 h-4" /> },
    { id: 'backlog', label: 'Backlog & Sprints', icon: <ListTodo className="w-4 h-4" /> },
    { id: 'analytics', label: 'Sprint Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'projects', label: 'Workspace Projects', icon: <FolderKanban className="w-4 h-4" />, badge: `${projects.length}` },
    { id: 'team', label: 'Team Directory', icon: <Users className="w-4 h-4" /> }
  ];

  // Active Sprint Stats for active project
  const projectIssues = issues.filter(i => i.projectId === activeProject.id);
  const activeSprintIssues = projectIssues.filter(i => i.sprintId === activeSprint?.id);
  const completedPoints = activeSprintIssues
    .filter(i => i.status === 'done')
    .reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const totalPoints = activeSprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const progressPercent = totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3">
        {/* Project Header Info Card */}
        <div className="px-3.5 py-3 mb-3 rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/30 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Project Space</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white text-slate-700 border border-slate-200 font-bold">
              {activeProject.key}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-900 mt-0.5 truncate" title={activeProject.name}>
            {activeProject.name}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span className="capitalize">{activeProject.template} Methodology</span>
            <span>{projectIssues.length} issues</span>
          </div>
        </div>

        {/* Primary Navigation List */}
        <div className="space-y-1">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/50 text-blue-700 font-semibold border border-blue-200/70 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-blue-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 font-semibold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Area: Active Sprint Mini-Card & Add Project Quick Action */}
      <div className="p-3 space-y-2">
        {activeSprint ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-b from-slate-50 to-white border border-slate-200/90 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wide text-blue-700 font-semibold">Active Sprint</span>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{activeSprint.endDate.slice(5)}</span>
              </span>
            </div>
            <div className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">{activeSprint.name}</div>

            {/* Progress Bar */}
            <div className="mt-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                <span>Velocity Progress</span>
                <span className="font-mono text-slate-700 font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 pt-2 border-t border-slate-200/70">
              <span>Points</span>
              <span className="font-mono text-slate-700 font-medium">
                <span className="text-emerald-600 font-semibold">{completedPoints}</span> / {totalPoints} SP
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="w-full p-2.5 rounded-xl border border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/30 text-xs text-slate-600 hover:text-blue-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </button>
        )}
      </div>
    </aside>
  );
};
