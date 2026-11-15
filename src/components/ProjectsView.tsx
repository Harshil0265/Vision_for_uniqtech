import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { Project } from '../types';
import { WorkItemIcon } from './WorkItemIcon';
import {
  FolderKanban,
  Plus,
  Search,
  User,
  ArrowRight,
  Trash2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Kanban
} from 'lucide-react';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    activeProject,
    setActiveProject,
    issues,
    sprints,
    setIsCreateProjectModalOpen,
    setActiveTab,
    deleteProject
  } = useProject();

  const [projectSearch, setProjectSearch] = useState('');

  const filteredProjects = projects.filter(p => {
    if (!projectSearch.trim()) return true;
    const q = projectSearch.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
  });

  const handleSelectProject = (project: Project) => {
    setActiveProject(project);
    setActiveTab('board');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-200 gap-3">
        <div>
          <h1 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-blue-600" />
            <span>Workspace Projects & Portfolios</span>
            <span className="text-xs font-mono text-slate-500 font-normal">({projects.length} projects)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise project directory with custom key schemas, task type schemes, and sprint pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search projects..."
              value={projectSearch}
              onChange={e => setProjectSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs"
            />
          </div>

          <button
            onClick={() => setIsCreateProjectModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map(proj => {
          const isActive = activeProject.id === proj.id;
          const projIssues = issues.filter(i => i.projectId === proj.id);
          const projSprints = sprints.filter(s => s.projectId === proj.id);
          const activeProjSprint = projSprints.find(s => s.status === 'active');
          const completedIssues = projIssues.filter(i => i.status === 'done').length;

          return (
            <div
              key={proj.id}
              className={`p-5 rounded-2xl bg-white border transition-all space-y-4 shadow-2xs flex flex-col justify-between ${
                isActive
                  ? 'border-blue-500 ring-2 ring-blue-500/10'
                  : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
              }`}
            >
              <div className="space-y-3">
                {/* Top: Icon & Key */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${proj.iconGradient} flex items-center justify-center text-white font-mono font-bold text-sm shadow-xs`}
                    >
                      {proj.key}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">{proj.name}</span>
                        {isActive && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 border border-blue-200 font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-slate-600 font-medium">Key: {proj.key}</span>
                        <span className="text-slate-300">·</span>
                        <span className="uppercase text-[10px] font-medium text-slate-500">{proj.template}</span>
                      </div>
                    </div>
                  </div>

                  {projects.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete project "${proj.name}" and all its issues?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {proj.description || 'No description provided.'}
                </p>

                {/* Work Item Types Configured */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Task Types Scheme
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {proj.allowedIssueTypes.map(t => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[10px] text-slate-700 font-medium capitalize"
                      >
                        <WorkItemIcon type={t} className="w-3 h-3" />
                        <span>{t}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] text-slate-400">Total Work Items</div>
                    <div className="font-mono text-xs font-bold text-slate-800 mt-0.5">{projIssues.length}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] text-slate-400">Completed</div>
                    <div className="font-mono text-xs font-bold text-emerald-700 mt-0.5">{completedIssues}</div>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80">
                    <div className="text-[10px] text-slate-400">Sprints</div>
                    <div className="font-mono text-xs font-bold text-blue-700 mt-0.5">{projSprints.length}</div>
                  </div>
                </div>
              </div>

              {/* Footer: Lead & Switch Action */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={proj.lead.avatar}
                    alt={proj.lead.name}
                    className="w-5 h-5 rounded-full object-cover ring-1 ring-slate-200"
                  />
                  <div className="text-[11px] text-slate-600 truncate max-w-[120px]">
                    Lead: <span className="font-medium text-slate-800">{proj.lead.name.split(' ')[0]}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectProject(proj)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <span>{isActive ? 'View Board' : 'Switch Project'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
