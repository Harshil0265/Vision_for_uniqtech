import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { WorkItemType } from '../types';
import { WorkItemIcon } from './WorkItemIcon';
import {
  X,
  FolderPlus,
  Layers,
  Kanban,
  Bug,
  Check
} from 'lucide-react';

export const CreateProjectModal: React.FC = () => {
  const {
    isCreateProjectModalOpen,
    setIsCreateProjectModalOpen,
    createProject,
    teamMembers,
    currentUser,
    setActiveTab
  } = useProject();

  if (!isCreateProjectModalOpen) return null;

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [isKeyManuallyEdited, setIsKeyManuallyEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [leadId, setLeadId] = useState<string>(currentUser.id);
  const [template, setTemplate] = useState<'Scrum' | 'Kanban' | 'Bug Tracking'>('Scrum');
  const [defaultAssignee, setDefaultAssignee] = useState<'unassigned' | 'lead'>('unassigned');
  const [iconGradient, setIconGradient] = useState('from-blue-600 via-indigo-600 to-sky-500');

  // Allowed issue types selection
  const [selectedTypes, setSelectedTypes] = useState<WorkItemType[]>([
    'epic',
    'story',
    'task',
    'bug',
    'spike'
  ]);

  const allAvailableTypes: { type: WorkItemType; label: string; desc: string }[] = [
    { type: 'epic', label: 'Epic', desc: 'Large strategic initiative spanning multiple sprints' },
    { type: 'story', label: 'User Story', desc: 'Customer or user deliverable with acceptance criteria' },
    { type: 'task', label: 'Technical Task', desc: 'Engineering implementation activity' },
    { type: 'bug', label: 'Bug / Defect', desc: 'Impairment, regression, or functional error' },
    { type: 'spike', label: 'Research Spike', desc: 'Time-boxed technical feasibility investigation or PoC' },
    { type: 'subtask', label: 'Subtask', desc: 'Decomposed child unit of a larger story or task' },
    { type: 'incident', label: 'Production Incident', desc: 'Critical operational disruption or security alert' }
  ];

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isKeyManuallyEdited) {
      // Auto-generate key from name initials (e.g. "Data Streaming Pipeline" -> "DSP")
      const words = val.trim().split(/\s+/).filter(Boolean);
      let suggested = '';
      if (words.length >= 2) {
        suggested = words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
      } else if (words.length === 1) {
        suggested = words[0].slice(0, 3).toUpperCase();
      }
      setKey(suggested);
    }
  };

  const toggleType = (t: WorkItemType) => {
    if (selectedTypes.includes(t)) {
      if (selectedTypes.length <= 1) return; // Keep at least one
      setSelectedTypes(prev => prev.filter(item => item !== t));
    } else {
      setSelectedTypes(prev => [...prev, t]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !key.trim()) return;

    const lead = teamMembers.find(m => m.id === leadId) || currentUser;

    createProject({
      name: name.trim(),
      key: key.trim().toUpperCase(),
      description: description.trim(),
      lead,
      template,
      allowedIssueTypes: selectedTypes,
      defaultAssignee,
      iconGradient
    });

    setIsCreateProjectModalOpen(false);
    setActiveTab('board');
  };

  const gradientOptions = [
    { id: 'blue', class: 'from-blue-600 via-indigo-600 to-sky-500', label: 'Ocean Blue' },
    { id: 'emerald', class: 'from-emerald-600 via-teal-600 to-cyan-500', label: 'Emerald' },
    { id: 'purple', class: 'from-purple-600 via-violet-600 to-indigo-500', label: 'Purple' },
    { id: 'amber', class: 'from-amber-600 via-orange-600 to-rose-500', label: 'Amber' },
    { id: 'rose', class: 'from-rose-600 via-pink-600 to-purple-500', label: 'Rose' },
    { id: 'slate', class: 'from-slate-700 via-slate-800 to-zinc-900', label: 'Slate' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-2xs">
              <FolderPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Create New Project</h3>
              <p className="text-[11px] text-slate-500">Configure workspace parameters, key schema, and task type catalog</p>
            </div>
          </div>
          <button
            onClick={() => setIsCreateProjectModalOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Project Name & Key */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Payment Gateway & Checkout Engine"
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Key <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. PG"
                value={key}
                onChange={e => {
                  setIsKeyManuallyEdited(true);
                  setKey(e.target.value.toUpperCase());
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3.5 py-2 text-xs text-slate-900 font-mono font-bold uppercase placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Prefix: {key || 'PROJ'}-101</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Primary technical scope, architecture domains, and team responsibilities..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
            />
          </div>

          {/* Project Template & Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Methodology Template
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'Scrum', label: 'Scrum', icon: <Layers className="w-3.5 h-3.5 text-blue-600" />, desc: 'Iterative sprints, backlogs & story points' },
                  { id: 'Kanban', label: 'Kanban', icon: <Kanban className="w-3.5 h-3.5 text-amber-600" />, desc: 'Continuous flow with strict WIP capacity' },
                  { id: 'Bug Tracking', label: 'Bug Tracking', icon: <Bug className="w-3.5 h-3.5 text-rose-600" />, desc: 'Defect intake, escalation & triage' }
                ].map(item => (
                  <label
                    key={item.id}
                    onClick={() => setTemplate(item.id as any)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      template === item.id
                        ? 'bg-blue-50/70 border-blue-400 text-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="mt-0.5">{item.icon}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{item.label}</div>
                      <div className="text-[10px] text-slate-500">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Lead
              </label>
              <select
                value={leadId}
                onChange={e => setLeadId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white mb-3"
              >
                {teamMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>

              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Project Color Palette
              </label>
              <div className="grid grid-cols-6 gap-2">
                {gradientOptions.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setIconGradient(g.class)}
                    className={`h-7 rounded-lg bg-gradient-to-tr ${g.class} transition-all cursor-pointer ${
                      iconGradient === g.class ? 'ring-2 ring-slate-900 scale-105' : 'opacity-80 hover:opacity-100'
                    }`}
                    title={g.label}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Professional Issue Types Scheme (Jira style) */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-xs font-semibold text-slate-800">
                  Allowed Work Item Types Scheme
                </label>
                <span className="text-[11px] text-slate-500">
                  Select which task types team members can create in this project
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                {selectedTypes.length} types enabled
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
              {allAvailableTypes.map(({ type, label, desc }) => {
                const isChecked = selectedTypes.includes(type);
                return (
                  <div
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-blue-50/50 border-blue-400 text-slate-900 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/60'
                    }`}
                  >
                    <div className="mt-0.5">
                      <WorkItemIcon type={type} className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{label}</span>
                        {isChecked && <Check className="w-3 h-3 text-blue-600" />}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateProjectModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
