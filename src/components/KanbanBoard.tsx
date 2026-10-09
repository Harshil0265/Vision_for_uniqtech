import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Issue, KanbanColumn, SwimlaneType } from '../types';
import { WorkItemIcon, PriorityIcon } from './WorkItemIcon';
import { getUserRoleInProject, canEditIssue } from '../utils/permissions';
import {
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  Plus,
  UserCheck,
  Check,
  X,
  Layers,
  MessageSquare,
  CheckSquare
} from 'lucide-react';

export const KanbanBoard: React.FC = () => {
  const {
    issues,
    columns,
    activeProject,
    activeSprint,
    currentUser,
    teamMembers,
    searchQuery,
    filterAssignee,
    setFilterAssignee,
    filterPriority,
    setFilterPriority,
    filterType,
    setFilterType,
    filterOnlyMyIssues,
    setFilterOnlyMyIssues,
    clearFilters,
    swimlane,
    setSwimlane,
    moveIssueStatus,
    setSelectedIssue,
    setIsCreateModalOpen,
    completeSprint
  } = useProject();

  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Get user's role in the current project
  const userRole = getUserRoleInProject(activeProject, currentUser.id);
  const canEdit = userRole ? canEditIssue(userRole) : false;

  // Apply active project, active sprint & quick filters
  const filteredIssues = issues.filter(issue => {
    // Project filter
    if (issue.projectId && issue.projectId !== activeProject.id) {
      return false;
    }

    // Only issues in active sprint or backlog if no active sprint
    if (activeSprint) {
      if (issue.sprintId !== activeSprint.id) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKey = issue.key.toLowerCase().includes(q);
      const matchTitle = issue.title.toLowerCase().includes(q);
      const matchDesc = issue.description.toLowerCase().includes(q);
      const matchAssignee = issue.assignee?.name.toLowerCase().includes(q);
      if (!matchKey && !matchTitle && !matchDesc && !matchAssignee) return false;
    }

    // Only my issues
    if (filterOnlyMyIssues && issue.assignee?.id !== currentUser.id) {
      return false;
    }

    // Assignee filter
    if (filterAssignee !== 'all') {
      if (filterAssignee === 'unassigned') {
        if (issue.assignee !== null) return false;
      } else if (issue.assignee?.id !== filterAssignee) {
        return false;
      }
    }

    // Priority filter
    if (filterPriority !== 'all' && issue.priority !== filterPriority) {
      return false;
    }

    // Type filter
    if (filterType !== 'all' && issue.type !== filterType) {
      return false;
    }

    return true;
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterOnlyMyIssues ||
    filterAssignee !== 'all' ||
    filterPriority !== 'all' ||
    filterType !== 'all';

  // Drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canEdit) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    setDraggedIssueId(id);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    if (!canEdit) return;
    e.preventDefault();
    setDragOverColumnId(colId);
  };

  const handleDrop = (e: React.DragEvent, colId: string) => {
    if (!canEdit) return;
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || draggedIssueId;
    if (id) {
      moveIssueStatus(id, colId);
    }
    setDraggedIssueId(null);
    setDragOverColumnId(null);
  };

  // Render cards helper
  const renderCard = (issue: Issue) => {
    const isBlocker = issue.priority === 'blocker';
    const subtaskCompleted = issue.subtasks.filter(st => st.completed).length;

    return (
      <div
        key={issue.id}
        draggable={canEdit}
        onDragStart={e => handleDragStart(e, issue.id)}
        onClick={() => setSelectedIssue(issue)}
        className={`group p-3.5 rounded-xl bg-white hover:bg-slate-50/80 border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs ${
          isBlocker
            ? 'border-red-300 hover:border-red-400 bg-red-50/20'
            : 'border-slate-200/90 hover:border-blue-300'
        } ${draggedIssueId === issue.id ? 'opacity-40 scale-98' : ''} ${!canEdit ? 'cursor-default' : ''}`}
        title={!canEdit ? 'Read-only view (viewer role)' : ''}
      >
        {/* Top: Issue Key, Type, Priority & Story Points */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <WorkItemIcon type={issue.type} className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
              {issue.key}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <PriorityIcon priority={issue.priority} className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
              {issue.storyPoints} SP
            </span>
          </div>
        </div>

        {/* Issue Title */}
        <h4 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-relaxed mb-2.5">
          {issue.title}
        </h4>

        {/* Epic Badge if any */}
        {issue.epicTitle && (
          <div className="mb-2">
            <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded truncate max-w-full inline-flex items-center gap-1 font-medium">
              <Layers className="w-2.5 h-2.5 text-purple-600" />
              <span>{issue.epicTitle}</span>
            </span>
          </div>
        )}

        {/* Footer: Subtasks & Assignee */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
          <div className="flex items-center gap-2.5">
            {issue.subtasks.length > 0 && (
              <span
                className={`flex items-center gap-1 text-[10px] font-mono ${
                  subtaskCompleted === issue.subtasks.length ? 'text-emerald-700 font-semibold' : 'text-slate-500'
                }`}
              >
                <CheckSquare className="w-3 h-3 text-slate-400" />
                {subtaskCompleted}/{issue.subtasks.length}
              </span>
            )}

            {issue.comments.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <MessageSquare className="w-3 h-3 text-slate-400" />
                {issue.comments.length}
              </span>
            )}
          </div>

          {/* Assignee Avatar */}
          {issue.assignee ? (
            <div className="flex items-center gap-1.5" title={`Assigned to ${issue.assignee.name}`}>
              <span className="text-[10px] text-slate-600 hidden xl:inline truncate max-w-[80px]">
                {issue.assignee.name.split(' ')[0]}
              </span>
              <img
                src={issue.assignee.avatar}
                alt={issue.assignee.name}
                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
              />
            </div>
          ) : (
            <span className="text-[10px] text-slate-400 italic">Unassigned</span>
          )}
        </div>
      </div>
    );
  };

  // Render columns for a specific group of issues
  const renderColumnsForGroup = (groupIssues: Issue[]) => {
    return (
      <div className="grid grid-flow-col auto-cols-[minmax(280px,1fr)] gap-3.5 overflow-x-auto pb-4">
        {columns.map(column => {
          const colIssues = groupIssues.filter(i => i.status === column.id);
          const isOverWip = column.wipLimit > 0 && colIssues.length > column.wipLimit;
          const isAtLimit = column.wipLimit > 0 && colIssues.length === column.wipLimit;
          const isDragTarget = dragOverColumnId === column.id;

          return (
            <div
              key={column.id}
              onDragOver={e => handleDragOver(e, column.id)}
              onDrop={e => handleDrop(e, column.id)}
              className={`flex flex-col rounded-xl bg-slate-100/70 border transition-all min-h-[580px] ${
                isDragTarget
                  ? 'border-blue-400 bg-blue-50/30'
                  : 'border-slate-200/90'
              }`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-slate-200/80 bg-white/60 rounded-t-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <span className="text-xs font-semibold text-slate-800 tracking-tight">
                    {column.name}
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-medium">
                    {colIssues.length}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* WIP Limit warning badge */}
                  {column.wipLimit > 0 && (
                    <div
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded flex items-center gap-1 border ${
                        isOverWip
                          ? 'bg-rose-100 text-rose-700 border-rose-300 font-semibold'
                          : isAtLimit
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                      title={
                        isOverWip
                          ? `WIP Limit Exceeded! (${colIssues.length}/${column.wipLimit})`
                          : `WIP limit: ${column.wipLimit}`
                      }
                    >
                      {isOverWip && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                      <span>
                        WIP: {colIssues.length}/{column.wipLimit}
                      </span>
                    </div>
                  )}

                  {/* Quick Add Issue Button for this status */}
                  <button
                    onClick={() => {
                      setIsCreateModalOpen(true);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title={`Add issue to ${column.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Column Cards Drop Area */}
              <div className="p-2.5 flex-1 flex flex-col gap-2.5 overflow-y-auto">
                {colIssues.length === 0 ? (
                  <div className="h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                    Drop items here
                  </div>
                ) : (
                  colIssues.map(renderCard)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-hidden">
      {/* Board Top Control Bar */}
      <div className="px-5 py-3 border-b border-slate-200/80 bg-white/80 backdrop-blur-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Active Sprint Header & Quick Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <span>{activeSprint ? activeSprint.name : 'Kanban Active Board'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
                {filteredIssues.length} issues
              </span>
            </h1>
          </div>

          <div className="h-4 w-px bg-slate-200 hidden sm:block" />

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Only My Issues */}
            <button
              onClick={() => setFilterOnlyMyIssues(!filterOnlyMyIssues)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs transition-all cursor-pointer ${
                filterOnlyMyIssues
                  ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Only My Issues</span>
            </button>

            {/* Assignee Filter */}
            <select
              value={filterAssignee}
              onChange={e => setFilterAssignee(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="all">All Assignees</option>
              <option value="unassigned">Unassigned</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs"
            >
              <option value="all">All Priorities</option>
              <option value="blocker">Blocker (P0)</option>
              <option value="high">High (P1)</option>
              <option value="medium">Medium (P2)</option>
              <option value="low">Low (P3)</option>
            </select>

            {/* Type Filter */}
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer shadow-2xs capitalize"
            >
              <option value="all">All Types</option>
              {activeProject.allowedIssueTypes.map(t => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-1.5 py-1 cursor-pointer"
                title="Clear all active filters"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
        </div>

        {/* Right: Swimlane selector & Actions */}
        <div className="flex items-center gap-2">
          {/* Swimlane Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs shadow-2xs">
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 text-[11px]">Group:</span>
            <select
              value={swimlane}
              onChange={e => setSwimlane(e.target.value as SwimlaneType)}
              className="bg-transparent text-slate-800 text-xs focus:outline-none cursor-pointer font-medium"
            >
              <option value="none">None (Standard)</option>
              <option value="assignee">By Assignee</option>
              <option value="priority">By Priority</option>
              <option value="epic">By Epic</option>
            </select>
          </div>

          {/* Complete Sprint Action Button with gradient */}
          {activeSprint && (
            <button
              onClick={() => completeSprint(activeSprint.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Complete Sprint</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Columns Canvas */}
      <div className="flex-1 p-5 overflow-auto">
        {swimlane === 'none' ? (
          renderColumnsForGroup(filteredIssues)
        ) : swimlane === 'assignee' ? (
          <div className="space-y-6">
            {teamMembers.map(member => {
              const memberIssues = filteredIssues.filter(i => i.assignee?.id === member.id);
              if (memberIssues.length === 0) return null;
              return (
                <div key={member.id} className="space-y-2">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-slate-200"
                    />
                    <span className="text-xs font-semibold text-slate-800">{member.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({memberIssues.length} issues ·{' '}
                      {memberIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0)} SP)
                    </span>
                  </div>
                  {renderColumnsForGroup(memberIssues)}
                </div>
              );
            })}
            {/* Unassigned Swimlane */}
            {filteredIssues.filter(i => !i.assignee).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-600">Unassigned</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    ({filteredIssues.filter(i => !i.assignee).length} issues)
                  </span>
                </div>
                {renderColumnsForGroup(filteredIssues.filter(i => !i.assignee))}
              </div>
            )}
          </div>
        ) : swimlane === 'priority' ? (
          <div className="space-y-6">
            {(['blocker', 'high', 'medium', 'low', 'lowest'] as const).map(p => {
              const pIssues = filteredIssues.filter(i => i.priority === p);
              if (pIssues.length === 0) return null;
              return (
                <div key={p} className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <PriorityIcon priority={p} className="w-4 h-4" />
                    <span className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                      {p} Priority
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">({pIssues.length})</span>
                  </div>
                  {renderColumnsForGroup(pIssues)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Swimlane by Epic */}
            {Array.from(new Set(filteredIssues.map(i => i.epicTitle || 'No Epic'))).map(epicTitle => {
              const epicIssues = filteredIssues.filter(i => (i.epicTitle || 'No Epic') === epicTitle);
              return (
                <div key={epicTitle} className="space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                    <Layers className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-xs font-semibold text-slate-800">{epicTitle}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({epicIssues.length} issues)</span>
                  </div>
                  {renderColumnsForGroup(epicIssues)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
