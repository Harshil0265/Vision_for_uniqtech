import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Sprint, Issue } from '../types';
import { WorkItemIcon, PriorityIcon } from './WorkItemIcon';
import { getUserRoleInProject, canEditIssue, canCreateSprint } from '../utils/permissions';
import {
  Calendar,
  CheckCircle2,
  Play,
  Plus,
  ChevronDown,
  ChevronRight,
  Layers,
  Check
} from 'lucide-react';

export const BacklogView: React.FC = () => {
  const {
    sprints,
    issues,
    activeProject,
    currentUser,
    startSprint,
    completeSprint,
    createSprint,
    moveIssueSprint,
    setSelectedIssue,
    setIsCreateModalOpen
  } = useProject();

  const [collapsedSprints, setCollapsedSprints] = useState<Record<string, boolean>>({});
  const [isNewSprintFormOpen, setIsNewSprintFormOpen] = useState(false);
  const [newSprintName, setNewSprintName] = useState('');
  const [newSprintGoal, setNewSprintGoal] = useState('');

  const projectSprints = sprints.filter(s => s.projectId === activeProject.id);
  const projectIssues = issues.filter(i => i.projectId === activeProject.id);

  // Get user's role in the current project
  const userRole = getUserRoleInProject(activeProject, currentUser.id);
  const canEdit = userRole ? canEditIssue(userRole) : false;
  const canManageSprints = userRole ? canCreateSprint(userRole) : false;

  const toggleCollapse = (id: string) => {
    setCollapsedSprints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSprints || !newSprintName.trim()) return;
    createSprint(
      newSprintName.trim(),
      newSprintGoal.trim() || 'Sprint goals defined during planning.',
      new Date().toISOString().split('T')[0],
      new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
    );
    setNewSprintName('');
    setNewSprintGoal('');
    setIsNewSprintFormOpen(false);
  };

  // Render an individual issue row in backlog
  const renderIssueRow = (issue: Issue, currentSprintId: string | null) => {
    return (
      <div
        key={issue.id}
        onClick={() => setSelectedIssue(issue)}
        className="group flex items-center justify-between px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-lg text-xs cursor-pointer transition-all shadow-2xs hover:shadow-xs"
      >
        {/* Left: Work item key, type, title, epic */}
        <div className="flex items-center gap-3 min-w-0">
          <WorkItemIcon type={issue.type} className="w-4 h-4 shrink-0" />
          <span className="font-mono text-slate-700 font-semibold group-hover:text-blue-600 transition-colors shrink-0">
            {issue.key}
          </span>
          <span className="text-slate-900 font-medium truncate max-w-md">
            {issue.title}
          </span>
          {issue.epicTitle && (
            <span className="hidden lg:inline-flex items-center gap-1 text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded truncate shrink-0 font-medium">
              <Layers className="w-2.5 h-2.5 text-purple-600" />
              <span>{issue.epicTitle}</span>
            </span>
          )}
        </div>

        {/* Right: Status badge, Priority, Story Points, Assignee, Move Sprint Action */}
        <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
          {/* Status badge */}
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-medium">
            {issue.status.replace('_', ' ')}
          </span>

          {/* Priority */}
          <PriorityIcon priority={issue.priority} className="w-4 h-4" />

          {/* Story Points */}
          <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {issue.storyPoints} SP
          </span>

          {/* Assignee Avatar */}
          {issue.assignee ? (
            <img
              src={issue.assignee.avatar}
              alt={issue.assignee.name}
              title={`Assigned to ${issue.assignee.name}`}
              className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
            />
          ) : (
            <div
              className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[9px] text-slate-400"
              title="Unassigned"
            >
              -
            </div>
          )}

          {/* Quick Move Sprint Dropdown */}
          <select
            value={currentSprintId || 'backlog'}
            onChange={e => canEdit && moveIssueSprint(issue.id, e.target.value === 'backlog' ? 'backlog' : e.target.value)}
            disabled={!canEdit}
            className={`bg-white border border-slate-200 text-slate-600 text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-blue-500 shadow-2xs font-medium ${
              canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
            }`}
            title={!canEdit ? 'Read-only (viewer role)' : 'Move to another Sprint'}
          >
            {projectSprints.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value="backlog">Product Backlog</option>
          </select>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <span>Sprint Planning & Backlog</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold border border-blue-200">
              {activeProject.key}
            </span>
            <span className="text-xs font-mono text-slate-500">({projectIssues.length} items)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Plan sprints for {activeProject.name}, groom user stories, and manage capacity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canManageSprints ? (
            <button
              onClick={() => setIsNewSprintFormOpen(!isNewSprintFormOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Sprint</span>
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 italic">
              Admin or Owner role required to create sprints
            </div>
          )}
          {canEdit && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* New Sprint Quick Creator Bar */}
      {isNewSprintFormOpen && (
        <form
          onSubmit={handleCreateSprint}
          className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
        >
          <div className="text-xs font-semibold text-slate-900">New Sprint Definition ({activeProject.key})</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder={`Sprint Name (e.g. ${activeProject.key} Sprint ${projectSprints.length + 1})`}
              value={newSprintName}
              onChange={e => setNewSprintName(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              required
            />
            <input
              type="text"
              placeholder="Sprint Goal (Deliverables & Objectives)"
              value={newSprintGoal}
              onChange={e => setNewSprintGoal(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewSprintFormOpen(false)}
              className="px-3 py-1 rounded text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer shadow-2xs"
            >
              Save Sprint
            </button>
          </div>
        </form>
      )}

      {/* Sprints Buckets */}
      <div className="space-y-6">
        {projectSprints.map(sprint => {
          const sprintIssues = projectIssues.filter(i => i.sprintId === sprint.id);
          const isCollapsed = collapsedSprints[sprint.id] || false;
          const totalPoints = sprintIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
          const completedPoints = sprintIssues
            .filter(i => i.status === 'done')
            .reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

          return (
            <div
              key={sprint.id}
              className="rounded-xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden"
            >
              {/* Sprint Header Banner */}
              <div className="p-3.5 bg-gradient-to-r from-slate-50 to-indigo-50/20 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleCollapse(sprint.id)}
                    className="p-1 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{sprint.name}</span>
                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                          sprint.status === 'active'
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : sprint.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {sprint.status}
                      </span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{sprint.startDate} ~ {sprint.endDate}</span>
                      </span>
                    </div>
                    {sprint.goal && (
                      <div className="text-[11px] text-slate-600 mt-0.5 italic">
                        Goal: {sprint.goal}
                      </div>
                    )}
                  </div>
                </div>

                {/* Points & Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-[11px] font-mono">
                    <span className="text-emerald-700 font-bold">{completedPoints}</span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-700 font-semibold">{totalPoints} SP</span>
                  </div>

                  {sprint.status === 'planned' && (
                    <button
                      onClick={() => startSprint(sprint.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium transition-colors shadow-2xs cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Sprint</span>
                    </button>
                  )}

                  {sprint.status === 'active' && (
                    <button
                      onClick={() => completeSprint(sprint.id)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete Sprint</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Sprint Issues List */}
              {!isCollapsed && (
                <div className="p-3 space-y-2 bg-slate-50/30">
                  {sprintIssues.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      No issues in this sprint. Use "+ Create Issue" or move items from the Backlog.
                    </div>
                  ) : (
                    sprintIssues.map(issue => renderIssueRow(issue, sprint.id))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Product Backlog Bucket for Active Project */}
        {(() => {
          const backlogIssues = projectIssues.filter(
            i => i.sprintId === 'backlog' || i.sprintId === null || !i.sprintId
          );
          const isCollapsed = collapsedSprints['backlog'] || false;
          const totalPoints = backlogIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

          return (
            <div className="rounded-xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => toggleCollapse('backlog')}
                    className="p-1 rounded text-slate-500 hover:text-slate-800 cursor-pointer"
                  >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{activeProject.key} Product Backlog</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                        {backlogIssues.length} items
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Unplanned work, technical debt, and future roadmap requests for {activeProject.name}.
                    </div>
                  </div>
                </div>

                <div className="font-mono text-xs text-slate-700 font-semibold">
                  {totalPoints} SP
                </div>
              </div>

              {!isCollapsed && (
                <div className="p-3 space-y-2 bg-slate-50/30">
                  {backlogIssues.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                      Backlog is clear! All items have been scheduled into active or planned sprints.
                    </div>
                  ) : (
                    backlogIssues.map(issue => renderIssueRow(issue, 'backlog'))
                  )}
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
