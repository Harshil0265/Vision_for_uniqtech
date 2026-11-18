import React, { useMemo, useState } from 'react';
import { ListPlus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { canEditWork, useProject } from '../context/ProjectContext';
import type { Priority, WorkItemType } from '../types';
import { WorkItemIcon } from './WorkItemIcon';
import { Alert, Avatar, Field, Modal, PrimaryButton, SecondaryButton, inputClass, inputErrorClass } from './ui';

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'blocker', label: 'Blocker — stops work, fix now' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
  { value: 'lowest', label: 'Lowest' }
];

const POINTS = [0, 1, 2, 3, 5, 8, 13, 21];

const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Create a work item (task, story, bug, ...).
 * Backend: POST /api/projects/{projectId}/issues (see docs/API_CONTRACT.md).
 */
export const CreateIssueModal: React.FC = () => {
  const { isCreateModalOpen } = useProject();
  if (!isCreateModalOpen) return null;
  return <IssueForm />;
};

const IssueForm: React.FC = () => {
  const {
    setIsCreateModalOpen,
    createIssue,
    projects,
    activeProject,
    sprints,
    activeSprint,
    columns,
    issues,
    currentUser,
    getProjectMembers,
    myRoleIn,
    setActiveTab
  } = useProject();

  const close = () => setIsCreateModalOpen(false);

  // Only projects where the current user may create work.
  const writableProjects = projects.filter(p => canEditWork(myRoleIn(p)));
  const initialProject = writableProjects.find(p => p.id === activeProject.id) ?? writableProjects[0];

  const [projectId, setProjectId] = useState(initialProject?.id ?? '');
  const project = projects.find(p => p.id === projectId);

  const defaultStatus = columns.find(c => c.id === 'todo')?.id ?? columns.find(c => c.category === 'todo')?.id ?? columns[0]?.id ?? 'todo';

  const preferredType = (types: WorkItemType[]) => (types.includes('task') ? 'task' : types[0] ?? 'task');
  const [type, setType] = useState<WorkItemType>(preferredType(initialProject?.allowedIssueTypes ?? []));
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [assigneeId, setAssigneeId] = useState(
    initialProject?.defaultAssignee === 'lead' ? initialProject.lead.id : 'unassigned'
  );
  const [sprintId, setSprintId] = useState(
    activeSprint && initialProject && activeSprint.projectId === initialProject.id ? activeSprint.id : 'backlog'
  );
  const [storyPoints, setStoryPoints] = useState(3);
  const [status, setStatus] = useState(defaultStatus);
  const [dueDate, setDueDate] = useState('');
  const [labelDraft, setLabelDraft] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [epicKey, setEpicKey] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const clearError = (field: string) => setErrors(({ [field]: _removed, ...rest }) => rest);

  const assignable = useMemo(
    () => (project ? getProjectMembers(project).filter(m => m.member.role !== 'viewer').map(m => m.user) : []),
    [project, getProjectMembers]
  );
  const projectSprints = sprints.filter(s => s.projectId === projectId && s.status !== 'completed');
  const epics = issues.filter(i => i.projectId === projectId && i.type === 'epic');

  const changeProject = (id: string) => {
    const next = projects.find(p => p.id === id);
    setProjectId(id);
    if (!next) return;
    if (!next.allowedIssueTypes.includes(type)) setType(preferredType(next.allowedIssueTypes));
    setAssigneeId(next.defaultAssignee === 'lead' ? next.lead.id : 'unassigned');
    const sprint = sprints.find(s => s.projectId === id && s.status === 'active');
    setSprintId(sprint ? sprint.id : 'backlog');
    setEpicKey('');
  };

  const addLabel = (raw: string) => {
    const label = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!label) return;
    if (label.length > 24) { setErrors(e => ({ ...e, labels: 'Labels can be up to 24 characters.' })); return; }
    if (labels.length >= 10) { setErrors(e => ({ ...e, labels: 'Use up to 10 labels.' })); return; }
    if (!labels.includes(label)) setLabels(prev => [...prev, label]);
    setLabelDraft('');
    setErrors(({ labels: _drop, ...rest }) => rest);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    const next: Record<string, string> = {};
    if (!title.trim()) next.title = 'Enter a short summary of the work.';
    else if (title.trim().length > 200) next.title = 'Use 200 characters or fewer.';
    if (description.length > 5000) next.description = 'Use 5000 characters or fewer.';
    if (dueDate && dueDate < todayIso()) next.dueDate = 'The due date cannot be in the past.';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      toast.error(Object.values(next)[0]);
      return;
    }

    const pendingLabel = labelDraft.trim().toLowerCase().replace(/\s+/g, '-');
    const finalLabels = pendingLabel && !labels.includes(pendingLabel) && pendingLabel.length <= 24 && labels.length < 10
      ? [...labels, pendingLabel] : labels;
    const epic = epics.find(i => i.key === epicKey);

    setSubmitting(true);
    const created = await createIssue({
      projectId,
      type,
      title: title.trim(),
      description: description.trim(),
      priority,
      assignee: assignable.find(u => u.id === assigneeId) ?? null,
      sprintId: sprintId === 'backlog' ? null : sprintId,
      storyPoints,
      status,
      dueDate: dueDate || undefined,
      labels: finalLabels,
      epicKey: epic?.key,
      epicTitle: epic?.title
    });
    setSubmitting(false);
    if (created) close();
  };

  if (!project) {
    return (
      <Modal size="md" title="Create work item" icon={<ListPlus className="w-4 h-4" />} onClose={close}
        footer={<>
          <SecondaryButton onClick={close}>Close</SecondaryButton>
          <PrimaryButton onClick={() => { close(); setActiveTab('projects'); }}>Go to projects</PrimaryButton>
        </>}>
        <Alert tone="info">
          You can only create work items in projects where you are an owner, admin or member.
          Create a project, or ask a project admin to add you.
        </Alert>
      </Modal>
    );
  }

  const field = (invalid: boolean) => `${inputClass} ${invalid ? inputErrorClass : ''}`;

  return (
    <Modal
      size="xl"
      title="Create work item"
      subtitle={`Will be created as ${project.key}-… in ${project.name}`}
      icon={<ListPlus className="w-4 h-4" />}
      onClose={close}
      footer={
        <>
          <span className="text-[11px] text-slate-500 mr-auto hidden sm:flex items-center gap-1.5">
            Reporter: <Avatar name={currentUser.name} src={currentUser.avatar} size="xs" /> {currentUser.name}
          </span>
          <SecondaryButton type="button" onClick={close}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" form="issue-form" disabled={submitting}>{submitting ? 'Creating…' : 'Create work item'}</PrimaryButton>
        </>
      }
    >
      <form id="issue-form" onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Project" required>
            {({ id }) => (
              <select id={id} className={inputClass} value={projectId} onChange={e => changeProject(e.target.value)}>
                {writableProjects.map(p => <option key={p.id} value={p.id}>{p.name} ({p.key})</option>)}
              </select>
            )}
          </Field>
          <Field label="Status">
            {({ id }) => (
              <select id={id} className={inputClass} value={status} onChange={e => setStatus(e.target.value)}>
                {columns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
          </Field>
        </div>

        <fieldset>
          <legend className="block text-xs font-semibold text-slate-700 mb-1.5">Work item type <span className="text-rose-500">*</span></legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {project.allowedIssueTypes.map(t => (
              <label key={t} className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium capitalize transition-all cursor-pointer ${
                type === t ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-2xs' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}>
                <input type="radio" name="type" value={t} checked={type === t} onChange={() => setType(t)} className="sr-only" />
                <WorkItemIcon type={t} className="w-3.5 h-3.5" />
                {t}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Summary" required error={errors.title} hint={!errors.title ? `${title.length}/200` : undefined}>
          {({ id, describedBy, invalid }) => (
            <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={field(invalid)} maxLength={200}
              placeholder="e.g. Add password reset to the sign-in page" value={title} onChange={e => { setTitle(e.target.value); clearError('title'); }} />
          )}
        </Field>

        <Field label="Description" error={errors.description}>
          {({ id, describedBy, invalid }) => (
            <textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} rows={4} maxLength={5000} className={field(invalid)}
              placeholder="Background, what needs to be done, and how we know it is finished (acceptance criteria)."
              value={description} onChange={e => { setDescription(e.target.value); clearError('description'); }} />
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Priority">
            {({ id }) => (
              <select id={id} className={inputClass} value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            )}
          </Field>
          <Field label="Assignee" hint={assignable.length === 0 ? 'Add project members to assign work.' : 'Project members only'}>
            {({ id, describedBy }) => (
              <select id={id} aria-describedby={describedBy} className={inputClass} value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="unassigned">Unassigned</option>
                {assignable.map(u => <option key={u.id} value={u.id}>{u.name}{u.id === currentUser.id ? ' (me)' : ''}</option>)}
              </select>
            )}
          </Field>
          <Field label="Due date" error={errors.dueDate}>
            {({ id, describedBy, invalid }) => (
              <input id={id} type="date" aria-describedby={describedBy} aria-invalid={invalid} className={field(invalid)} min={todayIso()}
                value={dueDate} onChange={e => { setDueDate(e.target.value); clearError('dueDate'); }} />
            )}
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Sprint">
            {({ id }) => (
              <select id={id} className={inputClass} value={sprintId} onChange={e => setSprintId(e.target.value)}>
                <option value="backlog">Backlog (no sprint)</option>
                {projectSprints.map(s => <option key={s.id} value={s.id}>{s.name}{s.status === 'active' ? ' (active)' : ''}</option>)}
              </select>
            )}
          </Field>
          <Field label="Story points">
            {({ id }) => (
              <select id={id} className={`${inputClass} font-mono`} value={storyPoints} onChange={e => setStoryPoints(Number(e.target.value))}>
                {POINTS.map(p => <option key={p} value={p}>{p === 0 ? 'Not estimated' : `${p} points`}</option>)}
              </select>
            )}
          </Field>
          <Field label="Parent epic" hint={type === 'epic' ? 'An epic cannot belong to another epic.' : epics.length === 0 ? 'No epics in this project yet.' : undefined}>
            {({ id, describedBy }) => (
              <select id={id} aria-describedby={describedBy} className={inputClass} value={epicKey} onChange={e => setEpicKey(e.target.value)}
                disabled={type === 'epic' || epics.length === 0}>
                <option value="">None</option>
                {epics.map(ep => <option key={ep.id} value={ep.key}>{ep.key} · {ep.title}</option>)}
              </select>
            )}
          </Field>
        </div>

        <Field label="Labels" error={errors.labels} hint="Press Enter or comma to add. Up to 10.">
          {({ id, describedBy, invalid }) => (
            <div className={`${field(invalid)} flex flex-wrap items-center gap-1.5 py-1.5`}>
              {labels.map(l => (
                <span key={l} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[11px] text-slate-700">
                  {l}
                  <button type="button" onClick={() => setLabels(prev => prev.filter(x => x !== l))} aria-label={`Remove label ${l}`} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                id={id}
                aria-describedby={describedBy}
                className="flex-1 min-w-[8rem] bg-transparent text-xs focus:outline-none"
                placeholder={labels.length === 0 ? 'e.g. frontend, login' : ''}
                value={labelDraft}
                onChange={e => setLabelDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addLabel(labelDraft); }
                  else if (e.key === 'Backspace' && !labelDraft && labels.length) setLabels(prev => prev.slice(0, -1));
                }}
                onBlur={() => addLabel(labelDraft)}
              />
            </div>
          )}
        </Field>
      </form>
    </Modal>
  );
};
