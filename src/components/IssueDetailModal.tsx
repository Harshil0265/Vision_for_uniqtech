import React, { useState, useRef } from 'react';
import { useProject } from '../context/ProjectContext';
import { WorkItemIcon, PriorityIcon } from './WorkItemIcon';
import { Priority } from '../types';
import { getUserRoleInProject, canEditIssue, canDeleteProject } from '../utils/permissions';
import {
  X,
  Trash2,
  CheckSquare,
  MessageSquare,
  History,
  Send,
  AtSign,
  Eye
} from 'lucide-react';

export const IssueDetailModal: React.FC = () => {
  const {
    selectedIssue,
    setSelectedIssue,
    columns,
    projects,
    activeProject,
    teamMembers,
    sprints,
    currentUser,
    updateIssue,
    deleteIssue,
    moveIssueStatus,
    toggleSubtask,
    addSubtask,
    addComment
  } = useProject();

  if (!selectedIssue) return null;

  const issueProject = projects.find(p => p.id === selectedIssue.projectId) || activeProject;
  const allowedTypes = issueProject.allowedIssueTypes || ['epic', 'story', 'task', 'bug'];

  // Get user's role in the project
  const userRole = getUserRoleInProject(issueProject, currentUser.id);
  const canEdit = userRole ? canEditIssue(userRole) : false;
  const canDelete = userRole ? canDeleteProject(userRole) : false;
  const isViewer = userRole === 'viewer';

  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [commentText, setCommentText] = useState('');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(selectedIssue.title);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState(selectedIssue.description);
  const [mentionPickerOpen, setMentionPickerOpen] = useState(false);

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleTitleBlur = () => {
    if (!canEdit) return;
    setIsEditingTitle(false);
    if (titleValue.trim() && titleValue !== selectedIssue.title) {
      updateIssue(selectedIssue.id, { title: titleValue.trim() });
    }
  };

  const handleDescBlur = () => {
    if (!canEdit) return;
    setIsEditingDesc(false);
    if (descValue !== selectedIssue.description) {
      updateIssue(selectedIssue.id, { description: descValue });
    }
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (newSubtaskTitle.trim()) {
      addSubtask(selectedIssue.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (commentText.trim()) {
      addComment(selectedIssue.id, commentText.trim());
      setCommentText('');
      setMentionPickerOpen(false);
    }
  };

  const insertMention = (handle: string) => {
    setCommentText(prev => prev + ` @${handle} `);
    setMentionPickerOpen(false);
    if (commentInputRef.current) {
      commentInputRef.current.focus();
    }
  };

  const subtasksCompleted = selectedIssue.subtasks.filter(s => s.completed).length;
  const subtasksTotal = selectedIssue.subtasks.length;
  const subtasksPercent = subtasksTotal > 0 ? Math.round((subtasksCompleted / subtasksTotal) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WorkItemIcon type={selectedIssue.type} className="w-4 h-4" />
            <span className="font-mono text-xs font-bold text-slate-800 tracking-wider">
              {selectedIssue.key}
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-xs text-slate-600 font-medium">
              {selectedIssue.epicTitle || 'Sprint Item'}
            </span>
            {/* Role Badge */}
            {userRole && (
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-semibold border ${
                  userRole === 'owner'
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : userRole === 'admin'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : userRole === 'member'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
                title={`Your role: ${userRole}`}
              >
                {userRole === 'viewer' && <Eye className="w-2.5 h-2.5 inline mr-0.5" />}
                {userRole}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {canDelete && (
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete ${selectedIssue.key}?`)) {
                    deleteIssue(selectedIssue.id);
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Delete issue (Admin/Owner only)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setSelectedIssue(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Left Pane (Content) + Right Pane (Sidebar Details) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto">
          {/* Left Main Pane */}
          <div className="flex-1 p-6 space-y-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 bg-white">
            {/* Title */}
            <div>
              {isEditingTitle && canEdit ? (
                <input
                  type="text"
                  value={titleValue}
                  onChange={e => setTitleValue(e.target.value)}
                  onBlur={handleTitleBlur}
                  autoFocus
                  className="w-full text-base font-semibold text-slate-900 bg-slate-50 border border-blue-500 rounded-lg px-3 py-1.5 focus:outline-none"
                />
              ) : (
                <h2
                  onClick={() => canEdit && setIsEditingTitle(true)}
                  className={`text-base font-semibold text-slate-900 p-1.5 -ml-1.5 rounded-lg transition-colors ${
                    canEdit ? 'hover:bg-slate-50 cursor-pointer' : 'cursor-default'
                  }`}
                  title={canEdit ? 'Click to edit title' : 'Read-only (viewer role)'}
                >
                  {selectedIssue.title}
                </h2>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Description
              </div>
              {isEditingDesc && canEdit ? (
                <div className="space-y-2">
                  <textarea
                    value={descValue}
                    onChange={e => setDescValue(e.target.value)}
                    rows={4}
                    className="w-full text-xs text-slate-900 bg-slate-50 border border-blue-500 rounded-lg p-3 focus:outline-none"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsEditingDesc(false)}
                      className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDescBlur}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium cursor-pointer"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => canEdit && setIsEditingDesc(true)}
                  className={`p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed transition-colors whitespace-pre-wrap min-h-[60px] ${
                    canEdit ? 'hover:bg-slate-100/60 cursor-pointer' : 'cursor-default'
                  }`}
                  title={canEdit ? 'Click to edit description' : 'Read-only (viewer role)'}
                >
                  {selectedIssue.description || 'No description provided. Click to add details, technical requirements, or acceptance criteria.'}
                </div>
              )}
            </div>

            {/* Subtasks Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Subtasks & Checklist
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                    {subtasksCompleted}/{subtasksTotal}
                  </span>
                </div>
                {subtasksTotal > 0 && (
                  <span className="text-xs font-mono text-slate-500 font-medium">{subtasksPercent}% complete</span>
                )}
              </div>

              {subtasksTotal > 0 && (
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${subtasksPercent}%` }}
                  />
                </div>
              )}

              {/* Checklist items */}
              <div className="space-y-1.5">
                {selectedIssue.subtasks.map(st => (
                  <div
                    key={st.id}
                    onClick={() => canEdit && toggleSubtask(selectedIssue.id, st.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs transition-colors ${
                      canEdit ? 'hover:bg-slate-100/80 cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => {}}
                      disabled={!canEdit}
                      className={`rounded border-slate-300 text-blue-600 focus:ring-0 ${
                        canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      }`}
                    />
                    <span
                      className={`flex-1 ${
                        st.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {st.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add subtask inline input */}
              {canEdit ? (
                <form onSubmit={handleAddSubtaskSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="+ Add new subtask item..."
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              ) : (
                <div className="text-[11px] text-slate-400 italic border border-dashed border-slate-200 rounded-lg p-2 text-center">
                  Viewers cannot add subtasks
                </div>
              )}
            </div>

            {/* Discussion Comments & Audit Log Tabs */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`flex items-center gap-1.5 text-xs font-semibold pb-1 transition-all cursor-pointer ${
                    activeTab === 'comments'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Comments & Mentions ({selectedIssue.comments.length})</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center gap-1.5 text-xs font-semibold pb-1 transition-all cursor-pointer ${
                    activeTab === 'history'
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Audit History ({selectedIssue.activities.length})</span>
                </button>
              </div>

              {activeTab === 'comments' ? (
                <div className="space-y-4">
                  {/* Comments feed */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {selectedIssue.comments.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No comments yet. Type below to tag team members using @mentions.
                      </div>
                    ) : (
                      selectedIssue.comments.map(c => (
                        <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <img
                                src={c.author.avatar}
                                alt={c.author.name}
                                className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                              />
                              <span className="font-semibold text-slate-800">{c.author.name}</span>
                              <span className="text-[10px] text-slate-500">{c.author.role}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(c.createdAt).toLocaleDateString()} {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 whitespace-pre-wrap pl-7">{c.content}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add comment with @mention prompt */}
                  {canEdit ? (
                    <form onSubmit={handleCommentSubmit} className="space-y-2 relative">
                      <div className="relative">
                        <textarea
                          ref={commentInputRef}
                          rows={2}
                          placeholder="Write a comment... Type '@' to mention team members and trigger automated Nodemailer alerts..."
                          value={commentText}
                          onChange={e => {
                            setCommentText(e.target.value);
                            if (e.target.value.endsWith('@')) {
                              setMentionPickerOpen(true);
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                        />

                        {/* @Mention Picker Popover */}
                        {mentionPickerOpen && (
                          <div className="absolute bottom-full left-0 mb-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 space-y-1">
                            <div className="text-[10px] font-semibold text-slate-500 px-2 py-1 uppercase">
                              Tag Team Member:
                            </div>
                            {teamMembers.map(m => {
                              const handle = m.email.split('@')[0];
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => insertMention(handle)}
                                  className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 text-left text-xs transition-colors cursor-pointer"
                                >
                                  <img
                                    src={m.avatar}
                                    alt={m.name}
                                    className="w-4 h-4 rounded-full object-cover"
                                  />
                                  <span className="font-semibold text-slate-800">{m.name}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">@{handle}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setMentionPickerOpen(!mentionPickerOpen)}
                          className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          <AtSign className="w-3.5 h-3.5" />
                          <span>Tag member (@)</span>
                        </button>

                        <button
                          type="submit"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-medium shadow-xs transition-all cursor-pointer"
                        >
                          <Send className="w-3 h-3" />
                          <span>Send Comment</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="border border-dashed border-slate-200 rounded-xl p-3 text-center">
                      <p className="text-[11px] text-slate-400 italic">
                        Viewers cannot add comments. Contact a project admin to request member access.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* History / Activity Log */
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedIssue.activities.map(act => (
                    <div
                      key={act.id}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-50 text-xs text-slate-600"
                    >
                      <img
                        src={act.user.avatar}
                        alt={act.user.name}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="font-semibold text-slate-800">{act.user.name}</span>
                      <span>{act.action}</span>
                      <span className="text-[10px] text-slate-400 ml-auto font-mono">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Pane: Work Item Properties */}
          <div className="w-full lg:w-80 p-6 bg-slate-50/70 space-y-5">
            {/* Work Item Type */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Issue Type
              </label>
              <select
                value={selectedIssue.type}
                onChange={e => canEdit && updateIssue(selectedIssue.id, { type: e.target.value as any })}
                disabled={!canEdit}
                className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 capitalize font-medium shadow-2xs ${
                  canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {allowedTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Status
              </label>
              <select
                value={selectedIssue.status}
                onChange={e => canEdit && moveIssueStatus(selectedIssue.id, e.target.value)}
                disabled={!canEdit}
                className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 uppercase font-mono font-medium shadow-2xs ${
                  canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {columns.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Assignee
              </label>
              <select
                value={selectedIssue.assignee?.id || 'unassigned'}
                onChange={e => {
                  if (!canEdit) return;
                  const val = e.target.value;
                  const newAssignee = val === 'unassigned' ? null : teamMembers.find(m => m.id === val) || null;
                  updateIssue(selectedIssue.id, { assignee: newAssignee });
                }}
                disabled={!canEdit}
                className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs font-medium ${
                  canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <option value="unassigned">Unassigned</option>
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Priority
              </label>
              <select
                value={selectedIssue.priority}
                onChange={e => canEdit && updateIssue(selectedIssue.id, { priority: e.target.value as Priority })}
                disabled={!canEdit}
                className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 capitalize shadow-2xs font-medium ${
                  canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <option value="blocker">Blocker (P0 Critical Alert)</option>
                <option value="high">High (P1)</option>
                <option value="medium">Medium (P2)</option>
                <option value="low">Low (P3)</option>
                <option value="lowest">Lowest (P4)</option>
              </select>
            </div>

            {/* Story Points (Fibonacci) */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Story Points Estimate
              </label>
              <div className="grid grid-cols-6 gap-1">
                {[1, 2, 3, 5, 8, 13].map(pts => (
                  <button
                    key={pts}
                    type="button"
                    onClick={() => canEdit && updateIssue(selectedIssue.id, { storyPoints: pts })}
                    disabled={!canEdit}
                    className={`py-1 rounded font-mono text-xs font-bold border transition-all ${
                      selectedIssue.storyPoints === pts
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    } ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            {/* Sprint Assignment */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Sprint
              </label>
              <select
                value={selectedIssue.sprintId || 'backlog'}
                onChange={e => canEdit && updateIssue(selectedIssue.id, { sprintId: e.target.value === 'backlog' ? null : e.target.value })}
                disabled={!canEdit}
                className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-2xs font-medium ${
                  canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                }`}
              >
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="backlog">Product Backlog</option>
              </select>
            </div>

            {/* Reporter */}
            <div className="space-y-1 pt-2 border-t border-slate-200 text-xs">
              <span className="text-[10px] text-slate-500 uppercase font-medium">Reporter:</span>
              <div className="flex items-center gap-2 text-slate-800">
                <img
                  src={selectedIssue.reporter.avatar}
                  alt={selectedIssue.reporter.name}
                  className="w-4 h-4 rounded-full object-cover"
                />
                <span className="font-semibold">{selectedIssue.reporter.name}</span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="space-y-1 text-[11px] text-slate-500 pt-2 border-t border-slate-200 font-mono">
              <div>Created: {new Date(selectedIssue.createdAt).toLocaleDateString()}</div>
              <div>Updated: {new Date(selectedIssue.updatedAt).toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
