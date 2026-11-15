import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { withAvatar } from '../lib/avatar';
import {
  Issue,
  KanbanColumn,
  Sprint,
  User,
  AppNotification,
  ViewTab,
  SwimlaneType,
  WorkItemType,
  Priority,
  Project,
  ProjectMember,
  ProjectRole
} from '../types';
import {
  TEAM_MEMBERS,
  INITIAL_PROJECTS,
  INITIAL_COLUMNS,
  INITIAL_SPRINTS,
  INITIAL_ISSUES,
  INITIAL_NOTIFICATIONS
} from '../data/mockData';

interface ProjectContextType {
  // Data
  projects: Project[];
  activeProject: Project;
  setActiveProject: (p: Project) => void;
  issues: Issue[];
  columns: KanbanColumn[];
  sprints: Sprint[];
  activeSprint: Sprint | undefined;
  teamMembers: User[];
  currentUser: User;
  notifications: AppNotification[];
  unreadNotificationCount: number;
  selectedIssue: Issue | null;
  recentActivity: { text: string; time: string; key?: string }[];
  realtimeStatus: 'connected' | 'syncing';
  lastSyncTime: Date;

  // View state & Filters
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  swimlane: SwimlaneType;
  setSwimlane: (s: SwimlaneType) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterAssignee: string;
  setFilterAssignee: (a: string) => void;
  filterPriority: string;
  setFilterPriority: (p: string) => void;
  filterType: string;
  setFilterType: (t: string) => void;
  filterOnlyMyIssues: boolean;
  setFilterOnlyMyIssues: (v: boolean) => void;
  clearFilters: () => void;

  // Modals & Selection
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isCreateProjectModalOpen: boolean;
  setIsCreateProjectModalOpen: (open: boolean) => void;
  /** Project whose settings are open in the project form (null = closed / creating a new one). */
  editingProjectId: string | null;
  openProjectSettings: (projectId: string | null) => void;
  setSelectedIssue: (issue: Issue | null) => void;

  // Actions
  createProject: (data: Partial<Project>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createIssue: (issue: Partial<Issue>) => Promise<Issue>;
  updateIssue: (id: string, updates: Partial<Issue>) => void;
  deleteIssue: (id: string) => void;
  moveIssueStatus: (issueId: string, newStatus: string) => void;
  moveIssueSprint: (issueId: string, targetSprintId: string | null) => void;
  addComment: (issueId: string, content: string) => void;
  toggleSubtask: (issueId: string, subtaskId: string) => void;
  addSubtask: (issueId: string, title: string) => void;
  createSprint: (name: string, goal: string, startDate: string, endDate: string) => void;
  startSprint: (sprintId: string) => void;
  completeSprint: (sprintId: string) => void;
  addColumn: (name: string, wipLimit: number, color: string, category?: 'todo' | 'in_progress' | 'done') => void;
  updateColumn: (id: string, updates: Partial<KanbanColumn>) => void;
  deleteColumn: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Project members (assigning people to a project)
  getProjectMembers: (project: Project) => { member: ProjectMember; user: User }[];
  myRoleIn: (project: Project) => ProjectRole | null;
  /** `people` helps name users added in the same step they were invited (state not updated yet). */
  addProjectMembers: (projectId: string, userIds: string[], role: ProjectRole, people?: User[]) => void;
  updateProjectMemberRole: (projectId: string, userId: string, role: ProjectRole) => ActionResult;
  removeProjectMember: (projectId: string, userId: string) => ActionResult;
  isProjectKeyTaken: (key: string, exceptProjectId?: string) => boolean;

  // Workspace people
  inviteTeamMember: (data: { name: string; email: string; role: string; department: string }) => { ok: true; user: User } | { ok: false; error: string };
}

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Reads saved state, falling back to the older 'omniplane_*' keys, then to the demo data. */
function loadSaved<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`vision_${key}`) ?? localStorage.getItem(`omniplane_${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const ROLE_RANK: Record<ProjectRole, number> = { viewer: 0, member: 1, admin: 2, owner: 3 };
export const canManageProject = (role: ProjectRole | null) => !!role && ROLE_RANK[role] >= ROLE_RANK.admin;
export const canEditWork = (role: ProjectRole | null) => !!role && ROLE_RANK[role] >= ROLE_RANK.member;

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// The mock API's seeded demo accounts correspond to people in the demo workspace data.
// Linking them keeps the issues, comments and notifications that belong to those people.
const SEEDED_ACCOUNT_TO_TEAM_MEMBER: Record<string, string> = {
  '00000000-0000-0000-0000-000000000001': 'user-1', // Sarah Jenkins
  '00000000-0000-0000-0000-000000000002': 'user-2' // Alex Rivera
};

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user: authUser } = useAuth();

  // Projects
  // Workspace data is kept in this browser (localStorage) until the backend exposes the data endpoints
  // described in docs/API_CONTRACT.md.
  const [projects, setProjects] = useState<Project[]>(() => loadSaved('projects', INITIAL_PROJECTS));

  const [activeProject, setActiveProject] = useState<Project>(() => {
    const savedId = localStorage.getItem('vision_active_project_id') ?? localStorage.getItem('omniplane_active_project_id');
    return projects.find(p => p.id === savedId) || projects[0] || INITIAL_PROJECTS[0];
  });

  const [issues, setIssues] = useState<Issue[]>(() => loadSaved('issues', INITIAL_ISSUES));
  const [columns, setColumns] = useState<KanbanColumn[]>(() => loadSaved('columns', INITIAL_COLUMNS));
  const [sprints, setSprints] = useState<Sprint[]>(() => loadSaved('sprints', INITIAL_SPRINTS));
  const [teamMembers, setTeamMembers] = useState<User[]>(() => loadSaved('team_members', TEAM_MEMBERS));
  const [currentUser, setCurrentUser] = useState<User>(() => loadSaved('current_user', TEAM_MEMBERS[1]));
  const [notifications, setNotifications] = useState<AppNotification[]>(() => loadSaved('notifications', INITIAL_NOTIFICATIONS));

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<ViewTab>('dashboard');
  const [swimlane, setSwimlane] = useState<SwimlaneType>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOnlyMyIssues, setFilterOnlyMyIssues] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);

  // Realtime simulation state
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'syncing'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [recentActivity, setRecentActivity] = useState<{ text: string; time: string; key?: string }[]>([
    { text: 'Workspace loaded from local browser storage', time: 'Just now' },
    { text: 'Sprint 24 active with 34 committed story points in Vision', time: '5m ago' }
  ]);

  // Persist state
  useEffect(() => {
    localStorage.setItem('vision_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('vision_active_project_id', activeProject.id);
  }, [activeProject]);

  // If the active project was edited or deleted, follow the stored copy.
  useEffect(() => {
    const fresh = projects.find(p => p.id === activeProject.id);
    if (!fresh) {
      if (projects[0]) setActiveProject(projects[0]);
    } else if (fresh !== activeProject) {
      setActiveProject(fresh);
    }
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('vision_issues', JSON.stringify(issues));
  }, [issues]);

  useEffect(() => {
    localStorage.setItem('vision_columns', JSON.stringify(columns));
  }, [columns]);

  useEffect(() => {
    localStorage.setItem('vision_sprints', JSON.stringify(sprints));
  }, [sprints]);

  useEffect(() => {
    localStorage.setItem('vision_team_members', JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem('vision_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // A different account signing in (or signing out) starts from a clean view, not the last user's screen.
  const viewOwner = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const id = authUser?.id ?? null;
    if (viewOwner.current !== undefined && viewOwner.current !== id) {
      setActiveTab('dashboard');
      setSelectedIssue(null);
      setIsCreateModalOpen(false);
      setIsCreateProjectModalOpen(false);
      setEditingProjectId(null);
      setSearchQuery('');
      setFilterAssignee('all');
      setFilterPriority('all');
      setFilterType('all');
      setFilterOnlyMyIssues(false);
    }
    viewOwner.current = id;
  }, [authUser?.id]);

  // The signed-in account is the current user.
  useEffect(() => {
    if (!authUser) return;
    const linkedId = SEEDED_ACCOUNT_TO_TEAM_MEMBER[authUser.id];
    const linked = linkedId ? TEAM_MEMBERS.find(m => m.id === linkedId) : undefined;
    const profile = { name: authUser.name, email: authUser.email, role: authUser.role, department: authUser.department };
    // Seeded demo accounts keep their workspace identity (id, photo); everyone else is used as-is.
    const me: User = withAvatar(linked ? { ...linked, ...profile, status: 'online' } : { ...authUser, status: 'online' });
    setCurrentUser(me);

    // Someone invited by email who now signs in with that address takes over the invitation:
    // their project memberships and assigned work move to the real account.
    const invited = teamMembers.find(u => u.status === 'invited' && u.id !== me.id && u.email.toLowerCase() === me.email.toLowerCase());
    if (invited) {
      setProjects(ps => ps.map(p => (p.members?.some(m => m.userId === invited.id)
        ? { ...p, members: p.members.map(m => (m.userId === invited.id ? { ...m, userId: me.id } : m)) }
        : p)));
      setIssues(is => is.map(i => (i.assignee?.id === invited.id ? { ...i, assignee: me } : i)));
    }
    setTeamMembers(prev => {
      const base = invited ? prev.filter(u => u.id !== invited.id) : prev;
      return base.some(u => u.id === me.id) ? base.map(u => (u.id === me.id ? { ...u, ...me } : u)) : [me, ...base];
    });
  }, [authUser]);

  useEffect(() => {
    localStorage.setItem('vision_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Sync selected issue if issues change
  useEffect(() => {
    if (selectedIssue) {
      const refreshed = issues.find(i => i.id === selectedIssue.id);
      if (refreshed) {
        setSelectedIssue(refreshed);
      }
    }
  }, [issues]);

  // Periodic heartbeat (sync status indicator)
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeStatus('syncing');
      setTimeout(() => {
        setRealtimeStatus('connected');
        setLastSyncTime(new Date());
      }, 600);
    }, 25000);
    return () => clearInterval(interval);
  }, []);

  const activeSprint = useMemo(() => {
    return sprints.find(s => s.status === 'active' && s.projectId === activeProject.id);
  }, [sprints, activeProject]);

  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterAssignee('all');
    setFilterPriority('all');
    setFilterType('all');
    setFilterOnlyMyIssues(false);
  };

  const initialMembers = (lead: User): ProjectMember[] => {
    const now = new Date().toISOString();
    const list: ProjectMember[] = [{ userId: lead.id, role: 'owner', addedAt: now }];
    if (lead.id !== currentUser.id) list.push({ userId: currentUser.id, role: 'admin', addedAt: now });
    return list;
  };

  const createProject = (data: Partial<Project>): Project => {
    const key = (data.key || 'PROJ').toUpperCase().trim();
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: data.name || 'Untitled Project',
      key,
      description: data.description || '',
      lead: data.lead || currentUser,
      template: data.template || 'Scrum',
      allowedIssueTypes: data.allowedIssueTypes && data.allowedIssueTypes.length > 0
        ? data.allowedIssueTypes
        : ['epic', 'story', 'task', 'bug'],
      defaultAssignee: data.defaultAssignee || 'unassigned',
      iconGradient: data.iconGradient || 'from-blue-600 via-indigo-600 to-sky-500',
      createdAt: new Date().toISOString(),
      members: data.members && data.members.length > 0 ? data.members : initialMembers(data.lead || currentUser)
    };

    setProjects(prev => [...prev, newProject]);
    setActiveProject(newProject);

    // Create an initial sprint if Scrum
    if (newProject.template === 'Scrum') {
      const initialSprint: Sprint = {
        id: `sprint-${Date.now()}`,
        projectId: newProject.id,
        name: `${newProject.name.split(' ')[0]} Sprint 1`,
        goal: 'Initial sprint delivery and architecture foundation.',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        status: 'active',
        plannedPoints: 13,
        completedPoints: 0
      };
      setSprints(prev => [...prev, initialSprint]);
    }

    setRecentActivity(prev => [
      { text: `${currentUser.name} created new project: ${newProject.name} [${newProject.key}]`, time: 'Just now' },
      ...prev
    ]);

    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates };
        if (activeProject.id === id) {
          setActiveProject(updated);
        }
        return updated;
      })
    );
  };

  const deleteProject = (id: string) => {
    if (projects.length <= 1) {
      alert('Cannot delete the only remaining project in workspace.');
      return;
    }
    const remaining = projects.filter(p => p.id !== id);
    setProjects(remaining);
    if (activeProject.id === id) {
      setActiveProject(remaining[0]);
    }
    // Delete issues & sprints belonging to this project
    setIssues(prev => prev.filter(i => i.projectId !== id));
    setSprints(prev => prev.filter(s => s.projectId !== id));
  };

  const createIssue = async (issueData: Partial<Issue>): Promise<Issue> => {
    const targetProjectId = issueData.projectId || activeProject.id;
    const targetProject = projects.find(p => p.id === targetProjectId) || activeProject;

    const highest = issues
      .filter(i => i.projectId === targetProjectId)
      .reduce((max, i) => Math.max(max, Number(i.key.split('-').pop()) || 0), 100);
    const key = `${targetProject.key}-${highest + 1}`;

    const newIssue: Issue = {
      id: `issue-${Date.now()}`,
      key,
      projectId: targetProjectId,
      title: issueData.title || 'Untitled Work Item',
      description: issueData.description || '',
      type: (issueData.type as WorkItemType) || 'task',
      priority: (issueData.priority as Priority) || 'medium',
      status: issueData.status || (columns[1] ? columns[1].id : 'todo'),
      assignee: issueData.assignee || (targetProject.defaultAssignee === 'lead' ? targetProject.lead : null),
      reporter: currentUser,
      sprintId: issueData.sprintId !== undefined ? issueData.sprintId : (activeSprint ? activeSprint.id : 'backlog'),
      storyPoints: issueData.storyPoints ?? 3,
      labels: issueData.labels || [],
      subtasks: issueData.subtasks || [],
      comments: [],
      activities: [
        {
          id: `act-${Date.now()}`,
          user: currentUser,
          action: 'created work item',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: issueData.dueDate
    };

    setIssues(prev => [newIssue, ...prev]);

    // Add activity stream
    setRecentActivity(prev => [
      { text: `${currentUser.name} created ${key}: ${newIssue.title}`, time: 'Just now', key },
      ...prev.slice(0, 20)
    ]);

    // In-app notification
    if (newIssue.assignee && newIssue.assignee.email) {
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}`,
          title: 'New Issue Assigned',
          message: `${currentUser.name} assigned ${key} to ${newIssue.assignee?.name}`,
          timestamp: 'Just now',
          read: false,
          type: 'assignment',
          issueKey: key,
          author: currentUser
        },
        ...prev
      ]);
    }

    return newIssue;
  };

  const updateIssue = (id: string, updates: Partial<Issue>) => {
    setIssues(prev =>
      prev.map(issue => {
        if (issue.id !== id) return issue;

        const updated = {
          ...issue,
          ...updates,
          updatedAt: new Date().toISOString()
        };

        // If priority changed to blocker, trigger in-app notification
        if (updates.priority && updates.priority === 'blocker' && issue.priority !== 'blocker') {
          setNotifications(prev => [
            {
              id: `notif-${Date.now()}`,
              title: 'Critical Blocker Escalation',
              message: `${issue.key} escalated to Blocker by ${currentUser.name}`,
              timestamp: 'Just now',
              read: false,
              type: 'priority',
              issueKey: issue.key,
              author: currentUser
            },
            ...prev
          ]);
        }

        return updated;
      })
    );
  };

  const deleteIssue = (id: string) => {
    const target = issues.find(i => i.id === id);
    setIssues(prev => prev.filter(i => i.id !== id));
    if (selectedIssue?.id === id) {
      setSelectedIssue(null);
    }
    if (target) {
      setRecentActivity(prev => [
        { text: `${currentUser.name} deleted work item ${target.key}`, time: 'Just now', key: target.key },
        ...prev
      ]);
    }
  };

  const moveIssueStatus = (issueId: string, newStatus: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue || issue.status === newStatus) return;

    const oldColumnName = columns.find(c => c.id === issue.status)?.name || issue.status;
    const newColumnName = columns.find(c => c.id === newStatus)?.name || newStatus;

    const activity: { id: string; user: User; action: string; timestamp: string } = {
      id: `act-${Date.now()}`,
      user: currentUser,
      action: `transitioned status from ${oldColumnName} to ${newColumnName}`,
      timestamp: new Date().toISOString()
    };

    setIssues(prev =>
      prev.map(item =>
        item.id === issueId
          ? {
              ...item,
              status: newStatus,
              activities: [activity, ...item.activities],
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );

    setRecentActivity(prev => [
      { text: `${issue.key} moved to ${newColumnName} by ${currentUser.name}`, time: 'Just now', key: issue.key },
      ...prev.slice(0, 20)
    ]);
  };

  const moveIssueSprint = (issueId: string, targetSprintId: string | null) => {
    setIssues(prev =>
      prev.map(i =>
        i.id === issueId
          ? {
              ...i,
              sprintId: targetSprintId,
              updatedAt: new Date().toISOString()
            }
          : i
      )
    );
  };

  const addComment = (issueId: string, content: string) => {
    const issue = issues.find(i => i.id === issueId);
    if (!issue || !content.trim()) return;

    // Detect @mentions (e.g., @alex.rivera, @sarah.jenkins)
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
    const matches = Array.from(content.matchAll(mentionRegex)).map(m => m[1]);

    const newComment = {
      id: `comment-${Date.now()}`,
      author: currentUser,
      content,
      createdAt: new Date().toISOString(),
      mentions: matches
    };

    setIssues(prev =>
      prev.map(item =>
        item.id === issueId
          ? {
              ...item,
              comments: [...item.comments, newComment],
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );

    // If team members were mentioned, send in-app notifications
    matches.forEach(username => {
      const targetUser = teamMembers.find(
        m => m.email.includes(username) || m.name.toLowerCase().replace(/\s+/g, '.').includes(username)
      );
      if (targetUser && targetUser.id !== currentUser.id) {
        setNotifications(prev => [
          {
            id: `notif-${Date.now()}-${Math.random()}`,
            title: `Mentioned in ${issue.key}`,
            message: `${currentUser.name}: "${content.substring(0, 60)}..."`,
            timestamp: 'Just now',
            read: false,
            type: 'mention',
            issueKey: issue.key,
            author: currentUser
          },
          ...prev
        ]);
      }
    });
  };

  const toggleSubtask = (issueId: string, subtaskId: string) => {
    setIssues(prev =>
      prev.map(i => {
        if (i.id !== issueId) return i;
        const subtasks = i.subtasks.map(st =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...i, subtasks, updatedAt: new Date().toISOString() };
      })
    );
  };

  const addSubtask = (issueId: string, title: string) => {
    if (!title.trim()) return;
    setIssues(prev =>
      prev.map(i => {
        if (i.id !== issueId) return i;
        const newSubtask = {
          id: `st-${Date.now()}`,
          title: title.trim(),
          completed: false
        };
        return {
          ...i,
          subtasks: [...i.subtasks, newSubtask],
          updatedAt: new Date().toISOString()
        };
      })
    );
  };

  const createSprint = (name: string, goal: string, startDate: string, endDate: string) => {
    const projectSprints = sprints.filter(s => s.projectId === activeProject.id);
    const nextSprintNum = projectSprints.length + 1;
    const newSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      projectId: activeProject.id,
      name: name || `${activeProject.key} Sprint ${nextSprintNum}`,
      goal,
      startDate,
      endDate,
      status: 'planned',
      plannedPoints: 0,
      completedPoints: 0
    };
    setSprints(prev => [...prev, newSprint]);
  };

  const startSprint = (sprintId: string) => {
    setSprints(prev =>
      prev.map(s => {
        if (s.id === sprintId) {
          return { ...s, status: 'active' };
        }
        if (s.projectId === activeProject.id && s.status === 'active') {
          return { ...s, status: 'completed' };
        }
        return s;
      })
    );
  };

  const completeSprint = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === sprintId);
    if (!sprint) return;

    // Confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } catch {
      // Ignore if canvas-confetti is not loaded
    }

    // Calculate completed points
    const sprintIssues = issues.filter(i => i.sprintId === sprintId);
    const completedPts = sprintIssues
      .filter(i => i.status === 'done')
      .reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

    const totalPts = sprintIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

    // Roll over incomplete issues to next planned sprint or backlog
    const nextSprint = sprints.find(s => s.status === 'planned' && s.id !== sprintId && s.projectId === activeProject.id);
    const rolloverTargetId = nextSprint ? nextSprint.id : 'backlog';

    setIssues(prev =>
      prev.map(i => {
        if (i.sprintId === sprintId && i.status !== 'done') {
          return {
            ...i,
            sprintId: rolloverTargetId,
            activities: [
              {
                id: `act-${Date.now()}`,
                user: currentUser,
                action: `rolled over to ${nextSprint ? nextSprint.name : 'Product Backlog'} upon sprint close`,
                timestamp: new Date().toISOString()
              },
              ...i.activities
            ]
          };
        }
        return i;
      })
    );

    setSprints(prev =>
      prev.map(s =>
        s.id === sprintId
          ? {
              ...s,
              status: 'completed',
              completedAt: new Date().toISOString(),
              completedPoints: completedPts,
              plannedPoints: totalPts
            }
          : s
      )
    );

    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'Sprint Completed',
        message: `${sprint.name} finished: ${completedPts}/${totalPts} points delivered`,
        timestamp: 'Just now',
        read: false,
        type: 'sprint',
        author: currentUser
      },
      ...prev
    ]);
  };

  const addColumn = (name: string, wipLimit: number, color: string, category: 'todo' | 'in_progress' | 'done' = 'in_progress') => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36);
    const newCol: KanbanColumn = {
      id,
      name,
      wipLimit,
      color: color || '#2563eb',
      category
    };
    // Insert before "done" column if exists
    const doneIndex = columns.findIndex(c => c.id === 'done');
    if (doneIndex !== -1) {
      const nextCols = [...columns];
      nextCols.splice(doneIndex, 0, newCol);
      setColumns(nextCols);
    } else {
      setColumns(prev => [...prev, newCol]);
    }
  };

  const updateColumn = (id: string, updates: Partial<KanbanColumn>) => {
    setColumns(prev =>
      prev.map(col => (col.id === id ? { ...col, ...updates } : col))
    );
  };

  const deleteColumn = (id: string) => {
    if (columns.length <= 2) return; // Keep at least two columns
    // Move issues in this column to the first column
    const fallbackColumn = columns.find(c => c.id !== id)?.id || 'todo';
    setIssues(prev =>
      prev.map(i => (i.status === id ? { ...i, status: fallbackColumn } : i))
    );
    setColumns(prev => prev.filter(c => c.id !== id));
  };

  // ---- Project members -------------------------------------------------------

  /** Members of a project. Projects saved before membership existed get lead = owner, people with work = member. */
  const membersOf = (project: Project): ProjectMember[] => {
    if (project.members && project.members.length > 0) return project.members;
    const derived = new Map<string, ProjectMember>();
    derived.set(project.lead.id, { userId: project.lead.id, role: 'owner', addedAt: project.createdAt });
    issues.filter(i => i.projectId === project.id).forEach(i => {
      [i.assignee, i.reporter].forEach(u => {
        if (u && !derived.has(u.id)) derived.set(u.id, { userId: u.id, role: 'member', addedAt: project.createdAt });
      });
    });
    return [...derived.values()];
  };

  const getProjectMembers = (project: Project) =>
    membersOf(project)
      .map(member => ({ member, user: teamMembers.find(u => u.id === member.userId) }))
      .filter((m): m is { member: ProjectMember; user: User } => !!m.user)
      .sort((a, b) => ROLE_RANK[b.member.role] - ROLE_RANK[a.member.role] || a.user.name.localeCompare(b.user.name));

  const myRoleIn = (project: Project): ProjectRole | null =>
    membersOf(project).find(m => m.userId === currentUser.id)?.role ?? null;

  const setMembers = (projectId: string, update: (members: ProjectMember[]) => ProjectMember[]) => {
    setProjects(prev => prev.map(p => (p.id === projectId ? { ...p, members: update(membersOf(p)) } : p)));
  };

  const projectName = (projectId: string) => projects.find(p => p.id === projectId)?.name ?? 'project';
  const userName = (userId: string) => teamMembers.find(u => u.id === userId)?.name ?? 'Someone';

  const addProjectMembers = (projectId: string, userIds: string[], role: ProjectRole, people: User[] = []) => {
    if (userIds.length === 0) return;
    const userName = (id: string) => people.find(u => u.id === id)?.name ?? teamMembers.find(u => u.id === id)?.name ?? 'Someone';
    const now = new Date().toISOString();
    setMembers(projectId, members => [
      ...members,
      ...userIds.filter(id => !members.some(m => m.userId === id)).map(userId => ({ userId, role, addedAt: now }))
    ]);
    const names = userIds.map(userName);
    setRecentActivity(prev => [
      { text: `${currentUser.name} added ${names.join(', ')} to ${projectName(projectId)} as ${role}`, time: 'Just now' },
      ...prev
    ]);
    userIds.filter(id => id !== currentUser.id).forEach((id, i) => {
      setNotifications(prev => [{
        id: `notif-${Date.now()}-${i}`,
        title: 'Added to project',
        message: `${userName(id)} was added to ${projectName(projectId)} as ${role}`,
        timestamp: 'Just now',
        read: false,
        type: 'assignment',
        author: currentUser
      }, ...prev]);
    });
  };

  const ownerCount = (members: ProjectMember[]) => members.filter(m => m.role === 'owner').length;

  const updateProjectMemberRole = (projectId: string, userId: string, role: ProjectRole): ActionResult => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { ok: false, error: 'Project not found.' };
    const members = membersOf(project);
    const target = members.find(m => m.userId === userId);
    if (!target) return { ok: false, error: 'That person is not a member of this project.' };
    if (target.role === 'owner' && role !== 'owner' && ownerCount(members) <= 1) {
      return { ok: false, error: 'A project needs at least one owner. Make someone else an owner first.' };
    }
    setMembers(projectId, ms => ms.map(m => (m.userId === userId ? { ...m, role } : m)));
    setRecentActivity(prev => [{ text: `${currentUser.name} changed ${userName(userId)}'s role to ${role}`, time: 'Just now' }, ...prev]);
    return { ok: true };
  };

  const removeProjectMember = (projectId: string, userId: string): ActionResult => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return { ok: false, error: 'Project not found.' };
    const members = membersOf(project);
    const target = members.find(m => m.userId === userId);
    if (!target) return { ok: false, error: 'That person is not a member of this project.' };
    if (target.role === 'owner' && ownerCount(members) <= 1) {
      return { ok: false, error: 'You cannot remove the only owner of a project.' };
    }
    setMembers(projectId, ms => ms.filter(m => m.userId !== userId));
    setRecentActivity(prev => [{ text: `${currentUser.name} removed ${userName(userId)} from ${project.name}`, time: 'Just now' }, ...prev]);
    return { ok: true };
  };

  const isProjectKeyTaken = (key: string, exceptProjectId?: string) =>
    projects.some(p => p.id !== exceptProjectId && p.key.toUpperCase() === key.trim().toUpperCase());

  // ---- Workspace people ---------------------------------------------------------

  const inviteTeamMember = (data: { name: string; email: string; role: string; department: string }) => {
    const email = data.email.trim().toLowerCase();
    if (teamMembers.some(u => u.email.toLowerCase() === email)) {
      return { ok: false as const, error: 'Someone with this email is already in the workspace.' };
    }
    const user: User = withAvatar({
      id: `user-invited-${Date.now()}`,
      name: data.name.trim(),
      email,
      avatar: '',
      role: data.role.trim() || 'Team member',
      department: data.department.trim() || 'General',
      status: 'invited'
    });
    setTeamMembers(prev => [...prev, user]);
    setRecentActivity(prev => [{ text: `${currentUser.name} invited ${user.name} (${user.email}) to the workspace`, time: 'Just now' }, ...prev]);
    return { ok: true as const, user };
  };

  const openProjectSettings = (projectId: string | null) => {
    setEditingProjectId(projectId);
    setIsCreateProjectModalOpen(projectId !== null);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        setActiveProject,
        issues,
        columns,
        sprints,
        activeSprint,
        teamMembers,
        currentUser,
        notifications,
        unreadNotificationCount,
        selectedIssue,
        recentActivity,
        realtimeStatus,
        lastSyncTime,

        activeTab,
        setActiveTab,
        swimlane,
        setSwimlane,
        searchQuery,
        setSearchQuery,
        filterAssignee,
        setFilterAssignee,
        filterPriority,
        setFilterPriority,
        filterType,
        setFilterType,
        filterOnlyMyIssues,
        setFilterOnlyMyIssues,
        clearFilters,

        isCreateModalOpen,
        setIsCreateModalOpen,
        isCreateProjectModalOpen,
        setIsCreateProjectModalOpen: (open: boolean) => {
          if (!open) setEditingProjectId(null);
          setIsCreateProjectModalOpen(open);
        },
        editingProjectId,
        openProjectSettings,
        setSelectedIssue,

        createProject,
        updateProject,
        deleteProject,
        createIssue,
        updateIssue,
        deleteIssue,
        moveIssueStatus,
        moveIssueSprint,
        addComment,
        toggleSubtask,
        addSubtask,
        createSprint,
        startSprint,
        completeSprint,
        addColumn,
        updateColumn,
        deleteColumn,
        markAllNotificationsRead,

        getProjectMembers,
        myRoleIn,
        addProjectMembers,
        updateProjectMemberRole,
        removeProjectMember,
        isProjectKeyTaken,
        inviteTeamMember
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
