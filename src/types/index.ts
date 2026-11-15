export type WorkItemType = 'epic' | 'story' | 'task' | 'bug' | 'spike' | 'subtask' | 'incident';

export type Priority = 'blocker' | 'high' | 'medium' | 'low' | 'lowest';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  /** 'invited' = added to the workspace by email but has not signed up yet. */
  status: 'online' | 'busy' | 'away' | 'offline' | 'invited';
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface CommentItem {
  id: string;
  author: User;
  content: string;
  createdAt: string;
  mentions: string[]; // User IDs or names tagged
}

export interface ActivityItem {
  id: string;
  user: User;
  action: string;
  details?: string;
  timestamp: string;
}

export interface KanbanColumn {
  id: string;
  name: string;
  wipLimit: number; // 0 means no limit
  color: string;
  category: 'todo' | 'in_progress' | 'done';
}

/** Access level of a person inside one project. */
export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ProjectMember {
  userId: string; // references User.id
  role: ProjectRole;
  addedAt: string; // ISO date
}

export interface Project {
  id: string;
  name: string;
  key: string; // e.g. OP, MOB, DATA, SEC
  description: string;
  lead: User;
  template: 'Scrum' | 'Kanban' | 'Bug Tracking';
  allowedIssueTypes: WorkItemType[];
  defaultAssignee: 'unassigned' | 'lead';
  iconGradient: string;
  createdAt: string;
  /** People who can access the project. Older saved projects may not have it yet (see getProjectMembers). */
  members?: ProjectMember[];
}

export interface Issue {
  id: string;
  key: string; // e.g. OP-101, MOB-202
  projectId: string; // references Project.id
  title: string;
  description: string;
  type: WorkItemType;
  priority: Priority;
  status: string; // matches KanbanColumn.id
  assignee: User | null;
  reporter: User;
  sprintId: string | null; // null or 'backlog'
  storyPoints: number;
  labels: string[];
  epicKey?: string;
  epicTitle?: string;
  subtasks: Subtask[];
  comments: CommentItem[];
  activities: ActivityItem[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  projectId: string; // references Project.id
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: 'planned' | 'active' | 'completed';
  completedAt?: string;
  plannedPoints: number;
  completedPoints: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'assignment' | 'mention' | 'priority' | 'sprint' | 'status';
  issueKey?: string;
  author?: User;
}

export type ViewTab =
  | 'dashboard'
  | 'board'
  | 'backlog'
  | 'analytics'
  | 'team'
  | 'projects'
  | 'members'
  | 'profile';

export type SwimlaneType = 'none' | 'assignee' | 'epic' | 'priority';
