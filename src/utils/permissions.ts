/**
 * Role-based permission checking utilities
 */

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Check if user can invite members to a project
 */
export function canInviteMembers(userRole: ProjectRole): boolean {
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Check if user can edit issues in a project
 */
export function canEditIssue(userRole: ProjectRole): boolean {
  return userRole === 'owner' || userRole === 'admin' || userRole === 'member';
}

/**
 * Check if user can delete a project
 */
export function canDeleteProject(userRole: ProjectRole): boolean {
  return userRole === 'owner';
}

/**
 * Check if user can manage (add/remove/edit) project members
 */
export function canManageMembers(userRole: ProjectRole): boolean {
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Check if user can create sprints in a project
 */
export function canCreateSprint(userRole: ProjectRole): boolean {
  return userRole === 'owner' || userRole === 'admin';
}

/**
 * Get user's role in a project
 * @param project The project to check
 * @param userId The user's ID
 * @returns The user's role in the project, or null if not a member
 */
export function getUserRoleInProject(project: { members?: { userId: string; role: ProjectRole }[] }, userId: string): ProjectRole | null {
  if (!project.members) return null;
  const member = project.members.find(m => m.userId === userId);
  return member ? member.role : null;
}
