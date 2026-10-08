import React from 'react';
import { useProject } from '../context/ProjectContext';
import { ShieldCheck } from 'lucide-react';

export const TeamView: React.FC = () => {
  const { teamMembers, issues, switchUser, currentUser } = useProject();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-y-auto p-6 space-y-6">
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Team Directory & RBAC Profiles</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Engineering roles, real-time presence indicators, and capacity allocations.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teamMembers.map(member => {
          const assignedIssues = issues.filter(i => i.assignee?.id === member.id && i.status !== 'done');
          const totalPoints = assignedIssues.reduce((acc, curr) => acc + (curr.storyPoints || 0), 0);
          const isCurrent = currentUser.id === member.id;

          return (
            <div
              key={member.id}
              className={`p-5 rounded-xl bg-white border transition-all space-y-4 shadow-2xs ${
                isCurrent ? 'border-blue-500 bg-blue-50/15 ring-1 ring-blue-500/20' : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <span
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
                        member.status === 'online'
                          ? 'bg-emerald-500'
                          : member.status === 'busy'
                          ? 'bg-amber-500'
                          : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{member.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{member.role}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{member.email}</div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] text-slate-500">Assigned Tasks</div>
                  <div className="font-mono text-sm font-bold text-slate-800 mt-0.5">
                    {assignedIssues.length} items
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
                  <div className="text-[10px] text-slate-500">Story Points</div>
                  <div className="font-mono text-sm font-bold text-blue-700 mt-0.5">
                    {totalPoints} SP
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => switchUser(member)}
                  disabled={isCurrent}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isCurrent ? 'Current Session' : 'Switch to User (Clerk)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
