import React, { useState } from 'react';
import { Mail } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import type { ProjectRole, User } from '../types';
import { Alert, Field, Modal, PrimaryButton, ROLE_LABELS, SecondaryButton, inputClass, inputErrorClass } from './ui';

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;

interface InvitePersonModalProps {
  onClose: () => void;
  /** When set, the invited person is also added to this project with the chosen role. */
  projectId?: string;
  onInvited?: (user: User) => void;
}

/**
 * Invite someone who is not in the workspace yet (form: name, email, job title, department, project role).
 * Backend: POST /api/users/invite (see docs/API_CONTRACT.md).
 */
export const InvitePersonModal: React.FC<InvitePersonModalProps> = ({ onClose, projectId, onInvited }) => {
  const { inviteTeamMember, addProjectMembers, projects } = useProject();
  const project = projects.find(p => p.id === projectId);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const clearError = (field: string) => { setErrors(({ [field]: _removed, ...rest }) => rest); setFormError(null); };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'Enter the person’s full name.';
    else if (name.trim().length > 80) next.name = 'Use 80 characters or fewer.';
    if (!EMAIL_RE.test(email.trim())) next.email = 'Enter a valid email address.';
    if (jobTitle.length > 60) next.jobTitle = 'Use 60 characters or fewer.';
    if (department.length > 60) next.department = 'Use 60 characters or fewer.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const result = inviteTeamMember({ name, email, role: jobTitle, department });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    if (project) addProjectMembers(project.id, [result.user.id], role, [result.user]);
    onInvited?.(result.user);
    onClose();
  };

  return (
    <Modal
      size="md"
      title="Invite a person"
      subtitle={project ? `They will join ${project.name}` : 'Add someone to the workspace by email'}
      icon={<Mail className="w-4 h-4" />}
      onClose={onClose}
      footer={
        <>
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" form="invite-person-form">Send invitation</PrimaryButton>
        </>
      }
    >
      <form id="invite-person-form" onSubmit={submit} className="space-y-4" noValidate>
        {formError && <Alert tone="error">{formError}</Alert>}

        <Field label="Full name" required error={errors.name}>
          {({ id, describedBy, invalid }) => (
            <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
              value={name} onChange={e => { setName(e.target.value); clearError('name'); }} maxLength={80} autoComplete="off" placeholder="e.g. Priya Patel" />
          )}
        </Field>

        <Field label="Work email" required error={errors.email} hint="They will use this email to sign up and join.">
          {({ id, describedBy, invalid }) => (
            <input id={id} type="email" aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
              value={email} onChange={e => { setEmail(e.target.value); clearError('email'); }} maxLength={254} autoComplete="off" placeholder="name@company.com" />
          )}
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Job title" error={errors.jobTitle}>
            {({ id, describedBy, invalid }) => (
              <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                value={jobTitle} onChange={e => { setJobTitle(e.target.value); clearError('jobTitle'); }} maxLength={60} placeholder="e.g. QA Engineer" />
            )}
          </Field>
          <Field label="Department" error={errors.department}>
            {({ id, describedBy, invalid }) => (
              <input id={id} aria-describedby={describedBy} aria-invalid={invalid} className={`${inputClass} ${invalid ? inputErrorClass : ''}`}
                value={department} onChange={e => { setDepartment(e.target.value); clearError('department'); }} maxLength={60} placeholder="e.g. Engineering" />
            )}
          </Field>
        </div>

        {project && (
          <Field label={`Role in ${project.key}`} hint={ROLE_LABELS[role].description}>
            {({ id, describedBy }) => (
              <select id={id} aria-describedby={describedBy} className={inputClass} value={role} onChange={e => setRole(e.target.value as ProjectRole)}>
                {(['admin', 'member', 'viewer'] as ProjectRole[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
              </select>
            )}
          </Field>
        )}

        <p className="text-[11px] text-slate-500">
          They appear as <span className="font-semibold">Invited</span> until they create an account with this email.
        </p>
      </form>
    </Modal>
  );
};
