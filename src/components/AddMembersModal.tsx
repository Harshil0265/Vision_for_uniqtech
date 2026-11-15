import React, { useMemo, useState } from 'react';
import { Check, Mail, Search, UserPlus } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import type { Project, ProjectRole } from '../types';
import { Alert, Avatar, Field, Modal, PrimaryButton, ROLE_LABELS, SecondaryButton, inputClass } from './ui';

interface AddMembersModalProps {
  project: Project;
  onClose: () => void;
  /** Opens the "invite a person" form for someone who is not in the workspace yet. */
  onInviteNew: () => void;
}

/**
 * Assign people to a project: pick one or more workspace members and a role.
 * Backend: POST /api/projects/{projectId}/members (see docs/API_CONTRACT.md).
 */
export const AddMembersModal: React.FC<AddMembersModalProps> = ({ project, onClose, onInviteNew }) => {
  const { teamMembers, getProjectMembers, addProjectMembers } = useProject();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [role, setRole] = useState<ProjectRole>('member');
  const [error, setError] = useState<string | null>(null);

  const memberIds = useMemo(() => new Set(getProjectMembers(project).map(m => m.user.id)), [project, getProjectMembers]);
  const candidates = teamMembers
    .filter(u => !memberIds.has(u.id))
    .filter(u => {
      const q = query.trim().toLowerCase();
      return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const toggle = (id: string) => setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.length === 0) {
      setError('Select at least one person to add.');
      return;
    }
    addProjectMembers(project.id, selected, role);
    onClose();
  };

  return (
    <Modal
      title={`Add members to ${project.name}`}
      subtitle="Choose people from your workspace and the access they get"
      icon={<UserPlus className="w-4 h-4" />}
      onClose={onClose}
      footer={
        <>
          <span className="text-[11px] text-slate-500 mr-auto">{selected.length} selected</span>
          <SecondaryButton type="button" onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton type="submit" form="add-members-form" disabled={selected.length === 0}>
            Add {selected.length > 0 ? selected.length : ''} {selected.length === 1 ? 'member' : 'members'}
          </PrimaryButton>
        </>
      }
    >
      <form id="add-members-form" onSubmit={submit} className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${inputClass} pl-8`}
            placeholder="Search by name, email or job title"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="Search people"
          />
        </div>

        <div className="border border-slate-200 rounded-xl max-h-64 overflow-y-auto divide-y divide-slate-100" role="listbox" aria-multiselectable="true" aria-label="People">
          {candidates.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500">
              {teamMembers.length === memberIds.size ? 'Everyone in the workspace is already a member.' : 'No one matches your search.'}
            </div>
          ) : (
            candidates.map(u => {
              const isSelected = selected.includes(u.id);
              return (
                <button
                  type="button"
                  key={u.id}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { toggle(u.id); setError(null); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'}`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                    {isSelected && <Check className="w-3 h-3" />}
                  </span>
                  <Avatar name={u.name} src={u.avatar} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-slate-900 truncate flex items-center gap-1.5">
                      {u.name}
                      {u.status === 'invited' && <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-amber-50 text-amber-700 border border-amber-200">Invited</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{u.email} · {u.role}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <button type="button" onClick={onInviteNew} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 cursor-pointer">
          <Mail className="w-3.5 h-3.5" /> Not in the list? Invite someone by email
        </button>

        <Field label="Role for the selected people" hint={ROLE_LABELS[role].description}>
          {({ id, describedBy }) => (
            <select id={id} aria-describedby={describedBy} className={inputClass} value={role} onChange={e => setRole(e.target.value as ProjectRole)}>
              {(['admin', 'member', 'viewer'] as ProjectRole[]).map(r => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
            </select>
          )}
        </Field>
      </form>
    </Modal>
  );
};
