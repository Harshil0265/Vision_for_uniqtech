import React from 'react';
import { useProject } from '../context/ProjectContext';
import { WorkItemIcon } from './WorkItemIcon';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const { issues, sprints, activeProject, activeSprint, teamMembers } = useProject();

  const projectIssues = issues.filter(i => i.projectId === activeProject.id);
  const projectSprints = sprints.filter(s => s.projectId === activeProject.id);

  // Active Sprint metrics
  const activeSprintIssues = projectIssues.filter(i => i.sprintId === activeSprint?.id);
  const totalSprintPoints = activeSprintIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
  const completedSprintPoints = activeSprintIssues
    .filter(i => i.status === 'done')
    .reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);

  // Dynamic Type Distribution for active project
  const typeCounts = activeProject.allowedIssueTypes.reduce((acc, type) => {
    acc[type] = projectIssues.filter(i => i.type === type).length;
    return acc;
  }, {} as Record<string, number>);

  // Priority Distribution
  const priorityCounts = {
    blocker: projectIssues.filter(i => i.priority === 'blocker').length,
    high: projectIssues.filter(i => i.priority === 'high').length,
    medium: projectIssues.filter(i => i.priority === 'medium').length,
    low: projectIssues.filter(i => i.priority === 'low' || i.priority === 'lowest').length
  };

  // Team Member Workload
  const memberWorkload = teamMembers.map(member => {
    const assigned = projectIssues.filter(i => i.assignee?.id === member.id && i.status !== 'done');
    const points = assigned.reduce((sum, i) => sum + (i.storyPoints || 0), 0);
    return {
      member,
      issueCount: assigned.length,
      points
    };
  });

  // Burndown simulation points for active sprint
  const burndownDays = [
    { day: 'Day 1', ideal: totalSprintPoints || 30, actual: totalSprintPoints || 30 },
    { day: 'Day 3', ideal: Math.round((totalSprintPoints || 30) * 0.8), actual: Math.round((totalSprintPoints || 30) * 0.9) },
    { day: 'Day 5', ideal: Math.round((totalSprintPoints || 30) * 0.6), actual: Math.round((totalSprintPoints || 30) * 0.75) },
    { day: 'Day 7', ideal: Math.round((totalSprintPoints || 30) * 0.4), actual: Math.round((totalSprintPoints || 30) * 0.6) },
    { day: 'Day 9', ideal: Math.round((totalSprintPoints || 30) * 0.2), actual: Math.round((totalSprintPoints || 30) * 0.4) },
    { day: 'Day 10 (Target)', ideal: 0, actual: Math.max(0, totalSprintPoints - completedSprintPoints) }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-y-auto p-6 space-y-6">
      {/* Top Header */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          <span>Sprint Analytics & Velocity Dashboard ({activeProject.key})</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Real-time metrics, burndown projections, capacity allocation, and quality health for {activeProject.name}.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Active Velocity */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Delivered Points</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {completedSprintPoints}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">/ {totalSprintPoints} SP</span>
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold pt-1">
            <TrendingUp className="w-3 h-3" />
            <span>
              {totalSprintPoints > 0 ? Math.round((completedSprintPoints / totalSprintPoints) * 100) : 0}% completion rate
            </span>
          </div>
        </div>

        {/* KPI 2: Cycle Time */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Avg Cycle Time</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            2.4 <span className="text-xs font-normal text-slate-500 font-sans">days</span>
          </div>
          <div className="text-[11px] text-blue-700 flex items-center gap-1 font-semibold pt-1">
            <span>Target on schedule (under 3.0 days)</span>
          </div>
        </div>

        {/* KPI 3: Blocker SLA */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Critical Blockers</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700">
            {priorityCounts.blocker}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">Active P0</span>
          </div>
          <div className="text-[11px] text-slate-600 pt-1">
            <span>Under active triage in {activeProject.key}</span>
          </div>
        </div>

        {/* KPI 4: Historical Velocity */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sprint Velocity</span>
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {projectSprints.length > 0 ? Math.round(projectIssues.reduce((sum, i) => sum + (i.storyPoints || 0), 0) / projectSprints.length) : 0}{' '}
            <span className="text-xs font-normal text-slate-500 font-sans">SP / sprint</span>
          </div>
          <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold pt-1">
            <span>Consistent delivery pace</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row: Burndown & Velocity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Burndown Chart */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">
                {activeSprint ? activeSprint.name : `${activeProject.key} Active Burndown`}
              </h3>
              <p className="text-[11px] text-slate-500">Remaining Story Points vs Ideal Guideline</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <span className="w-2.5 h-0.5 bg-slate-300 rounded"></span> Ideal
              </span>
              <span className="flex items-center gap-1 text-blue-700 font-medium">
                <span className="w-2.5 h-1.5 bg-blue-600 rounded"></span> Actual
              </span>
            </div>
          </div>

          {/* Burndown Bar Grid */}
          <div className="h-52 flex items-end justify-between gap-4 pt-6 px-2 border-b border-slate-200">
            {burndownDays.map((item, idx) => {
              const maxVal = Math.max(35, totalSprintPoints || 30);
              const actualH = (item.actual / maxVal) * 100;
              const idealH = (item.ideal / maxVal) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1.5 h-40">
                    {/* Ideal guideline bar */}
                    <div
                      className="w-2 bg-slate-200 rounded-t"
                      style={{ height: `${idealH}%` }}
                      title={`Ideal: ${item.ideal} SP`}
                    />
                    {/* Actual remaining bar with gradient */}
                    <div
                      className="w-4 bg-gradient-to-t from-blue-600 to-sky-400 rounded-t relative group shadow-2xs"
                      style={{ height: `${actualH}%` }}
                      title={`Actual: ${item.actual} SP remaining`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-slate-900 text-white px-1 rounded z-10 transition-opacity">
                        {item.actual}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-600 whitespace-nowrap">{item.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Velocity History Chart */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Sprint Commitments & Velocity</h3>
              <p className="text-[11px] text-slate-500">Planned vs Delivered story points</p>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 bg-slate-200 rounded"></span> Planned
              </span>
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Delivered
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end justify-around gap-6 pt-6 px-4 border-b border-slate-200">
            {projectSprints.length === 0 ? (
              <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                No sprint history available for this project.
              </div>
            ) : (
              projectSprints.map(s => {
                const maxSP = 40;
                const plannedH = ((s.plannedPoints || 20) / maxSP) * 100;
                const completedH = ((s.completedPoints || 0) / maxSP) * 100;

                return (
                  <div key={s.id} className="flex flex-col items-center gap-2 h-full justify-end">
                    <div className="flex items-end gap-2 h-40">
                      <div
                        className="w-6 bg-slate-200 rounded-t"
                        style={{ height: `${plannedH}%` }}
                        title={`Planned: ${s.plannedPoints} SP`}
                      />
                      <div
                        className="w-6 bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t shadow-2xs"
                        style={{ height: `${completedH}%` }}
                        title={`Delivered: ${s.completedPoints} SP`}
                      />
                    </div>
                    <span className="text-[10px] font-medium text-slate-700 max-w-[80px] truncate text-center">
                      {s.name.split(':')[0]}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Secondary Row: Workload Capacity & Issue Type / Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Workload & Allocation */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold text-slate-900">Team Capacity & Workload Allocation</h3>
              <p className="text-[11px] text-slate-500">Active assigned Story Points in {activeProject.name}</p>
            </div>
            <Users className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5">
            {memberWorkload.map(({ member, issueCount, points }) => {
              const maxLoad = 20;
              const widthPercent = Math.min(100, Math.round((points / maxLoad) * 100));
              const isOverallocated = points > 14;

              return (
                <div key={member.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                      />
                      <span className="text-slate-800 font-semibold">{member.name}</span>
                      <span className="text-[10px] text-slate-500">({member.role})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">{issueCount} active issues</span>
                      <span
                        className={`font-mono text-xs font-bold ${
                          isOverallocated ? 'text-amber-700' : 'text-slate-700'
                        }`}
                      >
                        {points} SP
                      </span>
                    </div>
                  </div>

                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverallocated
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                      }`}
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Issue Type & Priority Breakdown */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Task Types Catalog ({activeProject.key})</h3>
            <p className="text-[11px] text-slate-500">Distribution across configured work item types</p>
          </div>

          <div className="space-y-2.5 pt-2">
            {activeProject.allowedIssueTypes.map(t => {
              const count = typeCounts[t] || 0;
              return (
                <div key={t} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-slate-700 font-medium capitalize">
                    <WorkItemIcon type={t} className="w-3.5 h-3.5" />
                    <span>{t}</span>
                  </span>
                  <span className="font-mono text-slate-900 font-bold">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="text-[11px] font-semibold text-slate-600">Priority Health</div>
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-100">
              <div
                style={{ width: `${projectIssues.length > 0 ? (priorityCounts.blocker / projectIssues.length) * 100 : 0}%` }}
                className="bg-red-500"
                title={`Blocker: ${priorityCounts.blocker}`}
              />
              <div
                style={{ width: `${projectIssues.length > 0 ? (priorityCounts.high / projectIssues.length) * 100 : 0}%` }}
                className="bg-orange-500"
                title={`High: ${priorityCounts.high}`}
              />
              <div
                style={{ width: `${projectIssues.length > 0 ? (priorityCounts.medium / projectIssues.length) * 100 : 0}%` }}
                className="bg-amber-400"
                title={`Medium: ${priorityCounts.medium}`}
              />
              <div
                style={{ width: `${projectIssues.length > 0 ? (priorityCounts.low / projectIssues.length) * 100 : 0}%` }}
                className="bg-sky-400"
                title={`Low: ${priorityCounts.low}`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
