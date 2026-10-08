import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Project, ProjectRole } from '../types';
import { X, Mail, UserPlus, Trash2, Shield } from 'lucide-react';
import { canManageMembers } from '../utils/permissions';

interface InviteMemberModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({ project, isOpen, onClose }) => {
  const { inviteMember, removeMember, updateMemberRole, currentUser } = useProject();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ProjectRole>('member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen || !project) return null;

  // Get current user's role in this project
  const currentUserMember = project.members?.find(m => m.userId === currentUser.id);
  const currentUserRole = currentUserMember?.role || 'viewer';
  const canManage = canManageMembers(currentUserRole);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    const result = await inviteMember(project.id, email.trim(), role);

    setIsLoading(false);

    if (result.success) {
      setSuccessMessage(`Successfully invited ${email} as ${role}`);
      setEmail('');
      setRole('member');
      setTimeout(() => setSuccessMessage(null), 3000);
    } else {
      setError(result.error || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!canManage) return;
    
    if (confirm('Are you sure you want to remove this member from the project?')) {
      await removeMember(project.id, userId);
    }
  };

  const handleRoleChange = async (userId: string, newRole: ProjectRole) => {
    if (!canManage) return;
    await updateMemberRole(project.id, userId, newRole);
  };

  const getRoleBadgeColor = (memberRole: ProjectRole) => {
    switch (memberRole) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'admin':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'member':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'viewer':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              <span>Project Members</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {project.name} ({project.key})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current Members */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Current Members ({project.members?.length || 0})
            </h3>
            
            {project.members && project.members.length > 0 ? (
              <div className="space-y-2">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={member.user.avatar}
                        alt={member.user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-white"
                      />
                      <div>
                        <div className="font-medium text-sm text-slate-900">{member.user.name}</div>
                        <div className="text-xs text-slate-500">{member.user.email}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canManage && member.role !== 'owner' ? (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.userId, e.target.value as ProjectRole)}
                          className="text-xs font-semibold px-2 py-1 rounded-md border capitalize cursor-pointer"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md border capitalize ${getRoleBadgeColor(member.role)}`}>
                          <Shield className="w-3 h-3 inline mr-1" />
                          {member.role}
                        </span>
                      )}

                      {canManage && member.role !== 'owner' && member.userId !== currentUser.id && (
                        <button
                          onClick={() => handleRemoveMember(member.userId)}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                No members yet. Invite someone to get started!
              </div>
            )}
          </div>

          {/* Invite New Member */}
          {canManage && (
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Invite New Member
              </h3>

              <form onSubmit={handleInvite} className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="colleague@company.com"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-600">Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as ProjectRole)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 capitalize cursor-pointer"
                    disabled={isLoading}
                  >
                    <option value="admin">Admin - Can manage members and settings</option>
                    <option value="member">Member - Can create and edit issues</option>
                    <option value="viewer">Viewer - Read-only access</option>
                  </select>
                </div>

                {error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                    {error}
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
                    {successMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending Invitation...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Send Invitation</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-xs text-slate-500 text-center">
                The invited user will receive an email with instructions to join this project.
              </p>
            </div>
          )}

          {!canManage && (
            <div className="text-center py-4 text-sm text-slate-500">
              Only project owners and admins can invite new members.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
