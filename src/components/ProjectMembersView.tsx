import React, { useState } from 'react';
import { Lock, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { canManageProject, useProject } from '../context/ProjectContext';
import type { ProjectRole } from '../types';
import { AddMembersModal } from './AddMembersModal';
import { InvitePersonModal } from './InvitePersonModal';
import { Alert, Avatar, Card, EmptyState, PageHeader, PrimaryButton, ROLE_LABELS, RoleBadge, SecondaryButton } from './ui';

/** Members of the active project: who has access and with which role. */
export const ProjectMembersView: React.FC = () => {
  const {
    activeProject,
    currentUser,
    issues,
    columns,
    getProjectMembers,
    myRoleIn,
    updateProjectMemberRole,
    removeProjectMember
  } = useProject();

  const [dialog, setDialog] = useState<'add' | 'invite' | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  const members = getProjectMembers(activeProject);
  const myRole = myRoleIn(activeProject);
  const canManage = canManageProject(myRole);
  const doneIds = new Set(columns.filter(c => c.category === 'done').map(c => c.id));
  const openCount = (userId: string) =>
    issues.filter(i => i.projectId === activeProject.id && i.assignee?.id === userId && !doneIds.has(i.status)).length;

  const changeRole = (userId: string, role: ProjectRole) => {
    const result = updateProjectMemberRole(activeProject.id, userId, role);
    setFeedback(result.ok ? { tone: 'success', text: `Role updated to ${ROLE_LABELS[role].label}.` } : { tone: 'error', text: result.error });
  };

  const remove = (userId: string) => {
    const result = removeProjectMember(activeProject.id, userId);
    setConfirmRemove(null);
    setFeedback(result.ok ? { tone: 'success', text: 'Member removed from the project.' } : { tone: 'error', text: result.error });
  };

  // Only owners can hand out or take away the owner role.
  const assignableRoles: ProjectRole[] = myRole === 'owner' ? ['owner', 'admin', 'member', 'viewer'] : ['admin', 'member', 'viewer'];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        <PageHeader
          icon={<Users className="w-5 h-5" />}
          title={`Project members · ${activeProject.name}`}
          description="Assign people to this project and control what they can do."
          actions={canManage && (
            <>
              <SecondaryButton icon={<Mail className="w-3.5 h-3.5" />} onClick={() => setDialog('invite')}>Invite by email</SecondaryButton>
              <PrimaryButton icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setDialog('add')}>Add members</PrimaryButton>
            </>
          )}
        />

        {!canManage && (
          <Alert tone="info">
            <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />
              {myRole ? `You are a ${ROLE_LABELS[myRole].label.toLowerCase()} here. Only owners and admins can change members.` : 'You are not a member of this project. Only owners and admins can change members.'}
            </span>
          </Alert>
        )}
        {feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}

        <Card title={`${members.length} ${members.length === 1 ? 'member' : 'members'}`}>
          {members.length === 0 ? (
            <EmptyState icon={<Users className="w-5 h-5" />} title="No members yet" body="Add people so they can work on this project."
              action={canManage && <PrimaryButton icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setDialog('add')}>Add members</PrimaryButton>} />
          ) : (
            <div className="overflow-x-auto -mx-4">
              <table className="w-full text-left text-xs min-w-[640px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    <th className="font-semibold px-4 py-2">Member</th>
                    <th className="font-semibold px-4 py-2">Job title</th>
                    <th className="font-semibold px-4 py-2">Open items</th>
                    <th className="font-semibold px-4 py-2">Project role</th>
                    <th className="px-4 py-2"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map(({ member, user }) => {
                    const isMe = user.id === currentUser.id;
                    const canEditThis = canManage && (myRole === 'owner' || member.role !== 'owner');
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} src={user.avatar} size="md" />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <span className="truncate">{user.name}</span>
                                {isMe && <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-blue-100 text-blue-700">You</span>}
                                {user.status === 'invited' && <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-amber-50 text-amber-700 border border-amber-200">Invited</span>}
                              </div>
                              <div className="text-[11px] text-slate-500 truncate">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{user.role}</div>
                          <div className="text-[10px] text-slate-400">{user.department}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-700">{openCount(user.id)}</td>
                        <td className="px-4 py-3">
                          {canEditThis ? (
                            <select
                              aria-label={`Role for ${user.name}`}
                              value={member.role}
                              onChange={e => changeRole(user.id, e.target.value as ProjectRole)}
                              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
                            >
                              {(assignableRoles.includes(member.role) ? assignableRoles : [member.role, ...assignableRoles]).map(r => (
                                <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
                              ))}
                            </select>
                          ) : (
                            <RoleBadge role={member.role} />
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {canEditThis && (
                            confirmRemove === user.id ? (
                              <span className="inline-flex items-center gap-2">
                                <button onClick={() => remove(user.id)} className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer">Remove</button>
                                <button onClick={() => setConfirmRemove(null)} className="text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer">Cancel</button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmRemove(user.id)}
                                aria-label={`Remove ${user.name} from the project`}
                                className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="What each role can do">
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(ROLE_LABELS) as ProjectRole[]).map(r => (
              <div key={r} className="p-3 rounded-lg bg-slate-50 border border-slate-200/80">
                <dt><RoleBadge role={r} /></dt>
                <dd className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{ROLE_LABELS[r].description}</dd>
              </div>
            ))}
          </dl>
        </Card>
      </div>

      {dialog === 'add' && (
        <AddMembersModal project={activeProject} onClose={() => setDialog(null)} onInviteNew={() => setDialog('invite')} />
      )}
      {dialog === 'invite' && (
        <InvitePersonModal
          projectId={activeProject.id}
          onClose={() => setDialog(null)}
          onInvited={user => setFeedback({ tone: 'success', text: `${user.name} was invited and added to the project.` })}
        />
      )}
    </div>
  );
};
