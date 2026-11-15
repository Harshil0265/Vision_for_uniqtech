import React, { useState } from 'react';
import { Mail, Search, UserPlus, Users } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { InvitePersonModal } from './InvitePersonModal';
import { Alert, Avatar, EmptyState, PageHeader, PrimaryButton, inputClass } from './ui';

const STATUS_STYLE: Record<string, { dot: string; label: string }> = {
  online: { dot: 'bg-emerald-500', label: 'Online' },
  busy: { dot: 'bg-amber-500', label: 'Busy' },
  away: { dot: 'bg-slate-400', label: 'Away' },
  offline: { dot: 'bg-slate-300', label: 'Offline' },
  invited: { dot: 'bg-amber-300', label: 'Invited' }
};

/** Everyone in the workspace, their workload, and the projects they belong to. */
export const TeamView: React.FC = () => {
  const { teamMembers, issues, columns, projects, currentUser, getProjectMembers } = useProject();
  const [query, setQuery] = useState('');
  const [inviting, setInviting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const doneIds = new Set(columns.filter(c => c.category === 'done').map(c => c.id));
  const membership = new Map<string, string[]>();
  projects.forEach(p => getProjectMembers(p).forEach(({ user }) => {
    membership.set(user.id, [...(membership.get(user.id) ?? []), p.key]);
  }));

  const q = query.trim().toLowerCase();
  const people = teamMembers
    .filter(m => !q || [m.name, m.email, m.role, m.department].some(v => v.toLowerCase().includes(q)))
    .sort((a, b) => (a.id === currentUser.id ? -1 : b.id === currentUser.id ? 1 : a.name.localeCompare(b.name)));

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={<Users className="w-5 h-5" />}
          title="Team directory"
          description={`${teamMembers.length} people in the workspace. Open work and story points are shown per person.`}
          actions={
            <>
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input className={`${inputClass} pl-8 bg-white`} placeholder="Search people" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search people" />
              </div>
              <PrimaryButton icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setInviting(true)}>Invite person</PrimaryButton>
            </>
          }
        />

        {notice && <Alert tone="success">{notice}</Alert>}

        {people.length === 0 ? (
          <EmptyState icon={<Search className="w-5 h-5" />} title="No one matches your search" body="Try a different name, email or job title." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {people.map(member => {
              const open = issues.filter(i => i.assignee?.id === member.id && !doneIds.has(i.status));
              const points = open.reduce((acc, i) => acc + (i.storyPoints || 0), 0);
              const isCurrent = currentUser.id === member.id;
              const status = STATUS_STYLE[member.status] ?? STATUS_STYLE.offline;
              const keys = membership.get(member.id) ?? [];

              return (
                <div
                  key={member.id}
                  className={`p-5 rounded-xl bg-white border transition-all space-y-4 shadow-2xs ${
                    isCurrent ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-slate-200/90 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar name={member.name} src={member.avatar} size="lg" />
                      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${status.dot}`} title={status.label} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="truncate">{member.name}</span>
                        {isCurrent && <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-blue-100 text-blue-700">You</span>}
                        {member.status === 'invited' && <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-amber-50 text-amber-700 border border-amber-200">Invited</span>}
                      </div>
                      <div className="text-[11px] text-slate-600 truncate">{member.role} · {member.department}</div>
                      <a href={`mailto:${member.email}`} className="text-[11px] text-slate-500 hover:text-blue-600 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 shrink-0" /> <span className="truncate">{member.email}</span>
                      </a>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] text-slate-500">Open work items</div>
                      <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">{open.length}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                      <div className="text-[10px] text-slate-500">Story points</div>
                      <div className="font-mono text-sm font-bold text-blue-700 mt-0.5">{points} SP</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Projects</div>
                    {keys.length === 0 ? (
                      <span className="text-[11px] text-slate-400">Not in any project yet</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {keys.map(k => (
                          <span key={k} className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">{k}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {inviting && (
        <InvitePersonModal
          onClose={() => setInviting(false)}
          onInvited={user => setNotice(`${user.name} was invited. Add them to a project from the project's Members page.`)}
        />
      )}
    </div>
  );
};
