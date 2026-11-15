/**
 * Request / response shapes the frontend expects from the Vision .NET API.
 * This file is the typed version of docs/API_CONTRACT.md — keep the two in sync.
 *
 * Conventions: JSON with camelCase property names (ASP.NET Core default), ids are GUID strings,
 * dates are ISO-8601 strings (dueDate/startDate/endDate are plain "YYYY-MM-DD").
 * Authenticated endpoints expect `Authorization: Bearer <token>`.
 */

import type { KanbanColumn, Priority, ProjectRole, Sprint, User, WorkItemType } from './index';

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

/** Every non-2xx response. `errors` maps a request field name to a message (optional). */
export interface ErrorResponse {
  success: false;
  error: string;
  errors?: Record<string, string>;
}

export type UserDto = User; // id, name, email, avatar, role (job title), department, status

// ---------------------------------------------------------------------------
// Auth  (/api/auth)
// ---------------------------------------------------------------------------

export interface SignupRequest { name: string; email: string; password: string; role?: string; department?: string }
export interface LoginRequest { email: string; password: string }
export interface AuthResponse { success: true; token: string; user: UserDto }
export interface MeResponse { success: true; user: UserDto }
export interface ForgotPasswordRequest { email: string }
export interface ResetPasswordRequest { token: string; newPassword: string }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string }
export interface SuccessResponse { success: true; message?: string }

// ---------------------------------------------------------------------------
// Users  (/api/users)
// ---------------------------------------------------------------------------

export interface UpdateProfileRequest { name: string; role: string; department: string }
export interface UserResponse { success: true; user: UserDto }
export interface UsersResponse { success: true; users: UserDto[] }
export interface InviteUserRequest { name: string; email: string; role: string; department: string; projectId?: string; projectRole?: ProjectRole }

// ---------------------------------------------------------------------------
// Projects & members  (/api/projects)
// ---------------------------------------------------------------------------

export interface ProjectMemberDto { userId: string; role: ProjectRole; addedAt: string; user: UserDto }

export interface ProjectDto {
  id: string;
  name: string;
  key: string;
  description: string;
  lead: UserDto;
  template: 'Scrum' | 'Kanban' | 'Bug Tracking';
  allowedIssueTypes: WorkItemType[];
  defaultAssignee: 'unassigned' | 'lead';
  iconGradient: string;
  createdAt: string;
  members: ProjectMemberDto[];
  /** The caller's role in this project, or null if they are not a member. */
  myRole: ProjectRole | null;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description: string;
  leadId: string;
  template: ProjectDto['template'];
  allowedIssueTypes: WorkItemType[];
  defaultAssignee: ProjectDto['defaultAssignee'];
  iconGradient: string;
  /** Extra people to add (the lead becomes owner and the creator admin automatically). */
  members: { userId: string; role: ProjectRole }[];
}

export type UpdateProjectRequest = Omit<CreateProjectRequest, 'key' | 'members'>;

export interface AddMembersRequest { userIds: string[]; role: ProjectRole }
export interface UpdateMemberRoleRequest { role: ProjectRole }

// ---------------------------------------------------------------------------
// Work items  (/api/projects/{id}/issues, /api/issues/{id})
// ---------------------------------------------------------------------------

export interface CreateIssueRequest {
  type: WorkItemType;
  title: string;
  description: string;
  priority: Priority;
  status: string; // KanbanColumn.id
  assigneeId: string | null;
  sprintId: string | null;
  storyPoints: 0 | 1 | 2 | 3 | 5 | 8 | 13 | 21;
  dueDate: string | null; // YYYY-MM-DD
  labels: string[];
  epicKey: string | null;
}

export type UpdateIssueRequest = Partial<Omit<CreateIssueRequest, 'epicKey'>> & { epicKey?: string | null };

export interface CreateCommentRequest { content: string }
export interface CreateSubtaskRequest { title: string }
export interface UpdateSubtaskRequest { completed: boolean }

// ---------------------------------------------------------------------------
// Sprints and board
// ---------------------------------------------------------------------------

export type SprintDto = Sprint;
export interface CreateSprintRequest { name: string; goal: string; startDate: string; endDate: string }
export type KanbanColumnDto = KanbanColumn;
export interface CreateColumnRequest { name: string; wipLimit: number; color: string; category: KanbanColumn['category'] }
