import React, { useMemo } from 'react';
import { useProject } from '../context/ProjectContext';
import type { Issue, Priority, Project } from '../types';
import { WorkItemIcon, PriorityIcon } from './WorkItemIcon';
import { Avatar, Card, EmptyState, PrimaryButton, RoleBadge, SecondaryButton } from './ui';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FolderKanban,
  FolderPlus,
  Gauge,
  LayoutDashboard,
  ListTodo,
  Plus,
  UserPlus
} from 'lucide-react';

const PRIORITY_RANK: Record<Priority, number> = { blocker: 0, high: 1, medium: 2, low: 3, lowest: 4 };

/** Local calendar day as YYYY-MM-DD (due dates are stored as plain dates). */
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const addDays = (isoDay: string, days: number) => {
  const d = new Date(`${isoDay}T00:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const formatDay = (isoDay: string) =>
  new Date(`${isoDay.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    issues,
    projects,
    sprints,
    columns,
    recentActivity,
    setActiveProject,
    setActiveTab,
    setSelectedIssue,
    setIsCreateModalOpen,
    setIsCreateProjectModalOpen,
    setFilterOnlyMyIssues,
    getProjectMembers,
    myRoleIn,
    activeProject
  } = useProject();

  const doneColumnIds = useMemo(() => new Set(columns.filter(c => c.category === 'done').map(c => c.id)), [columns]);
  const isDone = (i: Issue) => doneColumnIds.has(i.status) || i.status === 'done';
  const day = today();
  const weekAhead = addDays(day, 7);

  const myOpen = useMemo(
    () => issues
      .filter(i => i.assignee?.id === currentUser.id && !isDone(i))
      .sort((a, b) => {
        const aDue = a.dueDate?.slice(0, 10) ?? '9999-12-31';
        const bDue = b.dueDate?.slice(0, 10) ?? '9999-12-31';
        return aDue.localeCompare(bDue) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }),
    [issues, currentUser.id, doneColumnIds]
  );

  const overdue = myOpen.filter(i => i.dueDate && i.dueDate.slice(0, 10) < day);
  const dueThisWeek = myOpen.filter(i => i.dueDate && i.dueDate.slice(0, 10) >= day && i.dueDate.slice(0, 10) <= weekAhead);
  const highPriority = myOpen.filter(i => i.priority === 'blocker' || i.priority === 'high');

  const myProjects = projects.filter(p => myRoleIn(p) !== null);

  const sprint = sprints.find(s => s.projectId === activeProject.id && s.status === 'active');
  const sprintIssues = sprint ? issues.filter(i => i.sprintId === sprint.id) : [];
  const sprintTotal = sprintIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const sprintDone = sprintIssues.filter(isDone).reduce((sum, i) => sum + (i.storyPoints || 0), 0);
  const sprintPercent = sprintTotal > 0 ? Math.round((sprintDone / sprintTotal) * 100) : 0;

  const openProject = (project: Project) => {
    setActiveProject(project);
    setActiveTab('board');
  };

  const firstName = currentUser.name.split(' ')[0];

  const stats = [
    {
      label: 'My open work items',
      value: myOpen.length,
      sub: highPriority.length > 0 ? `${highPriority.length} high priority` : 'Nothing urgent',
      icon: <ListTodo className="w-4 h-4" />,
      tone: 'text-blue-600 bg-blue-50'
    },
    {
      label: 'Due in the next 7 days',
      value: dueThisWeek.length,
      sub: overdue.length > 0 ? `${overdue.length} overdue` : 'No overdue items',
      subTone: overdue.length > 0 ? 'text-rose-600 font-semibold' : undefined,
      icon: <CalendarClock className="w-4 h-4" />,
      tone: 'text-amber-600 bg-amber-50'
    },
    {
      label: `Active sprint · ${activeProject.key}`,
      value: sprint ? `${sprintPercent}%` : '—',
      sub: sprint ? `${sprintDone} of ${sprintTotal} story points done` : 'No active sprint',
      icon: <Gauge className="w-4 h-4" />,
      tone: 'text-emerald-600 bg-emerald-50'
    },
    {
      label: 'My projects',
      value: myProjects.length,
      sub: `${projects.length} in the workspace`,
      icon: <FolderKanban className="w-4 h-4" />,
      tone: 'text-violet-600 bg-violet-50'
    }
  ];

  const statusBreakdown = (['todo', 'in_progress', 'done'] as const).map(category => {
    const ids = new Set(columns.filter(c => c.category === category).map(c => c.id));
    const count = issues.filter(i => i.projectId === activeProject.id && ids.has(i.status)).length;
    return { category, count };
  });
  const breakdownTotal = statusBreakdown.reduce((s, b) => s + b.count, 0);
  const breakdownStyle = { todo: 'bg-slate-400', in_progress: 'bg-amber-500', done: 'bg-emerald-500' } as const;
  const breakdownLabel = { todo: 'To do', in_progress: 'In progress', done: 'Done' } as const;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-xl font-semibold text-slate-900 mt-1">{greeting()}, {firstName}</h1>
            <p className="text-xs text-slate-500 mt-0.5">Here is what needs your attention today.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SecondaryButton icon={<UserPlus className="w-3.5 h-3.5" />} onClick={() => setActiveTab('members')}>Manage members</SecondaryButton>
            <SecondaryButton icon={<FolderPlus className="w-3.5 h-3.5" />} onClick={() => setIsCreateProjectModalOpen(true)}>New project</SecondaryButton>
            <PrimaryButton icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsCreateModalOpen(true)}>New work item</PrimaryButton>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-500">{s.label}</span>
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.tone}`}>{s.icon}</span>
              </div>
              <div className="text-2xl font-semibold text-slate-900 mt-2 font-mono">{s.value}</div>
              <div className={`text-[11px] mt-0.5 ${s.subTone ?? 'text-slate-500'}`}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* My work */}
          <Card
            className="xl:col-span-2"
            title={`My work (${myOpen.length})`}
            action={
              myOpen.length > 0 && (
                <button
                  onClick={() => { setFilterOnlyMyIssues(true); setActiveTab('board'); }}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  Open on board <ArrowRight className="w-3 h-3" />
                </button>
              )
            }
          >
            {myOpen.length === 0 ? (
              <EmptyState
                icon={<CheckCircle2 className="w-5 h-5" />}
                title="You're all caught up"
                body="Nothing is assigned to you right now. Create a work item or pick one up from the backlog."
                action={<PrimaryButton icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsCreateModalOpen(true)}>New work item</PrimaryButton>}
              />
            ) : (
              <ul className="divide-y divide-slate-100 -my-2">
                {myOpen.slice(0, 8).map(issue => {
                  const project = projects.find(p => p.id === issue.projectId);
                  const due = issue.dueDate?.slice(0, 10);
                  const isOverdue = !!due && due < day;
                  return (
                    <li key={issue.id}>
                      <button
                        onClick={() => setSelectedIssue(issue)}
                        className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-slate-50 rounded-lg px-2 -mx-2 cursor-pointer"
                      >
                        <WorkItemIcon type={issue.type} className="w-4 h-4 shrink-0" />
                        <span className="font-mono text-[11px] text-slate-500 w-16 shrink-0">{issue.key}</span>
                        <span className="text-xs font-medium text-slate-800 truncate flex-1">{issue.title}</span>
                        <span className="hidden md:inline text-[10px] text-slate-500 truncate max-w-[9rem]">{project?.name}</span>
                        <PriorityIcon priority={issue.priority} className="w-3.5 h-3.5 shrink-0" />
                        <span className={`text-[11px] w-28 text-right shrink-0 whitespace-nowrap ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500'}`}>
                          {due ? (isOverdue ? `Overdue · ${formatDay(due)}` : formatDay(due)) : 'No due date'}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {myOpen.length > 8 && (
              <p className="text-[11px] text-slate-500 mt-3">+ {myOpen.length - 8} more on the board</p>
            )}
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            <Card title={`Work by status · ${activeProject.key}`}>
              {breakdownTotal === 0 ? (
                <p className="text-xs text-slate-500">No work items in this project yet.</p>
              ) : (
                <>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-100" role="img" aria-label="Work items by status">
                    {statusBreakdown.map(b => b.count > 0 && (
                      <div key={b.category} className={breakdownStyle[b.category]} style={{ width: `${(b.count / breakdownTotal) * 100}%` }} />
                    ))}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {statusBreakdown.map(b => (
                      <li key={b.category} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-600">
                          <span className={`w-2 h-2 rounded-full ${breakdownStyle[b.category]}`} />
                          {breakdownLabel[b.category]}
                        </span>
                        <span className="font-mono font-semibold text-slate-800">{b.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card title="Recent activity">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-slate-500">No activity yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentActivity.slice(0, 6).map((a, i) => (
                    <li key={i} className="flex gap-2.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-700 leading-snug">{a.text}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{a.time}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>

        {/* Projects */}
        <Card
          title="My projects"
          action={
            <button onClick={() => setActiveTab('projects')} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer">
              All projects <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {myProjects.length === 0 ? (
            <EmptyState
              icon={<FolderKanban className="w-5 h-5" />}
              title="You are not in any project yet"
              body="Create a project, or ask a project owner to add you as a member."
              action={<PrimaryButton icon={<FolderPlus className="w-3.5 h-3.5" />} onClick={() => setIsCreateProjectModalOpen(true)}>Create project</PrimaryButton>}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {myProjects.map(project => {
                const projectIssues = issues.filter(i => i.projectId === project.id);
                const done = projectIssues.filter(isDone).length;
                const percent = projectIssues.length > 0 ? Math.round((done / projectIssues.length) * 100) : 0;
                const members = getProjectMembers(project);
                const role = myRoleIn(project);
                const openBlockers = projectIssues.filter(i => i.priority === 'blocker' && !isDone(i)).length;
                return (
                  <button
                    key={project.id}
                    onClick={() => openProject(project)}
                    className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs bg-white transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${project.iconGradient} text-white font-mono font-bold text-[11px] flex items-center justify-center shrink-0`}>
                        {project.key}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-slate-900 truncate">{project.name}</div>
                        <div className="flex items-center gap-1.5 mt-1">
                          {role && <RoleBadge role={role} />}
                          <span className="text-[10px] text-slate-500">{project.template}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                        <span>{done} of {projectIssues.length} done</span>
                        <span className="font-mono font-semibold text-slate-700">{percent}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex -space-x-1.5">
                        {members.slice(0, 5).map(({ user }) => (
                          <Avatar key={user.id} name={user.name} src={user.avatar} size="xs" className="ring-2 ring-white" />
                        ))}
                        {members.length > 5 && (
                          <span className="w-5 h-5 rounded-full bg-slate-100 ring-2 ring-white text-[8px] font-semibold text-slate-600 flex items-center justify-center">+{members.length - 5}</span>
                        )}
                      </div>
                      {openBlockers > 0 && (
                        <span className="text-[10px] font-semibold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {openBlockers} blocker{openBlockers === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
