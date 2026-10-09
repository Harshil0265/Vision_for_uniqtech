import { User, KanbanColumn, Issue, Sprint, AppNotification, Project } from '../types';

export const TEAM_MEMBERS: User[] = [
  {
    id: 'user-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Staff Product Manager',
    department: 'Platform Systems',
    status: 'online'
  },
  {
    id: 'user-2',
    name: 'Alex Rivera',
    email: 'alex.rivera@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Principal Architect & Tech Lead',
    department: 'Platform Engineering',
    status: 'online'
  },
  {
    id: 'user-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'Senior Full-Stack Engineer',
    department: 'Cloud Services',
    status: 'busy'
  },
  {
    id: 'user-4',
    name: 'Marcus Chen',
    email: 'marcus.chen@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Staff SRE & DevOps Lead',
    department: 'Site Reliability Engineering',
    status: 'online'
  },
  {
    id: 'user-5',
    name: 'David Kim',
    email: 'david.kim@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'Senior QA Automation Engineer',
    department: 'Quality Assurance',
    status: 'away'
  },
  {
    id: 'user-6',
    name: 'Priya Patel',
    email: 'priya.patel@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    role: 'Frontend UI/UX Specialist',
    department: 'Design Systems',
    status: 'online'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-op',
    name: 'Platform Engineering & Cloud Infrastructure',
    key: 'OP',
    description: 'Core microservices, Kubernetes orchestration, distributed real-time messaging, and API gateway routing.',
    lead: TEAM_MEMBERS[1], // Alex Rivera
    template: 'Scrum',
    allowedIssueTypes: ['epic', 'story', 'task', 'bug', 'spike'],
    defaultAssignee: 'unassigned',
    iconGradient: 'from-blue-600 via-indigo-600 to-sky-500',
    createdAt: '2026-09-01T08:00:00Z',
    members: [
      {
        id: 'member-op-alex',
        userId: 'user-2',
        projectId: 'proj-op',
        user: TEAM_MEMBERS[1], // Alex Rivera (owner)
        role: 'owner',
        invitedAt: '2026-09-01T08:00:00Z'
      },
      {
        id: 'member-op-elena',
        userId: 'user-3',
        projectId: 'proj-op',
        user: TEAM_MEMBERS[2], // Elena Rostova (admin)
        role: 'admin',
        invitedAt: '2026-09-01T08:30:00Z'
      },
      {
        id: 'member-op-marcus',
        userId: 'user-4',
        projectId: 'proj-op',
        user: TEAM_MEMBERS[3], // Marcus Chen (member)
        role: 'member',
        invitedAt: '2026-09-01T09:00:00Z'
      },
      {
        id: 'member-op-priya',
        userId: 'user-6',
        projectId: 'proj-op',
        user: TEAM_MEMBERS[5], // Priya Patel (member)
        role: 'member',
        invitedAt: '2026-09-01T09:30:00Z'
      }
    ]
  },
  {
    id: 'proj-mob',
    name: 'Mobile Client Application Suite',
    key: 'MOB',
    description: 'Cross-platform native mobile experience with offline caching, push telemetry, and biometric authentication.',
    lead: TEAM_MEMBERS[2], // Elena Rostova
    template: 'Scrum',
    allowedIssueTypes: ['epic', 'story', 'task', 'bug', 'subtask'],
    defaultAssignee: 'lead',
    iconGradient: 'from-emerald-600 via-teal-600 to-cyan-500',
    createdAt: '2026-09-10T09:00:00Z',
    members: [
      {
        id: 'member-mob-elena',
        userId: 'user-3',
        projectId: 'proj-mob',
        user: TEAM_MEMBERS[2], // Elena Rostova (owner)
        role: 'owner',
        invitedAt: '2026-09-10T09:00:00Z'
      },
      {
        id: 'member-mob-david',
        userId: 'user-5',
        projectId: 'proj-mob',
        user: TEAM_MEMBERS[4], // David Kim (member)
        role: 'member',
        invitedAt: '2026-09-10T10:00:00Z'
      }
    ]
  },
  {
    id: 'proj-sec',
    name: 'Security Governance & Compliance',
    key: 'SEC',
    description: 'SOC2 Type II controls, automated CVE vulnerability scanning, audit logging, and zero-trust IAM policies.',
    lead: TEAM_MEMBERS[3], // Marcus Chen
    template: 'Kanban',
    allowedIssueTypes: ['task', 'bug', 'incident', 'spike'],
    defaultAssignee: 'lead',
    iconGradient: 'from-purple-600 via-violet-600 to-indigo-500',
    createdAt: '2026-09-20T10:00:00Z',
    members: [
      {
        id: 'member-sec-marcus',
        userId: 'user-4',
        projectId: 'proj-sec',
        user: TEAM_MEMBERS[3], // Marcus Chen (owner)
        role: 'owner',
        invitedAt: '2026-09-20T10:00:00Z'
      },
      {
        id: 'member-sec-alex',
        userId: 'user-2',
        projectId: 'proj-sec',
        user: TEAM_MEMBERS[1], // Alex Rivera (admin)
        role: 'admin',
        invitedAt: '2026-09-20T10:30:00Z'
      }
    ]
  }
];

export const INITIAL_COLUMNS: KanbanColumn[] = [
  { id: 'backlog', name: 'Backlog', wipLimit: 0, color: '#64748b', category: 'todo' },
  { id: 'todo', name: 'To Do', wipLimit: 8, color: '#2563eb', category: 'todo' },
  { id: 'in_progress', name: 'In Progress', wipLimit: 4, color: '#d97706', category: 'in_progress' },
  { id: 'code_review', name: 'Code Review', wipLimit: 3, color: '#7c3aed', category: 'in_progress' },
  { id: 'qa_staging', name: 'QA & Staging', wipLimit: 3, color: '#db2777', category: 'in_progress' },
  { id: 'done', name: 'Done', wipLimit: 0, color: '#059669', category: 'done' }
];

export const INITIAL_SPRINTS: Sprint[] = [
  {
    id: 'sprint-24',
    projectId: 'proj-op',
    name: 'Sprint 24: Core Synchronization & Scalability',
    goal: 'Deliver multi-tenant real-time broadcast channels, optimize PostgreSQL connection pooling, and harden RBAC authorization rules.',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    status: 'active',
    plannedPoints: 34,
    completedPoints: 13
  },
  {
    id: 'sprint-25',
    projectId: 'proj-op',
    name: 'Sprint 25: Nodemailer Automation & Webhooks',
    goal: 'Integrate automated notification delivery rules, SMTP fallback queues, and Clerk SSO directory synchronization.',
    startDate: '2026-10-16',
    endDate: '2026-10-30',
    status: 'planned',
    plannedPoints: 28,
    completedPoints: 0
  },
  {
    id: 'sprint-23',
    projectId: 'proj-op',
    name: 'Sprint 23: Microservices Observability',
    goal: 'Complete OpenTelemetry instrumentation and distributed tracing across backend services.',
    startDate: '2026-09-15',
    endDate: '2026-09-30',
    status: 'completed',
    completedAt: '2026-09-30',
    plannedPoints: 31,
    completedPoints: 31
  },
  {
    id: 'sprint-mob-1',
    projectId: 'proj-mob',
    name: 'Sprint 12: Offline Cache & Biometric Auth',
    goal: 'Ship SQLite local storage sync, WebCrypto biometric credentials, and dark mode design system tokens.',
    startDate: '2026-10-01',
    endDate: '2026-10-15',
    status: 'active',
    plannedPoints: 24,
    completedPoints: 8
  }
];

export const INITIAL_ISSUES: Issue[] = [
  {
    id: 'issue-101',
    key: 'OP-101',
    projectId: 'proj-op',
    title: 'Architect Real-Time Broadcast for Multi-Client Synchronization',
    description: 'Implement WebSocket delta propagation for Kanban card updates with conflict resolution and optimistic UI updates.',
    type: 'epic',
    priority: 'high',
    status: 'in_progress',
    assignee: TEAM_MEMBERS[1], // Alex Rivera
    reporter: TEAM_MEMBERS[0], // Sarah Jenkins
    sprintId: 'sprint-24',
    storyPoints: 13,
    labels: ['architecture', 'realtime', 'websocket'],
    epicKey: 'OP-100',
    epicTitle: 'Realtime Collaboration Platform',
    subtasks: [
      { id: 'st-1', title: 'Define wire protocol JSON schema for work item diffs', completed: true },
      { id: 'st-2', title: 'Setup connection heartbeat and reconnection exponential backoff', completed: true },
      { id: 'st-3', title: 'Implement vector clock and last-write-wins resolution', completed: false },
      { id: 'st-4', title: 'Load test with 500 concurrent active socket subscribers', completed: false }
    ],
    comments: [
      {
        id: 'c-1',
        author: TEAM_MEMBERS[0],
        content: '@alex.rivera verify sub-50ms roundtrip latency for column drag operations.',
        createdAt: '2026-10-02T10:15:00Z',
        mentions: ['alex.rivera']
      },
      {
        id: 'c-2',
        author: TEAM_MEMBERS[1],
        content: 'Benchmarked with local Node cluster: average sync latency is currently sitting at 24ms.',
        createdAt: '2026-10-03T14:40:00Z',
        mentions: []
      }
    ],
    activities: [
      {
        id: 'act-1',
        user: TEAM_MEMBERS[0],
        action: 'created issue',
        timestamp: '2026-10-01T09:00:00Z'
      },
      {
        id: 'act-2',
        user: TEAM_MEMBERS[1],
        action: 'moved status from To Do to In Progress',
        timestamp: '2026-10-02T08:30:00Z'
      }
    ],
    dueDate: '2026-10-14',
    createdAt: '2026-10-01T09:00:00Z',
    updatedAt: '2026-10-03T14:40:00Z'
  },
  {
    id: 'issue-102',
    key: 'OP-102',
    projectId: 'proj-op',
    title: 'PostgreSQL Connection Pooling Memory Spike under Burst Loads',
    description: 'During automated load tests, PgBouncer idle connections climb to 480 and trigger memory threshold alarms on worker node 3.',
    type: 'bug',
    priority: 'blocker',
    status: 'in_progress',
    assignee: TEAM_MEMBERS[3], // Marcus Chen
    reporter: TEAM_MEMBERS[4], // David Kim
    sprintId: 'sprint-24',
    storyPoints: 5,
    labels: ['database', 'infrastructure', 'performance', 'p0'],
    epicKey: 'OP-100',
    epicTitle: 'Realtime Collaboration Platform',
    subtasks: [
      { id: 'st-21', title: 'Capture heap profile during 5,000 req/s load test', completed: true },
      { id: 'st-22', title: 'Tune server_idle_timeout from 600s to 60s in pgbouncer.ini', completed: true },
      { id: 'st-23', title: 'Validate zero connection leaks in client pool', completed: false }
    ],
    comments: [
      {
        id: 'c-3',
        author: TEAM_MEMBERS[4],
        content: '@marcus.chen Reproducible by running the k6 stress suite against /api/graphql. Alert dispatched to SRE on-call.',
        createdAt: '2026-10-04T11:20:00Z',
        mentions: ['marcus.chen']
      }
    ],
    activities: [
      {
        id: 'act-3',
        user: TEAM_MEMBERS[4],
        action: 'flagged priority to Blocker',
        timestamp: '2026-10-04T11:20:00Z'
      }
    ],
    dueDate: '2026-10-08',
    createdAt: '2026-10-04T10:00:00Z',
    updatedAt: '2026-10-05T12:00:00Z'
  },
  {
    id: 'issue-103',
    key: 'OP-103',
    projectId: 'proj-op',
    title: 'Clerk Authentication and Multi-Role RBAC Profile Synchronizer',
    description: 'Integrate user session tokens, JWT claims validation, role assignments (Admin, Tech Lead, Contributor, Viewer), and user switching.',
    type: 'story',
    priority: 'high',
    status: 'code_review',
    assignee: TEAM_MEMBERS[2], // Elena Rostova
    reporter: TEAM_MEMBERS[0], // Sarah Jenkins
    sprintId: 'sprint-24',
    storyPoints: 8,
    labels: ['security', 'authentication', 'clerk', 'rbac'],
    subtasks: [
      { id: 'st-31', title: 'Implement Clerk JWT claim verification middleware', completed: true },
      { id: 'st-32', title: 'Map Clerk metadata roles to internal project permissions', completed: true },
      { id: 'st-33', title: 'Add session expiration graceful modal refresher', completed: true }
    ],
    comments: [
      {
        id: 'c-4',
        author: TEAM_MEMBERS[2],
        content: 'Pull request 418 opened with full test coverage. @alex.rivera please review the middleware interceptor.',
        createdAt: '2026-10-05T16:00:00Z',
        mentions: ['alex.rivera']
      }
    ],
    activities: [
      {
        id: 'act-4',
        user: TEAM_MEMBERS[2],
        action: 'moved status from In Progress to Code Review',
        timestamp: '2026-10-05T16:05:00Z'
      }
    ],
    dueDate: '2026-10-10',
    createdAt: '2026-10-02T11:00:00Z',
    updatedAt: '2026-10-05T16:05:00Z'
  },
  {
    id: 'issue-104',
    key: 'OP-104',
    projectId: 'proj-op',
    title: 'Nodemailer Automated Notification Engine & HTML Email Templates',
    description: 'Build enterprise email dispatcher for assignment alerts, priority escalations, sprint completion digests, and @mention notifications with preview inspector.',
    type: 'story',
    priority: 'high',
    status: 'qa_staging',
    assignee: TEAM_MEMBERS[2], // Elena Rostova
    reporter: TEAM_MEMBERS[1], // Alex Rivera
    sprintId: 'sprint-24',
    storyPoints: 5,
    labels: ['email', 'notifications', 'nodemailer', 'backend'],
    subtasks: [
      { id: 'st-41', title: 'Setup Nodemailer transporter with Ethereal SMTP test engine', completed: true },
      { id: 'st-42', title: 'Create responsive HTML email layouts for enterprise alerts', completed: true },
      { id: 'st-43', title: 'Implement in-app outbox log and manual dispatch test console', completed: true }
    ],
    comments: [],
    activities: [
      {
        id: 'act-5',
        user: TEAM_MEMBERS[2],
        action: 'moved status from Code Review to QA & Staging',
        timestamp: '2026-10-06T09:15:00Z'
      }
    ],
    dueDate: '2026-10-09',
    createdAt: '2026-10-03T13:00:00Z',
    updatedAt: '2026-10-06T09:15:00Z'
  },
  {
    id: 'issue-105',
    key: 'OP-105',
    projectId: 'proj-op',
    title: 'Customizable Kanban Workflow Engine with WIP Limit Guards',
    description: 'Allow team leads to add, rename, reorder columns, configure WIP thresholds, and display visual breach indicators when column capacity is exceeded.',
    type: 'task',
    priority: 'medium',
    status: 'done',
    assignee: TEAM_MEMBERS[5], // Priya Patel
    reporter: TEAM_MEMBERS[0], // Sarah Jenkins
    sprintId: 'sprint-24',
    storyPoints: 5,
    labels: ['kanban', 'wip-limits', 'ux', 'workflow'],
    subtasks: [
      { id: 'st-51', title: 'Dynamic column schema model in state manager', completed: true },
      { id: 'st-52', title: 'WIP capacity bar with warning & violation badges', completed: true },
      { id: 'st-53', title: 'Drag and drop reordering animation with Motion', completed: true }
    ],
    comments: [],
    activities: [
      {
        id: 'act-6',
        user: TEAM_MEMBERS[5],
        action: 'completed all subtasks and marked Done',
        timestamp: '2026-10-06T15:20:00Z'
      }
    ],
    dueDate: '2026-10-07',
    createdAt: '2026-10-01T14:00:00Z',
    updatedAt: '2026-10-06T15:20:00Z'
  },
  {
    id: 'issue-106',
    key: 'OP-106',
    projectId: 'proj-op',
    title: 'Research Spike: Rust WebAssembly Engine for In-Browser Query Filtering',
    description: 'Time-boxed spike to investigate client-side JSON filtering performance using wasm-bindgen vs Native JS for 100k issue sets.',
    type: 'spike',
    priority: 'medium',
    status: 'in_progress',
    assignee: TEAM_MEMBERS[1], // Alex Rivera
    reporter: TEAM_MEMBERS[0], // Sarah Jenkins
    sprintId: 'sprint-24',
    storyPoints: 5,
    labels: ['research', 'wasm', 'rust', 'performance'],
    subtasks: [
      { id: 'st-61', title: 'Compile Rust POC with wasm-pack', completed: true },
      { id: 'st-62', title: 'Benchmark memory overhead and GC pressure', completed: false }
    ],
    comments: [],
    activities: [],
    dueDate: '2026-10-12',
    createdAt: '2026-10-02T10:00:00Z',
    updatedAt: '2026-10-04T11:00:00Z'
  },
  {
    id: 'issue-mob-201',
    key: 'MOB-201',
    projectId: 'proj-mob',
    title: 'Implement FaceID and Biometric Keystore Storage in React Native',
    description: 'Secure user refresh tokens in iOS Keychain and Android Keystore with fallback to hardware biometric authentication.',
    type: 'story',
    priority: 'high',
    status: 'in_progress',
    assignee: TEAM_MEMBERS[2], // Elena Rostova
    reporter: TEAM_MEMBERS[1], // Alex Rivera
    sprintId: 'sprint-mob-1',
    storyPoints: 8,
    labels: ['mobile', 'security', 'biometrics'],
    subtasks: [
      { id: 'st-m1', title: 'Integrate react-native-keychain native module', completed: true },
      { id: 'st-m2', title: 'Add biometric prompt callback handling', completed: true },
      { id: 'st-m3', title: 'Handle lock-out and device passcode fallback', completed: false }
    ],
    comments: [],
    activities: [],
    dueDate: '2026-10-14',
    createdAt: '2026-10-02T09:00:00Z',
    updatedAt: '2026-10-03T15:00:00Z'
  },
  {
    id: 'issue-mob-202',
    key: 'MOB-202',
    projectId: 'proj-mob',
    title: 'Deep Link Route Parser Crashing on Custom Scheme URLs',
    description: 'When tapping notification links formatted with omniplane://issue/OP-104 on iOS 18 devices, the app encounters a nil pointer dereference.',
    type: 'bug',
    priority: 'blocker',
    status: 'todo',
    assignee: TEAM_MEMBERS[2], // Elena Rostova
    reporter: TEAM_MEMBERS[4], // David Kim
    sprintId: 'sprint-mob-1',
    storyPoints: 3,
    labels: ['mobile', 'deep-linking', 'ios'],
    subtasks: [],
    comments: [],
    activities: [],
    dueDate: '2026-10-09',
    createdAt: '2026-10-04T08:00:00Z',
    updatedAt: '2026-10-04T08:00:00Z'
  },
  {
    id: 'issue-sec-301',
    key: 'SEC-301',
    projectId: 'proj-sec',
    title: 'Critical CVE-2026-24891 Detected in Base Docker Ingress Image',
    description: 'Automated Trivy container scanner detected an unauthenticated remote execution vulnerability in openssl package 3.0.12.',
    type: 'incident',
    priority: 'blocker',
    status: 'in_progress',
    assignee: TEAM_MEMBERS[3], // Marcus Chen
    reporter: TEAM_MEMBERS[3],
    sprintId: 'backlog',
    storyPoints: 5,
    labels: ['security', 'cve', 'docker', 'incident'],
    subtasks: [
      { id: 'st-s1', title: 'Pin base image to alpine:3.20.3-r1 patched digest', completed: true },
      { id: 'st-s2', title: 'Trigger automated container scan in CI pipeline', completed: false }
    ],
    comments: [],
    activities: [],
    dueDate: '2026-10-07',
    createdAt: '2026-10-05T06:00:00Z',
    updatedAt: '2026-10-05T07:00:00Z'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Issue Assigned',
    message: 'Sarah Jenkins assigned OP-104 (Nodemailer Automated Notification Engine) to you.',
    timestamp: '15 minutes ago',
    read: false,
    type: 'assignment',
    issueKey: 'OP-104',
    author: TEAM_MEMBERS[0]
  },
  {
    id: 'notif-2',
    title: 'Priority Escalation: Blocker',
    message: 'David Kim escalated OP-102 (PostgreSQL Connection Pooling Spike) to Blocker.',
    timestamp: '1 hour ago',
    read: false,
    type: 'priority',
    issueKey: 'OP-102',
    author: TEAM_MEMBERS[4]
  },
  {
    id: 'notif-3',
    title: 'You were mentioned',
    message: 'Elena Rostova mentioned you in a comment on OP-103.',
    timestamp: '3 hours ago',
    read: true,
    type: 'mention',
    issueKey: 'OP-103',
    author: TEAM_MEMBERS[2]
  },
  {
    id: 'notif-4',
    title: 'Sprint 23 Concluded',
    message: 'Sprint 23 finished with 100% velocity (31 of 31 points delivered).',
    timestamp: 'Yesterday',
    read: true,
    type: 'sprint'
  }
];
