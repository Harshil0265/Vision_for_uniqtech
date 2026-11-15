import React, { useMemo, useState } from 'react';
import { Bug, Check, FolderPlus, Kanban, Layers, Settings2, Trash2, X } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import type { Project, ProjectMember, WorkItemType } from '../types';
import { WorkItemIcon } from './WorkItemIcon';
import { Alert, Avatar, Field, Modal, PrimaryButton, SecondaryButton, inputClass, inputErrorClass } from './ui';

const TEMPLATES = [
  { id: 'Scrum', label: 'Scrum', icon: <Layers className="w-3.5 h-3.5 text-blue-600" />, desc: 'Sprints, backlog and story points' },
  { id: 'Kanban', label: 'Kanban', icon: <Kanban className="w-3.5 h-3.5 text-amber-600" />, desc: 'Continuous flow with WIP limits' },
  { id: 'Bug Tracking', label: 'Bug tracking', icon: <Bug className="w-3.5 h-3.5 text-rose-600" />, desc: 'Defect intake, triage and escalation' }
] as const;

const WORK_ITEM_TYPES: { type: WorkItemType; label: string; desc: string }[] = [
  { type: 'epic', label: 'Epic', desc: 'Large initiative spanning several sprints' },
  { type: 'story', label: 'User story', desc: 'User-facing deliverable with acceptance criteria' },
  { type: 'task', label: 'Task', desc: 'A piece of implementation work' },
  { type: 'bug', label: 'Bug', desc: 'Defect, regression or functional error' },
  { type: 'spike', label: 'Spike', desc: 'Time-boxed research or proof of concept' },
  { type: 'subtask', label: 'Subtask', desc: 'Smaller part of a story or task' },
  { type: 'incident', label: 'Incident', desc: 'Production outage or security alert' }
];

const COLORS = [
  { class: 'from-blue-600 via-indigo-600 to-sky-500', label: 'Ocean blue' },
  { class: 'from-emerald-600 via-teal-600 to-cyan-500', label: 'Emerald' },
  { class: 'from-purple-600 via-violet-600 to-indigo-500', label: 'Purple' },
  { class: 'from-amber-600 via-orange-600 to-rose-500', label: 'Amber' },
  { class: 'from-rose-600 via-pink-600 to-purple-500', label: 'Rose' },
  { class: 'from-slate-700 via-slate-800 to-zinc-900', label: 'Slate' }
];

const KEY_RE = /^[A-Z][A-Z0-9]{1,5}$/;

/** Suggests a key from the name: "Data Streaming Pipeline" -> "DSP", "Payments" -> "PAY". */
const suggestKey = (name: string) => {
  const words = name.trim().toUpperCase().replace(/[^A-Z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);
  if (words.length >= 2) return words.slice(0, 4).map(w => w[0]).join('');
  return words[0]?.slice(0, 3) ?? '';
};

/**
 * Create a project, or edit its settings (Project settings).
 * Backend: POST /api/projects and PUT /api/projects/{id} (see docs/API_CONTRACT.md).
 */
export const CreateProjectModal: React.FC = () => {
  const { isCreateProjectModalOpen, editingProjectId, projects } = useProject();
  if (!isCreateProjectModalOpen) return null;
  const editing = editingProjectId ? projects.find(p => p.id === editingProjectId) ?? null : null;
  // The key resets the form state whenever a different project (or "new") is opened.
  return <ProjectForm key={editing?.id ?? 'new'} editing={editing} />;
};

const ProjectForm: React.FC<{ editing: Project | null }> = ({ editing }) => {
  const {
    setIsCreateProjectModalOpen,
    createProject,
    updateProject,
    deleteProject,
    teamMembers,
    currentUser,
    setActiveTab,
    isProjectKeyTaken,
    getProjectMembers,
    myRoleIn,
    projects
  } = useProject();

  const close = () => setIsCreateProjectModalOpen(false);
  const isEdit = !!editing;

  const [name, setName] = useState(editing?.name ?? '');
  const [key, setKey] = useState(editing?.key ?? '');
  const [keyTouched, setKeyTouched] = useState(isEdit);
  const [description, setDescription] = useState(editing?.description ?? '');
  const [leadId, setLeadId] = useState(editing?.lead.id ?? currentUser.id);
  const [template, setTemplate] = useState<Project['template']>(editing?.template ?? 'Scrum');
  const [defaultAssignee, setDefaultAssignee] = useState<Project['defaultAssignee']>(editing?.defaultAssignee ?? 'unassigned');
  const [iconGradient, setIconGradient] = useState(editing?.iconGradient ?? COLORS[0].class);
  const [types, setTypes] = useState<WorkItemType[]>(editing?.allowedIssueTypes ?? ['epic', 'story', 'task', 'bug', 'spike']);
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDelete, setConfirmDelete] = useState(false);
  const clearError = (field: string) => setErrors(({ [field]: _removed, ...rest }) => rest);

  const activeUsers = teamMembers;
  const memberCandidates = useMemo(
    () => activeUsers.filter(u => u.id !== leadId && u.id !== currentUser.id && !memberIds.includes(u.id)),
    [activeUsers, leadId, currentUser.id, memberIds]
  );

  const toggleType = (t: WorkItemType) => {
    setTypes(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]));
    clearError('types');
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const n = name.trim();
    if (n.length < 3) next.name = 'Use at least 3 characters.';
    else if (n.length > 80) next.name = 'Use 80 characters or fewer.';
    if (!isEdit) {
      if (!KEY_RE.test(key)) next.key = '2–6 characters: a letter first, then letters or numbers.';
      else if (isProjectKeyTaken(key)) next.key = `The key ${key} is already used by another project.`;
    }
    if (description.length > 500) next.description = 'Use 500 characters or fewer.';
    if (types.length === 0) next.types = 'Enable at least one work item type.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const lead = teamMembers.find(m => m.id === leadId) || currentUser;

    if (editing) {
      // The lead must be able to access the project.
      const current = getProjectMembers(editing).map(m => m.member);
      const members: ProjectMember[] = current.some(m => m.userId === lead.id)
        ? current
        : [...current, { userId: lead.id, role: 'admin', addedAt: new Date().toISOString() }];
      updateProject(editing.id, {
        name: name.trim(), description: description.trim(), lead, template, allowedIssueTypes: types, defaultAssignee, iconGradient, members
      });
      close();
      return;
    }

    const now = new Date().toISOString();
    const members: ProjectMember[] = [
      { userId: lead.id, role: 'owner', addedAt: now },
      ...(lead.id !== currentUser.id ? [{ userId: currentUser.id, role: 'admin' as const, addedAt: now }] : []),
      ...memberIds.map(userId => ({ userId, role: 'member' as const, addedAt: now }))
    ];
    createProject({
      name: name.trim(), key, description: description.trim(), lead, template, allowedIssueTypes: types, defaultAssignee, iconGradient, members
    });
    close();
    setActiveTab('board');
  };

  const isOwner = editing ? myRoleIn(editing) === 'owner' : false;
  const field = (invalid: boolean) => `${inputClass} ${invalid ? inputErrorClass : ''}`;

  return (
    <Modal
      size="xl"
      title={isEdit ? `Project settings · ${editing!.key}` : 'Create project'}
      subtitle={isEdit ? 'Update details, lead and allowed work item types' : 'Set up the project, its key and who works on it'}
      icon={isEdit ? <Settings2 className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
      onClose={close}
      footer={
        <>
          <SecondaryButton type="button" onClick={close}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" form="project-form">{isEdit ? 'Save changes' : 'Create project'}</PrimaryButton>
        </>
      }
    >
      <form id="project-form" onSubmit={submit} className="space-y-5" noValidate>
        {Object.keys(errors).length > 0 && <Alert tone="error">Please fix the highlighted fields.</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Project name" required error={errors.name} className="sm:col-span-2">
            {({ id, describedBy, invalid }) => (
              <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={field(invalid)} maxLength={80}
                placeholder="e.g. Payment Gateway" value={name}
                onChange={e => { setName(e.target.value); clearError('name'); if (!keyTouched) { setKey(suggestKey(e.target.value)); clearError('key'); } }} />
            )}
          </Field>
          <Field label="Project key" required={!isEdit} error={errors.key}
            hint={isEdit ? 'The key cannot change because work item keys use it.' : `Work items will be ${key || 'KEY'}-101, ${key || 'KEY'}-102…`}>
            {({ id, describedBy, invalid }) => (
              <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${field(invalid)} font-mono font-bold uppercase`}
                maxLength={6} placeholder="PAY" value={key} disabled={isEdit}
                onChange={e => { setKeyTouched(true); setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')); clearError('key'); }} />
            )}
          </Field>
        </div>

        <Field label="Description" error={errors.description} hint={`${description.length}/500`}>
          {({ id, describedBy, invalid }) => (
            <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} rows={2} maxLength={500} className={field(invalid)}
              placeholder="What is this project about and who is it for?" value={description} onChange={e => { setDescription(e.target.value); clearError('description'); }} />
          )}
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <fieldset>
            <legend className="block text-xs font-semibold text-slate-700 mb-1">Template</legend>
            <div className="space-y-1.5">
              {TEMPLATES.map(t => (
                <label key={t.id} className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  template === t.id ? 'bg-blue-50/70 border-blue-400 shadow-2xs' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                }`}>
                  <input type="radio" name="template" value={t.id} checked={template === t.id} onChange={() => setTemplate(t.id)} className="sr-only" />
                  <span className="mt-0.5">{t.icon}</span>
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-800">{t.label}</span>
                    <span className="block text-[10px] text-slate-500">{t.desc}</span>
                  </span>
                  {template === t.id && <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5" />}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-4">
            <Field label="Project lead" hint="Becomes the project owner.">
              {({ id, describedBy }) => (
                <select id={id} aria-describedby={describedBy} className={inputClass} value={leadId} onChange={e => setLeadId(e.target.value)}>
                  {teamMembers.filter(m => m.status !== 'invited' || m.id === leadId).map(m => (
                    <option key={m.id} value={m.id}>{m.name} · {m.role}</option>
                  ))}
                </select>
              )}
            </Field>
            <Field label="Default assignee for new work items">
              {({ id, describedBy }) => (
                <select id={id} aria-describedby={describedBy} className={inputClass} value={defaultAssignee} onChange={e => setDefaultAssignee(e.target.value as Project['defaultAssignee'])}>
                  <option value="unassigned">Unassigned</option>
                  <option value="lead">Project lead</option>
                </select>
              )}
            </Field>
            <fieldset>
              <legend className="block text-xs font-semibold text-slate-700 mb-1">Color</legend>
              <div className="grid grid-cols-6 gap-2">
                {COLORS.map(c => (
                  <button key={c.class} type="button" onClick={() => setIconGradient(c.class)} aria-label={c.label} aria-pressed={iconGradient === c.class}
                    className={`h-7 rounded-lg bg-gradient-to-tr ${c.class} transition-all cursor-pointer ${iconGradient === c.class ? 'ring-2 ring-slate-900 ring-offset-1' : 'opacity-80 hover:opacity-100'}`} />
                ))}
              </div>
            </fieldset>
          </div>
        </div>

        {/* Team members (create only; afterwards they are managed on the Members page) */}
        {!isEdit && (
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div>
              <div className="text-xs font-semibold text-slate-800">Team members <span className="font-normal text-slate-500">(optional)</span></div>
              <p className="text-[11px] text-slate-500">You and the lead are added automatically. You can add or change people later on the Members page.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {memberIds.map(id => {
                const u = teamMembers.find(m => m.id === id);
                if (!u) return null;
                return (
                  <span key={id} className="inline-flex items-center gap-1.5 pl-1 pr-1.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-700">
                    <Avatar name={u.name} src={u.avatar} size="xs" />
                    {u.name}
                    <button type="button" onClick={() => setMemberIds(prev => prev.filter(x => x !== id))} aria-label={`Remove ${u.name}`} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {memberCandidates.length > 0 && (
                <select aria-label="Add a team member" className={`${inputClass} w-auto py-1.5`} value=""
                  onChange={e => { if (e.target.value) setMemberIds(prev => [...prev, e.target.value]); }}>
                  <option value="">+ Add a person…</option>
                  {memberCandidates.map(u => <option key={u.id} value={u.id}>{u.name} · {u.role}</option>)}
                </select>
              )}
            </div>
          </div>
        )}

        {/* Work item types */}
        <div className="pt-4 border-t border-slate-200 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-800">Work item types</div>
              <p className="text-[11px] text-slate-500">Which kinds of work people can create in this project.</p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold shrink-0">{types.length} enabled</span>
          </div>
          {errors.types && <p className="text-[11px] text-rose-600">{errors.types}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {WORK_ITEM_TYPES.map(({ type, label, desc }) => {
              const on = types.includes(type);
              return (
                <label key={type} className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                  on ? 'bg-blue-50/50 border-blue-400 shadow-2xs' : 'bg-slate-50 border-slate-200 hover:bg-slate-100/60'
                }`}>
                  <input type="checkbox" checked={on} onChange={() => toggleType(type)} className="mt-0.5 accent-blue-600" />
                  <WorkItemIcon type={type} className="w-4 h-4 mt-px" />
                  <span className="flex-1">
                    <span className="block font-semibold text-slate-800">{label}</span>
                    <span className="block text-[10px] text-slate-500">{desc}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Danger zone */}
        {isEdit && isOwner && (
          <div className="pt-4 border-t border-slate-200">
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/50 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold text-rose-700">Delete project</div>
                <p className="text-[11px] text-rose-600/80">Deletes the project with all its work items and sprints. This cannot be undone.</p>
              </div>
              {projects.length <= 1 ? (
                <span className="text-[11px] text-slate-500">The last project cannot be deleted.</span>
              ) : confirmDelete ? (
                <span className="flex items-center gap-2">
                  <button type="button" onClick={() => { deleteProject(editing!.id); close(); }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer">Yes, delete</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-slate-600 hover:text-slate-900 cursor-pointer">Cancel</button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-semibold cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" /> Delete project
                </button>
              )}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
