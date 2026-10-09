import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import { WorkItemType, Priority } from '../types';
import { WorkItemIcon } from './WorkItemIcon';
import { getUserRoleInProject, canEditIssue } from '../utils/permissions';
import { X, FolderKanban } from 'lucide-react';

export const CreateIssueModal: React.FC = () => {
  const {
    isCreateModalOpen,
    setIsCreateModalOpen,
    createIssue,
    projects,
    activeProject,
    teamMembers,
    sprints,
    activeSprint,
    columns,
    currentUser
  } = useProject();

  if (!isCreateModalOpen) return null;

  const [selectedProjectId, setSelectedProjectId] = useState<string>(activeProject.id);
  const currentProj = projects.find(p => p.id === selectedProjectId) || activeProject;

  // Get user's role in the selected project
  const userRole = getUserRoleInProject(currentProj, currentUser.id);
  const canCreate = userRole ? canEditIssue(userRole) : false;

  const [type, setType] = useState<WorkItemType>(
    currentProj.allowedIssueTypes[0] || 'task'
  );
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState<string>(
    currentProj.defaultAssignee === 'lead' ? currentProj.lead.id : 'unassigned'
  );
  const [sprintId, setSprintId] = useState<string>(activeSprint ? activeSprint.id : 'backlog');
  const [storyPoints, setStoryPoints] = useState<number>(3);
  const [status, setStatus] = useState<string>('todo');

  // When project changes, adjust default allowed types
  useEffect(() => {
    if (!currentProj.allowedIssueTypes.includes(type)) {
      setType(currentProj.allowedIssueTypes[0] || 'task');
    }
  }, [selectedProjectId, currentProj]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      alert('Viewers cannot create issues. Contact a project admin to request member access.');
      return;
    }
    if (!title.trim()) return;

    const selectedAssignee = assigneeId === 'unassigned' ? null : teamMembers.find(m => m.id === assigneeId) || null;

    await createIssue({
      projectId: selectedProjectId,
      type,
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee: selectedAssignee,
      sprintId: sprintId === 'backlog' ? null : sprintId,
      storyPoints,
      status
    });

    setIsCreateModalOpen(false);
    // Reset form
    setTitle('');
    setDescription('');
    setStoryPoints(3);
    setPriority('medium');
    setAssigneeId('unassigned');
  };

  const projectSprints = sprints.filter(s => s.projectId === selectedProjectId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Create Work Item</h3>
            <span className="text-[11px] font-mono text-slate-500">Key Prefix: {currentProj.key}</span>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Viewer Warning */}
          {!canCreate && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              <strong>Viewers cannot create issues.</strong> Contact a project admin to request member access.
            </div>
          )}

          {/* Target Project Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Target Project
            </label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.key}) - {p.template}
                </option>
              ))}
            </select>
          </div>

          {/* Issue Type Selector (Project-specific allowed types) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Work Item Type
              </label>
              <span className="text-[10px] text-slate-400">
                Configured for {currentProj.key}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {currentProj.allowedIssueTypes.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer ${
                    type === t
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-2xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-100/70'
                  }`}
                >
                  <WorkItemIcon type={t} className="w-3.5 h-3.5" />
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Summary / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Implement distributed tracing across API gateway"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide background context, technical specifications, and acceptance criteria..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Priority & Assignee Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Priority
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 capitalize cursor-pointer font-medium"
              >
                <option value="blocker">Blocker (P0 Critical Alert)</option>
                <option value="high">High (P1)</option>
                <option value="medium">Medium (P2)</option>
                <option value="low">Low (P3)</option>
                <option value="lowest">Lowest (P4)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assignee (Triggers Email Alert)
              </label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                <option value="unassigned">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sprint & Story Points Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Sprint Target
              </label>
              <select
                value={sprintId}
                onChange={e => setSprintId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer font-medium"
              >
                {projectSprints.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="backlog">Product Backlog</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Story Points (Fibonacci)
              </label>
              <select
                value={storyPoints}
                onChange={e => setStoryPoints(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono font-medium cursor-pointer"
              >
                {[1, 2, 3, 5, 8, 13, 21].map(pts => (
                  <option key={pts} value={pts}>
                    {pts} Story Points
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Initial Column Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 uppercase font-mono font-medium cursor-pointer"
            >
              {columns.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canCreate}
              className={`px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all ${
                canCreate ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              Create Work Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
