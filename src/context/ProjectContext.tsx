import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import confetti from 'canvas-confetti';
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
  ClerkSession
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
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
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
  switchUser: (user: User) => void;
  markAllNotificationsRead: () => void;

  // Clerk Auth Integration
  clerkSession: ClerkSession | null;
  clerkSignUp: (data: { name: string; email: string; password?: string; role?: string; department?: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  clerkSignIn: (data: { email: string; password?: string }) => Promise<{ success: boolean; user?: User; error?: string }>;
  clerkSignOut: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Projects
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('omniplane_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [activeProject, setActiveProject] = useState<Project>(() => {
    const saved = localStorage.getItem('omniplane_active_project_id');
    if (saved) {
      const found = projects.find(p => p.id === saved);
      if (found) return found;
    }
    return projects[0] || INITIAL_PROJECTS[0];
  });

  // Load saved state or default
  const [issues, setIssues] = useState<Issue[]>(() => {
    const saved = localStorage.getItem('omniplane_issues');
    return saved ? JSON.parse(saved) : INITIAL_ISSUES;
  });

  const [columns, setColumns] = useState<KanbanColumn[]>(() => {
    const saved = localStorage.getItem('omniplane_columns');
    return saved ? JSON.parse(saved) : INITIAL_COLUMNS;
  });

  const [sprints, setSprints] = useState<Sprint[]>(() => {
    const saved = localStorage.getItem('omniplane_sprints');
    return saved ? JSON.parse(saved) : INITIAL_SPRINTS;
  });

  const [teamMembers, setTeamMembers] = useState<User[]>(() => {
    const saved = localStorage.getItem('vision_team_members') || localStorage.getItem('omniplane_team_members');
    return saved ? JSON.parse(saved) : TEAM_MEMBERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('vision_current_user') || localStorage.getItem('omniplane_current_user');
    return saved ? JSON.parse(saved) : TEAM_MEMBERS[1]; // Alex Rivera by default
  });

  const [clerkSession, setClerkSession] = useState<ClerkSession | null>(() => {
    const saved = localStorage.getItem('vision_clerk_session');
    if (saved) return JSON.parse(saved);
    return {
      token: 'sess_clerk_live_alex_rivera',
      userId: 'user-2',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
    };
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('vision_notifications') || localStorage.getItem('omniplane_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState<ViewTab>('board');
  const [swimlane, setSwimlane] = useState<SwimlaneType>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOnlyMyIssues, setFilterOnlyMyIssues] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Realtime simulation state
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'syncing'>('connected');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [recentActivity, setRecentActivity] = useState<{ text: string; time: string; key?: string }[]>([
    { text: 'Live Realtime Channel [vision-sync:v2] established via Supabase WebSockets', time: 'Just now' },
    { text: 'Sprint 24 active with 34 committed story points in Vision', time: '5m ago' }
  ]);

  // Persist state
  useEffect(() => {
    localStorage.setItem('vision_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('vision_active_project_id', activeProject.id);
  }, [activeProject]);

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

  useEffect(() => {
    if (clerkSession) {
      localStorage.setItem('vision_clerk_session', JSON.stringify(clerkSession));
    } else {
      localStorage.removeItem('vision_clerk_session');
    }
  }, [clerkSession]);

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

  // Periodic heartbeat / Supabase live pulse simulation
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
      createdAt: new Date().toISOString()
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

    const projectIssues = issues.filter(i => i.projectId === targetProjectId);
    const nextNum = projectIssues.length + 101;
    const key = `${targetProject.key}-${nextNum}`;

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
      storyPoints: issueData.storyPoints || 3,
      labels: issueData.labels || ['feature'],
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

  const switchUser = (user: User) => {
    setCurrentUser(user);
    setRecentActivity(prev => [
      { text: `Switched active user session to ${user.name} (${user.role})`, time: 'Just now' },
      ...prev
    ]);
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Clerk Auth Actions
  const clerkSignUp = async (data: {
    name: string;
    email: string;
    password?: string;
    role?: string;
    department?: string;
  }) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success && result.user && result.session) {
        setClerkSession(result.session);
        setCurrentUser(result.user);
        setTeamMembers(prev => {
          if (prev.some(u => u.id === result.user.id || u.email === result.user.email)) return prev;
          return [result.user, ...prev];
        });
        setRecentActivity(prev => [
          { text: `New user verified via Clerk: ${result.user.name} (${result.user.email})`, time: 'Just now' },
          ...prev
        ]);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'Failed to sign up with Clerk.' };
    } catch {
      // Local fallback
      const fallbackUser: User = {
        id: `user-clerk-${Date.now()}`,
        name: data.name,
        email: data.email,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        role: data.role || 'Software Engineer',
        department: data.department || 'Engineering',
        status: 'online'
      };
      const fallbackSession: ClerkSession = {
        token: `sess_clerk_${Date.now()}`,
        userId: fallbackUser.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
      };
      setClerkSession(fallbackSession);
      setCurrentUser(fallbackUser);
      setTeamMembers(prev => [fallbackUser, ...prev]);
      return { success: true, user: fallbackUser };
    }
  };

  const clerkSignIn = async (data: { email: string; password?: string }) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (result.success && result.user && result.session) {
        setClerkSession(result.session);
        setCurrentUser(result.user);
        setRecentActivity(prev => [
          { text: `Authenticated session via Clerk: ${result.user.name}`, time: 'Just now' },
          ...prev
        ]);
        return { success: true, user: result.user };
      }
      return { success: false, error: result.error || 'Invalid credentials.' };
    } catch {
      // Check existing user in directory
      const found = teamMembers.find(m => m.email.toLowerCase() === data.email.toLowerCase());
      if (found) {
        setCurrentUser(found);
        setClerkSession({
          token: `sess_clerk_${Date.now()}`,
          userId: found.id,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
        });
        return { success: true, user: found };
      }
      return { success: false, error: 'User not found in directory.' };
    }
  };

  const clerkSignOut = async () => {
    if (clerkSession?.token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: clerkSession.token })
        });
      } catch {}
    }
    setClerkSession(null);
    setCurrentUser(teamMembers[0]);
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
        setIsCreateProjectModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
        switchUser,
        markAllNotificationsRead,

        clerkSession,
        clerkSignUp,
        clerkSignIn,
        clerkSignOut
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
